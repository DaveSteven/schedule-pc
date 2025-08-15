export interface CalendarItem {
  id: string;
  name: string;
  color: string;
  isDefault: 1 | 0;
  defaultType: "WORK" | "LIFE" | "TASK" | string;
}

export interface ScheduleResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface UserFollower {
  userId: string;
  userName: string;
  leaderSort?: number;
  imgUrl?: string;
}

// Calendar Management Interfaces
export interface CalendarListParams {}

export interface CalendarListData {
  list: {
    id: string;
    name: string;
    color: string;
    isDefault: number; // 0:用户自建, 1:初始日历
    defaultType?: string; // WORK/TASK/LIFE (仅当isDefault=1时有效)
    createTime: Date;
    updateTime: Date;
  }[];
}

export interface CalendarDetailParams {
  id: string; // 日历id
}

export interface CalendarDetailData {
  id: string;
  name: string;
  color: string;
  isDefault: number; // 0:用户自建, 1:初始日历
  defaultType?: string; // WORK/TASK/LIFE (仅当isDefault=1时有效)
  createTime: Date;
  updateTime: Date;
}

export interface CreateCalendarParams {
  name: string; // 日历名称
  color: string; // 日历颜色
}

export interface UpdateCalendarParams {
  id: string; // 日历id
  name: string; // 日历名称
  color: string; // 日历颜色
}

export interface DeleteCalendarParams {
  id: string; // 日历id
}

// Schedule Management Interfaces
export interface QueryScheduleParams {
  startDate: string; // 日程查询起始日期
  endDate: string; // 日程查询结束日期
  calendarIds?: string[]; // 日历id集合
}

export interface ScheduleItem {
  id: string;
  content: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  userId: string;
  userName: string;
  creater: string;
  repeatType: string; // 0:不重复,1:每天重复,2:每周重复,3:每月重复
  repeatId: string;
  address: string;
  self: boolean;
  sourceType?: string; // 来源类型(1:日程 2:会议 3:任务)
  openScopeType?: string; // 公开范围类型(1:公开 2:仅参与人可见 3:仅自己可见)
  calendarId: string;
  calendarColor: string;
  roomName?: string; // 会议室名
}

export interface QueryScheduleData {
  scheduleDate: string; // 日程日期
  list: ScheduleItem[];
}

export interface ScheduleParams {
  id?: string;
  startDate: string; // 日程开始日期
  endDate: string; // 日程结束日期
  content?: string; // 日程内容
  scheduleRemark?: string; // 描述
  pushStatus: number; // 同步到手机提醒的状态 1:同步 0:没同步
  repeatType: number; // 0:不重复,1:每天重复,2:每周重复,3:每月重复
  address?: string; // 地点
  remindType: number; // 提醒类型 0:不提醒,1:提前5分钟,2:提前10分钟,3:提前15分钟,4:提前30分钟...
  userId: string; // 日程所属人-账号
  userName: string; // 日程所属人-姓名
  ids?: {
    android?: string[];
    ios?: string[];
  }; // 同步到手机的ID
  roomId?: string; // 会议室ID
  cloudRoomNo?: string; // 视频会议号
  groupChatId?: string; // 关联群聊id
  attachmentList?: {
    fileName?: string;
    fileUrl?: string;
  }[]; // 附件数据
  openScopeType: number; // 公开范围类型(1:公开 2:仅参与人可见 3:仅自己可见)
  calendarId?: string; // 所属日历id（没填写默认工作日历）
  userList: {
    userId: string;
    userName: string;
    permissionType: number; // 权限类型(1:修改日程内容 2:邀请参与人)
  }[]; // 参与人列表
}

export interface ScheduleDetailParams {
  scheduleId: string; // 日程id
}

export interface ScheduleDetailData {
  id: string;
  content: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  userId: string;
  userName: string;
  creater: string;
  repeatType: string; // 0:不重复,1:每天重复,2:每周重复,3:每月重复
  repeatId: string;
  address: string;
  self: boolean;
  calendarId: string;
  calendarColor: string;
  meetingInfo?: {
    metingId: string;
    roomName: string;
    cloudRoomNo: string;
  };
  userAcceptList: {
    userId: string;
    userName: string;
    avatarUrl: string;
  }[];
  userRefuseList: {
    userId: string;
    userName: string;
    avatarUrl: string;
  }[];
  participationId: string;
  permissionType: number; // 权限类型(1:修改日程内容 2:邀请参与人)
  attachmentList: {
    fileName: string;
    fileUrl: string;
  }[];
}

