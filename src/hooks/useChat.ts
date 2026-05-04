import { streamChat } from "../utils/deepseek";
import type {
  Message,
  Conversation,
  ChatSettings,
  RetrievedChunk,
} from "../types";
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
const SETTINGS_KEY = "dp-assist-settings";
const STORAGE_KEY = "dp-assist-conversations";
const RAG_SYSTEM_PROMPT = `你是一个专业的知识库助手。请基于以下检索到的上下文内容来回答用户的问题。
如果上下文中没有相关信息，请诚实地告知用户，不要编造答案。
回答时请引用具体的文档内容，并保持简洁专业。

上下文内容：
{context}`;
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function loadConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function loadSettings(): ChatSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    /* 忽略 */
  }
  return {
    apiKey: "",
    model: "deepseek-v4-flash",
    systemPrompt: "你是一个有用的AI助手。",
    temperature: 0.7,
  };
}
export function useChat() {
  //读取本地数据对话列表
  const conversations = ref<Conversation[]>(loadConversations());
  const currentId = ref<string>("");
  const errorMsg = ref("");
  const isLoading = ref(false);
  const abortController = ref<AbortController | null>(null);
  //读取本地数据设置
  const settings = ref<ChatSettings>(loadSettings());
  //监听对话列表变化，动态更新当前对话
  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentId.value),
  );
  //赋值当前对话的消息
  const currentMessages = computed(
    () => currentConversation.value?.messages || [],
  );

  // 持久化对话列表到本地存储
  watch(
    conversations,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    },
    { deep: true },
  );
  // 持久化设置到本地存储
  watch(
    settings,
    (val) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(val));
    },
    { deep: true },
  );
  // 新建对话
  function createConversation() {
    const conv: Conversation = {
      id: generateId(),
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // 将新对话添加到列表顶部
    conversations.value.unshift(conv);
    currentId.value = conv.id;
    return conv;
  }
  // 删除对话
  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (currentId.value === id) {
      currentId.value = conversations.value[0]?.id || "";
    }
  }
  // 切换对话
  function switchConversation(id: string) {
    currentId.value = id;
  }
  // 发送消息
  async function sendMessage(
    content: string,
    retrieved: RetrievedChunk[],
    totalChunks: number,
  ) {
    if (!content.trim()) return;
    // 确保有当前会话
    if (!currentConversation.value) createConversation();
    const conv = currentConversation.value!;
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };
    // 添加用户消息
    conv.messages.push(userMsg);
    // 用第一条用户消息作为标题
    if (conv.messages.filter((m) => m.role === "user").length === 1) {
      conv.title =
        content.trim().slice(0, 12) + (content.trim().length > 12 ? "..." : "");
    }
    // 助手消息占位
    const assistantMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      sources: retrieved,
    };
    conv.messages.push(assistantMsg);
    conv.updatedAt = Date.now();
    isLoading.value = true;
    abortController.value = new AbortController();
    const systemContent = ref("");
    if (totalChunks > 0) {
      systemContent.value = RAG_SYSTEM_PROMPT;
      const context =
        retrieved.length > 0
          ? retrieved
              .map((c, i) => `[${i + 1}] (来源: ${c.docName})\n${c.content}`)
              .join("\n\n---\n\n")
          : "（知识库中没有找到相关内容，将基于模型自身知识回答）";

      // 4. 替换系统提示词中的{context}占位符
      systemContent.value = systemContent.value.replace("{context}", context);
    } else {
      systemContent.value = settings.value.systemPrompt;
    }
    // 构建发送给 API 的消息列表
    const chatMessages = [
      ...(systemContent.value
        ? [{ role: "system" as const, content: systemContent.value }]
        : []),
      ...conv.messages
        .filter((m) => m.role !== "system" && m.id !== assistantMsg.id)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];
    await streamChat(
      chatMessages,
      settings.value.apiKey,
      {
        onChunk(text: string) {
          const msg = conv.messages.find((m) => m.id === assistantMsg.id);
          if (msg) msg.content += text;
        },
        onDone() {
          const msg = conv.messages.find((m) => m.id === assistantMsg.id);
          if (msg) msg.isStreaming = false;
          isLoading.value = false;
          abortController.value = null;
        },
        onError(error: Error) {
          const msg = conv.messages.find((m) => m.id === assistantMsg.id);
          if (msg) {
            msg.content = `请求出错: ${error.message}`;
            msg.isStreaming = false;
          }
          isLoading.value = false;
          abortController.value = null;
          errorMsg.value = error.message;
          ElMessage.error(errorMsg.value);
        },
      },
      settings.value.model,
      settings.value.temperature,
      // 通过 signal 可以取消请求,没有 signal 就无法取消请求
      abortController.value.signal,
    );
  }
  // 中断对话生成
  function stopGeneration() {
    // 如果存在异步请求，则中断它

    if (abortController.value) {
      abortController.value.abort();
      //.abort() 只能调用一次，重复调用会报错，所以调用后将其置空
      abortController.value = null;
    }
    isLoading.value = false;
    const conv = currentConversation.value;
    if (conv) {
      //找到当前对话中正在流式输出的那条消息
      const streaming = conv.messages.find((m) => m.isStreaming);
      //将其标记为 false，UI 会停止显示打字机效果/光标闪烁
      if (streaming) streaming.isStreaming = false;
    }
  }
  // 更新设置
  function updateSettings(newSettings: ChatSettings) {
    settings.value = { ...newSettings };
  }
  return {
    conversations,
    currentId,
    currentConversation,
    currentMessages,
    settings,
    isLoading,
    errorMsg,
    createConversation,
    deleteConversation,
    switchConversation,
    sendMessage,
    stopGeneration,
    updateSettings,
  };
}
