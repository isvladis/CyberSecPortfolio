/**
 * DECISIÓN DE ARQUITECTURA — el portfolio público NUNCA depende de una conexión en vivo
 * a infraestructura real del homelab (Toshiba).
 *
 * La mini-API FastAPI del Toshiba (homelab-api, puerto 8000) sigue corriendo, pero
 * queda accesible solo por red interna/VPN: no hay Proxy Host público en NPM para ella
 * y no lo va a haber. `HOMELAB_API_URL` es una variable OPCIONAL pensada exclusivamente
 * para uso local o por VPN — en cualquier despliegue público debe quedar sin setear.
 *
 * Sin esa variable (el caso esperado en producción), `fetchHomelabStatus` devuelve
 * `HOMELAB_FALLBACK` con `status: "active"`: no es una degradación ni un fallo, es el
 * modo de operación normal y permanente del sitio público. `"unreachable"`/`"degraded"`
 * quedan reservados para cuando alguien SÍ configura la variable (modo local/VPN) y esa
 * fuente real falla en el momento — el código de Fases A/B para ese camino se conserva
 * intacto. No reabrir esta decisión sin volver a pasar por NPM + SSL + rate limiting +
 * Access Lists, que fue justamente lo que se decidió no hacer.
 */
import { HOMELAB_FALLBACK, HOMELAB_FETCH_TIMEOUT_MS, HOMELAB_MAX_STACK_ENTRIES } from "@/lib/constants";

export type HomelabStatusLevel = "active" | "degraded" | "unreachable";
export type HomelabSecLevel = "hardened" | "standard";

export type HomelabMetrics = {
  uptimeSeconds: number;
  containersUp: number;
  containersTotal: number;
  dnsQueriesBlocked?: number;
};

/**
 * Fuentes que se combinan para armar un `HomelabStatus`:
 * - `node`   — `HOMELAB_API_URL`, obligatoria. Estado, stack y métricas del host.
 * - `pihole` — `HOMELAB_PIHOLE_API_URL`, OPCIONAL. Solo aporta `dnsQueriesBlocked`.
 *
 * Si el nodo ya devuelve el contador de Pi-hole en su propio payload, la segunda variable
 * se deja sin configurar y esa fuente no existe (no puede fallar ni degradar nada).
 */
export type HomelabSource = "node" | "pihole";

export type HomelabStatus = {
  status: HomelabStatusLevel;
  secLevel: HomelabSecLevel;
  stack: string[];
  /** Ausente si el nodo no reporta uptime/contenedores, o si no respondió. */
  metrics?: HomelabMetrics;
  /** ISO timestamp del momento en que el servidor consultó al nodo. */
  lastChecked: string;
  /**
   * Fuentes CONFIGURADAS que no respondieron. Ausente cuando respondieron todas. Es el
   * equivalente del par `degraded`/`failedSources` de cyber-news: el detalle de qué falló
   * viaja explícito en vez de colapsarse en un único flag.
   */
  failedSources?: HomelabSource[];
};

const STATUS_LEVELS: readonly HomelabStatusLevel[] = ["active", "degraded", "unreachable"];
const SEC_LEVELS: readonly HomelabSecLevel[] = ["hardened", "standard"];
const HOMELAB_SOURCES: readonly HomelabSource[] = ["node", "pihole"];

/** Los arrays se excluyen a propósito: los adaptadores de abajo distinguen objeto de lista. */
const toRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

/** Primer campo presente de una lista de alias. Los adaptadores toleran varios nombres. */
const pickField = (record: Record<string, unknown>, keys: readonly string[]): unknown =>
  keys.map((key) => record[key]).find((value) => value !== undefined && value !== null);

/** Entero >= 0, aceptando strings numéricos: varios exporters serializan los contadores como texto. */
const toCount = (value: unknown): number | null => {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) return null;

  return Math.trunc(parsed);
};

/**
 * Estado curado: lo que el portfolio público muestra por defecto y de forma permanente,
 * ya que ningún despliegue estándar configura `HOMELAB_API_URL`. `status: "active"`
 * a propósito — no es un fallo ni una degradación, es el modo normal de operación.
 */
export const buildCuratedStatus = (): HomelabStatus => ({
  status: "active",
  secLevel: HOMELAB_FALLBACK.secLevel,
  stack: [...HOMELAB_FALLBACK.stack],
  lastChecked: new Date().toISOString(),
});

