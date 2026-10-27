"use client";

import { useEffect, useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// shadcn の AlertDialog（Base UI）は開いている間ほかの要素を aria-hidden にするため、
// 背景のカードが参照できなくなる。見た目だけ AlertDialog に揃えた自前実装にしている
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // 誤操作で削除しないよう、初期フォーカスはキャンセルに置く
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/30 px-4 duration-100 fade-in-0 supports-backdrop-filter:backdrop-blur-xs">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        className="grid w-full max-w-sm animate-in gap-4 rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 fade-in-0 zoom-in-95"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
          </div>
          <div className="grid gap-1.5">
            <h2 id={titleId} className="font-heading text-base font-medium">
              {title}
            </h2>
            <p id={messageId} className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>
        </div>
        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          <Button ref={cancelButtonRef} type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
