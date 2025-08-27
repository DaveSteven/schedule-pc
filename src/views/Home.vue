<script setup lang="ts">
import {
  ElTabPane,
  ElTabs,
  ElButton,
  ElIcon,
  ElButtonGroup,
  ElDivider,
  ElCheckbox,
  ElCollapse,
  ElCollapseItem,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElInput,
} from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  CaretBottom,
  More,
} from "@element-plus/icons-vue";
import MiniCalendar from "@/components/MiniCalendar";
import { ref, onMounted, computed, watch } from "vue";
import { useEventsStore } from "@/stores/events";
import { useCalendarStore } from "@/stores/calendar";
import { storeToRefs } from "pinia";
import { Calendar } from "@/components/Calendar";
import EventPopover from "@/components/EventPopover";
import type { UserSwitchType } from "@/stores/app";
import type { EventData } from "@/components/EventPopover/types";
import EventDetail from "@/components/EventDetail";
import { useCalendarEvents } from "@/components/Calendar/composables/useCalendarEvents";
import type { EventChangeData } from "@/components/Calendar/types/events";
import dayjs from "dayjs";

// 获取 stores
const eventsStore = useEventsStore();
const calendarStore = useCalendarStore();
const { events } = storeToRefs(eventsStore);

// 使用统一的事件处理
const {
  handleDateChange: handleCalendarDateChange,
  handleEventClick: handleCalendarEventClick,
  handleEventChange: handleCalendarEventChange,
} = useCalendarEvents();

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

const currentDateText = computed(() =>
  dayjs(calendarStore.selectedDate).format("YYYY年MM月")
);

// 当前视图类型
const viewType = computed(() => calendarStore.viewType);

// Popover相关状态
const popoverVisible = ref(false);
const popoverEventData = ref<EventData | null>(null);
const popoverTargetElement = ref<HTMLElement | null>(null);

// 事件处理方法 - 使用统一的事件处理
const handleEventClick = (arg: any) => {
  console.log("handleEventClick:", arg);

  // 调用统一的事件处理
  handleCalendarEventClick(arg);

  // 显示Popover
  popoverEventData.value = arg.event;
  popoverTargetElement.value = arg.el;
  popoverVisible.value = true;
};

const handleEventChange = (info: EventChangeData) => {
  console.log("event change:", info);
  // 事件变更处理，现在由各个视图组件内部处理
  handleCalendarEventChange(info);
};

// Popover事件处理
const handlePopoverClose = () => {
  popoverVisible.value = false;
  popoverEventData.value = null;
  popoverTargetElement.value = null;
};

