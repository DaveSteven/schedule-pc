import dayjs from "dayjs";
import { Lunar } from "lunar-javascript";
// @ts-ignore
import { HolidayUtil } from "lunar-javascript";

// 农历显示参数类型
export interface LunarParams {
  year: number;
  month: number;
  day: number;
}

/**
 * 获取农历显示文本
 * @param params 年月日参数
 * @returns 农历显示文本
 */
export const getLunarDisplayText = ({
  year,
  month,
  day,
}: LunarParams): string => {
  const lunar = Lunar.fromDate(new Date(year, month - 1, day));
  const holiday = HolidayUtil.getHoliday(year, month, day);
  const holidayName = holiday?.getName();
  return lunar.getJieQi() || holidayName || lunar.getDayInChinese();
};

/**
 * 获取节假日信息
 * @param date dayjs日期对象
 * @returns 节假日字符串
 */
export const getHolidayInfo = (date: dayjs.Dayjs): string => {
  try {
    const lunar = Lunar.fromDate(date.toDate());

    // 获取农历节日
    const lunarFestivals = lunar.getFestivals();
    if (lunarFestivals.length > 0) {
      return lunarFestivals[0];
    }

    // 获取公历节日
    const solarFestivals = lunar.getSolarFestivals();
    if (solarFestivals.length > 0) {
      return solarFestivals[0];
    }

    // 获取节气
    const jieQi = lunar.getJieQi();
    if (jieQi) {
      return jieQi;
    }

    return "";
  } catch (error) {
    return "";
  }
};

/**
 * 判断是否为工作日
 * @param date dayjs日期对象
 * @returns 是否为工作日
 */
export const isWorkday = (date: dayjs.Dayjs): boolean => {
  const day = date.day();
  return day >= 1 && day <= 5; // 周一到周五
};

/**
 * 判断是否为周末
 * @param date dayjs日期对象
 * @returns 是否为周末
 */
export const isWeekend = (date: dayjs.Dayjs): boolean => {
  const day = date.day();
  return day === 0 || day === 6; // 周日或周六
};

/**
 * 获取日期状态标记
 * @param date dayjs日期对象
 * @returns 状态标记对象
 */
export const getDateStatus = (date: dayjs.Dayjs) => {
  const lunar = Lunar.fromDate(date.toDate());

  return {
    isWorkday: isWorkday(date),
    isWeekend: isWeekend(date),
    lunarDate: getLunarDisplayText({
      year: date.year(),
      month: date.month() + 1,
      day: date.date(),
    }),
    holiday: getHolidayInfo(date),
    // 特殊日期标记
    specialMark: getSpecialDateMark(date, lunar),
  };
};

/**
 * 获取特殊日期标记
 * @param date dayjs日期对象
 * @param lunar 农历对象
 * @returns 特殊标记
 */
const getSpecialDateMark = (date: dayjs.Dayjs, lunar: any): string => {
  // 这里可以添加更多的特殊日期判断逻辑
  // 比如调休日、补班日等

  // 示例：判断是否为调休日
  if (isWeekend(date)) {
    // 这里可以根据具体的调休安排来判断
    return "";
  }

  // 示例：判断是否为补班日
  if (isWorkday(date)) {
    // 这里可以根据具体的补班安排来判断
    return "";
  }

  return "";
};

/**
 * 格式化日期显示
 * @param date dayjs日期对象
 * @param format 格式字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: dayjs.Dayjs,
  format = "YYYY-MM-DD"
): string => {
  return date.format(format);
};

/**
 * 获取日期范围
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期数组
 */
export const getDateRange = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs
): dayjs.Dayjs[] => {
  const dates: dayjs.Dayjs[] = [];
  let current = startDate.clone();

  while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
    dates.push(current.clone());
    current = current.add(1, "day");
  }

  return dates;
};
