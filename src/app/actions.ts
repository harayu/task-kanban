"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Task, TaskInput } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";

// Server Action は直接 POST でも呼べるため、クライアント側と同じ検証をここでも行う
export async function createTask(input: TaskInput): Promise<ActionResult<Task>> {
  const validated = validateTaskInput(input);
  if (!validated.ok) return validated;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(validated.data)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true, data };
}

export async function updateTask(
  id: string,
  input: TaskInput,
): Promise<ActionResult<Task>> {
  const validated = validateTaskInput(input);
  if (!validated.ok) return validated;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true, data };
}

export async function deleteTask(id: string): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true, data: id };
}
