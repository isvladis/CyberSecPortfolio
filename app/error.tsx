"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-black p-6 font-mono text-accent">
      <section className="max-w-xl rounded border border-accent/50 bg-black/80 p-6 text-center shadow-card-soft">
        <h1 lang="en" className="mb-3 text-xl font-black uppercase tracking-[0.18em] text-white">SYSTEM_FAULT</h1>
        <p className="mb-5 text-sm leading-relaxed text-white/70">
          La interfaz ha detectado un fallo temporal. Puedes reintentar el arranque seguro sin recargar la página.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="border border-accent/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:bg-accent/10"
        >
          <span lang="en">Retry_Secure_Boot</span>
        </button>
      </section>
    </main>
  );
}
