"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "framer-motion";
import { Activity, AlertTriangle, FileText, Lock, Newspaper, Terminal } from "lucide-react";
import { CyberNewsFeed } from "@/components/CyberNewsFeed";
import { EncryptionOverlay } from "@/components/EncryptionOverlay";
import { MatrixRain } from "@/components/MatrixRain";
import { NetworkTraffic } from "@/components/NetworkTraffic";
import { ProjectCard } from "@/components/ProjectCard";
import { StackLog } from "@/components/StackLog";
import { TerminalConsole } from "@/components/TerminalConsole";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useAttackMachine } from "@/hooks/useAttackMachine";
import { useCyberSound } from "@/hooks/useCyberSound";
import { PROJECTS, SITE_MAX_WIDTH_CLASS } from "@/lib/constants";
import { THEME_COLORS } from "@/lib/theme";

/**
 * Los dos overlays más pesados salen del bundle inicial: ninguno se monta hasta que el usuario hace
 * algo explícito (abrir el dossier / disparar el protocolo de alerta), y entre los dos arrastran
 * todo `lib/cv.ts`, `DecryptionTerminal` y una docena larga de iconos. `ssr: false` porque solo
 * existen tras una interacción: no hay nada que prerenderizar.
 *
 * Las funciones de import se nombran aparte para poder reusarlas como precarga: `dynamic()` no pide
 * el chunk hasta el primer render del componente, así que sin precargar, el overlay aparecería en
 * blanco mientras se descarga. Se disparan en el momento en que se sabe que va a hacer falta —
 * `EncryptionOverlay` (que sí va en el bundle principal) da ~2,7s de margen antes del ransomware, y
 * el hover/focus del botón da el suyo antes del dossier.
 */
const importCvReport = () => import("@/components/CvReport");
const importRansomwareScreen = () => import("@/components/RansomwareScreen");

const CvReport = dynamic(() => importCvReport().then((mod) => mod.CvReport), { ssr: false });
const RansomwareScreen = dynamic(() => importRansomwareScreen().then((mod) => mod.RansomwareScreen), { ssr: false });

export const CyberPortfolio = () => {
  const attack = useAttackMachine();
  const { phase, isAlertMode, begin } = attack;
  const { playBeep, stopAlarm } = useCyberSound(isAlertMode);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const openDossier = useCallback(() => setIsDossierOpen(true), []);
  const closeDossier = useCallback(() => setIsDossierOpen(false), []);
  /** Warm-up del chunk del dossier al apuntarlo, antes de que llegue el click. */
  const preloadDossier = useCallback(() => void importCvReport(), []);

  /** Arranca la simulación y, en el mismo gesto, pide el chunk del overlay que viene después. */
  const beginAttack = useCallback(() => {
    void importRansomwareScreen();
    begin();
  }, [begin]);

  const mainColor = isAlertMode ? THEME_COLORS.accentAlert : THEME_COLORS.matrixGreen;
  const hasBlockingOverlay = phase !== "idle";

  return (
    <MotionConfig reducedMotion="user">
    <main
      id="site-root"
      data-mode={isAlertMode ? "alert" : "idle"}
      className="relative min-h-screen overflow-x-hidden bg-page-bg p-4 transition-colors duration-700 md:p-10"
    >
      <MatrixRain color={mainColor} />

      {phase === "encrypting" && <EncryptionOverlay onComplete={attack.complete} />}
      {phase === "infected" && (
        <RansomwareScreen onSolved={attack.resolve} onAbort={attack.abort} onKeyPress={playBeep} stopAlarm={stopAlarm} />
      )}

      {isDossierOpen && <CvReport onClose={closeDossier} />}

      {phase === "idle" && (
        <button
          onClick={beginAttack}
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
        <section className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
          <article className="flex flex-col justify-between rounded-lg border border-accent/50 bg-black/45 p-7 shadow-card-hero backdrop-blur-md transition-colors duration-500 md:col-span-2 md:row-span-2 md:p-8">
            <div>
              <div className="mb-4 flex items-center gap-2 text-accent">
                <Terminal size={20} />
                <span className="font-mono text-xs uppercase tracking-[0.22em] opacity-70">
                  {isAlertMode ? "Critical System Failure" : "System Status: Active"}
                </span>
              </div>
              <h1
                className={`max-w-[11ch] font-mono text-4xl font-black uppercase leading-none tracking-wide transition-colors duration-500 sm:text-5xl ${
                  isAlertMode ? "text-accent" : "text-matrix-bright"
                }`}
              >
                {isAlertMode ? "System" : "Operador"}
                <br />
                <span className={isAlertMode ? "text-white" : "text-accent"}>{isAlertMode ? "Breached" : "DYSLABS_SEC"}</span>
              </h1>
            </div>
            <div className="mt-5">
              <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
                {isAlertMode
                  ? "Detección de intrusión en curso. Bloqueando puertos y cifrando copias de seguridad..."
                  : "Especialista en ciberseguridad y fullstack developer. Laboratorio personal sobre hardening, redes privadas, automatización y defensa de infraestructura local."}
              </p>

              <button
                type="button"
                onClick={openDossier}
                onPointerEnter={preloadDossier}
                onFocus={preloadDossier}
                aria-label="ACCEDER_DOSSIER: abrir el dossier profesional completo del operador"
                title="Abrir el dossier profesional completo"
                className="mt-6 inline-flex items-center gap-2 rounded border border-accent/60 bg-accent/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:bg-accent hover:text-black active:scale-95"
              >
                <FileText size={14} aria-hidden="true" />
                ACCEDER_DOSSIER
              </button>
            </div>
          </article>

          <article className="flex h-full min-h-[250px] flex-col overflow-hidden rounded-lg border border-accent/50 bg-black/80 p-6 shadow-card-soft backdrop-blur-md transition-colors duration-500 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                <Activity size={14} className={isAlertMode ? "animate-bounce" : "animate-pulse"} />
                {isAlertMode ? "Emergency Log V1" : "Interactive Console V1"}
              </h2>
              <div aria-hidden="true" className="flex gap-1.5">
                <div className={`h-2 w-2 rounded-full ${isAlertMode ? "animate-ping bg-accent" : "bg-red-900/50"}`} />
                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                <div className={`h-2 w-2 rounded-full ${isAlertMode ? "bg-white" : "bg-accent shadow-[0_0_5px_var(--color-accent)]"}`} />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <TerminalConsole onTriggerAlert={beginAttack} onKeyPress={playBeep} />
            </div>
          </article>

          <StackLog isAlertMode={isAlertMode} />

          <Card className="overflow-hidden p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className={`font-mono text-xs font-bold uppercase tracking-wide ${isAlertMode ? "text-accent" : "text-matrix-bright"}`}>
                Traffic Monitor
              </h2>
              <div className={`h-1.5 w-1.5 rounded-full ${isAlertMode ? "animate-ping" : "animate-pulse"} bg-accent`} />
            </div>
            <NetworkTraffic isAlertMode={isAlertMode} />
          </Card>
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
    </MotionConfig>
  );
};
