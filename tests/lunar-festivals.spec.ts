/**
 * 农历与节日推算测试。
 * 期望值 = 权威历表记忆值 + 2026 全年节日扫描锁定（见 git 历史 v0.1.0 校准记录）。
 */
import { describe, expect, it } from 'vitest';
import { ganzhiOfYear, getLunarDate, lunarDayName } from '../src/utils/lunar';
import {
  getLunarFestival,
  getSolarFestival,
  isLunarNewYearsEve,
} from '../src/utils/festivals';

describe('getLunarDate（基于 Intl 中国农历）', () => {
  it('2026-02-17 = 丙午年正月初一（春节）', () => {
    const lunar = getLunarDate(new Date(2026, 1, 17));
    expect(lunar).not.toBeNull();
    expect(lunar!.year).toBe(2026);
    expect(lunar!.month).toBe(1);
    expect(lunar!.day).toBe(1);
    expect(lunar!.isLeapMonth).toBe(false);
    expect(lunar!.monthName).toBe('正月');
    expect(lunar!.dayName).toBe('初一');
    expect(lunar!.ganzhi).toBe('丙午');
    expect(lunar!.zodiac).toBe('马');
  });

  it('2025-07-25 = 闰六月初一（闰月识别）', () => {
    const lunar = getLunarDate(new Date(2025, 6, 25));
    expect(lunar!.month).toBe(6);
    expect(lunar!.isLeapMonth).toBe(true);
    expect(lunar!.monthName).toBe('闰六月');
  });

  it('2026-10-11 = 丙午年九月初二', () => {
    const lunar = getLunarDate(new Date(2026, 9, 11));
    expect(lunar!.monthName).toBe('九月');
    expect(lunar!.dayName).toBe('初二');
    expect(lunar!.ganzhi).toBe('丙午');
  });

  it('2026-02-16 = 乙巳年腊月廿九（当年除夕）', () => {
    const lunar = getLunarDate(new Date(2026, 1, 16));
    expect(lunar!.month).toBe(12);
    expect(lunar!.day).toBe(29);
    expect(lunar!.dayName).toBe('廿九');
    expect(lunar!.ganzhi).toBe('乙巳');
    expect(lunar!.zodiac).toBe('蛇');
  });
});

describe('干支纪年推算', () => {
  it.each([
    [1984, '甲子', '鼠'],
    [2000, '庚辰', '龙'],
    [2024, '甲辰', '龙'],
    [2025, '乙巳', '蛇'],
    [2026, '丙午', '马'],
    [2027, '丁未', '羊'],
  ])('%i → %s年（%s）', (year, ganzhi, zodiac) => {
    expect(ganzhiOfYear(year)).toEqual({ ganzhi, zodiac });
  });
});

describe('农历日名', () => {
  it.each([
    [1, '初一'],
    [9, '初九'],
    [10, '初十'],
    [14, '十四'],
    [15, '十五'],
    [20, '二十'],
    [21, '廿一'],
    [23, '廿三'],
    [29, '廿九'],
    [30, '三十'],
  ])('%i → %s', (day, name) => {
    expect(lunarDayName(day)).toBe(name);
  });
});

describe('农历节日推算', () => {
  it.each([
    [2026, 0, 26, '腊八节'], // 乙巳年腊月初八
    [2026, 1, 17, '春节'], // 正月初一
    [2026, 2, 3, '元宵节'], // 正月十五
    [2026, 5, 19, '端午节'], // 五月初五
    [2026, 8, 25, '中秋节'], // 八月十五
    [2026, 9, 18, '重阳节'], // 九月初九
  ])('%i-%i-%i → %s', (y, m, d, festival) => {
    const lunar = getLunarDate(new Date(y, m, d));
    expect(getLunarFestival(lunar!)).toBe(festival);
  });

  it('普通日子无节日', () => {
    const lunar = getLunarDate(new Date(2026, 9, 11)); // 九月初二
    expect(getLunarFestival(lunar!)).toBeNull();
  });

  it('闰月同月日不算节日（规则直测）', () => {
    const leap = { ...getLunarDate(new Date(2026, 5, 19))!, isLeapMonth: true, monthName: '闰五月' };
    expect(getLunarFestival(leap)).toBeNull();
    const normal = { ...leap, isLeapMonth: false };
    expect(getLunarFestival(normal)).toBe('端午节');
  });
});

describe('除夕推算（明日春节反推）', () => {
  it('2026-02-16（腊月廿九）是除夕', () => {
    expect(isLunarNewYearsEve(new Date(2026, 1, 16))).toBe(true);
  });

  it('2027-02-06（腊月三十）是除夕', () => {
    expect(isLunarNewYearsEve(new Date(2027, 1, 6))).toBe(true);
  });

  it('普通日子不是除夕', () => {
    expect(isLunarNewYearsEve(new Date(2026, 9, 11))).toBe(false);
  });
});

describe('公历节日内置表', () => {
  it.each([
    [1, 1, '元旦'],
    [5, 1, '劳动节'],
    [10, 1, '国庆节'],
    [6, 1, '儿童节'],
    [9, 10, '教师节'],
  ])('%i 月 %i 日 → %s', (m, d, name) => {
    expect(getSolarFestival(m, d)).toBe(name);
  });

  it('非节日返回 null', () => {
    expect(getSolarFestival(10, 11)).toBeNull();
  });
});
