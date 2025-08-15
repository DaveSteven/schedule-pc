import { createApp } from "vue";
import App from "./App.vue";

import "@unocss/reset/tailwind-compat.css";
import "virtual:uno.css";
import "@fullcalendar/core/locales/zh-cn";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isToday from "dayjs/plugin/isToday";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { createPinia } from "pinia";
import router from "./router";

// 注册dayjs插件
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isToday);
dayjs.extend(customParseFormat);

const app = createApp(App);
app.use(createPinia());
app.use(router);

// 挂载应用
app.mount("#app");
