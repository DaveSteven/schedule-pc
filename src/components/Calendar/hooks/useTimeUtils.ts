import { computed } from "vue";
import type { TimeLabel } from "../components/Day/types";

/**
 * 时间处理相关的工具hooks
 */
export function useTimeUtils() {
  /**
   * 生成时间标签
   */
  const generateTimeLabels = (): TimeLabel[] => {
    const labels: TimeLabel[] = [];
    for (let hour = 1; hour < 24; hour++) {
      labels.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        top: hour * 60, // 每小时60px
      });
    }
    return labels;
  };

  /**
   * 分钟转像素
   */
  const minutesToPixels = (minutes: number): number => {
    return minutes; // 1分钟 = 1px
  };

  /**
   * 像素转分钟
   */
  const pixelsToMinutes = (pixels: number): number => {
    return pixels;
  };

  /**
   * 对齐到15分钟
   */
  const snapToQuarter = (minutes: number): number => {
    const clampedMinutes = Math.max(0, Math.min(1440, minutes));
    const hour = Math.floor(clampedMinutes / 60);
    const hourStart = hour * 60;

    if (Math.abs(clampedMinutes - hourStart) <= 7.5) {
      return hourStart;
    }

    return Math.round(clampedMinutes / 15) * 15;
  };

  /**
   * 格式化时间
   */
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * 格式化时间显示（别名，兼容Week组件）
   */
  const formatTimeDisplay = formatTime;

  /**
   * 获取当前时间的像素位置
   */
  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes;
  };

  /**
   * 判断是否应该显示当前时间线
   */
  const shouldShowCurrentTime = (): boolean => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 6 && hours < 22;
  };

  /**
   * 计算时间标签
   */
  const timeLabels = computed(() => generateTimeLabels());

  /**
   * 根据分钟数计算开始和结束时间
   */
  const calculateTimeRange = (
    startMinutes: number,
    duration: number,
    baseDate: string
  ) => {
    const baseDateObj = new Date(baseDate);

    // 计算开始时间
    const startDate = new Date(baseDateObj);
    startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    // 计算结束时间
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    // 格式化日期和时间
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    };

    const formatTime = (date: Date) => {
      return date.toTimeString().slice(0, 5); // HH:mm
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
    };
  };

  /**
   * 检查时间是否跨天
   */
  const isTimeCrossDay = (
    startMinutes: number,
    duration: number,
    baseDate: string
  ) => {
    const { startDate, endDate } = calculateTimeRange(
      startMinutes,
      duration,
      baseDate
    );
    return startDate !== endDate;
  };

  return {
    generateTimeLabels,
    minutesToPixels,
    pixelsToMinutes,
    snapToQuarter,
    formatTime,
    formatTimeDisplay,
    getCurrentTimePosition,
    shouldShowCurrentTime,
    timeLabels,
    calculateTimeRange,
    isTimeCrossDay,
  };
}
