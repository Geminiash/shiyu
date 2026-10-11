<script setup lang="ts">
import { computed, ref, type PropType } from 'vue';
import { useCountdowns } from '../composables/useCountdowns';
import { daysUntil, parseISODate, type CountdownItem } from '../utils/storage';
import { formatCnDate, weekdayName } from '../utils/time-progress';

const props = defineProps({
  now: { type: Date as PropType<Date>, required: true },
});

const store = useCountdowns();

const name = ref('');
const date = ref('');
const error = ref('');

/** 依赖 props.now 的实时排序视图（跨天自动重排） */
const view = computed(() => {
  const entries = store.items.value
    .map((item) => ({ item, diff: daysUntil(item.target, props.now) }))
    .filter((entry): entry is { item: CountdownItem; diff: number } => entry.diff !== null);
  const future = entries.filter((entry) => entry.diff >= 0).sort((a, b) => a.diff - b.diff);
  const past = entries.filter((entry) => entry.diff < 0).sort((a, b) => b.diff - a.diff);
  return [...future, ...past];
});

function submit(): void {
  error.value = '';
  const created = store.add(name.value, date.value);
  if (!created) {
    error.value = '没有添加成功：请填写名称，并选择有效的日期。';
    return;
  }
  name.value = '';
  date.value = '';
}

function removeItem(id: string): void {
  store.remove(id);
}

function dateLine(item: CountdownItem): string {
  const d = parseISODate(item.target);
  if (!d) return item.target;
  return `${formatCnDate(d)} · 星期${weekdayName(d)}`;
}
</script>

<template>
  <section class="card countdowns" aria-label="倒计时与纪念日">
    <header class="card-head">
      <h2>倒计时与纪念日</h2>
    </header>

    <form class="add-form" @submit.prevent="submit">
      <input
        v-model="name"
        class="field name-field"
        type="text"
        maxlength="24"
        placeholder="名称，比如：生日、出发"
        aria-label="倒计时名称"
      />
      <input v-model="date" class="field date-field" type="date" aria-label="目标日期" />
      <button class="btn-primary add-btn" type="submit">添加</button>
    </form>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <ul v-if="view.length" class="list">
      <li v-for="entry in view" :key="entry.item.id" class="count-card">
        <div class="info">
          <p class="name">{{ entry.item.name }}</p>
          <p class="date num">{{ dateLine(entry.item) }}</p>
        </div>
        <div class="days num serif" :class="{ today: entry.diff === 0, past: entry.diff < 0 }">
          <template v-if="entry.diff === 0">就是今天</template>
          <template v-else>
            <strong>{{ Math.abs(entry.diff) }}</strong>
            <span class="unit">{{ entry.diff > 0 ? '天后' : '天前' }}</span>
          </template>
        </div>
        <button
          class="icon-btn remove"
          type="button"
          :aria-label="`删除 ${entry.item.name}`"
          @click="removeItem(entry.item.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </li>
    </ul>

    <div v-else class="empty">
      <p class="empty-title">还没有在数的日子。</p>
      <p class="empty-sub">加一个日期，让等待有处安放。</p>
    </div>
  </section>
</template>

<style scoped>
.add-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 0.7fr) auto;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
}

.error {
  margin: 0 var(--space-3);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #ee8055;
  background: color-mix(in srgb, #ee8055 10%, transparent);
  border: 1px solid color-mix(in srgb, #ee8055 30%, transparent);
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.count-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 52px var(--space-2) var(--space-2);
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: var(--bg-elevated);
  transition: border-color 0.2s, transform 0.2s;
}

.count-card:hover {
  border-color: color-mix(in srgb, var(--jieqi-accent) 40%, transparent);
  transform: translateY(-1px);
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date {
  font-size: 0.78rem;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}

.days {
  text-align: right;
  line-height: 1.2;
  color: var(--text-strong);
  flex-shrink: 0;
}

.days strong {
  font-size: 1.7rem;
  font-weight: 700;
}

.days .unit {
  font-size: 0.78rem;
  color: var(--text-faint);
  margin-left: 4px;
  font-family: var(--font-sans);
}

.days.today {
  color: var(--jieqi-accent);
  font-size: 1.05rem;
  font-weight: 700;
}

.days.past strong {
  color: var(--text-faint);
}

.remove {
  position: absolute;
  top: 50%;
  right: var(--space-1);
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  opacity: 0.45;
  border: none;
  background: transparent;
}

.count-card:hover .remove {
  opacity: 1;
}

.remove:hover {
  color: #ee8055;
}

.empty {
  padding: var(--space-4) var(--space-3) calc(var(--space-4) - 8px);
  text-align: center;
  border: 1px dashed var(--glass-border);
  border-radius: 10px;
  margin: 0 var(--space-3) var(--space-3);
}

.empty-title {
  color: var(--text-body);
  font-size: 0.92rem;
}

.empty-sub {
  color: var(--text-faint);
  font-size: 0.84rem;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .add-form {
    grid-template-columns: 1fr;
  }

  .add-btn {
    width: 100%;
  }

  .remove {
    opacity: 1;
  }
}
</style>
