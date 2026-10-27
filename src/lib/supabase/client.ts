import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Client Component から使う Supabase クライアント
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
