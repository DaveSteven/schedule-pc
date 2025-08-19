<template>
  <div class="month-view" ref="containerRef">
    <!-- 月视图头部 - 周日到周六 -->
    <div class="month-view__header">
      <div
        v-for="dayOfWeek in weekDays"
        :key="dayOfWeek"
        class="month-view__day-header"
      >
        {{ dayOfWeek }}
      </div>
    </div>

    <!-- 月视图主体 - 固定6行日期网格 -->
    <div class="month-view__body">
      <div
        v-for="(week, weekIndex) in monthWeeks"
        :key="weekIndex"
        class="month-view__week-row"
      >
        <div
          v-for="(dateInfo, dayIndex) in week"
          :key="`${weekIndex}-${dayIndex}`"
          class="month-view__day-cell"
          :class="{
            'month-view__day-cell--today': dateInfo.isToday,
            'month-view__day-cell--other-month': !dateInfo.isCurrentMonth,
            'month-view__day-cell--weekend': dateInfo.isWeekend,
          }"
          @click="handleDateClick(dateInfo.date)"
        >
          <!-- 日期和农历并排显示 -->
          <div class="month-view__date-row">
            <span class="month-view__date-number">{{
              dateInfo.dayNumber
            }}</span>
            <span class="month-view__lunar-date">{{ dateInfo.lunarDate }}</span>
          </div>

          <!-- 事件容器 -->
          <div
            class="month-view__events-container"
            :style="{
              display: 'flow-root',
            }"
          >
            <!-- 跨天事件 -->
            <div
              v-for="crossDayEvent in getCrossDayEventsForDate(dateInfo.date)"
              :key="`cross-${crossDayEvent.id}-${dateInfo.date}`"
              v-show="isEventVisible(crossDayEvent.rowIndex || 0)"
              class="month-view__event month-view__event--cross-day"
              :class="{
                'month-view__event--past': dayjs(dateInfo.date).isBefore(
                  dayjs(),
                  'day'
                ),
                'month-view__event--active': activeEventId === crossDayEvent.id,
              }"
              :style="{
                backgroundColor: crossDayEvent.color
                  ? lightenColor(crossDayEvent.color, 0.8)
                  : '#f5f5f5',
                borderLeft: `3px solid ${crossDayEvent.color}`,
                position: 'absolute',
                left: 0,
                width: crossDayEvent.crossDayInfo?.spanDays
                  ? `${crossDayEvent.crossDayInfo.spanDays * 100}%`
                  : '100%',
                zIndex: 10,
                top: `${(crossDayEvent.rowIndex || 0) * 20}px`,
              }"
              @click.stop="handleEventClick(crossDayEvent, $event)"
            >
              <div class="month-view__event-title">
                {{ crossDayEvent.title }}
              </div>
            </div>

            <!-- 单日事件 -->
            <div
              v-for="(event, eventIndex) in getSingleDayEventsForDate(
                dateInfo.date
              )"
              :key="`single-${event.id}-${dateInfo.date}`"
              v-show="
                isEventVisible(
                  getMarginTopForSingleDayEvent(dateInfo.date) + eventIndex * 22
                )
              "
              class="month-view__event month-view__event--single-day"
              :class="{
                'month-view__event--past': dayjs(dateInfo.date).isBefore(
                  dayjs(),
                  'day'
                ),
                'month-view__event--active': activeEventId === event.id,
              }"
              :style="{
                backgroundColor: event.color
                  ? lightenColor(event.color, 0.8)
                  : '#f5f5f5',
                borderLeft: `3px solid ${event.color}`,
                marginTop:
                  eventIndex === 0
                    ? `${getMarginTopForSingleDayEvent(dateInfo.date)}px`
                    : 0,
              }"
              @click.stop="handleEventClick(event, $event)"
            >
              <div class="month-view__event-title">
                {{ event.title }}
              </div>
            </div>
          </div>

          <!-- 更多事件提示 -->
          <div
            v-if="getHiddenEventsCount(dateInfo.date) > 0"
            class="month-view__more-events-hint"
            @click.stop="handleMoreEventsClick(dateInfo.date)"
          >
            还有{{ getHiddenEventsCount(dateInfo.date) }}项
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import dayjs from "dayjs";
import { lightenColor } from "../../utils/events";
import { getLunarDisplayText } from "../../utils/date";
import type { MonthProps, CalendarEmits } from "./types";
import type { EventItem } from "../../utils/events";
import { EventType, type BaseEventData } from "../../types/events";

// Props
const props = withDefaults(defineProps<MonthProps>(), {
  selectedDate: () => dayjs().format("YYYY-MM-DD"),
  events: () => [],
});

