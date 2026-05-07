import { ref, readonly, shallowRef } from "vue";
import type { EmbeddingProgress } from "@/types";

// ============================================================
// 类型定义
// ============================================================
type WorkerOutMessage =
  | { type: "progress"; progress: number; message: string }
  | { type: "init:done" }
  | { type: "init:error"; message: string }
  | { type: "embed:progress"; id: string; current: number; total: number }
  | { type: "embed:done"; id: string; vectors: number[][] }
  | { type: "embed:error"; id: string; message: string };

type ProgressCallback = (current: number, total: number) => void;

type PendingTask = {
  resolve: (vectors: number[][]) => void;
  reject: (err: Error) => void;
  onProgress?: ProgressCallback;
};

// ============================================================
// 模块级单例
// ============================================================
const worker = shallowRef<Worker | null>(null);
const pendingTasks = new Map<string, PendingTask>();
let taskCounter = 0;

const progress = ref<EmbeddingProgress>({
  status: "idle",
  progress: 0,
  message: "尚未初始化",
});

let initPromise: Promise<void> | null = null;
let resolveInit: (() => void) | null = null;
let rejectInit: ((err: Error) => void) | null = null;

// ============================================================
// 创建 Worker
// ============================================================
function createWorker(): Worker {
  const w = new Worker(
    new URL("../workers/embedding.worker.ts", import.meta.url),
    { type: "module" },
  );

  w.addEventListener("message", (event: MessageEvent<WorkerOutMessage>) => {
    const msg = event.data;

    switch (msg.type) {
      case "progress":
        progress.value = {
          status: "loading",
          progress: msg.progress,
          message: msg.message,
        };
        break;

      case "init:done":
        progress.value = {
          status: "ready",
          progress: 100,
          message: "模型已就绪",
        };
        resolveInit?.();
        break;

      case "init:error":
        progress.value = {
          status: "error",
          progress: 0,
          message: `模型加载失败: ${msg.message}`,
        };
        rejectInit?.(new Error(msg.message));
        break;

      case "embed:progress": {
        const task = pendingTasks.get(msg.id);
        if (task?.onProgress) {
          task.onProgress(msg.current, msg.total);
        }
        break;
      }

      case "embed:done": {
        const task = pendingTasks.get(msg.id);
        if (task) {
          task.resolve(msg.vectors);
          pendingTasks.delete(msg.id);
        }
        break;
      }

      case "embed:error": {
        const task = pendingTasks.get(msg.id);
        if (task) {
          task.reject(new Error(msg.message));
          pendingTasks.delete(msg.id);
        }
        break;
      }
    }
  });

  w.addEventListener("error", (e) => {
    console.error("Worker 错误:", e);
    progress.value = {
      status: "error",
      progress: 0,
      message: `Worker 异常: ${e.message}`,
    };
  });

  return w;
}

// ============================================================
// Composable
// ============================================================
export function useEmbedding() {
  async function initPipeline(): Promise<void> {
    if (initPromise) return initPromise;

    initPromise = new Promise<void>((resolve, reject) => {
      resolveInit = resolve;
      rejectInit = reject;
    });

    progress.value = {
      status: "loading",
      progress: 0,
      message: "正在加载嵌入模型...",
    };

    if (!worker.value) {
      worker.value = createWorker();
    }

    worker.value.postMessage({ type: "init" });

    return initPromise;
  }

  async function embed(text: string): Promise<number[]> {
    const vectors = await embedBatch([text]);
    return vectors[0];
  }

  async function embedBatch(
    texts: string[],
    onProgress?: ProgressCallback,
  ): Promise<number[][]> {
    if (!worker.value) {
      throw new Error("请先调用 initPipeline()");
    }

    const id = `task_${++taskCounter}_${Date.now()}`;

    return new Promise<number[][]>((resolve, reject) => {
      pendingTasks.set(id, { resolve, reject, onProgress });

      worker.value!.postMessage({
        type: "embed",
        id,
        texts,
      });
    });
  }

  function terminate() {
    worker.value?.terminate();
    worker.value = null;
    initPromise = null;
    resolveInit = null;
    rejectInit = null;
    pendingTasks.clear();
    progress.value = { status: "idle", progress: 0, message: "尚未初始化" };
  }

  return {
    progress: readonly(progress),
    initPipeline,
    embed,
    embedBatch,
    terminate,
  };
}