export interface AddParticipantParams {
  scheduleId: string; // 日程id
  userIds: string[]; // 参与用户id集合
}

export interface RemoveParticipantParams {
  scheduleId: string; // 日程id
  participationIds: string[]; // 日程参与人id集合
}

export interface UpdatePermissionParams {
  scheduleId: string; // 日程id
  participationId: string; // 日程参与人id
  permissionType: number; // 权限类型(1:修改日程内容 2:邀请参与人)
}

export interface RefuseScheduleParams {
  scheduleId: string; // 日程id
  participationId: string; // 日程参与人id
}

export interface ReinviteScheduleParams {
  scheduleId: string; // 日程id
  participationId: string; // 日程参与人id
}

export interface CancelScheduleParams {
  scheduleId: string; // 日程id
  participationId: string; // 日程参与人id
}

export interface DeleteScheduleParams {
  scheduleId: string; // 日程id
  participationId: string; // 日程参与人id
}

export interface EndScheduleParams {
  scheduleId: string; // 日程id
  participationId: string; // 日程参与人id
}

export interface CheckEndScheduleParams {}

// Follower Schedule Interfaces
export interface FollowerScheduleParams {
  startDate: string; // 日程查询起始日期
  endDate: string; // 日程查询结束日期
}

export interface FollowerScheduleData {
  scheduleDate: string; // 日程日期
  list: {
    id: string;
    content: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    userId: string;
    userName: string;
    creater: string;
    repeatType: string; // 0:不重复,1:每天重复,2:每周重复,3:每月重复
    repeatId: string;
    address: string;
    self: boolean;
    openScopeType?: string; // 公开范围类型(1:公开 2:仅参与人可见 3:仅自己可见)
    roomName?: string; // 会议室名
  }[];
}

// User Follow/Follower Management Interfaces
export interface QueryAttentionParams {
  userId: string; // 用户id
}

export interface QueryAttentionData {
  followUserId: string; // 关注人账号
  followUserName: string; // 关注人姓名
  avatarUrl: string; // 关注人头像
  id: string; // 关注id
  isTop: number; // 是否置顶(0：否，1：是)
}

export interface SaveFollowUserParams {
  userId: string; // 关注人
  followList: {
    userId: string; // 关注人工号
    userName: string; // 关注人姓名
  }[]; // 关注人列表
}

export interface DeleteFollowUserParams {
  userId: string; // 关注人
  ids: string[]; // 要移除关注人工号集合
}

export interface UserFollowerParams {
  userId: string; // 用户id
}

export interface UserFollowerData {
  userId: string; // 关注人账号
  userName: string; // 关注人姓名
  avatarUrl: string; // 关注人头像
  id: string; // 关注id
  viewPermission: number; // 是否有查看权限(0：否，1：是)
}

export interface TopFollowUserParams {
  id: string; // 关注id
}

export interface CancelTopFollowUserParams {
  id: string; // 关注id
}

export interface UpdateFollowerPermissionParams {
  id: string; // 关注id
  viewPermission: number; // 是否有查看权限(0：否，1：是)
}

// Leader Schedule Interfaces
export interface LeaderScheduleParams {
  startDate: string; // 日程查询起始日期
  endDate: string; // 日程查询结束日期
}

export interface LeaderScheduleData {
  scheduleDate: string; // 日程日期
  list: {
    id: string;
    content: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    userId: string;
    userName: string;
    creater: string;
    repeatType: string; // 0:不重复,1:每天重复,2:每周重复,3:每月重复
    repeatId: string;
    address: string;
    self: boolean;
    sourceType?: string; // 来源类型(1:日程 2:会议 3:任务)
    openScopeType?: string; // 公开范围类型(1:公开 2:仅参与人可见 3:仅自己可见)
    roomName?: string; // 会议室名
  }[];
}

