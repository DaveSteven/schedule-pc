<script setup lang="ts">
import {
  toRef,
  ref,
  nextTick,
  watch,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import dayjs from "dayjs";
import { useWeekView } from "./composables";
import { useColorUtils } from "../../hooks/useColorUtils";
import { useOverlapUtils } from "../../hooks/useOverlapUtils";
import type { WeekEvent, CalendarEmits, WeekAllDayEvent } from "./types";
import { EventType } from "../../types/events";
import {
  createEventFromForm,
  createEventFromWeekEvent,
} from "../../utils/eventFactory";
import EventForm from "@/components/EventForm/EventForm.vue";
import EventPopover from "@/components/EventPopover/EventPopover.vue";
import { ElIcon, ElScrollbar } from "element-plus";
import { CaretBottom } from "@element-plus/icons-vue";

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
const emit = defineEmits<CalendarEmits>();

// 响应式数据
const activeEventId = ref<string | null>(null);

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
  dragState,
  startTimeBlockDrag,
  shouldIgnoreClick,
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

// 表单相关状态
const showForm = ref(false);
const eventFormData = ref<any>(null);
const formTargetElement = ref<HTMLElement | null>(null);
const timeBlockElement = ref<HTMLElement | null>(null);

// 添加一个变量来记录拖动开始时的原始时间块信息
const originalTimeBlockInfo = ref<any>(null);

// 添加一个变量来防止重复触发事件更新
const eventUpdateProcessed = ref<Set<string>>(new Set());

// 计算timeBlock的fixed位置
const getTimeBlockFixedPosition = () => {
  if (!timeBlock.value) return null;

  const container = document.querySelector(
    ".week-view__time-column-container"
  ) as HTMLElement;
  if (!container) return null;

  const containerRect = container.getBoundingClientRect();
  const dateIndex = weekRange.value.findIndex(
    (d) => d.date === timeBlock.value!.date
  );
  if (dateIndex === -1) return null;

  const columnWidth = containerRect.width / weekRange.value.length;
  const left = containerRect.left + dateIndex * columnWidth;

  return {
    top: containerRect.top + timeBlock.value.top,
    left: left,
    width: columnWidth,
    height: timeBlock.value.height,
  };
};

// 获取fixed样式
const getFixedStyles = (): Record<string, string | number> => {
  const fixedPos = getTimeBlockFixedPosition();
  if (!fixedPos) return {};

  return {
    top: `${fixedPos.top}px`,
    left: `${fixedPos.left}px`,
    width: `${fixedPos.width}px`,
    height: `${fixedPos.height}px`,
  };
};

// 更新fixed位置
const updateFixedPosition = () => {
  if (timeBlock.value) {
    // 触发响应式更新
    nextTick(() => {
      // 样式会自动更新
    });
  }
};

// 使用ResizeObserver监听容器大小变化
const setupResizeObserver = () => {
  const container = document.querySelector(".week-view__time-column-container");
  if (!container) return;

  const resizeObserver = new ResizeObserver(() => {
    if (timeBlock.value) {
      updateFixedPosition();
    }
  });

  resizeObserver.observe(container);

  // 在组件卸载时清理
  onUnmounted(() => {
    resizeObserver.disconnect();
  });

  return resizeObserver;
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
  // 将表单数据转换为BaseEventData格式
  const baseEvent = createEventFromForm(eventData);

  // 发射事件创建事件
  emit(EventType.EVENT_CHANGE, {
    event: baseEvent,
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

// 统一的拖拽状态变化处理函数
const handleDragStateChange = (
  newVal: {
    isDragging: boolean;
    isResizing: boolean;
    currentBlock: any;
    lastDragEndTime: number | null;
    timeBlock: any;
  },
  oldVal: {
    isDragging: boolean;
    isResizing: boolean;
    currentBlock: any;
    lastDragEndTime: number | null;
    timeBlock: any;
  }
) => {
  console.log("Week: 拖拽状态变化:", {
    new: newVal,
    old: oldVal,
    isDragging: newVal.isDragging,
    isResizing: newVal.isResizing,
    lastDragEndTime: newVal.lastDragEndTime,
    timeSinceDrag: newVal.lastDragEndTime
      ? Date.now() - newVal.lastDragEndTime
      : null,
  });

  // 当开始拖动时，隐藏表单并记录原始信息
  if (newVal.isDragging || newVal.isResizing) {
    console.log("Week: 开始拖动，隐藏表单");
    showForm.value = false;

    // 拖拽开始时，清除 activeEventId，避免拖拽过程中事件状态混乱
    if (activeEventId.value) {
      console.log("拖拽开始，清除 activeEventId:", activeEventId.value);
      activeEventId.value = null;
    }

    // 记录拖动开始时的原始信息
    // 注意：每次拖拽开始时都要重新记录，因为时间块可能在之前的拖拽中已经被修改
    if (newVal.timeBlock) {
      originalTimeBlockInfo.value = {
        date: newVal.timeBlock.date,
        startTime: newVal.timeBlock.startTime,
        duration: newVal.timeBlock.duration,
        top: newVal.timeBlock.top,
        height: newVal.timeBlock.height,
      };
      console.log(
        "Week: 记录拖动开始时的原始信息:",
        originalTimeBlockInfo.value
      );
    }
  }

  // 当拖动结束时，重新显示表单并更新目标元素
  if (!newVal.isDragging && !newVal.isResizing && newVal.timeBlock) {
    console.log("Week: 拖动结束，重新显示表单");

    // 延迟显示表单，确保拖拽状态完全重置
    setTimeout(() => {
      // 再次检查拖拽状态，确保没有新的拖拽开始
      if (!newVal.isDragging && !newVal.isResizing && newVal.timeBlock) {
        console.log("Week: 拖拽完全结束，显示表单");

        // 拖拽结束后，保持 activeEventId 为 null，避免状态混乱
        // 只有在用户真正点击事件时才会设置 activeEventId
        if (activeEventId.value) {
          console.log("拖拽结束后，清除 activeEventId:", activeEventId.value);
          activeEventId.value = null;
        }

        // 检查是否发生了日期切换（仅用于日志记录，不修改时间块数据）
        // 注意：useTimelineDrag.ts 已经正确处理了日期切换和时间保持
        const hasDateChanged =
          originalTimeBlockInfo.value &&
          originalTimeBlockInfo.value.date !== newVal.timeBlock.date;

        if (hasDateChanged) {
          console.log("Week: 检测到日期切换:", {
            from: originalTimeBlockInfo.value.date,
            to: newVal.timeBlock.date,
          });

          // 不再手动恢复时间，因为 useTimelineDrag.ts 已经正确处理
          console.log(
            "Week: 日期切换已由 useTimelineDrag.ts 处理，保持当前时间:",
            {
              currentStartTime: newVal.timeBlock.startTime,
              currentDuration: newVal.timeBlock.duration,
              newDate: newVal.timeBlock.date,
            }
          );
        }

        // 更新表单数据以反映拖动后的时间和日期
        // 注意：不要使用 toISOString()，因为它会转换为 UTC 时间，导致日期偏移
        const startDateTime = dayjs(newVal.timeBlock.date)
          .startOf("day")
          .add(newVal.timeBlock.startTime, "minute");
        const endDateTime = dayjs(newVal.timeBlock.date)
          .startOf("day")
          .add(
            newVal.timeBlock.startTime + newVal.timeBlock.duration,
            "minute"
          );

        eventFormData.value = {
          title: "",
          start: startDateTime.format(), // 使用 format() 而不是 toISOString()
          end: endDateTime.format(), // 使用 format() 而不是 toISOString()
          allDay: false,
          color: "#409EFF",
        };

        console.log("Week: 拖动结束后更新表单数据:", {
          newDate: newVal.timeBlock.date,
          newStartTime: newVal.timeBlock.startTime,
          newDuration: newVal.timeBlock.duration,
          startDateTime: startDateTime.format(),
          endDateTime: endDateTime.format(),
        });

        // 更新表单目标元素
        nextTick(() => {
          formTargetElement.value = timeBlockElement.value as HTMLElement;
          showForm.value = true;

          // 更新fixed位置
          updateFixedPosition();
        });
      }
    }, 300); // 增加到300ms，确保拖拽状态完全重置
  }

  // 当拖动状态变为 false 时，检查是否是事件拖动完成
  if (
    !newVal.isDragging &&
    !newVal.isResizing &&
    newVal.currentBlock?.isEventDrag
  ) {
    const block = newVal.currentBlock;
    const originalEvent = block.originalEvent;

    if (originalEvent && !eventUpdateProcessed.value.has(originalEvent.id)) {
      console.log("事件拖动状态重置，更新事件数据:", {
        original: {
          date: originalEvent.date,
          startTime: originalEvent.startTime,
          duration: originalEvent.duration,
        },
        new: {
          date: block.date,
          startTime: block.startTime,
          duration: block.duration,
        },
      });

      // 标记此事件已处理，防止重复触发
      eventUpdateProcessed.value.add(originalEvent.id);

      // 更新原始事件数据
      originalEvent.date = block.date;
      originalEvent.startTime = block.startTime;
      originalEvent.duration = block.duration;

      // 重新计算事件的位置和尺寸
      originalEvent.top = block.top;
      originalEvent.height = block.height;

      // 发出事件更新事件
      emit(EventType.EVENT_CHANGE, {
        event: createEventFromWeekEvent(originalEvent),
        el:
          (document.querySelector(
            `[data-event-id="${originalEvent.id}"]`
          ) as HTMLElement) || document.body,
      });
    }
  }
};

// 合并的watch监听器 - 替换多个重复的watch
watch(
  () => ({
    isDragging: dragState.value.isDragging,
    isResizing: dragState.value.isResizing,
    currentBlock: dragState.value.currentBlock,
    lastDragEndTime: dragState.value.lastDragEndTime,
    timeBlock: timeBlock.value,
  }),
  handleDragStateChange,
  { deep: true, immediate: false }
);

// 监听拖动状态变化，控制表单显示
const watchDragState = () => {
  // 当开始拖动时，隐藏表单并记录原始信息
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("Week: 开始拖动，隐藏表单");
    showForm.value = false;

    // 拖拽开始时，清除 activeEventId，避免拖拽过程中事件状态混乱
    if (activeEventId.value) {
      console.log("拖拽开始，清除 activeEventId:", activeEventId.value);
      activeEventId.value = null;
    }

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

        // 拖拽结束后，保持 activeEventId 为 null，避免状态混乱
        // 只有在用户真正点击事件时才会设置 activeEventId
        if (activeEventId.value) {
          console.log("拖拽结束后，清除 activeEventId:", activeEventId.value);
          activeEventId.value = null;
        }

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
          console.log(
            "Week: 日期切换已由 useTimelineDrag.ts 处理，保持当前时间:",
            {
              currentStartTime: timeBlock.value.startTime,
              currentDuration: timeBlock.value.duration,
              newDate: timeBlock.value.date,
            }
          );
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

          // 更新fixed位置
          updateFixedPosition();
        });
      }
    }, 300); // 增加到300ms，确保拖拽状态完全重置
  }
};

