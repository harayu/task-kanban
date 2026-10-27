import { describe, expect, test } from "vitest";
import { validateTaskInput } from "@/lib/tasks/validation";
import type { TaskInput, TaskStatus } from "@/lib/tasks/types";

const validInput: TaskInput = {
  title: "牛乳を買う",
  description: "",
  status: "todo",
};

describe("validateTaskInput", () => {
  test("タイトルが空だとタイトル必須のエラーになる", () => {
    const result = validateTaskInput({ ...validInput, title: "" });
    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
  });

  test("タイトルが空白のみだとタイトル必須のエラーになる", () => {
    const result = validateTaskInput({ ...validInput, title: "   " });
    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
  });

  test("タイトルが1文字なら有効になる", () => {
    expect(validateTaskInput({ ...validInput, title: "a" }).ok).toBe(true);
  });

  test("タイトルが100文字なら有効になる", () => {
    expect(validateTaskInput({ ...validInput, title: "a".repeat(100) }).ok).toBe(
      true,
    );
  });

  test("タイトルが101文字だと文字数超過のエラーになる", () => {
    const result = validateTaskInput({ ...validInput, title: "a".repeat(101) });
    expect(result).toEqual({
      ok: false,
      error: "タイトルは100文字以内で入力してください",
    });
  });

  test("タイトルと説明の前後の空白は取り除かれる", () => {
    const result = validateTaskInput({
      ...validInput,
      title: "  牛乳を買う  ",
      description: "  低脂肪  ",
    });
    expect(result).toEqual({
      ok: true,
      data: { title: "牛乳を買う", description: "低脂肪", status: "todo" },
    });
  });

  test("説明が500文字なら有効になる", () => {
    expect(
      validateTaskInput({ ...validInput, description: "a".repeat(500) }).ok,
    ).toBe(true);
  });

  test("説明が501文字だと文字数超過のエラーになる", () => {
    const result = validateTaskInput({
      ...validInput,
      description: "a".repeat(501),
    });
    expect(result).toEqual({
      ok: false,
      error: "説明は500文字以内で入力してください",
    });
  });

  test("存在しないステータスだとステータス不正のエラーになる", () => {
    const result = validateTaskInput({
      ...validInput,
      status: "archived" as TaskStatus,
    });
    expect(result).toEqual({ ok: false, error: "ステータスが不正です" });
  });
});
