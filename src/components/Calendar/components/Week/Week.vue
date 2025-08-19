<script setup lang="ts">
import { toRef, ref, nextTick, watch, computed } from "vue";
import dayjs from "dayjs";
import { useWeekView } from "./composables";
import { useColorUtils } from "../../hooks/useColorUtils";
import type { WeekEvent, TimeBlock } from "./types";
import EventForm from "@/components/EventForm/EventForm.vue";
import EventPopover from "@/components/EventPopover/EventPopover.vue";

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
  protectedClearTimeBlock,
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

// 添加一个受保护的清空函数
const safeClearTimeBlock = () => {
  // 在拖拽过程中，保护 timeBlock 不被清空
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("拖拽过程中，阻止清空 timeBlock");
    return;
  }

  // 检查是否刚刚完成拖拽
  if (dragState.value.lastDragEndTime) {
    const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
    if (timeSinceDrag < 1000) {
      console.log(`拖拽刚结束 ${timeSinceDrag}ms，阻止清空 timeBlock`);
      return;
    }
  }

  console.log("安全清空 timeBlock");
  clearTimeBlock();
};

// 创建一个受保护的 timeBlock 引用
const protectedTimeBlock = computed({
  get: () => timeBlock.value,
  set: (newValue) => {
    // 如果尝试设置为 null 且正在拖拽，则阻止
    if (
      newValue === null &&
      (dragState.value.isDragging || dragState.value.isResizing)
    ) {
      console.log("拖拽过程中，阻止 timeBlock 被设置为 null");
      return;
    }

    // 如果尝试设置为 null 且刚刚完成拖拽，则阻止
    if (newValue === null && dragState.value.lastDragEndTime) {
      const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
      if (timeSinceDrag < 1000) {
        console.log(
          `拖拽刚结束 ${timeSinceDrag}ms，阻止 timeBlock 被设置为 null`
        );
        return;
      }
    }

    // 允许设置值
    timeBlock.value = newValue;
  },
});

// 表单相关状态
const showForm = ref(false);
const eventFormData = ref<any>(null);
const formTargetElement = ref<HTMLElement | null>(null);
const timeBlockElement = ref<HTMLElement | null>(null);

// 添加一个变量来记录拖动开始时的原始时间块信息
const originalTimeBlockInfo = ref<any>(null);

// 计算时间块的左侧位置（用于绝对定位）
const getTimeBlockLeftPosition = (date: string) => {
  const dateIndex = weekRange.value.findIndex((d) => d.date === date);
  if (dateIndex === -1) return 0;

  // 由于时间列使用 flex: 1，我们需要计算实际的列宽
  // 这里我们使用容器的总宽度除以列数来计算每列的宽度
  const container = document.querySelector(".week-view__time-column-container");
  if (container) {
    const containerWidth = container.clientWidth;
    const columnCount = weekRange.value.length;
    const columnWidth = containerWidth / columnCount;
    return dateIndex * columnWidth;
  }

  // 如果无法获取容器，使用估算值
  return dateIndex * 200;
};

// 获取时间列的宽度
const getTimeColumnWidth = () => {
  // 动态计算列宽
  const container = document.querySelector(".week-view__time-column-container");
  if (container) {
    const containerWidth = container.clientWidth;
    const columnCount = weekRange.value.length;
    return containerWidth / columnCount;
  }

  // 如果无法获取容器，使用估算值
  return 200;
};

// 添加调试日志
console.log("Week component props:", {
  selectedDate: props.selectedDate,
  events: props.events,
  eventsLength: props.events?.length || 0,
});

