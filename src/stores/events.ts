import { defineStore } from "pinia";
import {
  querySchedule,
  queryMyFollowerSchedule,
  queryMyLeaderSchedule,
  queryTecSchedule,
} from "@/service/api";
import {
  getDateRangeByViewType,
  transformScheduleData,
  transformTechScheduleData,
  validateScheduleData,
  type EventItem,
} from "@/components/Calendar/utils/events";
import type { UserSwitchType } from "@/stores/app";
import type { ViewType } from "@/stores/calendar";
import dayjs from "dayjs";

// 转换关注人和领导日程数据
const transformFollowerLeaderData = (data: any[]): EventItem[] => {
  const events: EventItem[] = [];

  data.forEach((userItem) => {
    // 新的数据结构：userItem.name 是用户姓名，userItem.list 是日程列表
    const userName = userItem.name;
    const userId = userItem.userId;

    if (userItem.list && Array.isArray(userItem.list)) {
      userItem.list.forEach((dateSchedule: any) => {
        if (dateSchedule.list && Array.isArray(dateSchedule.list)) {
          dateSchedule.list.forEach((schedule: any) => {
            // 判断是否为跨天事件
            const startDate = dayjs(schedule.startDate);
            const endDate = dayjs(schedule.endDate);
            const isMultiDay = startDate.format("YYYY-MM-DD") !== endDate.format("YYYY-MM-DD");
            
            events.push({
              id: schedule.id,
              title: schedule.content,
              start: `${schedule.startDate} ${schedule.startTime}`,
              end: `${schedule.endDate} ${schedule.endTime}`,
              color: schedule.calendarColor,
              sourceType: schedule.sourceType,
              openScopeType: schedule.openScopeType,
              roomName: schedule.roomName,
              self: schedule.self,
              remindType: schedule.remindType,
              allDay:
                schedule.startTime === "00:00" && schedule.endTime === "23:59",
              // 添加跨天标记
              isMultiDay,
              // 添加用户信息，用于筛选
              userName: userName,
              userId: userId, // 添加用户ID用于筛选
              userAvatar: userItem.imgUrl, // 如果有头像字段的话
              department: userItem.department, // 如果有部门字段的话
              scheduleType: schedule.scheduleType,
              tuCname: schedule.tuCname,
            });
          });
        }
      });
    }
  });

  return events;
};

// 根据日程类型获取数据
const getScheduleByType = async (
  scheduleType: UserSwitchType,
  dateRange: { startDate: string; endDate: string },
  selectedCalendarIds?: string[]
) => {
  try {
    let response: any = null;

    switch (scheduleType) {
      case "user":
        // 我的日程
        response = await querySchedule({
          ...dateRange,
          calendarIds:
            selectedCalendarIds && selectedCalendarIds.length > 0
              ? selectedCalendarIds
              : undefined,
        });
        break;
      case "follow":
        // 我关注的人的日程
        response = await queryMyFollowerSchedule(dateRange);
        break;
      case "leader":
        // 领导日程
        response = await queryMyLeaderSchedule(dateRange);
        break;
      case "tec":
        // 科技日程
        response = await queryTecSchedule(dateRange);
        break;
      case "meeting":
        // 会议日程
        response = await querySchedule({
          ...dateRange,
          calendarIds:
            selectedCalendarIds && selectedCalendarIds.length > 0
              ? selectedCalendarIds
              : undefined,
        });
        break;
      default:
        console.error("未知的日程类型:", scheduleType);
        return [];
    }

    return response.data;
  } catch (error) {
    console.error("请求日程数据出错:", error);
    return [];
  }
};

interface EventsState {
  events: EventItem[];
  allEvents: EventItem[];
  loading: boolean;
  selectedUserId: string;
  selectedCalendarIds: string[];
}

export const useEventsStore = defineStore("events", {
  state: (): EventsState => ({
    events: [],
    allEvents: [],
    loading: false,
    selectedUserId: "",
    selectedCalendarIds: [],
  }),

  actions: {
    // 获取日程数据
    async fetchScheduleData(
      scheduleType: UserSwitchType,
      viewType: ViewType,
      selectedDate: string
    ) {
      try {
        this.loading = true;
        // 清空当前数据，确保UI能正确更新
        this.events = [];

        const dateRange = getDateRangeByViewType(viewType, selectedDate);
        console.log("=== 数据请求调试信息 ===");
        console.log("当前Tab类型:", scheduleType);
        console.log("视图类型:", viewType);
        console.log("选中日期:", selectedDate);
        console.log("计算出的日期范围:", dateRange);
        console.log(
          "日期范围天数:",
          dayjs(dateRange.endDate).diff(dayjs(dateRange.startDate), "day") + 1
        );

        const scheduleData = await getScheduleByType(
          scheduleType,
          dateRange,
          this.selectedCalendarIds
        );
        console.log("原始日程数据:", scheduleData);
        console.log("数据长度:", scheduleData?.length || 0);
        console.log("日期范围:", dateRange);
        console.log("当前Tab类型:", scheduleType);
        console.log("视图类型:", viewType);

        if (scheduleData && Array.isArray(scheduleData)) {
          let transformedEvents: EventItem[] = [];

          switch (scheduleType) {
            case "user":
              // 我的日程 - 使用标准转换
              if (validateScheduleData(scheduleData)) {
                transformedEvents = transformScheduleData(scheduleData);
              }
              break;
            case "follow":
            case "leader":
              // 关注和领导日程 - 使用特殊转换
              transformedEvents = transformFollowerLeaderData(scheduleData);
              // 保存所有事件用于筛选
              this.allEvents = transformedEvents;
              // 如果没有选中用户，默认选中第一个用户
              if (!this.selectedUserId && scheduleData.length > 0) {
                this.selectedUserId = scheduleData[0].userId;
              }
              // 根据选中的用户筛选事件
              if (this.selectedUserId) {
                transformedEvents = transformedEvents.filter(
                  (event) => event.userId === this.selectedUserId
                );
              }
              break;
            case "tec":
              // 科技日程 - 使用科技日程转换
              transformedEvents = transformTechScheduleData(scheduleData);
              break;
            case "meeting":
              // 会议室 - 暂时返回空数组，后续可以跳转到会议室页面
              transformedEvents = [];
              break;
          }

          this.events = transformedEvents;
          console.log("转换后的事件数据:", this.events);
          console.log("事件数量:", this.events.length);
        } else {
          this.events = [];
        }
      } catch (error) {
        console.error("请求日程数据出错:", error);
        this.events = [];
      } finally {
        this.loading = false;
        console.log("=== 数据请求完成 ===");
      }
    },

    // 设置选中的用户ID
    setSelectedUserId(userId: string) {
      this.selectedUserId = userId;
      // 重新筛选事件
      if (this.allEvents.length > 0) {
        const filteredEvents = this.allEvents.filter(
          (event) => event.userId === this.selectedUserId
        );
        this.events = filteredEvents;
        console.log(`筛选后的事件数量: ${filteredEvents.length}`);
      }
    },

    // 设置选中的日历ID列表
    setSelectedCalendarIds(calendarIds: string[]) {
      this.selectedCalendarIds = calendarIds;
      // 重新获取日程数据
      // 这里可以根据选中的日历ID筛选事件
    },

    // 重置状态
    resetState() {
      this.events = [];
      this.allEvents = [];
      this.selectedUserId = "";
      this.selectedCalendarIds = [];
    },
  },
});
