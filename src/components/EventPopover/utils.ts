import { REMIND_TYPE_LIST } from "@/constants";
import type { PopoverPositionOptions } from "./types";

/**
 * 计算Popover的最佳显示位置
 */
export function calculatePopoverPosition(options: PopoverPositionOptions) {
  const {
    targetElement,
    popoverElement,
    offset = { x: 0, y: 0 },
    margin = 0,
    width,
  } = options;

  // 获取目标元素的位置信息
  const targetRect = targetElement.getBoundingClientRect();

  // 直接使用传入的宽度进行计算，避免DOM尺寸获取的时机问题
  let popoverWidth = 0;
  let popoverHeight = 153; // 默认高度

  if (width !== undefined) {
    if (typeof width === "number") {
      popoverWidth = width;
    } else if (typeof width === "string") {
      if (width.endsWith("px")) {
        popoverWidth = parseInt(width, 10);
      } else if (width.endsWith("%")) {
        popoverWidth = (parseInt(width, 10) / 100) * window.innerWidth;
      } else if (width.endsWith("vw")) {
        popoverWidth = (parseInt(width, 10) / 100) * window.innerWidth;
      } else {
        const parsed = parseInt(width, 10);
        if (!isNaN(parsed)) {
          popoverWidth = parsed;
        }
      }
    }
  }

  // 如果没有传入宽度，则从DOM获取（作为后备）
  if (popoverWidth <= 0) {
    const popoverRect = popoverElement.getBoundingClientRect();
    popoverWidth = popoverRect.width > 0 ? popoverRect.width : 400; // 默认400px
    popoverHeight = popoverRect.height > 0 ? popoverRect.height : 153;
  }

  // 创建准确的尺寸对象
  const accuratePopoverRect = {
    width: popoverWidth,
    height: popoverHeight,
  };

  // 获取DOM尺寸用于调试（不用于计算）
  const popoverRect = popoverElement.getBoundingClientRect();

  // 获取视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 计算各个方向的可用空间
  const spaceTop = targetRect.top;
  const spaceBottom = viewportHeight - targetRect.bottom;
  const spaceLeft = targetRect.left;
  const spaceRight = viewportWidth - targetRect.right;

  // 为左边添加安全距离
  const leftSafeMargin = 50; // 左边安全距离
  const adjustedSpaceLeft = Math.max(0, spaceLeft - leftSafeMargin);

  // 计算各个位置的坐标
  const positions = {
    top: {
      x:
        targetRect.left +
        targetRect.width / 2 -
        accuratePopoverRect.width / 2 +
        offset.x,
      y: targetRect.top - accuratePopoverRect.height - margin + offset.y,
      canFit: spaceTop >= accuratePopoverRect.height + margin,
    },
    bottom: {
      x:
        targetRect.left +
        targetRect.width / 2 -
        accuratePopoverRect.width / 2 +
        offset.x,
      y: targetRect.bottom + margin + offset.y,
      canFit: spaceBottom >= accuratePopoverRect.height + margin,
    },
    left: {
      x: targetRect.left - accuratePopoverRect.width - margin + offset.x,
      y: targetRect.top + offset.y, // 与 event 顶部对齐
      canFit:
        adjustedSpaceLeft >= accuratePopoverRect.width + margin &&
        targetRect.top + accuratePopoverRect.height + margin <= viewportHeight, // 确保不会超出底部
    },
    right: {
      x: targetRect.right + margin + offset.x,
      y: targetRect.top + offset.y, // 与 event 顶部对齐
      canFit:
        spaceRight >= accuratePopoverRect.width + margin &&
        targetRect.top + accuratePopoverRect.height + margin <= viewportHeight, // 确保不会超出底部
    },
    "top-left": {
      x: targetRect.left - accuratePopoverRect.width - margin + offset.x,
      y: targetRect.top - accuratePopoverRect.height - margin + offset.y,
      canFit:
        adjustedSpaceLeft >= accuratePopoverRect.width + margin &&
        spaceTop >= accuratePopoverRect.height + margin,
    },
    "bottom-left": {
      x: targetRect.left - accuratePopoverRect.width - margin + offset.x,
      y: targetRect.top + offset.y, // 与 event 顶部对齐
      canFit:
        adjustedSpaceLeft >= accuratePopoverRect.width + margin &&
        spaceBottom >= accuratePopoverRect.height + margin,
    },
  };

  // 新的定位逻辑：优先左侧，但如果会覆盖目标元素则直接选择右侧
  let bestPosition = "left";
  let finalPosition = positions.left;

  // 1. 优先尝试左侧位置
  if (positions.left.canFit) {
    // console.log("决策: 选择左侧位置");
    bestPosition = "left";
    finalPosition = positions.left;
  }
  // 2. 如果左侧空间不足，检查是否会覆盖目标元素
  else if (
    adjustedSpaceLeft < accuratePopoverRect.width + margin &&
    spaceRight > 0
  ) {
    // 计算如果向右移动调整后，popover 是否会覆盖目标元素
    const leftSpaceNeeded =
      accuratePopoverRect.width + margin - adjustedSpaceLeft;
    const maxRightShift = Math.min(leftSpaceNeeded, spaceRight);

    if (maxRightShift > 0) {
      // 计算调整后的位置
      const adjustedX =
        targetRect.left -
        accuratePopoverRect.width -
        margin +
        offset.x +
        maxRightShift;
      const finalX = Math.max(leftSafeMargin, adjustedX);

      // 检查是否会覆盖目标元素
      const popoverRightEdge = finalX + accuratePopoverRect.width;
      const targetLeftEdge = targetRect.left;

      if (popoverRightEdge >= targetLeftEdge) {
        // 会覆盖目标元素，直接选择右侧位置
        // console.log("决策: 左侧调整会覆盖目标元素，选择右侧位置");
        if (positions.right.canFit) {
          bestPosition = "right";
          finalPosition = positions.right;
        } else {
          // 如果右侧也不够，尝试其他位置
          if (positions["top-left"].canFit) {
            bestPosition = "top-left";
            finalPosition = positions["top-left"];
          } else if (positions.top.canFit) {
            bestPosition = "top";
            finalPosition = positions.top;
          } else if (positions["bottom-left"].canFit) {
            bestPosition = "bottom-left";
            finalPosition = positions["bottom-left"];
          } else if (positions.bottom.canFit) {
            bestPosition = "bottom";
            finalPosition = positions.bottom;
          }
        }
      } else {
        // 不会覆盖目标元素，使用调整后的左侧位置
        // console.log(`决策: 左侧空间调整成功，向右移动 ${maxRightShift}px`);
        bestPosition = "left-adjusted";
        finalPosition = {
          x: finalX,
          y: targetRect.top + offset.y,
          canFit: true,
        };
      }
    } else {
      // 调整失败，尝试其他位置
      if (positions["top-left"].canFit) {
        bestPosition = "top-left";
        finalPosition = positions["top-left"];
      } else if (positions.top.canFit) {
        bestPosition = "top";
        finalPosition = positions.top;
      } else if (positions["bottom-left"].canFit) {
        bestPosition = "bottom-left";
        finalPosition = positions["bottom-left"];
      } else if (positions.bottom.canFit) {
        bestPosition = "bottom";
        finalPosition = positions.bottom;
      }
    }
  }
  // 3. 如果左侧调整失败，尝试 top-left
  else if (positions["top-left"].canFit) {
    // console.log("决策: 选择 top-left 位置");
    bestPosition = "top-left";
    finalPosition = positions["top-left"];
  }
  // 4. 如果 top-left 也不够，尝试 top
  else if (positions.top.canFit) {
    // console.log("决策: 选择 top 位置");
    bestPosition = "top";
    finalPosition = positions.top;
  }
  // 5. 如果顶部空间也不够，尝试 bottom-left
  else if (positions["bottom-left"].canFit) {
    // console.log("决策: 选择 bottom-left 位置");
    bestPosition = "bottom-left";
    finalPosition = positions["bottom-left"];
  }
  // 6. 如果 bottom-left 也不够，尝试 bottom
  else if (positions.bottom.canFit) {
    // console.log("决策: 选择 bottom 位置");
    bestPosition = "bottom";
    finalPosition = positions.bottom;
  }
  // 7. 如果都不行，选择空间最大的位置
  else {
    // console.log("决策: 选择空间最大的位置");
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

    finalPosition = positions[bestPosition as keyof typeof positions];
  }

  // console.log("最终选择的位置:", bestPosition);
  // if (bestPosition === "left-adjusted") {
  //   console.log("左侧空间调整详情:", {
  //     originalLeftSpace: spaceLeft,
  //     adjustedLeftSpace: adjustedSpaceLeft,
  //     leftSafeMargin,
  //     neededSpace: accuratePopoverRect.width + margin,
  //     rightShiftApplied: accuratePopoverRect.width + margin - adjustedSpaceLeft,
  //     finalLeftSpace:
  //       adjustedSpaceLeft +
  //       (accuratePopoverRect.width + margin - adjustedSpaceLeft),
  //     finalX: finalPosition.x,
  //     leftSafeDistance: finalPosition.x - leftSafeMargin,
  //     explanation: "向右移动来增加左侧可用空间，保持左侧安全距离",
  //   });
  // }
  // console.log("最终坐标:", { x: finalPosition.x, y: finalPosition.y });

  // 确保不超出视口边界
  let { x, y } = finalPosition;

  // 定义底部安全边距（统一使用）
  const bottomSafeMargin = 40; // 底部安全边距，确保按钮完全可见

  // console.log("边界检查前的坐标:", { x, y });

  // 水平边界检查
  if (x < leftSafeMargin) {
    // console.log("水平边界调整: 左边界超出，调整到左侧安全距离");
    x = leftSafeMargin;
  } else if (x + accuratePopoverRect.width > viewportWidth - margin) {
    // console.log("水平边界调整: 右边界超出，调整到右边界");
    x = viewportWidth - accuratePopoverRect.width - margin;
  }

  // 垂直边界检查 - 更严格的边界处理
  if (y < margin) {
    // console.log("垂直边界调整: 上边界超出，调整到 margin");
    y = margin;
  } else if (y + popoverRect.height > viewportHeight - margin) {
    // console.log("垂直边界调整: 下边界超出，尝试向上调整");
    // 如果超出底部，尝试向上调整，为底部留出安全边距
    const newY = viewportHeight - popoverRect.height - bottomSafeMargin;
    if (newY >= margin) {
      y = newY;
      // console.log(
      //   "垂直边界调整: 向上调整成功，新坐标:",
      //   newY,
      //   "底部安全边距:",
      //   bottomSafeMargin
      // );
    } else {
      // 如果向上调整后仍然超出顶部，则强制显示在顶部
      y = margin;
      // console.log("垂直边界调整: 向上调整后仍超出顶部，强制显示在顶部");
    }
  }

  // 如果调整后仍然超出边界，尝试重新计算位置
  if (y + popoverRect.height > viewportHeight - margin || y < margin) {
    // console.log("边界调整后仍超出，尝试重新计算位置");
    // 强制使用 top 位置
    if (spaceTop >= popoverRect.height + margin) {
      y = targetRect.top - popoverRect.height - margin + offset.y;
      bestPosition = "top";
      // console.log("强制使用 top 位置，新坐标:", y);
    } else {
      // 如果顶部空间也不够，强制显示在顶部边界
      y = margin;
      // console.log("强制显示在顶部边界");
    }
  }

  // 最终检查：确保底部有足够的安全边距（无论是否超出边界都要检查）
  const currentBottom = y + popoverRect.height;
  const safeBottom = viewportHeight - bottomSafeMargin;

  // console.log("底部安全边距检查:", {
  //   currentBottom,
  //   safeBottom,
  //   bottomSafeMargin,
  //   needsAdjustment: currentBottom > safeBottom,
  //   distanceToBottom: viewportHeight - currentBottom,
  // });

  // 修复：即使没有超出安全边界，也要确保有足够的底部空间
  if (
    currentBottom > safeBottom ||
    viewportHeight - currentBottom < bottomSafeMargin
  ) {
    // console.log("最终检查: 底部安全边距不足，向上调整");
    const finalY = viewportHeight - popoverRect.height - bottomSafeMargin;
    if (finalY >= margin) {
      y = finalY;
      // console.log(
      //   "最终调整后的坐标:",
      //   y,
      //   "新的底部位置:",
      //   y + popoverRect.height
      // );
    } else {
      y = margin;
      // console.log("无法满足底部安全边距，强制显示在顶部");
    }
  } else {
    // console.log("底部安全边距检查通过，无需调整");
  }

  // console.log("边界检查后的最终坐标:", { x, y });
  // console.log("=== 定位调试结束 ===\n");

  return {
    x,
    y,
    position: bestPosition,
    canFit: finalPosition.canFit,
  };
}

/**
 * 格式化时间显示
 */
export function formatEventTime(start: string, end: string): string {
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
export function formatEventDate(dateStr: string): string {
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
export function getScheduleTypeText(scheduleType?: number): string {
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
export function getRemindTypeText(remindType?: number): string {
  return REMIND_TYPE_LIST.find((item) => item.type === remindType)?.name || "";
}
