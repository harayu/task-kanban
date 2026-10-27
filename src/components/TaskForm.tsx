"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES, type TaskInput, type TaskStatus } from "@/lib/tasks/types";
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateTaskInput,
} from "@/lib/tasks/validation";

type TaskFormProps = {
  label: string;
  submitLabel: string;
  // 送信ボタンのラベル前に表示するアイコン
  submitIcon?: ReactNode;
  initialValues?: TaskInput;
  // 編集時のみステータスを選べるようにする
  showStatus?: boolean;
  // 成功したら true を返す。true のときだけ入力をリセットする
  onSubmit: (input: TaskInput) => Promise<boolean>;
  onCancel?: () => void;
  onValidationError: (message: string) => void;
};

const emptyValues: TaskInput = { title: "", description: "", status: "todo" };

function CharCount({ length, max }: { length: number; max: number }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
      {length}/{max}
    </span>
  );
}

export function TaskForm({
  label,
  submitLabel,
  submitIcon,
  initialValues = emptyValues,
  showStatus = false,
  onSubmit,
  onCancel,
  onValidationError,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskInput>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldId = useId();
  const titleId = `${fieldId}-title`;
  const descriptionId = `${fieldId}-description`;
  const statusId = `${fieldId}-status`;

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
    <form aria-label={label} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={titleId}>タイトル</Label>
          <CharCount length={values.title.length} max={TITLE_MAX_LENGTH} />
        </div>
        <Input
          id={titleId}
          type="text"
          value={values.title}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="例: 企画書のドラフトを作る"
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={descriptionId}>説明</Label>
          <CharCount length={values.description.length} max={DESCRIPTION_MAX_LENGTH} />
        </div>
        <Textarea
          id={descriptionId}
          value={values.description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={2}
          placeholder="詳細やメモ（任意）"
          onChange={(event) =>
            setValues({ ...values, description: event.target.value })
          }
        />
      </div>
      {showStatus && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={statusId}>ステータス</Label>
          <NativeSelect
            id={statusId}
            className="w-full"
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as TaskStatus })
            }
          >
            {TASK_STATUSES.map((status) => (
              <NativeSelectOption key={status.value} value={status.value}>
                {status.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitIcon}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
