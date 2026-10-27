# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## プロジェクト概要

`create-next-app` で生成した直後の Next.js アプリで、タスク管理用カンバン（task-kanban）を作るための土台です。現時点の `src/app/page.tsx` はテンプレートのままです。
ステータス管理 (Todo In Progress / Done) とタスクの CRUD を行うための UI を作ることが目的です。
Next.js + Supabase で構築し、Vercelにデプロイすることを想定しています。

## コマンド

```bash
npm run dev        # 開発サーバー (http://localhost:3000)
npm run build      # 本番ビルド
npm run start      # ビルド済みアプリの起動
npm run lint       # ESLint (flat config: eslint.config.mjs)
npm test           # Vitest をウォッチモードで実行
npm run test:run   # Vitest を1回だけ実行 (CI 向け)

# 単一テストファイル / テスト名で絞り込み
npx vitest run src/__tests__/page.test.tsx
npx vitest run -t "見出しが表示される"
```

## 技術スタックと注意点

- **Next.js 16.4 / React 19.3（App Router）**。学習データとは API や規約が異なる可能性があるため、コードを書く前に `node_modules/next/dist/docs/`（`01-app/` など）の該当ガイドを確認すること（AGENTS.md 参照）。
- `next.config.ts` で `cacheComponents: true` と `partialPrefetching: true` を有効化している。データ取得やキャッシュ、動的レンダリングの書き方はこの前提に従う。
- **Tailwind CSS v4 は PostCSS ではなく Turbopack ローダー（`@tailwindcss/turbopack`）経由**で読み込まれている（`next.config.ts` の `turbopack.rules`）。PostCSS 設定ファイルは存在しない。テーマ変数は `src/app/globals.css` の `@theme inline` で定義する。
- ページ・レイアウトの props 型には Next.js が自動生成するグローバル型（例: `LayoutProps<"/">`）を使っている。
- パスエイリアス `@/*` → `./src/*`（tsconfig と Vitest の `resolve.tsconfigPaths` で共通）。

## Supabase 接続設定

- パッケージは `@supabase/ssr` + `@supabase/supabase-js`。クライアントは `src/lib/supabase/` 配下のものを使い、`createBrowserClient` / `createServerClient` を直接呼ばないこと。
  - `client.ts` の `createClient()`: Client Component 用（同期関数）。
  - `server.ts` の `createClient()`: Server Component / Server Action / Route Handler 用。`cookies()` を使うため **async** で、`await createClient()` と呼ぶ。Server Component からは Cookie を書き込めないため `setAll` 内の例外は握りつぶしている。
- 環境変数は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE`（publishable キー。旧 anon キーではない）の2つ。
  - `.env.local` に設定する（`.env*` は gitignore 済み。雛形の `.env.example` のみコミット対象）。
  - 読み出しは `env.ts` の `getSupabaseEnv()` に集約しており、未設定なら例外を投げる。`process.env` を各所で直接参照しないこと。
  - service_role / secret キーは `NEXT_PUBLIC_` を付けてクライアントに露出させないこと。
- 接続確認: `src/instrumentation.ts` の `register()` がサーバー起動時に1回だけ `checkSupabaseConnection()`（`check-connection.ts`、`/auth/v1/health` に apikey ヘッダー付きで問い合わせ、5秒タイムアウト）を実行する。
  - 成功時は何も出力せず、失敗時のみ `console.error` で `[Supabase] 接続失敗: <理由>` を出す。ログが出なければ接続成功。
  - `register()` は起動時にしか走らないため、`.env.local` を変更したら開発サーバーを再起動する。
- テストでは実通信せず、`vi.stubEnv` で環境変数を、`vi.stubGlobal("fetch", ...)` で fetch をモックする（`src/__tests__/check-connection.test.ts` 参照）。`afterEach` で `vi.unstubAllEnvs()` / `vi.unstubAllGlobals()` を呼んでテスト間で状態を共有しないこと。
- Supabase MCP（`.mcp.json`）が設定済み。テーブル定義の確認やマイグレーション、型生成（`generate_typescript_types`）はこれを使う。スキーマ変更前には既存テーブルを確認すること。

## テスト

- Vitest + jsdom + React Testing Library。`vitest.setup.ts` で `@testing-library/jest-dom/vitest` のマッチャー登録と、各テスト後の `cleanup()` を行っている。
- テストは `src/__tests__/` に置き、テスト名は日本語で書いている（既存の `page.test.tsx` 参照）。

## テストルール

- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見える振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないようにしてください
- 状態遷移: 画面遷移の順方向・逆方向を検証してください
- モック方針: 外部依存のみモック化してください

## コーディングルール

- 変更後は必ず`npm test`でテストが通ることを確認すること。
- 変更は1つの関心ごとに絞り、小さい単位で行なってください。
- 指示された範囲以外のコードを変更しないでください。

## コーディング規約

- コンポーネントは関数コンポーネントで書くこと。クラスコンポーネントは使わない。
- 変数名・関数名はキャメルケースで書くこと。
- コミットメッセージは日本語で書くこと。
  - 例: `タスク追加機能を実装`、`タスク削除機能のバグ修正`

## 禁止事項

- console.log() の使用は禁止。デバッグは VSCode のブレークポイントで行うこと。
- 既存のテストを削除・変更することは禁止。テストの追加は自由。
- any 型の使用は禁止。型定義が不十分な場合は、型を定義してからコードを書くこと。

## MCP活用ルール

- Next.js・Supabase・Vitestなどの最新仕様は、Context7を使って公式ドキュメントを参照すること。学習データの情報は古い可能性があるため、必ず公式ドキュメントで確認すること。
