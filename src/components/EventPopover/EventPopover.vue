<template>
  <Teleport to="body">
    <Transition name="popover" appear>
      <div
        v-if="visible"
        ref="popoverRef"
        class="event-popover"
        :class="`event-popover--${currentPosition}`"
        :style="{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 10000,
          width: computedWidth,
        }"
        @click.stop
        @mousedown.stop
      >
        <div class="event-popover__content">
          <!-- 详情内容 -->
          <div class="event-popover__body">
            <slot> </slot>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 透明遮罩层 -->
    <Transition name="mask" appear>
      <div
        v-if="visible"
        class="event-popover__mask"
        @click="handleMaskClick"
        @mousedown.prevent
        @touchstart.prevent
      ></div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted, computed } from "vue";
import { calculatePopoverPosition } from "./utils";
import type { Props, Emits } from "./types";

/**
 * EventPopover 组件
 *
 * 使用示例：
 * <EventPopover
 *   :visible="true"
 *   :target-element="targetEl"
 *   :width="500"           // 数字：500px
 *   :width="'600px'"       // 字符串：600px
 *   :width="'50vw'"        // 视口宽度：50vw
 *   :width="'80%'"         // 百分比：80%
 * />
 */

const props = withDefaults(defineProps<Props>(), {
  pointerEvents: "auto",
});
const emit = defineEmits<Emits>();

const popoverRef = ref<HTMLElement>();
const position = ref({ x: 0, y: 0 });
const currentPosition = ref<string>("bottom-left");

// 计算宽度值
const computedWidth = computed(() => {
  if (!props.width) return undefined;

  if (typeof props.width === "number") {
    return `${props.width}px`;
  }

  return props.width;
});

// 计算Popover位置
const updatePosition = async () => {
  if (!props.visible || !props.targetElement || !popoverRef.value) {
    return;
  }

  // 等待一个 tick 确保 DOM 更新
  await nextTick();

  const result = calculatePopoverPosition({
    targetElement: props.targetElement,
    popoverElement: popoverRef.value,
    margin: 0,
    width: props.width,
  });

  position.value = { x: result.x, y: result.y };
  currentPosition.value = result.position;
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
  (newTargetElement, oldTargetElement) => {
    // 如果目标元素发生变化且当前 Popover 是可见的，说明点击了其他 Event
    if (
      props.visible &&
      newTargetElement &&
      oldTargetElement &&
      newTargetElement !== oldTargetElement
    ) {
      // 先关闭当前的 Popover
      handleClose();
    }
  }
);

// 监听窗口大小变化
const handleResize = () => {
  if (props.visible) {
    updatePosition();
  }
};

// 事件处理
const handleClose = () => {
  emit("close");
};

const handleMaskClick = (event: MouseEvent) => {
  // 检查点击的目标元素
  const target = event.target as HTMLElement;

  // 如果点击的是 Popover 本身或其子元素，不关闭
  if (popoverRef.value && popoverRef.value.contains(target)) {
    return;
  }

  // 如果点击的是目标元素本身，不关闭
  if (props.targetElement && props.targetElement.contains(target)) {
    return;
  }

  // 只有真正点击遮罩层时才关闭
  if (target.classList.contains("event-popover__mask")) {
    handleClose();
  }
};

// 生命周期
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.event-popover {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5e9;
  min-width: 280px; // 默认最小宽度
  max-width: 600px; // 默认最大宽度，但可以被 width 属性覆盖
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

  &__body {
    padding: 8px;
  }
}

// Vue Transition 动画样式
.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

// 根据位置动态设置 transform-origin
.event-popover--bottom-left {
  transform-origin: top right;
}

.event-popover--left {
  transform-origin: right center;
}

.event-popover--right {
  transform-origin: left center;
}

.event-popover--top-left {
  transform-origin: bottom right;
}

.event-popover--top {
  transform-origin: bottom center;
}

.event-popover--bottom {
  transform-origin: top center;
}

.popover-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.popover-enter-to {
  opacity: 1;
  transform: scale(1);
}

.popover-leave-from {
  opacity: 1;
  transform: scale(1);
}

.popover-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// Mask 样式
.event-popover__mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  z-index: 9998;
  pointer-events: all;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

// Mask Transition 动画样式
.mask-enter-active,
.mask-leave-active {
  transition: opacity 0.2s ease-out;
}

.mask-enter-from,
.mask-leave-to {
  opacity: 0;
}

.mask-enter-to,
.mask-leave-from {
  opacity: 1;
}
</style>
