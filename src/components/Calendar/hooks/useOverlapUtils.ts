/**
 * 事件重叠计算相关的工具函数
 */
export function useOverlapUtils() {
  /**
   * 计算事件的重叠样式
   */
  const calculateOverlapStyle = (
    events: any[],
    currentEventIndex: number
  ): { width: string; left: string; zIndex: number } => {
    const totalEvents = events.length;
    const width = `${100 / totalEvents}%`;
    const left = `${(currentEventIndex * 100) / totalEvents}%`;
    const zIndex = 20 + totalEvents - currentEventIndex; // 提高z-index基础值，确保高于timeBlock

    return { width, left, zIndex };
  };

  /**
   * 处理重叠事件（Day组件版本）
   */
  const processOverlappingEvents = (events: any[]) => {
    // 检测和处理相同时间的事件重叠
    // 按开始时间分组
    const timeGroups = new Map<number, any[]>();

    events.forEach((event) => {
      const key = event.startTime;
      if (!timeGroups.has(key)) {
        timeGroups.set(key, []);
      }
      timeGroups.get(key)!.push(event);
    });

    // 计算基础zIndex：时间晚的事件zIndex更高
    const sortedStartTimes = Array.from(timeGroups.keys()).sort((a, b) => a - b);
    const baseZIndexMap = new Map<number, number>();
    sortedStartTimes.forEach((startTime, index) => {
      baseZIndexMap.set(startTime, (index + 1) * 10); // 每个时间段间隔10
    });

    // 处理每个时间组中的重叠事件
    timeGroups.forEach((groupEvents, startTime) => {
      const baseZIndex = baseZIndexMap.get(startTime) || 1;
      
      if (groupEvents.length > 1) {
        // 智能计算重叠事件的样式
        const totalEvents = groupEvents.length;

        // 使用简单直接的计算方式
        // 目标：确保总覆盖 = 100%
        // 公式：leftOffset * (totalEvents - 1) + width = 100
        // 设置重叠为宽度的20%
        const overlapRatio = 0.2;
        // 解方程：width * (1 + overlapRatio * (totalEvents - 1)) = 100
        const width = 100 / (1 + overlapRatio * (totalEvents - 1));
        const leftOffset = width * overlapRatio;

        // 为每个事件分配位置，zIndex在基础zIndex上递增
        groupEvents.forEach((event, index) => {
          const left = leftOffset * index;
          event.overlapStyle = {
            width: `${width}%`,
            left: `${left}%`,
            zIndex: baseZIndex + index, // 基础zIndex + 重叠递增
          };
        });
      } else {
        // 单个事件，使用基础zIndex
        groupEvents[0].overlapStyle = {
          width: "100%",
          left: "0%",
          zIndex: baseZIndex,
        };
      }
    });

    return events;
  };

  /**
   * 处理重叠事件（Week组件版本）
   */
  const processOverlappingEventsForWeek = (events: any[]) => {
    const timeGroups = new Map();

    events.forEach((event) => {
      const key = `${event.date}-${event.startTime}`;
      if (!timeGroups.has(key)) {
        timeGroups.set(key, []);
      }
      timeGroups.get(key).push(event);
    });

    timeGroups.forEach((groupEvents) => {
      if (groupEvents.length > 1) {
        groupEvents.forEach((event: any, index: number) => {
          const overlapStyle = calculateOverlapStyle(groupEvents, index);
          event.overlapStyle = {
            width: overlapStyle.width,
            left: overlapStyle.left,
            zIndex: overlapStyle.zIndex,
          };
        });
      } else {
        groupEvents[0].overlapStyle = {
          width: "100%",
          left: "0%",
          zIndex: 20, // 提高单个事件的z-index，确保高于timeBlock
        };
      }
    });

    return events;
  };

  return {
    calculateOverlapStyle,
    processOverlappingEvents,
    processOverlappingEventsForWeek,
  };
}
