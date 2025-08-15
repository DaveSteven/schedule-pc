import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import ElementPlus from "unplugin-element-plus/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue(), ElementPlus({ useSource: true }), UnoCSS()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element/index.scss" as *;`,
      },
    },
    modules: {
      localsConvention: "camelCase",
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3333,
    open: false,
  },
  build: {
    target: "es2015",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router", "pinia"],
          vant: ["vant"],
          utils: ["lodash", "dayjs", "axios"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["vue", "vue-router", "pinia", "vant", "lodash", "dayjs", "axios"],
  },
});