// Emits
const emit = defineEmits<CalendarEmits>();

// 响应式数据
const containerRef = ref<HTMLElement | null>(null);
const activeEventId = ref<string | null>(null);

// 周几标签
const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 计算月视图的日期网格
const monthWeeks = computed(() => {
  const selectedDate = dayjs(props.selectedDate);
  const year = selectedDate.year();
  const month = selectedDate.month();

  // 获取当月第一天
  const firstDayOfMonth = dayjs(new Date(year, month, 1));

  // 获取当月第一天是周几（0-6，0是周日）
  const firstDayWeek = firstDayOfMonth.day();

  // 计算需要显示的开始日期（往前推到周日）
  const startDate = firstDayOfMonth.subtract(firstDayWeek, "day");

  // 固定6行，每行7天
  const weeks: Array<
    Array<{
      date: string;
      dayNumber: number;
      lunarDate: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }>
  > = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const week: Array<{
      date: string;
      dayNumber: number;
      lunarDate: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = startDate.add(weekIndex * 7 + dayIndex, "day");
      const dateStr = currentDate.format("YYYY-MM-DD");

      week.push({
        date: dateStr,
        dayNumber: currentDate.date(),
        lunarDate: getLunarDisplayText({
          year: currentDate.year(),
          month: currentDate.month() + 1,
          day: currentDate.date(),
        }),
        isCurrentMonth: currentDate.month() === month,
        isToday: currentDate.isSame(dayjs(), "day"),
        isWeekend: currentDate.day() === 0 || currentDate.day() === 6,
      });
    }

    weeks.push(week);
  }

  return weeks;
});

// 获取跨天事件
const getCrossDayEventsForDate = (date: string) => {
  return props.events
    .filter((event) => {
      if (!event.isMultiDay) return false;

      const eventStart = dayjs(event.start);
      const currentDate = dayjs(date);

      // 跨天事件仅在第一天展示
      return eventStart.isSame(currentDate, "day");
    })
    .map((event, index) => ({
      ...event,
      rowIndex: index,
      crossDayInfo: {
        spanDays: dayjs(event.end).diff(dayjs(event.start), "day") + 1,
      },
    }));
};

// 获取单日事件（不区分全天还是特定时间，但排除跨天事件）
const getSingleDayEventsForDate = (date: string) => {
  return props.events.filter((event) => {
    // 排除跨天事件
    if (event.isMultiDay) return false;

    const eventStart = dayjs(event.start);
    const currentDate = dayjs(date);

    return eventStart.isSame(currentDate, "day");
  });
};

// 获取隐藏的事件数量
const getHiddenEventsCount = (date: string) => {
  const singleDayEvents = getSingleDayEventsForDate(date);
  const crossDayEvents = getCrossDayEventsForDate(date);

  // 计算总事件数
  const totalEvents = singleDayEvents.length + crossDayEvents.length;

  // 计算可见的事件数
  let visibleCount = 0;

  // 计算可见的跨天事件数量
  crossDayEvents.forEach((_event, index) => {
    if (isEventVisible(index * 20)) {
      visibleCount++;
    }
  });

  // 计算可见的单日事件数量
  singleDayEvents.forEach((_event, eventIndex) => {
    const topPosition = getMarginTopForSingleDayEvent(date) + eventIndex * 22;
    if (isEventVisible(topPosition)) {
      visibleCount++;
    }
  });

  console.log(date, "totalEvents", totalEvents, "visibleCount", visibleCount);

  // 隐藏数量 = 总数量 - 可见数量
  return Math.max(0, totalEvents - visibleCount);
};

// 计算单日事件的marginTop，避免被跨天事件覆盖
const getMarginTopForSingleDayEvent = (date: string) => {
  // 获取所有跨天事件，包括跨越当前日期的
  const crossDayEvents = props.events.filter((event) => {
    if (!event.isMultiDay) return false;

    const eventStart = dayjs(event.start);
    const eventEnd = dayjs(event.end);
    const currentDate = dayjs(date);

    // 检查当前日期是否在跨天事件的范围内
    return currentDate.isBetween(eventStart, eventEnd, "day", "[]");
  });

  if (crossDayEvents.length === 0) {
    return 0;
  }

  console.log(date, crossDayEvents.length);

  // 每个跨天事件占用20px高度
  return crossDayEvents.length * 20;
};

