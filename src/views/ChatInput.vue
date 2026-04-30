<script setup lang="ts">
import { ref } from "vue";
const emit = defineEmits(["send"]);
const textarea1 = ref("");
const sendMsg = () => {
  emit("send", textarea1.value);
  textarea1.value = "";
};
</script>
<template>
  <div class="page-container">
    <el-input
      v-model="textarea1"
      :autosize="{ minRows: 1, maxRows: 4 }"
      type="textarea"
      placeholder="请输入"
      class="input_txt"
    />

    <el-icon color="#fff" :size="32" @click="sendMsg"><Position /></el-icon>
  </div>
</template>
<style lang="scss" scoped>
.page-container {
  display: flex;
  margin-top: 24px;
  padding: 0px 32px;
  align-items: center;
}
.input_txt {
  width: 100%;
}
</style>
