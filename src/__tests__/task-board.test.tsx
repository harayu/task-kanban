import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createClient } from "@/lib/supabase/server";
import { TaskBoard } from "@/components/TaskBoard";
import type { Task } from "@/lib/tasks/types";
import { buildTask, createFakeSupabase } from "./helpers/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const todoTask = buildTask({ id: "task-1", title: "牛乳を買う", status: "todo" });
const doingTask = buildTask({
  id: "task-2",
  title: "資料を作る",
  description: "来週の会議用",
  status: "in_progress",
});
const doneTask = buildTask({ id: "task-3", title: "掃除をする", status: "done" });

let fake: ReturnType<typeof createFakeSupabase>;

function renderBoard(tasks: Task[]) {
  fake = createFakeSupabase(tasks);
  vi.mocked(createClient).mockResolvedValue(fake.client);
  render(<TaskBoard initialTasks={tasks} />);
}

const column = (name: string) => screen.getByRole("region", { name });
const card = (title: string) => screen.getByRole("article", { name: title });

beforeEach(() => {
  vi.mocked(createClient).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("一覧表示", () => {
  test("各タスクがステータスに対応した列に表示される", () => {
    renderBoard([todoTask, doingTask, doneTask]);

    expect(within(column("Todo")).getByText("牛乳を買う")).toBeInTheDocument();
    expect(within(column("In Progress")).getByText("資料を作る")).toBeInTheDocument();
    expect(within(column("In Progress")).getByText("来週の会議用")).toBeInTheDocument();
    expect(within(column("Done")).getByText("掃除をする")).toBeInTheDocument();
  });

  test("タスクがない列には空であることが表示される", () => {
    renderBoard([todoTask]);

    expect(within(column("Todo")).queryByText("タスクはありません")).not.toBeInTheDocument();
    expect(within(column("In Progress")).getByText("タスクはありません")).toBeInTheDocument();
    expect(within(column("Done")).getByText("タスクはありません")).toBeInTheDocument();
  });
});

describe("タスクの追加", () => {
  const addForm = () => screen.getByRole("form", { name: "タスクを追加" });

  test("タイトルを入力して追加すると Todo 列にすぐ表示され、フォームが空になる", async () => {
    renderBoard([]);
    const form = within(addForm());

    fireEvent.change(form.getByLabelText("タイトル"), { target: { value: "新しいタスク" } });
    fireEvent.change(form.getByLabelText("説明"), { target: { value: "詳細メモ" } });
    fireEvent.click(form.getByRole("button", { name: "追加" }));

    expect(await within(column("Todo")).findByText("新しいタスク")).toBeInTheDocument();
    expect(within(column("Todo")).getByText("詳細メモ")).toBeInTheDocument();
    expect(form.getByLabelText("タイトル")).toHaveValue("");
    expect(form.getByLabelText("説明")).toHaveValue("");
    expect(fake.rows).toHaveLength(1);
  });

  test("タイトルが空のまま追加するとエラーが表示され、タスクは保存されない", async () => {
    renderBoard([]);

    fireEvent.click(within(addForm()).getByRole("button", { name: "追加" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(within(column("Todo")).getByText("タスクはありません")).toBeInTheDocument();
    expect(fake.rows).toHaveLength(0);
  });

  test("保存に失敗するとエラーが表示され、一覧と入力内容は変わらない", async () => {
    renderBoard([]);
    fake.failNext("通信エラー");
    const form = within(addForm());

    fireEvent.change(form.getByLabelText("タイトル"), { target: { value: "新しいタスク" } });
    fireEvent.click(form.getByRole("button", { name: "追加" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("通信エラー");
    expect(within(column("Todo")).queryByText("新しいタスク", { selector: "h3" })).not.toBeInTheDocument();
    expect(form.getByLabelText("タイトル")).toHaveValue("新しいタスク");
  });
});

describe("タスクの編集", () => {
  const editForm = () => screen.getByRole("form", { name: "タスクを編集" });

  test("編集してタイトルを保存すると内容がすぐ更新される", async () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "編集" }));
    const form = within(editForm());
    expect(form.getByLabelText("タイトル")).toHaveValue("牛乳を買う");
    fireEvent.change(form.getByLabelText("タイトル"), { target: { value: "豆乳を買う" } });
    fireEvent.click(form.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("article", { name: "豆乳を買う" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "牛乳を買う" })).not.toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "タスクを編集" })).not.toBeInTheDocument();
  });

  test("ステータスを Todo から Done に変えると Done 列へ移動する", async () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "編集" }));
    fireEvent.change(within(editForm()).getByLabelText("ステータス"), {
      target: { value: "done" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(await within(column("Done")).findByText("牛乳を買う")).toBeInTheDocument();
    expect(within(column("Todo")).getByText("タスクはありません")).toBeInTheDocument();
  });

  test("ステータスを Done から Todo に戻すと Todo 列へ移動する", async () => {
    renderBoard([doneTask]);

    fireEvent.click(within(card("掃除をする")).getByRole("button", { name: "編集" }));
    fireEvent.change(within(editForm()).getByLabelText("ステータス"), {
      target: { value: "todo" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(await within(column("Todo")).findByText("掃除をする")).toBeInTheDocument();
    expect(within(column("Done")).getByText("タスクはありません")).toBeInTheDocument();
  });

  test("編集をキャンセルすると変更は反映されず元の表示に戻る", () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "編集" }));
    fireEvent.change(within(editForm()).getByLabelText("タイトル"), {
      target: { value: "豆乳を買う" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("form", { name: "タスクを編集" })).not.toBeInTheDocument();
    expect(card("牛乳を買う")).toBeInTheDocument();
    expect(fake.rows[0].title).toBe("牛乳を買う");
  });

  test("タイトルを空にして保存するとエラーが表示され、編集フォームのまま残る", async () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "編集" }));
    fireEvent.change(within(editForm()).getByLabelText("タイトル"), { target: { value: "" } });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(editForm()).toBeInTheDocument();
    expect(fake.rows[0].title).toBe("牛乳を買う");
  });

  test("保存に失敗するとエラーが表示され、タスクは元のまま", async () => {
    renderBoard([todoTask]);
    fake.failNext("更新できませんでした");

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "編集" }));
    fireEvent.change(within(editForm()).getByLabelText("タイトル"), {
      target: { value: "豆乳を買う" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("更新できませんでした");
    expect(fake.rows[0].title).toBe("牛乳を買う");
    expect(screen.queryByRole("article", { name: "豆乳を買う" })).not.toBeInTheDocument();
  });
});