// 检查事件是否在可视范围内
const isEventVisible = (topPosition: number) => {
  if (!containerRef.value) return true;

  const dayCell = containerRef.value.querySelector(
    ".month-view__events-container"
  );
  if (!dayCell) return true;

  const containerHeight = dayCell.clientHeight;
  const eventHeight = 18; // 事件高度
  const availableHeight = containerHeight;

  // 检查事件是否在可视范围内
  const eventTop = topPosition;
  const eventBottom = eventTop + eventHeight;

  return eventTop >= 0 && eventBottom <= availableHeight;
};

// 处理日期点击
const handleDateClick = (date: string) => {
  emit(EventType.DATE_CHANGE, { date });
};

// 处理事件点击
const handleEventClick = (event: EventItem, e: MouseEvent) => {
  const targetElement = e.currentTarget as HTMLElement;
  activeEventId.value = event.id || null;

  // 将EventItem转换为BaseEventData格式，缺失字段设为undefined
  const baseEvent: BaseEventData = {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    color: event.color,
    sourceType: event.sourceType,
    openScopeType: event.openScopeType,
    tuCname: event.tuCname,
    scheduleType: event.scheduleType,
    allDay: event.allDay,
    roomName: event.roomName,
    self: event.self,
    remindType: event.remindType,
    isTechEvent: event.isTechEvent,
    isMultiDay: event.isMultiDay,
    ids: event.ids,
  };
  emit(EventType.EVENT_CLICK, { event: baseEvent, el: targetElement });
};

// 处理更多事件点击
const handleMoreEventsClick = (date: string) => {
  // 可以在这里实现展开逻辑
  console.log("展开更多事件:", date);
};

// 生命周期
onMounted(() => {
  // 不再需要计算可视事件数量，因为使用动态可视性检查

  // 添加全局点击事件监听器
  const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // 清空activeEventId
    if (!target.closest(".month-view__event")) {
      activeEventId.value = null;
    }
  };

  document.addEventListener("click", handleGlobalClick);

  // 清理函数
  onUnmounted(() => {
    document.removeEventListener("click", handleGlobalClick);
  });
});
</script>

<style lang="scss" scoped>
.month-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #fff;
  overflow: hidden;

  * {
    box-sizing: border-box;
  }

  // 月视图头部样式
  &__header {
    display: flex;
    border-bottom: 1px solid #e8e8e8;
  }

  &__day-header {
    flex: 1;
    padding: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #666;

    &:last-child {
      border-right: none;
    }
  }

  // 月视图主体样式
  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__week-row {
    display: flex;
    height: calc(100% / 6); // 固定行高，平均分配父容器高度
    border-bottom: 1px solid #e2e8f0;

    &:last-child {
      border-bottom: none;
    }
  }

  &__day-cell {
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    height: 100%; // 继承父行的高度
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:last-child {
      border-right: none;
    }

    .month-view__date-number {
      width: 30px;
      height: 30px;
      border-radius: 50px;
      text-align: center;
      line-height: 30px;
    }

    // 今天样式
    &--today {
      background-color: #f5f5f5;

      .month-view__date-number {
        background-color: var(--el-color-primary);
        color: #fff;
        font-weight: 600;
      }
    }

    // 非当月日期样式
    &--other-month {
      opacity: 0.4;
      background-color: #fafafa;

      .month-view__date-number,
      .month-view__lunar-date {
        color: #9ca3af;
      }
    }

    // 周末样式
    &--weekend {
      background-color: #fefefe;
    }
  }

  &__date-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px;
  }

  &__date-number {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
    line-height: 1;
  }

  &__lunar-date {
    font-size: 12px;
    color: #6b7280;
    line-height: 1;
  }

  // 事件容器样式
  &__events-container {
    position: relative;
    height: calc(100% - 62px);
  }

  // 事件样式
  &__event {
    padding: 2px 6px;
    border-radius: 3px;
    color: #333;
    font-size: 10px;
    line-height: 1.2;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    margin-bottom: 2px;
    height: 18px; // 固定高度
    box-sizing: border-box;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    // 选中状态样式
    &--active {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
    }

    // 跨天事件样式
    &--cross-day {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 10;
      height: 18px; // 固定高度
    }

    // 单日事件样式
    &--single-day {
      position: relative;
      z-index: 5;
    }

    // 过去事件样式
    &--past {
      opacity: 0.6;

      .month-view__event-title {
        color: #6b7280;
      }

      &:hover {
        opacity: 0.8;
        transform: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }
  }

  &__event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    min-width: 0;
    font-weight: 500;
  }

  // 更多事件提示样式
  &__more-events-hint {
    font-size: 10px;
    color: #8c8c8c;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: color 0.2s ease;
    margin-top: 2px;

    &:hover {
      color: #666;
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
