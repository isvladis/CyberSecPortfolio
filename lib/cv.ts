/**
 * Modelo de datos del dossier profesional (CV) que se renderiza en `components/CvReport.tsx`.
 *
 * Los campos son obligatorios salvo donde el dato varía de verdad entre entradas
 * (una certificación en curso no tiene año, un curso en marcha no tiene nota final).
 * Los `status` se guardan como valores semánticos y se traducen a etiqueta visible en el
 * componente, igual que `ProjectCard` hace con su prop `status`.
 */

/** Naturaleza de un puesto: `technical` cuenta como experiencia del perfil; `transferable` aporta solo soft skills. */
export type ExperienceKind = "technical" | "transferable";

export type Experience = {
  role: string;
  org: string;
  /** Rango legible, con duración total entre paréntesis cuando el puesto está cerrado. */
  period: string;
  location: string;
  kind: ExperienceKind;
  /** Una línea de encuadre del puesto. */
  summary: string;
  /** Responsabilidades reales (`technical`) o soft skills transferibles (`transferable`). */
  highlights: string[];
};

export type EducationEntry = {
  title: string;
  org: string;
  period: string;
  /** Nota final. Solo en titulaciones ya completadas. */
  grade?: string;
  /** Una línea de encuadre del programa. */
  description?: string;
  /** Subconjunto curado de módulos relevantes para ciberseguridad, no el temario completo. */
  modules?: string[];
};

export type CertificationStatus = "certified" | "in-progress";

export type Certification = {
  name: string;
  issuer: string;
  /** Año de emisión. Ausente mientras la certificación está `in-progress`. */
  year?: string;
  status: CertificationStatus;
  /** Insignia principal del perfil: se destaca visualmente sobre el resto. */
  featured?: boolean;
  /** Link a la insignia verificable (Credly). Ausente donde no hay URL pública. */
  credlyUrl?: string;
};

export type SkillCategory = {
  /** Etiqueta de categoría en mayúsculas, tono operador. */
  label: string;
  skills: string[];
};

export type LanguageEntry = {
  language: string;
  /** Nivel declarado en texto. No se afirma nivel MCER donde no está certificado. */
  level: string;
};

export type CvData = {
  codename: string;
  role: string;
  /** Resumen ejecutivo: qué es el perfil hoy y hacia dónde va. */
  summary: string;
  experience: Experience[];
  education: EducationEntry[];
  certifications: Certification[];
  /** Señal de volumen de insignias menores que no se listan una a una. */
  certificationsNote: string;
  skills: SkillCategory[];
  languages: LanguageEntry[];
};

