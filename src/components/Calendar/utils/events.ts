import type { ViewType } from "@/stores/calendar";
import Color from "color";
import dayjs from "dayjs";

export interface EventItem {
  id?: string;
  title: string;
  start: string;
  end: string;
  color: string;
  sourceType: 1 | 2 | 3; // 1日程  2会议  3任务
  openScopeType: 1 | 2 | 3; // 1公开  2仅参与人可见  3仅个人可见
  tuCname?: string; // 发起人
  scheduleType?: 1 | 2 | 3; // 1工作  2出差  3休假
  allDay?: boolean;
  roomName?: string;
  // 新增字段
  self?: boolean; // 是否为自己的日程
  remindType?: number; // 提醒类型
  isTechEvent?: boolean; // 是否为科技事件
  isMultiDay?: boolean; // 是否为跨天事件
  ids?: any[];
  [key: string]: any;
}

export interface TimeEvent extends EventItem {
  id: string;
  title: string;
  startTime: number;
  duration: number;
  top: number;
  height: number;
  color: string;
  allDay: boolean;
  overlapStyle?: {
    width: string;
    left: string;
    zIndex: number;
  };
}

export const getNewScheduleTime = (
  s: Date | string | dayjs.Dayjs = new Date()
): { start: string; end: string } => {
  let startTime = dayjs(s);
  let startMinute: number | string = dayjs(s).minute();

  if (startMinute >= 0 && startMinute < 30) {
    startTime = startTime.set("minutes", 30);
  } else {
    startTime = startTime.add(1, "hour").set("minute", 0);
  }

  let endTime = dayjs(startTime).add(1, "hour");

  const start = startTime.format("YYYY-MM-DD HH:mm");
  const end = endTime.format("YYYY-MM-DD HH:mm");
  return { start, end };
};

export const lightenColor = (color: string, opacity: number = 0.8) => {
  try {
    const colorObj = Color(color);
    const white = Color("#ffffff");
    return colorObj.mix(white, opacity).hex();
  } catch (error) {
    return color;
  }
};

// 转换科技日程数据格式
export const transformTechScheduleData = (techData: any[]): EventItem[] => {
  return techData.map((item) => ({
    id: `tech_${item.eventDate}_${Math.random().toString(36).substr(2, 9)}`,
    title: item.eventTitle,
    start: `${item.eventDate} 00:00`, // 科技日程都是全天事件
    end: `${item.eventDate} 23:59`,
    color: "#fa8c16", // 科技日程使用橙色
    sourceType: 3, // 任务类型
    openScopeType: 1, // 公开
    allDay: true, // 科技日程都是全天事件
    isTechEvent: true, // 标记为科技事件
  }));
};

// 转换新的日程数据格式为Calendar组件期望的格式
export const transformScheduleData = (scheduleData: any[]): EventItem[] => {
  return scheduleData.map((item) => {
    const startDate = dayjs(item.startDate);
    const endDate = dayjs(item.endDate);
    const isMultiDay =
      startDate.format("YYYY-MM-DD") !== endDate.format("YYYY-MM-DD");

    return {
      id: item.id,
      title: item.content, // 新格式中的content对应title
      start: `${item.startDate} ${item.startTime}`, // 组合日期和时间
      end: `${item.endDate} ${item.endTime}`, // 组合日期和时间
      color: item.calendarColor,
      sourceType: item.sourceType,
      openScopeType: item.openScopeType,
      roomName: item.roomName,
      self: item.self,
      remindType: item.remindType,
      tuCname: item.tuCname,
      scheduleType: item.scheduleType,
      // 判断是否为全天事件：单日且时间为00:00-23:59，或者跨天事件
      allDay:
        (item.startTime === "00:00" && item.endTime === "23:59") || isMultiDay,
      // 添加跨天标记
      isMultiDay,
    };
  });
};

// 过滤科技日程数据
export const filterTechScheduleData = (
  techData: any[],
  dateRange: { startDate: string; endDate: string }
): any[] => {
  return techData.filter((item: any) => {
    const eventDate = item.eventDate;
    const rangeStart = new Date(dateRange.startDate);
    const rangeEnd = new Date(dateRange.endDate);
    const eventDateObj = new Date(eventDate);

    return eventDateObj >= rangeStart && eventDateObj <= rangeEnd;
  });
};

// 合并普通日程和科技日程
export const mergeScheduleData = (
  normalEvents: EventItem[],
  techEvents: EventItem[]
): EventItem[] => {
  return [...normalEvents, ...techEvents];
};

// 验证日程数据格式
export const validateScheduleData = (data: any): boolean => {
  if (!Array.isArray(data)) return false;

  return data.every((item) => {
    // 检查普通日程格式
    if (
      item.content &&
      item.startDate &&
      item.startTime &&
      item.endDate &&
      item.endTime
    ) {
      return true;
    }
    // 检查科技日程格式
    if (item.eventDate && item.eventTitle) {
      return true;
    }
    return false;
  });
};

