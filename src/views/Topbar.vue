<script setup lang="ts">
import { useRagStore } from "@/store";
const emit = defineEmits(["right", "left"]);
const openRight = () => {
  emit("right", true);
};
const openLeft = () => {
  emit("left", true);
};
</script>
<template>
  <div class="page-container">
    <div class="left-wrap">
      <img
        src="../assets/list.svg"
        alt="图标"
        width="48"
        height="48"
        @click="openLeft"
      />
      <div class="status">
        <p>deepseek 智能助手</p>
        <p v-if="false" class="text">未配置API Key</p>
      </div>
    </div>
    <div>
      <!-- <el-radio-group
        v-model="radio"
        size="large"
        fill="#409eff"
        @change="changeEvent"
      >
        <el-radio-button label="普通对话" value="1" />
        <el-radio-button label="知识库问答" value="2" />
      </el-radio-group> -->
      <slot></slot>
    </div>
    <img
      src="../assets/setting.svg"
      alt="图标"
      width="48"
      height="48"
      @click="openRight"
    />
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status {
  margin-left: 10px;
  text-align: left;
  .text {
    font-size: 12px;
  }
}
</style>
