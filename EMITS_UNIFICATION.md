# Calendar组件Emits事件统一

## 概述
本文档记录了三个日历视图组件（Day、Week、Month）的emits事件统一工作。

## 统一前的情况
之前每个视图都有自己的emits类型定义：
- **Day组件**：使用 `DayEmits` 类型
- **Week组件**：使用 `WeekEmits` 类型  
- **Month组件**：使用 `MonthEmits` 类型

这导致了类型定义重复和不一致的问题。

## 统一后的情况
现在所有三个视图都使用统一的 `CalendarEmits` 类型，定义在 `src/components/Calendar/types/events.ts` 文件中。

### 统一的事件类型
```typescript
export interface CalendarEmits {
  // 日期相关事件
  "date-change": [data: DateChangeData];

  // 事件相关事件
  "event-click": [data: EventClickData];
  "event-change": [data: EventChangeData];
  "event-update": [data: EventUpdateData];
}
```

### 事件类型枚举
```typescript
export enum EventType {
  DATE_CHANGE = "date-change",
  EVENT_CLICK = "event-click",
  EVENT_CHANGE = "event-change",
  EVENT_UPDATE = "event-update",
}
```

## 具体变更

### 1. 类型文件更新
- `src/components/Calendar/components/Day/types.ts` - 移除 `DayEmits`，导出 `CalendarEmits`
- `src/components/Calendar/components/Week/types.ts` - 移除 `WeekEmits`，导出 `CalendarEmits`
- `src/components/Calendar/components/Month/types.ts` - 移除 `MonthEmits`，导出 `CalendarEmits`

### 2. 组件文件更新
- **Day组件**：使用 `CalendarEmits` 类型，emit调用使用 `EventType` 常量
- **Week组件**：使用 `CalendarEmits` 类型，emit调用使用 `EventType` 常量
- **Month组件**：已经使用 `CalendarEmits` 类型，emit调用使用 `EventType` 常量

### 3. 统一的事件参数格式
所有事件都使用统一的数据结构：
- `date-change`: `{ date: string }`
- `event-click`: `{ event: EventData, el: HTMLElement }`
- `event-change`: `{ event: EventData, el: HTMLElement }`
- `event-update`: `{ eventId: string, newStartTime: number, newDuration: number, newDate: string }`

## 优势
1. **类型一致性**：所有视图使用相同的事件类型定义
2. **维护性**：集中管理事件类型，减少重复代码
3. **可扩展性**：新增事件类型时只需在一个地方修改
4. **开发体验**：统一的API，更好的IDE支持和类型检查

## 注意事项
- 所有emit调用现在都使用 `EventType` 常量而不是字符串
- 事件参数格式保持向后兼容
- 新增的 `event-update` 事件类型为将来的拖拽更新功能预留

## 完成状态
✅ Day组件 - 已统一
✅ Week组件 - 已统一  
✅ Month组件 - 已统一
✅ 类型定义 - 已统一
✅ 事件枚举 - 已统一
