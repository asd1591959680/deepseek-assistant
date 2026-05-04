<script setup lang="ts">
import Topbar from "./views/Topbar.vue";
import Main from "./views/Main.vue";
import ChatInput from "./views/ChatInput.vue";
import { useChat } from "./hooks/useChat";
import Message from "./views/Message.vue";
import Setting from "./views/Setting.vue";
import { nextTick, ref, watch } from "vue";
import Sidebar from "./views/Sidebar.vue";
import ModelStatus from "@/components/ModelStatus.vue";
import { useRagStore } from "@/store";

const {
  sendMessage,
  currentMessages,
  updateSettings,
  createConversation,
  conversations,
  switchConversation,
  deleteConversation,
  isLoading,
  stopGeneration,
  settings,
} = useChat();
const rag = useRagStore();
const messagesRef = ref<HTMLElement>();
const isShow = ref(false);
const drawer = ref(false);
const handleSend = async (content: string) => {
  // if (rag.isSuccess) {
  console.log(rag.totalChunks, rag.documents.length);

  const retrieved = await rag.retrieve(content);
  await sendMessage(content, retrieved, rag.totalChunks);
  // } else {
  //   await sendMessage(content);
  // }
};
const settingFun = (setting: any) => {
  updateSettings({
    apiKey: setting.key,
    model: setting.modelNm,
    systemPrompt: setting.systemPrompt,
    temperature: setting.temperature,
  });
};
const handleNewMsg = () => {
  createConversation();
};
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
</script>
<template>
  <Topbar class="top-wrap" @right="isShow = $event" @left="drawer = $event"
    ><ModelStatus
  /></Topbar>
  <Main
    class="main-wrap"
    v-if="currentMessages.length === 0"
    @open="isShow = true"
    :api-key="settings.apiKey"
  ></Main>
  <div v-else class="messages" ref="messagesRef">
    <Message
      v-for="(msg, index) in currentMessages"
      :key="index"
      :message="msg"
    />
  </div>
  <ChatInput
    class="input-wrap"
    @send="handleSend"
    @stop="stopGeneration"
    :isLoading="isLoading"
  ></ChatInput>
  <Setting v-model:isShow="isShow" @update-setting="settingFun"></Setting>
  <Sidebar
    v-model:drawer="drawer"
    @new-msg="handleNewMsg"
    @select-msg="switchConversation"
    @delete-msg="deleteConversation"
    :list="conversations"
  ></Sidebar>
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
  height: 75vh;
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
