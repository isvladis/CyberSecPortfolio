"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bitcoin, ShieldAlert, Terminal as TerminalIcon } from "lucide-react";
import { DecryptionTerminal } from "@/components/DecryptionTerminal";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export const RansomwareScreen = ({
  onSolved,
  onKeyPress,
  stopAlarm,
}: {
  onSolved: () => void;
  onKeyPress: () => void;
  stopAlarm: () => void;
}) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const recoveryButtonRef = useRef<HTMLButtonElement>(null);

  useLockBodyScroll();
  useDialogFocusTrap({ active: true, dialogRef, initialFocusRef: recoveryButtonRef });

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
        className="scrollbar-hide relative max-h-[92vh] w-[92%] max-w-[1200px] overflow-y-auto rounded-sm border-4 border-accent bg-black/95 p-6 shadow-[0_0_60px_var(--color-accent)] md:p-8"
      >
        <div className="w-full">
          <div className="mb-6 flex items-center gap-4 border-b-2 border-accent pb-4 text-accent">
            <ShieldAlert size={48} className="shrink-0 animate-pulse" />
            <h1 id="ransomware-screen-title" className="text-2xl font-black uppercase leading-tight tracking-normal md:text-4xl">
              SISTEMA_COMPROMETIDO :: ACCESO_DENEGADO
            </h1>
          </div>

          <p className="mb-6 border border-accent/50 bg-accent/10 p-4 text-xs leading-relaxed text-red-100 md:text-sm">
            Todos los archivos visibles en este servidor han sido cifrados utilizando un algoritmo de grado militar. Sus claves privadas han
            sido enviadas a nuestro servidor de comando y control.
            <br />
            <br />
            Para restaurar el acceso, debe realizar un pago en Bitcoin. No intente reiniciar o modificar el sistema, o las claves serán
            destruidas permanentemente.
          </p>

          <div className="mb-8 grid grid-cols-1 gap-6 border border-accent/50 bg-black p-6 text-center md:grid-cols-2">
            <div className="flex flex-col items-center gap-2 md:border-r md:border-accent/30 md:pr-6">
              <Bitcoin size={40} className="text-yellow-500" />
              <p className="text-xs uppercase text-accent/80">Dirección Pago</p>
              <p className="break-all rounded bg-white/5 p-2 text-[10px] font-bold">1BTC_TOSHIBABLADE_ENCRYPT123456789ABCDEF</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldAlert size={40} className="text-accent" />
              <p className="text-xs uppercase text-accent/80">Cantidad Requerida</p>
              <p className="text-2xl font-black text-white">0.81 BTC</p>
            </div>
          </div>

          <button
            ref={recoveryButtonRef}
            onClick={() => {
              setShowTerminal(true);
              onKeyPress();
            }}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg bg-accent p-4 text-lg font-bold uppercase tracking-[0.18em] text-white shadow-lg transition-colors hover:bg-accent-strong active:scale-95"
          >
            <TerminalIcon size={24} /> INICIAR_DESCRIPTADO_VIA_TERMINAL
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
