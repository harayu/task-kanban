"use client";

import { useId, useState } from "react";
import { createTask, deleteTask, updateTask } from "@/app/actions";
import { TASK_STATUSES, type Task, type TaskInput } from "@/lib/tasks/types";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

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
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <TaskForm
          label="タスクを追加"
          submitLabel="追加"
          onSubmit={handleCreate}
          onValidationError={setError}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const headingId = `${columnIdPrefix}-${status.value}`;
          const columnTasks = tasks.filter((task) => task.status === status.value);
          return (
            <section
              key={status.value}
              aria-labelledby={headingId}
              className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900"
            >
              <h2 className="flex items-center justify-between font-semibold">
                <span id={headingId}>{status.label}</span>
                <span className="text-sm font-normal text-zinc-500">
                  {columnTasks.length}
                </span>
              </h2>
              {columnTasks.length === 0 ? (
                <p className="text-sm text-zinc-500">タスクはありません</p>
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
  );
}
