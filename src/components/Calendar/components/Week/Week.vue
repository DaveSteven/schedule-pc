<script setup lang="ts">
import { toRef } from "vue";
import dayjs from "dayjs";
import { useWeekView } from "./composables";
import { useColorUtils } from "../../hooks/useColorUtils";
import { useTimeUtils } from "../../hooks/useTimeUtils";
import type { WeekEvent } from "./types";

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
const { formatTimeDisplay } = useTimeUtils();

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

  emit("event-click", { event, el: targetElement });
};

// 格式化时间显示
const formatEventTime = (startTime: number, duration: number) => {
  const startFormatted = formatTimeDisplay(startTime);
  const endFormatted = formatTimeDisplay(startTime + duration);
  return `${startFormatted} - ${endFormatted}`;
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
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
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
                right: `-${(crossDayEvent.crossDayInfo!.spanDays - 1) * 100}%`,
                zIndex: 10,
                top: `${(crossDayEvent.rowIndex || 0) * 24}px`
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
              left: 0,
              width: `calc(${event.overlapStyle?.width || '100%'})`,
              zIndex: event.overlapStyle?.zIndex || 1,
            }"
            @click="handleEventClick(event, $event)"
          >
            <div class="week-view__event-title">{{ event.title }}</div>
            <div class="week-view__event-time">
              {{ formatEventTime(event.startTime, event.duration) }}
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
