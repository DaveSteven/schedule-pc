// 统一的事件类型定义

import type { ViewType } from "@/stores/calendar";

/**
 * 基础事件数据接口
 */
export interface BaseEventData {
  id: string;
  title: string;
  color: string;
  allDay: boolean;
}

/**
 * 时间事件接口（用于Day和Week视图）
 */
export interface TimeEvent extends BaseEventData {
  startTime: number; // 分钟数，从00:00开始
  duration: number; // 持续时间（分钟）
  top: number; // CSS top位置
  height: number; // CSS高度
  overlapStyle?: {
    width: string;
    left: string;
    zIndex: number;
  };
}

/**
 * 月视图事件接口
 */
export interface MonthEvent extends BaseEventData {
  start: any; // dayjs.Dayjs
  end: any; // dayjs.Dayjs
  firstCol: number; // 开始列索引
  lastCol: number; // 结束列索引
  row: number; // 行索引
  isVisible: boolean;
  isAbsolute: boolean;
  absoluteTop: number;
  marginTop: number;
}

/**
 * 周视图事件接口
 */
export interface WeekEvent extends TimeEvent {
  date: string; // 事件日期 YYYY-MM-DD
}

/**
 * 事件点击事件数据
 */
export interface EventClickData {
  event: BaseEventData | TimeEvent | MonthEvent | WeekEvent;
  el: HTMLElement;
}

/**
 * 事件变更事件数据
 */
export interface EventChangeData {
  event: BaseEventData | TimeEvent | MonthEvent | WeekEvent;
  el: HTMLElement;
}

/**
 * 日期变更事件数据
 */
export interface DateChangeData {
  date: string; // YYYY-MM-DD
}

/**
 * 视图变更事件数据
 */
export interface ViewChangeData {
  viewType: ViewType;
  previousViewType?: ViewType;
}

/**
 * 统一的事件发射器接口
 */
export interface CalendarEmits {
  // 日期相关事件
  "date-change": [data: DateChangeData];

  // 事件相关事件
  "event-click": [data: EventClickData];
  "event-change": [data: EventChangeData];
}

/**
 * 事件类型枚举
 */
export enum EventType {
  DATE_CHANGE = "date-change",
  EVENT_CLICK = "event-click",
  EVENT_CHANGE = "event-change",
}

/**
 * 事件发射器类型
 */
export type EmitFunction = <K extends keyof CalendarEmits>(
  event: K,
  ...args: CalendarEmits[K]
) => void;
