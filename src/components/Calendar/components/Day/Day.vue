<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { ElIcon } from "element-plus";
import { CaretBottom } from "@element-plus/icons-vue";
import type { TimeEvent, DayProps, CalendarEmits } from "./types";
import { EventType } from "../../types/events";
import {
  createEventFromForm,
  createEventFromTimeEvent,
} from "../../utils/eventFactory";
import { useTimeUtils } from "../../hooks/useTimeUtils";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { useDragHandlers } from "../../hooks/useDragHandlers";
import { useEventHandlers } from "../../hooks/useEventHandlers";
import EventForm from "@/components/EventForm/EventForm.vue";
import EventPopover from "@/components/EventPopover/EventPopover.vue";
import dayjs from "dayjs";
import { ElScrollbar } from "element-plus";

// Props
const props = withDefaults(defineProps<DayProps>(), {
  selectedDate: () => new Date().toISOString().split("T")[0],
  events: () => [],
});

// Emits
const emit = defineEmits<CalendarEmits>();

// 响应式数据
const timelineContainer = ref<HTMLElement | null>(null);
const scrollbarRef = ref<any>(null);
const newEventElement = ref<HTMLElement | null>(null);
const activeEventId = ref<string | null>(null);
const activeAllDayEventId = ref<string | null>(null);

// 表单相关状态
const showForm = ref(false);
const eventFormData = ref<any>(null);
const formTargetElement = ref<HTMLElement | null>(null);

// 使用hooks
const { formatTime, timeLabels } = useTimeUtils();
const { currentTimeTop, shouldShowCurrentTime, scrollToCurrentTime } =
  useCurrentTime(props.selectedDate);
const { dragState, startTimeBlockDrag, startEventDrag, setEventsRef } =
  useDragHandlers(emit);
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

// 监听processedTimeEvents变化，更新拖动处理器中的事件引用
watch(
  processedTimeEvents,
  (newEvents) => {
    setEventsRef(newEvents);
  },
  { immediate: true }
);

