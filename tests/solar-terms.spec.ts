/**
 * 二十四节气（C 值法）单元测试。
 *
 * 期望值来源：权威历表记忆值（万年历/紫金山天文台发布的节气时刻取日期）。
 * 覆盖 2024 / 2025 / 2026 三年全部 72 个节气 + 文件头注释中的例外修正年 +
 * 跨年边界与越界行为。若某年出现 ±1 天偏差，以权威记忆值校准
 * EXCEPTIONS_21 并在此登记，不得改动 C 值表本身。
 */
import { describe, expect, it } from 'vitest';
import { getTermAt, getTermDate, getTermSpan, getTermsOfYear, TERM_COLORS } from '../src/utils/solar-terms';

/** 2024 年二十四节气权威日期（公历） */
const TERMS_2024 = [
  '2024-01-06', '2024-01-20', '2024-02-04', '2024-02-19',
  '2024-03-05', '2024-03-20', '2024-04-04', '2024-04-19',
  '2024-05-05', '2024-05-20', '2024-06-05', '2024-06-21',
  '2024-07-06', '2024-07-22', '2024-08-07', '2024-08-22',
  '2024-09-07', '2024-09-22', '2024-10-08', '2024-10-23',
  '2024-11-07', '2024-11-22', '2024-12-06', '2024-12-21',
];

/** 2025 年二十四节气权威日期 */
const TERMS_2025 = [
  '2025-01-05', '2025-01-20', '2025-02-03', '2025-02-18',
  '2025-03-05', '2025-03-20', '2025-04-04', '2025-04-20',
  '2025-05-05', '2025-05-21', '2025-06-05', '2025-06-21',
  '2025-07-07', '2025-07-22', '2025-08-07', '2025-08-23',
  '2025-09-07', '2025-09-23', '2025-10-08', '2025-10-23',
  '2025-11-07', '2025-11-22', '2025-12-07', '2025-12-21',
];

/** 2026 年二十四节气权威日期 */
const TERMS_2026 = [
  '2026-01-05', '2026-01-20', '2026-02-04', '2026-02-18',
  '2026-03-05', '2026-03-20', '2026-04-05', '2026-04-20',
  '2026-05-05', '2026-05-21', '2026-06-05', '2026-06-21',
  '2026-07-07', '2026-07-23', '2026-08-07', '2026-08-23',
  '2026-09-07', '2026-09-23', '2026-10-08', '2026-10-23',
  '2026-11-07', '2026-11-22', '2026-12-07', '2026-12-22',
];

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

describe.each([
  [2024, TERMS_2024],
  [2025, TERMS_2025],
  [2026, TERMS_2026],
])('getTermsOfYear %i（24 个节气逐日对照权威值）', (year, expected) => {
  it('逐节气吻合', () => {
    const terms = getTermsOfYear(year as number);
    const names = [
      '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
      '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
      '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
    ];
    (expected as string[]).forEach((isoDate, i) => {
      const t = terms[i];
      expect(t, `${names[i]} ${year}`).not.toBeNull();
      expect(iso(t!.year, t!.month, t!.day)).toBe(isoDate);
      expect(t!.name).toBe(names[i]);
    });
  });
});

describe('任务指定的校准样例', () => {
  it('2026-03-20 春分', () => {
    const t = getTermDate(2026, 5);
    expect(iso(t!.year, t!.month, t!.day)).toBe('2026-03-20');
  });

  it('2026-12-22 冬至', () => {
    const t = getTermDate(2026, 23);
    expect(iso(t!.year, t!.month, t!.day)).toBe('2026-12-22');
  });

  it('2024-02-04 立春', () => {
    const t = getTermDate(2024, 2);
    expect(iso(t!.year, t!.month, t!.day)).toBe('2024-02-04');
  });
});

describe('例外修正年', () => {
  it('雨水 2026 → 02-18（例外 −1）', () => {
    expect(iso(2026, getTermDate(2026, 3)!.month, getTermDate(2026, 3)!.day)).toBe('2026-02-18');
  });

  it('冬至 2021 → 12-21（例外 −1）', () => {
    expect(iso(2021, getTermDate(2021, 23)!.month, getTermDate(2021, 23)!.day)).toBe('2021-12-21');
  });

  it('立秋 2002 → 08-08（例外 +1）', () => {
    expect(iso(2002, getTermDate(2002, 14)!.month, getTermDate(2002, 14)!.day)).toBe('2002-08-08');
  });
});

describe('getTermAt（当日节气）', () => {
  it('2026-10-08 恰为寒露', () => {
    const t = getTermAt(new Date(2026, 9, 8));
    expect(t?.name).toBe('寒露');
  });

  it('2026-12-22 恰为冬至', () => {
    expect(getTermAt(new Date(2026, 11, 22))?.name).toBe('冬至');
  });

  it('非节气日返回 null', () => {
    expect(getTermAt(new Date(2026, 9, 11))).toBeNull();
  });
});

describe('getTermSpan（当前节气段 + 下一节气）', () => {
  it('2026-10-11：寒露进行中，霜降还有 12 天', () => {
    const span = getTermSpan(new Date(2026, 9, 11));
    expect(span?.current.name).toBe('寒露');
    expect(span?.next.name).toBe('霜降');
    expect(span?.daysToNext).toBe(12);
  });

  it('跨年：2027-01-03 的当前节气是上一年冬至', () => {
    const span = getTermSpan(new Date(2027, 0, 3));
    expect(span?.current.name).toBe('冬至');
    expect(span?.current.year).toBe(2026);
    expect(span?.next.name).toBe('小寒');
    expect(span?.next.year).toBe(2027);
    expect(span?.daysToNext).toBe(2);
  });

  it('节气当天：current 即当天节气', () => {
    const span = getTermSpan(new Date(2026, 2, 20));
    expect(span?.current.name).toBe('春分');
    expect(span?.next.name).toBe('清明');
    expect(span?.daysToNext).toBe(16);
  });
});

describe('越界与配色', () => {
  it('2000 年与 2101 年返回 null', () => {
    expect(getTermDate(2000, 0)).toBeNull();
    expect(getTermDate(2101, 0)).toBeNull();
    expect(getTermsOfYear(1999).every((t) => t === null)).toBe(true);
  });

  it('每个节气都有主色', () => {
    for (const name of [
      '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
      '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
      '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
    ]) {
      expect(TERM_COLORS[name]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
