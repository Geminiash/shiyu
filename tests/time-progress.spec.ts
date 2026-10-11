/**
 * 时间进度计算测试：边界、单调性与闰年分母。
 */
import { describe, expect, it } from 'vitest';
import { dayProgress, formatCnDate, monthProgress, pad2, yearProgress } from '../src/utils/time-progress';

describe('dayProgress', () => {
  it('午夜为 0', () => {
    expect(dayProgress(new Date(2026, 9, 11, 0, 0, 0))).toBe(0);
  });

  it('正午约为 50%', () => {
    const p = dayProgress(new Date(2026, 9, 11, 12, 0, 0));
    expect(p).toBeGreaterThan(49.99);
    expect(p).toBeLessThan(50.01);
  });

  it('全天内单调递增且不超过 100', () => {
    let prev = -1;
    for (let h = 0; h <= 23; h++) {
      const p = dayProgress(new Date(2026, 9, 11, h, 30, 0));
      expect(p).toBeGreaterThanOrEqual(prev);
      expect(p).toBeLessThanOrEqual(100);
      prev = p;
    }
  });
});

describe('monthProgress', () => {
  it('月初为 0，月末接近 100', () => {
    expect(monthProgress(new Date(2026, 9, 1, 0, 0, 0))).toBe(0);
    const end = monthProgress(new Date(2026, 9, 31, 23, 59, 59));
    expect(end).toBeGreaterThan(99.9);
  });

  it('2 月分母随年份变化（闰年更慢）', () => {
    // 2024-02-15 正午：闰年已过 14.5/29 天
    const leap = monthProgress(new Date(2024, 1, 15, 12, 0, 0));
    // 2025-02-15 正午：平年已过 14.5/28 天
    const normal = monthProgress(new Date(2025, 1, 15, 12, 0, 0));
    expect(leap).toBeLessThan(normal);
  });
});

describe('yearProgress', () => {
  it('元旦为 0，跨年前接近 100', () => {
    expect(yearProgress(new Date(2026, 0, 1, 0, 0, 0))).toBe(0);
    expect(yearProgress(new Date(2026, 11, 31, 23, 59, 59))).toBeGreaterThan(99.9);
  });

  it('6 月底约为全年一半', () => {
    // 2026 平年 365 天，7 月 2 日零点 = 182/365
    const p = yearProgress(new Date(2026, 6, 2, 0, 0, 0));
    expect(p).toBeGreaterThan(49.5);
    expect(p).toBeLessThan(50.1);
  });
});

describe('格式化辅助', () => {
  it('formatCnDate / pad2', () => {
    expect(formatCnDate(new Date(2026, 9, 11))).toBe('2026年10月11日');
    expect(pad2(3)).toBe('03');
    expect(pad2(23)).toBe('23');
  });
});
