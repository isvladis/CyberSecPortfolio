import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { MAX_NEWS_ITEMS, RSS_SOURCES } from "@/lib/constants";
import type { RssSource } from "@/lib/constants";

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  guid?: string;
};

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  guid: string;
  source: string;
};

export type CyberNewsResponse = {
  items: NewsItem[];
  failedSources: number;
  sourceCount: number;
  degraded: boolean;
};

const RSS_PROXY_URL = "https://api.rss2json.com/v1/api.json";

const decodeEntities = (value = "") =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

const stripHtml = (value = "") => decodeEntities(value).replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();

const pickTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripHtml(match?.[1] ?? "");
};

const parseXmlFeed = (xml: string): RssItem[] => {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];

  if (itemMatches.length > 0) {
    return itemMatches.map(([itemXml]) => ({
      title: pickTag(itemXml, "title"),
      link: pickTag(itemXml, "link"),
      pubDate: pickTag(itemXml, "pubDate"),
      description: pickTag(itemXml, "description") || pickTag(itemXml, "content:encoded"),
      guid: pickTag(itemXml, "guid"),
    }));
  }

  return [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(([entryXml]) => {
    const href = entryXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];

    return {
      title: pickTag(entryXml, "title"),
      link: stripHtml(href ?? pickTag(entryXml, "link")),
      pubDate: pickTag(entryXml, "updated") || pickTag(entryXml, "published"),
      description: pickTag(entryXml, "summary") || pickTag(entryXml, "content"),
      guid: pickTag(entryXml, "id"),
    };
  });
};

const FETCH_TIMEOUT_MS = 8000;

/**
 * Techo de bytes por respuesta de `rawFetch`. El feed de CISA (la única fuente que usa esa vía)
 * ronda los 2-3MB, así que 12MB deja margen de sobra para que crezca sin dejar el proceso a merced
 * de una respuesta descontrolada.
 */
const RAW_FETCH_MAX_BYTES = 12 * 1024 * 1024;

/**
 * Validación mínima de forma sobre JSON de terceros (proxy rss2json y feeds directos ya
 * pasan por parseXmlFeed, que solo produce strings). Sin esto, un campo con un tipo
 * inesperado (p. ej. `title` numérico) rompería stripHtml/normalizeItems en runtime pese a
 * que `as RssItem` lo deja pasar en tiempo de compilación.
 */
const isRssItem = (value: unknown): value is RssItem => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.title === undefined || typeof record.title === "string") &&
    (record.link === undefined || typeof record.link === "string") &&
    (record.pubDate === undefined || typeof record.pubDate === "string") &&
    (record.description === undefined || typeof record.description === "string") &&
    (record.guid === undefined || typeof record.guid === "string")
  );
};

type ProxyResponse = { items?: RssItem[]; status?: string; message?: string };

const parseProxyResponse = (value: unknown): ProxyResponse => {
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;

  return {
    items: Array.isArray(record.items) ? record.items.filter(isRssItem) : undefined,
    status: typeof record.status === "string" ? record.status : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
};

/**
 * Un `link` de un feed de terceros solo se acepta si es una URL absoluta http(s), y se devuelve
 * ya normalizada. Sustituye al viejo `startsWith("http")`, que tenía un fallo en cada dirección:
 * dejaba pasar esquemas inventados (`httpx:`) y descartaba enlaces válidos con el esquema en
 * mayúsculas (`HTTPS://`). Sobre todo, es lo que garantiza que un `javascript:`/`data:` venido de
 * un feed no pueda terminar en el `href` que renderiza CyberNewsFeed.
 */
const toHttpUrl = (value: string): string | null => {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

/** Misma validación mínima que isRssItem, pero sobre la forma pública NewsItem (todo string). */
export const isNewsItem = (value: unknown): value is NewsItem => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.title === "string" &&
    // Se revalida el esquema y no solo el tipo: este es el punto por el que el `link` entra al
    // `href` del cliente, así que la comprobación se repite a este lado de fetch + JSON.parse.
    typeof record.link === "string" &&
    toHttpUrl(record.link) !== null &&
    typeof record.pubDate === "string" &&
    typeof record.description === "string" &&
    typeof record.guid === "string" &&
    typeof record.source === "string"
  );
};

/**
 * Valida la respuesta de /api/cyber-news en el cliente. Aunque la ruta es propia (no un
 * tercero), el JSON viaja por fetch + JSON.parse — es la frontera real de runtime, y usarla
 * también desde el cliente evita repetir esta forma de validación en CyberNewsFeed.tsx.
 */
export const parseCyberNewsResponse = (value: unknown): CyberNewsResponse => {
  if (typeof value !== "object" || value === null) {
    return { items: [], failedSources: 0, sourceCount: 0, degraded: false };
  }
  const record = value as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items.filter(isNewsItem) : [];

  return {
    items,
    failedSources: typeof record.failedSources === "number" ? record.failedSources : 0,
    sourceCount: typeof record.sourceCount === "number" ? record.sourceCount : 0,
    degraded: typeof record.degraded === "boolean" ? record.degraded : false,
  };
};

