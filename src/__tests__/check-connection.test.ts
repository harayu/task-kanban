import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { checkSupabaseConnection } from "@/lib/supabase/check-connection";

const testUrl = "https://example.supabase.co";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE", "sb_publishable_test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("Supabase が 200 を返すと接続成功として URL を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));

    await expect(checkSupabaseConnection()).resolves.toEqual({
      ok: true,
      url: testUrl,
    });
  });

  test("ヘルスチェックに publishable キーを apikey ヘッダーで送る", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await checkSupabaseConnection();

    expect(fetchMock).toHaveBeenCalledWith(
      `${testUrl}/auth/v1/health`,
      expect.objectContaining({
        headers: { apikey: "sb_publishable_test" },
      }),
    );
  });

  test("キーが不正で 401 が返ると接続失敗として HTTP ステータスを返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );

    await expect(checkSupabaseConnection()).resolves.toEqual({
      ok: false,
      reason: "HTTP 401",
    });
  });

  test("ネットワークエラーが起きると接続失敗としてエラー内容を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    await expect(checkSupabaseConnection()).resolves.toEqual({
      ok: false,
      reason: "fetch failed",
    });
  });

  test("URL が未設定だと通信せずに接続失敗を返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("publishable キーが未設定だと通信せずに接続失敗を返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
