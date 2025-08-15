import type { EventItem } from "../../utils/events";

export interface MonthEvent {
  id: string;
  title: string;
  start: any; // dayjs.Dayjs
  end: any;   // dayjs.Dayjs
  color: string;
  allDay: boolean;
  firstCol: number; // 开始列索引
  lastCol: number;  // 结束列索引
  row: number;      // 行索引
  isVisible: boolean;
  isAbsolute: boolean;
  absoluteTop: number;
  marginTop: number;
}

export interface MonthProps {
  selectedDate?: string;
  events?: EventItem[];
}

export interface MonthEmits {
  (e: 'event-click', event: MonthEvent): void;
  (e: 'date-click', date: string): void;
  (e: 'month-change', month: string): void;
}
