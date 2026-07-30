"use client";

import { motion, stagger } from "framer-motion";
import type { Variants } from "framer-motion";
import { createPortal } from "react-dom";
import { Award, BadgeCheck, Briefcase, ExternalLink, FileText, GraduationCap, Languages, ShieldCheck, Wrench, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useOverlayDialog } from "@/hooks/useOverlayDialog";
import { SITE_MAX_WIDTH_CLASS } from "@/lib/constants";
import { CV_DATA } from "@/lib/cv";
import type { Certification, EducationEntry, Experience } from "@/lib/cv";

/**
 * Cascada de "informe imprimiéndose": las secciones caen de arriba hacia abajo.
 * Con 7 bloques el total queda en ~0.9s (delay + 6 × stagger + duración), rápido pero legible.
 *
 * Solo se animan `opacity` y `y`, así que el `MotionConfig reducedMotion="user"` de
 * `CyberPortfolio` degrada esto a un fundido sin desplazamiento por sí solo.
 */
const PANEL_DURATION_S = 0.25;
const SECTIONS_DELAY_S = 0.1;
const SECTION_STAGGER_S = 0.08;
const SECTION_DURATION_S = 0.3;

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: PANEL_DURATION_S,
      ease: "easeOut",
      // `staggerChildren` está deprecado en framer-motion 12 en favor de `stagger()`.
      delayChildren: stagger(SECTION_STAGGER_S, { startDelay: SECTIONS_DELAY_S }),
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: { opacity: 1, y: 0, transition: { duration: SECTION_DURATION_S, ease: "easeOut" } },
};

const CvSection = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <motion.section variants={sectionVariants} className="flex flex-col gap-5">
    <SectionTitle icon={icon}>{title}</SectionTitle>
    {children}
  </motion.section>
);

const EntryHeader = ({ title, org, meta }: { title: string; org: string; meta: string }) => (
  <>
    <h3 className="font-mono text-sm font-bold uppercase leading-snug tracking-wide text-white md:text-base">{title}</h3>
    <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{org}</p>
    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">{meta}</p>
  </>
);

const ExperienceCard = ({ entry }: { entry: Experience }) => (
  <Card className="flex h-full flex-col p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <EntryHeader title={entry.role} org={entry.org} meta={`${entry.period} · ${entry.location}`} />
      </div>
      <Badge variant={entry.kind === "technical" ? "default" : "neutral"} className="shrink-0 tracking-[0.16em]">
        {entry.kind === "technical" ? "TECHNICAL_ROLE" : "SOFT_SKILLS"}
      </Badge>
    </div>

    <p className="mt-4 text-sm leading-relaxed text-gray-300">{entry.summary}</p>

    <ul className="mt-4 space-y-1.5 border-l border-accent/30 pl-4 font-mono text-xs leading-relaxed text-gray-300">
      {entry.highlights.map((highlight) => (
        <li key={highlight} className="flex gap-2">
          <span className="text-accent" aria-hidden="true">
            &gt;
          </span>
          <span>{highlight}</span>
        </li>
      ))}
    </ul>
  </Card>
);

const EducationCard = ({ entry }: { entry: EducationEntry }) => (
  <Card className="flex h-full flex-col p-6">
    <EntryHeader title={entry.title} org={entry.org} meta={entry.grade ? `${entry.period} · NOTA_FINAL ${entry.grade}` : entry.period} />

    {entry.description && <p className="mt-4 text-sm leading-relaxed text-gray-300">{entry.description}</p>}

    {entry.modules && (
      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-accent/70">Modulos_Clave</p>
        <div className="flex flex-wrap gap-1.5">
          {entry.modules.map((moduleName) => (
            <Badge key={moduleName} variant="neutral">
              {moduleName}
            </Badge>
          ))}
        </div>
      </div>
    )}
  </Card>
);

/** `in-progress` manda sobre `featured`: el estado real de la insignia no se puede maquillar. */
const certificationBadgeVariant = (cert: Certification): BadgeVariant => {
  if (cert.status === "in-progress") return "warning";
  return cert.featured ? "default" : "neutral";
};

