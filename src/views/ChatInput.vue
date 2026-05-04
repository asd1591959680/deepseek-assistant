<script setup lang="ts">
import { ref } from "vue";
import Uploads from "@/components/Uploads.vue";
import FileList from "@/components/FileList.vue";
const emit = defineEmits(["send", "stop"]);
const textarea1 = ref("");
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
});
const sendMsg = () => {
  if (textarea1.value) {
    emit("send", textarea1.value);
    textarea1.value = "";
  }
};
const stopMsg = () => {
  emit("stop");
};
</script>
<template>
  <div>
    <FileList></FileList>
    <div class="page-container">
      <el-input
        v-model="textarea1"
        :autosize="{ minRows: 1, maxRows: 4 }"
        type="textarea"
        placeholder="请输入"
        class="input_txt"
      />
      <Uploads></Uploads>
      <el-icon v-if="!isLoading" color="#fff" :size="32" @click="sendMsg">
        <Position />
      </el-icon>
      <el-icon v-else color="#fff" :size="32" @click="stopMsg">
        <VideoPause />
      </el-icon>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.page-container {
  display: flex;
  margin-top: 5px;
  align-items: center;
}
.input_txt {
  width: 100%;
}
.upload-icon-a {
  margin-right: 10px;
}
</style>
