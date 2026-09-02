import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { adminApiPlugin } from './plugins/adminApi'

// 公開ビルドにはトップと検索ページのみを含める。
// admin/ は開発サーバー（npm run admin）専用で、ビルド対象外。
export default defineConfig({
  plugins: [react(), adminApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        top: resolve(import.meta.dirname, 'index.html'),
        themeReverseSearch: resolve(
          import.meta.dirname,
          'tools/theme-reverse-search/index.html',
        ),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
