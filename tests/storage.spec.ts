/**
 * localStorage 存储逻辑测试（happy-dom 环境）。
 * 覆盖：读写往返、前缀隔离、损坏数据回退、写入失败静默、
 * 日期解析与天数差、倒计时仓库的增删与持久化。
 */
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCountdowns } from '../src/composables/useCountdowns';
import {
  createId,
  daysUntil,
  loadJSON,
  parseISODate,
  removeKey,
  saveJSON,
} from '../src/utils/storage';

beforeEach(() => {
  localStorage.clear();
  removeKey('countdowns');
});

describe('loadJSON / saveJSON', () => {
  it('未写入时返回默认值', () => {
    expect(loadJSON('missing', { a: 1 })).toEqual({ a: 1 });
  });

  it('写入后按统一前缀往返', () => {
    saveJSON('round', { list: [1, 2, 3] });
    expect(localStorage.getItem('shiyu:round')).toBe('{"list":[1,2,3]}');
    expect(loadJSON('round', null)).toEqual({ list: [1, 2, 3] });
  });

  it('损坏的 JSON 静默回退默认值', () => {
    localStorage.setItem('shiyu:broken', '{not json');
    expect(loadJSON('broken', 'fallback')).toBe('fallback');
  });

  it('setItem 抛错时不向外传播', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveJSON('x', 1)).not.toThrow();
    spy.mockRestore();
  });

  it('getItem 抛错时同样回退', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadJSON('x', 7)).toBe(7);
    spy.mockRestore();
  });
});

describe('parseISODate', () => {
  it('合法日期返回本地午夜', () => {
    const d = parseISODate('2027-06-07');
    expect(d).toEqual(new Date(2027, 5, 7));
  });

  it('格式非法返回 null', () => {
    expect(parseISODate('2027/06/07')).toBeNull();
    expect(parseISODate('20270607')).toBeNull();
    expect(parseISODate('')).toBeNull();
  });

  it('不存在的日期返回 null（防静默进位）', () => {
    expect(parseISODate('2026-02-31')).toBeNull();
    expect(parseISODate('2026-13-01')).toBeNull();
    expect(parseISODate('2026-00-10')).toBeNull();
  });
});

describe('daysUntil', () => {
  const now = new Date(2026, 9, 11); // 2026-10-11

  it('未来日期为正整数天', () => {
    expect(daysUntil('2026-10-23', now)).toBe(12);
    expect(daysUntil('2027-01-01', now)).toBe(82);
  });

  it('今天为 0', () => {
    expect(daysUntil('2026-10-11', now)).toBe(0);
  });

  it('过去日期为负', () => {
    expect(daysUntil('2026-10-08', now)).toBe(-3);
  });

  it('非法日期返回 null', () => {
    expect(daysUntil('oops', now)).toBeNull();
  });
});

describe('createId', () => {
  it('生成不重复的字符串 id', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createId()));
    expect(ids.size).toBe(200);
  });
});

describe('倒计时仓库（createCountdowns）', () => {
  it('添加并持久化到 localStorage', () => {
    const store = createCountdowns(() => new Date(2026, 9, 11));
    const item = store.add('出发的日子', '2027-06-07');
    expect(item).not.toBeNull();
    expect(store.items.value).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('shiyu:countdowns')!)).toEqual([item]);
  });

  it('空名称或非法日期被拒绝', () => {
    const store = createCountdowns();
    expect(store.add('   ', '2027-01-01')).toBeNull();
    expect(store.add('生日', '2027-13-40')).toBeNull();
    expect(store.items.value).toHaveLength(0);
  });

  it('删除并同步持久化', () => {
    const store = createCountdowns();
    const a = store.add('甲', '2027-01-01')!;
    const b = store.add('乙', '2027-02-01')!;
    store.remove(a.id);
    expect(store.items.value.map((item) => item.id)).toEqual([b.id]);
    expect(JSON.parse(localStorage.getItem('shiyu:countdowns')!)).toHaveLength(1);
  });

  it('排序：未来升序在前，过去降序在后', () => {
    const store = createCountdowns(() => new Date(2026, 9, 11));
    store.add('远期', '2027-05-01');
    store.add('近期', '2026-10-23');
    store.add('就是今天', '2026-10-11');
    store.add('已过去较久', '2026-01-01');
    store.add('刚过去', '2026-10-09');
    expect(store.sorted.value.map((item) => item.name)).toEqual([
      '就是今天',
      '近期',
      '远期',
      '刚过去',
      '已过去较久',
    ]);
  });

  it('新建实例会读回已持久化的数据', () => {
    const first = createCountdowns();
    first.add('生日', '2027-03-08');
    const second = createCountdowns();
    expect(second.items.value).toHaveLength(1);
    expect(second.items.value[0].name).toBe('生日');
  });
});