// 监听拖动状态变化
watch(
  () => [dragState.value.isDragging, dragState.value.isResizing],
  ([isDragging, isResizing]) => {
    // 调用原有的 watchDragState 函数
    watchDragState();

    // 当开始拖动时，重置事件更新标志
    if (isDragging || isResizing) {
      eventUpdateProcessed.value.clear();

      // 拖拽开始时，确保 activeEventId 被清除
      if (activeEventId.value) {
        console.log("拖拽状态变化，清除 activeEventId:", activeEventId.value);
        activeEventId.value = null;
      }
    }

    // 当拖动状态变为 false 时，检查是否是事件拖动完成
    if (
      !isDragging &&
      !isResizing &&
      dragState.value.currentBlock?.isEventDrag
    ) {
      const block = dragState.value.currentBlock;
      const originalEvent = block.originalEvent;

      if (originalEvent && !eventUpdateProcessed.value.has(originalEvent.id)) {
        console.log("事件拖动状态重置，更新事件数据:", {
          original: {
            date: originalEvent.date,
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
          },
          new: {
            date: block.date,
            startTime: block.startTime,
            duration: block.duration,
          },
        });

        // 标记此事件已处理，防止重复触发
        eventUpdateProcessed.value.add(originalEvent.id);

        // 更新原始事件数据
        originalEvent.date = block.date;
        originalEvent.startTime = block.startTime;
        originalEvent.duration = block.duration;

        // 重新计算事件的位置和尺寸
        originalEvent.top = block.top;
        originalEvent.height = block.height;

        // 发出事件更新事件
        emit(EventType.EVENT_CHANGE, {
          event: createEventFromWeekEvent(originalEvent),
          el:
            (document.querySelector(
              `[data-event-id="${originalEvent.id}"]`
            ) as HTMLElement) || document.body,
        });
      }
    }
  },
  { immediate: true }
);

