"use client";

export interface CardProps {
  children: React.ReactNode;
  /** Clases de layout propias de cada uso (padding, span de grid, overflow...). */
  className?: string;
}

const CARD_BASE = "rounded-lg border border-accent/50 bg-black/60 shadow-card-soft backdrop-blur-sm transition-colors duration-500";

export const Card = ({ children, className = "" }: CardProps) => <article className={`${CARD_BASE} ${className}`}>{children}</article>;
