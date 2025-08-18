<template>
  <ElPopover
    ref="popoverRef"
    trigger="click"
    :teleported="false"
    width="275"
    @before-leave="handleBeforeLeave"
  >
    <template #reference>
      <div
        class="select-item"
        :class="{ active: isActive }"
        @click="handleClick"
      >
        {{ modelValue || placeholder }}
      </div>
    </template>
    <DatePicker
      :model-value="modelValue"
      @update:model-value="handleDateChange"
      :popover="false"
      :masks="masks"
      locale="zh-cn"
      color="purple"
      borderless
    />
  </ElPopover>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElPopover } from "element-plus";
import { DatePicker } from "v-calendar";
import "v-calendar/style.css";
import dayjs from "dayjs";

interface Props {
  modelValue?: string;
  placeholder?: string;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
}

withDefaults(defineProps<Props>(), {
  placeholder: "选择日期",
});

const emit = defineEmits<Emits>();

const isActive = ref(false);

const popoverRef = ref<InstanceType<typeof ElPopover>>();
const masks = ref({
  modelValue: "YYYY-MM-DD",
});

const handleClick = () => {
  isActive.value = !isActive.value;
};

const handleDateChange = (value: string) => {
  emit("update:modelValue", dayjs(value).format("YYYY年MM月DD日"));
  isActive.value = false;
  popoverRef.value?.hide();
};

const handleBeforeLeave = () => {
  isActive.value = false;
};
</script>

<style scoped lang="scss">
.select-item {
  cursor: pointer;
  border-radius: 5px;
  padding: 3px 5px;
  border: 1px solid #fff;
  width: 230px;
  text-align: center;

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
</style>
