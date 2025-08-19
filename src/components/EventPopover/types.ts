export interface PopoverPositionOptions {
  /** 目标元素 */
  targetElement: HTMLElement;
  /** Popover元素 */
  popoverElement: HTMLElement;
  /** 偏移量 */
  offset?: { x: number; y: number };
  /** 优先显示位置 */
  preferredPosition?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "bottom-left";
  /** 边距 */
  margin?: number;
  /** Popover宽度 */
  width?: number | string;
}

/**
 * 事件数据接口
 */
export interface EventData {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  sourceType?: number;
  openScopeType?: number;
  roomName?: string;
  self?: boolean;
  remindType?: number;
  tuCname?: string;
  scheduleType?: number;
  allDay?: boolean;
  isMultiDay?: boolean;
  [key: string]: any;
}

export interface Props {
  visible: boolean;
  targetElement: HTMLElement | null;
  title?: string;
  width?: string | number; // 动态设置宽度，支持字符串（如 '300px'）或数字（如 300）
  pointerEvents?: "none" | "auto" | "all";
}

export interface Emits {
  (e: "close"): void;
  (e: "edit", eventData: EventData): void;
  (e: "delete", eventData: EventData): void;
}
