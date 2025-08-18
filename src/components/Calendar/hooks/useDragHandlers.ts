import { ref } from "vue";
import type { DragState, TimeBlock, TimeEvent } from "../components/Day/types";
import { useTimeUtils } from "./useTimeUtils";

/**
 * 拖拽功能相关的hooks
 */
export function useDragHandlers(emit: any) {
  const { minutesToPixels, pixelsToMinutes, snapToQuarter } = useTimeUtils();

  const dragState = ref<DragState>({
    isDragging: false,
    isResizing: false,
    dragType: "move",
    currentBlock: null,
    startY: 0,
    startTop: 0,
    startHeight: 0,
    startTime: 0,
    startDuration: 0,
    longPressTimer: null,
    isLongPressing: false,
    canDrag: false,
    hasStartedDrag: false,
    clickStartTime: 0,
    clickTimer: null,
    isInSmartMode: false,
    smartModeOffset: 0,
    isEventDragging: false,
    currentEvent: null,
    originalEventData: null,
    dragEventPosition: null,
    lastDragEndTime: null,
    hasMoved: false, // 新增：标记是否已经移动
    moveThreshold: 5, // 新增：移动阈值（像素）
  });

  /**
   * 开始拖拽时间块
   */
  const startTimeBlockDrag = (
    event: MouseEvent,
    block: TimeBlock,
    type: "move" | "resize-top" | "resize-bottom"
  ) => {
    event.preventDefault();
    event.stopPropagation();

    console.log("开始拖拽时间块:", type, block);

    dragState.value.isDragging = type === "move";
    dragState.value.isResizing = type !== "move";
    dragState.value.dragType = type;
    dragState.value.currentBlock = block;
    dragState.value.startY = event.clientY;
    dragState.value.startTop = block.top;
    dragState.value.startHeight = block.height;
    dragState.value.startTime = block.startTime;
    dragState.value.startDuration = block.duration;
    dragState.value.hasMoved = false; // 重置移动标志

    document.addEventListener("mousemove", handleTimeBlockDrag);
    document.addEventListener("mouseup", stopTimeBlockDrag);
  };

  /**
   * 处理时间块拖拽
   */
  const handleTimeBlockDrag = (event: MouseEvent) => {
    if (!dragState.value.currentBlock) return;

    const deltaY = event.clientY - dragState.value.startY;

    // 检查是否已经移动超过阈值
    if (Math.abs(deltaY) > dragState.value.moveThreshold) {
      dragState.value.hasMoved = true;
    }

    const block = dragState.value.currentBlock;

    if (dragState.value.dragType === "move") {
      const newTop = Math.max(
        0,
        Math.min(1440 - block.height, dragState.value.startTop + deltaY)
      );
      const newStartTime = snapToQuarter(pixelsToMinutes(newTop));

      block.top = minutesToPixels(newStartTime);
      block.startTime = newStartTime;
    } else if (dragState.value.dragType === "resize-top") {
      // 从顶部调整大小
      const newTop = Math.max(0, dragState.value.startTop + deltaY);
      const newStartTime = snapToQuarter(pixelsToMinutes(newTop));
      const originalEndTime =
        dragState.value.startTime + dragState.value.startDuration;
      const newDuration = Math.max(15, originalEndTime - newStartTime);

      if (newStartTime < originalEndTime) {
        block.top = minutesToPixels(newStartTime);
        block.startTime = newStartTime;
        block.duration = newDuration;
        block.height = minutesToPixels(newDuration);
      }
    } else if (dragState.value.dragType === "resize-bottom") {
      // 从底部调整大小
      const newHeight = Math.max(15, dragState.value.startHeight + deltaY);
      const newDuration = pixelsToMinutes(newHeight);
      const newEndTime = snapToQuarter(dragState.value.startTime + newDuration);

      if (newEndTime <= 1440) {
        block.duration = newDuration;
        block.height = minutesToPixels(newDuration);
      }
    }
  };

  /**
   * 停止时间块拖拽
   */
  const stopTimeBlockDrag = () => {
    console.log("停止拖拽，当前时间块:", dragState.value.currentBlock);

    // 只有在真正移动过的情况下才记录拖拽结束时间
    if (dragState.value.hasMoved) {
      dragState.value.lastDragEndTime = Date.now();
    }

    // 延迟重置拖拽状态，防止立即触发点击事件
    setTimeout(() => {
      dragState.value.isDragging = false;
      dragState.value.isResizing = false;
      dragState.value.currentBlock = null;
      dragState.value.hasMoved = false; // 重置移动标志
    }, 100);

    document.removeEventListener("mousemove", handleTimeBlockDrag);
    document.removeEventListener("mouseup", stopTimeBlockDrag);
  };

  /**
   * 开始拖拽事件
   */
  const startEventDrag = (event: MouseEvent, timeEvent: TimeEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // 记录开始拖拽的时间，用于区分点击和拖拽
    dragState.value.clickStartTime = Date.now();

    // 设置一个延迟定时器，只有在真正开始拖拽时才设置拖拽状态
    dragState.value.clickTimer = setTimeout(() => {
      dragState.value.isEventDragging = true;
      dragState.value.currentEvent = timeEvent;
      dragState.value.originalEventData = {
        startTime: timeEvent.startTime,
        duration: timeEvent.duration,
      };
      dragState.value.startY = event.clientY;
      dragState.value.startTop = timeEvent.top;
      dragState.value.startHeight = timeEvent.height;
      dragState.value.startTime = timeEvent.startTime;
      dragState.value.startDuration = timeEvent.duration;
      dragState.value.hasMoved = false; // 重置移动标志

      document.addEventListener("mousemove", handleEventDrag);
      document.addEventListener("mouseup", stopEventDrag);
    }, 150); // 150ms延迟，足够区分点击和拖拽
  };

  /**
   * 处理事件拖拽
   */
  const handleEventDrag = (event: MouseEvent) => {
    if (!dragState.value.currentEvent || !dragState.value.isEventDragging)
      return;

    event.preventDefault();

    const deltaY = event.clientY - dragState.value.startY;

    // 检查是否已经移动超过阈值
    if (Math.abs(deltaY) > dragState.value.moveThreshold) {
      dragState.value.hasMoved = true;
    }

    const newTop = Math.max(
      0,
      Math.min(
        1440 - dragState.value.currentEvent.duration,
        dragState.value.startTop + deltaY
      )
    );
    const newStartTime = snapToQuarter(pixelsToMinutes(newTop));

    if (
      !dragState.value.dragEventPosition ||
      dragState.value.dragEventPosition.startTime !== newStartTime
    ) {
      dragState.value.dragEventPosition = {
        top: minutesToPixels(newStartTime),
        startTime: newStartTime,
      };
    }
  };

  /**
   * 停止事件拖拽
   */
  const stopEventDrag = () => {
    // 清理点击定时器
    if (dragState.value.clickTimer) {
      clearTimeout(dragState.value.clickTimer);
      dragState.value.clickTimer = null;
    }

    // 如果没有真正开始拖拽，直接返回
    if (!dragState.value.isEventDragging || !dragState.value.currentEvent) {
      return;
    }

    // 只有在真正移动过的情况下才更新事件位置和触发event-change
    if (dragState.value.hasMoved && dragState.value.dragEventPosition) {
      const finalStartTime = dragState.value.dragEventPosition.startTime;

      // 更新事件位置
      dragState.value.currentEvent.top = dragState.value.dragEventPosition.top;
      dragState.value.currentEvent.startTime = finalStartTime;

      console.log("事件拖拽完成:", {
        eventId: dragState.value.currentEvent.id,
        newStartTime: finalStartTime,
        newDuration: dragState.value.currentEvent.duration,
        newTop: dragState.value.currentEvent.top,
      });

      // 记录拖拽结束时间
      dragState.value.lastDragEndTime = Date.now();

      const eventUpdateData = {
        eventId: dragState.value.currentEvent.id,
        newStartTime: finalStartTime,
        newDuration: dragState.value.currentEvent.duration,
      };

      // 触发事件变更
      emit("event-change", {
        event: { ...dragState.value.currentEvent },
        el: null,
      });

      // 延迟清理状态，防止立即触发点击事件
      setTimeout(() => {
        dragState.value.isEventDragging = false;
        dragState.value.currentEvent = null;
        dragState.value.originalEventData = null;
        dragState.value.dragEventPosition = null;
        dragState.value.hasMoved = false; // 重置移动标志
        dragState.value.clickStartTime = 0;
      }, 100);

      // 清理鼠标事件监听器
      document.removeEventListener("mousemove", handleEventDrag);
      document.removeEventListener("mouseup", stopEventDrag);

      return eventUpdateData;
    } else {
      // 如果没有移动，直接清理状态
      console.log("事件拖拽取消，未发生移动");

      // 延迟清理状态，防止立即触发点击事件
      setTimeout(() => {
        dragState.value.isEventDragging = false;
        dragState.value.currentEvent = null;
        dragState.value.originalEventData = null;
        dragState.value.dragEventPosition = null;
        dragState.value.hasMoved = false; // 重置移动标志
        dragState.value.clickStartTime = 0;
      }, 100);

      // 清理鼠标事件监听器
      document.removeEventListener("mousemove", handleEventDrag);
      document.removeEventListener("mouseup", stopEventDrag);
    }
  };

  return {
    dragState,
    startTimeBlockDrag,
    startEventDrag,
    stopEventDrag,
  };
}
