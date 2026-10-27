# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## プロジェクト概要

タスク管理用カンバン（task-kanban）。ステータス管理 (Todo / In Progress / Done) とタスクの CRUD を行う。
Next.js + Supabase で構築し、Vercelにデプロイすることを想定しています。認証は未導入。

## アーキテクチャ

トップページ（`src/app/page.tsx`）がカンバン。データの流れ:

1. `page.tsx`（async Server Component）が `src/lib/tasks/queries.ts` の `fetchTasks()` で一覧を取得し、`<TaskBoard initialTasks>` に渡す。取得失敗時は `role="alert"` のエラー表示。
   - `cacheComponents` 環境で cookies を読むページは Suspense 境界が必要なため、`src/app/loading.tsx` を置いている（ビルド結果は `◐ Partial Prerender`）。消さないこと。
2. 変更系は `src/app/actions.ts` の Server Action（`createTask` / `updateTask(id, input)` / `deleteTask(id)`）。
   - 戻り値は `ActionResult<T>`（`{ ok: true, data }` / `{ ok: false, error }`）で、**例外は投げない**。新しいアクションもこの形に揃える。
   - Server Action は直接 POST でも呼べるため、サーバー側でも必ず `validateTaskInput()` を通す。
   - 成功時は `revalidatePath("/")` を呼ぶ。
3. `src/components/TaskBoard.tsx`（Client Component）は `initialTasks` を `useState` に入れ、**Server Action の戻り値でローカル状態を更新して即時反映**する（router.refresh や再取得には頼らない）。エラーはボード上部の `role="alert"` に1つだけ表示する。
   - `TaskForm`: 追加・編集で共用。送信前にクライアント側でも検証し、送信中はボタンを無効化。`onSubmit` が `true` を返したときだけ入力をリセットする。フォームは `onSubmit` + `preventDefault` で実装（`<form action>` ではない）。
   - `TaskCard`: 表示と、カード内での編集切り替え。削除は `ConfirmDialog` で確認してから実行する。
   - `ConfirmDialog`: `role="alertdialog"` の自前ダイアログ。`window.confirm` は使わない。初期フォーカスはキャンセル、Esc でキャンセル。
4. 型・定数は `src/lib/tasks/types.ts` に集約。`Task` / `TaskStatus` は生成型（`database.types.ts`）から派生させ、手書きで重複定義しない。列の並びと表示ラベルは `TASK_STATUSES` を使う。
5. テーマ（ダークモード）は `next-themes` で `<html>` の `.dark` クラスを切り替える。
   - `src/app/layout.tsx` で全体を `ThemeProvider`（`src/components/ThemeProvider.tsx`）で包んでいる（`attribute="class"` / `defaultTheme="system"` / `enableSystem`）。`<html>` の `suppressHydrationWarning` は next-themes に必要なので消さないこと。
   - `ModeToggle`（`src/components/ModeToggle.tsx`）: 見出し横のボタン（accessible name「テーマを切り替え」）から ライト / ダーク / システム を選ぶ。選択は localStorage の `theme` に保存される。
   - `dark:` バリアントは `globals.css` の `@custom-variant dark (&:is(.dark *))` で `.dark` クラス基準になっている。`prefers-color-scheme` のメディアクエリでダーク用スタイルを書かないこと（OS 設定への追従は next-themes の `system` が担う）。

## データベース

- `public.tasks`（マイグレーション名 `create_tasks_table`、Supabase MCP の `apply_migration` で適用済み）
  | カラム | 型 | 制約 |
  |---|---|---|
  | `id` | uuid | PK, `gen_random_uuid()` |
  | `title` | text | not null, 1〜100文字 |
  | `description` | text | not null, default `''`, 500文字以下 |
  | `status` | `task_status` enum (`todo` / `in_progress` / `done`) | not null, default `todo` |
  | `created_at` / `updated_at` | timestamptz | `updated_at` はトリガー `tasks_set_updated_at`（関数 `public.set_updated_at`）で自動更新 |
- 文字数ルールは DB の check 制約と `src/lib/tasks/validation.ts`（`TITLE_MAX_LENGTH` / `DESCRIPTION_MAX_LENGTH`）の両方にある。**変更するときは両方を揃える**。
- 一覧は `created_at` の昇順。
- RLS は有効だが、認証未導入のため anon / authenticated に全操作を許可するポリシー（`tasks_*_all`）を付けている。認証を導入するときは `user_id` カラムを追加し、ポリシーを本人のみに差し替えること。
- スキーマ変更の手順: `list_tables` で現状確認 → `apply_migration`（DDL は `execute_sql` ではなくこちら）→ `get_advisors`（security）で警告確認 → `generate_typescript_types` の結果で `src/lib/supabase/database.types.ts` を上書き（手で編集しない）。
- project_id は `hpqglnfsckehpotywsiv`。

## コマンド

