"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => !element.hasAttribute("aria-hidden"));

export const useDialogFocusTrap = ({
  active,
  dialogRef,
  initialFocusRef,
  onEscape,
}: {
  active: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onEscape?: () => void;
}) => {
  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const target = initialFocusRef?.current ?? getFocusableElements(dialog)[0] ?? dialog;
      target.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => previouslyFocused?.focus(), 0);
    };
  }, [active, dialogRef, initialFocusRef, onEscape]);
};
