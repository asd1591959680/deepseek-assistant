<script setup lang="ts">
import { onMounted } from "vue";
import type { Conversation } from "@/types";
import { useRagStore } from "@/store";
import { useEmbedding } from "@/hooks/useEmbedding";
import Upload from "@/components/Upload.vue";
const prop = defineProps({
  list: {
    type: Array as () => Conversation[],
    default: [],
  },
});
const emit = defineEmits(["newMsg", "selectMsg", "deleteMsg"]);
const drawer = defineModel("drawer", {
  type: Boolean,
  default: false,
});
const rag = useRagStore();
const { initPipeline } = useEmbedding();

const handleClose = () => {
  console.log("before close");
  drawer.value = false;
};
onMounted(async () => {
  await initPipeline();
});
</script>
<template>
  <el-drawer
    v-model="drawer"
    title="知识库"
    size="40%"
    direction="ltr"
    :before-close="handleClose"
  >
    <div class="upload-wrap">
      <div class="embed-status" :class="rag.embeddingProgress.status">
        <div class="status-dot" />
        <span class="font-mono status-text">
          {{ rag.embeddingProgress.message }}
        </span>
        <div
          v-if="rag.embeddingProgress.status === 'loading'"
          class="progress-bar"
        >
          <div
            class="progress-fill"
            :style="{ width: rag.embeddingProgress.progress + '%' }"
          />
        </div>
      </div>
      <span v-if="rag.isProcessing">{{ rag.processingMessage }}</span>
      <Upload />
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
}
.new-chat-btn {
  width: 100%;
  border-radius: 4px;
}
.upload-wrap {
  :deep(.el-upload) {
    width: 100%;
  }
}

.embed-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: #1c1c2e;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
  margin-bottom: 10px;
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #55556a;
  }
  .status-text {
    font-size: 10px;
    color: #8888aa;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .progress-bar {
    width: 100%;
    height: 2px;
    background: #09090e;
    border-radius: 1px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #f0b429;
    transition: width 0.3s ease;
    box-shadow: 0 0 8px #f0b429;
  }
}

.embed-status.ready .status-dot {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}
.embed-status.loading .status-dot {
  background: #f0b429;
  animation: pulse 1s infinite;
}
.embed-status.error .status-dot {
  background: #f87171;
}
</style>
