<script setup lang="ts">
import { ref, onMounted } from "vue";
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

// 使用hooks
const { formatTime, timeLabels } = useTimeUtils();
const { currentTimeTop, shouldShowCurrentTime, scrollToCurrentTime } =
  useCurrentTime(props.selectedDate);
const { dragState, startTimeBlockDrag, startEventDrag } = useDragHandlers();
const {
  timeBlock,
  allDayEvents,
  visibleAllDayEvents,
  hiddenCount,
  processedTimeEvents,
  lightenColor,
  handleTimelineClick,
  toggleAllDayEvents,
  handleAllDayEventClick,
} = useEventHandlers(props, emit);

// 事件处理函数
const handleEventClick = (event: TimeEvent, e: MouseEvent) => {
  const targetElement = e.currentTarget as HTMLElement;
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
  handleTimelineClick(event, dragState.value, eventClickAdapter);
};

const handleTimeBlockDrag = (
  event: MouseEvent,
  type: "move" | "resize-top" | "resize-bottom"
) => {
  if (timeBlock.value) {
    startTimeBlockDrag(event, timeBlock.value, type);
  }
};

// 生命周期
onMounted(() => {
  if (shouldShowCurrentTime.value) {
    setTimeout(() => {
      scrollToCurrentTime(timelineContainer.value);
    }, 500);
  }
});
</script>

<template>
  <!-- 全天日程组件 -->
  <div v-if="allDayEvents.length > 0" class="day-all-events">
    <div class="day-all-events__header">全天</div>
    <div class="day-all-events__content">
      <div class="day-all-events__list">
        <div
          v-for="event in visibleAllDayEvents"
          :key="event.id"
          class="day-all-events__item"
          :style="{
            backgroundColor: event.color
              ? lightenColor(event.color, 0.8)
              : '#f5f5f5',
            borderLeft: `3px solid ${event.color}`,
          }"
          @click="handleAllDayEventClick(event, $event)"
        >
          <span class="day-all-events__title">{{ event.title }}</span>
        </div>
      </div>
      <div
        v-if="hiddenCount > 0"
        class="day-all-events__more"
        @click="toggleAllDayEvents"
      >
        <span class="day-all-events__triangle"></span>
        还有{{ hiddenCount }}项
      </div>
      <div
        v-if="allDayEvents.length > 2 && hiddenCount === 0"
        class="day-all-events__collapse"
        @click="toggleAllDayEvents"
      >
        收起
      </div>
    </div>
  </div>

  <!-- 时间轴组件 -->
  <div class="day-timeline" ref="timelineContainer">
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
          :style="{ top: `${label.top}px` }"
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
          left: `calc(70px + ${event.overlapStyle?.left || '0%'})`,
          width: `calc(${event.overlapStyle?.width || '100%'} - 85px)`,
          zIndex: event.overlapStyle?.zIndex || 1,
        }"
        @mousedown="(e) => handleEventDragStart(e, event)"
        @click.stop="handleEventClick(event, $event)"
      >
        <div class="day-timeline__event-title">{{ event.title }}</div>
        <div class="day-timeline__event-time">
          {{ formatTime(event.startTime) }} -
          {{ formatTime(event.startTime + event.duration) }}
        </div>
      </div>

      <!-- 时间块 -->
      <div
        v-if="timeBlock"
        class="day-timeline__time-block"
        :style="{
          top: `${timeBlock.top}px`,
          height: `${timeBlock.height}px`,
        }"
        @mousedown.stop="(e) => handleTimeBlockDrag(e, 'move')"
      >
        <div
          class="day-timeline__resize-handle day-timeline__resize-handle--top"
          @mousedown.stop="(e) => handleTimeBlockDrag(e, 'resize-top')"
        />
        <div
          class="day-timeline__resize-handle day-timeline__resize-handle--bottom"
          @mousedown.stop="(e) => handleTimeBlockDrag(e, 'resize-bottom')"
        />
        <div class="day-timeline__time-display">
          {{ formatTime(timeBlock.startTime) }} -
          {{ formatTime(timeBlock.startTime + timeBlock.duration) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 全天日程容器样式 */
.day-all-events {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 48px;
  box-sizing: border-box;

  &__header {
    font-size: 14px;
    color: #8c8c8c;
    font-weight: 500;
    min-width: 40px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 4px;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  &__title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__more,
  &__collapse {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #8c8c8c;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.2s ease;

    &:hover {
      color: #666;
    }
  }

  &__triangle {
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid currentColor;
    transition: transform 0.2s ease;
  }

  &__collapse &__triangle {
    transform: rotate(180deg);
  }
}

/* 时间轴容器样式 */
.day-timeline {
  position: relative;
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  scroll-behavior: smooth;

  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &__content {
    position: relative;
    height: 1440px; /* 24小时 * 60px */
    width: 100%;
    background: #fff;
    cursor: crosshair;

    /* 时间网格线 - 每小时一条粗线 */
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 70px;
      right: 16px;
      height: 1380px; /* 20小时 * 60px，从01:00到21:00，避免22:00后的分割线 */
      background-image: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 59px,
        #f0f0f0 59px,
        #f0f0f0 60px
      );
      pointer-events: none;
      z-index: 0;
    }
  }

  &__labels {
    position: absolute;
    left: 0;
    top: 0;
    width: 70px;
    height: 100%;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
  }

  &__label {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    user-select: none;
    pointer-events: none;
    z-index: 1;
    padding-left: 16px;
    font-size: 14px;
    color: #8c8c8c;
    font-weight: 400;
    box-sizing: border-box;
    position: absolute;
    left: 0;
    width: 80px;
    height: 60px;
    display: flex;
    align-items: center;
    transform: translateY(-50%);
  }

  &__current-line {
    position: absolute;
    left: 70px;
    right: 16px;
    height: 2px;
    background: #ff1327;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(255, 71, 87, 0.3);
    animation: pulse 2s ease-in-out infinite;

    &::before {
      content: "";
      position: absolute;
      left: -4px;
      top: -3px;
      width: 8px;
      height: 8px;
      background-color: #ff1327;
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(255, 71, 87, 0.6);
    }
  }

  &__event {
    position: absolute;
    border-radius: 6px;
    padding: 4px 8px;
    color: #333;
    font-size: 12px;
    line-height: 1.2;
    overflow: hidden;
    box-sizing: border-box;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &--dragging {
      opacity: 0.8;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(1.02);
    }
  }

  &__event-title {
    font-weight: 500;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__event-time {
    font-size: 10px;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time-block {
    z-index: 20;
    transition: box-shadow 0.2s ease;
    border-radius: 8px;
    position: absolute;
    left: 70px;
    width: calc(100% - 85px);
    background-color: rgba(159, 88, 255, 0.3);
    border: 1px solid var(--primary-color, #9f58ff);
    cursor: move;
    user-select: none;
    border-left: 4px solid var(--primary-color, #9f58ff);

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    &:active {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }

  &__resize-handle {
    z-index: 3;
    transition: all 0.2s ease;
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #fff;
    border-radius: 50%;
    border: 2px solid var(--primary-color, #9f58ff);
    cursor: ns-resize;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      background-color: var(--primary-color, #9f58ff) !important;
    }

    &:active {
      transform: scale(1.4);
    }

    &--top {
      top: -5px;
      left: 4px;
    }

    &--bottom {
      bottom: -5px;
      right: 4px;
    }
  }

  &__time-display {
    padding: 4px 8px;
    font-size: 12px;
    color: var(--primary-color, #9f58ff);
    font-weight: 500;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
