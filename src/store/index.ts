// stores/counter.js
import { defineStore } from "pinia";

// 第一个参数是 Store 的唯一 ID
export const useAIStore = defineStore("ai", {
  // 状态（data）
  state: () => ({
    models: "1",
  }),

  // 计算属性
  getters: {
    activeModels: (state) => state.models,
  },

  // 方法（methods）
  actions: {
    changeModel(v: string) {
      this.models = v;
    },
  },
});
