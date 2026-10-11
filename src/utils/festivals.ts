/**
 * 节日表：农历节日按农历月日推算，公历节日查内置表。
 * 农历节日只在正月初到腊月三十的「正数月」生效，闰月同月日不视为节日。
 */
import type { LunarDate } from './lunar';
import { getLunarDate } from './lunar';

/** 公历节日内置表：`${月}-${日}` → 名称 */
export const SOLAR_FESTIVALS: Record<string, string> = {
  '1-1': '元旦',
  '3-8': '妇女节',
  '3-12': '植树节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
};

/** 农历节日：`${农历月}-${农历日}` → 名称 */
export const LUNAR_FESTIVALS: Record<string, string> = {
  '1-1': '春节',
  '1-15': '元宵节',
  '5-5': '端午节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-8': '腊八节',
};

export function getSolarFestival(month: number, day: number): string | null {
  return SOLAR_FESTIVALS[`${month}-${day}`] ?? null;
}

export function getLunarFestival(lunar: LunarDate): string | null {
  if (lunar.isLeapMonth) return null;
  return LUNAR_FESTIVALS[`${lunar.month}-${lunar.day}`] ?? null;
}

/**
 * 除夕：明天恰为正月初一（非闰月）。除夕不固定在腊月三十或廿九，
 * 用「次日是春节」反推最稳。
 */
export function isLunarNewYearsEve(date: Date): boolean {
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const lunar = getLunarDate(tomorrow);
  return lunar !== null && lunar.month === 1 && lunar.day === 1 && !lunar.isLeapMonth;
}