// 处理表单时间变化
const handleFormTimeChanged = (timeData: { start: string; end: string }) => {
  console.log("Week: 表单时间变化:", timeData);

  if (timeBlock.value) {
    // 使用 timeBlock 对应的日期，而不是 selectedDate
    const blockDate = timeBlock.value.date;
    console.log("Week: 使用时间块日期:", blockDate);
    console.log("Week: selectedDate:", props.selectedDate);

    const startMinutes = dayjs(timeData.start).diff(
      dayjs(blockDate).startOf("day"),
      "minute"
    );
    const endMinutes = dayjs(timeData.end).diff(
      dayjs(blockDate).startOf("day"),
      "minute"
    );

    console.log("Week: 计算的时间分钟数:", {
      startMinutes,
      endMinutes,
      blockDate,
      startTime: timeData.start,
      endTime: timeData.end,
      blockDateStart: dayjs(blockDate).startOf("day").format(),
    });

    // 使用 Object.assign 来更新 timeBlock，避免触发响应式系统的重新计算
    Object.assign(timeBlock.value, {
      startTime: startMinutes,
      duration: endMinutes - startMinutes,
      top: startMinutes,
      height: endMinutes - startMinutes,
    });

    console.log("Week: 更新后的 timeBlock:", timeBlock.value);
  } else {
    console.warn("Week: timeBlock 不存在，无法更新时间");
  }
};

// 处理表单提交
const handleFormSubmit = (eventData: any) => {
  // 发射事件创建事件
  emit("event-change", {
    event: eventData,
    el: formTargetElement.value as HTMLElement,
  });

  // 清空时间块和表单
  safeClearTimeBlock();
  showForm.value = false;
  eventFormData.value = null;
  formTargetElement.value = null;
};

// 处理表单取消
const handleFormCancel = () => {
  // 清空时间块和表单
  safeClearTimeBlock();
  showForm.value = false;
  eventFormData.value = null;
  formTargetElement.value = null;
};

// 监听时间块变化，自动显示表单
const watchTimeBlock = (newTimeBlock: any, oldTimeBlock: any) => {
  console.log("Week: timeBlock 变化:", {
    new: newTimeBlock,
    old: oldTimeBlock,
    isDragging: dragState.value.isDragging,
    isResizing: dragState.value.isResizing,
    lastDragEndTime: dragState.value.lastDragEndTime,
    timeSinceDrag: dragState.value.lastDragEndTime
      ? Date.now() - dragState.value.lastDragEndTime
      : null,
  });

  // 在拖拽过程中，保护 timeBlock 不被清空
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("Week: 拖拽过程中，保护 timeBlock 变化");
    return;
  }

  // 检查是否刚刚完成拖拽（更严格的保护）
  if (dragState.value.lastDragEndTime) {
    const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
    if (timeSinceDrag < 1000) {
      // 增加到1000ms的保护时间
      console.log(`Week: 拖拽刚结束 ${timeSinceDrag}ms，保护 timeBlock 变化`);
      return;
    }
  }

  if (newTimeBlock && !oldTimeBlock) {
    // 只在 timeBlock 从无到有时初始化表单
    console.log("Week: 时间块创建，准备显示表单:", newTimeBlock);

    // 初始化表单数据
    const startDateTime = dayjs(newTimeBlock.date)
      .startOf("day")
      .add(newTimeBlock.startTime, "minute");
    const endDateTime = dayjs(newTimeBlock.date)
      .startOf("day")
      .add(newTimeBlock.startTime + newTimeBlock.duration, "minute");

    eventFormData.value = {
      title: "",
      start: startDateTime.format(), // 使用 format() 而不是 toISOString()
      end: endDateTime.format(), // 使用 format() 而不是 toISOString()
      allDay: false,
      color: "#409EFF",
    };

    // 等待 DOM 更新后再设置目标元素
    nextTick(() => {
      // 使用 querySelector 查找当前的时间块元素
      setTimeout(() => {
        formTargetElement.value = timeBlockElement.value as HTMLElement;
        showForm.value = true;
      }, 50);
    });
  } else if (!newTimeBlock && oldTimeBlock) {
    // 只在 timeBlock 从有到无时清空表单
    // 但需要检查是否刚刚完成拖拽
    if (dragState.value.lastDragEndTime) {
      const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
      if (timeSinceDrag < 1000) {
        // 增加到1000ms的保护时间
        console.log(
          `Week: 拖拽刚结束 ${timeSinceDrag}ms，保护 timeBlock 不被清空`
        );
        return;
      }
    }

    console.log("Week: 时间块被清空，隐藏表单");
    showForm.value = false;
    eventFormData.value = null;
    formTargetElement.value = null;

    // 清理原始时间块信息
    if (originalTimeBlockInfo.value) {
      console.log("Week: 清理原始时间块信息");
      originalTimeBlockInfo.value = null;
    }
  } else if (newTimeBlock && oldTimeBlock) {
    // timeBlock 属性更新，不重新初始化表单
    console.log("Week: 时间块属性更新，保持表单状态");
  }
};

