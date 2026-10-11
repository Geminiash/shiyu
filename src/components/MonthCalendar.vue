<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';
import { getLunarDate } from '../utils/lunar';
import { getLunarFestival } from '../utils/festivals';
import { getTermDate, type SolarTermInfo } from '../utils/solar-terms';

const props = defineProps({
  now: { type: Date as PropType<Date>, required: true },
});

const viewYear = ref(props.now.getFullYear());
const viewMonth = ref(props.now.getMonth()); // 0-11

watch(
  () => props.now.getFullYear() * 12 + props.now.getMonth(),
  (stamp, prevStamp) => {
    // 自然月翻页时，若用户仍停在原先的「本月」视图，则跟随今天；
    // 用户已手动翻到其他月份时不打扰。
    if (viewYear.value * 12 + viewMonth.value === prevStamp) {
      viewYear.value = Math.floor(stamp / 12);
      viewMonth.value = ((stamp % 12) + 12) % 12;
    }
  },
);

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

interface Cell {
  year: number;
  month: number; // 0-11
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  term: SolarTermInfo | null;
  festival: string | null;
  subText: string | null;
  subClass: string;
}

/** 节气索引：`${y}-${m}-${d}` → 节气（相邻年各备一份，处理月初月末跨界） */
const termMap = computed(() => {
  const map = new Map<string, SolarTermInfo>();
  for (const year of [viewYear.value - 1, viewYear.value, viewYear.value + 1]) {
    for (let i = 0; i < 24; i++) {
      const t = getTermDate(year, i);
      if (t) map.set(`${t.year}-${t.month - 1}-${t.day}`, t);
    }
  }
  return map;
});

const lunarCache = new Map<string, ReturnType<typeof getLunarDate>>();

function lunarOf(year: number, month: number, day: number) {
  const key = `${year}-${month}-${day}`;
  let value = lunarCache.get(key);
  if (value === undefined) {
    value = getLunarDate(new Date(year, month, day));
    lunarCache.set(key, value);
  }
  return value;
}

const cells = computed<Cell[]>(() => {
  const y = viewYear.value;
  const m = viewMonth.value;
  const first = new Date(y, m, 1);
  const startOffset = first.getDay(); // 周日为 0
  const today = props.now;
  const list: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(y, m, 1 - startOffset + i);
    const cy = date.getFullYear();
    const cm = date.getMonth();
    const cd = date.getDate();
    const inMonth = cy === y && cm === m;
    const term = termMap.value.get(`${cy}-${cm}-${cd}`) ?? null;
    const lunar = lunarOf(cy, cm, cd);
    const festival = lunar ? getLunarFestival(lunar) : null;

    let subText: string | null = null;
    let subClass = 'sub-lunar';
    if (term) {
      subText = term.name;
      subClass = 'sub-term';
    } else if (festival) {
      subText = festival;
      subClass = 'sub-festival';
    } else if (lunar) {
      subText = lunar.day === 1 ? lunar.monthName : lunar.dayName;
    }

    list.push({
      year: cy,
      month: cm,
      day: cd,
      inMonth,
      isToday:
        cy === today.getFullYear() && cm === today.getMonth() && cd === today.getDate(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      term,
      festival,
      subText,
      subClass,
    });
  }
  return list;
});

const title = computed(() => `${viewYear.value}年${viewMonth.value + 1}月`);

const notCurrentMonth = computed(
  () => viewYear.value !== props.now.getFullYear() || viewMonth.value !== props.now.getMonth(),
);

function shiftMonth(delta: number): void {
  const stamp = viewYear.value * 12 + viewMonth.value + delta;
  viewYear.value = Math.floor(stamp / 12);
  viewMonth.value = ((stamp % 12) + 12) % 12;
}

function backToToday(): void {
  viewYear.value = props.now.getFullYear();
  viewMonth.value = props.now.getMonth();
}
</script>

<template>
  <section class="card calendar" aria-label="月历">
    <header class="cal-head">
      <h2 class="title serif num">{{ title }}</h2>
      <div class="nav">
        <button
          v-if="notCurrentMonth"
          class="btn-ghost today-btn"
          type="button"
          @click="backToToday"
        >
          今天
        </button>
        <button class="icon-btn" type="button" aria-label="上个月" @click="shiftMonth(-1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button class="icon-btn" type="button" aria-label="下个月" @click="shiftMonth(1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </header>

    <div class="grid" role="grid" :aria-label="`${title}日历`">
      <div class="week-label" v-for="label in WEEK_LABELS" :key="label" role="columnheader">{{ label }}</div>
      <div
        v-for="cell in cells"
        :key="`${cell.year}-${cell.month}-${cell.day}`"
        class="cell"
        :class="{ dim: !cell.inMonth, today: cell.isToday }"
        role="gridcell"
        :aria-label="`${cell.year}年${cell.month + 1}月${cell.day}日${cell.term ? '，' + cell.term.name : ''}${cell.festival ? '，' + cell.festival : ''}`"
      >
        <span class="d num" :class="{ weekend: cell.isWeekend }">{{ cell.day }}</span>
        <span v-if="cell.subText" class="sub" :class="cell.subClass">{{ cell.subText }}</span>
        <i v-if="cell.term && cell.festival" class="fest-dot" aria-hidden="true"></i>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) 0;
}

.title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.04em;
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.today-btn {
  min-height: 40px;
  padding: 0 14px;
  margin-right: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
  padding: var(--space-2) var(--space-2) var(--space-3);
}

.week-label {
  text-align: center;
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  color: var(--text-faint);
  padding: 4px 0 6px;
}

.cell {
  position: relative;
  min-height: 52px;
  border-radius: 10px;
  padding: 6px 2px 5px;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 2px;
  transition: background-color 0.2s;
}

.cell:hover {
  background: color-mix(in srgb, var(--glass-border) 60%, transparent);
}

.cell.dim {
  opacity: 0.38;
}

.d {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  font-size: 0.92rem;
  color: var(--text-body);
  border-radius: 50%;
}

.d.weekend {
  color: var(--text-faint);
}

/* 今日：节气 accent 圆环（visual-guide §10 签名元素） */
.cell.today .d {
  box-shadow: 0 0 0 2px var(--jieqi-accent);
  color: var(--jieqi-accent);
  font-weight: 700;
}

.sub {
  font-size: 0.66rem;
  line-height: 1.2;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--text-faint);
}

.sub-term {
  color: var(--text-strong);
  font-weight: 600;
}

.cell:not(.dim) .sub-term {
  color: var(--term-color, var(--jieqi-accent));
}

.sub-festival {
  color: #ee8055;
}

.fest-dot {
  position: absolute;
  top: 7px;
  right: 9px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ee8055;
}

@media (max-width: 480px) {
  .cell {
    min-height: 46px;
    padding: 4px 1px 4px;
  }

  .d {
    width: 27px;
    height: 27px;
    font-size: 0.86rem;
  }

  .sub {
    font-size: 0.6rem;
  }
}
</style>
