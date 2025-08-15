import request from "@/utils/request";
import type {
  CalendarItem,
  ScheduleResponse,
  UserFollower,
  // Calendar Management
  CalendarListParams,
  CalendarListData,
  CalendarDetailParams,
  CalendarDetailData,
  CreateCalendarParams,
  UpdateCalendarParams,
  DeleteCalendarParams,
  // Schedule Management
  QueryScheduleParams,
  QueryScheduleData,
  ScheduleParams,
  ScheduleDetailParams,
  ScheduleDetailData,
  // Participant Management
  AddParticipantParams,
  RemoveParticipantParams,
  UpdatePermissionParams,
  // Schedule Actions
  RefuseScheduleParams,
  ReinviteScheduleParams,
  CancelScheduleParams,
  DeleteScheduleParams,
  EndScheduleParams,
  CheckEndScheduleParams,
  // Follower Schedule
  FollowerScheduleParams,
  FollowerScheduleData,
  // User Follow/Follower Management
  QueryAttentionParams,
  QueryAttentionData,
  SaveFollowUserParams,
  DeleteFollowUserParams,
  UserFollowerParams,
  UserFollowerData,
  TopFollowUserParams,
  CancelTopFollowUserParams,
  UpdateFollowerPermissionParams,
  // Leader Schedule
  LeaderScheduleParams,
  LeaderScheduleData,
  // Search Schedule
  SearchScheduleParams,
  SearchScheduleData,
  // Sync
  TaskScheduleSyncParams,
  ScheduleMeetingSyncParams,
  // Meeting Room Management
  QueryMeetingRoomsParams,
  MeetingRoom,
  Device,
  OfficeZone,
  QueryMeetingListParams,
  IdleRoomItem,
} from "./types";

// getToken
export function getToken(): Promise<any> {
  return request({
    url: "/app/api/subApp/getToken",
    method: "post",
    data: { sysCode: "RCGL" },
  });
}

// token 登录验证
export function ssoLogin(data: { token: string }) {
  return request({
    method: "post",
    url: "/api/client/auth/ssoLogin",
    data,
  });
}

// 获取用户信息
export function queryUserInfo() {
  return request({
    url: "/api/schedule/staff/getUserInfo",
  });
}

// Calendar Management APIs
export function queryCalendar(): Promise<ScheduleResponse<CalendarItem[]>> {
  return request({
    url: "/api/schedule/staff/queryCalendar",
  }) as Promise<ScheduleResponse<CalendarItem[]>>;
}

// 获取日历列表
export function queryCalendarList(
  data: CalendarListParams
): Promise<ScheduleResponse<CalendarListData>> {
  return request({
    url: "/api/schedule/calendar/select",
    method: "post",
    data,
  }) as Promise<ScheduleResponse<CalendarListData>>;
}

// 获取日历详情
export function queryCalendarDetail(
  data: CalendarDetailParams
): Promise<ScheduleResponse<CalendarDetailData>> {
  return request({
    url: "/api/schedule/calendar/selectById",
    method: "post",
    data,
  }) as Promise<ScheduleResponse<CalendarDetailData>>;
}

// 创建日历
export function createCalendar(
  data: CreateCalendarParams
): Promise<ScheduleResponse<string>> {
  return request({
    url: "/api/schedule/calendar/insert",
    method: "post",
    data,
  }) as Promise<ScheduleResponse<string>>;
}

// 更新日历
export function updateCalendar(
  data: UpdateCalendarParams
): Promise<ScheduleResponse<string>> {
  return request({
    url: "/api/schedule/calendar/update",
    method: "post",
    data,
  }) as Promise<ScheduleResponse<string>>;
}

// 删除日历
export function deleteCalendar(
  data: DeleteCalendarParams
): Promise<ScheduleResponse<string>> {
  return request({
    url: "/api/schedule/calendar/delete",
    method: "post",
    data,
  }) as Promise<ScheduleResponse<string>>;
}

// Schedule Management APIs
export function querySchedule(
  data: QueryScheduleParams
): Promise<ScheduleResponse<QueryScheduleData[]>> {
  return request({
    url: "/api/schedule/staff/querySchedule",
    method: "post",
    data,
  }) as Promise<ScheduleResponse<QueryScheduleData[]>>;
}

// 保存日程
export function saveSchedule(
  data: ScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/saveSchedule",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 更新日程
export function updateSchedule(
  data: ScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/updateSchedule",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 查看日程详情
export function queryScheduleDetail(
  data: ScheduleDetailParams
): Promise<ScheduleResponse<ScheduleDetailData>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/queryScheduleDetails",
    data,
  }) as Promise<ScheduleResponse<ScheduleDetailData>>;
}

