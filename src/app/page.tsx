import { CircleAlert, SquareKanban } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { TaskBoard } from "@/components/TaskBoard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchTasks } from "@/lib/tasks/queries";

export default async function Home() {
  const result = await fetchTasks();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 font-sans">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <SquareKanban className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">タスクカンバン</h1>
            <p className="text-sm text-muted-foreground">
              Todo / In Progress / Done でタスクの進み具合を管理
            </p>
          </div>
        </div>
        <ModeToggle />
      </header>
      {result.ok ? (
        <TaskBoard initialTasks={result.data} />
      ) : (
        <Alert variant="destructive" className="border-destructive/30">
          <CircleAlert />
          <AlertDescription>タスクの取得に失敗しました: {result.error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
