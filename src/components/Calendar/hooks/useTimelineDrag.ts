import { ref } from "vue";
import { useTimeUtils } from "./useTimeUtils";

/**
 * 通用时间轴拖拽处理hook
 * 支持周视图和日视图的不同拖拽需求
 */
export interface BaseDragState {
  isDragging: boolean;
  isResizing: boolean;
  dragType: "move" | "resize-top" | "resize-bottom";
  currentBlock: any;
  startY: number;
  startX: number;
  startTop: number;
  startHeight: number;
  startTime: number;
  startDuration: number;
  hasMoved: boolean;
  moveThreshold: number;
  lastDragEndTime: number | null;
}

export interface DragOptions {
  // 是否支持X轴拖拽（日期切换）
  enableXAxisDrag?: boolean;
  // 是否支持Y轴拖拽（时间调整）
  enableYAxisDrag?: boolean;
  // 是否支持大小调整
  enableResize?: boolean;
  // 时间轴高度限制
  maxTimeHeight?: number;
  // 最小持续时间
  minDuration?: number;
  // 日期范围（用于周视图）
  dateRange?: string[];
  // 列宽度计算函数（用于周视图）
  getColumnWidth?: () => number;
  // X轴拖拽阈值（像素）
  xAxisDragThreshold?: number;
}

