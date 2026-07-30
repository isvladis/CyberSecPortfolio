"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { useTerminalSession } from "@/hooks/useTerminalSession";

interface DecryptionProps {
  onSolved: () => void;
  onKeyPress?: () => void;
}

const CHALLENGES = [
  {
    base: "brute.sh",
    full: "brute.sh --target hash_lib.dll --mode quick",
    res: "[SYS] Vulnerabilidad DLL_Hijacking encontrada. Hash de sesión: 0xAF32",
  },
  {
    base: "decrypt.bin",
    full: "decrypt.bin --keyfile decryption_key.pem --verbose",
    res: "[SYS] Clave RSA-4096 verificada. Sectores de memoria liberados.",
  },
  {
    base: "restore_all",
    full: "restore_all --confirm_cyber_ops --force",
    res: "SUCCESS",
  },
];

export const DecryptionTerminal = ({ onSolved, onKeyPress }: DecryptionProps) => {
  const [step, setStep] = useState(0);
  const solveTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { input, setInput, history, setHistory, placeholder, scrollRef } = useTerminalSession({
    initialHistory: [
      "SISTEMA_RECUPERACION_V1.0 // NUCLEO_TOSHIBA",
      "------------------------------------------",
      "ERROR: DATOS_CIFRADOS. SE REQUIERE INTERVENCIÓN MANUAL.",
      "AYUDA: use [TAB] para autocompletar o añada '?' al final.",
      "---",
      "PASO 1: escanee el sistema. (Comando: brute.sh)",
    ],
    placeholderText: "Introducir comando de recuperación...",
    placeholderMode: "loop",
  });
  // step nace en 0 y solo se actualiza vía Math.min(_, CHALLENGES.length - 1) más abajo,
  // así que siempre es un índice válido dentro de CHALLENGES (array no vacío y constante).
  const current = CHALLENGES[step]!;

  useEffect(() => {
    inputRef.current?.focus();

    return () => {
      if (solveTimeoutRef.current !== null) window.clearTimeout(solveTimeoutRef.current);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      if (input.toLowerCase().startsWith(current.base.substring(0, 3))) {
        onKeyPress?.();
        setInput(current.full);
      }
    }

    if (event.key !== "Enter") return;

    onKeyPress?.();
    const cmdInput = input.trim();
    if (cmdInput === "") return;

    if (cmdInput.endsWith("?")) {
      setHistory((prev) => [...prev, `> ${cmdInput}`, `SINTAXIS_REQUERIDA: ${current.full}`]);
      setInput("");
      return;
    }

    if (cmdInput === current.full) {
      if (current.res === "SUCCESS") {
        setHistory((prev) => [...prev, `> ${cmdInput}`, "[SYS] RECONSTRUYENDO TABLA DE PARTICIONES...", "[SYS] STATUS: OK. REINICIANDO..."]);
        solveTimeoutRef.current = window.setTimeout(onSolved, 2000);
      } else {
        const nextStep = Math.min(step + 1, CHALLENGES.length - 1);
        const nextChallenge = CHALLENGES[nextStep];
        setStep(nextStep);
        setHistory((prev) => [
          ...prev,
          `> ${cmdInput}`,
          current.res,
          "------------------------------------------",
          nextChallenge ? `SIGUIENTE FASE: ${nextChallenge.base}` : "SIGUIENTE FASE: desconocida",
        ]);
      }
    } else {
      setHistory((prev) => [
        ...prev,
        `> ${cmdInput}`,
        "ERR: comando incompleto o parámetros inválidos.",
        `TIP: use '${current.base} ?' para ver la sintaxis completa.`,
      ]);
    }

    setInput("");
  };

  return (
    <div className="flex h-[280px] flex-col font-mono text-[11px] text-red-200 md:h-[380px]">
      <div className="mb-3 flex items-center justify-between border-b border-accent/30 pb-2 text-accent">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="animate-pulse" />
          <span className="font-bold uppercase tracking-normal">Emergency Shell v2.1</span>
        </div>
        <span className="rounded border border-accent/50 bg-accent/10 px-2 py-0.5 text-[9px]">PASO {step + 1} / 3</span>
      </div>

      {/* Igual que en TerminalConsole: sin `role="log"` + `aria-live` el resultado de cada comando
          (incluido el que resuelve el puzzle) no se anunciaba de ninguna forma. */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Salida de la shell de recuperación"
        className="scrollbar-hide mb-3 flex-1 space-y-1 overflow-y-auto rounded-lg border border-accent/40 bg-black/60 p-2 shadow-inner md:p-4"
      >
        {history.map((line, i) => (
          <p key={i} className={line.startsWith(">") ? "font-bold text-white" : "text-accent/80"}>
            {line}
          </p>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-b-lg border-t border-accent/30 bg-accent/10 px-3 pt-3">
        <span className="animate-pulse text-lg font-bold text-accent">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            onKeyPress?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          // El placeholder es animado y no sirve como etiqueta accesible: sin `aria-label` este era
          // un campo sin nombre. El contraste sube de /30 (~2:1) a /60 para cumplir AA.
          aria-label="Comando de recuperación"
          className="flex-1 border-none bg-transparent font-mono text-sm uppercase text-accent caret-accent outline-none placeholder:text-accent/60 [text-shadow:0_0_8px_var(--color-accent)] focus:ring-0"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
};
