<template>
  <div class="page-container">
    <div v-if="props.apiKey">
      <img src="../assets/ai.svg" alt="" />
      <div>欢迎使用 DeepSeek assist</div>
      <div>
        基于国产大语言模型的智能对话助手，支持流式输出、Markdown渲染、代码高亮等功能
      </div>
    </div>
    <div v-else class="need-api">
      <p>需要配置 API Key</p>
      <p class="text2">请在设置中输入你的 DeepSeek API Key 以开始对话</p>
      <el-button type="primary" @click="openSetting">打开设置</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  apiKey: {
    type: String,
    default: "",
  },
});
const emit = defineEmits(["open"]);
const openSetting = () => {
  emit("open");
};
</script>
<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
  text-align: center;
}
.need-api {
  width: 18rem;
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
