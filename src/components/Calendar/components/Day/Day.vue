<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { TimeEvent, DayProps, DayEmits } from "./types";
import { useTimeUtils } from "../../hooks/useTimeUtils";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { useDragHandlers } from "../../hooks/useDragHandlers";
import { useEventHandlers } from "../../hooks/useEventHandlers";

// Props
const props = withDefaults(defineProps<DayProps>(), {
  selectedDate: () => new Date().toISOString().split("T")[0],
  events: () => [],
});

// Emits
const emit = defineEmits<DayEmits>();

// 响应式数据
const timelineContainer = ref<HTMLElement | null>(null);
const newEventElement = ref<HTMLElement | null>(null);
const activeEventId = ref<string | null>(null);
const activeAllDayEventId = ref<string | null>(null);

// 使用hooks
const { formatTime, timeLabels } = useTimeUtils();
const { currentTimeTop, shouldShowCurrentTime, scrollToCurrentTime } =
  useCurrentTime(props.selectedDate);
const { dragState, startTimeBlockDrag, startEventDrag } = useDragHandlers(emit);
const {
  timeBlock,
  showAllDayEvents,
  allDayEvents,
  visibleAllDayEvents,
  hiddenCount,
  processedTimeEvents,
  lightenColor,
  handleTimelineClick,
  toggleAllDayEvents,
} = useEventHandlers(props, emit, newEventElement);

// 本地全天事件点击处理函数
const handleAllDayEventClick = (event: any, e: MouseEvent, dragState: any) => {
  // 如果正在拖拽且已经移动，不处理点击
  if (
    dragState &&
    ((dragState.isDragging && dragState.hasMoved) ||
      (dragState.isResizing && dragState.hasMoved) ||
      (dragState.isEventDragging && dragState.hasMoved))
  ) {
    console.log("正在拖拽中，忽略全天事件点击");
    return;
  }

  // 检查是否刚刚完成拖拽（防止拖拽后立即触发点击）
  if (dragState?.lastDragEndTime) {
    const timeSinceDrag = Date.now() - dragState.lastDragEndTime;
    if (timeSinceDrag < 200) {
      console.log("拖拽刚结束，忽略全天事件点击");
      return;
    }
  }

  // 点击全天事件时清空timeBlock
  if (timeBlock.value) {
    console.log("点击全天事件，清空timeBlock");
    timeBlock.value = null;
  }

  // 切换全天事件的选中状态
  if (activeAllDayEventId.value === event.id) {
    // 如果点击的是已选中的事件，则取消选中
    activeAllDayEventId.value = null;
    activeEventId.value = null; // 同时取消时间事件的选中状态
  } else {
    // 选中新的全天事件，取消其他选中状态
    activeAllDayEventId.value = event.id;
    activeEventId.value = null; // 取消时间事件的选中状态
  }

  emit("event-click", {
    event,
    el: e.currentTarget as HTMLElement,
  });
};

// 事件处理函数
const handleEventClick = (event: TimeEvent, e: MouseEvent) => {
  // 如果正在拖拽且已经移动，不处理点击
  if (
    (dragState.value.isDragging && dragState.value.hasMoved) ||
    (dragState.value.isResizing && dragState.value.hasMoved) ||
    (dragState.value.isEventDragging && dragState.value.hasMoved)
  ) {
    console.log("正在拖拽中，忽略时间事件点击");
    return;
  }

  // 检查是否刚刚完成拖拽（防止拖拽后立即触发点击）
  if (dragState.value.lastDragEndTime) {
    const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
    if (timeSinceDrag < 200) {
      console.log("拖拽刚结束，忽略时间事件点击");
      return;
    }
  }

  // 取消拖拽定时器，防止点击后触发拖拽
  if (dragState.value.clickTimer) {
    clearTimeout(dragState.value.clickTimer);
    dragState.value.clickTimer = null;
    console.log("取消拖拽定时器，处理点击事件");
  }

  // 点击时间事件时清空timeBlock
  if (timeBlock.value) {
    console.log("点击时间事件，清空timeBlock");
    timeBlock.value = null;
  }

  const targetElement = e.currentTarget as HTMLElement;
  activeEventId.value = event.id;
  emit("event-click", {
    event,
    el: targetElement,
  });
};

const handleEventDragStart = (event: MouseEvent, timeEvent: TimeEvent) => {
  startEventDrag(event, timeEvent);
};

const handleTimelineClickWrapper = (event: MouseEvent) => {
  // 创建适配器函数，因为handleTimelineClick回调只传递一个参数
  const eventClickAdapter = (timeEvent: TimeEvent) => {
    handleEventClick(timeEvent, event);
  };
  handleTimelineClick(
    event,
    dragState.value,
    eventClickAdapter,
    activeEventId.value || activeAllDayEventId.value
  );
};

const handleTimeBlockMouseDown = (event: MouseEvent) => {
  if (!timeBlock.value) return;

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickY = event.clientY - rect.top;

  // 定义边缘区域的大小（像素）
  const edgeThreshold = 8;

  // 检测是否点击在顶部边缘区域
  if (clickY <= edgeThreshold) {
    startTimeBlockDrag(event, timeBlock.value, "resize-top");
  }
  // 检测是否点击在底部边缘区域
  else if (clickY >= rect.height - edgeThreshold) {
    startTimeBlockDrag(event, timeBlock.value, "resize-bottom");
  }
  // 其他区域为移动操作
  else {
    startTimeBlockDrag(event, timeBlock.value, "move");
  }
};

