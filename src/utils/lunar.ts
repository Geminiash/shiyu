/**
 * 农历日期 —— 基于 Intl 中国农历日历（ICU chinese calendar）。
 *
 * 实现说明：
 * - 用 `en-u-ca-chinese` 的数字格式解析：月份数字 1—12，闰月带 `bis` 后缀
 *   （如 2025 年闰六月 → "6bis"）；relatedYear 给出农历年对应的公历年份。
 * - 干支与生肖由 relatedYear 推算：1984 年为甲子年，(year − 1984) 对 10/12 取模。
 *   例：2026 → (42) → 丙（干 2）、午（支 6）→ 丙午 · 马。
 * - Intl 不可用（极旧内核）时返回 null，界面隐藏农历信息，不影响其余功能。
 *
 * 时区注意：日期一律以「本地时区的当天」参与换算；构造日期用
 * new Date(y, m, d) 本地午夜，跨时区（UTC / UTC+8）结果一致。
 */

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const ZODIAC = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
const GANZHI_EPOCH_YEAR = 1984; // 甲子年

const MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

export interface LunarDate {
  /** 农历年对应的公历年份（relatedYear，用于推干支） */
  year: number;
  /** 农历月 1—12 */
  month: number;
  /** 农历日 1—30 */
  day: number;
  isLeapMonth: boolean;
  /** 干支年，如 丙午 */
  ganzhi: string;
  /** 生肖，如 马 */
  zodiac: string;
  /** 月名，如 正月 / 闰六月 */
  monthName: string;
  /** 日名，如 初一 / 十五 / 廿九 */
  dayName: string;
}

let cachedFormatter: Intl.DateTimeFormat | null | undefined;

function getFormatter(): Intl.DateTimeFormat | null {
  if (cachedFormatter !== undefined) return cachedFormatter;
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-chinese', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    // 探测：确认能解析出数字月/日（个别内核格式不同则视为不可用）
    const parts = fmt.formatToParts(new Date(2026, 1, 17));
    const hasMonth = parts.some((p) => p.type === 'month' && /^\d{1,2}(bis)?$/i.test(p.value.trim()));
    const hasDay = parts.some((p) => p.type === 'day' && /^\d{1,2}$/.test(p.value.trim()));
    cachedFormatter = hasMonth && hasDay ? fmt : null;
  } catch {
    cachedFormatter = null;
  }
  return cachedFormatter;
}

export function ganzhiOfYear(year: number): { ganzhi: string; zodiac: string } {
  const offset = year - GANZHI_EPOCH_YEAR;
  const stem = STEMS[((offset % 10) + 10) % 10];
  const branchIndex = ((offset % 12) + 12) % 12;
  return { ganzhi: stem + BRANCHES[branchIndex], zodiac: ZODIAC[branchIndex] };
}

/** 农历日 1—30 → 中文日名 */
export function lunarDayName(day: number): string {
  const digit = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  if (day < 10) return '初' + digit[day - 1];
  if (day < 20) return '十' + digit[day - 11];
  return '廿' + digit[day - 21];
}

/** 公历 Date → 农历日期；Intl 不可用时返回 null */
export function getLunarDate(date: Date): LunarDate | null {
  const fmt = getFormatter();
  if (!fmt) return null;

  let month: number | null = null;
  let day: number | null = null;
  let isLeapMonth = false;
  let relatedYear: number | null = null;

  for (const part of fmt.formatToParts(date)) {
    const value = part.value.trim();
    if (part.type === 'month') {
      const m = /^(\d{1,2})(bis)?$/i.exec(value);
      if (m) {
        month = Number(m[1]);
        isLeapMonth = m[2] !== undefined;
      }
    } else if (part.type === 'day') {
      const d = /^(\d{1,2})$/.exec(value);
      if (d) day = Number(d[1]);
    } else if ((part.type as string) === 'relatedYear') {
      // ES2022 lib 的 DateTimeFormatPart 联合类型尚未收录 relatedYear，运行时存在
      relatedYear = Number(value);
    }
  }

  if (month === null || day === null || relatedYear === null) return null;
  const { ganzhi, zodiac } = ganzhiOfYear(relatedYear);
  return {
    year: relatedYear,
    month,
    day,
    isLeapMonth,
    ganzhi,
    zodiac,
    monthName: (isLeapMonth ? '闰' : '') + MONTH_NAMES[month - 1],
    dayName: lunarDayName(day),
  };
}
