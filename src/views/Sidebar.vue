<script setup lang="ts">
import { ref } from "vue";
import type { Conversation } from "../types";
const prop = defineProps({
  list: {
    type: Array as () => Conversation[],
    default: [],
  },
});
const emit = defineEmits(["newMsg", "selectMsg"]);
const itemId = ref("");
const visible = ref(false);
const drawer = defineModel("drawer", {
  type: Boolean,
  default: false,
});
const handleClose = () => {
  console.log("before close");
  drawer.value = false;
};
const chooseMsg = (id: string) => {
  console.log("choose msg", id);
  itemId.value = id;
  emit("selectMsg", id);
  drawer.value = false;
  visible.value = false;
};
const newMsg = () => {
  emit("newMsg");
  drawer.value = false;
};
</script>
<template>
  <el-drawer
    v-model="drawer"
    title="Deek Seek"
    size="40%"
    direction="ltr"
    :before-close="handleClose"
  >
    <el-button type="primary" round class="new-chat-btn" @click="newMsg">
      <el-icon><CirclePlusFilled /></el-icon>&nbsp开启新对话</el-button
    >
    <div>
      <div class="msg-title">
        <div>今天</div>
        <div
          v-for="item in prop.list"
          :key="item.id"
          :class="['content', { active: item.id === itemId }]"
          @click="chooseMsg(item.id)"
        >
          <p>{{ item.title }}</p>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.page-container {
  margin-top: 24px;
  padding: 0px 32px;
}
.new-chat-btn {
  width: 100%;
}
.msg-title {
  margin-top: 10px;
  font-size: 14px;
  .content {
    margin-top: 10px;
    padding: 7px 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    &.active {
      color: #f0f0f0;
      border: 1px solid #2d2d2e;
      background-color: #2d2d2e;
      border-radius: 5px;
    }
  }
}
</style>
