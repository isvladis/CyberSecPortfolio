export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-black p-6 font-mono text-accent">
      <div className="rounded border border-accent/50 bg-black/70 p-6 text-center shadow-card-soft">
        <p lang="en" className="animate-pulse text-xs uppercase tracking-[0.24em]">Booting secure interface...</p>
      </div>
    </main>
  );
}
