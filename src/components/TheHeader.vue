<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';

const { theme, toggle } = useTheme();

const nextLabel = computed(() => (theme.value === 'dark' ? '浅色纸感' : '暗色极光'));
</script>

<template>
  <header class="site-header">
    <div class="brand">
      <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="mark-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#24c6dc" />
            <stop offset="0.41" stop-color="#5433ff" />
            <stop offset="0.76" stop-color="#ff0099" />
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="12.5"
          fill="none"
          stroke="url(#mark-grad)"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-dasharray="62 17"
          transform="rotate(-90 16 16)"
        />
        <path
          d="M16 8.5c2.9 3.5 4.6 6.1 4.6 8.3a4.6 4.6 0 1 1-9.2 0c0-2.2 1.7-4.8 4.6-8.3Z"
          fill="url(#mark-grad)"
        />
      </svg>
      <span class="name serif gradient-text">时雨</span>
      <span class="sub">SHIYU</span>
    </div>

    <p class="tagline">把时间过成风景。</p>

    <button
      class="icon-btn theme-toggle"
      type="button"
      :aria-label="`切换到${nextLabel}`"
      :title="`切换到${nextLabel}`"
      @click="toggle"
    >
      <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  </header>
</template>

<style scoped>
.site-header {
  width: min(1080px, 100% - clamp(24px, 6vw, 64px));
  margin: 0 auto;
  padding: var(--space-4) 0 var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.mark {
  width: 30px;
  height: 30px;
  align-self: center;
}

.name {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
}

.sub {
  font-size: 0.68rem;
  letter-spacing: 0.32em;
  color: var(--text-faint);
  transform: translateY(-1px);
}

.tagline {
  flex: 1;
  font-size: 0.88rem;
  color: var(--text-faint);
  letter-spacing: 0.08em;
}

.theme-toggle {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .site-header {
    flex-wrap: wrap;
  }

  .tagline {
    order: 3;
    flex-basis: 100%;
    padding-left: 42px;
  }
}
</style>
