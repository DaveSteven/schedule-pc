import { defineStore } from "pinia";
import dayjs from "dayjs";

export type ViewType = "day" | "week" | "month" | "timeline";

// 定义 state 的类型
interface CalendarState {
  selectedDate: string;
  viewType: ViewType;
}

// 定义 getters 的返回类型
type CalendarGetters = {
  formattedSelectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  selectedDateObj: dayjs.Dayjs;
};

// 定义 actions 的类型
type CalendarActions = {
  setSelectedDate(date: string | Date): void;
  setToday(): void;
  handleCalendarChange(date: Date): void;
  setViewType(type: ViewType): void;
};

// 定义完整的 store 类型
export type CalendarStore = CalendarState & CalendarGetters & CalendarActions;

export const useCalendarStore = defineStore("calendar", {
  state: (): CalendarState => ({
    selectedDate: dayjs().format("YYYY-MM-DD"),
    viewType: "week" as ViewType,
  }),

  getters: {
    // 格式化的选中日期
    formattedSelectedDate: (state) => {
      return dayjs(state.selectedDate).format("YYYY年MM月DD日");
    },

    // 选中的月份
    selectedMonth: (state) => {
      return dayjs(state.selectedDate).format("YYYY年MM月");
    },

    // 选中的年份
    selectedYear: (state) => {
      return dayjs(state.selectedDate).format("YYYY年");
    },

    // 选中日期的 dayjs 对象
    selectedDateObj: (state) => {
      return dayjs(state.selectedDate);
    },

    // 是否为今天
    isToday: (state) => {
      return dayjs().isSame(state.selectedDate, "day");
    },
  },

  actions: {
    // 设置选中的日期
    setSelectedDate(date: string) {
      this.selectedDate = date;
    },

    // 设置为今天
    setToday() {
      this.selectedDate = dayjs().format("YYYY-MM-DD");
    },

    // 处理日历 change 事件
    handleCalendarChange(date: string) {
      this.setSelectedDate(date);
    },

    // 设置视图类型
    setViewType(type: ViewType) {
      this.viewType = type;
    },
  },
});