export function useTimelineDrag(options: DragOptions = {}) {
  const {
    enableXAxisDrag = false,
    enableYAxisDrag = true,
    enableResize = true,
    maxTimeHeight = 1440,
    minDuration = 15,
    dateRange = [],
    getColumnWidth,
    xAxisDragThreshold = 30,
  } = options;

  const { minutesToPixels, pixelsToMinutes, snapToQuarter } = useTimeUtils();

  const dragState = ref<BaseDragState>({
    isDragging: false,
    isResizing: false,
    dragType: "move",
    currentBlock: null,
    startY: 0,
    startX: 0,
    startTop: 0,
    startHeight: 0,
    startTime: 0,
    startDuration: 0,
    hasMoved: false,
    moveThreshold: 5,
    lastDragEndTime: null,
  });

  // X轴拖拽的额外状态
  const xDragState = ref({
    startDate: "",
    hasMovedX: false,
    moveThresholdX: xAxisDragThreshold,
    finalDeltaX: 0, // 记录最终的X轴偏移
  });

  /**
   * 开始拖拽时间块
   */
  const startTimeBlockDrag = (
    event: MouseEvent,
    block: any,
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
    dragState.value.startX = event.clientX;
    dragState.value.startTop = block.top;
    dragState.value.startHeight = block.height;
    dragState.value.startTime = block.startTime;
    dragState.value.startDuration = block.duration;
    dragState.value.hasMoved = false;

    // 初始化X轴拖拽状态
    if (enableXAxisDrag && block.date) {
      xDragState.value.startDate = block.date;
      xDragState.value.hasMovedX = false;
      xDragState.value.finalDeltaX = 0;
    }

    document.addEventListener("mousemove", handleTimeBlockDrag);
    document.addEventListener("mouseup", stopTimeBlockDrag);
  };

  /**
   * 处理时间块拖拽
   */
  const handleTimeBlockDrag = (event: MouseEvent) => {
    if (!dragState.value.currentBlock) return;

    const deltaY = event.clientY - dragState.value.startY;
    const deltaX = event.clientX - dragState.value.startX;

    // 检查是否已经移动超过阈值
    if (
      Math.abs(deltaY) > dragState.value.moveThreshold ||
      Math.abs(deltaX) > dragState.value.moveThreshold
    ) {
      dragState.value.hasMoved = true;
    }

    const block = dragState.value.currentBlock;

    if (dragState.value.dragType === "move") {
      // Y轴：调整时间
      if (enableYAxisDrag) {
        const newTop = Math.max(
          0,
          Math.min(
            maxTimeHeight - block.height,
            dragState.value.startTop + deltaY
          )
        );
        const newStartTime = snapToQuarter(pixelsToMinutes(newTop));

        block.top = minutesToPixels(newStartTime);
        block.startTime = newStartTime;
      }

      // X轴：拖拽过程中实时跟随，更新显示位置
      if (enableXAxisDrag && dateRange.length > 0 && getColumnWidth) {
        // 检查X轴是否移动超过阈值
        if (Math.abs(deltaX) > xDragState.value.moveThresholdX) {
          xDragState.value.hasMovedX = true;
          xDragState.value.finalDeltaX = deltaX; // 记录最终的X轴偏移

          const columnWidth = getColumnWidth();
          if (columnWidth > 0) {
            const dateOffset = Math.round(deltaX / columnWidth);
            const currentDateIndex = dateRange.findIndex(
              (d) => d === xDragState.value.startDate
            );

            if (currentDateIndex !== -1) {
              const newDateIndex = Math.max(
                0,
                Math.min(dateRange.length - 1, currentDateIndex + dateOffset)
              );
              const newDate = dateRange[newDateIndex];

              // 拖拽过程中实时跟随，只更新显示位置，不改变实际数据
              if (newDate && newDate !== block.date) {
                console.log(
                  `X轴拖拽中：从 ${xDragState.value.startDate} 移动到 ${newDate}, 偏移: ${dateOffset}, 列宽: ${columnWidth}, deltaX: ${deltaX}`
                );

                // 在拖拽过程中，我们只更新显示用的临时日期，不改变实际的时间块数据
                // 这样可以避免拖拽过程中的数据不一致问题
                if (!block._tempDisplayDate) {
                  block._tempDisplayDate = block.date; // 保存原始日期
                }
                block.date = newDate; // 临时更新显示日期
              }
            }
          }
        } else {
          // 如果移动距离不够，重置X轴拖拽状态
          xDragState.value.hasMovedX = false;
          xDragState.value.finalDeltaX = 0;
        }
      }
    } else if (enableResize && dragState.value.dragType === "resize-top") {
      // 从顶部调整大小
      const newTop = Math.max(0, dragState.value.startTop + deltaY);
      const newStartTime = snapToQuarter(pixelsToMinutes(newTop));
      // 使用拖拽开始时的开始时间和持续时间，而不是当前可能已经被修改的值
      const originalEndTime =
        dragState.value.startTime + dragState.value.startDuration;
      const newDuration = Math.max(minDuration, originalEndTime - newStartTime);

      if (newStartTime < originalEndTime) {
        block.top = minutesToPixels(newStartTime);
        block.startTime = newStartTime;
        block.duration = newDuration;
        block.height = minutesToPixels(newDuration);

        console.log("resize-top 吸附调试:", {
          deltaY,
          newTop,
          pixelsToMinutes: pixelsToMinutes(newTop),
          snappedStartTime: newStartTime,
          newDuration,
          newHeight: minutesToPixels(newDuration),
          startTime: dragState.value.startTime,
          startDuration: dragState.value.startDuration,
          originalEndTime,
        });
      }
    } else if (enableResize && dragState.value.dragType === "resize-bottom") {
      // 从底部调整大小
      const newHeight = Math.max(
        minDuration,
        dragState.value.startHeight + deltaY
      );
      const newDuration = pixelsToMinutes(newHeight);
      // 使用拖拽开始时的开始时间，而不是当前可能已经被修改的开始时间
      const newEndTime = snapToQuarter(dragState.value.startTime + newDuration);

      if (newEndTime <= maxTimeHeight) {
        // 使用吸附后的结束时间重新计算持续时间
        const snappedDuration = newEndTime - dragState.value.startTime;
        if (snappedDuration >= minDuration) {
          block.duration = snappedDuration;
          block.height = minutesToPixels(snappedDuration);

          console.log("resize-bottom 吸附调试:", {
            deltaY,
            newHeight,
            pixelsToMinutes: pixelsToMinutes(newHeight),
            newEndTime,
            snappedDuration,
            newHeightPixels: minutesToPixels(snappedDuration),
            startTime: dragState.value.startTime,
            originalStartTime: dragState.value.startTime,
          });
        }
      }
    }
  };

  /**
   * 停止时间块拖拽
   */
  const stopTimeBlockDrag = () => {
    console.log("停止拖拽，当前时间块:", dragState.value.currentBlock);

    // 在拖拽结束时处理X轴日期切换
    if (
      dragState.value.hasMoved &&
      xDragState.value.hasMovedX &&
      enableXAxisDrag &&
      dateRange.length > 0 &&
      getColumnWidth
    ) {
      const block = dragState.value.currentBlock;
      if (block && block.date) {
        // 使用记录的最终X轴偏移来计算日期切换
        const finalDeltaX = xDragState.value.finalDeltaX;
        const columnWidth = getColumnWidth();

        if (columnWidth > 0) {
          const dateOffset = Math.round(finalDeltaX / columnWidth);
          const currentDateIndex = dateRange.findIndex(
            (d) => d === xDragState.value.startDate
          );

          if (currentDateIndex !== -1) {
            const newDateIndex = Math.max(
              0,
              Math.min(dateRange.length - 1, currentDateIndex + dateOffset)
            );
            const newDate = dateRange[newDateIndex];

            // 在拖拽结束时更新实际日期
            if (newDate && newDate !== xDragState.value.startDate) {
              console.log(
                `拖拽结束：从 ${xDragState.value.startDate} 切换到 ${newDate}, 偏移: ${dateOffset}, 最终deltaX: ${finalDeltaX}`
              );

              // 恢复原始日期（如果存在临时显示日期）
              if (block._tempDisplayDate) {
                block.date = block._tempDisplayDate;
                delete block._tempDisplayDate;
              }

              // 保存原始的时间信息
              const originalStartTime = block.startTime;
              const originalDuration = block.duration;

              // 更新到新日期
              block.date = newDate;

              // 重新计算时间块的位置和尺寸，确保与新日期保持一致
              // 这里我们保持原有的时间值，但确保位置计算正确
              block.top = minutesToPixels(originalStartTime);
              block.height = minutesToPixels(originalDuration);

              console.log(
                `日期切换后，保持时间: ${originalStartTime} - ${originalDuration}, 新日期: ${newDate}`
              );
            }
          }
        }
      }
    }

    // 只有在真正移动过的情况下才记录拖拽结束时间
    if (dragState.value.hasMoved) {
      dragState.value.lastDragEndTime = Date.now();
    }

    // 延迟重置拖拽状态，防止立即触发点击事件
    setTimeout(() => {
      dragState.value.isDragging = false;
      dragState.value.isResizing = false;
      dragState.value.currentBlock = null;
      dragState.value.hasMoved = false;

      // 重置X轴拖拽状态
      xDragState.value.startDate = "";
      xDragState.value.hasMovedX = false;
      xDragState.value.finalDeltaX = 0;

      // 清理时间块的临时显示数据
      if (
        dragState.value.currentBlock &&
        dragState.value.currentBlock._tempDisplayDate
      ) {
        delete dragState.value.currentBlock._tempDisplayDate;
      }
    }, 100);

    document.removeEventListener("mousemove", handleTimeBlockDrag);
    document.removeEventListener("mouseup", stopTimeBlockDrag);
  };

  /**
   * 检查是否应该忽略点击事件（防止拖拽后立即触发点击）
   */
  const shouldIgnoreClick = (): boolean => {
    if (dragState.value.isDragging && dragState.value.hasMoved) return true;
    if (dragState.value.isResizing && dragState.value.hasMoved) return true;

    if (dragState.value.lastDragEndTime) {
      const timeSinceDrag = Date.now() - dragState.value.lastDragEndTime;
      return timeSinceDrag < 200;
    }

    return false;
  };

  return {
    dragState,
    startTimeBlockDrag,
    stopTimeBlockDrag,
    shouldIgnoreClick,
  };
}