// 下拉菜单状态跟踪 - 为每个日历项单独跟踪
const dropdownVisibleMap = ref<Record<string, boolean>>({});
const handleDropdownVisibleChange = (calendarId: string, visible: boolean) => {
  dropdownVisibleMap.value[calendarId] = visible;
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

// 监听日期变化 - 使用统一的事件处理
const handleDateChange = async (data: any) => {
  console.log("Date change:", data);

  // 调用统一的事件处理
  handleCalendarDateChange(data);

  // 原有的业务逻辑
  if (data.date) {
    await fetchScheduleData();
  }
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

// 日历分类相关状态
const calendarCategories = ref([
  {
    id: "1",
    name: "陈可昕",
    color: "#8A2BE2", // COLOR_PALETTE.PURPLE
    isDefault: false,
    checked: true,
  },
  {
    id: "2",
    name: "我的任务",
    color: "#FFD700", // COLOR_PALETTE.YELLOW
    isDefault: true,
    checked: true,
  },
  {
    id: "3",
    name: "生活",
    color: "#32CD32", // COLOR_PALETTE.GREEN
    isDefault: true,
    checked: true,
  },
  {
    id: "4",
    name: "纪念日及生日祝福",
    color: "#FF69B4", // COLOR_PALETTE.PINK
    isDefault: false,
    checked: true,
  },
]);

const calendarCollapseActive = ref(["1"]); // 默认展开

// 处理新建日历
const handleNewCalendar = () => {
  console.log("新建日历");
  // TODO: 实现新建日历逻辑
};

// 处理日历项点击
const handleCalendarItemClick = (calendarId: string) => {
  const calendar = calendarCategories.value.find((c) => c.id === calendarId);
  if (calendar) {
    // 切换选中状态
    calendar.checked = !calendar.checked;
  }
};
</script>

<template>
  <div class="app-wrapper">
    <div class="left-panel">
      <MiniCalendar :view-type="viewType" />
      <ElDivider class="my-10px!" />

      <!-- 日历分类列表 -->
      <div class="calendar-categories">
        <!-- 新建日历按钮 -->
        <div class="new-calendar-btn" @click="handleNewCalendar">
          <span class="add-icon">+</span>
          <span>新建日历</span>
        </div>

        <!-- 我的日历分类 -->
        <ElCollapse v-model="calendarCollapseActive" class="calendar-collapse">
          <ElCollapseItem name="1" class="calendar-collapse-item">
            <template #title>
              <div class="collapse-title">
                <ElIcon
                  class="collapse-arrow"
                  :class="{ 'is-active': calendarCollapseActive.includes('1') }"
                  size="16"
                >
                  <CaretBottom />
                </ElIcon>
                <span>我的日历</span>
              </div>
            </template>

            <div class="calendar-list">
              <div
                v-for="calendar in calendarCategories"
                :key="calendar.id"
                class="calendar-item"
                :class="{ 'dropdown-open': dropdownVisibleMap[calendar.id] }"
              >
                <div
                  class="flex-1"
                  @click="handleCalendarItemClick(calendar.id)"
                >
                  <ElCheckbox
                    :model-value="calendar.checked"
                    class="calendar-checkbox"
                    :style="{ '--calendar-color': calendar.color }"
                  >
                    <span class="calendar-name">{{ calendar.name }}</span>
                  </ElCheckbox>
                </div>

                <!-- 更多操作按钮 -->
                <ElDropdown
                  trigger="click"
                  class="calendar-more"
                  @visible-change="
                    (visible) =>
                      handleDropdownVisibleChange(calendar.id, visible)
                  "
                  ref="dropdownRef"
                >
                  <ElIcon class="more-icon"><More /></ElIcon>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem>仅显示此日历</ElDropdownItem>
                      <ElDropdownItem>日历设置</ElDropdownItem>
                      <ElDropdownItem>删除日历</ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </div>
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </div>
    </div>
    <div class="app-content">
      <div class="relative">
        <ElTabs v-model="activeTab" @tab-change="handleTabChange">
          <ElTabPane
            v-for="(tab, index) in tabs"
            :key="tab.key"
            :label="tab.label"
            :name="index"
          />
        </ElTabs>

        <div class="absolute right-10px bottom-10px flex items-center">
          <ElButton type="primary" size="large">创建日程</ElButton>
          <!-- <ElInput v-model="search" placeholder="搜索" type="large" /> -->
        </div>
      </div>
      <div class="app-container flex flex-col overflow-hidden">
        <div class="p-15px flex items-center gap-15px">
          <ElButton @click="handleToday">今天</ElButton>
          <ElButtonGroup>
            <ElButton @click="handlePrev"
              ><ElIcon><ArrowLeft /></ElIcon
            ></ElButton>
            <ElButton @click="handleNext"
              ><ElIcon><ArrowRight /></ElIcon
            ></ElButton>
          </ElButtonGroup>
          <div class="current-date">
            <span>{{ currentDateText }}</span>
          </div>

          <div class="view-type-selector ml-4">
            <button
              :class="['view-type-btn', { active: viewType === 'day' }]"
              @click="handleViewTypeChange('day')"
            >
              日
            </button>
            <button
              :class="['view-type-btn', { active: viewType === 'week' }]"
              @click="handleViewTypeChange('week')"
            >
              周
            </button>
            <button
              :class="['view-type-btn', { active: viewType === 'month' }]"
              @click="handleViewTypeChange('month')"
            >
              月
            </button>
          </div>
        </div>

        <div class="calendar">
          <Calendar
            :view-type="viewType"
            :selected-date="selectedDate"
            :events="events"
            @date-change="handleDateChange"
            @event-click="handleEventClick"
            @event-change="handleEventChange"
          />
        </div>
      </div>
    </div>

    <!-- 日程详情Popover -->
    <EventPopover
      :visible="popoverVisible"
      :target-element="popoverTargetElement"
      @close="handlePopoverClose"
      :width="300"
    >
      <EventDetail :event-data="popoverEventData" />
    </EventPopover>
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

    .calendar-categories {
      .new-calendar-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 12px 0;
        color: #262626;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.3s;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 5px;

        &:hover {
          color: var(--el-color-primary);
        }

        .add-icon {
          display: inline-block;
          width: 16px;
          height: 16px;
          line-height: 13px;
          text-align: center;
          font-size: 16px;
          font-weight: 500;
        }
      }

      :deep(.el-collapse) {
        border: none;
      }

      .calendar-collapse {
        :deep(.el-collapse-item__header) {
          border: none;
          padding: 0;
          height: 15px;

          .collapse-title {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #262626;
            font-size: 14px;
            font-weight: 500;

            .collapse-arrow {
              font-size: 12px;
              transition: transform 0.3s;

              &.is-active {
                transform: rotate(180deg);
              }
            }
          }
        }

        :deep(.el-collapse-item__wrap) {
          border-bottom: none;
        }

        :deep(.el-collapse-item__content) {
          padding: 8px 0;
          border: none;
        }

        :deep(.el-collapse-item__arrow) {
          display: none;
        }

        .calendar-list {
          .calendar-item {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2px 8px;
            border-radius: 4px;
            transition: all 0.3s;
            cursor: pointer;

            &.active {
              background-color: #f2f3f5;
            }

            &:hover {
              background-color: #f5f7fa;
            }

            .calendar-checkbox {
              flex: 1;

              :deep(.el-checkbox__label) {
                padding-left: 8px;
              }

              :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
                background-color: var(--calendar-color);
                border-color: var(--calendar-color);
              }

              :deep(.el-checkbox__inner) {
                border-color: var(--calendar-color);
              }

              :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
                color: var(--calendar-color);
              }

              .calendar-name {
                font-size: 14px;
                color: #303133;
              }
            }

            .calendar-more {
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              opacity: 0;
              transition: all 0.3s;
              z-index: 1;
              border-radius: 4px;

              &:hover {
                background-color: #dfdfdf;
              }

              .more-icon {
                font-size: 16px;
                color: #909399;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;

                &:hover {
                  color: #606266;
                }
              }

              // 确保下拉菜单有足够的 z-index
              :deep(.el-dropdown-menu) {
                z-index: 3000;
              }
            }

            // 当菜单打开时，整个日历项保持菜单按钮可见
            &.dropdown-open {
              .calendar-more {
                opacity: 1;
              }
            }

            &:hover {
              .calendar-more {
                opacity: 1;
              }
            }
          }
        }
      }
    }
  }

  .view-type-selector {
    display: flex;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    overflow: hidden;
    background: white;
    padding: 5px;

    .view-type-btn {
      border: none;
      background: white;
      color: #606266;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      border-radius: 4px;
      width: 66px;
      height: 24px;

      &:hover {
        background: #f5f7fa;
        color: var(--el-color-primary);
      }

      &.active {
        background: rgba(110, 55, 255, 0.12);
        color: var(--el-color-primary);
        font-weight: 500;
      }

      &:first-child {
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
      }

      &:last-child {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
      }
    }
  }

  .app-content {
    @apply flex-1 h-full flex flex-col overflow-hidden;

    .current-date {
      flex: 1;
      color: #1f242a;
      font-size: 16px;
    }

    .app-container {
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
