<template>
  <div class="event-form">
    <ElForm v-if="data" :model="data" label-width="100px">
      <ElInput
        v-model="data.title"
        placeholder="请输入事件标题"
        autofocus
        size="large"
      />
      <div class="flex items-center">
        <ElDatePicker
          v-model="data.start"
          placeholder="选择开始时间"
          :teleported="false"
        />

        <ElDatePicker
          v-model="data.end"
          placeholder="选择结束时间"
          :teleported="false"
        />
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElDatePicker,
  ElSelect,
  ElOption,
} from "element-plus";
import { ref } from "vue";
import type { EventData } from "../EventPopover/types";

const data = defineModel<EventData>();
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
    }
  }
}
</style>