// 监听拖动结束时间，更新事件数据
watch(
  () => dragState.value.lastDragEndTime,
  (newTime) => {
    if (newTime && dragState.value.currentBlock?.isEventDrag) {
      const block = dragState.value.currentBlock;
      const originalEvent = block.originalEvent;

      if (originalEvent && !eventUpdateProcessed.value.has(originalEvent.id)) {
        console.log("事件拖动完成，更新事件数据:", {
          original: {
            date: originalEvent.date,
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
          },
          new: {
            date: block.date,
            startTime: block.startTime,
            duration: block.duration,
          },
        });

        // 标记此事件已处理，防止重复触发
        eventUpdateProcessed.value.add(originalEvent.id);

        // 更新原始事件数据
        originalEvent.date = block.date;
        originalEvent.startTime = block.startTime;
        originalEvent.duration = block.duration;

        // 重新计算事件的位置和尺寸
        originalEvent.top = block.top;
        originalEvent.height = block.height;

        // 发出事件更新事件
        emit(EventType.EVENT_CHANGE, {
          event: createEventFromWeekEvent(originalEvent),
          el:
            (document.querySelector(
              `[data-event-id="${originalEvent.id}"]`
            ) as HTMLElement) || document.body,
        });

        console.log("事件拖动完成，最终事件数据:", {
          id: originalEvent.id,
          date: originalEvent.date,
          startTime: originalEvent.startTime,
          duration: originalEvent.duration,
          top: originalEvent.top,
          height: originalEvent.height,
        });

        // 强制触发响应式更新，确保事件数据被保存
        nextTick(() => {
          // 再次确认事件数据已保存
          console.log("nextTick后确认事件数据:", {
            id: originalEvent.id,
            date: originalEvent.date,
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
            top: originalEvent.top,
            height: originalEvent.height,
          });

          // 确保事件数据被正确保存到 timeEventsByDate 中
          const currentTimeEvents = timeEventsByDate.value;
          if (currentTimeEvents[originalEvent.date]) {
            // 检查是否已经存在该事件
            const existingEvent = currentTimeEvents[originalEvent.date].find(
              (e: any) => e.id === originalEvent.id
            );
            if (!existingEvent) {
              currentTimeEvents[originalEvent.date].push(originalEvent);
              console.log(
                `拖动完成后，确保事件 ${originalEvent.id} 在 timeEventsByDate 的日期列 ${originalEvent.date} 中`
              );
            }
          }
        });
      }
    }
  }
);