// 生命周期
onMounted(() => {
  if (shouldShowCurrentTime.value) {
    setTimeout(() => {
      // 当有事件被选中时，禁止滚动到当前时间
      const allowScroll = !activeEventId.value;
      scrollToCurrentTime(timelineContainer.value, allowScroll);
    }, 500);
  }

  // 添加全局点击事件监听器
  const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // 清空activeEventId
    if (!target.closest(".day-timeline__event")) {
      activeEventId.value = null;
    }

    // 清空activeAllDayEventId
    if (!target.closest(".day-all-events__item")) {
      activeAllDayEventId.value = null;
    }

    // 清空timeBlock - 除非点击的是时间轴空白区域或时间块本身
    if (
      !target.closest(".day-timeline__content") &&
      !target.closest(".day-timeline__time-block")
    ) {
      if (timeBlock.value) {
        console.log("点击其他地方，清空timeBlock");
        timeBlock.value = null;
      }
    }
  };

  document.addEventListener("click", handleGlobalClick);

  // 在组件卸载时清理事件监听器
  onUnmounted(() => {
    document.removeEventListener("click", handleGlobalClick);
  });
});
</script>

<template>
  <!-- 全天日程组件 -->
  <div v-if="allDayEvents.length > 0" class="day-all-events">
    <div class="day-all-events__header">
      <span class="text-11px">GMT+8</span>
      <div @click="toggleAllDayEvents" class="day-all-events__header-icon">
        <svg
          class="day-all-events__expand-icon"
          :class="{ 'day-all-events__expand-icon--expanded': showAllDayEvents }"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>
    </div>
    <div class="day-all-events__content">
      <div class="day-all-events__list">
        <div
          v-for="event in visibleAllDayEvents"
          :key="event.id"
          class="day-all-events__item"
          :class="{
            'day-all-events__item--active': activeAllDayEventId === event.id,
          }"
          :style="{
            backgroundColor: event.color
              ? lightenColor(event.color, 0.8)
              : '#f5f5f5',
            borderLeft: `3px solid ${event.color}`,
          }"
          @click="handleAllDayEventClick(event, $event, dragState)"
        >
          <span class="day-all-events__title">{{ event.title }}</span>
        </div>
      </div>
      <div
        v-if="allDayEvents.length > 2 && !showAllDayEvents"
        class="day-all-events__toggle"
        @click="toggleAllDayEvents"
      >
        <span v-if="hiddenCount > 0">还有{{ hiddenCount }}项</span>
      </div>
    </div>
  </div>

  <!-- 时间轴组件 -->
  <div
    class="day-timeline"
    ref="timelineContainer"
    :class="{
      'day-timeline--scroll-disabled': activeEventId || activeAllDayEventId,
    }"
  >
    <div
      class="day-timeline__content"
      @click="handleTimelineClickWrapper"
      @mousedown.stop
    >
      <!-- 时间标签 -->
      <div class="day-timeline__labels">
        <div
          v-for="label in timeLabels"
          :key="label.time"
          class="day-timeline__label"
          :style="{ top: `${label.top - 1}px` }"
        >
          {{ label.time }}
        </div>
      </div>

      <!-- 当前时间线 -->
      <div
        v-if="shouldShowCurrentTime"
        class="day-timeline__current-line"
        :style="{ top: `${currentTimeTop}px` }"
      />

      <!-- 时间事件 -->
      <div
        v-for="event in processedTimeEvents"
        :key="event.id"
        class="day-timeline__event"
        :class="{
          'day-timeline__event--dragging':
            dragState.isEventDragging &&
            dragState.currentEvent?.id === event.id,
          'day-timeline__event--active': activeEventId === event.id,
        }"
        :style="{
          top:
            dragState.isEventDragging &&
            dragState.currentEvent?.id === event.id &&
            dragState.dragEventPosition
              ? `${dragState.dragEventPosition.top}px`
              : `${event.top}px`,
          height: `${event.height}px`,
          backgroundColor: lightenColor(event.color, 0.8),
          borderLeft: `3px solid ${event.color}`,
          left: `calc(60px + ${event.overlapStyle?.left || '0%'})`,
          width: `calc(${event.overlapStyle?.width || '100%'} - 69px)`,
          zIndex: event.overlapStyle?.zIndex || 1,
        }"
        @mousedown="(e) => handleEventDragStart(e, event)"
        @click.stop="handleEventClick(event, $event)"
      >
        <div class="day-timeline__event-content">
          <span class="day-timeline__event-text"
            >{{ event.title }}，{{ formatTime(event.startTime) }} -
            {{ formatTime(event.startTime + event.duration) }}</span
          >
        </div>
      </div>

      <!-- 时间块 -->
      <div
        v-if="timeBlock"
        ref="newEventElement"
        class="day-timeline__time-block"
        :style="{
          top: `${timeBlock.top}px`,
          height: `${timeBlock.height}px`,
        }"
        @mousedown.stop="(e) => handleTimeBlockMouseDown(e)"
      >
        <div class="day-timeline__time-display">
          {{ formatTime(timeBlock.startTime) }} -
          {{ formatTime(timeBlock.startTime + timeBlock.duration) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./style.scss";
</style>
