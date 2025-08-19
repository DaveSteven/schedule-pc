// 统一的事件类型定义

import type { ViewType } from "@/stores/calendar";

/**
 * 基础事件数据接口 - 与mock数据格式保持一致
 */
export interface BaseEventData {
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
  self?: boolean; // 是否为自己的日程
  remindType?: number; // 提醒类型
  isTechEvent?: boolean; // 是否为科技事件
  isMultiDay?: boolean; // 是否为跨天事件
  ids?: any[];
  [key: string]: any;
}

/**
 * 时间事件接口（用于Day和Week视图）
 */
export interface TimeEvent extends BaseEventData {
  id: string;
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
 * 事件更新事件数据（用于拖拽更新等）
 */
export interface EventUpdateData {
  eventId: string;
  newStartTime: number;
  newDuration: number;
  newDate: string;
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
  "date-change": [data: DateChangeData];
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