describe("タスクの削除", () => {
  const dialog = () => screen.getByRole("alertdialog", { name: "タスクの削除" });

  test("削除ボタンを押すと確認ダイアログが表示され、まだタスクは消えない", () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "削除" }));

    expect(dialog()).toHaveTextContent("「牛乳を買う」を削除しますか？");
    expect(card("牛乳を買う")).toBeInTheDocument();
    expect(fake.rows).toHaveLength(1);
  });

  test("確認ダイアログでキャンセルするとダイアログが閉じ、タスクは残る", () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "削除" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(card("牛乳を買う")).toBeInTheDocument();
    expect(fake.rows).toHaveLength(1);
  });

  test("確認ダイアログで Escape キーを押すとダイアログが閉じ、タスクは残る", () => {
    renderBoard([todoTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "削除" }));
    fireEvent.keyDown(dialog(), { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(card("牛乳を買う")).toBeInTheDocument();
  });

  test("確認ダイアログで削除するとタスクが一覧からすぐ消える", async () => {
    renderBoard([todoTask, doneTask]);

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "削除" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "削除する" }));

    expect(await within(column("Todo")).findByText("タスクはありません")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(card("掃除をする")).toBeInTheDocument();
    expect(fake.rows).toHaveLength(1);
  });

  test("削除に失敗するとエラーが表示され、タスクは残る", async () => {
    renderBoard([todoTask]);
    fake.failNext("削除できませんでした");

    fireEvent.click(within(card("牛乳を買う")).getByRole("button", { name: "削除" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "削除する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("削除できませんでした");
    expect(card("牛乳を買う")).toBeInTheDocument();
    expect(fake.rows).toHaveLength(1);
  });
});