/**
 * Estado de fallo real: lo que se devuelve cuando `HOMELAB_API_URL` SÍ está configurada
 * (modo local/VPN opcional) pero el nodo no responde o responde con un error HTTP. Nunca
 * se usa para el caso "variable sin configurar" — ver `buildCuratedStatus`. Nunca lanza.
 */
export const buildUnreachableStatus = (): HomelabStatus => ({
  status: "unreachable",
  secLevel: HOMELAB_FALLBACK.secLevel,
  stack: [...HOMELAB_FALLBACK.stack],
  lastChecked: new Date().toISOString(),
});

/**
 * El nodo puede devolver el stack como `["Docker", ...]` o como
 * `[{ name: "Pi-hole", utility: "DNS sinkhole" }, ...]`. Fase A aplana ambas formas a
 * `string[]`, que es lo que consume la tarjeta; las entradas con utilidad se muestran
 * como `Nombre · utilidad`.
 */
const toStack = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();

      const record = toRecord(entry);
      if (!record) return "";

      const name = [record.name, record.service, record.title].find((field) => typeof field === "string") as string | undefined;
      if (!name) return "";

      const utility = [record.utility, record.role, record.description].find((field) => typeof field === "string") as
        | string
        | undefined;

      return utility ? `${name.trim()} · ${utility.trim()}` : name.trim();
    })
    .filter((entry) => entry.length > 0)
    .slice(0, HOMELAB_MAX_STACK_ENTRIES);
};

const toSecLevel = (record: Record<string, unknown>): HomelabSecLevel => {
  const raw = [record.secLevel, record.sec_level].find((field) => typeof field === "string") as string | undefined;
  const normalized = raw?.trim().toLowerCase();

  return SEC_LEVELS.find((level) => level === normalized) ?? HOMELAB_FALLBACK.secLevel;
};

const RUNNING_STATES = ["running", "up", "healthy", "online"];

/** Una entrada de la lista de contenedores cuenta como "arriba". Ver `toContainers`. */
const isContainerRunning = (entry: unknown): boolean => {
  // Lista de strings: convención de `docker ps` — si aparece, está corriendo.
  if (typeof entry === "string") return true;

  const record = toRecord(entry);
  if (!record) return false;
  if (typeof record.running === "boolean") return record.running;

  const state = [record.state, record.status, record.health].find((field) => typeof field === "string") as string | undefined;
  if (!state) return true;

  const normalized = state.trim().toLowerCase();
  return RUNNING_STATES.some((candidate) => normalized.startsWith(candidate));
};

/**
 * ADAPTADOR DE FRONTERA — junto a `toUptimeSeconds`/`toDnsQueriesBlocked`, el único punto
 * a tocar cuando se conozca la forma real de la API del Toshiba (misma estrategia que
 * `toStack`/`toSecLevel` en Fase A). Hoy cubre las dos formas plausibles:
 *
 *   A) contadores ya calculados, en la raíz o bajo `docker`: `{ docker: { running, total } }`
 *   B) la lista de contenedores: `{ containers: [{ name, state, image, ports }, ...] }`
 *
 * SEGURIDAD: la forma B se reduce aquí a dos enteros. Nombres de imagen, IPs y puertos
 * internos que venga arrastrando el payload mueren en esta función y nunca llegan al
 * cliente — `HomelabMetrics` no tiene dónde alojarlos.
 */
const toContainers = (record: Record<string, unknown>): { up: number; total: number } | null => {
  const scope = toRecord(pickField(record, ["docker", "containers"])) ?? record;

  const up = toCount(pickField(scope, ["containersUp", "containers_up", "running", "up", "active"]));
  const total = toCount(pickField(scope, ["containersTotal", "containers_total", "total", "count"]));
  // `total` nunca puede quedar por debajo de `up`: la tarjeta pinta "X/Y".
  if (up !== null && total !== null) return { up, total: Math.max(up, total) };

  const list = pickField(record, ["containers", "docker", "services"]);
  if (!Array.isArray(list)) return null;

  return { up: list.filter(isContainerRunning).length, total: list.length };
};

