# 謎蔵（Nazogura）

謎解き制作を支援するツールを集めたWebサイト。

## ツール

- **テーマ逆引き検索** — 答えにしたい単語から、その単語を1文字ずつ拾って作れる「テーマ」（指の名前、曜日など）を辞書から逆引きする
  - [要件定義](docs/requirements/theme-reverse-search.md) / [画面設計](docs/design/theme-reverse-search-screens.md) / [実装計画](docs/plan/theme-reverse-search-implementation.md)
- **テーマ別単語リスト** — 各テーマの要素から1文字ずつ拾って作れる単語を、豚辞書・一般辞書・コア辞書から探して一覧する
  - [要件定義](docs/requirements/theme-word-list.md)
  - 単語リストの更新は `node scripts/convert-words.mjs <dicファイルのあるディレクトリ>`（元データ: プライベートリポジトリ Hamaguri-0414/wordSearch）

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

## ライセンス・出典

- コード: [MIT License](LICENSE)
- 単語リスト（`public/data/words/` の豚辞書・一般辞書・コア辞書）: 「豚辞書」第14版（buta014.dic、著作権者: ぶたさん / QWC51184）から抽出・変換したデータです。豚辞書の配布条件（出典明記のうえで抽出・引用・改変・変換は自由）に従って利用しています。
- 英単語リスト（`public/data/words/english.txt`）: 『CEFR-J Wordlist Version 1.6』東京外国語大学投野由紀夫研究室（URL: http://www.cefr-j.org/download.html より2026年9月ダウンロード）のA1・A2レベルから抽出・変換したデータです（[変換仕様](docs/requirements/english-word-dictionary.md)、更新は `node scripts/convert-cefrj.mjs`）。
