export const SITE_MAX_WIDTH_CLASS = "max-w-[1400px]";

export const NEWS_PAGE_SIZE = 12;
export const MAX_NEWS_ITEMS = 80;

export const RSS_SOURCES = [
  { name: "SECURITY_WEEK",     url: "https://feeds.feedburner.com/securityweek" },
  { name: "DARK_READING",      url: "https://www.darkreading.com/rss.xml" },
  { name: "KREBS_ON_SECURITY", url: "https://krebsonsecurity.com/feed/" },
  { name: "THE_HACKER_NEWS",   url: "https://thehackernews.com/feeds/posts/default" },
  { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "CISA_ADVISORIES",   url: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
  { name: "SCHNEIER_SEC",      url: "https://www.schneier.com/blog/atom.xml" },
  { name: "SECURITY_AFFAIRS",  url: "https://securityaffairs.com/feed" },
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
