/**
 * localStorage 薄封装：统一前缀、JSON 序列化、损坏数据静默回退。
 * 隐私模式等 setItem 抛错的场景下写入被忽略，读取回退默认值。
 */

const PREFIX = 'shiyu:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 写入失败（存储被禁用/已满）：静默降级，界面仍可用
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // 同上
  }
}

/** 倒计时条目。target 为 `yyyy-mm-dd`（公历，本地时区语义）。 */
export interface CountdownItem {
  id: string;
  name: string;
  target: string;
  createdAt: number;
}

/** 解析 `yyyy-mm-dd` 为本地午夜 Date；格式非法返回 null */
export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return null;
  // 防止 2026-02-31 之类被 Date 静默进位
  if (date.getMonth() !== Number(m[2]) - 1 || date.getDate() !== Number(m[3])) return null;
  return date;
}

/**
 * 目标日期与今天相差的整天数：未来为正，过去为负，今天为 0。
 * Math.round 吸收 DST 带来的 ±1 小时偏移。
 */
export function daysUntil(target: string, now: Date): number | null {
  const t = parseISODate(target);
  if (!t) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t.getTime() - today.getTime()) / 86_400_000);
}

export function createId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
