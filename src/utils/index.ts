import Color from "color";
import _ from "lodash";

/**
 * 安全地解析 JSON 字符串为对象
 * @param str 要解析的字符串
 * @param defaultValue 解析失败时的默认值
 * @returns 解析后的对象或默认值
 */
export function strToObj(str: string, defaultValue: any = {}) {
  if (!_.isString(str)) {
    return defaultValue;
  }

  const result = _.attempt(JSON.parse, str);
  return _.isError(result) ? defaultValue : result;
}

/**
 * 将对象转换为 JSON 字符串
 * @param obj 要转换的对象
 * @param defaultValue 转换失败时的默认值
 * @returns JSON 字符串或默认值
 */
export function objToStr(obj: any, defaultValue: string = "{}") {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}

export const lightenColor = (color: string, opacity: number = 0.8) => {
  try {
    const colorObj = Color(color);
    const white = Color("#ffffff");
    return colorObj.mix(white, opacity).hex();
  } catch (error) {
    return color;
  }
};
