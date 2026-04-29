<template>
  <div class="page-container">
    <img src="../assets/ai.svg" alt="" />
    <div>欢迎使用 DeepSeek Chat</div>
    <div>
      基于国产大语言模型的智能对话助手，支持流式输出、Markdown渲染、代码高亮等功能
    </div>
    <div v-if="false" class="need-api">
      <p>需要配置 API Key</p>
      <p class="text2">请在设置中输入你的 DeepSeek API Key 以开始对话</p>
      <el-button type="primary" @click="isShow = true">打开设置</el-button>
    </div>
  </div>

  <Setting v-model:isShow="isShow"></Setting>
</template>
<script setup lang="ts">
import { ref } from "vue";
import Setting from "./Setting.vue";
const isShow = ref(false);
</script>
<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
}
.need-api {
  width: 500px;
  padding: 20px;
  margin: 50px 0;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #e75d37;
  text-align: left;
  color: #e75d37;
  .text2 {
    font-size: 12px;
  }
}
</style>
