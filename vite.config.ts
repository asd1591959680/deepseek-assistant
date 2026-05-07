import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    // 告诉 Vite 不要预打包 pdfjs-dist，避免版本混乱
    exclude: ["pdfjs-dist"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), // 将 @ 指向 src 目录
    },
  },
});