// 计算timeBlock的fixed位置
const getTimeBlockFixedPosition = () => {
  if (!scrollbarRef.value || !timeBlock.value) return null;

  // 使用 ElScrollbar 的 wrapRef 获取滚动容器
  const scrollbarWrap = scrollbarRef.value.wrapRef as HTMLElement;
  if (!scrollbarWrap) return null;

  const contentElement = scrollbarWrap.querySelector(
    ".day-timeline__content"
  ) as HTMLElement;
  if (!contentElement) return null;

  const contentRect = contentElement.getBoundingClientRect();

  return {
    top: contentRect.top + timeBlock.value.top,
    left: contentRect.left + 60, // 60px是时间标签宽度
    width: contentRect.width - 69, // 69px是左右边距
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

// 使用ResizeObserver监听容器大小变化，替代滚动事件
const setupResizeObserver = () => {
  if (!scrollbarRef.value) return;

  const resizeObserver = new ResizeObserver(() => {
    if (timeBlock.value) {
      updateFixedPosition();
    }
  });

  // 监听 ElScrollbar 的滚动容器
  const scrollbarWrap = scrollbarRef.value.wrapRef as HTMLElement;
  if (scrollbarWrap) {
    resizeObserver.observe(scrollbarWrap);
  }

  // 在组件卸载时清理
  onUnmounted(() => {
    resizeObserver.disconnect();
  });

  return resizeObserver;
};

// 处理表单时间变化
const handleFormTimeChanged = (timeData: { start: string; end: string }) => {
  if (timeBlock.value) {
    const startMinutes = dayjs(timeData.start).diff(
      dayjs(props.selectedDate).startOf("day"),
      "minute"
    );
    const endMinutes = dayjs(timeData.end).diff(
      dayjs(props.selectedDate).startOf("day"),
      "minute"
    );

    // 直接更新时间块
    timeBlock.value.startTime = startMinutes;
    timeBlock.value.duration = endMinutes - startMinutes;
    timeBlock.value.top = startMinutes;
    timeBlock.value.height = endMinutes - startMinutes;
  }
};

// 处理表单提交
const handleFormSubmit = (eventData: any) => {
  // 将表单数据转换为BaseEventData格式
  const baseEvent = createEventFromForm(eventData);

  // 发射事件创建事件
  emit(EventType.EVENT_CHANGE, {
    event: baseEvent,
    el: newEventElement.value as HTMLElement,
  });

  // 清空时间块和表单
  timeBlock.value = null;
  showForm.value = false;
  eventFormData.value = null;
  formTargetElement.value = null;
};

// 处理表单取消
const handleFormCancel = () => {
  // 清空时间块和表单
  timeBlock.value = null;
  showForm.value = false;
  eventFormData.value = null;
  formTargetElement.value = null;
};

// 监听时间块变化，自动显示表单
const watchTimeBlock = () => {
  if (timeBlock.value) {
    console.log("Day: 时间块变化，准备显示表单:", timeBlock.value);

    // 初始化表单数据
    const startDateTime = dayjs(props.selectedDate)
      .startOf("day")
      .add(timeBlock.value.startTime, "minute");
    const endDateTime = dayjs(props.selectedDate)
      .startOf("day")
      .add(timeBlock.value.startTime + timeBlock.value.duration, "minute");

    eventFormData.value = {
      title: "",
      start: startDateTime.format(), // 使用 format() 而不是 toISOString()
      end: endDateTime.format(), // 使用 format() 而不是 toISOString()
      allDay: false,
      color: "#409EFF",
    };

    // 等待 DOM 更新后再设置目标元素
    nextTick(() => {
      if (newEventElement.value) {
        console.log("Day: 设置表单目标元素:", newEventElement.value);
        formTargetElement.value = newEventElement.value;
        showForm.value = true;
      } else {
        console.warn("Day: 未找到时间块元素引用");
      }
    });
  } else {
    // 时间块被清空时，确保表单也被清空
    console.log("Day: 时间块被清空，隐藏表单");
    showForm.value = false;
    eventFormData.value = null;
    formTargetElement.value = null;
  }
};

// 监听 timeBlock 变化
watch(() => timeBlock.value, watchTimeBlock, { immediate: true });

// 监听拖动状态变化，控制表单显示
const watchDragState = () => {
  // 当开始拖动时，隐藏表单
  if (dragState.value.isDragging || dragState.value.isResizing) {
    console.log("开始拖动，隐藏表单");
    showForm.value = false;
  }

  // 当拖动结束时，重新显示表单并更新目标元素
  if (
    !dragState.value.isDragging &&
    !dragState.value.isResizing &&
    timeBlock.value
  ) {
    console.log("拖动结束，重新显示表单");

    // 更新表单数据以反映拖动后的时间
    const startDateTime = dayjs(props.selectedDate)
      .startOf("day")
      .add(timeBlock.value.startTime, "minute");
    const endDateTime = dayjs(props.selectedDate)
      .startOf("day")
      .add(timeBlock.value.startTime + timeBlock.value.duration, "minute");

    eventFormData.value = {
      title: "",
      start: startDateTime.format(), // 使用 format() 而不是 toISOString()
      end: endDateTime.format(), // 使用 format() 而不是 toISOString()
      allDay: false,
      color: "#409EFF",
    };

    // 等待 DOM 更新后再设置目标元素
    nextTick(() => {
      if (newEventElement.value) {
        console.log("拖动结束后更新表单目标元素:", newEventElement.value);
        formTargetElement.value = newEventElement.value;
        showForm.value = true;

        // 更新fixed位置
        updateFixedPosition();
      } else {
        console.warn("拖动结束后未找到时间块元素引用");
      }
    });
  }
};

// 监听拖动状态变化
watch(
  () => [dragState.value.isDragging, dragState.value.isResizing],
  watchDragState,
  { immediate: true }
);

// 获取星期文本
const getWeekdayText = (day: number): string => {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return weekdays[day];
};

// 获取农历日期（简化版本，实际项目中可能需要引入农历库）
const getLunarDate = (date: string): string => {
  // 这里返回一个占位符，实际项目中可以引入农历库
  // 例如：lunar-javascript 或类似的库
  return "五月初三"; // 临时占位符
};

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

  emit(EventType.EVENT_CLICK, {
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

  // 将TimeEvent转换为BaseEventData格式
  const baseEvent = createEventFromTimeEvent(event, props.selectedDate);

  emit(EventType.EVENT_CLICK, {
    event: baseEvent,
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

// 处理 ElScrollbar 滚动事件
const handleScrollbarScroll = ({ scrollTop }: { scrollTop: number }) => {
  // 可以在这里添加滚动相关的逻辑
  // 例如：更新滚动位置状态、触发其他滚动相关的操作等
  console.log("Scrollbar scrolled to:", scrollTop);
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

  // 拖动开始后更新fixed位置
  nextTick(() => {
    updateFixedPosition();
  });
};

// 生命周期
onMounted(() => {
  if (shouldShowCurrentTime.value) {
    setTimeout(() => {
      // 当有事件被选中时，禁止滚动到当前时间
      const allowScroll = !activeEventId.value;
      // 使用 ElScrollbar 的 scrollTo 方法实现平滑滚动
      if (scrollbarRef.value && allowScroll) {
        const containerHeight = scrollbarRef.value.wrapRef?.clientHeight || 0;
        const scrollTop = currentTimeTop.value - containerHeight / 2;
        const targetScrollTop = Math.max(0, scrollTop);

        // 使用 scrollTo 方法，传入对象参数实现平滑滚动
        // 参数：{ top: 垂直位置, behavior: 'smooth' 表示平滑滚动 }
        scrollbarRef.value.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
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

  // 设置ResizeObserver监听容器变化
  setupResizeObserver();

  // 添加窗口resize事件监听器
  window.addEventListener("resize", updateFixedPosition);

  // 在组件卸载时清理事件监听器
  onUnmounted(() => {
    document.removeEventListener("click", handleGlobalClick);
    window.removeEventListener("resize", updateFixedPosition);
  });
});
</script>

<template>
  <!-- 全天日程组件 -->
  <div v-if="allDayEvents.length > 0" class="day-all-events">
    <div class="day-all-events__header">
      <span class="text-11px">GMT+8</span>
    </div>
    <div class="day-all-events__content">
      <!-- 左侧：日期和展开图标 -->
      <div class="day-all-events__left">
        <div class="day-all-events__date">
          <div class="day-all-events__date-number">
            {{ dayjs(selectedDate).date() }}
          </div>
          <div class="day-all-events__date-info">
            <div class="day-all-events__month-week">
              {{ dayjs(selectedDate).format("M月, 周")
              }}{{ getWeekdayText(dayjs(selectedDate).day()) }}
            </div>
            <div class="day-all-events__lunar">
              {{ getLunarDate(selectedDate) }}
            </div>
          </div>
        </div>
        <div @click="toggleAllDayEvents" class="day-all-events__header-icon">
          <ElIcon
            class="day-all-events__expand-icon"
            :class="{
              'day-all-events__expand-icon--expanded': showAllDayEvents,
            }"
            ><CaretBottom
          /></ElIcon>
        </div>
      </div>
      <!-- 右侧：全天日程列表 -->
      <div class="day-all-events__right">
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
  </div>

  <!-- 时间轴组件 -->
  <div
    class="day-timeline"
    :class="{
      'day-timeline--scroll-disabled': activeEventId || activeAllDayEventId,
    }"
  >
    <ElScrollbar ref="scrollbarRef">
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
          class="day-timeline__time-block day-timeline__time-block--fixed"
          :style="getFixedStyles()"
          @mousedown.stop="(e) => handleTimeBlockMouseDown(e)"
        >
          <div class="day-timeline__time-display">
            {{ formatTime(timeBlock.startTime) }} -
            {{ formatTime(timeBlock.startTime + timeBlock.duration) }}
          </div>
        </div>
      </div>
    </ElScrollbar>
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
</template>

<style scoped lang="scss">
@use "./style.scss";
</style>
