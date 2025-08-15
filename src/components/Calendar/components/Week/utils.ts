import dayjs from "dayjs";
import type { WeekEvent, WeekAllDayEvent, WeekDateInfo } from "./types";
import { formatMultiDayEventTitle } from "../../utils/events";
import { getLunarDisplayText } from "../../utils/date";

/**
 * 日期相关工具函数
 */
export const dateUtils = {
  /**
   * 计算周范围
   */
  calculateWeekRange(selectedDate: string): WeekDateInfo[] {
    const startDate = dayjs(selectedDate).startOf("week");
    const dates: WeekDateInfo[] = [];

    for (let i = 0; i < 7; i++) {
      const date = startDate.add(i, "day");
      const isToday = date.isSame(dayjs(), "day");

      dates.push({
        date: date.format("YYYY-MM-DD"),
        dayOfWeek: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][i],
        dayNumber: date.date(),
        lunarDate: getLunarDisplayText({
          year: date.year(),
          month: date.month() + 1,
          day: date.date(),
        }),
        isHoliday: i === 0 || i === 6, // 周末为节假日
        isToday,
      });
    }

    return dates;
  },

  /**
   * 获取跨天事件信息
   */
  getCrossDayEventInfo(event: any, weekStart: string) {
    const eventStart = dayjs(event.start.split(" ")[0]);
    const eventEnd = event.end ? dayjs(event.end.split(" ")[0]) : eventStart;
    const weekStartDate = dayjs(weekStart);
    const weekEndDate = weekStartDate.add(6, "day");

    // 检查事件是否与当前周有重叠
    if (eventEnd.isBefore(weekStartDate) || eventStart.isAfter(weekEndDate)) {
      return null;
    }

    // 计算在当前周内的开始和结束位置
    const displayStart = eventStart.isBefore(weekStartDate)
      ? 0
      : eventStart.diff(weekStartDate, "day");
    const displayEnd = eventEnd.isAfter(weekEndDate)
      ? 6
      : eventEnd.diff(weekStartDate, "day");
    const spanDays = displayEnd - displayStart + 1;

    return {
      displayStart,
      displayEnd,
      spanDays,
      isMultiDay: spanDays > 1,
      originalEvent: event,
    };
  },
};

/**
 * 事件处理工具函数
 */
