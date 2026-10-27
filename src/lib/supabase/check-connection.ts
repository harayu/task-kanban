import { getSupabaseEnv } from "./env";

export type ConnectionResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

// Supabase Auth のヘルスチェックエンドポイントで URL とキーの両方を検証する
export async function checkSupabaseConnection(): Promise<ConnectionResult> {
  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = getSupabaseEnv());
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    return { ok: true, url };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}
