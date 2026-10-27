import type { Database } from "@/lib/supabase/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const TASK_STATUSES: readonly { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
