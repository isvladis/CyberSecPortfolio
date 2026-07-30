"use client";

interface SectionTitleProps {
  children: React.ReactNode;
  icon: React.ReactNode;
}

export const SectionTitle = ({ children, icon }: SectionTitleProps) => (
  <div className="flex items-center gap-4">
    <div className="h-px flex-1 bg-accent/30" />
    <h2 className="flex items-center gap-2 text-center font-mono text-xs uppercase tracking-[0.24em] text-accent">
      {icon}
      {children}
    </h2>
    <div className="h-px flex-1 bg-accent/30" />
  </div>
);
