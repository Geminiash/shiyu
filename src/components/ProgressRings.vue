<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { dayProgress, monthProgress, yearProgress } from '../utils/time-progress';

const props = defineProps({
  now: { type: Date as PropType<Date>, required: true },
});

const R = 52;
const CIRC = 2 * Math.PI * R;

interface Ring {
  key: string;
  label: string;
  pct: number;
  /** 显示小数位：日环走得更细一些 */
  decimals: number;
  color: string;
  gradId?: string;
}

const rings = computed<Ring[]>(() => {
  const d = props.now;
  return [
    { key: 'day', label: '今日', pct: dayProgress(d), decimals: 2, color: 'var(--jieqi-accent)' },
    {
      key: 'month',
      label: '本月',
      pct: monthProgress(d),
      decimals: 1,
      color: 'url(#ring-grad-month)',
      gradId: 'ring-grad-month',
    },
    {
      key: 'year',
      label: '今年',
      pct: yearProgress(d),
      decimals: 1,
      color: 'url(#ring-grad-year)',
      gradId: 'ring-grad-year',
    },
  ];
});

function offset(pct: number): number {
  return CIRC * (1 - Math.min(1, Math.max(0, pct / 100)));
}

function ariaText(ring: Ring): string {
  return `${ring.label}已过 ${ring.pct.toFixed(ring.decimals)}%`;
}
</script>

<template>
  <section class="card rings" aria-label="时间进度">
    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
      <defs>
        <linearGradient id="ring-grad-month" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#24c6dc" />
          <stop offset="1" stop-color="#5433ff" />
        </linearGradient>
        <linearGradient id="ring-grad-year" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5433ff" />
          <stop offset="1" stop-color="#ff0099" />
        </linearGradient>
      </defs>
    </svg>

    <header class="card-head">
      <h2>时间进度</h2>
    </header>

    <div class="ring-row">
      <figure v-for="ring in rings" :key="ring.key" class="ring-item">
        <svg class="dial" viewBox="0 0 120 120" role="img" :aria-label="ariaText(ring)">
          <circle class="track" cx="60" cy="60" :r="R" fill="none" stroke-width="7" />
          <circle
            class="bar"
            cx="60"
            cy="60"
            :r="R"
            fill="none"
            stroke-width="7"
            stroke-linecap="round"
            :stroke="ring.color"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="offset(ring.pct)"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <figcaption>
          <strong class="value num serif">{{ ring.pct.toFixed(ring.decimals) }}<i>%</i></strong>
          <span class="label">{{ ring.label }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.ring-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  padding: var(--space-3);
}

.ring-item {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.dial {
  width: min(128px, 26vw);
  height: auto;
}

.track {
  stroke: var(--ring-track);
}

.bar {
  transition: stroke-dashoffset 0.3s linear;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--jieqi-accent) 35%, transparent));
}

.ring-item:nth-child(2) .bar,
.ring-item:nth-child(3) .bar {
  filter: none;
}

.value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.2;
}

.value i {
  font-style: normal;
  font-size: 0.72em;
  color: var(--text-faint);
  margin-left: 2px;
}

.label {
  display: block;
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  color: var(--text-faint);
}

@media (max-width: 400px) {
  .value {
    font-size: 1.24rem;
  }

  .label {
    letter-spacing: 0.12em;
  }
}
</style>
