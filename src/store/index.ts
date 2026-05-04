import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import {
  create as createDB,
  // insert,
  search,
  insertMultiple,
} from "@orama/orama";
import type { Orama, Schema } from "@orama/orama";
import type {
  KnowledgeDocument,
  DocumentChunk,
  ChatMessage,
  RetrievedChunk,
  LLMConfig,
} from "@/types";
import { useEmbedding } from "@/hooks/useEmbedding";
import { splitTextIntoChunks, extractTextFromFile } from "@/utils/textSplitter";
import { ElMessage } from "element-plus";
const RAG_SYSTEM_PROMPT = `你是一个专业的知识库助手。请基于以下检索到的上下文内容来回答用户的问题。
如果上下文中没有相关信息，请诚实地告知用户，不要编造答案。
回答时请引用具体的文档内容，并保持简洁专业。

上下文内容：
{context}`;

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "openai",
  endpoint: "https://api.deepseek.com/chat/completions",
  apiKey: "",
  model: "deepseek-v4-flash",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: RAG_SYSTEM_PROMPT,
};

// 这是Orama数据库的Schema，定义了每个文档块的存储结构
const chunkSchema = {
  id: "string",
  content: "string", // 文本内容
  docId: "string", // 所属文档ID
  docName: "string", // 文档名
  chunkIndex: "number", // 在文档中的块索引
  embedding: "vector[384]", // 384维向量，用于语义搜索
} satisfies Schema<any>;

export const useRagStore = defineStore("rag", () => {
  //embed：单文本向量化;embedBatch：批量向量化（带进度回调）;initPipeline：初始化嵌入模型
  const {
    embed,
    embedBatch,
    initPipeline,
    progress: embeddingProgress,
  } = useEmbedding();

  // State
  const documents = ref<KnowledgeDocument[]>([]); // 文档列表
  const chunks = ref<Map<string, DocumentChunk>>(new Map()); // 块映射表
  const messages = ref<ChatMessage[]>([]);
  const llmConfig = ref<LLMConfig>({ ...DEFAULT_LLM_CONFIG });
  const isProcessing = ref(false);
  const isAnswering = ref(false);
  const processingMessage = ref("");
  const topK = ref(5);
  const isKnow = ref(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: Orama<any> | null = null; // Orama数据库实例

  // Computed
  const totalChunks = computed(() => chunks.value.size);
  const readyDocs = computed(() =>
    documents.value.filter((d) => d.status === "ready"),
  );

  async function ensureDB() {
    if (!db) {
      // 首次使用时创建Orama数据库实例，并缓存在闭包变量db中
      db = await createDB({ schema: chunkSchema });
    }
    return db;
  }

  //文档处理流程 - 添加文档，提取文本，切分成块，向量化，存储到Orama数据库
  async function addDocument(file: File) {
    const docId = crypto.randomUUID();
    //  创建文档记录，状态设为"processing"
    const doc: KnowledgeDocument = {
      id: docId,
      name: file.name,
      type: file.type || file.name.split(".").pop() || "unknown",
      size: file.size,
      chunks: 0,
      createdAt: new Date(),
      status: "processing",
    };
    const docObject = reactive(doc);
    documents.value.push(docObject);
    isProcessing.value = true;
    try {
      // // 初始化嵌入模型
      processingMessage.value = "正在初始化嵌入模型请稍等...";
      await initPipeline();
      // 提取文本
      processingMessage.value = `正在解析文档：${file.name},请稍等...`;
      const rawText = await extractTextFromFile(file);
      ElMessage.warning(processingMessage.value);
      if (!rawText.trim()) throw new Error("文档内容为空");

      // 切分文本块
      processingMessage.value = "正在切分文档...";
      const textChunks = splitTextIntoChunks(rawText, 512, 64);
      docObject.chunks = textChunks.length;

      const database = await ensureDB();
      // 批量向量化文本块，提供进度回调更新UI
      const embeddings = await embedBatch(textChunks, (i, total) => {
        processingMessage.value = `正在向量化 (${i}/${total})...`;
      });

      processingMessage.value = "正在写入向量索引...";

      // 构建Orama文档块对象数组，准备写入数据库
      const oramaChunks = textChunks.map((content, idx) => ({
        id: `${docId}-${idx}`,
        content,
        docId,
        docName: file.name,
        chunkIndex: idx,
        embedding: embeddings[idx],
      }));
      // 写入Orama向量索引
      await insertMultiple(database, oramaChunks);

      // 同时将块数据存储在本地Map中，方便后续检索使用
      for (const c of oramaChunks) {
        chunks.value.set(c.id, c);
      }
      //更新状态为"ready"
      docObject.status = "ready";
      docObject.chunks = textChunks.length;
    } catch (e) {
      docObject.status = "error";
      docObject.errorMsg = (e as Error).message;
    } finally {
      isProcessing.value = false;
      processingMessage.value = "";
    }
  }

  // 文档删除流程 - 从本地状态和Orama数据库中移除文档及其相关块
  async function removeDocument(docId: string) {
    // 从Map中移除相关块
    for (const [key] of chunks.value) {
      if (key.startsWith(docId)) {
        chunks.value.delete(key);
      }
    }
    // 从文档列表中移除文档记录
    const idx = documents.value.findIndex((d) => d.id === docId);
    if (idx !== -1) documents.value.splice(idx, 1);

    // 重建整个数据库（Orama不支持直接删除）
    db = null;
    const database = await ensureDB();
    const remaining = Array.from(chunks.value.values());
    if (remaining.length > 0) {
      await insertMultiple(
        database,
        remaining as Parameters<typeof insertMultiple>[1],
      );
    }
  }

  // 混合检索 - 对用户查询进行向量化，并在Orama数据库中执行混合搜索，返回相关文档块
  async function retrieve(query: string): Promise<RetrievedChunk[]> {
    const database = await ensureDB(); // 查询向量化
    if (chunks.value.size === 0) return [];
    const queryEmbedding = await embed(query);

    const results = await search(database, {
      mode: "hybrid", // 混合搜索（关键词+语义）
      term: query, // 关键词搜索
      vector: {
        value: queryEmbedding,
        property: "embedding",
      },
      similarity: 0.3, // 相似度阈值
      limit: topK.value, // 返回Top-K结果
      includeVectors: false,
    });
    return results.hits.map((hit) => ({
      id: hit.document.id as string,
      content: hit.document.content as string,
      docName: hit.document.docName as string,
      score: hit.score,
    }));
  }

  function clearHistory() {
    messages.value = [];
  }

  return {
    documents,
    chunks,
    messages,
    llmConfig,
    isProcessing,
    isAnswering,
    processingMessage,
    embeddingProgress,
    topK,
    totalChunks,
    readyDocs,
    addDocument,
    removeDocument,
    retrieve,
    clearHistory,
    isKnow,
  };
});
