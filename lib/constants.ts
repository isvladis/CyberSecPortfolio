export const SITE_MAX_WIDTH_CLASS = "max-w-[1400px]";

export const NEWS_PAGE_SIZE = 12;
export const MAX_NEWS_ITEMS = 80;

export type RssSource = {
  name: string;
  url: string;
  /**
   * Si es true, esta fuente se pide con node:http(s) en vez del `fetch()` global de Next,
   * evitando así el Data Cache (que rechaza entradas de más de 2MB) sin forzar el Route
   * Handler completo a dinámico. Ver el comentario de `rawFetch` en lib/rss.ts.
   */
  skipDataCache?: boolean;
};

export const RSS_SOURCES: readonly RssSource[] = [
  { name: "SECURITY_WEEK",     url: "https://feeds.feedburner.com/securityweek" },
  { name: "DARK_READING",      url: "https://www.darkreading.com/rss.xml" },
  { name: "KREBS_ON_SECURITY", url: "https://krebsonsecurity.com/feed/" },
  { name: "THE_HACKER_NEWS",   url: "https://thehackernews.com/feeds/posts/default" },
  { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/" },
  // El proxy responde >2MB para esta fuente (el feed de CISA es un XML gigante), por
  // encima del límite fijo de 2MB por entrada del fetch data cache de Next.
  { name: "CISA_ADVISORIES",   url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", skipDataCache: true },
  { name: "SCHNEIER_SEC",      url: "https://www.schneier.com/blog/atom.xml" },
  { name: "SECURITY_AFFAIRS",  url: "https://securityaffairs.com/feed" },
];

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

/**
 * Contenido curado del homelab (Toshiba). DECISIÓN DE PRODUCTO: el portfolio público
 * nunca expone infraestructura real a internet (ver el comment-block al inicio de
 * lib/homelab.ts), así que esto no es un "fallback de emergencia" para cuando el nodo
 * no responde — es la fuente de datos por defecto y permanente en producción. Refleja
 * el stack real documentado del homelab, mantenido a mano.
 */
export const HOMELAB_FALLBACK = {
  secLevel: "hardened",
  stack: [
    "Debian 12 · Sistema operativo base",
    "Docker + Docker Compose · Aislamiento de servicios",
    "Pi-hole · DNS + bloqueo de publicidad/telemetría",
    "DuckDNS · DNS dinámico",
    "Nginx Proxy Manager · Reverse proxy + SSL",
    "WireGuard · VPN acceso remoto cifrado",
    "Fail2Ban · Defensa activa contra fuerza bruta",
    "SSH solo con llave pública · Sin contraseñas"
  ],
} as const;

export const HOMELAB_FETCH_TIMEOUT_MS = 5000;

/**
 * Techo de entradas del stack que se aceptan de la API del nodo. El stack real ronda las 7; el
 * límite existe para que una respuesta anómala (o una fuente comprometida) no pueda inyectar miles
 * de nodos en la tarjeta, que además vive dentro de una región `aria-live`.
 */
export const HOMELAB_MAX_STACK_ENTRIES = 24;

/**
 * Periodo del refetch cliente de `/api/homelab-status` (useHomelabStatus).
 *
 * Por qué 60s y no los 300s del `revalidate` del Route Handler: el cliente no sabe en qué
 * punto de la ventana de 300s del servidor entró, así que sondear también cada 300s dejaría
 * la tarjeta hasta ~600s por detrás del nodo. A 60s el peor caso baja a ~360s y el cambio de
 * estado aparece como mucho un minuto después de que el servidor revalide. El coste es bajo:
 * son 5 peticiones al mismo origen por ventana, servidas por la caché de la ruta
 * (`s-maxage=300`) sin volver a tocar el Toshiba. El hook además salta los ticks con la
 * pestaña en segundo plano.
 */
export const HOMELAB_REFRESH_INTERVAL_MS = 60_000;

export const TERMINAL_SCAN_TICKS = 6;
export const TERMINAL_SCAN_INTERVAL_MS = 120;

/**
 * Tiempo que se mantiene visible el modo alerta (StackLog en NODE_UNREACHABLE, MatrixRain y
 * tokens en rojo, etc.) ANTES de que aparezca `EncryptionOverlay` encima. Antes de este valor
 * no existía ningún timer para esta transición: `isAlertMode` y la fase "encrypting" se activaban
 * en el mismo cambio de estado, así que el overlay tapaba el panel de alerta en el mismo frame.
 */
export const ALERT_MODE_LEAD_MS = 1200;

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