const CertificationRow = ({ cert }: { cert: Certification }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
    <div className="flex min-w-0 items-center gap-3">
      {cert.featured ? (
        <BadgeCheck size={16} className="shrink-0 text-accent" aria-hidden="true" />
      ) : (
        <Award size={14} className="shrink-0 text-accent/50" aria-hidden="true" />
      )}
      {cert.credlyUrl ? (
        <a
          href={cert.credlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex min-w-0 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:text-white hover:underline ${
            cert.featured ? "font-bold text-matrix-bright" : "text-gray-300"
          }`}
        >
          <span className="truncate">
            {cert.issuer} {cert.name}
          </span>
          <ExternalLink size={11} className="shrink-0 opacity-70" aria-hidden="true" />
        </a>
      ) : (
        <span
          className={`font-mono text-xs uppercase tracking-[0.14em] ${cert.featured ? "font-bold text-matrix-bright" : "text-gray-300"}`}
        >
          {cert.issuer} {cert.name}
        </span>
      )}
    </div>

    <Badge variant={certificationBadgeVariant(cert)} className="shrink-0 tracking-[0.16em]">
      {cert.status === "in-progress" ? "EN_CURSO" : (cert.year ?? "CERTIFICADO")}
    </Badge>
  </li>
);

export const CvReport = ({ onClose }: { onClose: () => void }) => {
  const { dialogRef, closeButtonRef } = useOverlayDialog(onClose);

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[99999] grid min-h-screen place-items-center bg-black/45 p-3 font-mono backdrop-blur-[2px] md:p-8"
      onMouseDown={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-report-title"
        tabIndex={-1}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className={`relative flex max-h-[92vh] w-[96%] ${SITE_MAX_WIDTH_CLASS} flex-col overflow-hidden rounded-sm border-2 border-accent/50 bg-black/95 shadow-[0_0_50px_rgba(0,0,0,0.9)]`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-accent/50 bg-black px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 border border-accent/60 p-1 text-accent">
              <FileText size={18} aria-hidden="true" />
            </div>
            <h2 id="cv-report-title" className="min-w-0 truncate font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent md:text-sm">
              <span className="mr-2 hidden opacity-70 sm:inline">[DOSSIER_MODE]:</span>
              OPERADOR_{CV_DATA.codename}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="CERRAR_DOSSIER: cerrar el dossier y volver al sitio (tecla Escape)"
            title="Cerrar el dossier y volver al sitio (Escape)"
            className="flex shrink-0 items-center gap-2 border border-accent/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-white/10 active:scale-95"
          >
            <X size={16} aria-hidden="true" />
            <span className="hidden md:inline">CERRAR_DOSSIER</span>
            <span className="opacity-60" aria-hidden="true">
              [ESC]
            </span>
          </button>
        </div>

        {/* `tabIndex` hace la zona con scroll alcanzable por teclado, para poder recorrerla con las flechas. */}
        <div
          tabIndex={0}
          aria-label="Contenido del dossier"
          className="custom-scrollbar flex-1 overflow-y-auto bg-black p-5 md:p-8"
        >
          <div className="flex flex-col gap-10">
            <CvSection icon={<ShieldCheck size={14} />} title="Resumen_Ejecutivo">
              <Card className="p-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-accent/70">{CV_DATA.role}</p>
                <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-200 md:text-base">{CV_DATA.summary}</p>
              </Card>
            </CvSection>

            <CvSection icon={<Briefcase size={14} />} title="Experiencia_Operacional">
              <div className="grid gap-4 lg:grid-cols-2">
                {CV_DATA.experience.map((entry) => (
                  <ExperienceCard key={`${entry.org}-${entry.role}`} entry={entry} />
                ))}
              </div>
            </CvSection>

            <CvSection icon={<GraduationCap size={14} />} title="Formacion_Tecnica">
              <div className="grid gap-4 lg:grid-cols-2">
                {CV_DATA.education.map((entry) => (
                  <EducationCard key={`${entry.org}-${entry.title}`} entry={entry} />
                ))}
              </div>
            </CvSection>

            <CvSection icon={<Award size={14} />} title="Certificaciones_Verificadas">
              <Card className="p-6">
                <ul className="space-y-3">
                  {CV_DATA.certifications.map((cert) => (
                    <CertificationRow key={`${cert.issuer}-${cert.name}`} cert={cert} />
                  ))}
                </ul>
                <p className="mt-5 border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  {CV_DATA.certificationsNote}
                </p>
              </Card>
            </CvSection>

            <CvSection icon={<Wrench size={14} />} title="Aptitudes_Tecnicas">
              <div className="grid gap-4 md:grid-cols-2">
                {CV_DATA.skills.map((category) => (
                  <Card key={category.label} className="p-5">
                    <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-matrix-bright">{category.label}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {category.skills.map((skill) => (
                        <Badge key={skill} variant="neutral">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CvSection>

            <CvSection icon={<Languages size={14} />} title="Idiomas_Operativos">
              <Card className="p-6">
                <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CV_DATA.languages.map((entry) => (
                    <li key={entry.language} className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-gray-200">{entry.language}</span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-accent">{entry.level}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </CvSection>

            <motion.p
              variants={sectionVariants}
              className="pb-2 text-center text-[10px] uppercase tracking-[0.24em] text-accent opacity-70"
            >
              END_OF_DOSSIER // TRANSMISIÓN CIFRADA
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(overlay, document.body);
};