// 监听 timeBlock 变化
watch(() => timeBlock.value, watchTimeBlock, {
  immediate: true,
  deep: false, // 不深度监听，避免属性变化触发
});

// 添加一个额外的监听器来追踪 timeBlock 的所有变化
watch(
  () => timeBlock.value,
  (newVal, oldVal) => {
    console.log("Week: timeBlock 直接变化:", {
      new: newVal,
      old: oldVal,
      stack: new Error().stack, // 获取调用栈
      isDragging: dragState.value.isDragging,
      isResizing: dragState.value.isResizing,
      lastDragEndTime: dragState.value.lastDragEndTime,
    });
  },
  { immediate: true }
);

// 监听拖动状态变化，控制表单显示
const watchDragState = () => {
  // 当开始拖动时，隐藏表单并记录原始信息
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("Week: 开始拖动，隐藏表单");
    showForm.value = false;

    // 记录拖动开始时的原始信息
    // 注意：每次拖拽开始时都要重新记录，因为时间块可能在之前的拖拽中已经被修改
    if (timeBlock.value) {
      originalTimeBlockInfo.value = {
        date: timeBlock.value.date,
        startTime: timeBlock.value.startTime,
        duration: timeBlock.value.duration,
        top: timeBlock.value.top,
        height: timeBlock.value.height,
      };
      console.log(
        "Week: 记录拖动开始时的原始信息:",
        originalTimeBlockInfo.value
      );
    }
  }

  // 当拖动结束时，重新显示表单并更新目标元素
  if (
    !dragState.value.isDragging &&
    !dragState.value.isResizing &&
    timeBlock.value
  ) {
    console.log("Week: 拖动结束，重新显示表单");

    // 延迟显示表单，确保拖拽状态完全重置
    setTimeout(() => {
      // 再次检查拖拽状态，确保没有新的拖拽开始
      if (
        !dragState.value.isDragging &&
        !dragState.value.isResizing &&
        timeBlock.value
      ) {
        console.log("Week: 拖拽完全结束，显示表单");

        // 检查是否发生了日期切换（仅用于日志记录，不修改时间块数据）
        // 注意：useTimelineDrag.ts 已经正确处理了日期切换和时间保持
        const hasDateChanged =
          originalTimeBlockInfo.value &&
          originalTimeBlockInfo.value.date !== timeBlock.value.date;

        if (hasDateChanged) {
          console.log("Week: 检测到日期切换:", {
            from: originalTimeBlockInfo.value.date,
            to: timeBlock.value.date,
          });
          
          // 不再手动恢复时间，因为 useTimelineDrag.ts 已经正确处理
          console.log("Week: 日期切换已由 useTimelineDrag.ts 处理，保持当前时间:", {
            currentStartTime: timeBlock.value.startTime,
            currentDuration: timeBlock.value.duration,
            newDate: timeBlock.value.date,
          });
        }

        // 更新表单数据以反映拖动后的时间和日期
        // 注意：不要使用 toISOString()，因为它会转换为 UTC 时间，导致日期偏移
        const startDateTime = dayjs(timeBlock.value.date)
          .startOf("day")
          .add(timeBlock.value.startTime, "minute");
        const endDateTime = dayjs(timeBlock.value.date)
          .startOf("day")
          .add(timeBlock.value.startTime + timeBlock.value.duration, "minute");

        eventFormData.value = {
          title: "",
          start: startDateTime.format(), // 使用 format() 而不是 toISOString()
          end: endDateTime.format(), // 使用 format() 而不是 toISOString()
          allDay: false,
          color: "#409EFF",
        };

        console.log("Week: 拖动结束后更新表单数据:", {
          newDate: timeBlock.value.date,
          newStartTime: timeBlock.value.startTime,
          newDuration: timeBlock.value.duration,
          startDateTime: startDateTime.format(),
          endDateTime: endDateTime.format(),
        });

        // 更新表单目标元素
        nextTick(() => {
          formTargetElement.value = timeBlockElement.value as HTMLElement;
          showForm.value = true;
        });
      }
    }, 300); // 增加到300ms，确保拖拽状态完全重置
  }
};

