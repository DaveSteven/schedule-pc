import { ref, computed, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import { useTimeUtils } from './useTimeUtils';

/**
 * 当前时间线相关的hooks
 */
export function useCurrentTime(selectedDate: string) {
  const { minutesToPixels, getCurrentTimePosition, shouldShowCurrentTime: shouldShow } = useTimeUtils();
  
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
    const isToday = dayjs().isSame(selectedDate, 'day');
    return isToday && shouldShow();
  });

  /**
   * 滚动到当前时间
   */
  const scrollToCurrentTime = (container: HTMLElement | null) => {
    if (container) {
      const containerHeight = container.clientHeight;
      const scrollTop = currentTimeTop.value - containerHeight / 2;
      container.scrollTop = Math.max(0, scrollTop);
    }
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
    currentTimeTop,
    shouldShowCurrentTime,
    scrollToCurrentTime,
    updateCurrentTime,
    startCurrentTimeUpdate,
    stopCurrentTimeUpdate,
  };
}