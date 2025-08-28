<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="(val) => emit('update:visible', val)"
    title="新建日程"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElScrollbar height="600px">
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="70px"
        class="event-form"
        size="large"
      >
        <!-- 主题 -->
        <ElFormItem label="主题" prop="subject">
          <ElInput
            v-model="formData.subject"
            placeholder="会议主题"
            class="form-input"
          />
        </ElFormItem>

        <!-- 参与人 -->
        <ElFormItem label="参与人" prop="participants">
          <div class="participants-wrapper">
            <div class="participants-container">
              <div class="participants-list">
                <div
                  v-for="participant in formData.participants"
                  :key="participant.id"
                  class="participant-item"
                >
                  <div class="participant-avatar">
                    <ElIcon><User /></ElIcon>
                  </div>
                  <span class="participant-name">{{ participant.name }}</span>
                  <ElIcon
                    class="remove-icon"
                    @click="removeParticipant(participant.id)"
                  >
                    <Close />
                  </ElIcon>
                </div>
              </div>
              <div class="add-participant-icon">
                <ElIcon><Plus /></ElIcon>
              </div>
            </div>
            <div class="participant-permission">
              <span>参与人权限:</span>
              <ElDropdown @command="handlePermissionChange" trigger="click">
                <span class="el-dropdown-link">
                  {{ getPermissionLabel(formData.participantPermission) }}
                  <ElIcon class="el-icon--right">
                    <CaretBottom />
                  </ElIcon>
                </span>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="invite">邀请参与者</ElDropdownItem>
                    <ElDropdownItem command="view">仅查看</ElDropdownItem>
                    <ElDropdownItem command="edit">可编辑</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </div>
        </ElFormItem>

        <!-- 时间 -->
        <ElFormItem label="时间">
          <ElFormItem prop="startDate" style="display: none">
            <ElInput v-model="formData.startDate" />
          </ElFormItem>
          <ElFormItem prop="endDate" style="display: none">
            <ElInput v-model="formData.endDate" />
          </ElFormItem>
          <ElFormItem prop="startTime" style="display: none">
            <ElInput v-model="formData.startTime" />
          </ElFormItem>
          <ElFormItem prop="endTime" style="display: none">
            <ElInput v-model="formData.endTime" />
          </ElFormItem>
          <div class="time-container">
            <div class="time-inputs">
              <ElDatePicker
                v-model="formData.startDate"
                type="date"
                placeholder="开始日期"
                style="width: 160px"
              />
              <ElTimeSelect
                v-if="!formData.isAllDay"
                v-model="formData.startTime"
                placeholder="开始时间"
                style="width: 120px"
                start="08:00"
                step="00:15"
                end="22:00"
                :max-time="formData.endTime"
              />
              <span class="time-separator">至</span>
              <ElTimeSelect
                v-if="!formData.isAllDay"
                v-model="formData.endTime"
                placeholder="结束时间"
                style="width: 120px"
                start="08:00"
                step="00:15"
                end="22:00"
                :min-time="formData.startTime"
              />
              <ElDatePicker
                v-model="formData.endDate"
                type="date"
                placeholder="结束日期"
                style="width: 160px"
              />
            </div>
            <ElCheckbox v-model="formData.isAllDay" class="all-day-checkbox">
              全天
            </ElCheckbox>
          </div>
          <div class="time-settings">
            <div class="setting-item">
              <span>重复方式:</span>
              <ElDropdown
                @command="handleRepeatTypeChange"
                trigger="click"
                :teleported="false"
              >
                <span class="el-dropdown-link">
                  {{ getRepeatTypeLabel(formData.repeatType) }}
                  <ElIcon class="el-icon--right">
                    <CaretBottom />
                  </ElIcon>
                </span>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="none">不重复</ElDropdownItem>
                    <ElDropdownItem command="daily">每天</ElDropdownItem>
                    <ElDropdownItem command="weekly">每周</ElDropdownItem>
                    <ElDropdownItem command="monthly">每月</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
            <div class="setting-item">
              <span>光大通提醒:</span>
              <ElDropdown
                @command="handleReminderChange"
                trigger="click"
                :teleported="false"
              >
                <span class="el-dropdown-link">
                  {{ getReminderLabel(formData.reminder) }}
                  <ElIcon class="el-icon--right">
                    <CaretBottom />
                  </ElIcon>
                </span>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="5min"
                      >提前5分钟提醒</ElDropdownItem
                    >
                    <ElDropdownItem command="10min"
                      >提前10分钟提醒</ElDropdownItem
                    >
                    <ElDropdownItem command="15min"
                      >提前15分钟提醒</ElDropdownItem
                    >
                    <ElDropdownItem command="30min"
                      >提前30分钟提醒</ElDropdownItem
                    >
                    <ElDropdownItem command="1hour"
                      >提前1小时提醒</ElDropdownItem
                    >
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </div>
        </ElFormItem>

        <!-- 会议室 -->
        <ElFormItem label="会议室">
          <div class="select-with-arrow">
            <ElSelect
              v-model="formData.meetingRoom"
              placeholder="选择会议室"
              class="form-select"
              :teleported="false"
            >
              <ElOption label="石景山203" value="shijingshan203" />
              <ElOption label="石景山204" value="shijingshan204" />
              <ElOption label="石景山205" value="shijingshan205" />
            </ElSelect>
          </div>
        </ElFormItem>

        <!-- 地点 -->
        <ElFormItem label="地点">
          <ElInput
            v-model="formData.location"
            placeholder="输入地点"
            class="form-input"
          />
        </ElFormItem>

        <!-- 会议群 -->
        <ElFormItem label="会议群">
          <div class="select-with-arrow">
            <ElSelect
              v-model="formData.meetingGroup"
              placeholder="选择会议群"
              class="form-select"
            >
              <ElOption label="某某某会议群" value="group1" />
              <ElOption label="技术讨论群" value="group2" />
              <ElOption label="产品会议群" value="group3" />
            </ElSelect>
          </div>
        </ElFormItem>

        <!-- 会议号 -->
        <ElFormItem label="会议号">
          <ElInput
            v-model="formData.meetingId"
            placeholder="输入会议号"
            class="form-input"
          />
        </ElFormItem>

        <!-- 视频会议设置 -->
        <ElFormItem>
          <div class="link-item">
            <span>视频会议设置</span>
            <ElIcon class="arrow-icon"><ArrowRight /></ElIcon>
          </div>
        </ElFormItem>

        <!-- 附件 -->
        <ElFormItem label="附件">
          <div class="attachments-container">
            <div
              v-for="attachment in formData.attachments"
              :key="attachment.id"
              class="attachment-tag"
            >
              <ElIcon class="file-icon" :class="attachment.type">
                <Document v-if="attachment.type === 'document'" />
                <Files v-else />
              </ElIcon>
              <span class="file-name">{{ attachment.name }}</span>
              <ElIcon
                class="remove-icon"
                @click="removeAttachment(attachment.id)"
              >
                <Close />
              </ElIcon>
            </div>
            <div class="add-attachment">
              <span>添加附件</span>
            </div>
          </div>
        </ElFormItem>

        <!-- 描述 -->
        <ElFormItem label="描述">
          <ElInput
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="会议描述会议描述会议描述会议描述会议描述会议描述会议..."
            maxlength="200"
            show-word-limit
            class="form-textarea"
          />
        </ElFormItem>

        <!-- 所属日历 -->
        <ElFormItem label="所属日历">
          <ElSelect
            v-model="formData.calendar"
            placeholder="选择日历"
            class="form-select"
          >
            <ElOption
              v-for="calendar in calendarOptions"
              :key="calendar.id"
              :label="calendar.name"
              :value="calendar.id"
            >
              <div class="calendar-option">
                <div
                  class="calendar-color"
                  :style="{ backgroundColor: calendar.color }"
                ></div>
                <span>{{ calendar.name }}</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <!-- 公开范围 -->
        <ElFormItem label="公开范围">
          <ElSelect
            v-model="formData.visibility"
            placeholder="选择公开范围"
            class="form-select"
          >
            <ElOption label="公开" value="public" />
            <ElOption label="仅个人" value="private" />
            <ElOption label="参与人" value="participants" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </ElScrollbar>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">完成</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import {
  ElDialog,
  ElScrollbar,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElTimeSelect,
  ElCheckbox,
  ElButton,
  ElIcon,
  ElMessage,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
} from "element-plus";
import {
  User,
  Plus,
  Close,
  ArrowRight,
  Document,
  Files,
  CaretBottom,
} from "@element-plus/icons-vue";
import { ref, reactive, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import dayjs from "dayjs";
import { getNewScheduleTime } from "@/utils";

interface Participant {
  id: string;
  name: string;
}

interface Attachment {
  id: string;
  name: string;
  type: "document" | "excel";
}

interface CalendarOption {
  id: string;
  name: string;
  color: string;
}

interface FormData {
  subject: string;
  participants: Participant[];
  participantPermission: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  isAllDay: boolean;
  repeatType: string;
  reminder: string;
  meetingRoom: string;
  location: string;
  meetingGroup: string;
  meetingId: string;
  attachments: Attachment[];
  description: string;
  calendar: string;
  visibility: string;
}

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [data: FormData];
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单校验规则
const formRules: FormRules = {
  subject: [
    { required: true, message: "请输入会议主题", trigger: "blur" },
    {
      min: 1,
      max: 100,
      message: "主题长度在 1 到 100 个字符",
      trigger: "blur",
    },
  ],
  participants: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error("请至少选择一个参与人"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  startDate: [{ required: true, message: "请选择开始日期", trigger: "change" }],
  endDate: [{ required: true, message: "请选择结束日期", trigger: "change" }],
  startTime: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (formData.isAllDay) {
          callback();
        } else if (!value) {
          callback(new Error("请选择开始时间"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  endTime: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (formData.isAllDay) {
          callback();
        } else if (!value) {
          callback(new Error("请选择结束时间"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
};

// 获取默认时间
const defaultTime = getNewScheduleTime();

// 表单数据
const formData = reactive<FormData>({
  subject: "",
  participants: [{ id: "1", name: "王大源" }],
  participantPermission: "invite",
  startDate: defaultTime.start.split(" ")[0],
  startTime: defaultTime.start.split(" ")[1],
  endDate: defaultTime.end.split(" ")[0],
  endTime: defaultTime.end.split(" ")[1],
  isAllDay: false,
  repeatType: "none",
  reminder: "5min",
  meetingRoom: "",
  location: "石景山区",
  meetingGroup: "",
  meetingId: "9771234",
  attachments: [
    { id: "1", name: "智能集采平台移动端操作指南", type: "document" },
  ],
  description: "",
  calendar: "1",
  visibility: "public",
});

// 日历选项
const calendarOptions = ref<CalendarOption[]>([
  { id: "1", name: "陈可昕", color: "#8A2BE2" },
  { id: "2", name: "我的任务", color: "#FFD700" },
  { id: "3", name: "生活", color: "#32CD32" },
  { id: "4", name: "纪念日及生日祝福", color: "#FF69B4" },
]);

// 移除参与人
const removeParticipant = (id: string) => {
  const index = formData.participants.findIndex((p) => p.id === id);
  if (index > -1) {
    formData.participants.splice(index, 1);
  }
};

// 移除附件
const removeAttachment = (id: string) => {
  const index = formData.attachments.findIndex((a) => a.id === id);
  if (index > -1) {
    formData.attachments.splice(index, 1);
  }
};

// 取消
const handleCancel = () => {
  emit("update:visible", false);
};

// 处理重复方式变化
const handleRepeatTypeChange = (command: string) => {
  formData.repeatType = command;
};

// 处理提醒方式变化
const handleReminderChange = (command: string) => {
  formData.reminder = command;
};

// 处理权限变化
const handlePermissionChange = (command: string) => {
  formData.participantPermission = command;
};

// 获取重复方式标签
const getRepeatTypeLabel = (value: string): string => {
  const labels: Record<string, string> = {
    none: "不重复",
    daily: "每天",
    weekly: "每周",
    monthly: "每月",
  };
  return labels[value] || "不重复";
};

// 获取提醒方式标签
const getReminderLabel = (value: string): string => {
  const labels: Record<string, string> = {
    "5min": "提前5分钟提醒",
    "10min": "提前10分钟提醒",
    "15min": "提前15分钟提醒",
    "30min": "提前30分钟提醒",
    "1hour": "提前1小时提醒",
  };
  return labels[value] || "提前5分钟提醒";
};

// 获取权限标签
const getPermissionLabel = (value: string): string => {
  const labels: Record<string, string> = {
    invite: "邀请参与者",
    view: "仅查看",
    edit: "可编辑",
  };
  return labels[value] || "邀请参与者";
};

// 监听开始日期和时间变化，自动计算结束时间
watch(
  [() => formData.startDate, () => formData.startTime],
  ([newStartDate, newStartTime]) => {
    if (newStartDate && newStartTime && !formData.isAllDay) {
      // 构建开始时间
      const startDateTime = dayjs(`${newStartDate} ${newStartTime}`);

      // 计算结束时间（默认间隔半小时）
      const endDateTime = startDateTime.add(30, "minute");

      // 更新结束日期和时间
      formData.endDate = endDateTime.format("YYYY-MM-DD");
      formData.endTime = endDateTime.format("HH:mm");
    }
  },
  { immediate: false }
);

// 监听全天模式切换
watch(
  () => formData.isAllDay,
  (newIsAllDay) => {
    if (newIsAllDay) {
      // 全天模式：清空时间，结束日期设为开始日期
      formData.startTime = "";
      formData.endTime = "";
      formData.endDate = formData.startDate;
    } else {
      // 非全天模式：重新计算结束时间
      if (formData.startDate && formData.startTime) {
        const startDateTime = dayjs(
          `${formData.startDate} ${formData.startTime}`
        );
        const endDateTime = startDateTime.add(30, "minute");
        formData.endDate = endDateTime.format("YYYY-MM-DD");
        formData.endTime = endDateTime.format("HH:mm");
      }
    }
  }
);

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    emit("submit", formData);
    emit("update:visible", false);
    ElMessage.success("日程创建成功");
  } catch (error) {
    console.log("表单验证失败:", error);
  }
};
</script>

<style scoped lang="scss">
.event-form {
  padding: 20px;
}

.form-input,
.form-select {
  width: 100%;
}

.form-textarea {
  width: 100%;
}

// 参与人样式
.participants-wrapper {
  width: 100%;
}

.participants-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: white;
  margin-bottom: 12px;
}

.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  align-items: center;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  background: rgba(111, 82, 237, 0.12);
  border-radius: 4px;
  font-size: 12px;
  border: none;
}

.participant-avatar {
  width: 16px;
  height: 16px;
  background: #6f52ed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  flex-shrink: 0;
}

.participant-name {
  color: #6f52ed;
  font-size: 12px;
  white-space: nowrap;
  font-weight: 500;
}

.remove-icon {
  cursor: pointer;
  color: #909399;
  font-size: 10px;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);
  }
}

.add-participant-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #909399;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #8a2be2;
    background: rgba(138, 43, 226, 0.1);
  }

  .el-icon {
    font-size: 16px;
  }
}