// 监听拖动状态变化
watch(
  () => [dragState.value.isDragging, dragState.value.isResizing],
  watchDragState,
  { immediate: true }
);

// 处理事件点击
const handleEventClick = (event: WeekEvent, e: MouseEvent) => {
  const targetElement = e.currentTarget as HTMLElement;

  // 在拖拽过程中，保护 timeBlock 不被清空
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("拖拽过程中，忽略事件点击");
    return;
  }

  // 检查是否刚刚完成拖动，如果是，则不允许清空
  if (dragState.value.lastDragEndTime) {
    const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
    if (timeSinceDrag < 1000) {
      // 增加到1000ms的保护时间
      console.log(`拖动刚结束 ${timeSinceDrag}ms，不允许清空timeBlock`);
      return;
    }
  }
  safeClearTimeBlock();
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

  // 在拖拽过程中，保护 timeBlock 不被清空
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("拖拽过程中，忽略时间列点击");
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
      // 检查是否刚刚完成拖动，如果是，则不允许清空
      if (dragState.value.lastDragEndTime) {
        const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
        if (timeSinceDrag < 1000) {
          // 增加到1000ms的保护时间
          console.log(`拖动刚结束 ${timeSinceDrag}ms，不允许清空timeBlock`);
          return;
        }
      }
      safeClearTimeBlock();
    }
    handleEventClick(clickedEvent, event);
    return;
  }

  // 如果已经有timeBlock，检查是否刚刚完成拖动
  if (timeBlock.value) {
    // 检查是否刚刚完成拖动，如果是，则不允许清空
    if (dragState.value.lastDragEndTime) {
      const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
      if (timeSinceDrag < 1000) {
        // 增加到1000ms的保护时间
        console.log(`拖动刚结束 ${timeSinceDrag}ms，不允许清空timeBlock`);
        return;
      }
    }

    console.log("点击空白区域，清空现有timeBlock");
    safeClearTimeBlock();
    return;
  }

  // 创建新的时间块
  const newBlock = createTimeBlock(date, snappedMinutes, 30);
  console.log("创建新时间块:", newBlock);
  console.log("点击的日期:", date);
  console.log("时间块日期:", newBlock.date);
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

  // 在开始拖动前，记录原始的时间块信息
  const originalTimeBlock = {
    date: timeBlock.value.date,
    startTime: timeBlock.value.startTime,
    duration: timeBlock.value.duration,
    top: timeBlock.value.top,
    height: timeBlock.value.height,
  };

  console.log("Week: 开始拖动时间块，原始信息:", originalTimeBlock);

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
        <div class="week-view__time-column-container">
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
          </div>

          <!-- 时间块 - 使用绝对定位，放在容器下面 -->
          <div
            v-if="timeBlock"
            class="week-view__time-block"
            :class="{
              'week-view__time-block--dragging':
                dragState.isDragging &&
                dragState.currentBlock?.id === timeBlock.id,
              'week-view__time-block--resizing':
                dragState.isResizing &&
                dragState.currentBlock?.id === timeBlock.id,
            }"
            :style="{
              top: `${timeBlock?.top}px`,
              height: `${timeBlock?.height}px`,
              left: `${getTimeBlockLeftPosition(timeBlock.date)}px`,
              width: `${getTimeColumnWidth()}px`,
            }"
            @mousedown="handleTimeBlockMouseDown"
            ref="timeBlockElement"
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

    <!-- 事件表单 -->
    <EventPopover
      :visible="showForm"
      :target-element="formTargetElement"
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
  </div>
</template>

<style scoped lang="scss">
@import "./styles.scss";
</style>
