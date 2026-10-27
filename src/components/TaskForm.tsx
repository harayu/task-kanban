"use client";

import { useState, type FormEvent } from "react";
import { TASK_STATUSES, type TaskInput, type TaskStatus } from "@/lib/tasks/types";
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateTaskInput,
} from "@/lib/tasks/validation";

type TaskFormProps = {
  label: string;
  submitLabel: string;
  initialValues?: TaskInput;
  // 編集時のみステータスを選べるようにする
  showStatus?: boolean;
  // 成功したら true を返す。true のときだけ入力をリセットする
  onSubmit: (input: TaskInput) => Promise<boolean>;
  onCancel?: () => void;
  onValidationError: (message: string) => void;
};

const emptyValues: TaskInput = { title: "", description: "", status: "todo" };

export function TaskForm({
  label,
  submitLabel,
  initialValues = emptyValues,
  showStatus = false,
  onSubmit,
  onCancel,
  onValidationError,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskInput>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validated = validateTaskInput(values);
    if (!validated.ok) {
      onValidationError(validated.error);
      return;
    }

    setIsSubmitting(true);
    const succeeded = await onSubmit(validated.data);
    setIsSubmitting(false);
    if (succeeded) setValues(initialValues);
  };

  return (
    <form aria-label={label} onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        タイトル
        <input
          type="text"
          value={values.title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        説明
        <textarea
          value={values.description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={2}
          onChange={(event) =>
            setValues({ ...values, description: event.target.value })
          }
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {showStatus && (
        <label className="flex flex-col gap-1 text-sm">
          ステータス
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as TaskStatus })
            }
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
