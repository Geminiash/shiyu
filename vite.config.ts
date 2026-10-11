/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相对路径：任何静态目录 / 子路径都能直接部署
  base: './',
  plugins: [vue()],
  build: {
    target: 'es2020',
    // 体积纪律：主 bundle gzip 后 <=200KB（README 记录实测值）
    reportCompressedSize: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
});
