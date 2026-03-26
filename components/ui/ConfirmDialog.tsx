"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText = "Отмена",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const footer = useMemo(() => {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          disabled={busy}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          disabled={busy}
        >
          {busy ? "Сохранение..." : confirmText}
        </button>
      </div>
    );
  }, [busy, cancelText, confirmText, onClose, onConfirm]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={footer}
      disableOutsideClose
    >
      {description ? (
        <div className="text-sm text-zinc-700 dark:text-zinc-200">
          {description}
        </div>
      ) : null}
    </Modal>
  );
}

