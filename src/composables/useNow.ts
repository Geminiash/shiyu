import { onScopeDispose, ref, type Ref } from 'vue';

/**
 * 共享的「现在」时钟：以固定间隔刷新一个 Date ref。
 * 200ms 一次：圆环走动足够顺滑（配合 CSS 过渡），开销可忽略。
 */
export function useNow(intervalMs = 200): Ref<Date> {
  const now = ref<Date>(new Date());
  const timer = setInterval(() => {
    now.value = new Date();
  }, intervalMs);
  onScopeDispose(() => clearInterval(timer));
  return now;
}
