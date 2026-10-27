"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Task, TaskInput } from "@/lib/tasks/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { TaskForm } from "./TaskForm";

type TaskCardProps = {
  task: Task;
  onUpdate: (id: string, input: TaskInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onValidationError: (message: string) => void;
};

export function TaskCard({
  task,
  onUpdate,
  onDelete,
  onValidationError,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (isEditing) {
    return (
      <Card size="sm" className="px-3 ring-2 ring-ring/40">
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
      </Card>
    );
  }

  return (
    <article aria-label={task.title} className="group/task">
      <Card
        size="sm"
        className="gap-1 px-3 shadow-xs transition-shadow group-hover/task:shadow-md group-hover/task:ring-foreground/20"
      >
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 pt-0.5 font-medium break-words">
            {task.title}
          </h3>
          <div className="-mt-0.5 -mr-1 flex shrink-0 gap-0.5 opacity-60 transition-opacity group-hover/task:opacity-100 group-focus-within/task:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="編集"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="削除"
              onClick={() => setIsConfirmingDelete(true)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        {task.description && (
          <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
            {task.description}
          </p>
        )}
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
      </Card>
    </article>
  );
}
