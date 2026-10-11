import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { createId, daysUntil, loadJSON, parseISODate, saveJSON, type CountdownItem } from '../utils/storage';

const STORE_KEY = 'countdowns';

function isValidItem(value: unknown): value is CountdownItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<CountdownItem>;
  return typeof item.id === 'string' && typeof item.name === 'string' && typeof item.target === 'string';
}

export interface CountdownsStore {
  items: Ref<CountdownItem[]>;
  sorted: ComputedRef<CountdownItem[]>;
  add: (name: string, target: string) => CountdownItem | null;
  remove: (id: string) => void;
}

/**
 * 倒计时/纪念日仓库（工厂，便于测试隔离）。
 * localStorage 持久化；排序：未来按日期升序在前，已过去按日期降序紧随其后。
 */
export function createCountdowns(now: () => Date = () => new Date()): CountdownsStore {
  const loaded = loadJSON<CountdownItem[]>(STORE_KEY, []);
  const items = ref<CountdownItem[]>(Array.isArray(loaded) ? loaded.filter(isValidItem) : []);

  function persist(): void {
    saveJSON(STORE_KEY, items.value);
  }

  function add(name: string, target: string): CountdownItem | null {
    const trimmed = name.trim();
    if (!trimmed || !parseISODate(target)) return null;
    const item: CountdownItem = { id: createId(), name: trimmed, target, createdAt: Date.now() };
    items.value = [...items.value, item];
    persist();
    return item;
  }

  function remove(id: string): void {
    items.value = items.value.filter((item) => item.id !== id);
    persist();
  }

  const sorted = computed(() => {
    const current = now();
    const withDays = items.value.map((item) => ({ item, diff: daysUntil(item.target, current) ?? Number.NaN }));
    const valid = withDays.filter((entry) => Number.isFinite(entry.diff));
    const future = valid.filter((entry) => entry.diff >= 0).sort((a, b) => a.diff - b.diff);
    const past = valid.filter((entry) => entry.diff < 0).sort((a, b) => b.diff - a.diff);
    return [...future, ...past].map((entry) => entry.item);
  });

  return { items, sorted, add, remove };
}

let singleton: CountdownsStore | null = null;

/** 应用内共享实例（localStorage 语义：全站一份） */
export function useCountdowns(): CountdownsStore {
  singleton ??= createCountdowns();
  return singleton;
}