// 添加一个专门的拖动结束监听器，确保最终更改能够正确应用
watch(
  () => [dragState.value.isDragging, dragState.value.isResizing],
  ([isDragging, isResizing], [oldIsDragging, oldIsResizing]) => {
    // 当拖动状态从 true 变为 false 时，确保事件数据正确保存
    if ((oldIsDragging || oldIsResizing) && !isDragging && !isResizing) {
      const block = dragState.value.currentBlock;
      if (block?.isEventDrag && block.originalEvent) {
        const originalEvent = block.originalEvent;

        // 确保最终的位置和时间被正确保存
        originalEvent.date = block.date;
        originalEvent.startTime = block.startTime;
        originalEvent.duration = block.duration;
        originalEvent.top = block.top;
        originalEvent.height = block.height;

        console.log("拖动状态结束，最终保存事件数据:", {
          id: originalEvent.id,
          date: originalEvent.date,
          startTime: originalEvent.startTime,
          duration: originalEvent.duration,
          top: originalEvent.top,
          height: originalEvent.height,
        });

        // 强制触发响应式更新
        nextTick(() => {
          // 确保UI更新
          console.log("拖动结束，强制更新UI");

          // 拖动结束后，确保事件在正确的日期列中
          const currentTimeEvents = timeEventsByDate.value;
          if (currentTimeEvents[originalEvent.date]) {
            // 检查是否已经存在该事件
            const existingEvent = currentTimeEvents[originalEvent.date].find(
              (e: any) => e.id === originalEvent.id
            );
            if (!existingEvent) {
              currentTimeEvents[originalEvent.date].push(originalEvent);
              console.log(
                `拖动结束后，确保事件 ${originalEvent.id} 在正确的日期列 ${originalEvent.date} 中`
              );
            }
          }

          // 清理拖动状态，确保不会影响后续操作
          if (draggingEventState.value) {
            console.log("拖动结束后清理拖动状态");
            draggingEventState.value = null;
            draggingEventId.value = null;
          }
        });
      } else {
        // 即使没有事件块，也要清理拖动状态
        if (draggingEventState.value) {
          console.log("拖动结束后清理拖动状态（无事件块）");
          draggingEventState.value = null;
          draggingEventId.value = null;
        }
      }
    }
  }
);

// 添加一个专门的拖动事件状态管理
const draggingEventState = ref<{
  event: any;
  date: string;
  top: number;
  height: number;
  startTime: number;
  duration: number;
} | null>(null);

// 添加一个标记来跟踪拖动中的事件ID，避免重复处理
const draggingEventId = ref<string | null>(null);

