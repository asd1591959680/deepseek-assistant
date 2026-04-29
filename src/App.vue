<script setup lang="ts">
import Topbar from "./components/Topbar.vue";
import Main from "./components/Main.vue";
import ChatInput from "./components/ChatInput.vue";
import { useChat } from "./hooks/useChat";
import Message from "./components/Message.vue";
import Setting from "./components/Setting.vue";
import { nextTick, ref, watch } from "vue";
const { sendMessage, currentMessages } = useChat();
const messagesRef = ref<HTMLElement>();
const isShow = ref(false);
// 自动滚动到底部
watch(
  currentMessages,
  async () => {
    await nextTick();
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  },
  { deep: true },
);
const handleSend = async (content: string) => {
  await sendMessage(content);
};
</script>
<template>
  <Topbar class="top-wrap" @change="isShow = $event"></Topbar>
  <Main class="main-wrap" v-if="currentMessages.length === 0"></Main>
  <div v-else class="messages" ref="messagesRef">
    <Message
      v-for="(msg, index) in currentMessages"
      :key="index"
      :message="msg"
    />
  </div>
  <ChatInput class="input-wrap" @send="handleSend"></ChatInput>
  <Setting v-model:isShow="isShow"></Setting>
</template>
<style lang="scss" scoped>
.input-wrap {
  width: 80%;
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}
.messages {
  height: 500px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
/* 深色主题滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #2c2c2c;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #999;
}

::-webkit-scrollbar-corner {
  background: #2c2c2c;
}
</style>
