import { TASK_STATUSES, type ActionResult, type TaskInput } from "./types";

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

// DB の check 制約と同じルールで入力を検証し、前後の空白を除いた値を返す
export function validateTaskInput(input: TaskInput): ActionResult<TaskInput> {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length === 0) {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      error: `説明は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (!TASK_STATUSES.some((status) => status.value === input.status)) {
    return { ok: false, error: "ステータスが不正です" };
  }

  return { ok: true, data: { title, description, status: input.status } };
}
