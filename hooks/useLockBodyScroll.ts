"use client";

import { useEffect } from "react";

export const useLockBodyScroll = (active = true) => {
  useEffect(() => {
    if (!active) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
};
