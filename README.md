# 謎蔵（Nazogura）

謎解き制作を支援するツールを集めたWebサイト。

## ツール

- **テーマ逆引き検索** — 答えにしたい単語から、その単語を1文字ずつ拾って作れる「テーマ」（指の名前、曜日など）を辞書から逆引きする
  - [要件定義](docs/requirements/theme-reverse-search.md) / [画面設計](docs/design/theme-reverse-search-screens.md) / [実装計画](docs/plan/theme-reverse-search-implementation.md)

## 構成

ローカル管理画面 + 静的ホスティング完結。辞書マスターは `public/data/dictionary.json` でgit管理し、検索はブラウザ内で完結する。

## 開発

```bash
npm install
npm run dev     # 公開ページの開発サーバー
npm run admin   # 管理画面（ローカル専用）を開く
npm run test    # ユニットテスト
npm run build   # 公開サイトの静的ビルド（dist/ に管理画面は含まれない）
```

辞書の更新は `npm run admin` の管理画面で編集 → commit & push で公開に反映する。
