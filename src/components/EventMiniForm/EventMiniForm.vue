<template>
  <div class="event-form">
    <ElForm v-if="data" :model="data" label-width="100px">
      <div class="mb-10px">
        <ElInput
          v-model="data.title"
          placeholder="添加主题"
          autofocus
          size="large"
        />
      </div>
      <DateTimePicker v-model="formData" />

      <!-- 操作按钮 -->
      <div class="form-actions">
        <ElButton @click="handleCancel" size="small">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" size="small"
          >保存</ElButton
        >
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
import { DatePicker } from "v-calendar";
import "v-calendar/style.css";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElDatePicker,
  ElSelect,
  ElOption,
  ElPopover,
  ElButton,
} from "element-plus";
import { ref, watch } from "vue";
import type { EventData } from "../EventPopover/types";
import DateTimePicker from "../DateTimePicker";
import dayjs from "dayjs";

// Props
const props = defineProps<{
  data?: EventData | null;
}>();

// Emits
const emit = defineEmits<{
  "time-changed": [data: { start: string; end: string }];
  submit: [data: EventData];
  cancel: [];
}>();

const formData = ref({
  startDate: dayjs().format("YYYY年MM月DD日"),
  startTime: dayjs().format("HH:mm"),
  endDate: dayjs().format("YYYY年MM月DD日"),
  endTime: dayjs().add(1, "hour").format("HH:mm"),
});

// 监听外部数据变化，同步到表单
watch(
  () => props.data,
  (newVal) => {
    console.log("EventForm: 外部数据变化:", newVal);
    if (newVal && newVal.start && newVal.end) {
      try {
        console.log("EventForm: 解析日期:", {
          start: newVal.start,
          end: newVal.end,
        });
        const startDate = dayjs(newVal.start);
        const endDate = dayjs(newVal.end);

        // 验证日期是否有效
        if (startDate.isValid() && endDate.isValid()) {
          console.log("EventForm: 日期有效，更新表单");
          formData.value.startDate = startDate.format("YYYY年MM月DD日");
          formData.value.startTime = startDate.format("HH:mm");
          formData.value.endDate = endDate.format("YYYY年MM月DD日");
          formData.value.endTime = endDate.format("HH:mm");
        } else {
          console.warn("EventForm: 外部数据包含无效日期:", {
            start: newVal.start,
            end: newVal.end,
            startValid: startDate.isValid(),
            endValid: endDate.isValid(),
          });
        }
      } catch (error) {
        console.error("EventForm: 解析外部日期数据时出错:", error);
      }
    } else {
      console.log("EventForm: 外部数据无效或为空:", newVal);
    }
  },
  {
    immediate: true,
  }
);

// 监听表单时间变化，同步到外部数据并发射事件
watch(
  formData,
  (newFormData) => {
    console.log("EventForm: 表单数据变化:", newFormData);
    if (props.data) {
      try {
        // 验证日期和时间格式
        const startDateStr = newFormData.startDate;
        const startTimeStr = newFormData.startTime;
        const endDateStr = newFormData.endDate;
        const endTimeStr = newFormData.endTime;

        console.log("EventForm: 解析表单数据:", {
          startDateStr,
          startTimeStr,
          endDateStr,
          endTimeStr,
        });

        // 检查日期和时间是否有效
        if (!startDateStr || !startTimeStr || !endDateStr || !endTimeStr) {
          console.warn("EventForm: 日期或时间数据不完整:", {
            startDateStr,
            startTimeStr,
            endDateStr,
            endTimeStr,
          });
          return;
        }

        // 解析日期时间，使用更严格的格式
        const startDateTime = dayjs(
          `${startDateStr} ${startTimeStr}`,
          "YYYY年MM月DD日 HH:mm"
        );
        const endDateTime = dayjs(
          `${endDateStr} ${endTimeStr}`,
          "YYYY年MM月DD日 HH:mm"
        );

        console.log("EventForm: 解析结果:", {
          startDateTime: startDateTime.format(),
          endDateTime: endDateTime.format(),
          startValid: startDateTime.isValid(),
          endValid: endDateTime.isValid(),
        });

        // 验证解析结果
        if (!startDateTime.isValid() || !endDateTime.isValid()) {
          console.warn("EventForm: 日期时间解析失败:", {
            startDateTime: startDateTime.format(),
            endDateTime: endDateTime.format(),
          });
          return;
        }

        // 更新外部数据
        props.data.start = startDateTime.toISOString();
        props.data.end = endDateTime.toISOString();

        console.log("EventForm: 更新外部数据成功");

        // 发射时间变化事件，让父组件同步更新 timeBlock
        emit("time-changed", {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        });
      } catch (error) {
        console.error("EventForm: 处理表单时间变化时出错:", error);
      }
    } else {
      console.log("EventForm: props.data 为空，跳过处理");
    }
  },
  { deep: true }
);

// 处理提交
const handleSubmit = () => {
  if (props.data) {
    emit("submit", props.data);
  }
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped lang="scss">
.event-form {
  pointer-events: auto;
  padding: 16px;
  background: white;

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-input),
  :deep(.el-date-picker),
  :deep(.el-select) {
    width: 100%;
  }

  .el-input {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 0;
    }

    :deep(.el-input__inner) {
      font-size: 22px;
      color: #000;
    }
  }

  :deep(.vc-header button) {
    background-color: transparent;
  }

  .form-item {
    cursor: pointer;
    border-radius: 5px;
    padding: 3px 5px;
    border: 1px solid #fff;

    &:hover {
      background-color: #f0f0f0;
    }

    &.active {
      border: 1px solid var(--el-color-primary);

      &:hover {
        background-color: #fff;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