// 监听拖动状态变化，同步拖动中的事件块位置
watch(
  () => dragState.value.currentBlock,
  (newBlock, oldBlock) => {
    if (
      newBlock?.isEventDrag &&
      (dragState.value.isDragging || dragState.value.isResizing)
    ) {
      const originalEvent = newBlock.originalEvent;
      if (originalEvent) {
        // 如果是新的拖动事件，重置状态
        if (draggingEventId.value !== originalEvent.id) {
          draggingEventId.value = originalEvent.id;
          draggingEventState.value = null; // 重置状态

          // 新事件拖动开始时，强制清理所有日期列中的重复事件
          const currentTimeEvents = timeEventsByDate.value;
          Object.keys(currentTimeEvents).forEach((date) => {
            if (currentTimeEvents[date]) {
              const beforeLength = currentTimeEvents[date].length;
              currentTimeEvents[date] = currentTimeEvents[date].filter(
                (e) => e.id !== originalEvent.id
              );
              const afterLength = currentTimeEvents[date].length;
              if (beforeLength !== afterLength) {
                console.log(
                  `新拖动开始时，清理日期列 ${date} 中的重复事件:`,
                  originalEvent.id
                );
              }
            }
          });
        }

        // 避免重复更新相同的数据
        const hasChanged =
          !draggingEventState.value ||
          draggingEventState.value.top !== newBlock.top ||
          draggingEventState.value.height !== newBlock.height ||
          draggingEventState.value.startTime !== newBlock.startTime ||
          draggingEventState.value.duration !== newBlock.duration ||
          draggingEventState.value.date !== newBlock.date;

        if (hasChanged) {
          // 更新拖动事件状态
          draggingEventState.value = {
            event: originalEvent,
            date: newBlock.date || originalEvent.date,
            top: newBlock.top || originalEvent.top,
            height: newBlock.height || originalEvent.height,
            startTime: newBlock.startTime || originalEvent.startTime,
            duration: newBlock.duration || originalEvent.duration,
          };

          // 直接更新原始事件数据，确保拖动过程中事件位置正确
          originalEvent.top = draggingEventState.value.top;
          originalEvent.height = draggingEventState.value.height;
          originalEvent.startTime = draggingEventState.value.startTime;
          originalEvent.duration = draggingEventState.value.duration;
          originalEvent.date = draggingEventState.value.date;

          console.log("拖动状态变化，同步事件位置:", {
            id: originalEvent.id,
            top: originalEvent.top,
            height: originalEvent.height,
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
            date: originalEvent.date,
          });
        }
      }
    } else if (!dragState.value.isDragging && !dragState.value.isResizing) {
      // 拖动结束，清除拖动事件状态
      if (draggingEventState.value) {
        console.log("拖动结束，清除拖动事件状态");

        // 确保拖动结束后事件数据被正确保存
        const originalEvent = draggingEventState.value.event;
        if (originalEvent) {
          // 更新原始事件数据
          originalEvent.date = draggingEventState.value.date;
          originalEvent.startTime = draggingEventState.value.startTime;
          originalEvent.duration = draggingEventState.value.duration;
          originalEvent.top = draggingEventState.value.top;
          originalEvent.height = draggingEventState.value.height;

          console.log("拖动结束后保存事件数据:", {
            id: originalEvent.id,
            date: originalEvent.date,
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
            top: originalEvent.top,
            height: originalEvent.height,
          });

          // 确保事件在正确的日期列中
          const currentTimeEvents = timeEventsByDate.value;
          if (currentTimeEvents[originalEvent.date]) {
            // 检查是否已经存在该事件
            const existingEvent = currentTimeEvents[originalEvent.date].find(
              (e: any) => e.id === originalEvent.id
            );
            if (!existingEvent) {
              currentTimeEvents[originalEvent.date].push(originalEvent);
              console.log(
                `拖动结束后，确保事件 ${originalEvent.id} 在正确的日期列 ${originalEvent.date} 中`
              );
            }
          }
        }

        draggingEventState.value = null;
        draggingEventId.value = null;
      }
    }
  },
  { deep: true, immediate: false }
);

// 修改 draggingEvent 计算属性，使用稳定的状态
const draggingEvent = computed(() => {
  return draggingEventState.value?.event || null;
});

// 添加一个专门的日期变化监听器，确保X轴拖动时事件块能够正确跟随
watch(
  () => dragState.value.currentBlock?.date,
  (newDate, oldDate) => {
    if (
      dragState.value.currentBlock?.isEventDrag &&
      (dragState.value.isDragging || dragState.value.isResizing)
    ) {
      const block = dragState.value.currentBlock;
      const originalEvent = block.originalEvent;

      if (originalEvent && newDate && newDate !== oldDate) {
        // 避免重复更新相同的数据
        if (draggingEventState.value?.date !== newDate) {
          console.log("X轴拖动日期变化:", {
            from: oldDate,
            to: newDate,
            eventId: originalEvent.id,
            isDragging: dragState.value.isDragging,
            isResizing: dragState.value.isResizing,
          });

          // 更新原始事件的日期
          originalEvent.date = newDate;

          // 强制触发响应式更新
          nextTick(() => {
            console.log("X轴拖动后事件块位置更新:", {
              id: originalEvent.id,
              newDate: originalEvent.date,
              top: originalEvent.top,
              height: originalEvent.height,
            });
          });
        }
      }
    }
  }
);

// 添加调试信息
watch(draggingEvent, (newEvent) => {
  if (newEvent) {
    console.log("拖动事件状态变化:", {
      id: newEvent.id,
      date: newEvent.date,
      top: newEvent.top,
      height: newEvent.height,
      isDragging: dragState.value.isDragging,
      isResizing: dragState.value.isResizing,
    });
  }
});

