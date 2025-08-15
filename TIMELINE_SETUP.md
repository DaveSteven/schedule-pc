# FullCalendar Timeline 插件安装和使用指南

## 安装 Timeline 插件

要使用 FullCalendar 的 timeline 视图，你需要安装以下插件：

```bash
npm install @fullcalendar/timeline @fullcalendar/resource-timeline
```

或者使用 yarn：

```bash
yarn add @fullcalendar/timeline @fullcalendar/resource-timeline
```

## 导入插件

在你的 Vue 组件中添加以下导入：

```typescript
import timelinePlugin from "@fullcalendar/timeline";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
```

## 配置插件

在 FullCalendar 的配置中添加插件：

```typescript
const calendarOptions = computed(() => ({
  plugins: [
    dayGridPlugin, 
    timeGridPlugin, 
    timelinePlugin,        // 基础 timeline 插件
    resourceTimelinePlugin, // 资源 timeline 插件
    interactionPlugin
  ],
  // ... 其他配置
}));
```

## Timeline 视图类型

Timeline 插件提供以下视图类型：

- `timelineDay` - 单日时间线视图
- `timelineWeek` - 单周时间线视图  
- `timelineMonth` - 单月时间线视图
- `timelineYear` - 单年时间线视图
- `resourceTimelineDay` - 带资源的单日时间线
- `resourceTimelineWeek` - 带资源的单周时间线
- `resourceTimelineMonth` - 带资源的单月时间线
- `resourceTimelineYear` - 带资源的单年时间线

## 资源管理

如果使用 resource timeline 视图，你需要提供资源数据：

```typescript
const calendarOptions = computed(() => ({
  // ... 其他配置
  resources: [
    { id: 'a', title: '资源 A' },
    { id: 'b', title: '资源 B' },
    { id: 'c', title: '资源 C' }
  ],
  // ... 其他配置
}));
```

## Slot Render Hooks 在 Timeline 中的应用

Timeline 视图同样支持 slot render hooks，可以自定义：

### 时间轴标签样式
- `slotLabelClassNames` - 时间标签的CSS类
- `slotLabelContent` - 时间标签的内容
- `slotLabelDidMount` - 时间标签挂载后的处理
- `slotLabelWillUnmount` - 时间标签卸载前的处理

### 时间轴通道样式  
- `slotLaneClassNames` - 时间通道的CSS类
- `slotLaneContent` - 时间通道的内容
- `slotLaneDidMount` - 时间通道挂载后的处理
- `slotLaneWillUnmount` - 时间通道卸载前的处理

## 示例配置

```typescript
const calendarOptions = computed(() => ({
  plugins: [timelinePlugin, resourceTimelinePlugin],
  initialView: 'resourceTimelineWeek',
  resources: [
    { id: 'room1', title: '会议室 1' },
    { id: 'room2', title: '会议室 2' },
    { id: 'room3', title: '会议室 3' }
  ],
  slotDuration: '01:00:00',
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  // 自定义时间轴样式
  slotLabelClassNames: function(arg) {
    const hour = arg.date.getHours();
    if (hour >= 9 && hour <= 18) {
      return ['work-hours'];
    }
    return ['off-hours'];
  },
  slotLaneClassNames: function(arg) {
    return ['custom-lane'];
  }
}));
```

## 注意事项

1. Timeline 视图需要更多的水平空间来显示时间轴
2. 资源 timeline 视图适合显示多个资源（如会议室、人员等）的时间安排
3. 确保你的容器有足够的宽度来显示 timeline 视图
4. Timeline 视图的事件拖拽和调整功能与 timeGrid 视图类似

## 样式自定义

你可以通过 CSS 来自定义 timeline 视图的样式：

```scss
.fc-timeline {
  .fc-timeline-slot {
    &.work-hours {
      background-color: #f0f9ff;
    }
    
    &.off-hours {
      background-color: #f8fafc;
      opacity: 0.7;
    }
  }
  
  .fc-timeline-lane {
    &.custom-lane {
      border-left: 2px solid #e2e8f0;
    }
  }
}
```
