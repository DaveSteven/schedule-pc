import { ref, computed, onMounted, onUnmounted, type Ref, watch } from 'vue';
import dayjs from 'dayjs';
import type { WeekDateInfo, TimeBlock } from './types';
import { dateUtils, eventUtils } from './utils';
import { useTimelineBase } from '../../hooks/useTimelineBase';
import { useTimelineDrag } from '../../hooks/useTimelineDrag';
import { useOverlapUtils } from '../../hooks/useOverlapUtils';

/**
 * 周视图时间管理组合函数
 */
export function useWeekTime() {
  // 使用通用的时间轴基础功能
  const { currentTimeTop, shouldShowCurrentTime } = useTimelineBase(ref(dayjs().format("YYYY-MM-DD")));
  
  return {
    currentTimeTop,
    shouldShowCurrentTime,
  };
}

/**
 * 周视图全天事件管理组合函数
 */
export function useAllDayEvents(events: Ref<any[]>, weekRange: Ref<WeekDateInfo[]>) {
  const isAllDayExpanded = ref(false);

  // 计算全天事件
  const allDayEvents = computed(() => 
    eventUtils.calculateAllDayEvents(events.value, weekRange.value)
  );

  // 合并获取指定日期的所有全天日程（跨天+单日）
  const getAllDayEventsForDate = (date: string) => {
    // 获取该日期所有相关的全天日程（包括跨天和单日）
    const allEventsForDate = allDayEvents.value.filter((event) => {
      if (event.crossDayInfo?.isMultiDay) {
        // 跨天日程：检查当前日期是否在范围内
        const eventStart = dayjs(event.date);
        const eventEnd = eventStart.add(event.crossDayInfo.spanDays - 1, 'day');
        const currentDate = dayjs(date);
        return currentDate.isBetween(eventStart, eventEnd, 'day', '[]');
      } else {
        // 单日日程：检查日期是否匹配
        return event.date === date;
      }
    });

    // 分离跨天日程和单日日程
    const crossDayEvents = allEventsForDate.filter(
      (event) => event.crossDayInfo?.isMultiDay
    );
    const singleDayEvents = allEventsForDate.filter(
      (event) => !event.crossDayInfo?.isMultiDay
    );

    // 如果未展开，需要限制总显示数量为2个
    let limitedCrossDayEvents = crossDayEvents;
    let limitedSingleDayEvents = singleDayEvents;

    if (!isAllDayExpanded.value) {
      const totalLimit = 2;
      const crossDayCount = crossDayEvents.length;

      if (crossDayCount >= totalLimit) {
        // 如果跨天日程已经达到或超过限制，不显示单日日程
        limitedCrossDayEvents = crossDayEvents.slice(0, totalLimit);
        limitedSingleDayEvents = [];
      } else {
        // 如果跨天日程少于限制，显示所有跨天日程，剩余空间显示单日日程
        limitedCrossDayEvents = crossDayEvents;
        limitedSingleDayEvents = singleDayEvents.slice(
          0,
          totalLimit - crossDayCount
        );
      }
    }

    return {
      crossDayEvents: limitedCrossDayEvents,
      singleDayEvents: limitedSingleDayEvents,
      totalCount: allEventsForDate.length,
      visibleCount: limitedCrossDayEvents.length + limitedSingleDayEvents.length,
    };
  };

  // 检查是否有日期需要展开/收起功能
  const hasExpandableDates = computed(() => {
    return weekRange.value.some((dateInfo) => {
      const allDayData = getAllDayEventsForDate(dateInfo.date);
      return allDayData.totalCount > 2;
    });
  });

  // 切换全天日程展开状态
  const toggleAllDayExpanded = () => {
    isAllDayExpanded.value = !isAllDayExpanded.value;
  };

  // 获取指定日期用于渲染的跨天日程（只在第一天显示）
  const getRenderCrossDayEventsForDate = (date: string) => {
    const crossDayEvents = allDayEvents.value.filter((event) => {
      if (!event.crossDayInfo?.isMultiDay) return false;
      // 跨天日程只在第一天渲染
      return event.date === date;
    });

    // 为跨天日程分配行索引
    crossDayEvents.forEach((event, index) => {
      event.rowIndex = index;
    });

    return crossDayEvents;
  };

  // 计算单日日程容器的marginTop，避免被跨天日程覆盖
  const getMarginTopForSingleDayEvent = (date: string) => {
    // 计算该日期应该为跨天日程预留的空间
    // 需要检查所有跨天日程，看哪些会在这个日期显示
    const crossDayCount = allDayEvents.value.filter((event) => {
      if (!event.crossDayInfo?.isMultiDay) return false;

      // 检查当前日期是否在跨天日程的范围内
      const eventStart = dayjs(event.date);
      const eventEnd = eventStart.add(event.crossDayInfo.spanDays - 1, 'day');
      const currentDate = dayjs(date);

      return currentDate.isBetween(eventStart, eventEnd, 'day', '[]');
    }).length;

    // 如果有跨天日程，需要为跨天日程预留空间
    if (crossDayCount > 0) {
      return crossDayCount * 24;
    }

    return 0;
  };

  // 获取指定日期所有相关的全天日程（包括跨天和单日）
  const getAllEventsForDate = (date: string) => {
    return allDayEvents.value.filter((event) => {
      if (event.crossDayInfo?.isMultiDay) {
        // 跨天日程：检查当前日期是否在范围内
        const eventStart = dayjs(event.date);
        const eventEnd = eventStart.add(event.crossDayInfo.spanDays - 1, 'day');
        const currentDate = dayjs(date);
        return currentDate.isBetween(eventStart, eventEnd, 'day', '[]');
      } else {
        // 单日日程：检查日期是否匹配
        return event.date === date;
      }
    });
  };

  // 获取指定日期的更多事件数量
  const getMoreEventsCount = (date: string) => {
    if (isAllDayExpanded.value) {
      return 0;
    }

    // 获取该日期所有相关的全天日程
    const allEventsForDate = getAllEventsForDate(date);

    // 计算该日期应该显示的总事件数
    const totalCount = allEventsForDate.length;

    // 如果总数超过2个，显示"更多"
    if (totalCount > 2) {
      return totalCount - 2;
    }

    return 0;
  };

  return {
    isAllDayExpanded,
    allDayEvents,
    hasExpandableDates,
    toggleAllDayExpanded,
    getAllDayEventsForDate,
    getRenderCrossDayEventsForDate,
    getMarginTopForSingleDayEvent,
    getAllEventsForDate,
    getMoreEventsCount,
  };
}