export const CV_DATA: CvData = {
  codename: "DYSLABS_SEC",
  role: "Blue Team // SOC Analyst",
  summary:
    "Técnico en transición activa hacia ciberseguridad defensiva (Blue Team / SOC), con base verificada en administración de sistemas y redes y respaldo de la certificación Cisco CyberOps Associate (CCNA Cybersecurity). Foco operativo en monitorización, detección de amenazas y respuesta a incidentes.",

  experience: [
    {
      role: "Analista funcional / Administrador de plataforma",
      org: "INEEW",
      period: "nov. 2023 — abr. 2026 (2 años 6 meses)",
      location: "Remoto",
      kind: "technical",
      summary: "Administración y soporte de la plataforma corporativa de eLearning sobre Odoo.",
      highlights: [
        "Gestión de usuarios, roles y permisos sobre una base de +1000 usuarios.",
        "Soporte técnico N1/N2 a usuarios y responsables de formación.",
        "Identificación, reproducción y resolución de incidencias (QA funcional).",
        "Coordinación con el equipo de desarrollo en inglés.",
        "Redacción de documentación técnica y procedimientos operativos.",
      ],
    },
    {
      role: "Técnico deportivo / fitness",
      org: "CET10",
      period: "mar. 2020 — actualidad",
      location: "Barcelona · Tiempo parcial",
      kind: "transferable",
      summary: "Puesto no técnico. Se incluye únicamente por las soft skills transferibles al rol de analista.",
      highlights: [
        "Gestión de grupos",
        "Atención al cliente",
        "Trabajo bajo presión",
        "Comunicación efectiva",
      ],
    },
  ],

  education: [
    {
      title: "CFGS Administración de Sistemas Informáticos en Red (ASIR) — perfil ciberseguridad",
      org: "Institut de Logística de Barcelona",
      period: "2022 — 2024",
      grade: "9,47 / 10",
      description:
        "Redes, administración de sistemas Windows/Linux, seguridad informática, virtualización, servicios de red, administración de BBDD.",
      modules: [
        "Ciberseguridad y Hacking Ético",
        "Seguridad en Sistemas, Redes y Servicios",
        "Seguridad y Alta Disponibilidad",
        "Administración de Redes",
      ],
    },
    {
      title: "Analista de Ciberseguridad",
      org: "IT Academy — Barcelona Activa",
      period: "nov. 2025 — jun. 2026",
      description:
        "Programa intensivo de analista de ciberseguridad: fundamentos de seguridad, redes, sistemas y operaciones de seguridad (SOC).",
      modules: [
        "CCST Cybersecurity (Cisco)",
        "CCST Networking (Cisco)",
        "CCST IT Support (Cisco)",
        "CyberOps Associate (Cisco)",
        "Ethical Hacker (Cisco)",
        "Network Security (Cisco)",
      ],
    },
  ],

  certifications: [
    {
      name: "CCNA Cybersecurity (CyberOps Associate)",
      issuer: "Cisco",
      year: "2026",
      status: "certified",
      featured: true,
      credlyUrl: "https://www.credly.com/badges/4f0b261f-d434-4b79-bcee-88cf2cf65f41",
    },
    {
      name: "Junior Cybersecurity Analyst Career Path",
      issuer: "Cisco",
      year: "2026",
      status: "certified",
      credlyUrl: "https://www.credly.com/badges/32ccd36f-2625-419a-a510-a0ef49987076",
    },
    {
      name: "Network Security",
      issuer: "Cisco",
      year: "2026",
      status: "certified",
      credlyUrl: "https://www.credly.com/badges/7a645126-d910-4ade-bf50-1923fdc6c358",
    },
    {
      name: "Ethical Hacker",
      issuer: "Cisco",
      year: "2026",
      status: "certified",
      credlyUrl: "https://www.credly.com/badges/40219592-0a89-40d1-8fac-9167f0d536bd",
    },
  ],
  certificationsNote: "+15 certificaciones/badges adicionales de Cisco Networking Academy",

  skills: [
    {
      label: "Ciberseguridad",
      skills: [
        "Monitorización SOC",
        "Detección de amenazas",
        "Respuesta a incidentes (NIST SP 800-61)",
        "Análisis de logs",
        "Análisis de PCAP",
        "NetFlow",
        "Defensa en profundidad",
        "MITRE ATT&CK",
        "Hacking ético",
        "Inteligencia de Ciberamenazas (CTI)",
        "Análisis de malware",
      ],
    },
    {
      label: "Redes",
      skills: ["TCP/IP", "Subnetting", "Routing & Switching", "Firewalls", "VPN", "DNS / DHCP", "Cisco"],
    },
    {
      label: "Sistemas",
      skills: ["Linux (Debian / Ubuntu)", "Bash", "Windows", "Windows Server", "VirtualBox"],
    },
    {
      label: "Herramientas",
      skills: ["Wireshark", "Nmap", "Kali Linux", "Security Onion", "Elastic Stack (ELK)"],
    },
    {
      label: "Programación",
      skills: ["Python", "Bash", "SQL / MySQL", "HTML / CSS"],
    },
  ],

  languages: [
    { language: "Español", level: "Nativo" },
    { language: "Ruso", level: "Nativo" },
    { language: "Catalán", level: "Alto" },
    { language: "Inglés", level: "Profesional" },
  ],
};
