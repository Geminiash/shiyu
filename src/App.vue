<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from './composables/useNow';
import { useTheme } from './composables/useTheme';
import { getTermSpan } from './utils/solar-terms';
import TheHeader from './components/TheHeader.vue';
import HeroClock from './components/HeroClock.vue';
import ProgressRings from './components/ProgressRings.vue';
import MonthCalendar from './components/MonthCalendar.vue';
import SolarTermCard from './components/SolarTermCard.vue';
import PomodoroCard from './components/PomodoroCard.vue';
import CountdownSection from './components/CountdownSection.vue';
import TheFooter from './components/TheFooter.vue';

const now = useNow();
// 应用主题（暗色极光默认 / 浅色纸感），选择持久化见 useTheme
useTheme();

/** 全站强调色跟随今日节气（visual-guide §10：节气 accent 圆环） */
const accentStyle = computed(() => {
  const span = getTermSpan(now.value);
  return span ? { '--jieqi-accent': span.current.color } : undefined;
});
</script>

<template>
  <div class="page" :style="accentStyle">
    <div class="page-bg" aria-hidden="true"></div>
    <div class="aurora" aria-hidden="true"></div>

    <TheHeader />

    <main class="layout">
      <HeroClock :now="now" />
      <ProgressRings :now="now" />
      <section class="row-main">
        <MonthCalendar :now="now" />
        <div class="side">
          <SolarTermCard :now="now" />
          <PomodoroCard />
        </div>
      </section>
      <CountdownSection :now="now" />
    </main>

    <TheFooter />
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.layout {
  width: min(1080px, 100% - clamp(24px, 6vw, 64px));
  margin: 0 auto;
  display: grid;
  gap: var(--space-4);
  padding-bottom: 56px;
}

.row-main {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 4fr);
  gap: var(--space-3);
  align-items: start;
}

.side {
  display: grid;
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .row-main {
    grid-template-columns: 1fr;
  }
}
</style>