// 修改 timeEventsByDate 的计算，确保拖动中的事件块能够正确显示
const timeEventsByDateWithDrag = computed(() => {
  const result = { ...timeEventsByDate.value };

  // 拖动中的事件处理
  if (draggingEventState.value && draggingEventId.value) {
    const event = draggingEventState.value.event;
    const date = draggingEventState.value.date;

    console.log("拖动中的事件块:", {
      id: event.id,
      date: date,
      top: draggingEventState.value.top,
      height: draggingEventState.value.height,
      startTime: draggingEventState.value.startTime,
      duration: draggingEventState.value.duration,
    });

    // 彻底清理所有日期列中的重复事件，确保没有残留
    Object.keys(result).forEach((otherDate) => {
      if (result[otherDate]) {
        const beforeLength = result[otherDate].length;
        result[otherDate] = result[otherDate].filter((e) => e.id !== event.id);
        const afterLength = result[otherDate].length;
        if (beforeLength !== afterLength) {
          console.log(`从日期列 ${otherDate} 中移除重复事件:`, event.id);
        }
      }
    });

    // 确保拖动中的事件块在正确的日期列中显示
    if (!result[date]) {
      result[date] = [];
    }

    // 创建拖动中的事件块副本，使用 draggingEventState 中的最新数据
    const draggingEventBlock = {
      ...event,
      top: draggingEventState.value.top,
      height: draggingEventState.value.height,
      startTime: draggingEventState.value.startTime,
      duration: draggingEventState.value.duration,
      date: draggingEventState.value.date,
    };

    // 检查是否已经存在该事件，如果存在则更新，不存在则添加
    const existingEventIndex = result[date].findIndex((e) => e.id === event.id);
    if (existingEventIndex === -1) {
      // 添加新事件
      result[date].push(draggingEventBlock);
      console.log("添加拖动中的事件块到日期列:", date);
    } else {
      // 更新现有事件
      result[date][existingEventIndex] = draggingEventBlock;
      console.log("更新拖动中的事件块位置:", date);
    }
  }

  // 拖动结束后，确保事件在正确的位置显示
  if (!dragState.value.isDragging && !dragState.value.isResizing) {
    // 从 timeEventsByDate 中获取最新的事件数据，确保拖动结束后的事件位置正确
    const baseEvents = timeEventsByDate.value;
    Object.keys(baseEvents).forEach((date) => {
      const events = baseEvents[date];
      if (events && events.length > 0) {
        events.forEach((event) => {
          // 检查该事件是否在正确的日期列中
          if (event.date === date) {
            // 确保事件在正确的日期列中
            if (!result[date]) {
              result[date] = [];
            }

            // 检查是否已经存在该事件
            const existingEvent = result[date].find((e) => e.id === event.id);
            if (!existingEvent) {
              result[date].push(event);
              console.log(
                `拖动结束后，确保事件 ${event.id} 在正确的日期列 ${date} 中`
              );
            }
          }
        });
      }
    });

    // 拖动结束后，清理拖动状态，确保不会影响后续操作
    if (draggingEventState.value) {
      console.log("拖动结束，清理拖动状态");
      draggingEventState.value = null;
      draggingEventId.value = null;
    }
  }

  // 重新计算重叠样式，确保拖动的事件不会覆盖已有事件
  Object.keys(result).forEach((date) => {
    const events = result[date];
    if (events.length > 1) {
      // 使用现有的重叠计算逻辑
      const { processOverlappingEvents } = useOverlapUtils();
      const processedEvents = processOverlappingEvents(events);
      // 更新事件的重叠样式
      processedEvents.forEach((processedEvent: any) => {
        const originalEvent = events.find((e) => e.id === processedEvent.id);
        if (originalEvent) {
          originalEvent.overlapStyle = processedEvent.overlapStyle;
          console.log("更新事件重叠样式:", {
            id: originalEvent.id,
            overlapStyle: originalEvent.overlapStyle,
          });
        }
      });
    }
  });

  // 最终安全检查：确保没有重复事件ID（简化版本）
  Object.keys(result).forEach((date) => {
    const events = result[date];
    if (events && events.length > 0) {
      const eventIds = new Set();
      const uniqueEvents = [];

      for (const event of events) {
        if (!eventIds.has(event.id)) {
          eventIds.add(event.id);
          uniqueEvents.push(event);
        } else {
          console.log(`发现重复事件，移除: ${event.id} 在日期 ${date}`);
        }
      }

      // 如果发现有重复事件被移除，更新结果
      if (uniqueEvents.length !== events.length) {
        result[date] = uniqueEvents;
        console.log(
          `日期 ${date} 清理重复事件后，事件数量从 ${events.length} 变为 ${uniqueEvents.length}`
        );
      }
    }
  });

  // 调试：检查最终的事件分布
  console.log(
    "最终事件分布:",
    Object.keys(result).map((date) => ({
      date,
      eventCount: result[date]?.length || 0,
      events:
        result[date]?.map((e) => ({
          id: e.id,
          top: e.top,
          startTime: e.startTime,
        })) || [],
    }))
  );

  return result;
});

// 处理事件点击
const handleEventClick = (
  event: WeekEvent | WeekAllDayEvent,
  e: MouseEvent
) => {
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

  // 只有在没有拖拽状态时才清空 timeBlock
  if (!dragState.value.isDragging && !dragState.value.isResizing) {
    safeClearTimeBlock();
  }

  // 设置 activeEventId（只在轻点时设置）
  activeEventId.value = event.id;

  // 将事件转换为BaseEventData格式
  const baseEvent = createEventFromWeekEvent(event);

  emit(EventType.EVENT_CLICK, { event: baseEvent, el: targetElement });
};

