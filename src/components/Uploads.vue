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
        <el-icon color="#fff" :size="32"><Upload /></el-icon>
      </div>
      <!-- <p class="drop-text">
        <span v-if="store.isProcessing">{{ store.processingMessage }}</span>
        <span v-else>拖拽或点击上传文档</span>
      </p> -->
      <!-- <p class="drop-formats font-mono">TXT · MD · PDF · DOCX</p> -->
    </div>

    <!-- 状态栏 -->
    <!-- <div class="stats-bar font-mono">
      <span>{{ store.totalChunks }} chunks</span>
      <span class="stat-sep">·</span>
      <span>top-{{ store.topK }} 检索</span>
      <div class="top-k-ctrl">
        <button @click="store.topK = Math.max(1, store.topK - 1)">−</button>
        <button @click="store.topK = Math.min(20, store.topK + 1)">+</button>
      </div>
    </div> -->
  </div>
</template>

<style scoped>
.doc-upload {
  display: flex;
  flex-direction: column;

  height: 100%;
}

.drop-zone {
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 5px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
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
  /* margin: 0 auto 10px; */
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
</style>