/**
 * 周视图时间事件管理组合函数
 */
export function useTimeEvents(events: Ref<any[]>, weekRange: Ref<WeekDateInfo[]>) {
  // 计算时间事件
  const timeEvents = computed(() => 
    eventUtils.calculateTimeEvents(events.value, weekRange.value)
  );

  // 处理重叠事件
  const { processOverlappingEventsForWeek } = useOverlapUtils();
  const processedTimeEvents = computed(() =>
    processOverlappingEventsForWeek(timeEvents.value)
  );

  // 按日期分组时间事件
  const timeEventsByDate = computed(() =>
    eventUtils.groupTimeEventsByDate(processedTimeEvents.value, weekRange.value)
  );

  return {
    timeEvents,
    processedTimeEvents,
    timeEventsByDate,
  };
}

/**
 * 周视图时间块管理组合函数
 */
export function useTimeBlocks() {
  // 只管理一个全局的timeBlock
  const timeBlock = ref<TimeBlock | null>(null);

  // 创建时间块
  const createTimeBlock = (date: string, startTime: number, duration: number = 30) => {
    // 直接使用时间工具函数，不需要从hook中获取
    const minutesToPixels = (minutes: number) => minutes; // 1分钟 = 1px
    
    const newBlock: TimeBlock = {
      id: Date.now().toString(),
      startTime,
      duration,
      top: minutesToPixels(startTime),
      height: minutesToPixels(duration),
      isNew: true,
      date,
    };

    timeBlock.value = newBlock;
    return newBlock;
  };

  // 清空时间块
  const clearTimeBlock = () => {
    timeBlock.value = null;
  };

  // 检查是否有时间块
  const hasTimeBlock = computed(() => {
    return timeBlock.value !== null;
  });

  // 获取时间块
  const getTimeBlock = () => {
    return timeBlock.value;
  };

  return {
    timeBlock,
    createTimeBlock,
    clearTimeBlock,
    hasTimeBlock,
    getTimeBlock,
  };
}

