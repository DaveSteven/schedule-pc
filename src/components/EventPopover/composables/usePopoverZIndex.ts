import { ref, computed } from "vue";

// 全局共享状态 - 必须在模块级别定义，确保所有实例共享
const globalActivePopoverCount = ref(0);
const BASE_Z_INDEX = 10000;

// 用于调试的实例计数器
let instanceCounter = 0;

/**
 * 管理多个 EventPopover 的 z-index 层级
 * 确保新打开的 popover 总是显示在最上层
 * 使用全局共享状态，所有实例共享同一个计数器
 *
 * 层级分配策略：
 * - Popover: 10001, 10003, 10005... (奇数)
 * - Mask:    10002, 10004, 10006... (偶数)
 */
export function usePopoverZIndex() {
  const instanceId = ++instanceCounter;

  // 获取下一个可用的 z-index 值（Popover）
  const getNextZIndex = () => {
    globalActivePopoverCount.value++;
    // Popover 使用奇数 z-index: 10001, 10003, 10005...
    const zIndex = BASE_Z_INDEX + (globalActivePopoverCount.value * 2 - 1);
    console.log(
      `[Instance ${instanceId}] usePopoverZIndex: 分配 Popover z-index ${zIndex}, 全局计数: ${globalActivePopoverCount.value}`
    );
    return zIndex;
  };

  // 获取对应的 mask z-index 值
  const getMaskZIndex = (popoverZIndex: number) => {
    // Mask 使用偶数 z-index: 10000, 10002, 10004...
    // 确保 mask 比对应的 popover 低 1 个层级
    const maskZIndex = popoverZIndex - 1;
    console.log(
      `[Instance ${instanceId}] usePopoverZIndex: 分配 Mask z-index ${maskZIndex}`
    );
    return maskZIndex;
  };

  // 释放 z-index（当 popover 关闭时调用）
  const releaseZIndex = () => {
    if (globalActivePopoverCount.value > 0) {
      globalActivePopoverCount.value--;
      console.log(
        `[Instance ${instanceId}] usePopoverZIndex: 释放 z-index, 全局计数: ${globalActivePopoverCount.value}`
      );
    }
  };

  // 重置所有层级（用于清理）
  const resetZIndex = () => {
    globalActivePopoverCount.value = 0;
    console.log(`[Instance ${instanceId}] usePopoverZIndex: 重置所有 z-index`);
  };

  return {
    getNextZIndex,
    getMaskZIndex,
    releaseZIndex,
    resetZIndex,
    activePopoverCount: computed(() => globalActivePopoverCount.value),
  };
}
