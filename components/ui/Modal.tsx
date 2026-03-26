"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  disableOutsideClose?: boolean;
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  return nodes.filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  disableOutsideClose,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const content = useMemo(() => {
    if (!open) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          if (disableOutsideClose) return;
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          ref={containerRef}
          className="relative w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="min-w-0">
              {title ? (
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {title}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md border border-zinc-200 px-2 py-1 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              aria-label="Закрыть"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto p-4">{children}</div>

          {footer ? (
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    );
  }, [disableOutsideClose, children, footer, onClose, open, title]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      const focusables = getFocusableElements(root);
      if (focusables[0]) focusables[0].focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = containerRef.current;
      if (!root) return;
      const focusables = getFocusableElements(root);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!content) return null;
  return createPortal(content, document.body);
}

