import Color from "color";
import dayjs from "dayjs";
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

export const getNewScheduleTime = (
  s: Date | string | dayjs.Dayjs = new Date()
): { start: string; end: string } => {
  let startTime = dayjs(s);
  let startMinute: number | string = dayjs(s).minute();

  if (startMinute >= 0 && startMinute < 30) {
    startTime = startTime.set("minutes", 30);
  } else {
    startTime = startTime.add(1, "hour").set("minute", 0);
  }

  let endTime = dayjs(startTime).add(1, "hour");

  const start = startTime.format("YYYY-MM-DD HH:mm");
  const end = endTime.format("YYYY-MM-DD HH:mm");
  return { start, end };
};
