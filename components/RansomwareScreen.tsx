"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bitcoin, ShieldAlert, Terminal as TerminalIcon, X } from "lucide-react";
import { DecryptionTerminal } from "@/components/DecryptionTerminal";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export const RansomwareScreen = ({
  onSolved,
  onAbort,
  onKeyPress,
  stopAlarm,
}: {
  onSolved: () => void;
  onAbort: () => void;
  onKeyPress: () => void;
  stopAlarm: () => void;
}) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const recoveryButtonRef = useRef<HTMLButtonElement>(null);

  const handleAbort = useCallback(() => {
    stopAlarm();
    onAbort();
  }, [onAbort, stopAlarm]);

  useLockBodyScroll();
  useDialogFocusTrap({ active: true, dialogRef, initialFocusRef: recoveryButtonRef, onEscape: handleAbort });

  const handleTerminalKeyPress = () => {
    stopAlarm();
    onKeyPress();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9998] grid min-h-screen place-items-center overflow-hidden bg-red-950/20 p-4 font-mono backdrop-blur-xl md:p-10"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ransomware-screen-title"
        tabIndex={-1}
        className="scrollbar-hide relative max-h-[92vh] w-[92%] max-w-[1200px] overflow-y-auto rounded-sm border-4 border-accent bg-black/95 p-4 shadow-[0_0_60px_var(--color-accent)] md:p-6 lg:p-8"
      >
        <div className="w-full">
          <div className="mb-4 flex items-center gap-2 border-b-2 border-accent pb-3 text-accent md:mb-6 md:gap-4 md:pb-4">
            <ShieldAlert className="h-8 w-8 shrink-0 animate-pulse md:h-12 md:w-12" />
            <h1 id="ransomware-screen-title" className="text-base font-black uppercase leading-tight tracking-normal md:text-2xl lg:text-4xl">
              SISTEMA_COMPROMETIDO :: ACCESO_DENEGADO
            </h1>
          </div>

          <p className="mb-4 border border-accent/50 bg-accent/10 p-3 text-xs leading-relaxed text-red-100 md:mb-6 md:p-4 md:text-sm">
            Todos los archivos visibles en este servidor han sido cifrados utilizando un algoritmo de grado militar. Sus claves privadas han
            sido enviadas a nuestro servidor de comando y control.
            <br />
            <br />
            Para restaurar el acceso, debe realizar un pago en Bitcoin. No intente reiniciar o modificar el sistema, o las claves serán
            destruidas permanentemente.
          </p>

          <div className="mb-6 grid grid-cols-1 gap-4 border border-accent/50 bg-black p-4 text-center md:mb-8 md:grid-cols-2 md:gap-6 md:p-6">
            <div className="flex flex-col items-center gap-2 md:border-r md:border-accent/30 md:pr-6">
              <Bitcoin className="h-8 w-8 text-yellow-500 md:h-10 md:w-10" />
              <p className="text-xs uppercase text-accent/80">Dirección Pago</p>
              <p className="break-all rounded bg-white/5 p-2 text-[10px] font-bold">1BTC_TOSHIBABLADE_ENCRYPT123456789ABCDEF</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-accent md:h-10 md:w-10" />
              <p className="text-xs uppercase text-accent/80">Cantidad Requerida</p>
              <p className="text-xl font-black text-white md:text-2xl">0.81 BTC</p>
            </div>
          </div>

          <button
            ref={recoveryButtonRef}
            onClick={() => {
              setShowTerminal(true);
              onKeyPress();
            }}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent p-3 text-sm font-bold uppercase tracking-tight text-white shadow-lg transition-colors hover:bg-accent-strong active:scale-95 md:gap-3 md:p-4 md:text-lg md:tracking-[0.18em]"
          >
            <TerminalIcon className="h-5 w-5 shrink-0 md:h-6 md:w-6" />
            <span className="leading-tight">INICIAR_DESCRIPTADO_VIA_TERMINAL</span>
          </button>

          <button
            type="button"
            onClick={handleAbort}
            aria-label="ABORT_SIMULATION: abortar la simulación y volver al sitio (tecla Escape)"
            title="Abortar la simulación y volver al sitio (Escape)"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/50 bg-black/60 p-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/10 active:scale-95 md:text-xs"
          >
            <X className="h-4 w-4 shrink-0" />
            <span lang="en" className="leading-tight">ABORT_SIMULATION</span>
            <span lang="en" className="opacity-60">[ESC]</span>
          </button>
        </div>

        {showTerminal && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 w-full rounded-lg border-2 border-accent bg-accent/10 p-6 shadow-[0_0_40px_var(--color-accent)]"
          >
            <DecryptionTerminal onSolved={onSolved} onKeyPress={handleTerminalKeyPress} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
