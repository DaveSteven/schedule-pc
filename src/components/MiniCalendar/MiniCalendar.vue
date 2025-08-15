<template>
  <div class="month-calendar">
    <!-- 头部：年月显示和切换按钮 -->
    <div class="calendar-header">
      <div class="current-month">{{ currentYearMonth }}</div>
      <div class="navigation-buttons">
        <div @click="previousMonth" class="nav-btn">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div @click="nextMonth" class="nav-btn">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 星期标题 -->
    <div class="weekdays">
      <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div
        v-for="date in calendarDates"
        :key="date.key"
        class="calendar-day"
        :class="{
          'other-month': date.isOtherMonth,
          selected: date.isSelected,
          today: date.isToday,
        }"
        @click="selectDate(date)"
      >
        <span class="date-number">{{ date.day }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import dayjs from "dayjs";
import { ElIcon } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { useCalendarStore } from "@/stores/calendar";

// 获取calendar store
const calendarStore = useCalendarStore();

// 当前显示的日期
const currentDate = ref(dayjs());

// 选中的日期从store获取
const selectedDate = computed(() => dayjs(calendarStore.selectedDate));

// 优化：添加一个计算属性来处理选中状态，避免闪烁
const selectedDateKey = computed(() => {
  return selectedDate.value.format("YYYY-MM-DD");
});

// 星期标题
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

// 计算当前年月显示文本
const currentYearMonth = computed(() => {
  return `${currentDate.value.year()}年${currentDate.value.month() + 1}月`;
});

// 计算日历数据
const calendarDates = computed(() => {
  const year = currentDate.value.year();
  const month = currentDate.value.month();

  // 获取当月第一天和最后一天
  const firstDay = dayjs().year(year).month(month).date(1);
  const lastDay = dayjs().year(year).month(month).date(1).endOf("month");

  // 获取当月第一天是星期几（0-6，0是星期日）
  const firstDayWeek = firstDay.day();

  // 计算需要显示的总天数（固定6行，每行7天）
  const totalDays = 6 * 7;

  const dates = [];

  for (let i = 0; i < totalDays; i++) {
    // 计算当前日期在网格中的位置
    const gridIndex = i - firstDayWeek;

    if (gridIndex < 0) {
      // 上个月的日期
      const prevMonth = firstDay.subtract(1, "month");
      const prevMonthLastDay = prevMonth.endOf("month");
      const day = prevMonthLastDay.date() + gridIndex + 1;
      const date = prevMonth.date(day);
      dates.push({
        key: `prev-${day}`,
        day,
        date,
        isOtherMonth: true,
        isSelected: selectedDateKey.value === date.format("YYYY-MM-DD"),
        isToday: false,
      });
    } else if (gridIndex >= lastDay.date()) {
      // 下个月的日期
      const nextMonth = lastDay.add(1, "month");
      const day = gridIndex - lastDay.date() + 1;
      const date = nextMonth.date(day);
      dates.push({
        key: `next-${day}`,
        day,
        date,
        isOtherMonth: true,
        isSelected: selectedDateKey.value === date.format("YYYY-MM-DD"),
        isToday: false,
      });
    } else {
      // 当月的日期
      const day = gridIndex + 1;
      const date = dayjs().year(year).month(month).date(day);
      dates.push({
        key: `current-${day}`,
        day,
        date,
        isOtherMonth: false,
        isSelected: selectedDateKey.value === date.format("YYYY-MM-DD"),
        isToday: dayjs().isSame(date, "day"),
      });
    }
  }

  return dates;
});

// 选择日期
const selectDate = (date) => {
  if (!date.isOtherMonth) {
    calendarStore.setSelectedDate(date.date.format('YYYY-MM-DD'));
  }
};

// 上个月
const previousMonth = () => {
  currentDate.value = currentDate.value.subtract(1, "month");
  // 保持当前选中的日期，避免闪烁
  // 如果选中的日期不在新月份中，保持选中状态
};

// 下个月
const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, "month");
  // 保持当前选中的日期，避免闪烁
  // 如果选中的日期不在新月份中，保持选中状态
};

// 组件挂载时初始化
onMounted(() => {
  // 初始化当前显示月份为选中日期所在月份
  currentDate.value = selectedDate.value;
});

// 监听store中selectedDate的变化，同步更新当前显示月份
watch(() => calendarStore.selectedDate, (newDate) => {
  const newDateObj = dayjs(newDate);
  // 如果选中的日期不在当前显示的月份中，则切换到该月份
  if (!newDateObj.isSame(currentDate.value, 'month')) {
    currentDate.value = newDateObj;
  }
});
</script>

<style scoped lang="scss">
.month-calendar {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-month {
  padding-left: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.navigation-buttons {
  display: flex;
  gap: 8px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f5f7fa;
    cursor: pointer;
  }
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  padding: 12px 8px;
  font-weight: 500;
  color: #606266;
  background-color: transparent;
  border-radius: 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  background-color: transparent;
  border-radius: 0;
  overflow: visible;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 50%;

  &:hover {
    background-color: #f0f9ff;
  }

  &.other-month {
    .date-number {
      color: #c0c4cc;
    }
  }

  &.selected {
    background-color: #9f58ff;
    transition: background-color 0.3s ease, color 0.3s ease;

    .date-number {
      color: white;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    &.today {
      .date-number {
        color: #fff;
      }

      &::after {
        background-color: #fff;
      }
    }
  }

  &.today {
    .date-number {
      color: #9f58ff;
      font-weight: 600;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background-color: #9f58ff;
      border-radius: 50%;
    }
  }
}

.date-number {
  font-size: 16px;
  font-weight: 400;
  color: #303133;
  user-select: none;
}
</style>
