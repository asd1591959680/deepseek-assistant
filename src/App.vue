<script setup lang="ts">
import Topbar from "./components/Topbar.vue";
import Main from "./components/Main.vue";
import ChatInput from "./components/ChatInput.vue";
</script>
<template>
  <Topbar></Topbar>
  <Main></Main>
  <ChatInput></ChatInput>
</template>
<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
}
</style>
