import { ref, watchEffect } from 'vue';
import { loadJSON, saveJSON } from '../utils/storage';

export type ThemeName = 'dark' | 'light';

const THEME_KEY = 'theme';

// 模块级单例：App 与 TheHeader 必须共享同一份主题状态
const theme = ref<ThemeName>(loadJSON<ThemeName>(THEME_KEY, 'dark'));
let bound = false;

/** 双主题：暗色极光（默认）/ 浅色纸感。选择持久化到 localStorage。 */
export function useTheme() {
  if (!bound) {
    bound = true;
    watchEffect(() => {
      const name = theme.value;
      document.documentElement.dataset.theme = name;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', name === 'dark' ? '#08090A' : '#F5F1E8');
      saveJSON(THEME_KEY, name);
    });
  }

  function toggle(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  return { theme, toggle };
}