// 处理事件块拖动
const handleEventBlockMouseDown = (event: MouseEvent, eventData: WeekEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickY = event.clientY - rect.top;

  // 定义边缘区域的大小（像素）
  const edgeThreshold = 8;

  // 记录鼠标按下时的位置和时间
  const mouseDownInfo = {
    x: event.clientX,
    y: event.clientY,
    time: Date.now(),
  };

  // 创建鼠标移动和抬起事件处理器
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = Math.abs(moveEvent.clientX - mouseDownInfo.x);
    const deltaY = Math.abs(moveEvent.clientY - mouseDownInfo.y);
    const moveThreshold = 5; // 5像素的移动阈值

    // 如果移动距离超过阈值，认为是拖拽操作
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      // 移除事件监听器
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // 开始拖拽逻辑
      startDragOperation(event, eventData, clickY, edgeThreshold);
    }
  };

  const handleMouseUp = (upEvent: MouseEvent) => {
    const deltaTime = Date.now() - mouseDownInfo.time;
    const deltaX = Math.abs(upEvent.clientX - mouseDownInfo.x);
    const deltaY = Math.abs(upEvent.clientY - mouseDownInfo.y);
    const clickThreshold = 5; // 5像素的点击阈值
    const timeThreshold = 200; // 200ms的时间阈值

    // 移除事件监听器
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // 如果移动距离和时间都在阈值内，认为是轻点操作
    if (
      deltaX <= clickThreshold &&
      deltaY <= clickThreshold &&
      deltaTime <= timeThreshold
    ) {
      console.log("检测到轻点操作，不触发拖拽");
      // 轻点时不触发拖拽，只处理点击事件
      return;
    }

    // 如果移动距离超过阈值，开始拖拽
    if (deltaX > clickThreshold || deltaY > clickThreshold) {
      startDragOperation(event, eventData, clickY, edgeThreshold);
    }
  };

  // 添加事件监听器
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// 提取拖拽操作逻辑到单独的函数
const startDragOperation = (
  event: MouseEvent,
  eventData: WeekEvent,
  clickY: number,
  edgeThreshold: number
) => {
  // 拖动开始前，彻底清理之前可能残留的拖动状态和重复事件
  if (draggingEventState.value) {
    console.log("拖动新事件前，清理之前的拖动状态");
    draggingEventState.value = null;
    draggingEventId.value = null;
  }

  // 强制清理所有日期列中可能存在的重复事件
  const currentTimeEvents = timeEventsByDate.value;
  Object.keys(currentTimeEvents).forEach((date) => {
    if (currentTimeEvents[date]) {
      const beforeLength = currentTimeEvents[date].length;
      currentTimeEvents[date] = currentTimeEvents[date].filter(
        (e) => e.id !== eventData.id
      );
      const afterLength = currentTimeEvents[date].length;
      if (beforeLength !== afterLength) {
        console.log(
          `拖动开始前，清理日期列 ${date} 中的重复事件:`,
          eventData.id
        );
      }
    }
  });

  // 创建临时的时间块用于拖动，确保包含所有必要的属性
  const tempTimeBlock = {
    id: eventData.id,
    date: eventData.date,
    startTime: eventData.startTime,
    duration: eventData.duration,
    top: eventData.top,
    height: eventData.height,
    isEventDrag: true, // 标记这是事件拖动
    originalEvent: eventData, // 保存原始事件数据
    // 添加拖动过程中需要的属性
    _tempDisplayDate: eventData.date, // 临时显示日期
    _tempDisplayTop: eventData.top, // 临时显示位置
    _tempDisplayHeight: eventData.height, // 临时显示高度
  };

  console.log("Week: 开始拖动事件块，事件信息:", tempTimeBlock);

  // 检测是否点击在顶部边缘区域
  if (clickY <= edgeThreshold) {
    startTimeBlockDrag(event, tempTimeBlock, "resize-top");
  }
  // 检测是否点击在底部边缘区域
  else if (clickY >= tempTimeBlock.height - edgeThreshold) {
    startTimeBlockDrag(event, tempTimeBlock, "resize-bottom");
  }
  // 其他区域为移动操作
  else {
    startTimeBlockDrag(event, tempTimeBlock, "move");
  }
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

  // 记录鼠标按下时的位置和时间
  const mouseDownInfo = {
    x: event.clientX,
    y: event.clientY,
    time: Date.now(),
  };

  // 创建鼠标移动和抬起事件处理器
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = Math.abs(moveEvent.clientX - mouseDownInfo.x);
    const deltaY = Math.abs(moveEvent.clientY - mouseDownInfo.y);
    const moveThreshold = 5; // 5像素的移动阈值

    // 如果移动距离超过阈值，认为是拖拽操作
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      // 移除事件监听器
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // 开始拖拽逻辑
      startTimeBlockDragOperation(event, clickY, edgeThreshold);
    }
  };

  const handleMouseUp = (upEvent: MouseEvent) => {
    const deltaTime = Date.now() - mouseDownInfo.time;
    const deltaX = Math.abs(upEvent.clientX - mouseDownInfo.x);
    const deltaY = Math.abs(upEvent.clientY - mouseDownInfo.y);
    const clickThreshold = 5; // 5像素的点击阈值
    const timeThreshold = 200; // 200ms的时间阈值

    // 移除事件监听器
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // 如果移动距离和时间都在阈值内，认为是轻点操作
    if (
      deltaX <= clickThreshold &&
      deltaY <= clickThreshold &&
      deltaTime <= timeThreshold
    ) {
      console.log("检测到时间块轻点操作，不触发拖拽");
      // 轻点时不触发拖拽
      return;
    }

    // 如果移动距离超过阈值，开始拖拽
    if (deltaX > clickThreshold || deltaY > clickThreshold) {
      startTimeBlockDragOperation(event, clickY, edgeThreshold);
    }
  };

  // 添加事件监听器
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// 提取时间块拖拽操作逻辑到单独的函数
const startTimeBlockDragOperation = (
  event: MouseEvent,
  clickY: number,
  edgeThreshold: number
) => {
  if (!timeBlock.value) return;

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
  else if (clickY >= timeBlock.value.height - edgeThreshold) {
    startTimeBlockDrag(event, timeBlock.value, "resize-bottom");
  }
  // 其他区域为移动操作
  else {
    startTimeBlockDrag(event, timeBlock.value, "move");
  }

  // 拖动开始后更新fixed位置
  nextTick(() => {
    updateFixedPosition();
  });
};

