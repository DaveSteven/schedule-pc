<script setup lang="ts">
import { toRef, ref, nextTick } from "vue";
import dayjs from "dayjs";
import { useWeekView } from "./composables";
import { useColorUtils } from "../../hooks/useColorUtils";
import type { WeekEvent, TimeBlock } from "./types";

// Props
const props = defineProps({
  selectedDate: {
    type: String,
    default: () => dayjs().format("YYYY-MM-DD"),
  },
  events: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits();

// 使用共享hooks
const { lightenColor } = useColorUtils();

// 使用组合函数管理状态和逻辑
const {
  weekRange,
  timeLabels,
  currentTimeTop,
  shouldShowCurrentTime,
  isAllDayExpanded,
  hasExpandableDates,
  toggleAllDayExpanded,
  getAllDayEventsForDate,
  getRenderCrossDayEventsForDate,
  getMarginTopForSingleDayEvent,
  getMoreEventsCount,
  timeEventsByDate,
  timeBlock,
  createTimeBlock,
  clearTimeBlock,
  hasTimeBlock,
  dragState,
  startTimeBlockDrag,
  shouldIgnoreClick,
  // 时间工具函数
  minutesToPixels,
  pixelsToMinutes,
  snapToQuarter,
  formatTime,
} = useWeekView(toRef(props, "selectedDate"), toRef(props, "events"));

// 添加调试日志
console.log("Week component props:", {
  selectedDate: props.selectedDate,
  events: props.events,
  eventsLength: props.events?.length || 0,
});

// 事件处理
const handleEventClick = (event: WeekEvent, e: MouseEvent) => {
  const targetElement = e.currentTarget as HTMLElement;

  // 使用通用的拖拽状态检查
  if (shouldIgnoreClick()) {
    console.log("拖拽刚结束，忽略时间事件点击");
    return;
  }

  // 点击事件时清空timeBlock
  if (hasTimeBlock.value) {
    clearTimeBlock();
  }

  emit("event-click", { event, el: targetElement });
};

// 处理时间列点击事件
const handleTimeColumnClick = (event: MouseEvent, date: string) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickY = event.clientY - rect.top;
  
  // 使用通用的拖拽状态检查
  if (shouldIgnoreClick()) {
    console.log("拖拽刚结束，忽略时间列点击");
    return;
  }

  // 将像素位置转换为分钟数
  const clickMinutes = pixelsToMinutes(clickY);
  const snappedMinutes = snapToQuarter(clickY);

  // 检查是否点击到了事件块
  const clickedEvent = getEventAtPosition(clickY, date);
  if (clickedEvent) {
    console.log("点击到事件块:", clickedEvent.title);
    // 点击到事件块时，清空timeBlock
    if (timeBlock.value) {
      clearTimeBlock();
    }
    handleEventClick(clickedEvent, event);
    return;
  }

  // 如果已经有timeBlock，则清空它
  if (timeBlock.value) {
    console.log("点击空白区域，清空现有timeBlock");
    clearTimeBlock();
    return;
  }

  // 创建新的时间块
  const newBlock = createTimeBlock(date, snappedMinutes, 30);
  console.log("创建新时间块:", newBlock);
};

// 获取指定位置的事件
const getEventAtPosition = (clickY: number, date: string) => {
  const events = timeEventsByDate.value[date] || [];
  return events.find((event) => {
    const eventTop = event.top;
    const eventBottom = eventTop + event.height;
    return clickY >= eventTop && clickY <= eventBottom;
  });
};

// 格式化时间显示
const formatEventTime = (startTime: number, duration: number) => {
  const startFormatted = formatTime(startTime);
  const endFormatted = formatTime(startTime + duration);
  return `${startFormatted} - ${endFormatted}`;
};

// 格式化timeBlock时间显示
const formatTimeBlockTime = (startTime: number, duration: number) => {
  const startFormatted = formatTime(startTime);
  const endFormatted = formatTime(startTime + duration);
  return `${startFormatted} - ${endFormatted}`;
};

// 处理timeBlock的鼠标按下事件
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
</script>

<template>
  <div class="week-view">
    <!-- 周头部 - 显示一周的日期 -->
    <div class="week-view__header">
      <div class="week-view__time-column-header"></div>
      <div
        v-for="dateInfo in weekRange"
        :key="dateInfo.date"
        class="week-view__date-column-header"
        :class="{
          'week-view__date-column-header--today': dateInfo.isToday,
          'week-view__date-column-header--past': dayjs(dateInfo.date).isBefore(
            dayjs(),
            'day'
          ),
        }"
      >
        <div class="week-view__day-of-week">{{ dateInfo.dayOfWeek }}</div>
        <div class="flex items-end justify-center">
          <div class="week-view__date-number">{{ dateInfo.dayNumber }}</div>
          <div class="week-view__lunar-date">{{ dateInfo.lunarDate }}</div>
        </div>
      </div>
    </div>

    <!-- 全天事件区域 -->
    <div class="week-view__all-day-section">
      <div class="week-view__time-column-label">
        <div>全天</div>
        <button
          v-if="hasExpandableDates"
          class="week-view__expand-toggle-btn"
          @click="toggleAllDayExpanded"
          :title="isAllDayExpanded ? '收起' : '展开'"
        >
          <svg
            class="week-view__expand-icon"
            :class="{ 'week-view__expand-icon--expanded': isAllDayExpanded }"
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
        </button>
      </div>

      <!-- 一周的单元格网格 -->
      <div class="week-view__week-grid">
        <div
          v-for="(dateInfo, dateIndex) in weekRange"
          :key="dateInfo.date"
          class="week-view__all-day-events-column"
          :style="{
            gridColumn: `${dateIndex + 1} / ${dateIndex + 2}`,
          }"
        >
          <!-- 全天日程统一渲染 -->
          <template
            v-if="getAllDayEventsForDate(dateInfo.date).visibleCount > 0"
          >
            <!-- 跨天日程 -->
            <div
              v-for="crossDayEvent in getRenderCrossDayEventsForDate(
                dateInfo.date
              )"
              :key="`cross-${crossDayEvent.id}-${dateInfo.date}`"
              class="week-view__all-day-event week-view__all-day-event--cross-day"
              :class="{
                'week-view__all-day-event--past': dayjs(dateInfo.date).isBefore(
                  dayjs(),
                  'day'
                ),
              }"
              :style="{
                backgroundColor: crossDayEvent.color
                  ? lightenColor(crossDayEvent.color, 0.8)
                  : '#f5f5f5',
                borderLeft: `3px solid ${crossDayEvent.color}`,
                position: 'absolute',
                left: 0,
                right: crossDayEvent.crossDayInfo?.spanDays
                  ? `-${(crossDayEvent.crossDayInfo.spanDays - 1) * 100}%`
                  : '0%',
                zIndex: 10,
                top: `${(crossDayEvent.rowIndex || 0) * 24}px`,
              }"
              @click="handleEventClick(crossDayEvent, $event)"
            >
              <div class="week-view__event-title">
                {{ crossDayEvent.title }}
              </div>
            </div>

            <!-- 单日全天日程 -->
            <div
              v-if="
                getAllDayEventsForDate(dateInfo.date).singleDayEvents.length > 0
              "
              class="week-view__single-day-events-container"
              :style="{
                marginTop: `${getMarginTopForSingleDayEvent(dateInfo.date)}px`,
              }"
            >
              <div
                v-for="(singleDayEvent, eventIndex) in getAllDayEventsForDate(
                  dateInfo.date
                ).singleDayEvents"
                :key="`single-${singleDayEvent.id}-${dateInfo.date}`"
                class="week-view__all-day-event week-view__all-day-event--single-day"
                :class="{
                  'week-view__all-day-event--past': dayjs(
                    dateInfo.date
                  ).isBefore(dayjs(), 'day'),
                }"
                :style="{
                  backgroundColor: singleDayEvent.color
                    ? lightenColor(singleDayEvent.color, 0.8)
                    : '#f5f5f5',
                  borderLeft: `3px solid ${singleDayEvent.color}`,
                  marginTop: eventIndex > 0 ? '4px' : '0px',
                }"
                @click="handleEventClick(singleDayEvent, $event)"
              >
                <div class="week-view__event-title">
                  {{ singleDayEvent.title }}
                </div>
              </div>
            </div>
          </template>

          <!-- 更多事件提示 -->
          <div
            v-if="!isAllDayExpanded && getMoreEventsCount(dateInfo.date) > 0"
            class="week-view__more-events-hint"
            @click="toggleAllDayExpanded"
          >
            还有{{ getMoreEventsCount(dateInfo.date) }}项
          </div>
        </div>
      </div>
    </div>

    <!-- 时间轴区域 -->
    <div class="week-view__timeline-section-container">
      <div class="week-view__timeline-section">
        <div class="week-view__time-labels">
          <div
            v-for="label in timeLabels"
            :key="label.time"
            class="week-view__time-label"
            :style="{ top: `${label.top}px` }"
          >
            {{ label.time }}
          </div>
        </div>

        <!-- 时间事件网格 -->
        <div
          v-for="dateInfo in weekRange"
          :key="dateInfo.date"
          class="week-view__time-column"
          @click="(e) => handleTimeColumnClick(e, dateInfo.date)"
        >
          <!-- 当前时间线 - 在每个时间列内显示 -->
          <div
            v-if="shouldShowCurrentTime"
            class="week-view__current-time-line"
            :class="{
              'week-view__current-time-line--past-date': dayjs(
                dateInfo.date
              ).isBefore(dayjs(), 'day'),
              'week-view__current-time-line--today': dateInfo.isToday,
            }"
            :style="{ top: `${currentTimeTop}px` }"
          />

          <!-- 时间事件 -->
          <div
            v-for="event in timeEventsByDate[dateInfo.date]"
            :key="event.id"
            class="week-view__event-block"
            :class="{
              'week-view__event-block--past': dayjs(dateInfo.date).isBefore(
                dayjs(),
                'day'
              ),
            }"
            :style="{
              top: `${event.top}px`,
              height: `${event.height}px`,
              backgroundColor: lightenColor(event.color, 0.8),
              borderLeft: `3px solid ${event.color}`,
              left: `calc(${event.overlapStyle?.left || '0%'})`,
              width: `calc(${event.overlapStyle?.width || '100%'})`,
              zIndex: event.overlapStyle?.zIndex || 1,
            }"
            @click.stop="handleEventClick(event, $event)"
          >
            <div class="week-view__event-title">{{ event.title }}</div>
            <div class="week-view__event-time">
              {{ formatEventTime(event.startTime, event.duration) }}
            </div>
          </div>

              <!-- 时间块 -->
    <div
      v-if="timeBlock?.date === dateInfo.date"
      class="week-view__time-block"
      :class="{
        'week-view__time-block--dragging': dragState.isDragging && dragState.currentBlock?.id === timeBlock.id,
        'week-view__time-block--resizing': dragState.isResizing && dragState.currentBlock?.id === timeBlock.id,
      }"
      :style="{
        top: `${timeBlock?.top}px`,
        height: `${timeBlock?.height}px`,
      }"
      @mousedown="handleTimeBlockMouseDown"
    >
            <div class="week-view__time-display">
              {{
                formatTimeBlockTime(
                  timeBlock?.startTime || 0,
                  timeBlock?.duration || 0
                )
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "./styles.scss";
</style>
