// Day组件相关的类型定义

/**
 * 时间事件接口
 */
export interface TimeEvent {
  id: string;
  title: string;
  startTime: number; // 分钟数，从00:00开始
  duration: number; // 持续时间（分钟）
  top: number; // CSS top位置
  height: number; // CSS高度
  color: string;
  allDay: boolean;
  overlapStyle?: {
    width: string;
    left: string;
    zIndex: number;
  };
}

/**
 * 时间块接口
 */
export interface TimeBlock {
  id?: string;
  startTime: number; // 分钟数，从00:00开始
  duration: number; // 持续时间（分钟）
  top: number; // CSS top位置
  height: number; // CSS高度
  isNew?: boolean;
}

/**
 * 时间标签接口
 */
export interface TimeLabel {
  time: string;
  top: number;
}

/**
 * 全天事件接口
 */
export interface AllDayEvent {
  id: string;
  title: string;
  color: string;
  allDay: boolean;
}

/**
 * 拖拽状态接口
 */
export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  dragType: "move" | "resize-top" | "resize-bottom";
  currentBlock: TimeBlock | null;
  startY: number;
  startTop: number;
  startHeight: number;
  startTime: number;
  startDuration: number;
  longPressTimer: number | null;
  isLongPressing: boolean;
  canDrag: boolean;
  hasStartedDrag: boolean;
  clickStartTime: number;
  clickTimer: number | null;
  isInSmartMode: boolean;
  smartModeOffset: number;
  isEventDragging: boolean;
  currentEvent: TimeEvent | null;
  originalEventData: { startTime: number; duration: number } | null;
  dragEventPosition: { top: number; startTime: number } | null;
  lastDragEndTime: number | null;
  hasMoved: boolean; // 新增：标记是否已经移动
  moveThreshold: number; // 新增：移动阈值（像素）
}

/**
 * Day组件Props接口
 */
export interface DayProps {
  selectedDate?: string;
  events?: any[];
}

export interface EmitEvent {
  event: TimeEvent;
  el: HTMLElement;
}

/**
 * Day组件Emits接口
 */
export interface DayEmits {
  "date-change": [date: string];
  "event-click": [EmitEvent];
  "event-change": [EmitEvent];
}
