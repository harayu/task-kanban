import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createClient } from "@/lib/supabase/server";
import Home from "@/app/page";
import { buildTask, createFakeSupabase } from "./helpers/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Home", () => {
  test("見出しと、Supabase から取得したタスクが表示される", async () => {
    const fake = createFakeSupabase([
      buildTask({ id: "task-1", title: "牛乳を買う", status: "todo" }),
      buildTask({ id: "task-2", title: "掃除をする", status: "done" }),
    ]);
    vi.mocked(createClient).mockResolvedValue(fake.client);

    render(await Home());

    expect(
      screen.getByRole("heading", { level: 1, name: "タスクカンバン" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Todo" })).getByText("牛乳を買う"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Done" })).getByText("掃除をする"),
    ).toBeInTheDocument();
  });

  test("タスクの取得に失敗するとエラーメッセージが表示され、ボードは表示されない", async () => {
    const fake = createFakeSupabase();
    fake.failNext("select failed");
    vi.mocked(createClient).mockResolvedValue(fake.client);

    render(await Home());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "タスクの取得に失敗しました: select failed",
    );
    expect(screen.queryByRole("region", { name: "Todo" })).not.toBeInTheDocument();
  });
});
