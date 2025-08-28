<template>
  <ElDialog
    v-model="dialogVisible"
    title="新建日历"
    width="400px"
    :before-close="handleCancel"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      class="new-calendar-form"
      size="large"
    >
      <ElFormItem label="日历名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入日历名称" />
      </ElFormItem>
      <ElFormItem label="日历颜色" prop="color">
        <ElSelect
          v-model="formData.color"
          placeholder="请选择颜色"
          class="color-select"
          style="width: 100%"
        >
          <template #label="{ label, value }">
            <div class="flex gap-4px items-center">
              <div
                class="color-block"
                :style="{
                  backgroundColor: value,
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                }"
              ></div>
              <span :style="{ color: value }">{{ value }}</span>
            </div>
          </template>
          <ElOption
            v-for="(color, key) in COLOR_PALETTE"
            :key="key"
            :label="key"
            :value="color"
          >
            <div class="flex gap-4px items-center">
              <div
                class="color-block"
                :style="{
                  backgroundColor: color,
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                }"
              ></div>
              <span :style="{ color: color }">{{ color }}</span>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="isSubmitting" @click="handleSubmit">
          保存
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import {
  ElDialog,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElMessage,
  ElForm,
  ElFormItem,
} from "element-plus";
import { ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";

// 颜色调色板
const COLOR_PALETTE = {
  PINK: "#FF69B4", // 粉色/洋红
  RED: "#FF4444", // 红色/珊瑚红
  ORANGE: "#FF8C00", // 橙色
  YELLOW: "#FFD700", // 黄色
  GREEN: "#32CD32", // 绿色
  TEAL: "#20B2AA", // 青色/蓝绿
  BLUE: "#4169E1", // 皇家蓝
  LIGHT_BLUE: "#87CEEB", // 浅蓝色/天蓝
  DARK_BLUE: "#191970", // 深蓝色/靛蓝
  PURPLE: "#8A2BE2", // 紫色
  MAGENTA: "#FF00FF", // 洋红/紫罗兰
  GRAY: "#808080", // 灰色
};

// Props
interface Props {
  visible: boolean;
}

// Emits
interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "submit", data: { name: string; color: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const dialogVisible = ref(false);
const isSubmitting = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const formData = ref({
  name: "",
  color: COLOR_PALETTE.ORANGE,
});

// 表单校验规则
const formRules: FormRules = {
  name: [
    { required: true, message: "请输入日历名称", trigger: "blur" },
    {
      min: 1,
      max: 20,
      message: "日历名称长度在 1 到 20 个字符",
      trigger: "blur",
    },
  ],
  color: [{ required: true, message: "请选择日历颜色", trigger: "change" }],
};

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal;
    if (newVal) {
      resetForm();
    }
  }
);

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit("update:visible", newVal);
});

// 重置表单
const resetForm = () => {
  formData.value.name = "";
  formData.value.color = COLOR_PALETTE.ORANGE;
  // 清除表单校验状态
  formRef.value?.clearValidate();
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单校验
    await formRef.value.validate();

    isSubmitting.value = true;

    const calendarData = {
      name: formData.value.name.trim(),
      color: formData.value.color,
    };

    emit("submit", calendarData);

    // 关闭对话框
    dialogVisible.value = false;

    // 重置表单
    resetForm();

    ElMessage.success("日历创建成功");
  } catch (error) {
    if (error instanceof Error) {
      console.error("创建日历失败:", error);
      ElMessage.error("创建日历失败，请重试");
    }
    // 校验失败时不显示错误消息，由表单自动显示
  } finally {
    isSubmitting.value = false;
  }
};

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};
</script>

<style scoped lang="scss">
.new-calendar-form {
  .color-select {
    :deep(.el-select__tags) {
      .el-tag {
        background-color: transparent;
        border: none;
        padding: 0;
        margin: 0;

        .el-tag__content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0;

          .color-preview {
            width: 20px;
            height: 20px;
            border-radius: 3px;
            border: 1px solid #e4e7ed;
            flex-shrink: 0;
          }

          .color-text {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }

    :deep(.el-select__input) {
      display: flex;
      align-items: center;
      gap: 8px;

      .color-preview {
        width: 20px;
        height: 20px;
        border-radius: 3px;
        border: 1px solid #e4e7ed;
      }

      .color-text {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.color-option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;

  .color-swatch {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid #e4e7ed;
    flex-shrink: 0;
  }

  .color-label {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    flex: 1;
  }

  .color-value {
    font-size: 12px;
    color: #909399;
    font-family: "Courier New", monospace;
    font-weight: 500;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 新建日历对话框样式
:deep(.el-dialog) {
  border-radius: 8px;

  .el-dialog__header {
    padding: 20px 20px 0;
    border-bottom: none;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 0 20px 20px;
    border-top: none;
  }
}
</style>