/** ADAPTADOR DE FRONTERA. Uptime en segundos, tolerando alias y anidamiento en `system`/`host`. */
const toUptimeSeconds = (record: Record<string, unknown>): number | null => {
  const scope = toRecord(pickField(record, ["system", "host"])) ?? record;

  return toCount(pickField(scope, ["uptimeSeconds", "uptime_seconds", "uptime"]));
};

/**
 * ADAPTADOR DE FRONTERA. Consultas bloqueadas por Pi-hole. Acepta tanto un campo dentro del
 * payload del nodo como la respuesta cruda de la propia API de Pi-hole, que según versión
 * devuelve `{ queries: { blocked } }` (v6) o `{ ads_blocked_today }` (v5), o directamente
 * un número pelado si el endpoint es un shim propio.
 */
const toDnsQueriesBlocked = (value: unknown): number | null => {
  const record = toRecord(value);
  if (!record) return toCount(value);

  const scope = toRecord(pickField(record, ["pihole", "dns", "queries"])) ?? record;

  return toCount(
    pickField(scope, [
      "dnsQueriesBlocked",
      "dns_queries_blocked",
      "queriesBlocked",
      "blocked",
      "ads_blocked_today",
      "blocked_today",
      "blocked_queries",
    ]),
  );
};

/**
 * Métricas del nodo. Todo o nada sobre los tres campos obligatorios: si el nodo no reporta
 * uptime o contenedores no hay `metrics` (la tarjeta sigue mostrando stack y estado), en vez
 * de inventar ceros que se leerían como "0 contenedores arriba".
 */
const toMetrics = (record: Record<string, unknown>): HomelabMetrics | undefined => {
  const scope = toRecord(record.metrics) ?? record;

  const uptimeSeconds = toUptimeSeconds(scope);
  const containers = toContainers(scope);
  if (uptimeSeconds === null || !containers) return undefined;

  const dnsQueriesBlocked = toDnsQueriesBlocked(scope);

  return {
    uptimeSeconds,
    containersUp: containers.up,
    containersTotal: containers.total,
    ...(dnsQueriesBlocked !== null ? { dnsQueriesBlocked } : {}),
  };
};

/**
 * Mapea la respuesta cruda del nodo al tipo `HomelabStatus`. Validación de forma mínima
 * al estilo de `parseProxyResponse` en lib/rss.ts: cualquier campo con un tipo inesperado
 * se descarta en vez de romper en runtime.
 *
 * Reglas de estado: si el nodo declara un estado conocido, se respeta; si respondió pero
 * no declara nada, se considera `active`; si respondió sin stack utilizable, `degraded`
 * (fallo parcial explícito — el nodo está vivo pero no dice qué corre).
 */
export const mapHomelabApiResponse = (value: unknown): HomelabStatus => {
  const record = toRecord(value);
  if (!record) return { ...buildUnreachableStatus(), status: "degraded" };

  const stack = toStack(record.stack);
  const rawStatus = typeof record.status === "string" ? record.status.trim().toLowerCase() : undefined;
  const declaredStatus = STATUS_LEVELS.find((level) => level === rawStatus);

  return {
    status: declaredStatus ?? (stack.length > 0 ? "active" : "degraded"),
    secLevel: toSecLevel(record),
    stack: stack.length > 0 ? stack : [...HOMELAB_FALLBACK.stack],
    metrics: toMetrics(record),
    lastChecked: new Date().toISOString(),
  };
};

const parseMetrics = (value: unknown): HomelabMetrics | undefined => {
  const record = toRecord(value);
  if (!record) return undefined;

  const uptimeSeconds = toCount(record.uptimeSeconds);
  const containersUp = toCount(record.containersUp);
  const containersTotal = toCount(record.containersTotal);
  if (uptimeSeconds === null || containersUp === null || containersTotal === null) return undefined;

  const dnsQueriesBlocked = toCount(record.dnsQueriesBlocked);

  return {
    uptimeSeconds,
    containersUp,
    containersTotal,
    ...(dnsQueriesBlocked !== null ? { dnsQueriesBlocked } : {}),
  };
};

/** Filtrar sobre la unión conocida valida y deduplica de una sola pasada. */
const parseFailedSources = (value: unknown): HomelabSource[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const sources = HOMELAB_SOURCES.filter((source) => value.includes(source));
  return sources.length > 0 ? sources : undefined;
};

