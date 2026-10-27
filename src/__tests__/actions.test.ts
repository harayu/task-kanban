import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTask, deleteTask, updateTask } from "@/app/actions";
import { buildTask, createFakeSupabase } from "./helpers/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let fake: ReturnType<typeof createFakeSupabase>;

beforeEach(() => {
  fake = createFakeSupabase([buildTask({ id: "task-1", title: "既存タスク" })]);
  vi.mocked(createClient).mockResolvedValue(fake.client);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createTask", () => {
  test("有効な入力だとタスクが保存され、作成したタスクを返して一覧を再検証する", async () => {
    const result = await createTask({
      title: "新しいタスク",
      description: "メモ",
      status: "todo",
    });

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({ title: "新しいタスク", description: "メモ" }),
    });
    expect(fake.rows).toHaveLength(2);
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  test("タイトルが空だと保存せずにエラーを返す", async () => {
    const result = await createTask({ title: " ", description: "", status: "todo" });

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
    expect(fake.rows).toHaveLength(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("Supabase がエラーを返すとエラーメッセージを返す", async () => {
    fake.failNext("insert failed");

    const result = await createTask({ title: "a", description: "", status: "todo" });

    expect(result).toEqual({ ok: false, error: "insert failed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateTask", () => {
  test("有効な入力だとタスクが更新され、更新後のタスクを返す", async () => {
    const result = await updateTask("task-1", {
      title: "更新後",
      description: "",
      status: "done",
    });

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({ id: "task-1", title: "更新後", status: "done" }),
    });
    expect(fake.rows[0]).toMatchObject({ title: "更新後", status: "done" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  test("タイトルが101文字だと更新せずにエラーを返す", async () => {
    const result = await updateTask("task-1", {
      title: "a".repeat(101),
      description: "",
      status: "todo",
    });

    expect(result.ok).toBe(false);
    expect(fake.rows[0].title).toBe("既存タスク");
  });

  test("存在しないタスクを更新しようとするとエラーを返す", async () => {
    const result = await updateTask("missing", {
      title: "a",
      description: "",
      status: "todo",
    });

    expect(result.ok).toBe(false);
  });
});

describe("deleteTask", () => {
  test("指定したタスクが削除され、一覧を再検証する", async () => {
    const result = await deleteTask("task-1");

    expect(result).toEqual({ ok: true, data: "task-1" });
    expect(fake.rows).toHaveLength(0);
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  test("Supabase がエラーを返すと削除せずにエラーメッセージを返す", async () => {
    fake.failNext("delete failed");

    const result = await deleteTask("task-1");

    expect(result).toEqual({ ok: false, error: "delete failed" });
    expect(fake.rows).toHaveLength(1);
  });
});
