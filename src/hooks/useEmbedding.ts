import { ref, readonly } from "vue";
import type { EmbeddingProgress } from "@/types";

type FeatureExtractionPipeline = (
  texts: string | string[],
  opts?: Record<string, unknown>,
) => Promise<{ data: Float32Array | number[] }>;

let pipeline: FeatureExtractionPipeline | null = null;

const progress = ref<EmbeddingProgress>({
  status: "idle",
  progress: 0,
  message: "尚未初始化",
});

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

export function useEmbedding() {
  async function initPipeline() {
    if (pipeline) return;
    progress.value = {
      status: "loading",
      progress: 0,
      message: "正在加载嵌入模型...",
    };

    try {
      const { pipeline: createPipeline, env } =
        await import("@xenova/transformers");
      // ===== 关键配置：本地模型 =====
      env.allowLocalModels = true;
      // 重要：路径要以斜杠开头，结尾不带斜杠
      env.localModelPath = "/models";

      // env.allowLocalModels = false;
      // env.remoteHost = "http://localhost:5174/hf-api";

      const pipe = await createPipeline("feature-extraction", MODEL_ID, {
        progress_callback: (p: {
          progress?: number;
          status?: string;
          file?: string;
        }) => {
          if (p.progress !== undefined) {
            progress.value = {
              status: "loading",
              progress: Math.round(p.progress),
              message: `加载模型文件中... ${Math.round(p.progress)}%`,
            };
          }
        },
      });

      pipeline = async (
        texts: string | string[],
        opts?: Record<string, unknown>,
      ) => {
        const result = await pipe(texts, opts);
        return result as { data: Float32Array | number[] };
      };

      progress.value = {
        status: "ready",
        progress: 100,
        message: `模型已就绪：${MODEL_ID}`,
      };
    } catch (e) {
      console.error("完整错误:", e);
      progress.value = {
        status: "error",
        progress: 0,
        message: `模型加载失败: ${(e as Error).message}`,
      };
      throw e;
    }
  }

  async function embed(text: string): Promise<number[]> {
    if (!pipeline) await initPipeline();

    const output = await pipeline!(text, {
      pooling: "mean",
      normalize: true,
    });

    // output.data 的类型为 Float32Array
    return Array.from(output.data as Float32Array);
  }

  async function embedBatch(
    texts: string[],
    onProgress?: (i: number, total: number) => void,
  ): Promise<number[][]> {
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      results.push(await embed(texts[i]));
      onProgress?.(i + 1, texts.length);
    }
    return results;
  }

  return {
    progress: readonly(progress),
    initPipeline,
    embed,
    embedBatch,
  };
}
