"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ALERT_MODE_LEAD_MS } from "@/lib/constants";

export type AttackPhase = "idle" | "alerting" | "encrypting" | "infected";

export type AttackMachine = {
  phase: AttackPhase;
  isAlertMode: boolean;
  begin: () => void;
  complete: () => void;
  resolve: () => void;
  abort: () => void;
};

export const useAttackMachine = (): AttackMachine => {
  const [phase, setPhase] = useState<AttackPhase>("idle");
  const leadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leadTimeoutRef.current !== null) window.clearTimeout(leadTimeoutRef.current);
    };
  }, []);

  /**
   * `begin()` activa el modo alerta ("alerting") de inmediato, pero pospone la fase "encrypting"
   * (la que dispara `EncryptionOverlay`) `ALERT_MODE_LEAD_MS`: le da tiempo al usuario a ver el
   * panel en rojo (StackLog en NODE_UNREACHABLE, MatrixRain, etc.) antes de que el overlay lo tape.
   */
  const begin = useCallback(() => {
    setPhase((p) => {
      if (p !== "idle") return p;

      leadTimeoutRef.current = window.setTimeout(() => {
        leadTimeoutRef.current = null;
        setPhase((current) => (current === "alerting" ? "encrypting" : current));
      }, ALERT_MODE_LEAD_MS);

      return "alerting";
    });
  }, []);

  const complete = useCallback(() => {
    setPhase((p) => (p === "encrypting" ? "infected" : p));
  }, []);

  const resolve = useCallback(() => {
    setPhase((p) => (p === "infected" ? "idle" : p));
  }, []);

  /** Salida de emergencia: cancela la simulación desde cualquier fase (Escape / botón de abortar). */
  const abort = useCallback(() => {
    if (leadTimeoutRef.current !== null) {
      window.clearTimeout(leadTimeoutRef.current);
      leadTimeoutRef.current = null;
    }
    setPhase("idle");
  }, []);

  return {
    phase,
    isAlertMode: phase !== "idle",
    begin,
    complete,
    resolve,
    abort,
  };
};
