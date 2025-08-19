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

interface Props {
  viewType: ViewType;
  selectedDate: string;
  events: EventItem[];
}

defineProps<Props>();
const emit = defineEmits<CalendarEmits>();

// 创建事件发射器
const eventEmitter = createEventEmitter(emit);

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
