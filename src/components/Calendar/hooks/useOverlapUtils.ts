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
    const timeGroups = new Map();

    events.forEach((event) => {
      const key = event.startTime;
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
