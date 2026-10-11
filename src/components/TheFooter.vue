<script setup lang="ts"></script>

<template>
  <footer class="site-footer">
    <div class="divider" aria-hidden="true"><span class="serif">时雨</span></div>
    <p class="quote">慢慢走，欣赏啊。<span class="attr">—— 朱光潜《谈美》</span></p>
    <p class="meta num">时雨 · Shiyu © 2026 · MIT License</p>
  </footer>
</template>

<style scoped>
.site-footer {
  width: min(1080px, 100% - clamp(24px, 6vw, 64px));
  margin: 0 auto;
  padding: var(--space-2) 0 var(--space-4);
  text-align: center;
}

/* 分隔线：居中字 + 两侧渐隐（shoka 手法，visual-guide §9） */
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-faint);
  letter-spacing: 0.3em;
  font-size: 0.78rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
}

.divider::before {
  background: linear-gradient(to left, var(--glass-border), transparent);
}

.divider::after {
  background: linear-gradient(to right, var(--glass-border), transparent);
}

.quote {
  margin-top: var(--space-3);
  font-size: 0.88rem;
  color: var(--text-body);
  letter-spacing: 0.1em;
}

.attr {
  color: var(--text-faint);
  font-size: 0.78rem;
  margin-left: 8px;
}

.meta {
  margin-top: var(--space-1);
  font-size: 0.74rem;
  color: var(--text-faint);
  letter-spacing: 0.14em;
}
</style>
