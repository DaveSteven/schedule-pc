<template>
  <div class="flex items-center gap-5px">
    <DatePicker v-model="startDate" placeholder="选择开始日期" />
    <TimePicker v-model="startTime" placeholder="选择开始时间" />
    <span>——</span>
    <TimePicker v-model="endTime" placeholder="选择结束时间" />
    <DatePicker v-model="endDate" placeholder="选择结束日期" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import dayjs from "dayjs";
import DatePicker from "./components/DatePicker";
import TimePicker from "./components/TimePicker";

interface Props {
  modelValue?: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  };
}

interface Emits {
  (
    e: "update:modelValue",
    value: {
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
    }
  ): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    startDate: dayjs().format("YYYY年MM月DD日"),
    startTime: dayjs().format("HH:mm"),
    endDate: dayjs().format("YYYY年MM月DD日"),
    endTime: dayjs().add(1, "hour").format("HH:mm"),
  }),
});

const emit = defineEmits<Emits>();

const startDate = ref<string>(
  props.modelValue?.startDate || dayjs().format("YYYY年MM月DD日")
);
const startTime = ref<string>(
  props.modelValue?.startTime || dayjs().format("HH:mm")
);
const endDate = ref<string>(
  props.modelValue?.endDate || dayjs().format("YYYY年MM月DD日")
);
const endTime = ref<string>(
  props.modelValue?.endTime || dayjs().add(1, "hour").format("HH:mm")
);

// 监听props变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      startDate.value = newValue.startDate || startDate.value;
      startTime.value = newValue.startTime || startTime.value;
      endDate.value = newValue.endDate || endDate.value;
      endTime.value = newValue.endTime || endTime.value;
    }
  },
  { deep: true }
);

// 监听内部值变化，触发emit
watch(
  [startDate, startTime, endDate, endTime],
  () => {
    emit("update:modelValue", {
      startDate: startDate.value,
      startTime: startTime.value,
      endDate: endDate.value,
      endTime: endTime.value,
    });
  },
  { deep: true }
);

// 组件逻辑已简化，使用子组件处理具体的选择逻辑

// 验证结束时间不能早于开始时间
const validateEndTime = () => {
  const startDateTime = dayjs(`${startDate.value} ${startTime.value}`);
  const endDateTime = dayjs(`${endDate.value} ${endTime.value}`);

  if (endDateTime.isBefore(startDateTime)) {
    endDate.value = startDate.value;
    endTime.value = dayjs(`${startDate.value} ${startTime.value}`)
      .add(1, "hour")
      .format("HH:mm");
  }
};

// 监听开始时间变化，自动调整结束时间
watch([startDate, startTime], () => {
  validateEndTime();
});

// 监听结束时间变化，进行验证
watch([endDate, endTime], () => {
  validateEndTime();
});
</script>
