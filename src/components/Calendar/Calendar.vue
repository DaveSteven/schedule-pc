<script setup lang="ts">
import { Day, Week, Month } from "@/components/Calendar";
import type { ViewType } from "@/stores/calendar";
import type { EventItem } from "./utils/events";
import type {
  CalendarEmits,
  EventClickData,
  EventChangeData,
} from "./types/events";
import { createEventEmitter } from "./utils/eventEmitter";
import dayjs from "dayjs";

interface Props {
  viewType: ViewType;
  selectedDate: string;
  events: EventItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<CalendarEmits>();

// 创建事件发射器
const eventEmitter = createEventEmitter(emit);

// 日期切换方法
const next = () => {
  const currentDate = dayjs(props.selectedDate);
  let newDate: dayjs.Dayjs;

  switch (props.viewType) {
    case "day":
      // 日视图：切换到下一天
      newDate = currentDate.add(1, "day");
      break;
    case "week":
      // 周视图：切换到下一周
      newDate = currentDate.add(1, "week");
      break;
    case "month":
      // 月视图：切换到下一月
      newDate = currentDate.add(1, "month");
      break;
    default:
      newDate = currentDate.add(1, "day");
  }

  // 发射日期变更事件
  eventEmitter.emitDateChange(newDate.format("YYYY-MM-DD"));
};

const prev = () => {
  const currentDate = dayjs(props.selectedDate);
  let newDate: dayjs.Dayjs;

  switch (props.viewType) {
    case "day":
      // 日视图：切换到上一天
      newDate = currentDate.subtract(1, "day");
      break;
    case "week":
      // 周视图：切换到上一周
      newDate = currentDate.subtract(1, "week");
      break;
    case "month":
      // 月视图：切换到上一月
      newDate = currentDate.subtract(1, "month");
      break;
    default:
      newDate = currentDate.subtract(1, "day");
  }

  // 发射日期变更事件
  eventEmitter.emitDateChange(newDate.format("YYYY-MM-DD"));
};

// 事件处理方法
const handleDateChange = (data: { date: string }) => {
  eventEmitter.emitDateChange(data.date);
};

const handleEventClick = (data: EventClickData) => {
  eventEmitter.emitEventClick(data.event, data.el);
};

const handleEventChange = (data: EventChangeData) => {
  eventEmitter.emitEventChange(data.event, data.el);
};

// 暴露方法给父组件使用
// 使用示例：
// const calendarRef = ref();
//
// // 切换到下一个时间段
// const handleNext = () => {
//   calendarRef.value?.next();
// };
//
// // 切换到上一个时间段
// const handlePrev = () => {
//   calendarRef.value?.prev();
// };
//
// // 在模板中：<Calendar ref="calendarRef" ... />
defineExpose({
  next,
  prev,
});
</script>

<template>
  <div class="calendar-container">
    <Month
      v-if="viewType === 'month'"
      :selected-date="selectedDate"
      :events="events"
      @event-click="handleEventClick"
      @event-change="handleEventChange"
    />
    <Week
      v-if="viewType === 'week'"
      :selected-date="selectedDate"
      :events="events"
      @date-change="handleDateChange"
      @event-click="handleEventClick"
      @event-change="handleEventChange"
    />
    <Day
      v-if="viewType === 'day'"
      :selected-date="selectedDate"
      :events="events"
      @date-change="handleDateChange"
      @event-click="handleEventClick"
      @event-change="handleEventChange"
    />
  </div>
</template>

<style scoped lang="scss">
.calendar-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.timeline-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}
</style>
