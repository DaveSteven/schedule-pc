// 事件发射器工具函数

import type {
  EmitFunction,
  DateChangeData,
  EventClickData,
  EventChangeData,
  BaseEventData,
} from "../types/events";
import { EventType } from "../types/events";

/**
 * 创建标准的事件发射器
 */
export function createEventEmitter(emit: EmitFunction) {
  return {
    // 日期变更事件
    emitDateChange: (date: string) => {
      const data: DateChangeData = { date };
      emit(EventType.DATE_CHANGE, data);
    },

    // 事件点击事件
    emitEventClick: (event: BaseEventData, el: HTMLElement) => {
      const data: EventClickData = { event, el };
      emit(EventType.EVENT_CLICK, data);
    },

    // 事件变更事件
    emitEventChange: (event: BaseEventData, el: HTMLElement) => {
      const data: EventChangeData = { event, el };
      emit(EventType.EVENT_CHANGE, data);
    },

    // 更多事件关闭事件
    emitMoreClose: () => {
      emit(EventType.MORE_CLOSE);
    },
  };
}

/**
 * 事件发射器类型
 */
export type EventEmitter = ReturnType<typeof createEventEmitter>;

/**
 * 事件数据验证器
 */
export const eventValidators = {
  isValidDate: (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  },

  isValidEvent: (event: any): event is BaseEventData => {
    return (
      event &&
      typeof event.id === "string" &&
      typeof event.title === "string" &&
      typeof event.color === "string" &&
      typeof event.allDay === "boolean"
    );
  },

  isValidElement: (el: any): el is HTMLElement => {
    return el && el instanceof HTMLElement;
  },
};

/**
 * 事件日志记录器（开发环境使用）
 */
export const eventLogger = {
  log: (eventType: string, data: any) => {
    if (import.meta.env.DEV) {
      console.log(`[Calendar Event] ${eventType}:`, data);
    }
  },

  warn: (eventType: string, message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(`[Calendar Event] ${eventType}: ${message}`, data);
    }
  },

  error: (eventType: string, error: any, data?: any) => {
    if (import.meta.env.DEV) {
      console.error(`[Calendar Event] ${eventType}:`, error, data);
    }
  },
};
