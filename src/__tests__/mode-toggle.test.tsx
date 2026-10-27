import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ModeToggle } from "@/components/ModeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";

function stubPrefersDark(prefersDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: prefersDark && query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function renderToggle() {
  render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ModeToggle />
    </ThemeProvider>,
  );
}

async function selectTheme(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "テーマを切り替え" }));
  fireEvent.click(await screen.findByRole("menuitem", { name }));
}

const htmlClassList = () => document.documentElement.classList;

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
});

describe("ModeToggle", () => {
  test("初期状態（システム）で OS がダークモードなら html に dark クラスが付く", async () => {
    stubPrefersDark(true);
    renderToggle();

    await waitFor(() => expect(htmlClassList()).toContain("dark"));
  });

  test("初期状態（システム）で OS がライトモードなら html に dark クラスが付かない", async () => {
    stubPrefersDark(false);
    renderToggle();

    await waitFor(() => expect(htmlClassList()).toContain("light"));
    expect(htmlClassList()).not.toContain("dark");
  });

  test("ダークを選ぶと html に dark クラスが付き、選択が保存される", async () => {
    stubPrefersDark(false);
    renderToggle();

    await selectTheme("ダーク");

    await waitFor(() => expect(htmlClassList()).toContain("dark"));
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("ダークからライトに戻すと html から dark クラスが外れる", async () => {
    stubPrefersDark(false);
    renderToggle();
    await selectTheme("ダーク");
    await waitFor(() => expect(htmlClassList()).toContain("dark"));

    await selectTheme("ライト");

    await waitFor(() => expect(htmlClassList()).not.toContain("dark"));
    expect(localStorage.getItem("theme")).toBe("light");
  });

  test("ライトからシステムに戻すと OS の設定（ダーク）に従う", async () => {
    stubPrefersDark(true);
    renderToggle();
    await selectTheme("ライト");
    await waitFor(() => expect(htmlClassList()).not.toContain("dark"));

    await selectTheme("システム");

    await waitFor(() => expect(htmlClassList()).toContain("dark"));
    expect(localStorage.getItem("theme")).toBe("system");
  });

  test("保存済みのテーマ（ダーク）があれば OS がライトでも dark クラスが付く", async () => {
    stubPrefersDark(false);
    localStorage.setItem("theme", "dark");
    renderToggle();

    await waitFor(() => expect(htmlClassList()).toContain("dark"));
  });
});