export const getDateRangeByViewType = (
  viewType: ViewType,
  selectedDate: string | Date
): { startDate: string; endDate: string } => {
  const date = dayjs(selectedDate);

  switch (viewType) {
    case "day":
    case "week":
      return {
        startDate: date.startOf("week").format("YYYY-MM-DD"),
        endDate: date.endOf("week").format("YYYY-MM-DD"),
      };
    case "month":
      // 对于月视图，需要获取完整的6周数据
      // 包括当前月份的前后部分日期
      const monthStart = date.startOf("month");
      const monthEnd = date.endOf("month");
      const weekStart = monthStart.startOf("week");
      const weekEnd = monthEnd.endOf("week");

      return {
        startDate: weekStart.format("YYYY-MM-DD"),
        endDate: weekEnd.format("YYYY-MM-DD"),
      };
    default:
      return {
        startDate: date.format("YYYY-MM-DD"),
        endDate: date.format("YYYY-MM-DD"),
      };
  }
};

/**
 * 计算多日日程的显示信息
 * @param event 日程事件
 * @param currentDate 当前显示的日期
 * @returns 多日日程的显示信息，如果不是多日日程则返回null
 */
export const getMultiDayEventInfo = (
  event: EventItem,
  currentDate: string
): { totalDays: number; currentDay: number; isMultiDay: boolean } | null => {
  if (!event.start || !event.end) {
    return null;
  }

  // 参考你提供的方法，使用split(" ")[0]来获取日期部分
  const eventStart = dayjs(event.start.split(" ")[0]);
  const eventEnd = dayjs(event.end.split(" ")[0]);
  const current = dayjs(currentDate);

  // 判断是否为多日日程
  const isMultiDay =
    eventStart.format("YYYY-MM-DD") !== eventEnd.format("YYYY-MM-DD");

  if (!isMultiDay) {
    return null;
  }

  // 计算总天数（包含开始和结束日期）
  const totalDays = eventEnd.diff(eventStart, "day") + 1;

  // 计算当前日期是第几天
  const currentDay = current.diff(eventStart, "day") + 1;

  // 检查当前日期是否在多日日程范围内
  const isInRange = current.isBetween(eventStart, eventEnd, "day", "[]");

  if (!isInRange) {
    return null;
  }

  return {
    totalDays,
    currentDay,
    isMultiDay: true,
  };
};

/**
 * 格式化多日日程的标题
 * @param event 日程事件
 * @param currentDate 当前显示的日期
 * @returns 格式化后的标题
 */
export const formatMultiDayEventTitle = (
  event: EventItem,
  currentDate: string
): string => {
  // 直接返回原始标题，不再添加多天信息
  return event.title;
};

/**
 * 处理多日事件的显示标题和状态
 * 参考用户提供的方法，更准确地处理跨天事件
 * @param event 事件对象
 * @param currentDate 当前日期
 * @returns 处理后的多日事件信息
 */
export const processMultiDayEvent = (
  event: EventItem,
  currentDate: string
): EventItem & {
  _originalTitle: string;
  _totalDays: number;
  _currentDay: number;
  _isMultiDay: boolean;
} => {
  const eventStart = dayjs(event.start.split(" ")[0]);
  const eventEnd = event.end ? dayjs(event.end.split(" ")[0]) : eventStart;
  const current = dayjs(currentDate);

  // 判断是否为跨天事件
  const isMultiDay =
    eventStart.format("YYYY-MM-DD") !== eventEnd.format("YYYY-MM-DD");

  if (isMultiDay) {
    // 计算总天数和当前是第几天
    const totalDays = eventEnd.diff(eventStart, "day") + 1;
    const currentDay = current.diff(eventStart, "day") + 1;

    // 创建新的事件对象，包含处理后的标题
    return {
      ...event,
      title: `${event.title}（共${totalDays}天，第${currentDay}天）`,
      _originalTitle: event.title, // 保存原始标题
      _totalDays: totalDays,
      _currentDay: currentDay,
      _isMultiDay: true,
    };
  }

  // 单日事件，返回原事件对象
  return {
    ...event,
    _originalTitle: event.title,
    _totalDays: 1,
    _currentDay: 1,
    _isMultiDay: false,
  };
};

/**
 * 获取指定日期的事件列表，并处理多日事件
 * @param date 指定日期
 * @param eventList 事件列表
 * @returns 处理后的多日事件列表
 */
export const getEventsForDate = (
  date: string,
  eventList: EventItem[]
): EventItem[] => {
  const filteredEvents = eventList.filter((event) => {
    const eventStart = dayjs(event.start.split(" ")[0]);
    const eventEnd = event.end ? dayjs(event.end.split(" ")[0]) : eventStart;
    const currentDate = dayjs(date);

    // 使用dayjs插件简化时间范围检查
    return currentDate.isBetween(eventStart, eventEnd, "day", "[]");
  });

  // 处理跨天事件的显示标题
  const processedEvents = filteredEvents.map((event) =>
    processMultiDayEvent(event, date)
  );

  // 对事件进行排序：全天事件优先，然后按开始时间排序
  return processedEvents.sort((a, b) => {
    // 全天事件排在前面
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;

    // 如果都是全天事件或都不是全天事件，按开始时间排序
    const startA = dayjs(a.start);
    const startB = dayjs(b.start);
    return startA.isBefore(startB) ? -1 : 1;
  });
};
