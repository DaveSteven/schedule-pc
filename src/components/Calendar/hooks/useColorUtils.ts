import Color from "color";

/**
 * 颜色处理相关的工具函数
 */
export function useColorUtils() {
  /**
   * 淡化颜色
   */
  const lightenColor = (color: string, opacity: number = 0.8): string => {
    try {
      const colorObj = Color(color);
      const white = Color("#ffffff");
      return colorObj.mix(white, opacity).hex();
    } catch (error) {
      return color;
    }
  };

  return {
    lightenColor,
  };
}
