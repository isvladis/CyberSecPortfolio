export const SITE_MAX_WIDTH_CLASS = "max-w-[1400px]";

export const NEWS_PAGE_SIZE = 12;
export const MAX_NEWS_ITEMS = 60;

export const RSS_SOURCES = [
  { name: "SECURITY_WEEK", url: "https://feeds.feedburner.com/securityweek" },
  { name: "DARK_READING", url: "https://www.darkreading.com/rss.xml" },
] as const;

export type Project = {
  title: string;
  desc: string;
  tech: string[];
  repoUrl?: string;
  demoUrl?: string;
};

export const PROJECTS: Project[] = [
  {
    title: "Toshiba Pi-hole Node",
    desc: "Servidor DNS físico montado en hardware Toshiba Satellite. Bloqueo de telemetría a nivel de red.",
    tech: ["Debian", "Pi-hole", "Nginx"],
  },
  {
    title: "Ghost VPN Tunnel",
    desc: "Implementación de túnel VPN cifrado para acceso remoto seguro a la infraestructura local.",
    tech: ["OpenVPN", "Iptables", "Linux"],
  },
  {
    title: "Matrix Portfolio",
    desc: "Interfaz interactiva construida con Next.js, Tailwind y TypeScript para presentar proyectos de ciberseguridad.",
    tech: ["Next.js", "Tailwind", "TypeScript"],
  },
];

export const TERMINAL_SCAN_TICKS = 6;
export const TERMINAL_SCAN_INTERVAL_MS = 120;
export const TERMINAL_REFILL_DELAY_MS = 10;

export const ENCRYPTION_PROGRESS_STEP = 6;
export const ENCRYPTION_PROGRESS_INTERVAL_MS = 100;
export const ENCRYPTION_COMPLETE_DELAY_MS = 1000;
export const CORRUPTED_BLOCK_FACTOR = 2197;
export const CORRUPTED_BLOCK_TOTAL = 219700;

export const NETWORK_SERIES_LENGTH = 20;
export const NETWORK_IDLE_INTERVAL_MS = 450;
export const NETWORK_ALERT_INTERVAL_MS = 160;
export const NETWORK_REDUCED_MOTION_INTERVAL_MS = 2000;

export const BEEP_THROTTLE_MS = 45;
