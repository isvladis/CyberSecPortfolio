"use client";

import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, scrollSignal]);

  useEffect(() => {
    if (placeholderMode === "loop") {
      let index = 0;
      const interval = window.setInterval(() => {
        setPlaceholder(placeholderText.substring(0, index));
        index = index >= placeholderText.length ? 0 : index + 1;
      }, 150);

      return () => window.clearInterval(interval);
    }

    const timer = window.setTimeout(
      () => {
        if (!isDeleting) {
          setPlaceholder(placeholderText.substring(0, placeholder.length + 1));
          if (placeholder === placeholderText) window.setTimeout(() => setIsDeleting(true), 1200);
          return;
        }

        setPlaceholder(placeholderText.substring(0, placeholder.length - 1));
        if (placeholder === "") setIsDeleting(false);
      },
      isDeleting ? 45 : 120,
    );

    return () => window.clearTimeout(timer);
  }, [isDeleting, placeholder, placeholderMode, placeholderText]);

  return {
    input,
    setInput,
    history,
    setHistory,
    placeholder,
    scrollRef,
    inputRef,
  };
};
