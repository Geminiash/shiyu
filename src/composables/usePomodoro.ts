import { computed, onScopeDispose, ref } from 'vue';

export type PomodoroMode = 'focus' | 'break';
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'finished';

export const FOCUS_MINUTES = 25;
export const BREAK_MINUTES = 5;
const FOCUS_MS = FOCUS_MINUTES * 60_000;
const BREAK_MS = BREAK_MINUTES * 60_000;

/**
 * 番茄钟：25 分钟专注 / 5 分钟休息。
 * 计时用绝对时间（endsAt），标签页切走再回来也不会漂移。
 */
export function usePomodoro() {
  const mode = ref<PomodoroMode>('focus');
  const status = ref<PomodoroStatus>('idle');
  const remainingMs = ref<number>(FOCUS_MS);
  let endsAt = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const totalMs = computed(() => (mode.value === 'focus' ? FOCUS_MS : BREAK_MS));
  const progress = computed(() => 1 - remainingMs.value / totalMs.value);
  const display = computed(() => {
    const totalSec = Math.ceil(remainingMs.value / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${mm < 10 ? '0' + mm : mm}:${ss < 10 ? '0' + ss : ss}`;
  });

  const chime = createChime();

  function ensureTimer(): void {
    if (timer !== null) return;
    timer = setInterval(tick, 200);
    onScopeDispose(stopTimer);
  }

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function tick(): void {
    remainingMs.value = Math.max(0, endsAt - Date.now());
    if (remainingMs.value <= 0) {
      status.value = 'finished';
      stopTimer();
      chime.play();
    }
  }

  function start(): void {
    if (status.value === 'finished' || remainingMs.value <= 0) reset();
    endsAt = Date.now() + remainingMs.value;
    status.value = 'running';
    ensureTimer();
    chime.prime();
  }

  function pause(): void {
    if (status.value !== 'running') return;
    remainingMs.value = Math.max(0, endsAt - Date.now());
    status.value = 'paused';
    stopTimer();
  }

  function reset(): void {
    stopTimer();
    status.value = 'idle';
    remainingMs.value = totalMs.value;
  }

  function switchMode(next: PomodoroMode): void {
    mode.value = next;
    stopTimer();
    status.value = 'idle';
    remainingMs.value = next === 'focus' ? FOCUS_MS : BREAK_MS;
  }

  return { mode, status, remainingMs, totalMs, progress, display, start, pause, reset, switchMode };
}

/**
 * 结束音：Web Audio 现场合成一声柔和钟鸣（两枚正弦泛音，指数衰减），
 * 不引任何音频文件。AudioContext 必须在用户手势（开始按钮）里创建。
 */
function createChime() {
  let ctx: AudioContext | null = null;

  function prime(): void {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
  }

  function play(): void {
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const startAt = ctx.currentTime + 0.02;
    for (const [freq, delay, peak] of [
      [880.0, 0.0, 0.16], // A5 基音
      [1760.0, 0.0, 0.05], // 倍频轻泛音
      [659.26, 0.35, 0.11], // E5 追音，留一点余韵
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = startAt + delay;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 1.8);
    }
  }

  return { prime, play };
}