// 删除日程
export function deleteSchedule(
  data: DeleteScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/deleteSchedule",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// Participant Management APIs
// 添加参与人
export function addParticipant(
  data: AddParticipantParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/addParticipant",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 移除参与人
export function removeParticipant(
  data: RemoveParticipantParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/removeParticipant",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 更新参与人权限
export function updatePermission(
  data: UpdatePermissionParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/updatePermission",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// Schedule Action APIs
// 拒绝日程
export function refuseSchedule(
  data: RefuseScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/refuse",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 重新邀请
export function reinviteSchedule(
  data: ReinviteScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/reinvitation",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 取消日程
export function cancelSchedule(
  data: CancelScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/cancel",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 结束日程
export function endSchedule(
  data: EndScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/end",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 检查已结束日程
export function checkEndSchedule(
  data: CheckEndScheduleParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/checkEndSchedule",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// Follower Schedule APIs
// 查询我关注的人的日程
export function queryMyFollowerSchedule(
  data: FollowerScheduleParams
): Promise<ScheduleResponse<FollowerScheduleData[]>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/getFollowerSchedule",
    data,
  }) as Promise<ScheduleResponse<FollowerScheduleData[]>>;
}

// User Follow/Follower Management APIs
// 查询某人关注者
export function queryAttention(
  data: QueryAttentionParams
): Promise<ScheduleResponse<QueryAttentionData[]>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/queryAttention",
    data,
  }) as Promise<ScheduleResponse<QueryAttentionData[]>>;
}

// 保存关注人
export function saveFollower(
  data: SaveFollowUserParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/saveFollowUser",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 删除关注人
export function deleteFollwer(
  data: DeleteFollowUserParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/delFollowUser",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 谁关注了我 OR 谁关注了领导
export function queryUserFollower(
  data: UserFollowerParams
): Promise<ScheduleResponse<UserFollowerData[]>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/getUserFollower",
    data,
  }) as Promise<ScheduleResponse<UserFollowerData[]>>;
}

// 星标置顶关注人
export function topFollowUser(
  data: TopFollowUserParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/top",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 取消置顶关注人
export function cancelTopFollowUser(
  data: CancelTopFollowUserParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/cancelTop",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 设置关注我的人权限
export function updateFollowerPermission(
  data: UpdateFollowerPermissionParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/updateFollowerPermission",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// Leader Schedule APIs
// 获取领导的日程
export function queryMyLeaderSchedule(
  data: LeaderScheduleParams
): Promise<ScheduleResponse<LeaderScheduleData[]>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/getLeaderSchedule",
    data,
  }) as Promise<ScheduleResponse<LeaderScheduleData[]>>;
}

// 查询某人的领导
export function queryLeaders() {
  return request({
    method: "post",
    url: "/api/schedule/staff/selectSecretaryLeader",
  }) as Promise<ScheduleResponse<LeaderScheduleData[]>>;
}

// Search Schedule APIs
// 搜索日程
export function searchSchedule(
  data: SearchScheduleParams
): Promise<ScheduleResponse<SearchScheduleData[]>> {
  return request({
    method: "post",
    url: "/api/schedule/staff/searchSchedule",
    data,
  }) as Promise<ScheduleResponse<SearchScheduleData[]>>;
}

// 获取科技日程
export function queryTecSchedule(data: any) {
  return request({
    method: "post",
    url: "/api/schedule/staff/selectEapsCalendar",
    data,
  });
}

// Sync APIs
// 任务同步创建日程
export function taskScheduleSync(
  data: TaskScheduleSyncParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/schedule/sync/taskScheduleSync",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 日程同步创建会议
export function scheduleMeetingSync(
  data: ScheduleMeetingSyncParams
): Promise<ScheduleResponse<void>> {
  return request({
    method: "post",
    url: "/meeting/sync/scheduleMeetingSync",
    data,
  }) as Promise<ScheduleResponse<void>>;
}

// 同步本周/本月，批量更新ids
export function updateScheduleIds(data: any) {
  return request({
    method: "post",
    url: "/api/schedule/staff/updateIds",
    data,
  });
}

// Meeting Room Management APIs
// 查询会议室
export function queryMeetingRooms(
  data: QueryMeetingRoomsParams
): Promise<ScheduleResponse<MeetingRoom[]>> {
  return request({
    method: "post",
    url: "/api/room/getRoomList",
    data,
  }) as Promise<ScheduleResponse<MeetingRoom[]>>;
}

export function queryIdleRoomList() {
  return request({
    method: "post",
    url: "/api/room/getIdleRoomList",
  }) as Promise<ScheduleResponse<MeetingRoom[]>>;
}

export function queryMeetingList(data: QueryMeetingListParams) {
  return request({
    method: "post",
    url: "/api/meeting/getMeetingList",
    data,
  }) as Promise<ScheduleResponse<IdleRoomItem[]>>;
}

export function queryNonIdleRoomList() {
  return request({
    method: "post",
    url: "/api/room/getNonIdleRoomList",
  }) as Promise<ScheduleResponse<MeetingRoom[]>>;
}

export function queryDeviceList() {
  return request({
    method: "post",
    url: "/api/meeting/getDeviceList",
  }) as Promise<ScheduleResponse<Device[]>>;
}

export function queryOfficeZoneList() {
  return request({
    method: "post",
    url: "/api/room/getOfficeZoneFloorList",
  }) as Promise<ScheduleResponse<OfficeZone[]>>;
}