// 添加调试函数
const debugEventState = () => {
  console.log("=== 事件状态调试信息 ===");
  console.log("timeEventsByDate:", timeEventsByDate.value);
  console.log("timeEventsByDateWithDrag:", timeEventsByDateWithDrag.value);
  console.log("draggingEventState:", draggingEventState.value);
  console.log("dragState:", dragState.value);
  console.log("timeBlock:", timeBlock.value);
  console.log("activeEventId:", activeEventId.value);
  console.log("showForm:", showForm.value);
  console.log("========================");
};

// 在组件挂载时设置鼠标移动监听器
onMounted(() => {
  setupResizeObserver();
  // setupDragMouseMoveListener(); // 移除此行

  // 添加全局点击事件监听器
  const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // 在拖拽过程中，不清空 activeEventId，避免状态混乱
    if (dragState.value.isDragging || dragState.value.isResizing) {
      console.log("拖拽过程中，不清空 activeEventId");
      return;
    }

    // 清空activeEventId
    if (
      !target.closest(".week-view__all-day-event") &&
      !target.closest(".week-view__time-event")
    ) {
      activeEventId.value = null;
    }

    // 调试事件状态
    if (target.closest(".week-view__time-event")) {
      setTimeout(debugEventState, 100);
    }
  };

  document.addEventListener("click", handleGlobalClick);

  // 清理函数
  onUnmounted(() => {
    document.removeEventListener("click", handleGlobalClick);
  });
});
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
          <ElIcon
            class="week-view__expand-icon"
            :class="{ 'week-view__expand-icon--expanded': isAllDayExpanded }"
            ><CaretBottom
          /></ElIcon>
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
                'week-view__all-day-event--active':
                  activeEventId === crossDayEvent.id,
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
                  'week-view__all-day-event--active':
                    activeEventId === singleDayEvent.id,
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
    <ElScrollbar class="week-view__timeline-section-container">
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
              v-for="event in timeEventsByDateWithDrag[dateInfo.date]"
              :key="event.id"
              class="week-view__event-block"
              :data-event-id="event.id"
              :class="{
                'week-view__event-block--past': dayjs(dateInfo.date).isBefore(
                  dayjs(),
                  'day'
                ),
                'week-view__event-block--active': activeEventId === event.id,
                'week-view__event-block--dragging':
                  dragState.isDragging &&
                  dragState.currentBlock?.isEventDrag &&
                  dragState.currentBlock?.originalEvent?.id === event.id,
                'week-view__event-block--resizing':
                  dragState.isResizing &&
                  dragState.currentBlock?.isEventDrag &&
                  dragState.currentBlock?.originalEvent?.id === event.id,
              }"
              :style="{
                top: `${event.top}px`,
                height: `${event.height}px`,
                backgroundColor: lightenColor(event.color, 0.8),
                borderLeft: `3px solid ${event.color}`,
                left: `calc(${event.overlapStyle?.left || '0%'})`,
                width: `calc(${event.overlapStyle?.width || '100%'})`,
                zIndex: event.overlapStyle?.zIndex || 1,
                // 拖动过程中提高z-index
                ...((dragState.isDragging || dragState.isResizing) &&
                dragState.currentBlock?.isEventDrag &&
                dragState.currentBlock?.originalEvent?.id === event.id
                  ? {
                      zIndex: 20,
                    }
                  : {}),
              }"
              @click.stop="handleEventClick(event, $event)"
              @mousedown.stop="handleEventBlockMouseDown($event, event)"
            >
              <div class="week-view__event-title">{{ event.title }}</div>
              <div class="week-view__event-time">
                {{ formatEventTime(event.startTime, event.duration) }}
              </div>
            </div>
          </div>

          <!-- 时间块 - 使用fixed定位 -->
          <div
            v-if="timeBlock"
            class="week-view__time-block week-view__time-block--fixed"
            :class="{
              'week-view__time-block--dragging':
                dragState.isDragging &&
                dragState.currentBlock?.id === timeBlock.id,
              'week-view__time-block--resizing':
                dragState.isResizing &&
                dragState.currentBlock?.id === timeBlock.id,
            }"
            :style="getFixedStyles()"
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
    </ElScrollbar>

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
