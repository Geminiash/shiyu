<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { getLunarDate } from '../utils/lunar';
import { getLunarFestival, getSolarFestival, isLunarNewYearsEve } from '../utils/festivals';
import { getTermAt } from '../utils/solar-terms';
import { formatCnDate, pad2, weekdayName } from '../utils/time-progress';

const props = defineProps({
  now: { type: Date as PropType<Date>, required: true },
});

const hhmm = computed(() => {
  const d = props.now;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
});

const ss = computed(() => pad2(props.now.getSeconds()));

const dateLine = computed(() => `${formatCnDate(props.now)} · 星期${weekdayName(props.now)}`);

const lunar = computed(() => getLunarDate(props.now));

const lunarText = computed(() => {
  if (!lunar.value) return null;
  return `${lunar.value.ganzhi}年（${lunar.value.zodiac}）${lunar.value.monthName}${lunar.value.dayName}`;
});

const termToday = computed(() => getTermAt(props.now));

const festivals = computed<string[]>(() => {
  const list: string[] = [];
  if (lunar.value) {
    const f = getLunarFestival(lunar.value);
    if (f) list.push(f);
    if (isLunarNewYearsEve(props.now)) list.push('除夕');
  }
  const solar = getSolarFestival(props.now.getMonth() + 1, props.now.getDate());
  if (solar) list.push(solar);
  return list;
});
</script>

<template>
  <section class="hero enter" aria-label="当前时间">
    <p class="clock num serif" role="timer" aria-label="当前时刻">
      <span class="hhmm">{{ hhmm }}</span><span class="ss">:{{ ss }}</span>
    </p>
    <p class="date-line num">{{ dateLine }}</p>
    <div class="badges">
      <span v-if="lunarText" class="badge badge-lunar">{{ lunarText }}</span>
      <span v-if="termToday" class="badge badge-term">
        <i class="dot" :style="{ background: termToday.color }"></i>今日{{ termToday.name }}
      </span>
      <span v-for="festival in festivals" :key="festival" class="badge badge-fest">{{ festival }}</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: clamp(24px, 6vh, 56px) 0 var(--space-2);
}

.clock {
  font-weight: 700;
  font-size: clamp(4rem, 15vw, 7.5rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text-strong);
}

.hhmm {
  background: var(--main-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ss {
  font-size: 0.32em;
  color: var(--text-faint);
  font-weight: 500;
  vertical-align: 0.9em;
  letter-spacing: 0.02em;
}

.date-line {
  margin-top: var(--space-2);
  font-size: 0.98rem;
  color: var(--text-body);
  letter-spacing: 0.1em;
}

.badges {
  margin-top: var(--space-2);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-1);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  backdrop-filter: blur(10px) saturate(140%);
  color: var(--text-body);
}

.badge-lunar {
  color: var(--text-strong);
}

.badge-term {
  color: var(--text-strong);
  border-color: color-mix(in srgb, var(--jieqi-accent) 45%, transparent);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.badge-fest {
  color: var(--text-strong);
  border-color: color-mix(in srgb, #ee8055 40%, transparent);
}
</style>
