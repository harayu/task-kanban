import { TaskBoard } from "@/components/TaskBoard";
import { fetchTasks } from "@/lib/tasks/queries";

export default async function Home() {
  const result = await fetchTasks();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 font-sans">
      <h1 className="text-2xl font-semibold">タスクカンバン</h1>
      {result.ok ? (
        <TaskBoard initialTasks={result.data} />
      ) : (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          タスクの取得に失敗しました: {result.error}
        </p>
      )}
    </main>
  );
}
