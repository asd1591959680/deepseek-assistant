<script setup lang="ts">
import { ref } from "vue";
import type { Conversation } from "../types";

const prop = defineProps({
  list: {
    type: Array as () => Conversation[],
    default: [],
  },
});
const emit = defineEmits(["newMsg", "selectMsg", "deleteMsg"]);
const itemId = ref("");
const moreId = ref("");
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
};
const newMsg = () => {
  emit("newMsg");
  drawer.value = false;
};
const deleteMsg = (id: string) => {
  emit("deleteMsg", id);
  drawer.value = false;
  visible.value = false;
};
const chooseMore = (id: string) => {
  moreId.value = id;
  visible.value = !visible.value;
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
          <div class="more-wrap">
            <el-icon @click.stop="chooseMore(item.id)"><More /></el-icon>
            <div v-if="moreId === item.id && visible" class="del-wrap">
              <el-button
                type="danger"
                size="small"
                @click.stop="deleteMsg(item.id)"
              >
                删除
              </el-button>
            </div>
          </div>
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
.upload-wrap {
  :deep(.el-upload) {
    width: 100%;
  }
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
    &:hover {
      color: #f0f0f0;
      border: 1px solid #2d2d2e;
      background-color: #2d2d2e;
      border-radius: 5px;
    }
  }
  .more-wrap {
    position: relative;
    .el-icon {
      cursor: pointer;
    }
  }
  .del-wrap {
    width: 50px;
    position: absolute;
    top: 33px;
    left: -50px;
    padding: 5px 10px;
    color: #fff;
    border-radius: 5px;
    font-size: 12px;
    background-color: #2d2d2e;
    z-index: 1;
  }
}
</style>
