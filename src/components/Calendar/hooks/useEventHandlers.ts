import { ref, computed } from "vue";
import dayjs from "dayjs";
import type {
  TimeEvent,
  AllDayEvent,
  TimeBlock,
} from "../components/Day/types";
import { formatMultiDayEventTitle } from "../utils/events";
import { useTimeUtils } from "./useTimeUtils";
import { useColorUtils } from "./useColorUtils";
import { useOverlapUtils } from "./useOverlapUtils";

/**
 * 事件处理相关的hooks
 */
export function useEventHandlers(
  props: {
    selectedDate: string;
    events: any[];
  },
  emit: any
) {
  const { minutesToPixels, pixelsToMinutes, snapToQuarter } = useTimeUtils();
  const { lightenColor } = useColorUtils();
  const { processOverlappingEvents } = useOverlapUtils();

  const timeBlock = ref<TimeBlock | null>(null);
  const showAllDayEvents = ref(false);

  /**
   * 计算全天事件
   */
  const allDayEvents = computed(() => {
    const currentEvents = props.events.filter((event) => {
      const eventStart = dayjs(event.start.split(" ")[0]);
      const eventEnd = event.end ? dayjs(event.end.split(" ")[0]) : eventStart;
      const currentDate = dayjs(props.selectedDate);
      return currentDate.isBetween(eventStart, eventEnd, "day", "[]");
    });

    return currentEvents
      .filter((event) => {
        const startDateTime = dayjs(event.start);
        return (
          event.allDay ||
          (startDateTime.hour() === 0 && startDateTime.minute() === 0)
        );
      })
      .map((event) => ({
        ...event,
        id: event.id || `event-${Math.random()}`,
        title: formatMultiDayEventTitle(event, props.selectedDate),
        color: event.color || "#3b82f6",
        allDay: true,
      }))
      .sort((a, b) => {
        const originalEventA = currentEvents.find((event) => event.id === a.id);
        const originalEventB = currentEvents.find((event) => event.id === b.id);
        const timeA = originalEventA
          ? dayjs(originalEventA.start)
          : dayjs(props.selectedDate);
        const timeB = originalEventB
          ? dayjs(originalEventB.start)
          : dayjs(props.selectedDate);
        return timeA.isBefore(timeB) ? -1 : 1;
      });
  });

  /**
   * 计算时间事件
   */
  const timeEvents = computed(() => {
    const currentEvents = props.events.filter((event) => {
      const eventStart = dayjs(event.start.split(" ")[0]);
      const eventEnd = event.end ? dayjs(event.end.split(" ")[0]) : eventStart;
      const currentDate = dayjs(props.selectedDate);
      return currentDate.isBetween(eventStart, eventEnd, "day", "[]");
    });

    return currentEvents
      .filter((event) => {
        const startDateTime = dayjs(event.start);
        return (
          !event.allDay &&
          !(startDateTime.hour() === 0 && startDateTime.minute() === 0)
        );
      })
      .map((event) => {
        const startDateTime = dayjs(event.start);
        const endDateTime = event.end
          ? dayjs(event.end)
          : startDateTime.add(1, "hour");

        const startMinutes = startDateTime.hour() * 60 + startDateTime.minute();
        let endMinutes = endDateTime.hour() * 60 + endDateTime.minute();

        if (endDateTime.format("YYYY-MM-DD") !== props.selectedDate) {
          endMinutes = 23 * 60 + 59;
        }

        const actualStartMinutes =
          startDateTime.format("YYYY-MM-DD") !== props.selectedDate
            ? 0
            : startMinutes;
        const duration = endMinutes - actualStartMinutes;

        return {
          ...event,
          id: event.id || `event-${Math.random()}`,
          title: formatMultiDayEventTitle(event, props.selectedDate),
          startTime: actualStartMinutes,
          duration: Math.max(duration, 15),
          top: minutesToPixels(actualStartMinutes),
          height: minutesToPixels(Math.max(duration, 15)),
          color: event.color || "#3b82f6",
          allDay: false,
        };
      });
  });

  /**
   * 获取指定位置的事件
   */
  const getEventAtPosition = (clickY: number, clickX: number) => {
    const processedEvents = processOverlappingEvents(timeEvents.value);

    const sortedEvents = [...processedEvents].sort(
      (a, b) => (b.overlapStyle?.zIndex || 1) - (a.overlapStyle?.zIndex || 1)
    );

    for (const event of sortedEvents) {
      const eventLeft = 70;
      const eventWidth = window.innerWidth - 70 - 85;
      const eventActualLeft =
        eventLeft +
        (parseFloat(event.overlapStyle?.left || "0") / 100) * eventWidth;
      const eventActualWidth =
        (parseFloat(event.overlapStyle?.width || "100") / 100) * eventWidth;

      if (clickY >= event.top && clickY <= event.top + event.height) {
        if (
          clickX >= eventActualLeft &&
          clickX <= eventActualLeft + eventActualWidth
        ) {
          return event;
        }
      }
    }
    return null;
  };

  /**
   * 处理时间轴点击
   */
  const handleTimelineClick = (
    event: MouseEvent,
    dragState: any,
    onEventClick: (event: TimeEvent) => void
  ) => {
    // 如果正在拖拽，不处理点击
    if (
      dragState.isDragging ||
      dragState.isResizing ||
      dragState.isEventDragging
    ) {
      console.log("正在拖拽中，忽略点击事件");
      return;
    }

    // 检查是否刚刚完成拖拽（防止拖拽后立即触发点击）
    const timeSinceDrag = Date.now() - (dragState.lastDragEndTime || 0);
    if (timeSinceDrag < 200) {
      console.log("拖拽刚结束，忽略点击事件");
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const clickMinutes = pixelsToMinutes(clickY);
    const snappedMinutes = snapToQuarter(clickMinutes);

    // 检查是否点击到了事件块
    const clickedEvent = getEventAtPosition(clickY, event.clientX - rect.left);
    if (clickedEvent) {
      console.log("点击到事件块:", clickedEvent.title);
      onEventClick(clickedEvent);
      return;
    }

    // 如果点击空白区域，清除现有的时间块并创建新的
    if (timeBlock.value) {
      console.log("清除现有时间块，创建新的");
      timeBlock.value = null;
    }

    // 创建新的时间块
    const newBlock = {
      id: Date.now().toString(),
      startTime: snappedMinutes,
      duration: 30,
      top: minutesToPixels(snappedMinutes),
      height: minutesToPixels(30),
      isNew: true,
    };

    timeBlock.value = newBlock;
    console.log("创建新时间块:", newBlock);
  };

  /**
   * 切换全天事件显示
   */
  const toggleAllDayEvents = () => {
    showAllDayEvents.value = !showAllDayEvents.value;
  };

  /**
   * 处理全天事件点击
   */
  const handleAllDayEventClick = (event: AllDayEvent, e: MouseEvent) => {
    emit("event-click", {
      event,
      el: e.currentTarget as HTMLElement,
    });
  };

  /**
   * 计算显示的全天事件
   */
  const visibleAllDayEvents = computed(() =>
    showAllDayEvents.value ? allDayEvents.value : allDayEvents.value.slice(0, 2)
  );

  /**
   * 计算隐藏的事件数量
   */
  const hiddenCount = computed(
    () => allDayEvents.value.length - visibleAllDayEvents.value.length
  );

  /**
   * 处理后的时间事件
   */
  const processedTimeEvents = computed(() =>
    processOverlappingEvents(timeEvents.value)
  );

  return {
    timeBlock,
    showAllDayEvents,
    allDayEvents,
    timeEvents,
    visibleAllDayEvents,
    hiddenCount,
    processedTimeEvents,
    lightenColor,
    handleTimelineClick,
    toggleAllDayEvents,
    handleAllDayEventClick,
    getEventAtPosition,
    processOverlappingEvents,
  };
}
