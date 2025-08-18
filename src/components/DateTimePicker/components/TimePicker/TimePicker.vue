<template>
  <ElPopover
    ref="popoverRef"
    trigger="click"
    :teleported="false"
    @before-leave="handleBeforeLeave"
    @show="handleShow"
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
    <div class="time-list" ref="timeListRef">
      <div
        v-for="time in timeList"
        :key="time"
        class="time-item"
        :class="{ selected: time === modelValue }"
        :ref="time === modelValue ? 'selectedTimeRef' : undefined"
        @click="handleTimeSelect(time)"
      >
        <div class="time-item-time">{{ time }}</div>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { ElPopover } from "element-plus";

interface Props {
  modelValue?: string;
  placeholder?: string;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
}

const popoverRef = ref<InstanceType<typeof ElPopover>>();
const timeListRef = ref<HTMLDivElement>();
const selectedTimeRef = ref<HTMLDivElement>();
const props = withDefaults(defineProps<Props>(), {
  placeholder: "选择时间",
});

const emit = defineEmits<Emits>();

const isActive = ref(false);

// 使用computed来访问props
const modelValue = computed(() => props.modelValue);
const placeholder = computed(() => props.placeholder);

const timeList = [
  "00:00",
  "00:15",
  "00:30",
  "00:45",
  "01:00",
  "01:15",
  "01:30",
  "01:45",
  "02:00",
  "02:15",
  "02:30",
  "02:45",
  "03:00",
  "03:15",
  "03:30",
  "03:45",
  "04:00",
  "04:15",
  "04:30",
  "04:45",
  "05:00",
  "05:15",
  "05:30",
  "05:45",
  "06:00",
  "06:15",
  "06:30",
  "06:45",
  "07:00",
  "07:15",
  "07:30",
  "07:45",
  "08:00",
  "08:15",
  "08:30",
  "08:45",
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "12:00",
  "12:15",
  "12:30",
  "12:45",
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
  "16:15",
  "16:30",
  "16:45",
  "17:00",
  "17:15",
  "17:30",
  "17:45",
  "18:00",
  "18:15",
  "18:30",
  "18:45",
  "19:00",
  "19:15",
  "19:30",
  "19:45",
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
  "21:45",
  "22:00",
  "22:15",
  "22:30",
  "22:45",
  "23:00",
  "23:15",
  "23:30",
  "23:45",
];

const handleClick = () => {
  isActive.value = !isActive.value;
};

const handleTimeSelect = (time: string) => {
  emit("update:modelValue", time);
  isActive.value = false;
  popoverRef.value?.hide();
};

const handleBeforeLeave = () => {
  isActive.value = false;
};

// 新增：处理弹窗显示事件
const handleShow = () => {
  nextTick(() => {
    scrollToSelectedTime();
  });
};

// 新增：滚动到选中的时间
const scrollToSelectedTime = () => {
  if (!timeListRef.value || !modelValue.value) return;

  const selectedIndex = timeList.findIndex((time) => time === modelValue.value);
  if (selectedIndex === -1) return;

  // 获取时间列表容器
  const container = timeListRef.value;

  // 计算每个时间项的实际高度（包括 gap）
  const firstItem = container.querySelector(".time-item") as HTMLElement;
  if (!firstItem) return;

  const itemHeight = firstItem.offsetHeight;
  const gap = 5; // CSS 中定义的 gap
  const totalItemHeight = itemHeight + gap;

  // 计算滚动位置，使选中的时间项居中显示
  const containerHeight = container.clientHeight;
  const scrollTop =
    selectedIndex * totalItemHeight - containerHeight / 2 + itemHeight / 2;

  // 确保滚动位置在有效范围内
  const maxScrollTop = container.scrollHeight - containerHeight;
  const finalScrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));

  // 使用自定义快速滚动动画
  smoothScrollTo(container, finalScrollTop, 200); // 200ms 完成滚动
};

// 新增：自定义快速滚动动画
const smoothScrollTo = (element: HTMLElement, target: number, duration: number) => {
  const start = element.scrollTop;
  const distance = target - start;
  const startTime = performance.now();

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easedProgress = easeOutCubic(progress);
    element.scrollTop = start + distance * easedProgress;

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

// 监听 modelValue 变化，自动滚动到对应位置
watch(modelValue, () => {
  if (isActive.value) {
    nextTick(() => {
      scrollToSelectedTime();
    });
  }
});
</script>

<style scoped lang="scss">
.time-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 200px;
  overflow-y: auto;
}

.time-item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
  }

  &.selected {
    background-color: var(--el-color-primary);
    color: white;

    &:hover {
      background-color: var(--el-color-primary-light-3);
    }
  }
}

.time-item-time {
  padding: 8px 12px;
  font-size: 14px;
}

.select-item {
  cursor: pointer;
  border-radius: 5px;
  padding: 3px 5px;
  border: 1px solid #fff;
  width: 60px;
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
