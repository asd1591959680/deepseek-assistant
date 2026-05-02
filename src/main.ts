import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "highlight.js/styles/atom-one-dark.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { createPinia } from 'pinia'
const app = createApp(App);
const pinia = createPinia()
app.use(ElementPlus);
app.use(pinia);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.mount("#app");
