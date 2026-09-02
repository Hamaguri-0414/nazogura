# 実装計画: テーマ逆引き検索ツール

- 対応する要件: [theme-reverse-search.md](../requirements/theme-reverse-search.md)
- 画面設計: [theme-reverse-search-screens.md](../design/theme-reverse-search-screens.md)
- 作成日: 2026-09-02

## 技術スタック（決定）

- **Vite + React + TypeScript**（マルチページ構成）
- 公開サイト: `vite build` による完全静的ビルド（トップ + 検索ページ）
- 管理画面: 同一Viteプロジェクト内の `/admin/` ページ。**開発サーバー起動時のみ**利用可能で、ビルド対象から除外する
- 管理API: Viteプラグインの `configureServer` ミドルウェアとして実装（serveモード限定）。別サーバープロセスを立てず、`npm run admin` 一発で管理画面+APIが動く
- テスト: Vitest（検索ロジック・正規化・インポートパーサ）

## ディレクトリ構成

```
Nazogura/
├── index.html                        # トップ（ツール一覧）
├── tools/theme-reverse-search/
│   └── index.html                    # 検索ページ（公開）
├── admin/
│   └── index.html                    # 管理画面（ビルド対象外・ローカル専用）
├── public/data/dictionary.json       # 辞書マスター（gitで履歴管理、ビルドでそのまま配信）
├── src/
│   ├── shared/                       # 公開・管理で共用するロジック
│   │   ├── types.ts                  # Group / Element / Dictionary 型
│   │   ├── normalize.ts              # かな正規化（常時: カタカナ→ひらがな・英小文字化 / オプション: 濁点・小書き同一視）
│   │   ├── search.ts                 # テーマ逆引き検索（二部グラフ最大マッチング）
│   │   ├── validate.ts               # 要素の文字種バリデーション
│   │   └── importParser.ts           # 一括インポートのパース
│   ├── search-page/                  # 検索ページUI
│   ├── admin-page/                   # 管理画面UI
│   └── styles/                       # 共通CSS
├── plugins/adminApi.ts               # 管理APIミドルウェア（Viteプラグイン）
├── vite.config.ts
└── package.json
```

## 実装ステップ

1. **基盤**: Vite + React + TS の雛形、MPA設定（ビルド入力は公開2ページのみ）、シード辞書JSON
2. **共通ロジック**: normalize / search（最大マッチング）/ validate / importParser + ユニットテスト
3. **検索ページ**: 辞書読み込み → 検索フォーム・オプション → 結果カード（拾い箇所ハイライト）
4. **管理画面**: グループ一覧 / 編集 / 一括インポート + 管理API（辞書JSONへの読み書き）
5. **検証**: テスト・ビルド確認（distにadminが含まれないこと）

## npmスクリプト

| コマンド | 用途 |
|---|---|
| `npm run dev` | 公開ページの開発サーバー |
| `npm run admin` | 開発サーバーを起動し `/admin/` を開く（管理API有効） |
| `npm run build` | 公開サイトの静的ビルド（`dist/`） |
| `npm run test` | ユニットテスト |

## 設計メモ

- 要素の並び順はJSON配列の順序で表現する（要件のorder列は配列indexで実装）
- id・タイムスタンプは管理API側で採番する（`crypto.randomUUID()` / ISO文字列）
- 管理APIはserveモード限定のため、ビルド成果物にAPIコードは一切含まれない
