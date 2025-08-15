import { ref } from "vue";
import type { DragState, TimeBlock, TimeEvent } from "../components/Day/types";
import { useTimeUtils } from "./useTimeUtils";

/**
 * 拖拽功能相关的hooks
 */
export function useDragHandlers() {
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

    document.addEventListener("mousemove", handleTimeBlockDrag);
    document.addEventListener("mouseup", stopTimeBlockDrag);
  };

  /**
   * 处理时间块拖拽
   */
  const handleTimeBlockDrag = (event: MouseEvent) => {
    if (!dragState.value.currentBlock) return;

    const deltaY = event.clientY - dragState.value.startY;
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

    // 记录拖拽结束时间
    dragState.value.lastDragEndTime = Date.now();

    // 延迟重置拖拽状态，防止立即触发点击事件
    setTimeout(() => {
      dragState.value.isDragging = false;
      dragState.value.isResizing = false;
      dragState.value.currentBlock = null;
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

    document.addEventListener("mousemove", handleEventDrag);
    document.addEventListener("mouseup", stopEventDrag);
  };

  /**
   * 处理事件拖拽
   */
  const handleEventDrag = (event: MouseEvent) => {
    if (!dragState.value.currentEvent || !dragState.value.isEventDragging)
      return;

    event.preventDefault();

    const deltaY = event.clientY - dragState.value.startY;

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
    if (!dragState.value.currentEvent || !dragState.value.isEventDragging)
      return;

    const finalStartTime =
      dragState.value.dragEventPosition?.startTime ||
      dragState.value.currentEvent.startTime;

    if (dragState.value.currentEvent && dragState.value.dragEventPosition) {
      // 更新事件位置
      dragState.value.currentEvent.top = dragState.value.dragEventPosition.top;
      dragState.value.currentEvent.startTime = finalStartTime;

      console.log("事件拖拽完成:", {
        eventId: dragState.value.currentEvent.id,
        newStartTime: finalStartTime,
        newDuration: dragState.value.currentEvent.duration,
        newTop: dragState.value.currentEvent.top,
      });
    }

    // 记录拖拽结束时间
    dragState.value.lastDragEndTime = Date.now();

    const eventUpdateData = {
      eventId: dragState.value.currentEvent.id,
      newStartTime: finalStartTime,
      newDuration: dragState.value.currentEvent.duration,
    };

    // 延迟清理状态，防止立即触发点击事件
    setTimeout(() => {
      dragState.value.isEventDragging = false;
      dragState.value.currentEvent = null;
      dragState.value.originalEventData = null;
      dragState.value.dragEventPosition = null;
    }, 100);

    // 清理鼠标事件监听器
    document.removeEventListener("mousemove", handleEventDrag);
    document.removeEventListener("mouseup", stopEventDrag);

    return eventUpdateData;
  };

  return {
    dragState,
    startTimeBlockDrag,
    startEventDrag,
    stopEventDrag,
  };
}