```bash
npm run dev        # 開発サーバー (http://localhost:3000)。すでに起動中だと二重起動できずエラー終了する
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

## UI コンポーネント（shadcn/ui）

- shadcn/ui を `npx shadcn@latest init --defaults` で導入済み。設定は `components.json`（style `base-nova` / baseColor `neutral` / アイコン `lucide-react` / `rsc: true`）。
- コンポーネントの追加は `npx shadcn@latest add <name>`。`src/components/ui/` に生成される（現在は `alert` / `badge` / `button` / `card` / `dropdown-menu` / `input` / `label` / `native-select` / `skeleton` / `textarea`）。生成物はプロジェクトのコードとして扱い、必要なら編集してよい。
- **プリミティブは Radix ではなく Base UI（`@base-ui/react`）**。公式ドキュメントや Context7 のサンプルは Radix 前提の `asChild` で書かれていることが多いが、Base UI には無い。子要素として描画させたいときは `render` prop を使う（例: `<DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>`）。
- クラス結合は `cn()` を使う。`src/lib/utils.ts` は `cn` パッケージの再エクスポート（`export { cn } from "cn"`、2026年9月の shadcn の変更による）で、`clsx` / `tailwind-merge` は直接使わない。自前のコードは `@/lib/utils` から import する。
- テーマ色は `globals.css` の `:root`（ライト）と `.dark`（ダーク）に OKLCH の CSS 変数で定義され、`@theme inline` で `bg-background` / `text-foreground` / `border-border` などのユーティリティに対応付けられている。色を変えるときはこの CSS 変数を編集する。
- フォント: `@theme inline` の `--font-sans` は `layout.tsx` の Geist（`--font-geist-sans`）を参照している。`shadcn init` は `--font-sans: var(--font-sans)` という自己参照を書き込むことがあるので、init / 再生成後は確認すること。
- カンバンの UI（`TaskBoard` / `TaskForm` / `TaskCard` / `ConfirmDialog` / `page.tsx` / `loading.tsx`）は shadcn コンポーネントで組んでいる。色は `bg-card` / `text-muted-foreground` などのトークンを使い、`zinc-*` などを直書きしない（例外: 列見出しのステータス色ドット）。UI を変えるときは「テスト」節に挙げた role と accessible name を維持すること。
  - ステータスの選択は `native-select`（ネイティブ `<select>`）。テストが `fireEvent.change` で値を変えるため、Base UI の `Select` には置き換えない。
  - 削除確認に shadcn の `alert-dialog` は使わない。Base UI のモーダルは開いている間ほかの要素を aria-hidden にし、ダイアログ表示中に背景のカードを参照するテストが通らないため。`ConfirmDialog` は見た目だけ AlertDialog に揃えた自前実装。
  - カードの編集・削除はアイコンボタンで、`aria-label`（「編集」「削除」）で accessible name を付けている。

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
- Supabase を使うコードのテストでは、外部依存の `@/lib/supabase/server` と `next/cache` だけを `vi.mock` し、`src/__tests__/helpers/fakeSupabase.ts` のインメモリのフェイクを `vi.mocked(createClient).mockResolvedValue(fake.client)` で差し込む（Server Action やコンポーネント自体はモックしない）。
  - `createFakeSupabase(rows)` はテストごとに生成する。`fake.rows` で DB 側の状態を検証し、`fake.failNext("msg")` で次の1回のクエリを失敗させる。`buildTask()` でテスト用タスクを作る。
  - 新しいクエリの書き方（メソッドチェーン）を使ったら、フェイクにも同じチェーンを追加する。
- async Server Component のページは `render(await Home())` で描画してテストする。
- `@testing-library/user-event` は未導入。操作は `fireEvent`、非同期の反映は `findBy*` で待つ。
- 要素は role と accessible name で取る（列は `region`、カードはタイトル名の `article`、フォームは `form`（「タスクを追加」/「タスクを編集」）、削除確認は `alertdialog`、エラーは `alert`、テーマ切り替えは `button`「テーマを切り替え」とその `menuitem`「ライト」/「ダーク」/「システム」）。UI を変えるときはこれらの role と名前を維持すること。
- テーマ（next-themes）のテストは `src/__tests__/mode-toggle.test.tsx` 参照。jsdom には `matchMedia` が無いため `vi.stubGlobal("matchMedia", ...)` で OS 設定を差し替え、`ThemeProvider` で包んで描画し、`document.documentElement` の `dark` クラスと localStorage の `theme` を検証する。`afterEach` で `localStorage.clear()` と `<html>` の class / style のリセットを行うこと。
- shadcn（Base UI）のメニューは jsdom でも `fireEvent.click` でトリガーを押せば開き、項目は `findByRole("menuitem", { name })` で取れる。

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
  - Context7 に接続できない場合は、Next.js は `node_modules/next/dist/docs/`、Supabase は Supabase MCP の `search_docs` で確認する。
