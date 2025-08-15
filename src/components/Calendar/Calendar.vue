<script setup lang="ts">
import { Day, Week, Month } from "@/components/Calendar";
import type { ViewType } from "@/stores/calendar";
import type { EventItem } from "./utils/events";

interface Props {
  viewType: ViewType;
  selectedDate: string;
  events: EventItem[];
}

interface Emits {
  (e: "date-change", date: string): void;
  (e: "event-click", arg: any): void;
  (e: "event-change", event: any): void;
  (e: "event-created", arg: any): void;
  (e: "event-create-cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 事件处理方法
const handleDateChange = (date: string) => {
  emit("date-change", date);
};

const handleEventClick = (arg: any) => {
  emit("event-click", arg);
};

const handleEventChange = (event: any) => {
  emit("event-change", event);
};

const handleEventCreated = (arg: any) => {
  emit("event-created", arg);
};

const handleEventCreateCancel = () => {
  emit("event-create-cancel");
};
</script>

<template>
  <div class="calendar-container">
    <Month
      v-if="viewType === 'month'"
      :selected-date="selectedDate"
      :events="events"
      @date-change="handleDateChange"
      @event-click="handleEventClick"
      @event-change="handleEventChange"
    />
    <Week
      v-if="viewType === 'week'"
      :selected-date="selectedDate"
      :events="events"
      @date-change="handleDateChange"
      @event-click="handleEventClick"
    />
    <Day
      v-if="viewType === 'day'"
      :events="events"
      @event-click="handleEventClick"
      @event-change="handleEventChange"
      @event-created="handleEventCreated"
      @event-create-cancel="handleEventCreateCancel"
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
