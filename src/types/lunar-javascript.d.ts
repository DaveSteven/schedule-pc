declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getDayInChinese(): string;
    getFestivals(): string[];
    getSolarFestivals(): string[];
    getJieQi(): string;
  }
  
  export class HolidayUtil {
    static getHoliday(year: number, month: number, day: number): {
      getName(): string;
    } | null;
  }
}