/**
 * Valida la respuesta de `/api/homelab-status` en el cliente. La ruta es propia, pero el
 * JSON cruza `fetch` + `JSON.parse`: esa es la frontera real de runtime. Mismo criterio
 * que `parseCyberNewsResponse` — devuelve defaults en vez de lanzar.
 */
export const parseHomelabStatus = (value: unknown): HomelabStatus => {
  const record = toRecord(value);
  if (!record) return buildUnreachableStatus();

  const status = STATUS_LEVELS.find((level) => level === record.status);
  const secLevel = SEC_LEVELS.find((level) => level === record.secLevel);
  const stack = Array.isArray(record.stack)
    ? record.stack.filter((entry): entry is string => typeof entry === "string").slice(0, HOMELAB_MAX_STACK_ENTRIES)
    : [];
  const metrics = parseMetrics(record.metrics);
  const failedSources = parseFailedSources(record.failedSources);

  return {
    status: status ?? "unreachable",
    secLevel: secLevel ?? HOMELAB_FALLBACK.secLevel,
    stack: stack.length > 0 ? stack : [...HOMELAB_FALLBACK.stack],
    ...(metrics ? { metrics } : {}),
    lastChecked: typeof record.lastChecked === "string" ? record.lastChecked : new Date().toISOString(),
    ...(failedSources ? { failedSources } : {}),
  };
};

/** GET + JSON con timeout, compartido por todas las fuentes. Lanza para que `allSettled` lo capture. */
const fetchSourceJson = async (endpoint: string, revalidate: number): Promise<unknown> => {
  const response = await fetch(endpoint, {
    headers: { accept: "application/json" },
    next: { revalidate },
    signal: AbortSignal.timeout(HOMELAB_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Homelab source responded ${response.status}`);

  return response.json();
};

/**
 * El contador de Pi-hole solo puede colgarse de unas métricas ya existentes: sin uptime ni
 * contenedores no hay `HomelabMetrics` que completar, y en ese caso se descarta.
 */
const withDnsMetric = (metrics: HomelabMetrics | undefined, blocked: number | null): HomelabMetrics | undefined => {
  if (!metrics || blocked === null) return metrics;

  return { ...metrics, dnsQueriesBlocked: blocked };
};

/**
 * Consulta el homelab combinando sus fuentes. SERVER-SIDE únicamente: las URLs salen de
 * `HOMELAB_API_URL` / `HOMELAB_PIHOLE_API_URL` y nunca se exponen al navegador (no llevan el
 * prefijo `NEXT_PUBLIC_`).
 *
 * No lanza nunca. `Promise.allSettled` sobre las fuentes, igual que `fetchCyberNews`, con una
 * regla de degradación explícita:
 * - `HOMELAB_API_URL` sin configurar -> `active` con contenido curado (modo normal en
 *   producción, ver el comment-block al inicio del archivo; NO es un fallo)
 * - el nodo no responde (con la variable configurada) -> `unreachable`
 * - el nodo responde y Pi-hole no    -> `degraded` + `failedSources: ["pihole"]` (fallo parcial)
 * - Pi-hole sin configurar          -> no es una fuente: no falla ni degrada nada
 */
export const fetchHomelabStatus = async (revalidate: number): Promise<HomelabStatus> => {
  const nodeEndpoint = process.env.HOMELAB_API_URL;
  const piholeEndpoint = process.env.HOMELAB_PIHOLE_API_URL;

  if (!nodeEndpoint) return buildCuratedStatus();

  const [node, pihole] = await Promise.allSettled([
    fetchSourceJson(nodeEndpoint, revalidate).then(mapHomelabApiResponse),
    piholeEndpoint ? fetchSourceJson(piholeEndpoint, revalidate).then(toDnsQueriesBlocked) : Promise.resolve(null),
  ]);

  const failedSources: HomelabSource[] = [];
  if (node.status === "rejected") failedSources.push("node");
  if (pihole.status === "rejected") failedSources.push("pihole");

  if (node.status === "rejected") return { ...buildUnreachableStatus(), failedSources };

  const base = node.value;

  return {
    ...base,
    metrics: withDnsMetric(base.metrics, pihole.status === "fulfilled" ? pihole.value : null),
    // Una fuente secundaria caída degrada, pero nunca llega a `unreachable`: el nodo contestó.
    status: failedSources.length > 0 && base.status !== "unreachable" ? "degraded" : base.status,
    ...(failedSources.length > 0 ? { failedSources } : {}),
  };
};
