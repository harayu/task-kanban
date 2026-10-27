"use client";

import { useId, useState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { createTask, deleteTask, updateTask } from "@/app/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

// 列見出しのドットの色
const statusDotClass: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
};

type TaskBoardProps = {
  initialTasks: Task[];
};

export function TaskBoard({ initialTasks }: TaskBoardProps) {
  // Server Action の戻り値でローカルの一覧を更新し、結果をすぐ画面に反映する
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const columnIdPrefix = useId();

  const handleCreate = async (input: TaskInput) => {
    const result = await createTask(input);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setError(null);
    setTasks((current) => [...current, result.data]);
    return true;
  };

  const handleUpdate = async (id: string, input: TaskInput) => {
    const result = await updateTask(id, input);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setError(null);
    setTasks((current) =>
      current.map((task) => (task.id === id ? result.data : task)),
    );
    return true;
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTask(id);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setError(null);
    setTasks((current) => current.filter((task) => task.id !== id));
    return true;
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive" className="border-destructive/30">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[300px_1fr] xl:items-start">
        <Card className="max-w-xl xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle>新しいタスク</CardTitle>
            <CardDescription>
              追加したタスクは Todo 列に入ります
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm
              label="タスクを追加"
              submitLabel="追加"
              submitIcon={<Plus />}
              onSubmit={handleCreate}
              onValidationError={setError}
            />
          </CardContent>
        </Card>

        <div className="grid items-start gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((status) => {
            const headingId = `${columnIdPrefix}-${status.value}`;
            const columnTasks = tasks.filter(
              (task) => task.status === status.value,
            );
            return (
              <section
                key={status.value}
                aria-labelledby={headingId}
                className="flex flex-col gap-3 rounded-2xl border bg-muted/50 p-3"
              >
                <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 rounded-full",
                        statusDotClass[status.value],
                      )}
                    />
                    <span id={headingId}>{status.label}</span>
                  </span>
                  <Badge variant="secondary" className="tabular-nums">
                    {columnTasks.length}
                  </Badge>
                </h2>
                {columnTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                    タスクはありません
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {columnTasks.map((task) => (
                      <li key={task.id}>
                        <TaskCard
                          task={task}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                          onValidationError={setError}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
