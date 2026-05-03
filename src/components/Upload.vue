<script setup lang="ts">
import { ref } from "vue";
import { useRagStore } from "@/store";

const store = useRagStore();
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const triggerFileInput = () => {
  if (!store.isProcessing) fileInput.value?.click();
};

const onFileChange = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? []);
  await processFiles(files);
  if (fileInput.value) fileInput.value.value = "";
};

const onDrop = async (e: DragEvent) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []);
  await processFiles(files);
};

const processFiles = async (files: File[]) => {
  for (const file of files) {
    await store.addDocument(file);
  }
};
// 文件后缀
const getExt = (name: string) => {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
};
// 文件名字符串截断
const truncate = (s: string, n: number) => {
  return s.length > n ? s.slice(0, n - 3) + "..." : s;
};
// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / 1024 / 1024).toFixed(1) + "MB";
};
</script>
<template>
  <div class="doc-upload">
    <!-- 上传 -->
    <div
      class="drop-zone"
      :class="{ dragging: isDragging, busy: store.isProcessing }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".txt,.md,.pdf,.docx"
        class="hidden-input"
        @change="onFileChange"
      />
      <div class="drop-icon">
        <el-icon size="36"><DocumentAdd /></el-icon>
      </div>
      <p class="drop-text">
        <span v-if="store.isProcessing">{{ store.processingMessage }}</span>
        <span v-else>拖拽或点击上传文档</span>
      </p>
      <p class="drop-formats font-mono">TXT · MD · PDF · DOCX</p>
    </div>

    <!-- 状态栏 -->
    <div class="stats-bar font-mono">
      <span>{{ store.totalChunks }} chunks</span>
      <span class="stat-sep">·</span>
      <span>top-{{ store.topK }} 检索</span>
      <div class="top-k-ctrl">
        <button @click="store.topK = Math.max(1, store.topK - 1)">−</button>
        <button @click="store.topK = Math.min(20, store.topK + 1)">+</button>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="doc-list">
      <TransitionGroup name="doc-item">
        <div
          v-for="doc in store.documents"
          :key="doc.id"
          class="doc-item"
          :class="doc.status"
        >
          <div class="doc-icon">
            <span class="font-mono">{{ getExt(doc.name) }}</span>
          </div>
          <div class="doc-info">
            <div class="doc-name">{{ truncate(doc.name, 28) }}</div>
            <div class="doc-meta font-mono">
              <span v-if="doc.status === 'ready'" class="ready">
                ✓ {{ doc.chunks }} chunks · {{ formatSize(doc.size) }}
              </span>
              <span v-else-if="doc.status === 'processing'" class="processing">
                ⟳ 处理中...
              </span>
              <span v-else class="error" :title="doc.errorMsg">
                ✗ {{ doc.errorMsg }}
              </span>
            </div>
          </div>
          <button
            class="doc-remove"
            @click="store.removeDocument(doc.id)"
            title="删除"
          >
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </TransitionGroup>

      <div v-if="store.documents.length === 0" class="empty-state font-mono">
        [ 知识库为空 ]
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.drop-zone {
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #0f0f18;
}

.drop-zone:hover:not(.busy) {
  border-color: #60d2ff;
  background: rgba(96, 210, 255, 0.03);
  box-shadow: 0 0 20px rgba(96, 210, 255, 0.15);
}

.drop-zone.dragging {
  border-color: #60d2ff;
  background: rgba(96, 210, 255, 0.06);
  box-shadow: 0 0 20px rgba(96, 210, 255, 0.15);
}

.drop-zone.busy {
  cursor: wait;
  opacity: 0.7;
}

.hidden-input {
  display: none;
}

.drop-icon {
  width: 32px;
  height: 32px;
  margin: 0 auto 10px;
  color: #55556a;
}

.drop-icon svg {
  width: 100%;
  height: 100%;
}

.drop-text {
  font-size: 13px;
  color: #8888aa;
  margin-bottom: 4px;
}

.drop-formats {
  font-size: 10px;
  color: #55556a;
  letter-spacing: 0.1em;
}

/* Stats bar */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #55556a;
  padding: 0 2px;
}

.stat-sep {
  color: rgba(255, 255, 255, 0.12);
}

.top-k-ctrl {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.top-k-ctrl button {
  background: #161622;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #8888aa;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-k-ctrl button:hover {
  border-color: #60d2ff;
  color: #60d2ff;
}

/* Doc list */
.doc-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #161622;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s;
}

.doc-item:hover {
  border-color: rgba(255, 255, 255, 0.12);
}
.doc-item.error {
  border-color: rgba(248, 113, 113, 0.2);
}

.doc-icon {
  width: 34px;
  height: 34px;
  background: #161622;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 8px;
  color: #60d2ff;
  letter-spacing: 0.05em;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.doc-meta {
  font-size: 10px;
}
.doc-meta .ready {
  color: #4ade80;
}
.doc-meta .processing {
  color: #fbbf24;
}
.doc-meta .error {
  color: #f87171;
}

.doc-remove {
  background: none;
  border: none;
  color: #55556a;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.doc-remove:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

.empty-state {
  text-align: center;
  color: #55556a;
  font-size: 11px;
  padding: 24px 0;
}

/* List transitions */
.doc-item-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.doc-item-leave-active {
  transition: all 0.2s;
}
.doc-item-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.doc-item-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
