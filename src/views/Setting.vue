<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRagStore } from "@/store";
import type { ElForm } from "element-plus";
const emit = defineEmits(["updateSetting"]);
const rag = useRagStore();
const isShow = defineModel("isShow");
const ruleFormRef = ref<InstanceType<typeof ElForm> | null>(null);
let ruleForm = reactive({
  apiKey: "",
  model: "",
  systemPrompt: "",
  temperature: 0.7,
});
const rules = reactive({
  apiKey: [{ required: true, message: "请输入", trigger: "blur" }],
});
const modelOptions = reactive([
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek-V4-Flash",
    description: "通用对话模型，适合日常问答",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek-V4-Pro",
    description: "深度推理模型，适合复杂逻辑推理",
  },
]);
const cancel = () => {
  isShow.value = false;
  ruleFormRef.value?.resetFields();
};
const saveSettings = () => {
  rag.settings = ruleForm;
  isShow.value = false;
};
const clickItem = (id: string) => {
  ruleForm.model = id;
};
onMounted(() => {
  ruleForm = rag.settings;
});
</script>
<template>
  <div class="page-container">
    <el-dialog
      v-model="isShow"
      title="设置"
      width="80%"
      center
      class="setting-dialog"
      destroy-on-close
    >
      <div>
        <el-form
          ref="ruleFormRef"
          style="max-width: 600px"
          :model="ruleForm"
          :rules="rules"
          label-width="auto"
          label-position="left"
        >
          <el-form-item label="API Key" prop="apiKey" label-position="top">
            <el-input type="password" v-model="ruleForm.apiKey" clearable>
              <!-- <template #suffix>
                <el-button size="small" @click="getAPIKey"
                  >点击获取API</el-button
                >
              </template> -->
            </el-input>
          </el-form-item>
          <!-- <el-form-item label="API地址" prop="url" label-position="top">
            <el-input v-model="ruleForm.url" />
          </el-form-item> -->
          <el-form-item label="模型选择" prop="model" label-position="top">
            <div
              v-for="item in modelOptions"
              :key="item.id"
              :class="['model-wrap', { active: ruleForm.model === item.id }]"
              @click="clickItem(item.id)"
            >
              <div>{{ item.name }}</div>
              <div>{{ item.description }}</div>
            </div>
          </el-form-item>
          <el-form-item
            label="温度（temperature）"
            prop="temperature"
            label-position="top"
          >
            <el-slider
              v-model="ruleForm.temperature"
              :min="0"
              :max="2"
              :step="0.1"
            />
          </el-form-item>
          <!-- <el-form-item
            label="最大输出长度"
            prop="maxLength"
            label-position="top"
          >
            <el-slider
              v-model="ruleForm.maxLength"
              :min="256"
              :max="8192"
              :step="1"
            />
          </el-form-item> -->
          <el-form-item
            label="系统提示词"
            prop="systemPrompt"
            label-position="top"
          >
            <el-input v-model="ruleForm.systemPrompt" clearable />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="saveSettings"> 保存设置 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<style lang="scss" scoped>
.page-container :deep(.el-dialog) {
  margin: auto;
  height: 500px;
  overflow: auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}
.model-wrap {
  width: 100%;
  margin: 5px 0;
  padding: 5px;
  border: 1px solid #e0dada;
  border-radius: 5px;
  &.active {
    border: 1px solid #93dbe7;
    background-color: rgba(120, 179, 255, 0.2);
  }
}
</style>
