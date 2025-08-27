import dayjs from "dayjs";
import type { BaseEventData } from "../types/events";

/**
 * 事件工厂函数 - 用于生成标准的BaseEventData对象
 */

/**
 * 默认的事件配置
 */
export const DEFAULT_EVENT_CONFIG = {
  sourceType: 1 as const, // 1日程  2会议  3任务
  openScopeType: 1 as const, // 1公开  2仅参与人可见  3仅个人可见
  scheduleType: 1 as const, // 1工作  2出差  3休假
  self: true, // 是否为自己的日程
  isTechEvent: false, // 是否为科技事件
  isMultiDay: false, // 是否为跨天事件
};

/**
 * 创建基础事件数据
 * @param data 事件数据
 * @param overrides 覆盖默认值的配置
 * @returns BaseEventData对象
 */
export function createBaseEvent(
  data: Partial<BaseEventData>,
  overrides: Partial<BaseEventData> = {}
): BaseEventData {
  return {
    // 应用默认配置
    ...DEFAULT_EVENT_CONFIG,

    // 应用传入的数据
    ...data,

    // 应用覆盖配置（优先级最高）
    ...overrides,

    // 确保必需字段有值
    title: data.title || "新事件",
    start: data.start || "",
    end: data.end || "",
    color: data.color || "#409EFF",
  };
}

/**
 * 从表单数据创建事件
 * @param formData 表单数据
 * @returns BaseEventData对象
 */
export function createEventFromForm(formData: {
  id?: string;
  title: string;
  start: string;
  end: string;
  color: string;
  allDay?: boolean;
}): BaseEventData {
  return createBaseEvent({
    id: formData.id,
    title: formData.title,
    start: formData.start,
    end: formData.end,
    color: formData.color,
    allDay: formData.allDay || false,
  });
}

/**
 * 从现有事件数据创建标准格式
 * @param eventData 现有事件数据
 * @returns BaseEventData对象
 */
export function createEventFromExisting(
  eventData: Partial<BaseEventData>
): BaseEventData {
  return createBaseEvent(eventData);
}

/**
 * 从WeekEvent创建BaseEventData（处理时间转换）
 * @param event WeekEvent对象
 * @returns BaseEventData对象
 */
export function createEventFromWeekEvent(event: any): BaseEventData {
  const start =
    "startTime" in event
      ? dayjs(event.date)
          .add(event.startTime, "minute")
          .format("YYYY-MM-DD HH:mm")
      : `${event.date} 00:00`;
  const end =
    "startTime" in event
      ? dayjs(event.date)
          .add(event.startTime + event.duration, "minute")
          .format("YYYY-MM-DD HH:mm")
      : `${event.date} 23:59`;

  return createBaseEvent({
    id: event.id,
    title: event.title,
    start,
    end,
    color: event.color,
    allDay: event.allDay,
  });
}

/**
 * 从TimeEvent创建BaseEventData（处理时间转换）
 * @param event TimeEvent对象
 * @param selectedDate 选中的日期
 * @returns BaseEventData对象
 */
export function createEventFromTimeEvent(
  event: any,
  selectedDate: string
): BaseEventData {
  const start = dayjs(selectedDate)
    .add(event.startTime, "minute")
    .format("YYYY-MM-DD HH:mm");
  const end = dayjs(selectedDate)
    .add(event.startTime + event.duration, "minute")
    .format("YYYY-MM-DD HH:mm");

  return createBaseEvent({
    id: event.id,
    title: event.title,
    start,
    end,
    color: event.color,
    allDay: event.allDay,
  });
}

/**
 * 创建新事件的默认数据
 * @param start 开始时间
 * @param end 结束时间
 * @param title 标题
 * @returns BaseEventData对象
 */
export function createNewEvent(
  start: string,
  end: string,
  title: string = "新事件"
): BaseEventData {
  return createBaseEvent({
    title,
    start,
    end,
    color: "#409EFF",
    allDay: false,
  });
}

/**
 * 创建全天事件
 * @param date 日期
 * @param title 标题
 * @param color 颜色
 * @returns BaseEventData对象
 */
export function createAllDayEvent(
  date: string,
  title: string,
  color: string = "#409EFF"
): BaseEventData {
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;

  return createBaseEvent({
    title,
    start,
    end,
    color,
    allDay: true,
  });
}

/**
 * 创建会议事件
 * @param data 会议数据
 * @returns BaseEventData对象
 */
export function createMeetingEvent(
  data: Partial<BaseEventData>
): BaseEventData {
  return createBaseEvent(data, {
    sourceType: 2, // 会议
    scheduleType: 1, // 工作
  });
}

/**
 * 创建任务事件
 * @param data 任务数据
 * @returns BaseEventData对象
 */
export function createTaskEvent(data: Partial<BaseEventData>): BaseEventData {
  return createBaseEvent(data, {
    sourceType: 3, // 任务
    scheduleType: 1, // 工作
  });
}

/**
 * 创建出差事件
 * @param data 出差数据
 * @returns BaseEventData对象
 */
export function createBusinessTripEvent(
  data: Partial<BaseEventData>
): BaseEventData {
  return createBaseEvent(data, {
    sourceType: 1, // 日程
    scheduleType: 2, // 出差
  });
}

/**
 * 创建休假事件
 * @param data 休假数据
 * @returns BaseEventData对象
 */
export function createVacationEvent(
  data: Partial<BaseEventData>
): BaseEventData {
  return createBaseEvent(data, {
    sourceType: 1, // 日程
    scheduleType: 3, // 休假
  });
}
