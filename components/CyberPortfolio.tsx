"use client";

import { Activity, AlertTriangle, Cpu, Lock, Newspaper, ShieldCheck, Terminal } from "lucide-react";
import { CyberNewsFeed } from "@/components/CyberNewsFeed";
import { EncryptionOverlay } from "@/components/EncryptionOverlay";
import { MatrixRain } from "@/components/MatrixRain";
import { NetworkTraffic } from "@/components/NetworkTraffic";
import { ProjectCard } from "@/components/ProjectCard";
import { RansomwareScreen } from "@/components/RansomwareScreen";
import { TerminalConsole } from "@/components/TerminalConsole";
import { useAttackMachine } from "@/hooks/useAttackMachine";
import { useCyberSound } from "@/hooks/useCyberSound";
import { PROJECTS, SITE_MAX_WIDTH_CLASS } from "@/lib/constants";

export const CyberPortfolio = () => {
  const attack = useAttackMachine();
  const { phase, isAlertMode } = attack;
  const { playBeep, stopAlarm } = useCyberSound(isAlertMode);

  const mainColor = isAlertMode ? "#FF0000" : "#00FF41";
  const hasBlockingOverlay = phase !== "idle";

  return (
    <main
      data-mode={isAlertMode ? "alert" : "idle"}
      className="relative min-h-screen overflow-x-hidden bg-page-bg p-4 transition-colors duration-700 md:p-10"
    >
      <MatrixRain color={mainColor} />

      {phase === "encrypting" && <EncryptionOverlay onComplete={attack.complete} />}
      {phase === "infected" && <RansomwareScreen onSolved={attack.resolve} onKeyPress={playBeep} stopAlarm={stopAlarm} />}

      {phase === "idle" && (
        <button
          onClick={attack.begin}
          className="fixed bottom-8 right-8 z-[9999] rounded-full border-2 border-accent bg-black p-4 text-accent shadow-[0_0_10px_var(--color-accent)] transition-transform duration-300 hover:scale-105 active:scale-95"
          title="Activar protocolo de alerta"
          aria-label="Activar protocolo de alerta"
        >
          <AlertTriangle size={28} />
        </button>
      )}

      <div
        inert={hasBlockingOverlay}
        aria-hidden={hasBlockingOverlay}
        className={`relative z-10 mx-auto flex w-[92%] ${SITE_MAX_WIDTH_CLASS} flex-col gap-12 transition-all duration-700 ${
          hasBlockingOverlay ? "pointer-events-none blur-md opacity-30" : ""
        }`}
      >
        <section className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-3">
          <article className="flex flex-col justify-between rounded-lg border border-accent/50 bg-black/45 p-7 shadow-card-hero backdrop-blur-md transition-colors duration-500 md:col-span-2 md:row-span-2 md:p-8">
            <div>
              <div className="mb-4 flex items-center gap-2 text-accent">
                <Terminal size={20} />
                <span className="font-mono text-xs uppercase tracking-[0.22em] opacity-70">
                  {isAlertMode ? "Critical System Failure" : "System Status: Active"}
                </span>
              </div>
              <h1
                className={`max-w-[11ch] text-4xl font-black uppercase leading-none tracking-normal transition-colors duration-500 sm:text-5xl ${
                  isAlertMode ? "text-accent" : "text-white"
                }`}
              >
                {isAlertMode ? "System" : "Operador"}
                <br />
                <span className={isAlertMode ? "text-white" : "text-accent"}>{isAlertMode ? "Breached" : "DYSLABS_SEC"}</span>
              </h1>
            </div>
            <p className="mt-5 max-w-2xl font-mono text-sm leading-relaxed text-gray-300">
              {isAlertMode
                ? "Detección de intrusión en curso. Bloqueando puertos y cifrando copias de seguridad..."
                : "Especialista en ciberseguridad y fullstack developer. Laboratorio personal sobre hardening, redes privadas, automatización y defensa de infraestructura local."}
            </p>
          </article>

          <article className="flex h-full min-h-[250px] flex-col overflow-hidden rounded-lg border border-accent/50 bg-black/80 p-6 shadow-card-soft backdrop-blur-md transition-colors duration-500 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                <Activity size={14} className={isAlertMode ? "animate-bounce" : "animate-pulse"} />
                {isAlertMode ? "Emergency Log V1" : "Interactive Console V1"}
              </h2>
              <div className="flex gap-1.5">
                <div className={`h-2 w-2 rounded-full ${isAlertMode ? "animate-ping bg-accent" : "bg-red-900/50"}`} />
                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                <div className={`h-2 w-2 rounded-full ${isAlertMode ? "bg-white" : "bg-accent shadow-[0_0_5px_var(--color-accent)]"}`} />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <TerminalConsole onTriggerAlert={attack.begin} onKeyPress={playBeep} />
            </div>
          </article>

          <article className="rounded-lg border border-accent/50 bg-black/60 p-6 shadow-card-soft backdrop-blur-sm transition-colors duration-500">
            <Cpu className="mb-4 text-accent transition-transform hover:rotate-12" size={30} />
            <h2 className="mb-3 text-sm font-bold uppercase text-white">Stack Log</h2>
            <div className="space-y-1 font-mono text-[11px] text-accent/70">
              <p>&gt; Python</p>
              <p>&gt; Docker</p>
              <p>&gt; Nginx</p>
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-accent/50 bg-black/60 p-6 shadow-card-soft backdrop-blur-sm transition-colors duration-500">
            <div className="mb-4 flex items-center justify-between">
              <h2 className={`text-xs font-bold uppercase ${isAlertMode ? "text-accent" : "text-white"}`}>Traffic Monitor</h2>
              <div className={`h-1.5 w-1.5 rounded-full ${isAlertMode ? "animate-ping" : "animate-pulse"} bg-accent`} />
            </div>
            <NetworkTraffic isAlertMode={isAlertMode} />
          </article>

          <article
            className={`flex flex-col justify-between rounded-lg bg-accent-strong p-6 font-bold shadow-card-strong transition-colors duration-500 hover:shadow-[0_0_24px_var(--color-accent-strong)] ${
              isAlertMode ? "text-white" : "text-black"
            }`}
          >
            <ShieldCheck size={40} className={isAlertMode ? "animate-spin" : "animate-pulse"} />
            <div>
              <p className="text-[10px] uppercase opacity-70">Sec Level</p>
              <p className="text-xl font-black italic">{isAlertMode ? "COMPROMISED" : "HARDENED"}</p>
            </div>
          </article>
        </section>

        <SectionTitle icon={<Lock size={14} />}>{isAlertMode ? "Threat Analysis" : "Proyectos Auditados"}</SectionTitle>

        <section className="grid grid-cols-1 gap-7 pb-2 md:grid-cols-3">
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              desc={project.desc}
              tech={project.tech}
              repoUrl={project.repoUrl}
              demoUrl={project.demoUrl}
              status={isAlertMode ? "Deploying" : "Secure"}
            />
          ))}
        </section>

        <SectionTitle icon={<Newspaper size={14} className={isAlertMode ? "animate-bounce" : "opacity-80"} />}>
          {isAlertMode ? "News" : "Noticias CyberSec"}
        </SectionTitle>

        <CyberNewsFeed />
      </div>

      <footer
        inert={hasBlockingOverlay}
        aria-hidden={hasBlockingOverlay}
        className="relative z-10 pb-10 pt-10 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-accent opacity-60 transition-colors duration-500"
      >
        {isAlertMode ? "CRITICAL WARNING: UNAUTHORIZED ACCESS DETECTED" : "© 2026 DYSLABS_SEC // TRANSMISIÓN CIFRADA // END_OF_LINE"}
      </footer>
    </main>
  );
};

const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
  <div className="flex items-center gap-4">
    <div className="h-px flex-1 bg-accent/30" />
    <h2 className="flex items-center gap-2 text-center font-mono text-xs uppercase tracking-[0.24em] text-accent">
      {icon}
      {children}
    </h2>
    <div className="h-px flex-1 bg-accent/30" />
  </div>
);
