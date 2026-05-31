"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  CORRUPTED_BLOCK_FACTOR,
  CORRUPTED_BLOCK_TOTAL,
  ENCRYPTION_COMPLETE_DELAY_MS,
  ENCRYPTION_PROGRESS_INTERVAL_MS,
  ENCRYPTION_PROGRESS_STEP,
} from "@/lib/constants";

export const EncryptionOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [isClicked, setIsClicked] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll();
  useDialogFocusTrap({ active: true, dialogRef });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(timer);
          window.setTimeout(onComplete, ENCRYPTION_COMPLETE_DELAY_MS);
          return 100;
        }
        return Math.min(prev + ENCRYPTION_PROGRESS_STEP, 100);
      });
    }, ENCRYPTION_PROGRESS_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [onComplete]);

  const handlePointerClick = () => {
    setIsClicked(true);
    window.setTimeout(() => setIsClicked(false), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9998] grid min-h-screen place-items-center overflow-hidden bg-black/90 p-4 font-mono backdrop-blur-sm md:p-10"
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="encryption-overlay-title"
        tabIndex={-1}
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        onMouseDown={handlePointerClick}
        className={`relative w-[92%] max-w-[1100px] rounded-sm border-2 border-accent bg-black/95 p-4 shadow-[0_0_60px_var(--color-accent)] md:p-7 lg:p-8 ${
          isClicked ? "cursor-denied-x" : "cursor-corrupt-x"
        }`}
      >
        <div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-accent opacity-60" />
        <div className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-accent opacity-60" />
        <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-accent opacity-60" />
        <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-accent opacity-60" />

        <div className="space-y-6 text-center">
          <h2 id="encryption-overlay-title" className="text-base font-black uppercase tracking-normal text-accent animate-pulse md:text-2xl lg:text-3xl">
            &gt;_ CRITICAL SYSTEM_FAILURE
          </h2>

          <h3 className="text-xl font-bold uppercase tracking-normal text-white md:text-3xl lg:text-4xl">CIFRANDO_DATOS_SISTEMA...</h3>

          <div className="text-3xl font-extrabold uppercase tracking-[0.2em] text-accent md:text-4xl lg:text-5xl">SYSTEM</div>

          <div className="border border-dashed border-accent/30 p-2">
            <div className="animate-pulse text-lg font-semibold tracking-normal text-accent md:text-2xl">[ BREACHED ]</div>
          </div>

          <div className="space-y-2 pt-4 text-left">
            <div className="flex justify-between text-xs text-accent/70">
              <span>ESTADO_PROCESO</span>
              <span>{progress}% COMPLETO</span>
            </div>

            <div className="relative h-3 w-full overflow-hidden border border-accent/30 bg-accent/10">
              <motion.div className="h-full bg-accent shadow-[0_0_10px_var(--color-accent)]" style={{ width: `${progress}%` }} />
            </div>

            <div className="pt-1 text-[11px] text-accent opacity-80">
              &gt; BLOQUES_CORRUPTOS: {Math.floor(progress * CORRUPTED_BLOCK_FACTOR)} / {CORRUPTED_BLOCK_TOTAL}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
