<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { getTermAt, getTermSpan } from '../utils/solar-terms';
import { weekdayName } from '../utils/time-progress';

const props = defineProps({
  now: { type: Date as PropType<Date>, required: true },
});

const span = computed(() => getTermSpan(props.now));
const termToday = computed(() => getTermAt(props.now));

const nextDateLine = computed(() => {
  const next = span.value?.next;
  if (!next) return '';
  return `${next.month}月${next.day}日 星期${weekdayName(new Date(next.year, next.month - 1, next.day))}`;
});

/** 当前节气段首日，如 10月8日 */
const currentStartLine = computed(() => {
  const current = span.value?.current;
  if (!current) return '';
  return `${current.month}月${current.day}日起`;
});
</script>

<template>
  <section
    v-if="span"
    class="term-glow"
    :style="{ '--term-color': span.current.color }"
    aria-label="节气"
  >
    <div class="card body">
      <header class="card-head">
        <h2>节气</h2>
      </header>

      <div class="current">
        <span class="halo breathe" :style="{ background: span.current.color }" aria-hidden="true"></span>
        <div class="current-text">
          <p class="name serif">{{ span.current.name }}</p>
          <p class="range num">{{ currentStartLine }} · 进行中</p>
        </div>
        <span v-if="termToday" class="today-chip">今日</span>
      </div>

      <div class="divider" aria-hidden="true"></div>

      <div class="next">
        <p class="next-label">下一节气 · {{ span.next.name }}</p>
        <p class="count num serif">{{ span.daysToNext }}<i> 天</i></p>
        <p class="next-date num">{{ nextDateLine }}</p>
      </div>
    </div>
  </section>

  <section v-else class="card body" aria-label="节气">
    <header class="card-head">
      <h2>节气</h2>
    </header>
    <p class="unavailable">当前年份不在可计算范围（2001—2100），节气暂不可用。</p>
  </section>
</template>

<style scoped>
/* 光晕卡（aurora .highlighted 手法，色源换成节气主色，见 visual-guide §5） */
.term-glow {
  position: relative;
  isolation: isolate;
}

.term-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-card);
  background: radial-gradient(
    ellipse 80% 70% at 50% 70%,
    color-mix(in srgb, var(--term-color) 42%, transparent),
    transparent 75%
  );
  transform: translate3d(0, 26px, 0) scale(0.88);
  filter: blur(22px);
  opacity: 0.6;
  transition: opacity 0.3s;
  z-index: -1;
}

.term-glow:hover::before {
  opacity: 0.95;
}

.body {
  overflow: hidden;
}

.current {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.halo {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 14px var(--term-color);
}

.current-text {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--term-color);
  letter-spacing: 0.14em;
}

.range {
  font-size: 0.8rem;
  color: var(--text-faint);
  letter-spacing: 0.08em;
}

.today-chip {
  align-self: flex-start;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: var(--term-color);
  border: 1px solid color-mix(in srgb, var(--term-color) 45%, transparent);
  border-radius: 999px;
  padding: 2px 10px;
}

/* 分隔线：两侧渐隐（shoka 手法） */
.divider {
  height: 1px;
  margin: 0 var(--space-3);
  background: linear-gradient(to right, transparent, var(--glass-border), transparent);
}

.next {
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.next-label {
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: var(--text-faint);
}

.count {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-strong);
}

.count i {
  font-style: normal;
  font-size: 0.85rem;
  color: var(--text-faint);
  margin-left: 4px;
  letter-spacing: 0.2em;
}

.next-date {
  font-size: 0.84rem;
  color: var(--text-body);
  letter-spacing: 0.08em;
}

.unavailable {
  padding: var(--space-2) var(--space-3) var(--space-3);
  font-size: 0.86rem;
  color: var(--text-faint);
}
</style>
