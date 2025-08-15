import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';
import dayjs from 'dayjs';
import { useTimeUtils } from './useTimeUtils';

/**
 * 通用时间轴基础功能hook
 * 合并周视图和日视图的重复逻辑
 */
export function useTimelineBase(selectedDate: Ref<string>) {
  const { 
    minutesToPixels, 
    pixelsToMinutes, 
    snapToQuarter, 
    formatTime,
    timeLabels, // 直接使用useTimeUtils中的timeLabels computed
    getCurrentTimePosition,
    shouldShowCurrentTime: shouldShowBase
  } = useTimeUtils();

  // 当前时间管理
  const currentTimeTop = ref(0);
  const currentTimeInterval = ref<number | null>(null);

  /**
   * 更新当前时间位置
   */
  const updateCurrentTime = () => {
    currentTimeTop.value = minutesToPixels(getCurrentTimePosition());
  };

  /**
   * 判断是否显示当前时间线
   */
  const shouldShowCurrentTime = computed(() => {
    const isToday = dayjs().isSame(selectedDate.value, 'day');
    return isToday && shouldShowBase();
  });

  /**
   * 滚动到当前时间
   */
  const scrollToCurrentTime = (container: HTMLElement | null, allowScroll: boolean = true) => {
    if (!container || !allowScroll) return;
    
    const containerHeight = container.clientHeight;
    const scrollTop = currentTimeTop.value - containerHeight / 2;
    container.scrollTop = Math.max(0, scrollTop);
  };

  /**
   * 启动当前时间更新
   */
  const startCurrentTimeUpdate = () => {
    updateCurrentTime();
    currentTimeInterval.value = window.setInterval(updateCurrentTime, 60000);
  };

  /**
   * 停止当前时间更新
   */
  const stopCurrentTimeUpdate = () => {
    if (currentTimeInterval.value) {
      clearInterval(currentTimeInterval.value);
      currentTimeInterval.value = null;
    }
  };

  // 生命周期管理
  onMounted(() => {
    startCurrentTimeUpdate();
  });

  onUnmounted(() => {
    stopCurrentTimeUpdate();
  });

  return {
    // 时间工具函数
    minutesToPixels,
    pixelsToMinutes,
    snapToQuarter,
    formatTime,
    
    // 时间标签
    timeLabels,
    
    // 当前时间管理
    currentTimeTop,
    shouldShowCurrentTime,
    scrollToCurrentTime,
    updateCurrentTime,
    startCurrentTimeUpdate,
    stopCurrentTimeUpdate,
  };
}
