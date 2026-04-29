<template>
  <div class="page-container">
    <div class="left-wrap">
      <img src="../assets/list.svg" alt="图标" width="24" height="24" />
      <div class="status">
        <p>deepseek 智能助手</p>
        <p class="text">未配置API Key</p>
      </div>
    </div>
    <img src="../assets/setting.svg" alt="图标" width="24" height="24" />
  </div>
</template>
<script setup lang="ts"></script>
<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
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
