<script setup lang="ts">
import Topbar from "./components/Topbar.vue";
import Main from "./components/Main.vue";
import ChatInput from "./components/ChatInput.vue";
import { useChat } from "./hooks/useChat";
import Message from "./components/Message.vue";
import { nextTick, ref, watch } from "vue";
const { sendMessage, currentMessages } = useChat();
const messagesRef = ref<HTMLElement>();

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
  <Topbar></Topbar>
  <Main v-if="currentMessages.length === 0"></Main>
  <div class="messages" ref="messagesRef">
    <Message
      v-for="(msg, index) in currentMessages"
      :key="index"
      :message="msg"
    />
  </div>
  <ChatInput class="input-wrap" @send="handleSend"></ChatInput>
</template>
<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
}
.input-wrap {
  width: 80%;
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}
.messages {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}
</style>
