/**
 * 二十四节气计算 —— 寿星通用公式（C 值法）
 *
 * 公式：day = int(Y × 0.2422 + C) − L
 *   Y  = 公历年份后两位
 *   C  = 世纪常数（21 世纪各节气 C 值表，见 C21）
 *   L  = 闰年数修正
 *
 * 【关键校准点】L 的取法按节气所在月份区分：
 *   - 1、2 月的节气（小寒/大寒/立春/雨水）：L = int((Y − 1) / 4)
 *     —— 闰日（2 月 29 日）落在节气之后，当年闰日不计入；
 *   - 3—12 月的节气：L = int(Y / 4)
 *     —— 当年闰日已在节气之前发生，需要计入。
 *
 * 这条规则不是凭记忆照抄，而是用天文历表回推验证得出：若一律用 int(Y/4)，
 * 立春 2024 会算成 2 月 3 日（权威值 2 月 4 日）；若一律用 int((Y−1)/4)，
 * 春分 2024 会算成 3 月 21 日（权威值 3 月 20 日）。两种混用后，
 * 2024 / 2025 / 2026 三年全部 72 个节气均与权威历表逐日吻合（见 tests/solar-terms.spec.ts）。
 *
 * 已知例外修正（均按权威历表核对后收录，未验证的文献条目一律不收）：
 *   雨水 2026 −1（2026-02-18）、冬至 2021 −1（2021-12-21）、立秋 2002 +1（2002-08-08）。
 * 其余年份按公式直算；21 世纪内未收录例外的年份个别可能出现 ±1 天偏差，
 * 属 C 值法固有精度，docs/design.md 有说明。
 *
 * 支持范围：2001—2100。越界返回 null，界面据此优雅降级。
 */

export const TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水',
  '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至',
] as const;

/** 每个节气固定落在的公历月份（与 TERM_NAMES 同序） */
export const TERM_MONTHS = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
  7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12,
] as const;

/** 21 世纪世纪常数（2001—2100） */
const C21 = [
  5.4055, 20.12, 3.87, 18.73,
  5.63, 20.646, 4.81, 20.1,
  5.52, 21.04, 5.678, 21.37,
  7.108, 22.83, 7.5, 23.13,
  7.646, 23.042, 8.318, 23.438,
  7.438, 22.36, 7.18, 21.94,
] as const;

/**
 * 例外修正表：`${节气序号}-${年份}` → 天数增量。
 * 只收录能与权威历表核对的条目。
 */
const EXCEPTIONS_21: Record<string, number> = {
  '3-2026': -1, // 雨水 2026 → 2 月 18 日
  '23-2021': -1, // 冬至 2021 → 12 月 21 日
  '14-2002': 1, // 立秋 2002 → 8 月 8 日
};

export interface SolarTermInfo {
  /** 0—23，从小寒起 */
  index: number;
  name: string;
  year: number;
  month: number;
  day: number;
  /** 节气主色（取意中国传统色，暗底对比度调校，见 docs/design.md） */
  color: string;
}

/**
 * 节气主色表。色名取自中国传统色系，色值按暗底可读性（对比度 ≥ 4.5:1）
 * 统一调校，非考据原件，逐色说明见 docs/design.md。
 */
export const TERM_COLORS: Record<string, string> = {
  小寒: '#5E9FCB', // 寒渚
  大寒: '#8FB8D8', // 冰鉴
  立春: '#6EC29B', // 柳芽
  雨水: '#66C2D8', // 天缥（意）
  惊蛰: '#8CC776', // 新篁
  春分: '#9BCB6E', // 嫩棠
  清明: '#63C0A8', // 青翠
  谷雨: '#B5CC66', // 新茶
  立夏: '#E2B15C', // 麦候
  小满: '#E5A94E', // 麦黄
  芒种: '#E89A4B', // 芒金
  夏至: '#EE8055', // 朱颜酡（visual-guide 原值）
  小暑: '#E8704F', // 温风
  大暑: '#E05A45', // 伏赤
  立秋: '#DFA146', // 梧月
  处暑: '#CFA354', // 禾金
  白露: '#B4C2CC', // 露白
  秋分: '#D9A441', // 桂秋
  寒露: '#8CA6BC', // 寒玉
  霜降: '#F26B1F', // 银朱（visual-guide 原值）
  立冬: '#6E88A8', // 初冬
  小雪: '#92A8C0', // 雪意
  大雪: '#AFC6DC', // 琼英
  冬至: '#4E7FB5', // 深冬
};

/** 计算某年某节气（index 0—23）的公历日期；年份越界返回 null */
export function getTermDate(year: number, index: number): SolarTermInfo | null {
  if (!Number.isInteger(year) || year < 2001 || year > 2100) return null;
  if (index < 0 || index > 23) return null;
  const month = TERM_MONTHS[index];
  const y2 = year % 100;
  // 1、2 月节气按前一年计闰年数（见文件头注释）
  const yEff = month <= 2 ? y2 - 1 : y2;
  const leapCount = Math.floor(Math.max(yEff, 0) / 4);
  let day = Math.floor(y2 * 0.2422 + C21[index]) - leapCount;
  const exception = EXCEPTIONS_21[`${index}-${year}`];
  if (exception !== undefined) day += exception;
  const name = TERM_NAMES[index];
  return { index, name, year, month, day, color: TERM_COLORS[name] };
}

/** 取某年全部 24 个节气（越界年份逐项为 null） */
export function getTermsOfYear(year: number): (SolarTermInfo | null)[] {
  return Array.from({ length: 24 }, (_, i) => getTermDate(year, i));
}

function toLocalMidnight(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

/** 某个公历日期当天是否恰为节气日；是则返回该节气 */
export function getTermAt(date: Date): SolarTermInfo | null {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  for (let i = 0; i < 24; i++) {
    const t = getTermDate(y, i);
    if (t && t.month === m && t.day === d) return t;
  }
  return null;
}

export interface TermSpan {
  /** 当前所处节气段：今天或最近一个已过的节气 */
  current: SolarTermInfo;
  /** 下一个节气 */
  next: SolarTermInfo;
  /** 距下一节气的整天数（>0） */
  daysToNext: number;
}

/**
 * 计算某日期所处的节气段与下一个节气。
 * 跨年处理：1 月初的当前节气可能属于上一年 12 月（大雪/冬至）；
 * 12 月末的下一节气可能属于下一年 1 月（小寒）。
 */
export function getTermSpan(date: Date): TermSpan | null {
  const y = date.getFullYear();
  const nowTs = toLocalMidnight(y, date.getMonth() + 1, date.getDate());
  const pool: SolarTermInfo[] = [];
  for (const year of [y - 1, y, y + 1]) {
    for (let i = 0; i < 24; i++) {
      const t = getTermDate(year, i);
      if (t) pool.push(t);
    }
  }
  pool.sort((a, b) => toLocalMidnight(a.year, a.month, a.day) - toLocalMidnight(b.year, b.month, b.day));
  let current: SolarTermInfo | null = null;
  let next: SolarTermInfo | null = null;
  for (const t of pool) {
    const ts = toLocalMidnight(t.year, t.month, t.day);
    if (ts <= nowTs) current = t;
    else {
      next = t;
      break;
    }
  }
  if (!current || !next) return null;
  const daysToNext = Math.round((toLocalMidnight(next.year, next.month, next.day) - nowTs) / 86_400_000);
  return { current, next, daysToNext };
}
