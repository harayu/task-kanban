import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Task } from "./types";

export async function fetchTasks(): Promise<ActionResult<Task[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