const normalizeItems = (items: RssItem[], source: RssSource): NewsItem[] =>
  items
    .map((item) => {
      const pubDate = item.pubDate && !Number.isNaN(new Date(item.pubDate).getTime()) ? item.pubDate : new Date().toISOString();
      // Si el propio item no trae un enlace utilizable se cae al de la fuente, que sí es de
      // confianza. `null` solo queda si ninguno de los dos es http(s), y ese item se descarta.
      const link = toHttpUrl(item.link ?? "") ?? toHttpUrl(source.url);

      return {
        title: stripHtml(item.title) || "Untitled threat report",
        link,
        pubDate,
        description: stripHtml(item.description) || "Resumen no disponible. Abre la fuente original para leer el informe completo.",
        guid: item.guid || link || `${source.name}-${item.title}`,
        source: source.name,
      };
    })
    .filter((item): item is NewsItem => item.link !== null);

type MinimalResponse = { ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<unknown> };

/**
 * Fetch de bajo nivel con node:http(s), fuera de la instrumentación de Data Cache de Next
 * (Next solo parchea el `fetch` global, no los módulos nativos de Node).
 *
 * Se usa exclusivamente para fuentes marcadas `skipDataCache`. La alternativa obvia —pasar
 * `cache: "no-store"` al `fetch()` normal— se probó y se descartó: en el modelo clásico de
 * App Router (sin Cache Components), cualquier fetch que se declare no-cacheable marca el
 * Route Handler ENTERO como dinámico (confirmado con un build real: la ruta pasó de
 * `○ Static ... 15m` a `ƒ Dynamic`), lo que le haría perder el ISR de 15 min a las otras 7
 * fuentes en cada visita. Este bypass evita ese efecto de borde porque Next nunca ve la
 * llamada como una opción de cache sobre `fetch()`.
 */
const rawFetch = (url: string, timeoutMs: number): Promise<MinimalResponse> =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "http:" ? httpRequest : httpsRequest;

    const req = transport(
      parsed,
      {
        headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      },
      (res) => {
        const chunks: Buffer[] = [];
        let received = 0;

        res.on("data", (chunk: Buffer) => {
          // A diferencia del `fetch` global, aquí el cuerpo se acumula entero en memoria y no hay
          // límite de tamaño de por medio (el bypass del Data Cache es justamente para esquivar el
          // de 2MB). Sin este techo, una fuente que devuelva un cuerpo enorme —o que no termine
          // nunca de enviarlo— hace crecer el proceso sin freno.
          received += chunk.length;
          if (received > RAW_FETCH_MAX_BYTES) {
            res.destroy();
            reject(new Error(`Response body exceeded ${RAW_FETCH_MAX_BYTES} bytes`));
            return;
          }

          chunks.push(chunk);
        });

        // Un fallo del stream después de las cabeceras no se emite en `req`: sin esto la promesa
        // se quedaba sin resolver hasta que saltase el AbortSignal.
        res.on("error", reject);

        res.on("end", () => {
          const status = res.statusCode ?? 0;
          const readText = () => Promise.resolve(Buffer.concat(chunks).toString("utf-8"));
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: readText,
            json: async () => JSON.parse(await readText()),
          });
        });
      },
    );

    req.on("error", reject);
    req.end();
  });

const fetchViaProxy = async (source: RssSource, revalidate: number) => {
  const url = `${RSS_PROXY_URL}?rss_url=${encodeURIComponent(source.url)}`;
  const response = source.skipDataCache
    ? await rawFetch(url, FETCH_TIMEOUT_MS)
    : await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`Proxy failed for ${source.name}: ${response.status}`);
  }

  const data = parseProxyResponse(await response.json());
  if (data.status === "error") {
    throw new Error(data.message ?? `Proxy returned an error for ${source.name}`);
  }

  return normalizeItems(data.items ?? [], source);
};

const fetchDirectXml = async (source: RssSource, revalidate: number) => {
  const response = source.skipDataCache
    ? await rawFetch(source.url, FETCH_TIMEOUT_MS)
    : await fetch(source.url, {
        headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
        next: { revalidate },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

  if (!response.ok) {
    throw new Error(`Direct feed failed for ${source.name}: ${response.status}`);
  }

  return normalizeItems(parseXmlFeed(await response.text()), source);
};

export const fetchCyberNews = async (revalidate: number): Promise<CyberNewsResponse> => {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (source) => {
      try {
        const proxyItems = await fetchViaProxy(source, revalidate);
        if (proxyItems.length === 0) {
          throw new Error(`Proxy returned no items for ${source.name}`);
        }
        return proxyItems;
      } catch {
        const directItems = await fetchDirectXml(source, revalidate);
        if (directItems.length === 0) {
          throw new Error(`No items available for ${source.name}`);
        }
        return directItems;
      }
    }),
  );

  const seen = new Set<string>();
  const items = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item) => {
      const key = item.guid || item.link;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, MAX_NEWS_ITEMS);

  const failedSources = results.filter((result) => result.status === "rejected").length;

  const sourceCount = RSS_SOURCES.length;

  return { items, failedSources, sourceCount, degraded: failedSources > 0 };
};
