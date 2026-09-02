import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { adminApiPlugin } from './plugins/adminApi'

// 公開ビルドにはトップと検索ページのみを含める。
// admin/ は開発サーバー（npm run admin）専用で、ビルド対象外。
// 公開先は https://hamaguri.dev/nazogura/ のため、build と preview では
// baseを /nazogura/ にする（開発サーバーは従来どおり http://localhost:5173/ 直下）。
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/nazogura/' : '/',
  // マルチページ構成のため、SPA用のindex.htmlフォールバックを無効化する
  appType: 'mpa',
  plugins: [react(), adminApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        top: resolve(import.meta.dirname, 'index.html'),
        themeReverseSearch: resolve(
          import.meta.dirname,
          'tools/theme-reverse-search/index.html',
        ),
        themeWordList: resolve(
          import.meta.dirname,
          'tools/theme-word-list/index.html',
        ),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
