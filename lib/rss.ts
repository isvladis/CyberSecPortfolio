import { MAX_NEWS_ITEMS, RSS_SOURCES } from "@/lib/constants";

export type RssItem = {
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

export const stripHtml = (value = "") => decodeEntities(value).replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();

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

const normalizeItems = (items: RssItem[], source: (typeof RSS_SOURCES)[number]): NewsItem[] =>
  items
    .map((item) => ({
      title: stripHtml(item.title) || "Untitled threat report",
      link: item.link || source.url,
      pubDate: item.pubDate || new Date().toISOString(),
      description: stripHtml(item.description) || "Resumen no disponible. Abre la fuente original para leer el informe completo.",
      guid: item.guid || item.link || `${source.name}-${item.title}`,
      source: source.name,
    }))
    .filter((item) => item.link.startsWith("http"));

const fetchViaProxy = async (source: (typeof RSS_SOURCES)[number], revalidate: number) => {
  const response = await fetch(`${RSS_PROXY_URL}?rss_url=${encodeURIComponent(source.url)}`, { next: { revalidate } });

  if (!response.ok) {
    throw new Error(`Proxy failed for ${source.name}: ${response.status}`);
  }

  const data = (await response.json()) as { items?: RssItem[]; status?: string; message?: string };
  if (data.status === "error") {
    throw new Error(data.message ?? `Proxy returned an error for ${source.name}`);
  }

  return normalizeItems(data.items ?? [], source);
};

const fetchDirectXml = async (source: (typeof RSS_SOURCES)[number], revalidate: number) => {
  const response = await fetch(source.url, {
    headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    next: { revalidate },
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
        return await fetchViaProxy(source, revalidate);
      } catch {
        return fetchDirectXml(source, revalidate);
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
