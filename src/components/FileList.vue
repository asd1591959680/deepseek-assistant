<script setup lang="ts">
import { useRagStore } from "@/store";
const store = useRagStore();

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
  <div>
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
                ✓ {{ formatSize(doc.size) }}
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

      <!-- <div v-if="store.documents.length === 0" class="empty-state font-mono">
        [ 知识库为空 ]
      </div> -->
    </div>
  </div>
</template>

<style scoped>
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
  gap: 6px;
  min-height: 0;
}

.doc-item {
  width: 12rem;
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