.participant-permission {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;

  .el-dropdown-link {
    cursor: pointer;
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: white;
    min-width: 100px;

    &:hover {
      border-color: var(--el-color-primary);
    }

    .el-icon--right {
      margin-left: auto;
      font-size: 10px;
    }
  }
}

// 时间样式
.time-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.time-separator {
  color: #909399;
  font-size: 14px;
}

.all-day-checkbox {
  white-space: nowrap;
}

.time-settings {
  display: flex;
  gap: 24px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;

  .el-dropdown-link {
    cursor: pointer;
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: white;

    &:hover {
      border-color: var(--el-color-primary);
    }

    .el-icon--right {
      margin-left: auto;
      font-size: 10px;
    }
  }
}

// 带箭头的选择器
.select-with-arrow {
  position: relative;
  display: flex;
  align-items: center;

  .form-select {
    flex: 1;
  }

  .arrow-icon {
    position: absolute;
    right: 8px;
    color: #909399;
    pointer-events: none;
  }
}

// 链接项
.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  color: #8a2be2;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}

// 附件样式
.attachments-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
}

.file-icon {
  font-size: 16px;

  &.document {
    color: #409eff;
  }

  &.excel {
    color: #67c23a;
  }
}

.file-name {
  flex: 1;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-attachment {
  color: #8a2be2;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 0;

  &:hover {
    text-decoration: underline;
  }
}

// 日历选项样式
.calendar-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

// 底部按钮
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