/**
 * 周视图拖拽管理组合函数
 */
export function useWeekDragHandlers(weekRange: Ref<WeekDateInfo[]>) {
  // 缓存列宽度，避免频繁计算
  const columnWidthCache = ref<number>(0);
  
  // 计算列宽度的函数
  const calculateColumnWidth = () => {
    const timelineContainer = document.querySelector('.week-view__timeline-section');
    if (timelineContainer) {
      const containerWidth = timelineContainer.clientWidth;
      const timeLabelsWidth = 70; // 时间标签列的宽度
      const availableWidth = containerWidth - timeLabelsWidth;
      const newColumnWidth = availableWidth / 7; // 7天，每列宽度
      
      // 只有当列宽度变化超过5px时才更新缓存
      if (Math.abs(newColumnWidth - columnWidthCache.value) > 5) {
        columnWidthCache.value = newColumnWidth;
        console.log('列宽度更新:', newColumnWidth);
      }
      
      return columnWidthCache.value;
    }
    return columnWidthCache.value || 200; // 使用缓存值或默认值
  };

  // 使用通用的拖拽处理hook，配置为周视图模式
  const dragHandlers = useTimelineDrag({
    enableXAxisDrag: true, // 周视图支持X轴拖拽（日期切换）
    enableYAxisDrag: true, // 支持Y轴拖拽（时间调整）
    enableResize: true,    // 支持大小调整
    maxTimeHeight: 1440,   // 24小时 * 60分钟
    minDuration: 15,       // 最小15分钟
    dateRange: weekRange.value.map(d => d.date),
    getColumnWidth: calculateColumnWidth,
    xAxisDragThreshold: 50 // 设置合适的X轴拖拽阈值，需要50px的移动才触发日期切换
  });

  // 监听窗口大小变化，重新计算列宽度
  onMounted(() => {
    const handleResize = () => {
      calculateColumnWidth();
    };
    
    window.addEventListener('resize', handleResize);
    
    // 初始计算
    calculateColumnWidth();
    
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  return dragHandlers;
}

/**
 * 周视图主要组合函数
 */
export function useWeekView(selectedDate: Ref<string>, events: Ref<any[]>) {
  // 计算周范围
  const weekRange = computed(() => dateUtils.calculateWeekRange(selectedDate.value));

  // 使用通用的时间轴基础功能
  const timelineBase = useTimelineBase(selectedDate);

  // 添加调试日志
  console.log('useWeekView composable:', {
    selectedDate: selectedDate.value,
    events: events.value,
    eventsLength: events.value?.length || 0,
    weekRange: weekRange.value
  });
  
  // 添加更详细的事件数据调试
  console.log('Events详细信息:', {
    eventsType: typeof events.value,
    eventsIsArray: Array.isArray(events.value),
    eventsContent: events.value,
    firstEvent: events.value?.[0]
  });

  // 使用其他组合函数
  const timeState = useWeekTime();
  const allDayState = useAllDayEvents(events, weekRange);
  const timeEventsState = useTimeEvents(events, weekRange);
  const timeBlocksState = useTimeBlocks();
  const dragHandlers = useWeekDragHandlers(weekRange);

  return {
    weekRange,
    timeLabels: timelineBase.timeLabels, // 直接使用timelineBase的timeLabels
    // 时间工具函数
    minutesToPixels: timelineBase.minutesToPixels,
    pixelsToMinutes: timelineBase.pixelsToMinutes,
    snapToQuarter: timelineBase.snapToQuarter,
    formatTime: timelineBase.formatTime,
    ...timeState,
    ...allDayState,
    ...timeEventsState,
    ...timeBlocksState,
    ...dragHandlers,
  };
}
