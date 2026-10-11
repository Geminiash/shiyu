/**
 * 时间进度：今日 / 本月 / 今年 已流逝的百分比。
 * 全部按本地时区计算，分母为所在周期真实毫秒数（含大小月、闰年）。
 */

function pct(elapsed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/** 今日进度 %（从本地午夜 0 点起算） */
export function dayProgress(now: Date): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 86_400_000;
  return pct(now.getTime() - start, end - start);
}

/** 本月进度 %（从 1 日零点起算） */
export function monthProgress(now: Date): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  return pct(now.getTime() - start, end - start);
}

/** 今年进度 %（从 1 月 1 日零点起算） */
export function yearProgress(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return pct(now.getTime() - start, end - start);
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/** yyyy 年 m 月 d 日 */
export function formatCnDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** m 月 d 日 */
export function formatCnShortDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 补零两位 */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
