"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type TerminalSessionOptions = {
  initialHistory: string[];
  placeholderText: string;
  placeholderMode?: "typewriter" | "loop";
  autoFocus?: boolean;
  scrollSignal?: unknown;
};

export const useTerminalSession = ({
  initialHistory,
  placeholderText,
  placeholderMode = "typewriter",
  autoFocus = false,
  scrollSignal,
}: TerminalSessionOptions) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(initialHistory);
  const [placeholder, setPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, scrollSignal]);

  useEffect(() => {
    // Los dos modos de placeholder se animan desde JS, así que el override global de
    // `prefers-reduced-motion` de globals.css —que solo neutraliza animaciones/transiciones CSS—
    // no los alcanza. Con movimiento reducido no se arranca ningún timer y el valor devuelto es
    // directamente el texto completo (ver el `return` del hook), sin animación que corregir.
    if (reducedMotion) return;

    if (placeholderMode === "loop") {
      let index = 0;
      const interval = window.setInterval(() => {
        setPlaceholder(placeholderText.substring(0, index));
        index = index >= placeholderText.length ? 0 : index + 1;
      }, 150);

      return () => window.clearInterval(interval);
    }

    // La pausa al llegar al final se programa desde dentro del timer, así que necesita su propia
    // referencia: sin cancelarla, desmontar durante esos 1200ms dejaba un timeout vivo.
    let pauseTimer = 0;

    const timer = window.setTimeout(
      () => {
        if (!isDeleting) {
          setPlaceholder(placeholderText.substring(0, placeholder.length + 1));
          if (placeholder === placeholderText) pauseTimer = window.setTimeout(() => setIsDeleting(true), 1200);
          return;
        }

        setPlaceholder(placeholderText.substring(0, placeholder.length - 1));
        if (placeholder === "") setIsDeleting(false);
      },
      isDeleting ? 45 : 120,
    );

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(pauseTimer);
    };
  }, [isDeleting, placeholder, placeholderMode, placeholderText, reducedMotion]);

  return {
    input,
    setInput,
    history,
    setHistory,
    placeholder: reducedMotion ? placeholderText : placeholder,
    scrollRef,
    inputRef,
  };
};
