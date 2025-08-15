<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="popoverRef"
      class="event-popover"
      :style="{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }"
    >
      <div class="event-popover__content">
        <!-- 标题 -->
        <div class="event-popover__header">
          <h3 class="event-popover__title">{{ eventData?.title }}</h3>
          <button class="event-popover__close" @click="handleClose">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>

        <!-- 详情内容 -->
        <div class="event-popover__body">
          <!-- 时间信息 -->
          <div class="event-popover__item">
            <div class="event-popover__label">
              <svg class="event-popover__icon" viewBox="0 0 24 24">
                <path
                  d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"
                />
              </svg>
              时间
            </div>
            <div class="event-popover__value">
              <div>{{ formatEventDate(eventData?.start || "") }}</div>
              <div>
                {{
                  formatEventTime(eventData?.start || "", eventData?.end || "")
                }}
              </div>
            </div>
          </div>

          <!-- 发起人 -->
          <div v-if="eventData?.tuCname" class="event-popover__item">
            <div class="event-popover__label">
              <svg class="event-popover__icon" viewBox="0 0 24 24">
                <path
                  d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
                />
              </svg>
              发起人
            </div>
            <div class="event-popover__value">
              {{ eventData.tuCname }}
            </div>
          </div>

          <!-- 地点 -->
          <div v-if="eventData?.roomName" class="event-popover__item">
            <div class="event-popover__label">
              <svg class="event-popover__icon" viewBox="0 0 24 24">
                <path
                  d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"
                />
              </svg>
              地点
            </div>
            <div class="event-popover__value">
              {{ eventData.roomName }}
            </div>
          </div>

          <!-- 日程类型 -->
          <div v-if="eventData?.scheduleType" class="event-popover__item">
            <div class="event-popover__label">
              <svg class="event-popover__icon" viewBox="0 0 24 24">
                <path
                  d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"
                />
              </svg>
              类型
            </div>
            <div class="event-popover__value">
              {{ getScheduleTypeText(eventData?.scheduleType) }}
            </div>
          </div>

          <!-- 提醒设置 -->
          <div v-if="eventData?.remindType" class="event-popover__item">
            <div class="event-popover__label">
              <svg class="event-popover__icon" viewBox="0 0 24 24">
                <path
                  d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                />
              </svg>
              提醒
            </div>
            <div class="event-popover__value">
              {{ getRemindTypeText(eventData.remindType) }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="event-popover__footer">
          <button
            class="event-popover__btn event-popover__btn--primary"
            @click="handleEdit"
          >
            编辑
          </button>
          <button
            class="event-popover__btn event-popover__btn--secondary"
            @click="handleDelete"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from "vue";

/**
 * Popover位置计算选项
 */
interface PopoverPositionOptions {
  /** 目标元素 */
  targetElement: HTMLElement;
  /** Popover元素 */
  popoverElement: HTMLElement;
  /** 偏移量 */
  offset?: { x: number; y: number };
  /** 优先显示位置 */
  preferredPosition?: "top" | "bottom" | "left" | "right" | "top-left" | "bottom-left";
  /** 边距 */
  margin?: number;
}

/**
 * 计算Popover的最佳显示位置
 */
function calculatePopoverPosition(options: PopoverPositionOptions) {
  const {
    targetElement,
    popoverElement,
    offset = { x: 0, y: 0 },
    preferredPosition = "bottom",
    margin = 0,
  } = options;

  // 获取目标元素的位置信息
  const targetRect = targetElement.getBoundingClientRect();

  // 获取Popover元素的尺寸
  const popoverRect = popoverElement.getBoundingClientRect();

  // 获取视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 计算各个方向的可用空间
  const spaceTop = targetRect.top;
  const spaceBottom = viewportHeight - targetRect.bottom;
  const spaceLeft = targetRect.left;
  const spaceRight = viewportWidth - targetRect.right;

  // 计算各个位置的坐标
  const positions = {
    top: {
      x:
        targetRect.left +
        targetRect.width / 2 -
        popoverRect.width / 2 +
        offset.x,
      y: targetRect.top - popoverRect.height - margin + offset.y,
      canFit: spaceTop >= popoverRect.height + margin,
    },
    bottom: {
      x:
        targetRect.left +
        targetRect.width / 2 -
        popoverRect.width / 2 +
        offset.x,
      y: targetRect.bottom + margin + offset.y,
      canFit: spaceBottom >= popoverRect.height + margin,
    },
    left: {
      x: targetRect.left - popoverRect.width - margin + offset.x,
      y:
        targetRect.top +
        targetRect.height / 2 -
        popoverRect.height / 2 +
        offset.y,
      canFit: spaceLeft >= popoverRect.width + margin,
    },
    right: {
      x: targetRect.right + margin + offset.x,
      y:
        targetRect.top +
        targetRect.height / 2 -
        popoverRect.height / 2 +
        offset.y,
      canFit: spaceRight >= popoverRect.width + margin,
    },
    "top-left": {
      x: targetRect.left - popoverRect.width - margin + offset.x,
      y: targetRect.top - popoverRect.height - margin + offset.y,
      canFit: spaceLeft >= popoverRect.width + margin && spaceTop >= popoverRect.height + margin,
    },
    "bottom-left": {
      x: targetRect.left - popoverRect.width - margin + offset.x,
      y: targetRect.top + offset.y,
      canFit: spaceLeft >= popoverRect.width + margin && spaceBottom >= popoverRect.height + margin,
    },
  };

  // 选择最佳位置
  let bestPosition = preferredPosition;

  // 如果首选位置无法容纳，选择空间最大的位置
  if (!positions[preferredPosition as keyof typeof positions].canFit) {
    const spaces = {
      top: spaceTop,
      bottom: spaceBottom,
      left: spaceLeft,
      right: spaceRight,
      "top-left": Math.min(spaceLeft, spaceTop),
      "bottom-left": Math.min(spaceLeft, spaceBottom),
    };

    bestPosition = Object.keys(spaces).reduce((a, b) =>
      spaces[a as keyof typeof spaces] > spaces[b as keyof typeof spaces]
        ? a
        : b
    ) as keyof typeof positions;
  }

  const finalPosition = positions[bestPosition];

  // 确保不超出视口边界
  let { x, y } = finalPosition;

  // 水平边界检查
  if (x < margin) {
    x = margin;
  } else if (x + popoverRect.width > viewportWidth - margin) {
    x = viewportWidth - popoverRect.width - margin;
  }

  // 垂直边界检查
  if (y < margin) {
    y = margin;
  } else if (y + popoverRect.height > viewportHeight - margin) {
    y = viewportHeight - popoverRect.height - margin;
  }

  return {
    x,
    y,
    position: bestPosition,
    canFit: finalPosition.canFit,
  };
}

/**
 * 事件数据接口
 */
export interface EventData {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  sourceType?: number;
  openScopeType?: number;
  roomName?: string;
  self?: boolean;
  remindType?: number;
  tuCname?: string;
  scheduleType?: number;
  allDay?: boolean;
  isMultiDay?: boolean;
  [key: string]: any;
}

/**
 * 格式化时间显示
 */
function formatEventTime(start: string, end: string): string {
  const startTime = new Date(start).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const endTime = new Date(end).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${startTime} - ${endTime}`;
}

/**
 * 格式化日期显示
 */
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dateString = date.toDateString();
  const todayString = today.toDateString();
  const tomorrowString = tomorrow.toDateString();

  if (dateString === todayString) {
    return "今天";
  } else if (dateString === tomorrowString) {
    return "明天";
  } else {
    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }
}

/**
 * 获取日程类型显示文本
 */
function getScheduleTypeText(scheduleType?: number): string {
  const typeMap: Record<number, string> = {
    1: "工作日程",
    2: "出差日程",
    3: "个人日程",
    4: "会议日程",
  };

  return typeMap[scheduleType || 1] || "工作日程";
}

/**
 * 获取提醒类型显示文本
 */
function getRemindTypeText(remindType?: number): string {
  const typeMap: Record<number, string> = {
    1: "不提醒",
    2: "15分钟前",
    3: "30分钟前",
    4: "1小时前",
    5: "1天前",
  };

  return typeMap[remindType || 1] || "不提醒";
}

interface Props {
  visible: boolean;
  eventData: EventData | null;
  targetElement: HTMLElement | null;
}

interface Emits {
  (e: "close"): void;
  (e: "edit", eventData: EventData): void;
  (e: "delete", eventData: EventData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const popoverRef = ref<HTMLElement>();
const position = ref({ x: 0, y: 0 });

// 计算Popover位置
const updatePosition = async () => {
  if (!props.visible || !props.targetElement || !popoverRef.value) {
    return;
  }

  await nextTick();

  const result = calculatePopoverPosition({
    targetElement: props.targetElement,
    popoverElement: popoverRef.value,
    preferredPosition: "bottom-left",
    margin: 0,
  });

  position.value = { x: result.x, y: result.y };
};

// 监听visible变化
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      nextTick(() => {
        updatePosition();
      });
    }
  }
);

// 监听targetElement变化
watch(
  () => props.targetElement,
  () => {
    if (props.visible) {
      nextTick(() => {
        updatePosition();
      });
    }
  }
);

// 监听窗口大小变化
const handleResize = () => {
  if (props.visible) {
    updatePosition();
  }
};

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (
    props.visible &&
    popoverRef.value &&
    !popoverRef.value.contains(event.target as Node)
  ) {
    // 检查点击是否在目标事件元素上
    if (
      props.targetElement &&
      props.targetElement.contains(event.target as Node)
    ) {
      return; // 点击在目标事件元素上，不关闭 Popover
    }
    handleClose();
  }
};

// 事件处理
const handleClose = () => {
  emit("close");
};

const handleEdit = () => {
  if (props.eventData) {
    emit("edit", props.eventData);
  }
};

const handleDelete = () => {
  if (props.eventData) {
    emit("delete", props.eventData);
  }
};

// 生命周期
onMounted(() => {
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped lang="scss">
.event-popover {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5e9;
  min-width: 280px;
  max-width: 400px;
  font-size: 14px;

  &__content {
    padding: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
    flex: 1;
    margin-right: 12px;
  }

  &__close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: #6b7280;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }

    svg {
      display: block;
    }
  }

  &__body {
    padding: 16px 20px;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: flex;
    align-items: center;
    min-width: 60px;
    color: #6b7280;
    font-size: 13px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  &__icon {
    width: 14px;
    height: 14px;
    margin-right: 6px;
    fill: currentColor;
    flex-shrink: 0;
  }

  &__value {
    color: #1f2937;
    font-size: 14px;
    line-height: 1.4;
    flex: 1;
  }

  &__footer {
    display: flex;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid #f0f0f0;
  }

  &__btn {
    flex: 1;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;

    &--primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;

      &:hover {
        background: #2563eb;
        border-color: #2563eb;
      }
    }

    &--secondary {
      background: white;
      color: #6b7280;
      border-color: #d1d5db;

      &:hover {
        background: #f9fafb;
        color: #374151;
        border-color: #9ca3af;
      }
    }
  }

  // 箭头样式
  &__arrow {
    position: absolute;
    width: 0;
    height: 0;
    border: 8px solid transparent;

    &--top {
      bottom: -16px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: white;
      border-bottom: none;
    }

    &--bottom {
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-color: white;
      border-top: none;
    }

    &--left {
      right: -16px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: white;
      border-right: none;
    }

    &--right {
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: white;
      border-left: none;
    }
  }
}
</style>
