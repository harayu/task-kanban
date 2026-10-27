"use client";

import { useState } from "react";
import type { Task, TaskInput } from "@/lib/tasks/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { TaskForm } from "./TaskForm";

type TaskCardProps = {
  task: Task;
  onUpdate: (id: string, input: TaskInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onValidationError: (message: string) => void;
};

export function TaskCard({ task, onUpdate, onDelete, onValidationError }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (isEditing) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <TaskForm
          label="タスクを編集"
          submitLabel="保存"
          showStatus
          initialValues={{
            title: task.title,
            description: task.description,
            status: task.status,
          }}
          onSubmit={async (input) => {
            const succeeded = await onUpdate(task.id, input);
            if (succeeded) setIsEditing(false);
            return succeeded;
          }}
          onCancel={() => setIsEditing(false)}
          onValidationError={onValidationError}
        />
      </div>
    );
  }

  return (
    <article
      aria-label={task.title}
      className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h3 className="font-medium break-words">{task.title}</h3>
      {task.description && (
        <p className="mt-1 text-sm whitespace-pre-wrap break-words text-zinc-600 dark:text-zinc-400">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-700"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 dark:border-red-800"
        >
          削除
        </button>
      </div>
      {isConfirmingDelete && (
        <ConfirmDialog
          title="タスクの削除"
          message={`「${task.title}」を削除しますか？`}
          confirmLabel="削除する"
          onConfirm={async () => {
            setIsConfirmingDelete(false);
            await onDelete(task.id);
          }}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </article>
  );
}
