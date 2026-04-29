<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { renderMarkdown } from "../utils/markdown";
import hljs from "highlight.js";
import type { Message } from "../types";

const props = defineProps<{ message: Message }>();

const contentRef = ref<HTMLElement>();

const isUser = computed(() => props.message.role === "user");
const isStreaming = computed(() => props.message.isStreaming);

const renderedContent = computed(() => {
  if (isUser.value) return props.message.content;
  return renderMarkdown(props.message.content);
});

// 代码高亮 + 添加复制按钮
function processCodeBlocks() {
  if (!contentRef.value) return;
  contentRef.value.querySelectorAll("pre code:not(.hljs)").forEach((block) => {
    hljs.highlightElement(block as HTMLElement);
  });
  contentRef.value.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".code-header")) return;
    const code = pre.querySelector("code");
    if (!code) return;
    const langClass = code.className
      .split(" ")
      .find((c) => c.startsWith("language-"));
    const lang = langClass ? langClass.replace("language-", "") : "code";
    const header = document.createElement("div");
    header.className = "code-header";
    header.innerHTML = `<span class="code-lang">${lang}</span><button class="copy-btn">复制</button>`;
    header
      .querySelector(".copy-btn")
      ?.addEventListener("click", function (this: HTMLButtonElement) {
        navigator.clipboard.writeText(code.textContent || "");
        this.textContent = "已复制";
        setTimeout(() => {
          this.textContent = "复制";
        }, 1500);
      });
    pre.insertBefore(header, pre.firstChild);
  });
}

watch(
  renderedContent,
  async () => {
    await nextTick();
    processCodeBlocks();
  },
  { immediate: true },
);

watch(isStreaming, async (v) => {
  if (!v) {
    await nextTick();
    processCodeBlocks();
  }
});

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
<template>
  <div
    class="message"
    :class="{ 'msg-user': isUser, 'msg-assistant': !isUser }"
  >
    <div class="avatar">
      <template v-if="isUser">
        <el-icon><User /></el-icon>
      </template>
      <template v-else>
        <el-icon><ElementPlus /></el-icon>
      </template>
    </div>
    <div class="body">
      <div class="meta">
        <span class="role">{{ isUser ? "你" : "DeepSeek" }}</span>
        <span class="time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div
        ref="contentRef"
        class="content"
        :class="{ 'md-body': !isUser, 'streaming-cursor': isStreaming }"
      >
        <template v-if="isUser">{{ renderedContent }}</template>
        <div v-else-if="renderedContent" v-html="renderedContent"></div>
        <div v-else class="dots"><span></span><span></span><span></span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  gap: 14px;
  padding: 22px 28px;
  animation: fadeInUp 0.3s ease-out;
}
.msg-user {
  background: rgba(30, 41, 59, 0.25);
}
.msg-assistant {
  background: transparent;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.msg-user .avatar {
  background: #5cb1f6;
  color: #000;
}
.msg-assistant .avatar {
  background: linear-gradient(135deg, #6366f1, #925cf6);
  color: #fff;
}

.body {
  flex: 1;
  min-width: 0;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.role {
  font-size: 13px;
  font-weight: 600;
}
.time {
  font-size: 11px;
  color: var(--text-muted);
}

.content {
  font-size: 14.5px;
  line-height: 1.75;
  word-break: break-word;
}

.dots {
  display: flex;
  gap: 5px;
  padding: 6px 0;
}
.dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: pulse 1.4s infinite ease-in-out;
}
.dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.dots span:nth-child(3) {
  animation-delay: 0.4s;
}
</style>
