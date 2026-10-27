import type { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type { Task } from "@/lib/tasks/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type FakeError = { message: string };
type QueryResult<T> = { data: T | null; error: FakeError | null };

// tasks テーブルだけを持つインメモリの Supabase クライアント
export function createFakeSupabase(initialRows: Task[] = []) {
  const rows: Task[] = initialRows.map((row) => ({ ...row }));
  let nextId = 1;
  let pendingError: string | null = null;

  const takeError = (): FakeError | null => {
    if (pendingError === null) return null;
    const error = { message: pendingError };
    pendingError = null;
    return error;
  };

  const result = <T>(data: T): Promise<QueryResult<T>> => {
    const error = takeError();
    return Promise.resolve(error ? { data: null, error } : { data, error: null });
  };

  const client = {
    from(table: "tasks") {
      if (table !== "tasks") throw new Error(`unknown table: ${table}`);
      return {
        select() {
          return {
            order(column: keyof Task, options: { ascending: boolean }) {
              const sorted = [...rows].sort((a, b) => {
                const order = String(a[column]).localeCompare(String(b[column]));
                return options.ascending ? order : -order;
              });
              return result(sorted);
            },
          };
        },
        insert(values: TablesInsert<"tasks">) {
          return {
            select() {
              return {
                single() {
                  const error = takeError();
                  if (error) return Promise.resolve({ data: null, error });
                  const now = new Date(Date.UTC(2026, 0, 1, 0, 0, nextId)).toISOString();
                  const row: Task = {
                    id: `inserted-${nextId++}`,
                    title: values.title,
                    description: values.description ?? "",
                    status: values.status ?? "todo",
                    created_at: now,
                    updated_at: now,
                  };
                  rows.push(row);
                  return Promise.resolve({ data: row, error: null });
                },
              };
            },
          };
        },
        update(values: TablesUpdate<"tasks">) {
          return {
            eq(column: "id", value: string) {
              return {
                select() {
                  return {
                    single() {
                      const error = takeError();
                      if (error) return Promise.resolve({ data: null, error });
                      const index = rows.findIndex((row) => row[column] === value);
                      if (index === -1) {
                        return Promise.resolve({
                          data: null,
                          error: { message: "対象のタスクが見つかりません" },
                        });
                      }
                      rows[index] = { ...rows[index], ...values };
                      return Promise.resolve({ data: rows[index], error: null });
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(column: "id", value: string) {
              const error = takeError();
              if (!error) {
                const index = rows.findIndex((row) => row[column] === value);
                if (index !== -1) rows.splice(index, 1);
              }
              return Promise.resolve({ error });
            },
          };
        },
      };
    },
  };

  return {
    client: client as unknown as SupabaseServerClient,
    rows,
    // 次の1回のクエリを失敗させる
    failNext(message: string) {
      pendingError = message;
    },
  };
}

export function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "テストタスク",
    description: "",
    status: "todo",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
