"use client";

import { Lock } from "lucide-react";

export type BadgeVariant = "default" | "neutral" | "warning" | "private";

export interface BadgeProps {
  children: React.ReactNode;
  /**
   * `default`  — píldora de acento (estado, skill destacada).
   * `neutral`  — píldora apagada sobre superficie oscura (tags de stack).
   * `warning`  — píldora ámbar (excepción semántica de advertencia).
   * `private`  — etiqueta sin borde con candado, para recursos no públicos.
   */
  variant?: BadgeVariant;
  /** Icono a la izquierda del texto. La variante `private` usa un candado si no se pasa ninguno. */
  icon?: React.ReactNode;
  className?: string;
}

const BADGE_BASE = "inline-flex items-center gap-1.5 font-mono uppercase tracking-wide";

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: "rounded border border-accent px-2 py-0.5 text-[9px] text-accent",
  neutral: "rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-gray-200",
  warning: "rounded border border-yellow-500 px-2 py-0.5 text-[9px] text-yellow-500 opacity-80",
  private: "cursor-not-allowed text-[10px] font-bold text-white/55",
};

export const Badge = ({ children, variant = "default", icon, className = "" }: BadgeProps) => {
  const resolvedIcon = icon ?? (variant === "private" ? <Lock size={12} /> : null);

  return (
    <span className={`${BADGE_BASE} ${BADGE_VARIANTS[variant]} ${className}`}>
      {resolvedIcon}
      {children}
    </span>
  );
};
