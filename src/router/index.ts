import { createRouter, createWebHashHistory } from "vue-router";

// 创建路由
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: () => import("@/views/Home.vue"),
    },
  ],
});

export default router;
