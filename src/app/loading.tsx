import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <p className="text-sm text-muted-foreground">読み込み中...</p>
      <Skeleton className="h-64 w-full max-w-xl rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
