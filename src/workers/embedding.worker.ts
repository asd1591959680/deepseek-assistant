// src/workers/embedding.worker.ts
import { pipeline, env, Tensor } from "@xenova/transformers";

// 1. 显式定义特征提取 Pipeline 的类型签名，规避 TS 的复杂联合类型
type CustomFeatureExtractionPipeline = (
  texts: string | string[],
  options?: {
    pooling?: "none" | "mean" | "cls";
    normalize?: boolean;
  },
) => Promise<Tensor>;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// 使用我们自定义的类型
let pipe: CustomFeatureExtractionPipeline | null = null;

// ============================================================
// 消息类型定义
// ============================================================
type WorkerInMessage =
  | { type: "init" }
  | { type: "embed"; id: string; texts: string | string[] };

type WorkerOutMessage =
  | { type: "progress"; progress: number; message: string }
  | { type: "init:done" }
  | { type: "init:error"; message: string }
  | { type: "embed:done"; id: string; vectors: number[][] }
  | { type: "embed:error"; id: string; message: string };

// ============================================================
// 初始化模型
// ============================================================
async function initModel() {
  env.allowLocalModels = true;
  env.localModelPath = "/models";

  try {
    const rawPipe = await pipeline("feature-extraction", MODEL_ID, {
      progress_callback: (p: { progress?: number; status?: string }) => {
        if (p.progress !== undefined) {
          const msg: WorkerOutMessage = {
            type: "progress",
            progress: Math.round(p.progress),
            message: `加载模型文件中... ${Math.round(p.progress)}%`,
          };
          self.postMessage(msg);
        }
      },
    });

    // 通过 unknown 中转，强制断言为我们精简的专用类型
    pipe = rawPipe as unknown as CustomFeatureExtractionPipeline;

    self.postMessage({ type: "init:done" } satisfies WorkerOutMessage);
  } catch (e) {
    self.postMessage({
      type: "init:error",
      message: (e as Error).message,
    } satisfies WorkerOutMessage);
  }
}

// ============================================================
// 执行嵌入
// ============================================================
async function embed(id: string, texts: string | string[]) {
  if (!pipe) {
    self.postMessage({
      type: "embed:error",
      id,
      message: "模型尚未初始化",
    } satisfies WorkerOutMessage);
    return;
  }

  try {
    // 此时 output 被推导为 Tensor 类型
    const output = await pipe(texts, {
      pooling: "mean",
      normalize: true,
    });

    const inputTexts = Array.isArray(texts) ? texts : [texts];

    // 显式断言 dims 存在（Tensor 必定有 dims 属性）
    const dims = output.dims; // 例如 [1, 384] 或 [2, 384]
    const dim = dims[dims.length - 1];
    const vectors: number[][] = [];

    // 显式断言 data 为 Float32Array
    const data = output.data as Float32Array;

    for (let i = 0; i < inputTexts.length; i++) {
      const start = i * dim;
      const end = (i + 1) * dim;

      // 使用 subarray 避免内存拷贝，提高性能
      const slice = data.subarray(start, end);
      vectors.push(Array.from(slice));
    }

    self.postMessage({
      type: "embed:done",
      id,
      vectors,
    } satisfies WorkerOutMessage);
  } catch (e) {
    self.postMessage({
      type: "embed:error",
      id,
      message: (e as Error).message,
    } satisfies WorkerOutMessage);
  }
}

// ============================================================
// 消息路由
// ============================================================
self.addEventListener("message", (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case "init":
      initModel();
      break;
    case "embed":
      embed(msg.id, msg.texts);
      break;
  }
});
