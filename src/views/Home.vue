<script setup lang="ts">
import {
  ElTabPane,
  ElTabs,
  ElButton,
  ElIcon,
  ElButtonGroup,
} from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import MiniCalendar from "@/components/MiniCalendar";
import { ref, onMounted, computed, watch } from "vue";
import { useEventsStore } from "@/stores/events";
import { useCalendarStore } from "@/stores/calendar";
import { storeToRefs } from "pinia";
import { Day, Week, Month } from "@/components/Calendar";
import EventPopover from "@/components/EventPopover/EventPopover.vue";
import type { UserSwitchType } from "@/stores/app";
import type { EventData } from "@/components/EventPopover/EventPopover.vue";

// 获取 stores
const eventsStore = useEventsStore();
const calendarStore = useCalendarStore();
const { events } = storeToRefs(eventsStore);
const { isToday } = storeToRefs(calendarStore);

// 当前选中的 tab
const activeTab = ref(0);

// tab 配置
const tabs = [
  { key: "user", label: "我的" },
  { key: "follow", label: "关注" },
  { key: "leader", label: "领导" },
  { key: "tec", label: "科技" },
  { key: "meeting", label: "会议室" },
];

// 当前选中的日程类型
const currentScheduleType = computed(
  () => tabs[activeTab.value]?.key || "user"
);

// 当前选中的日期
const selectedDate = computed(() => calendarStore.selectedDate);

// 当前视图类型
const viewType = computed(() => calendarStore.viewType);

// Popover相关状态
const popoverVisible = ref(false);
const popoverEventData = ref<EventData | null>(null);
const popoverTargetElement = ref<HTMLElement | null>(null);

// 事件处理方法
const handleEventClick = (arg: any) => {
  console.log("handleEventClick:", arg);

  // 显示Popover
  popoverEventData.value = arg.event;
  popoverTargetElement.value = arg.el;
  popoverVisible.value = true;
};

// Popover事件处理
const handlePopoverClose = () => {
  popoverVisible.value = false;
  popoverEventData.value = null;
  popoverTargetElement.value = null;
};

const handleEventEdit = (eventData: EventData) => {
  console.log("编辑事件:", eventData);
  // TODO: 实现编辑功能
  handlePopoverClose();
};

const handleEventDelete = (eventData: EventData) => {
  console.log("删除事件:", eventData);
  // TODO: 实现删除功能
  handlePopoverClose();
};

const handleEventDrop = (event: any) => {
  console.log("Month event dropped:", event);
};

const handleEventResize = (event: any) => {
  console.log("Month event resized:", event);
};

// 处理 tab 切换
const handleTabChange = async (tabIndex: string | number) => {
  activeTab.value =
    typeof tabIndex === "string" ? parseInt(tabIndex) : tabIndex;
  await fetchScheduleData();
};

// 获取日程数据
const fetchScheduleData = async () => {
  if (currentScheduleType.value && selectedDate.value && viewType.value) {
    await eventsStore.fetchScheduleData(
      currentScheduleType.value as UserSwitchType,
      viewType.value,
      selectedDate.value
    );
  }
};

// 监听日期变化
const handleDateChange = async (date: string) => {
  console.log(date);
};

// 监听日历变化
const handleCalendarChange = async (calendarIds: string[]) => {
  eventsStore.setSelectedCalendarIds(calendarIds);
  await fetchScheduleData();
};

// 处理上一个时间段
const handlePrev = async () => {
  calendarStore.goToPrevious();
  await fetchScheduleData();
};

// 处理下一个时间段
const handleNext = async () => {
  calendarStore.goToNext();
  await fetchScheduleData();
};

// 处理今日按钮点击
const handleToday = async () => {
  calendarStore.setToday();
  await fetchScheduleData();
};

// 处理视图类型切换
const handleViewTypeChange = async (type: any) => {
  calendarStore.setViewType(type);
  await fetchScheduleData();
};

// 监听选中日期变化
watch(selectedDate, async () => {
  await fetchScheduleData();
});

// 监听视图类型变化
watch(viewType, async () => {
  await fetchScheduleData();
});

// 初始化
onMounted(async () => {
  await fetchScheduleData();
});
</script>

<template>
  <div class="app-wrapper">
    <div class="left-panel">
      <MiniCalendar />
    </div>
    <div class="app-content">
      <ElTabs v-model="activeTab" @tab-change="handleTabChange">
        <ElTabPane
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :label="tab.label"
          :name="index"
        />
      </ElTabs>
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="p-15px">
          <ElButton @click="handleToday">今日</ElButton>
          <ElButtonGroup>
            <ElButton @click="handlePrev"
              ><ElIcon><ArrowLeft /></ElIcon
            ></ElButton>
            <ElButton @click="handleNext"
              ><ElIcon><ArrowRight /></ElIcon
            ></ElButton>
          </ElButtonGroup>
          <span>{{ selectedDate }}</span>
          <span v-if="isToday">今天</span>

          <ElButtonGroup class="ml-4">
            <ElButton
              :type="viewType === 'day' ? 'primary' : 'default'"
              @click="handleViewTypeChange('day')"
              >日</ElButton
            >
            <ElButton
              :type="viewType === 'week' ? 'primary' : 'default'"
              @click="handleViewTypeChange('week')"
              >周</ElButton
            >
            <ElButton
              :type="viewType === 'month' ? 'primary' : 'default'"
              @click="handleViewTypeChange('month')"
              >月</ElButton
            >
          </ElButtonGroup>
        </div>

        <div class="calendar">
          <Month
            v-if="viewType === 'month'"
            :selected-date="selectedDate"
            :events="events"
            @date-change="handleDateChange"
            @event-click="handleEventClick"
            @event-drop="handleEventDrop"
            @event-resize="handleEventResize"
          />
          <Week
            v-if="viewType === 'week'"
            :selected-date="selectedDate"
            :events="events"
            @date-change="handleDateChange"
            @event-click="handleEventClick"
          />
          <Day
            v-if="viewType === 'day'"
            :events="events"
            @event-click="handleEventClick"
          />
        </div>
      </div>
    </div>

    <!-- 日程详情Popover -->
    <EventPopover
      :visible="popoverVisible"
      :event-data="popoverEventData"
      :target-element="popoverTargetElement"
      @close="handlePopoverClose"
      @edit="handleEventEdit"
      @delete="handleEventDelete"
    />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-tabs__header) {
  margin: 0;
}
:deep(.el-tabs__nav-scroll) {
  padding-left: 20px;
}
:deep(.el-tabs__item) {
  height: 60px;
  font-size: 18px;
}

.app-wrapper {
  @apply flex w-screen h-screen overflow-hidden;

  .left-panel {
    flex: 0 0 300px;
    padding: 10px;
    border-right: 1px solid #f5f5f5;
  }

  .app-content {
    @apply flex-1 h-full flex flex-col overflow-hidden;

    .flex-1 {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;

      .p-15px {
        flex-shrink: 0;
        padding: 15px;
      }

      // Month组件容器
      > div:last-child {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    }
  }
}
</style>
