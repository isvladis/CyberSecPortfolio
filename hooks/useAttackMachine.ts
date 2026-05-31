"use client";

import { useCallback, useState } from "react";

export type AttackPhase = "idle" | "encrypting" | "infected";

export type AttackMachine = {
  phase: AttackPhase;
  isAlertMode: boolean;
  begin: () => void;
  complete: () => void;
  resolve: () => void;
};

export const useAttackMachine = (): AttackMachine => {
  const [phase, setPhase] = useState<AttackPhase>("idle");

  const begin = useCallback(() => {
    setPhase((p) => (p === "idle" ? "encrypting" : p));
  }, []);

  const complete = useCallback(() => {
    setPhase((p) => (p === "encrypting" ? "infected" : p));
  }, []);

  const resolve = useCallback(() => {
    setPhase((p) => (p === "infected" ? "idle" : p));
  }, []);

  return {
    phase,
    isAlertMode: phase !== "idle",
    begin,
    complete,
    resolve,
  };
};
