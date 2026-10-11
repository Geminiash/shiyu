<script setup lang="ts">
import { computed } from 'vue';
import {
  BREAK_MINUTES,
  FOCUS_MINUTES,
  usePomodoro,
  type PomodoroMode,
} from '../composables/usePomodoro';

const {
  mode,
  status,
  progress,
  display,
  start,
  pause,
  reset,
  switchMode,
} = usePomodoro();

const R = 86;
const CIRC = 2 * Math.PI * R;

const offset = computed(() => CIRC * (1 - Math.min(1, Math.max(0, progress.value))));

const statusLabel = computed(() => {
  switch (status.value) {
    case 'running':
      return mode.value === 'focus' ? '专注中' : '休息中';
    case 'paused':
      return '暂停中';
    case 'finished':
      return '时间到了';
    default:
      return '准备开始';
  }
});

const hint = computed(() => {
  if (status.value === 'finished') {
    return mode.value === 'focus' ? '专注完成。起来走一走。' : '休息结束。回到要做的事。';
  }
  if (status.value === 'running') return null;
  return `${FOCUS_MINUTES} 分钟专注，${BREAK_MINUTES} 分钟休息。`;
});

const barColor = computed(() => (mode.value === 'focus' ? 'var(--jieqi-accent)' : '#63C0A8'));

function onModeClick(next: PomodoroMode): void {
  if (status.value === 'running' || mode.value === next) return;
  switchMode(next);
}
</script>

<template>
  <section class="card pomodoro" aria-label="番茄钟">
    <header class="card-head">
      <h2>番茄钟</h2>
      <div class="mode-switch" role="group" aria-label="模式选择">
        <button
          type="button"
          :class="{ active: mode === 'focus' }"
          :disabled="status === 'running'"
          @click="onModeClick('focus')"
        >
          专注 {{ FOCUS_MINUTES }}
        </button>
        <button
          type="button"
          :class="{ active: mode === 'break' }"
          :disabled="status === 'running'"
          @click="onModeClick('break')"
        >
          休息 {{ BREAK_MINUTES }}
        </button>
      </div>
    </header>

    <div class="dial-wrap">
      <svg class="dial" viewBox="0 0 200 200" role="img" :aria-label="`${statusLabel}，剩余 ${display}`">
        <circle class="track" cx="100" cy="100" :r="R" fill="none" stroke-width="9" />
        <circle
          class="bar"
          cx="100"
          cy="100"
          :r="R"
          fill="none"
          stroke-width="9"
          stroke-linecap="round"
          :stroke="barColor"
          :stroke-dasharray="CIRC"
          :stroke-dashoffset="offset"
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div class="dial-text">
        <span class="time num serif" :class="{ done: status === 'finished' }">{{ display }}</span>
        <span class="status">{{ statusLabel }}</span>
      </div>
    </div>

    <div class="controls">
      <button v-if="status === 'running'" class="btn-primary" type="button" @click="pause">暂停</button>
      <button v-else class="btn-primary" type="button" @click="start">
        {{ status === 'paused' ? '继续' : '开始' }}
      </button>
      <button class="btn-ghost" type="button" @click="reset">重置</button>
    </div>

    <p class="hint">{{ hint ?? '' }}</p>
  </section>
</template>

<style scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-3) 0;
}

.mode-switch {
  display: inline-flex;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  overflow: hidden;
}

.mode-switch button {
  min-height: 36px;
  padding: 0 14px;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  transition: color 0.2s, background-color 0.2s;
}

.mode-switch button.active {
  color: var(--text-strong);
  background: color-mix(in srgb, var(--jieqi-accent) 16%, transparent);
}

.mode-switch button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.dial-wrap {
  position: relative;
  width: min(220px, 60vw);
  margin: var(--space-2) auto;
}

.dial {
  display: block;
  width: 100%;
  height: auto;
}

.track {
  stroke: var(--ring-track);
}

.bar {
  transition: stroke-dashoffset 0.25s linear, stroke 0.3s;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--jieqi-accent) 30%, transparent));
}

.dial-text {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  text-align: center;
}

.time {
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.time.done {
  color: var(--jieqi-accent);
}

.status {
  font-size: 0.78rem;
  letter-spacing: 0.28em;
  color: var(--text-faint);
}

.controls {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.hint {
  min-height: 1.7em;
  margin-top: var(--space-2);
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-faint);
  letter-spacing: 0.06em;
  padding: 0 var(--space-3) var(--space-3);
}
</style>
