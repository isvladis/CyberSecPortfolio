"use client";

import { useState } from "react";
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
  const current = CHALLENGES[step];

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
        window.setTimeout(onSolved, 2000);
      } else {
        const nextChallenge = CHALLENGES[step + 1];
        setStep((currentStep) => Math.min(currentStep + 1, CHALLENGES.length - 1));
        setHistory((prev) => [...prev, `> ${cmdInput}`, current.res, "------------------------------------------", `SIGUIENTE FASE: ${nextChallenge.base}`]);
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
    <div className="flex h-[380px] flex-col font-mono text-[11px] text-red-200">
      <div className="mb-3 flex items-center justify-between border-b border-accent/30 pb-2 text-accent">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="animate-pulse" />
          <span className="font-bold uppercase tracking-normal">Emergency Shell v2.1</span>
        </div>
        <span className="rounded border border-accent/50 bg-accent/10 px-2 py-0.5 text-[9px]">PASO {step + 1} / 3</span>
      </div>

      <div ref={scrollRef} className="scrollbar-hide mb-3 flex-1 space-y-1 overflow-y-auto rounded-lg border border-accent/40 bg-black/60 p-4 shadow-inner">
        {history.map((line, i) => (
          <p key={i} className={line.startsWith(">") ? "font-bold text-white" : "text-accent/80"}>
            {line}
          </p>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-b-lg border-t border-accent/30 bg-accent/10 px-3 pt-3">
        <span className="animate-pulse text-lg font-bold text-accent">$</span>
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            onKeyPress?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-none bg-transparent font-mono text-sm uppercase text-accent caret-accent outline-none placeholder:text-accent/30 [text-shadow:0_0_8px_var(--color-accent)] focus:ring-0"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
};
