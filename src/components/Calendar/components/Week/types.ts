// Week组件相关的类型定义

/**
 * 周视图事件接口
 */
export interface WeekEvent {
  id: string;
  title: string;
  startTime: number; // 分钟数，从00:00开始
  duration: number; // 持续时间（分钟）
  top: number; // CSS top位置
  height: number; // CSS高度
  color: string;
  allDay: boolean;
  date: string; // 事件日期 YYYY-MM-DD
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
  id: string;
  startTime: number;
  duration: number;
  top: number;
  height: number;
  isNew?: boolean;
  date: string; // 添加日期字段
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
  startX: number;
  startTop: number;
  startHeight: number;
  startTime: number;
  startDuration: number;
  startDate: string;
  hasMoved: boolean;
  moveThreshold: number;
  lastDragEndTime: number | null;
}

/**
 * 全天事件接口
 */
export interface WeekAllDayEvent {
  id: string;
  title: string;
  color: string;
  allDay: boolean;
  date: string; // 事件日期 YYYY-MM-DD
  crossDayInfo?: {
    displayStart: number;
    displayEnd: number;
    spanDays: number;
    isMultiDay: boolean;
    originalEvent: any;
  };
  rowIndex?: number; // 行索引，用于垂直排列
}

/**
 * 周视图日期信息接口
 */
export interface WeekDateInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 周几
  dayNumber: number; // 日期数字
  lunarDate: string; // 农历日期
  isHoliday: boolean; // 是否节假日
  isToday: boolean; // 是否今天
}

/**
 * 时间标签接口
 */
export interface TimeLabel {
  time: string;
  top: number;
}

/**
 * Week组件Props接口
 */
export interface WeekProps {
  selectedDate?: string; // 选中的日期，用于计算周范围
  events?: any[]; // 事件列表
}

/**
 * Week组件Emits接口
 */
export interface WeekEmits {
  "date-change": [date: string];
  "event-click": [{ event: WeekEvent; el: HTMLElement }];
  "event-update": [
    updateData: { eventId: string; newStartTime: number; newDuration: number; newDate: string }
  ];
  "event-created": [
    data: {
      event: TimeBlock;
      el: HTMLElement;
    }
  ];
  "event-create-cancel": [];
}