// Search Schedule Interfaces
export interface SearchScheduleParams {
  startDate: string; // 日程查询起始日期
  endDate: string; // 日程查询结束日期
  type: number; // 0:我的,1:关注,2:领导
  param: string; // 搜索内容
  initiatorUserIds?: string[]; // 发起人集合
  participationUserIds?: string[]; // 参与人集合
  calendarIds?: string[]; // 日历id集合
}

export interface SearchScheduleData {
  scheduleDate: string; // 日程日期
  list: {
    id: string;
    content: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    userId: string;
    userName: string;
    creater: string;
    repeatType: string; // 0:不重复,1:每天重复,2:每周重复,3:每月重复
    repeatId: string;
    address: string;
    self: boolean;
    sourceType?: string; // 来源类型(1:日程 2:会议 3:任务)
    openScopeType?: string; // 公开范围类型(1:公开 2:仅参与人可见 3:仅自己可见)
    calendarId: string;
    calendarColor: string;
    roomName?: string; // 会议室名
  }[];
}

// Sync Interfaces
export interface TaskScheduleSyncParams {
  taskId: string; // 任务id
  startDate: string; // 日程开始日期
  endDate?: string; // 日程结束日期
  content?: string; // 日程内容
  userIds?: string[]; // 参与人集合(为空时删除)
}

export interface ScheduleMeetingSyncParams {
  scheduleId: string; // 日程id
  startDate?: string; // 会议开始日期
  endDate?: string; // 会议结束日期
  content?: string; // 会议内容
  roomId?: string; // 会议室id
  cloudRoomNo?: string; // 会议号
  userIds?: string[]; // 参与人集合
}

// Meeting Room Management Interfaces
export interface QueryMeetingRoomsParams {
  queryDate: string; // 查询日期
  officeZoneId?: string; // 办公区域ID
  floorList?: string[]; // 楼层列表
  capacityList?: number[]; // 容量列表
  deviceList?: string[]; // 设备列表
  roomId?: string; // 会议室id
}

export interface QueryMeetingListParams {
  queryDate: string; // 查询日期
  roomId: string; // 会议室id
}

export interface MeetingRoomDevice {
  roomId: string; // 会议室ID
  deviceType: string; // 设备类型
  deviceNum: number; // 设备数量
  deviceName: string; // 设备名称
}

export interface MeetingRoomAuth {
  roomId: string; // 会议室ID
  objectId: string; // 对象ID
  objectName: string; // 对象名称
}

export interface MeetingRoom {
  id: string; // 会议室ID
  officeZoneId: string; // 办公区域ID
  name: string; // 会议室名称
  label: string; // 标签
  floor: string; // 楼层
  houseNo: string; // 房间号
  capacity: number; // 容量
  status: string; // 状态 1:正常 0:停用
  qrCodeUrl: string; // 二维码URL
  openStartTime: string; // 开放开始时间
  openEndTime: string; // 开放结束时间
  disableReason?: string; // 停用原因
  createAcct: string; // 创建账号
  createTime: string; // 创建时间
  officeZoneName: string; // 办公区域名称
  roomsDeviceList: MeetingRoomDevice[]; // 设备列表
  meetingInfoList: any[]; // 会议信息列表
  roomsAuthList: MeetingRoomAuth[]; // 权限列表
  tag: string; // 标签
  maxBookingDays?: number; // 最大预订天数
  tagList: string[]; // 标签列表
  disableStartDate?: string; // 停用开始日期
  disableEndDate?: string; // 停用结束日期
}

export interface Device {
  deviceType: string;
  deviceName: string;
  iconPath: string;
  selectedIconPath: string;
}

export interface OfficeZone {
  floorList: string[];
  officeZoneName: string;
  officeZoneId: string;
}

export interface IdleTimeItem {
  startTime: string;
  endTime: string;
  timeSlotType: string;
}

export interface IdleRoomItem {
  idleTimeList: IdleTimeItem[];
  meetingList: MeetingRoom[];
  roomStatus: string;
  showIdleTimeList: IdleTimeItem[];
}
