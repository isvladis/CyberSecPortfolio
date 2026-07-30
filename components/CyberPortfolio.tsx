"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "framer-motion";
import { Activity, AlertTriangle, FileText, Lock, Newspaper, Server, Terminal } from "lucide-react";
import { CyberNewsFeed } from "@/components/CyberNewsFeed";
import { EncryptionOverlay } from "@/components/EncryptionOverlay";
import { HomelabExperience } from "@/components/HomelabExperience";
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
/**
 * lucide-react dejó de incluir logos de marca (Github/Linkedin) hace un tiempo — se resuelven
 * como SVG inline propios en vez de depender de un paquete de iconos de marca aparte.
 */
const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const LinkedinIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);

const HERO_HIGHLIGHTS = [
  "Hardening de infraestructura y redes",
  "Automatización con IA (vibecoding)",
  "Arquitectura fullstack",
  "Análisis y respuesta a incidentes",
];

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
                <span lang="en" className="font-mono text-xs uppercase tracking-[0.22em] opacity-70">
                  {isAlertMode ? "Critical System Failure" : "System Status: Active"}
                </span>
              </div>
              <h1
                lang={isAlertMode ? "en" : undefined}
                className={`max-w-[11ch] font-mono text-4xl font-black uppercase leading-none tracking-wide transition-colors duration-500 sm:text-5xl ${
                  isAlertMode ? "text-accent" : "text-matrix-bright"
                }`}
              >
                {isAlertMode ? "System" : "Operador"}
                <br />
                <span className={isAlertMode ? "text-white" : "text-accent"}>{isAlertMode ? "Breached" : "DYSLABS_SEC"}</span>
              </h1>
            </div>

            {!isAlertMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="my-2 flex justify-center"
              >
                {/*
                  logo.png (versión actual, verificada con sharp) SÍ tiene transparencia real —
                  canal alfa variable, no 100% opaco como la versión anterior — así que va directo
                  sobre el fondo negro del card, sin placa. Solo un glow sutil en el token de
                  acento para integrarlo con el resto de los brillos del sitio.
                */}
                <Image
                  src="/images/logo.png"
                  alt="Logo de DYSLABS_SEC"
                  width={112}
                  height={128}
                  className="h-auto w-28 drop-shadow-[0_0_12px_var(--color-accent)]"
                />
              </motion.div>
            )}

            <div className="mt-5">
              {!isAlertMode && (
                <div className="mb-4 space-y-1 font-mono text-[11px] text-accent/70">
                  {HERO_HIGHLIGHTS.map((item) => (
                    <p key={item}>&gt; {item}</p>
                  ))}
                </div>
              )}

              <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
                {isAlertMode
                  ? "Detección de intrusión en curso. Bloqueando puertos y cifrando copias de seguridad..."
                  : "Especialista en ciberseguridad y desarrollador fullstack. Diseño arquitectura, tomo las decisiones técnicas y reviso cada implementación, apoyándome en herramientas de IA para la escritura del código. Laboratorio personal sobre hardening, redes privadas, automatización y defensa de infraestructura local."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openDossier}
                  onPointerEnter={preloadDossier}
                  onFocus={preloadDossier}
                  aria-label="ACCEDER_DOSSIER: abrir el dossier profesional completo del operador"
                  title="Abrir el dossier profesional completo"
                  className="inline-flex items-center gap-2 rounded border border-accent/60 bg-accent/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:bg-accent hover:text-black active:scale-95"
                >
                  <FileText size={14} aria-hidden="true" />
                  ACCEDER_DOSSIER
                </button>

                <a
                  href="https://github.com/isvladis"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GITHUB: abrir el perfil de GitHub del operador en una pestaña nueva"
                  title="Abrir el perfil de GitHub"
                  className="inline-flex items-center gap-1.5 rounded border border-accent/50 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:bg-accent hover:text-black active:scale-95"
                >
                  <GithubIcon size={14} />
                  GitHub
                </a>

                <a
                  href="https://www.linkedin.com/in/vladischernov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LINKEDIN: abrir el perfil de LinkedIn del operador en una pestaña nueva"
                  title="Abrir el perfil de LinkedIn"
                  className="inline-flex items-center gap-1.5 rounded border border-accent/50 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:bg-accent hover:text-black active:scale-95"
                >
                  <LinkedinIcon size={14} />
                  LinkedIn
                </a>
              </div>
            </div>
          </article>

          <article className="flex h-full min-h-[250px] flex-col overflow-hidden rounded-lg border border-accent/50 bg-black/80 p-6 shadow-card-soft backdrop-blur-md transition-colors duration-500 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 lang="en" className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
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

          <Card className="flex h-full flex-col overflow-hidden p-6">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 lang="en" className={`font-mono text-xs font-bold uppercase tracking-wide ${isAlertMode ? "text-accent" : "text-matrix-bright"}`}>
                Traffic Monitor
              </h2>
              <div className={`h-1.5 w-1.5 rounded-full ${isAlertMode ? "animate-ping" : "animate-pulse"} bg-accent`} />
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <NetworkTraffic isAlertMode={isAlertMode} />
            </div>
          </Card>
        </section>

        <SectionTitle icon={<Lock size={14} />}>
          {isAlertMode ? <span lang="en">Threat Analysis</span> : "Proyectos Auditados"}
        </SectionTitle>

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

        <SectionTitle icon={<Server size={14} />}>
          {isAlertMode ? <span lang="en">Infra Log</span> : "Laboratorio Homelab"}
        </SectionTitle>

        <HomelabExperience isAlertMode={isAlertMode} />

        <SectionTitle icon={<Newspaper size={14} className={isAlertMode ? "animate-bounce" : "opacity-80"} />}>
          {isAlertMode ? <span lang="en">News</span> : "Noticias CyberSec"}
        </SectionTitle>

        <CyberNewsFeed />
      </div>

      <footer
        inert={hasBlockingOverlay}
        aria-hidden={hasBlockingOverlay}
        className="relative z-10 pb-10 pt-10 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-accent opacity-60 transition-colors duration-500"
      >
        {isAlertMode ? (
          <span lang="en">CRITICAL WARNING: UNAUTHORIZED ACCESS DETECTED</span>
        ) : (
          "© 2026 DYSLABS_SEC // TRANSMISIÓN CIFRADA // END_OF_LINE"
        )}
      </footer>
    </main>
    </MotionConfig>
  );
};
