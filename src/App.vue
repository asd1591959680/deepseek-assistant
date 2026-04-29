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
    console.log(messagesRef.value?.scrollHeight);
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
  <Topbar class="top-wrap"></Topbar>
  <Main class="main-wrap" v-if="currentMessages.length === 0"></Main>
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
</style>
