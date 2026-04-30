<script setup lang="ts"></script>
<template>
  <div class="dot-loading">
    <span class="dot-text">加载中</span>
    <span class="dots">
      <span class="dot">.</span>
      <span class="dot">.</span>
      <span class="dot">.</span>
    </span>
  </div>
</template>
<style lang="scss" scoped>
.dot-loading {
  display: flex;
  align-items: center;
  justify-content: left;
  font-size: 14px;
  color: #fff;
}

.dots {
  display: inline-flex;
}

.dot {
  animation: dotAnimation 1.4s infinite;
  opacity: 0;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotAnimation {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
