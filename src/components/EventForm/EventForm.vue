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
} from "element-plus";
import { ref, watch } from "vue";
import type { EventData } from "../EventPopover/types";
import DateTimePicker from "../DateTimePicker";
import dayjs from "dayjs";

const data = defineModel<EventData>();

const formData = ref({
  startDate: dayjs().format("YYYY年MM月DD日"),
  startTime: dayjs().format("HH:mm"),
  endDate: dayjs().format("YYYY年MM月DD日"),
  endTime: dayjs().add(1, "hour").format("HH:mm"),
});

watch(
  data,
  (newVal) => {
    if (newVal) {
      const { start, end } = newVal;

      formData.value.startDate = dayjs(start).format("YYYY年MM月DD日");
      formData.value.startTime = dayjs(start).format("HH:mm");
      formData.value.endDate = dayjs(end).format("YYYY年MM月DD日");
      formData.value.endTime = dayjs(end).format("HH:mm");
    }
  },
  {
    immediate: true,
  }
);
</script>

<style scoped lang="scss">
.event-form {
  pointer-events: auto;
  padding: 16px;

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

  :deep(button) {
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
}
</style>
