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
          :data-date="dateInfo.date"
          :class="{
            'month-view__day-cell--today': dateInfo.isToday,
            'month-view__day-cell--other-month': !dateInfo.isCurrentMonth,
            'month-view__day-cell--weekend': dateInfo.isWeekend,
          }"
          @click="handleDateClick(dateInfo.date)"
        >
          <!-- 日期和农历并排显示 -->
          <div class="month-view__date-row">
            <span
              class="month-view__date-number"
              :class="{ first: dateInfo.dayNumber === 1 }"
              >{{ getDateDisplay(dateInfo) }}</span
            >
            <span class="month-view__lunar-date">{{ dateInfo.lunarDate }}</span>
          </div>

          <!-- 事件容器 -->
          <div
            class="month-view__events-container"
            :style="{
              position: 'relative',
              height: 'calc(100% - 62px)',
            }"
          >
            <!-- 临时事件（新创建的日程） -->
            <div
              v-for="tempEvent in getTempEventsForDate(dateInfo.date)"
              :key="`temp-${dateInfo.date}`"
              class="month-view__event month-view__event--temp"
              :data-event-id="tempEvent.id || `temp-${dateInfo.date}`"
              :class="{
                'month-view__event--new': true,
              }"
              :style="getTempEventStyle(dateInfo.date)"
              @click.stop="handleEventClick(tempEvent, $event)"
            >
              <div class="month-view__event-title">
                {{ tempEvent.title }}
              </div>
            </div>

            <!-- 跨天事件 -->
            <div
              v-for="crossDayEvent in getCrossDayEventsForDate(dateInfo.date)"
              :key="`cross-${crossDayEvent.id}-${dateInfo.date}`"
              :data-event-id="crossDayEvent.id"
              v-show="isEventVisible(crossDayEvent.rowIndex || 0)"
              class="month-view__event month-view__event--cross-day"
              :class="{
                'month-view__event--past': dayjs(dateInfo.date).isBefore(
                  dayjs(),
                  'day'
                ),
                'month-view__event--active': activeEventId === crossDayEvent.id,
              }"
              :style="getCrossDayEventStyle(crossDayEvent, dateInfo.date)"
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
              :data-event-id="event.id"
              v-show="
                isEventVisible(
                  getEventTopPosition(event, dateInfo.date, eventIndex)
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
              :style="getSingleDayEventStyle(event, dateInfo.date, eventIndex)"
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
            @click.stop="handleMoreEventsClick(dateInfo.date, $event)"
          >
            还有{{ getHiddenEventsCount(dateInfo.date) }}项
          </div>
        </div>
      </div>
    </div>

    <!-- 新增：事件表单弹窗 -->
    <EventPopover
      :visible="showForm"
      :target-element="targetEventElement"
      :width="440"
      @close="handleFormCancel"
    >
      <EventForm
        :data="eventFormData"
        @time-changed="handleFormTimeChanged"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </EventPopover>

    <EventPopover
      :visible="moreEvents"
      :target-element="moreElement"
      :width="300"
    >
      <div class="more-events-popover">
        <div class="more-events-popover__header">
          <h3 class="more-events-popover__title">
            {{ expandedDateTitle }} 的所有日程
          </h3>
          <button
            class="more-events-popover__close-btn"
            @click="closeMoreEvents"
          >
            ×
          </button>
        </div>
        <div class="more-events-popover__content">
          <div
            v-if="
              expandedDate &&
              getAllEventsForDate(expandedDate).allEvents.length === 0
            "
            class="more-events-popover__empty"
          >
            该日期暂无日程
          </div>
          <div
            v-else-if="expandedDate"
            class="more-events-popover__events-list"
          >
            <div
              v-for="event in getAllEventsForDate(expandedDate).allEvents"
              :key="event.id || `event-${event.title}`"
              class="more-events-popover__event-item"
              :class="{
                'more-events-popover__event-item--temp':
                  event.id && event.id.startsWith('temp_'),
                'more-events-popover__event-item--cross-day': event.isMultiDay,
                'more-events-popover__event-item--single-day':
                  !event.isMultiDay,
              }"
              @click="handleEventClick(event, $event)"
            >
              <div
                class="more-events-popover__event-color"
                :style="{ backgroundColor: event.color }"
              ></div>
              <div class="more-events-popover__event-content">
                <div class="more-events-popover__event-title">
                  {{ event.title }}
                </div>
                <div class="more-events-popover__event-time">
                  {{ getEventTimeDisplay(event) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EventPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import dayjs from "dayjs";
import { debounce } from "lodash";
import { lightenColor } from "../../utils/events";
import { getLunarDisplayText } from "../../utils/date";
import type { MonthProps, CalendarEmits } from "./types";
import type { EventItem } from "../../utils/events";
import { EventType } from "../../types/events";
import { createEventFromExisting } from "../../utils/eventFactory";
import EventPopover from "@/components/EventPopover/EventPopover.vue";
import EventForm from "@/components/EventForm/EventForm.vue";

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
const targetEventElement = ref<HTMLElement | null>(null);

// 新增：窗口尺寸状态，用于触发事件可视性重新计算
const windowSize = ref({
  width: window.innerWidth,
  height: window.innerHeight,
});

// 新增：本地events状态，用于管理临时事件
const localEvents = ref<EventItem[]>([...props.events]);

// 监听props.events变化，同步到localEvents
watch(
  () => props.events,
  (newEvents: EventItem[]) => {
    // 保留临时事件（临时ID的事件），但只保留一个
    const tempEvents = localEvents.value.filter(
      (event) => event.id && event.id.startsWith("temp_")
    );

    const uniqueTempEvent = tempEvents.length > 0 ? [tempEvents[0]] : [];

    // 更新localEvents，包含新的事件和唯一的临时事件
    localEvents.value = [...uniqueTempEvent, ...newEvents];
  },
  { deep: false } // 改为 false，避免深度监听导致的重复触发
);

// 新增：表单相关状态
const showForm = ref(false);
const eventFormData = ref<any>(null);

// 新增：更多事件展开相关状态
const moreEvents = ref(false);
const moreElement = ref<HTMLElement | null>(null);
const expandedDate = ref<string | null>(null);

// 计算属性
const weekDays = computed(() => ["日", "一", "二", "三", "四", "五", "六"]);

// 获取日期显示文本
const getDateDisplay = (dateInfo: any) => {
  if (dateInfo.dayNumber === 1) {
    const date = dayjs(dateInfo.date);
    const month = date.month() + 1; // dayjs的月份从0开始，需要+1
    const day = date.date();
    return `${month.toString()}月${day.toString()}日`;
  }
  return dateInfo.dayNumber;
};

// 确保临时事件唯一性的计算属性
const uniqueTempEvent = computed(() => {
  const tempEvents = localEvents.value.filter(
    (event) => event.id && event.id.startsWith("temp_")
  );
  return tempEvents.length > 0 ? tempEvents[0] : null;
});

const monthWeeks = computed(() => {
  const selectedDate = dayjs(props.selectedDate);
  const year = selectedDate.year();
  const month = selectedDate.month();

  // 获取当月第一天
  const firstDayOfMonth = dayjs(new Date(year, month, 1));
  // 获取当月最后一天
  const lastDayOfMonth = dayjs(new Date(year, month + 1, 0));

  // 获取当月第一天是周几（0是周日）
  const firstDayWeek = firstDayOfMonth.day();
  // 获取当月总天数
  const daysInMonth = lastDayOfMonth.date();

  // 计算需要显示的总天数（包括上月末尾和下月开头的日期）
  const totalDays = 42; // 6行 * 7列 = 42天

  // 计算上月末尾需要显示的天数
  const daysFromPrevMonth = firstDayWeek;

  // 计算下月开头需要显示的天数
  const daysFromNextMonth = totalDays - daysFromPrevMonth - daysInMonth;

  const weeks: any[] = [];
  let currentWeek: any[] = [];

  // 添加上月末尾的日期
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const date = firstDayOfMonth.subtract(i + 1, "day");
    currentWeek.push({
      date: date.format("YYYY-MM-DD"),
      dayNumber: date.date(),
      lunarDate: getLunarDisplayText({
        year: date.year(),
        month: date.month() + 1,
        day: date.date(),
      }),
      isCurrentMonth: false,
      isToday: date.isSame(dayjs(), "day"),
      isWeekend: date.day() === 0 || date.day() === 6,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // 添加当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = dayjs(new Date(year, month, day));
    currentWeek.push({
      date: date.format("YYYY-MM-DD"),
      dayNumber: day,
      lunarDate: getLunarDisplayText({
        year: date.year(),
        month: date.month() + 1,
        day: date.date(),
      }),
      isCurrentMonth: true,
      isToday: date.isSame(dayjs(), "day"),
      isWeekend: date.day() === 0 || date.day() === 6,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // 添加下月开头的日期
  for (let day = 1; day <= daysFromNextMonth; day++) {
    const date = lastDayOfMonth.add(day, "day");
    currentWeek.push({
      date: date.format("YYYY-MM-DD"),
      dayNumber: date.date(),
      lunarDate: getLunarDisplayText({
        year: date.year(),
        month: date.month() + 1,
        day: date.date(),
      }),
      isCurrentMonth: false,
      isToday: date.isSame(dayjs(), "day"),
      isWeekend: date.day() === 0 || date.day() === 6,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return weeks;
});

// 获取跨天事件
const getCrossDayEventsForDate = (date: string) => {
  console.log(`=== getCrossDayEventsForDate 开始 (${date}) ===`);
  console.log("当前 localEvents 数量:", localEvents.value.length);
  console.log(
    "临时事件数量:",
    localEvents.value.filter((e) => e.id && e.id.startsWith("temp_")).length
  );

  const crossDayEvents = localEvents.value
    .filter((event) => {
      // 排除临时事件（以temp_开头的ID）
      if (event.id && event.id.startsWith("temp_")) {
        console.log("排除临时事件:", event);
        return false;
      }

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

  console.log(`日期 ${date} 的跨天事件:`, crossDayEvents);
  console.log(`=== getCrossDayEventsForDate 结束 (${date}) ===`);
  return crossDayEvents;
};

// 获取单日事件（不区分全天还是特定时间，但排除跨天事件）
const getSingleDayEventsForDate = (date: string) => {
  console.log(`=== getSingleDayEventsForDate 开始 (${date}) ===`);
  console.log("当前 localEvents 数量:", localEvents.value.length);
  console.log(
    "临时事件数量:",
    localEvents.value.filter((e) => e.id && e.id.startsWith("temp_")).length
  );

  const singleDayEvents = localEvents.value.filter((event) => {
    // 排除临时事件（以temp_开头的ID）
    if (event.id && event.id.startsWith("temp_")) {
      console.log("排除临时事件:", event);
      return false;
    }

    // 排除跨天事件
    if (event.isMultiDay) return false;

    const eventStart = dayjs(event.start);
    const currentDate = dayjs(date);

    return eventStart.isSame(currentDate, "day");
  });

  console.log(`日期 ${date} 的单日事件:`, singleDayEvents);
  console.log(`=== getSingleDayEventsForDate 结束 (${date}) ===`);
  return singleDayEvents;
};

// 新增：智能垂直排列算法（支持新日程置顶）
const calculateEventPositions = (date: string) => {
  const crossDayEvents = getCrossDayEventsForDate(date);
  const singleDayEvents = getSingleDayEventsForDate(date);

  // 检查当前日期所在的行（同一周）是否有临时事件
  const currentWeek = dayjs(date).startOf("week");
  const tempEvent = uniqueTempEvent.value;
  const hasTempEvent =
    tempEvent && dayjs(tempEvent.start).startOf("week").isSame(currentWeek);

  // 创建时间槽位映射
  const timeSlots: { [key: number]: boolean } = {};
  const eventPositions: { [key: string]: number } = {};

  // 如果当前行有临时事件，先占用第一个槽位（置顶）
  if (hasTempEvent) {
    timeSlots[0] = true;
    // 临时事件使用 id 为 'temp' 来标识
    eventPositions["temp"] = 0;
  }

  // 处理跨天事件（在临时事件下方，也要向下移动）
  crossDayEvents.forEach((event, index) => {
    let slotIndex = hasTempEvent ? index + 1 : index;
    timeSlots[slotIndex] = true;
    eventPositions[event.id || `cross-${index}`] = slotIndex * 20;
  });

  // 处理单日事件（寻找可用槽位，也要向下移动）
  singleDayEvents.forEach((event, index) => {
    let slotIndex = 0;

    // 寻找第一个可用槽位
    while (timeSlots[slotIndex]) {
      slotIndex++;
    }

    timeSlots[slotIndex] = true;
    eventPositions[event.id || `single-${index}`] = slotIndex * 20;
  });

  return eventPositions;
};

// 新增：获取跨天事件样式
const getCrossDayEventStyle = (event: EventItem, date: string) => {
  const positions = calculateEventPositions(date);
  const eventId = event.id || `cross-${event.title}`;
  const top = positions[eventId] || 0;

  return {
    backgroundColor: event.color ? lightenColor(event.color, 0.8) : "#f5f5f5",
    borderLeft: `3px solid ${event.color}`,
    position: "absolute" as const,
    left: 0,
    width: event.crossDayInfo?.spanDays
      ? `${event.crossDayInfo.spanDays * 100}%`
      : "100%",
    zIndex: 10,
    top: `${top}px`,
  };
};

// 新增：获取单日事件样式
const getSingleDayEventStyle = (
  event: EventItem,
  date: string,
  eventIndex: number
) => {
  const positions = calculateEventPositions(date);
  const eventId = event.id || `single-${eventIndex}`;
  const top = positions[eventId] || 0;

  return {
    backgroundColor: event.color ? lightenColor(event.color, 0.8) : "#f5f5f5",
    borderLeft: `3px solid ${event.color}`,
    position: "absolute" as const,
    left: 0,
    right: 0,
    zIndex: 5,
    top: `${top}px`,
  };
};

// 新增：获取事件顶部位置
const getEventTopPosition = (
  event: EventItem,
  date: string,
  eventIndex: number
) => {
  const positions = calculateEventPositions(date);
  const eventId = event.id || `single-${eventIndex}`;
  return positions[eventId] || 0;
};

// 新增：获取跨天事件顶部位置
const getCrossDayEventTopPosition = (
  event: EventItem,
  date: string,
  eventIndex: number
) => {
  const positions = calculateEventPositions(date);
  const eventId = event.id || `cross-${eventIndex}`;
  return positions[eventId] || 0;
};

// 获取隐藏的事件数量（改为计算属性，响应窗口大小变化）
const getHiddenEventsCount = computed(() => {
  return (date: string) => {
    const singleDayEvents = getSingleDayEventsForDate(date);
    const crossDayEvents = getCrossDayEventsForDate(date);

    // 依赖windowSize状态，当窗口大小变化时自动重新计算
    // const currentWindowSize = windowSize.value;

    // 计算总事件数（只考虑当前行是否有临时事件）
    const currentWeek = dayjs(date).startOf("week");
    const tempEvent = uniqueTempEvent.value;
    const hasTempEvent =
      tempEvent && dayjs(tempEvent.start).startOf("week").isSame(currentWeek);
    const totalEvents =
      singleDayEvents.length + crossDayEvents.length + (hasTempEvent ? 1 : 0);

    // 计算可见的事件数
    let visibleCount = 0;

    // 计算可见的跨天事件数量
    crossDayEvents.forEach((_event, index) => {
      const topPosition = getCrossDayEventTopPosition(_event, date, index);
      if (isEventVisible(topPosition)) {
        visibleCount++;
      }
    });

    // 计算可见的单日事件数量
    singleDayEvents.forEach((_event, eventIndex) => {
      const topPosition = getEventTopPosition(_event, date, eventIndex);
      if (isEventVisible(topPosition)) {
        visibleCount++;
      }
    });

    // 如果当前行有临时事件，也要计算
    if (hasTempEvent) {
      visibleCount++;
    }

    // 隐藏数量 = 总数量 - 可见数量
    return Math.max(0, totalEvents - visibleCount);
  };
});

// 检查事件是否在可视范围内
const isEventVisible = (topPosition: number) => {
  // 依赖windowSize状态，当窗口大小变化时自动重新计算
  // const currentWindowSize = windowSize.value;

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

// 修改：处理日期点击
const handleDateClick = (date: string) => {
  // 检查是否已经存在临时事件
  const existingTempEvent = uniqueTempEvent.value;
  if (existingTempEvent) {
    console.log("发现已存在的临时事件:", existingTempEvent);
    // 如果已有临时事件，直接显示表单
    showForm.value = true;
    eventFormData.value = {
      start: existingTempEvent.start,
      end: existingTempEvent.end,
      title: "",
      allDay: false,
    };
    return;
  }

  // 清除所有现有的临时事件（确保只有一个）
  localEvents.value = localEvents.value.filter(
    (event) => !event.id || !event.id.startsWith("temp_")
  );

  // 创建新的事件对象（没有id，表示是临时事件）
  const tempId = `temp_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const newEvent: EventItem = {
    id: tempId, // 生成临时ID
    title: "添加主题",
    start: dayjs(date).add(9, "hour").format("YYYY-MM-DD HH:mm"),
    end: dayjs(date).add(10, "hour").format("YYYY-MM-DD HH:mm"),
    color: "#e9d8ff",
    sourceType: 1, // 日程
    openScopeType: 3, // 仅个人可见
    allDay: false,
    isMultiDay: false,
    // 使用临时ID，但标记为临时事件
  };

  console.log("创建新临时事件:", newEvent);

  // 将新事件添加到本地events数组的开头（置顶显示）
  localEvents.value = [newEvent, ...localEvents.value];
  console.log("添加临时事件后，localEvents 数量:", localEvents.value.length);
  console.log(
    "临时事件数量:",
    localEvents.value.filter((e) => e.id && e.id.startsWith("temp_")).length
  );

  // 获取对应的DOM元素
  nextTick(() => {
    // 通过临时事件ID找到对应的DOM元素
    const tempEventElement = getTempEventElement(tempId);
    if (tempEventElement) {
      console.log("找到对应的临时事件元素:", tempEventElement);
      // 设置表单的目标元素
      targetEventElement.value = tempEventElement;
    } else {
      console.warn("未找到对应的临时事件元素，尝试通过日期查找");
      // 如果没找到，尝试通过日期查找
      const dateElement = getDateElement(date);
      if (dateElement) {
        console.log("找到对应的日期元素:", dateElement);
        targetEventElement.value = dateElement;
      }
    }

    // 显示表单
    setTimeout(() => {
      showForm.value = true;
      // 设置表单数据
      eventFormData.value = {
        start: newEvent.start,
        end: newEvent.end,
        title: "",
        allDay: false,
      };
    }, 20);
  });

  emit(EventType.DATE_CHANGE, { date });
  console.log("=== handleDateClick 结束 ===");
};

// 新增：处理表单取消
const handleFormCancel = () => {
  // 使用计算属性获取临时事件
  const tempEvent = uniqueTempEvent.value;
  if (tempEvent) {
    // 删除临时事件（临时ID的事件）
    const tempEventIndex = localEvents.value.findIndex(
      (event) => event.id && event.id.startsWith("temp_")
    );
    if (tempEventIndex !== -1) {
      localEvents.value.splice(tempEventIndex, 1);
      console.log("临时事件已删除");
    }
  }

  // 清空状态
  showForm.value = false;
  eventFormData.value = null;
};

// 新增：处理表单提交
const handleFormSubmit = (formData: any) => {
  // 使用计算属性获取临时事件
  const tempEvent = uniqueTempEvent.value;
  if (tempEvent) {
    // 找到临时事件的索引
    const tempEventIndex = localEvents.value.findIndex(
      (event) => event.id && event.id.startsWith("temp_")
    );
    if (tempEventIndex !== -1) {
      // 使用 splice 来更新事件，避免直接赋值触发响应式更新
      const updatedEvent = {
        ...tempEvent,
        id: Date.now().toString(),
        title: formData.title || "新事件",
        start: formData.start,
        end: formData.end,
      };

      localEvents.value.splice(tempEventIndex, 1, updatedEvent);
      console.log("临时事件已更新为正式事件:", updatedEvent);
    }
  }

  // 清空状态
  showForm.value = false;
  eventFormData.value = null;
};

// 新增：处理表单时间变化
const handleFormTimeChanged = (timeData: any) => {
  if (timeData.start && timeData.end) {
    // 使用计算属性获取临时事件
    const tempEvent = uniqueTempEvent.value;
    if (tempEvent) {
      // 找到临时事件的索引
      const tempEventIndex = localEvents.value.findIndex(
        (event) => event.id && event.id.startsWith("temp_")
      );
      if (tempEventIndex !== -1) {
        // 使用 splice 来更新事件，避免直接赋值触发响应式更新
        const updatedEvent = {
          ...tempEvent,
          start: timeData.start,
          end: timeData.end,
        };

        localEvents.value.splice(tempEventIndex, 1, updatedEvent);
        console.log("临时事件时间已更新:", updatedEvent);
      }
    }
  }
};

// 处理事件点击
const handleEventClick = (event: EventItem, e: MouseEvent) => {
  const targetElement = e.currentTarget as HTMLElement;
  activeEventId.value = event.id || null;

  // 将EventItem转换为BaseEventData格式，缺失字段设为undefined
  const baseEvent = createEventFromExisting(event);
  emit(EventType.EVENT_CLICK, { event: baseEvent, el: targetElement });
};

// 处理更多事件点击
const handleMoreEventsClick = (date: string, e: MouseEvent) => {
  // 设置展开状态
  expandedDate.value = date;
  moreElement.value = e.currentTarget as HTMLElement;
  moreEvents.value = true;

  console.log("展开更多事件:", date);
};

// 新增：获取指定日期的所有事件（用于更多事件弹窗）
const getAllEventsForDate = (date: string) => {
  const tempEvents = getTempEventsForDate(date);
  const crossDayEvents = getCrossDayEventsForDate(date);
  const singleDayEvents = getSingleDayEventsForDate(date);

  return {
    tempEvents,
    crossDayEvents,
    singleDayEvents,
    allEvents: [...tempEvents, ...crossDayEvents, ...singleDayEvents],
  };
};

// 新增：关闭更多事件弹窗
const closeMoreEvents = () => {
  moreEvents.value = false;
  expandedDate.value = null;
  moreElement.value = null;
};

// 新增：获取临时事件
const getTempEventsForDate = (date: string) => {
  console.log(`=== getTempEventsForDate 开始 (${date}) ===`);
  console.log("当前 localEvents 数量:", localEvents.value.length);

  // 使用计算属性获取唯一的临时事件
  const tempEvent = uniqueTempEvent.value;
  console.log("计算属性返回的临时事件:", tempEvent);

  if (!tempEvent) {
    console.log("没有临时事件，返回空数组");
    console.log(`=== getTempEventsForDate 结束 (${date}) ===`);
    return [];
  }

  // 获取临时事件所在的日期
  const tempEventDate = dayjs(tempEvent.start).format("YYYY-MM-DD");
  console.log("临时事件日期:", tempEventDate, "请求日期:", date);

  // 临时事件只在它被创建的日期单元格显示
  if (dayjs(date).isSame(tempEventDate, "day")) {
    console.log("日期匹配，返回临时事件");
    console.log(`=== getTempEventsForDate 结束 (${date}) ===`);
    // 确保只返回一个临时事件
    return [tempEvent];
  }

  console.log("日期不匹配，返回空数组");
  console.log(`=== getTempEventsForDate 结束 (${date}) ===`);
  return [];
};

// 新增：通过日期获取对应的DOM元素
const getDateElement = (date: string): HTMLElement | null => {
  if (!containerRef.value) {
    console.warn("containerRef 未初始化");
    return null;
  }

  // 查找包含指定日期的元素
  const dateSelector = `[data-date="${date}"]`;
  const dateElement = containerRef.value.querySelector(
    dateSelector
  ) as HTMLElement;

  if (dateElement) {
    console.log(`找到日期 ${date} 对应的DOM元素:`, dateElement);
    return dateElement;
  }

  // 如果没找到，尝试通过其他方式查找
  const allDateElements = containerRef.value.querySelectorAll(
    ".month-view__day-cell"
  );
  for (const element of allDateElements) {
    const elementDate = element.getAttribute("data-date");
    if (elementDate === date) {
      console.log(`通过遍历找到日期 ${date} 对应的DOM元素:`, element);
      return element as HTMLElement;
    }
  }

  console.warn(`未找到日期 ${date} 对应的DOM元素`);
  return null;
};

// 新增：通过临时事件ID获取对应的DOM元素
const getTempEventElement = (tempId: string): HTMLElement | null => {
  if (!containerRef.value) {
    console.warn("containerRef 未初始化");
    return null;
  }

  // 通过临时事件ID查找对应的DOM元素
  const eventSelector = `[data-event-id="${tempId}"]`;
  const eventElement = containerRef.value.querySelector(
    eventSelector
  ) as HTMLElement;

  if (eventElement) {
    console.log(`找到临时事件ID ${tempId} 对应的DOM元素:`, eventElement);
    return eventElement;
  }

  console.warn(`未找到临时事件ID ${tempId} 对应的DOM元素`);
  return null;
};

// 新增：获取临时事件样式
const getTempEventStyle = (date: string) => {
  const positions = calculateEventPositions(date);

  // 临时事件使用 'temp' 作为标识
  const top = positions["temp"] || 0;

  const style = {
    zIndex: 15, // 确保临时事件在最顶部
    top: `${top}px`,
  };

  return style;
};

// 计算属性：更多事件弹窗标题
const expandedDateTitle = computed(() => {
  if (!expandedDate.value) return "";
  return dayjs(expandedDate.value).format("M月D日");
});

// 新增：获取事件时间显示
const getEventTimeDisplay = (event: EventItem) => {
  if (event.allDay) {
    return "全天";
  }
  return `${dayjs(event.start).format("HH:mm")} - ${dayjs(event.end).format(
    "HH:mm"
  )}`;
};

// 生命周期
onMounted(() => {
  // 清理重复的临时事件
  const tempEvents = localEvents.value.filter(
    (event) => event.id && event.id.startsWith("temp_")
  );
  if (tempEvents.length > 1) {
    // 只保留第一个临时事件
    const uniqueTempEvent = tempEvents[0];
    localEvents.value = [
      uniqueTempEvent,
      ...localEvents.value.filter(
        (event) => !event.id || !event.id.startsWith("temp_")
      ),
    ];
  }

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

  // 添加窗口resize监听器（带防抖）
  const handleResize = debounce(() => {
    console.log("窗口大小变化，重新计算事件可视性");
    // 更新窗口尺寸状态，触发响应式更新
    windowSize.value = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, 100); // 100ms防抖

  window.addEventListener("resize", handleResize);

  // 清理函数
  onUnmounted(() => {
    document.removeEventListener("click", handleGlobalClick);
    window.removeEventListener("resize", handleResize);
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

    &:last-child {
      border-right: none;
    }

    .month-view__date-number {
      width: 30px;
      height: 30px;
      border-radius: 50px;
      text-align: center;
      line-height: 30px;

      &.first {
        width: auto;
      }
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
    overflow: hidden; // 防止事件溢出
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
    user-select: none;
    height: 18px; // 固定高度
    box-sizing: border-box;

    &:hover {
      transition: all 0.3s ease;
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
      z-index: 10;
      height: 18px;
    }

    // 单日事件样式
    &--single-day {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 5;
      height: 18px;
    }

    // 临时事件样式
    &--temp {
      position: absolute;
      left: 0;
      z-index: 10;
      height: 18px;
    }

    // 过去事件样式
    &--past {
      opacity: 0.6;

      .month-view__event-title {
        color: #6b7280;
      }

      &:hover {
        opacity: 0.8;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }

    &--new {
      width: 100%;
      background-color: #e9d8ff;
      border-left: none;
      border: 1px solid #9f58ff;
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
    margin-top: 2px;

    &:hover {
      color: #666;
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}

.more-events-popover {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e8e8e8;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  &__close-btn {
    background-color: #f0f0f0;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #888;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #e0e0e0;
      color: #555;
    }
  }

  &__content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  &__empty {
    text-align: center;
    color: #999;
    font-size: 14px;
    padding: 20px 0;
  }

  &__events-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__event-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
    }

    &--temp {
      background-color: #f0f7eb;
      border: 1px solid #67c23a;
    }

    &--cross-day {
      background-color: #e1f3d8;
      border: 1px solid #67c23a;
    }

    &--single-day {
      background-color: #e1f3d8;
      border: 1px solid #67c23a;
    }
  }

  &__event-color {
    width: 8px;
    height: 100%;
    border-radius: 4px 0 0 4px;
    margin-right: 12px;
  }

  &__event-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__event-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__event-time {
    font-size: 12px;
    color: #666;
    line-height: 1.2;
  }
}
</style>