export const eventUtils = {
  /**
   * 计算全天事件
   */
  calculateAllDayEvents(
    events: any[],
    weekRange: WeekDateInfo[]
  ): WeekAllDayEvent[] {
    const allDayEvents: WeekAllDayEvent[] = [];
    const weekStart = weekRange[0].date;

    // 添加调试信息
    console.log("calculateAllDayEvents 输入:", {
      events,
      eventsLength: events?.length || 0,
      weekRange,
      weekStart,
    });

    // 检查events是否为空或undefined
    if (!events || !Array.isArray(events)) {
      console.log("calculateAllDayEvents: events为空或不是数组");
      return allDayEvents;
    }

    // 处理所有全天事件
    events.forEach((event) => {
      // 只处理全天事件
      if (!event.allDay) {
        return;
      }

      // 检查事件是否与当前周有重叠
      const eventStart = dayjs(event.start.split(" ")[0]);
      const eventEnd = event.end ? dayjs(event.end.split(" ")[0]) : eventStart;
      const weekStartDate = dayjs(weekStart);
      const weekEndDate = weekStartDate.add(6, "day");

      if (eventEnd.isBefore(weekStartDate) || eventStart.isAfter(weekEndDate)) {
        return;
      }

      // 计算事件在当前周内的显示信息
      const crossDayInfo = dateUtils.getCrossDayEventInfo(event, weekStart);

      if (crossDayInfo?.isMultiDay) {
        // 跨天事件，在事件实际开始的日期添加
        const actualStartDate = eventStart.isBefore(weekStartDate)
          ? weekStart
          : eventStart.format("YYYY-MM-DD");
        allDayEvents.push({
          ...event,
          id: event.id || `event-${Math.random()}`,
          title: formatMultiDayEventTitle(event, actualStartDate),
          color: event.color || "#3b82f6",
          allDay: true,
          date: actualStartDate, // 使用事件实际开始日期
          crossDayInfo: crossDayInfo,
        });
      } else {
        // 单日全天事件，在对应日期添加
        const eventDate = eventStart.format("YYYY-MM-DD");
        if (weekRange.some((d) => d.date === eventDate)) {
          allDayEvents.push({
            ...event,
            id: event.id || `event-${Math.random()}`,
            title: formatMultiDayEventTitle(event, eventDate),
            color: event.color || "#3b82f6",
            allDay: true,
            date: eventDate,
            crossDayInfo: undefined,
          });
        }
      }
    });

    // 按日期和开始时间排序
    return allDayEvents.sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      if (dateA.isSame(dateB)) {
        // 同一天内，按开始时间排序
        const eventA = events.find((e) => e.id === a.id);
        const eventB = events.find((e) => e.id === b.id);
        if (eventA && eventB) {
          return dayjs(eventA.start).isBefore(dayjs(eventB.start)) ? -1 : 1;
        }
      }
      return dateA.isBefore(dateB) ? -1 : 1;
    });
  },

  /**
   * 计算时间事件
   */
  calculateTimeEvents(events: any[], weekRange: WeekDateInfo[]): WeekEvent[] {
    const timeEvents: WeekEvent[] = [];

    // 添加调试信息
    console.log("calculateTimeEvents 输入:", {
      events,
      eventsLength: events?.length || 0,
      weekRange,
    });

    // 检查events是否为空或undefined
    if (!events || !Array.isArray(events)) {
      console.log("calculateTimeEvents: events为空或不是数组");
      return timeEvents;
    }

    weekRange.forEach((dateInfo) => {
      const currentEvents = events.filter((event) => {
        // 修复多日日程的过滤逻辑：检查当前日期是否在事件的日期范围内
        const eventStart = dayjs(event.start.split(" ")[0]);
        const eventEnd = event.end
          ? dayjs(event.end.split(" ")[0])
          : eventStart;
        const currentDate = dayjs(dateInfo.date);

        return currentDate.isBetween(eventStart, eventEnd, "day", "[]");
      });

      const dayEvents = currentEvents
        .filter((event) => {
          const startDateTime = dayjs(event.start);
          return (
            !event.allDay &&
            !(startDateTime.hour() === 0 && startDateTime.minute() === 0)
          );
        })
        .map((event) => {
          const startDateTime = dayjs(event.start);
          const endDateTime = event.end
            ? dayjs(event.end)
            : startDateTime.add(1, "hour");

          const startMinutes =
            startDateTime.hour() * 60 + startDateTime.minute();
          let endMinutes = endDateTime.hour() * 60 + endDateTime.minute();

          if (endDateTime.format("YYYY-MM-DD") !== dateInfo.date) {
            endMinutes = 23 * 60 + 59;
          }

          const actualStartMinutes =
            startDateTime.format("YYYY-MM-DD") !== dateInfo.date
              ? 0
              : startMinutes;
          const duration = endMinutes - actualStartMinutes;

          return {
            id: event.id || `event-${Math.random()}`,
            title: formatMultiDayEventTitle(event, dateInfo.date),
            startTime: actualStartMinutes,
            duration: Math.max(duration, 15),
            top: actualStartMinutes, // 直接使用分钟数作为像素值
            height: Math.max(duration, 15), // 直接使用分钟数作为像素值
            color: event.color || "#3b82f6",
            allDay: false,
            date: dateInfo.date,
          };
        });

      timeEvents.push(...dayEvents);
    });

    return timeEvents;
  },

  /**
   * 按日期分组时间事件
   */
  groupTimeEventsByDate(
    events: WeekEvent[],
    weekRange: WeekDateInfo[]
  ): Record<string, WeekEvent[]> {
    const grouped: Record<string, WeekEvent[]> = {};

    // 检查events是否为空或undefined
    if (!events || !Array.isArray(events)) {
      weekRange.forEach((dateInfo) => {
        grouped[dateInfo.date] = [];
      });
      return grouped;
    }

    weekRange.forEach((dateInfo) => {
      grouped[dateInfo.date] = events.filter(
        (event) => event.date === dateInfo.date
      );
    });
    return grouped;
  },
};
