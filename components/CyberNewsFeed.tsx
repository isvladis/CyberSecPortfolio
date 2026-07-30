"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Globe, Loader2, X } from "lucide-react";
import { useOverlayDialog } from "@/hooks/useOverlayDialog";
import { NEWS_PAGE_SIZE } from "@/lib/constants";
import { parseCyberNewsResponse } from "@/lib/rss";
import type { NewsItem } from "@/lib/rss";

/**
 * Un único formateador a nivel de módulo en lugar de `toLocaleString` por noticia en cada render:
 * construir un `Intl.DateTimeFormat` es la parte cara, y aquí se repetía hasta 80 veces por pasada.
 * Mismo patrón que `compactNumber` en StackLog.
 */
const dateTimeFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * `Intl.DateTimeFormat.format` LANZA un RangeError con una fecha inválida, donde
 * `toLocaleString` se limitaba a devolver "Invalid Date". `pubDate` ya se sanea en el servidor,
 * pero es un string sin validar del otro lado de fetch + JSON.parse: sin esta guarda, un payload
 * con una fecha corrupta tumbaría el render del feed entero.
 */
const formatPublished = (pubDate: string): string => {
  const date = new Date(pubDate);

  return Number.isNaN(date.getTime()) ? "FECHA_DESCONOCIDA" : dateTimeFormat.format(date);
};

export const CyberNewsFeed = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(NEWS_PAGE_SIZE);
  const [sourceCount, setSourceCount] = useState(0);
  const [failedSources, setFailedSources] = useState(0);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + NEWS_PAGE_SIZE, items.length));
  }, [items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const openNews = useCallback((item: NewsItem) => setSelectedNews(item), []);
  const closeNews = useCallback(() => setSelectedNews(null), []);

  // Mismo cableado de overlay que usa CvReport (inert + aria-hidden sobre el sitio, lock de scroll,
  // focus trap y Escape). Antes estaba reimplementado a mano aquí, con el riesgo de que las dos
  // copias se fueran separando.
  const { dialogRef, closeButtonRef } = useOverlayDialog(closeNews, Boolean(selectedNews));

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/cyber-news");
        if (!res.ok) throw new Error("News stream unavailable");

        const data = parseCyberNewsResponse(await res.json());
        if (!isMounted) return;

        setItems(data.items);
        setSourceCount(data.sourceCount);
        setFailedSources(data.failedSources);
        setIsDegraded(data.degraded);
        setHasError(false);
      } catch {
        if (isMounted) {
          setHasError(true);
          setIsDegraded(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadNews();
    return () => { isMounted = false; };
  }, []);

  const modalContent = selectedNews ? (
    <div className="fixed inset-0 z-[99999] grid min-h-screen place-items-center bg-black/90 p-4 backdrop-blur-sm md:p-8" onMouseDown={closeNews}>
      <div
        ref={dialogRef}
        id="news-reader-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-reader-title"
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-[92vw] max-w-[900px] flex-col overflow-hidden rounded-sm border-2 border-accent/50 bg-black/95 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between gap-4 overflow-hidden border-b-2 border-accent/50 bg-black px-4 py-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            <div className="shrink-0 border border-current p-1 opacity-80">
              <Globe size={18} className="animate-pulse text-accent" />
            </div>
            <h3 id="news-reader-title" className="block w-full truncate font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent md:text-sm">
              <span lang="en" className="mr-2 hidden opacity-70 sm:inline">[READER_MODE]:</span>
              {selectedNews.title}
            </h3>
          </div>

          <button
            ref={closeButtonRef}
            onClick={closeNews}
            className="flex shrink-0 items-center gap-2 border border-accent/50 px-3 py-2 font-mono text-[10px] font-bold text-accent transition-colors hover:bg-white/10"
          >
            <X size={16} />
            <span lang="en" className="hidden md:inline">TERMINATE_CONNECTION</span>
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-black p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="border border-accent bg-accent/20 px-2 py-1 font-bold text-accent">{selectedNews.source}</span>
            <time dateTime={selectedNews.pubDate} className="text-white/70">
              {formatPublished(selectedNews.pubDate)}
            </time>
          </div>

          <h4 className="font-mono text-2xl font-black uppercase leading-tight tracking-wide text-white md:text-3xl">
            {selectedNews.title}
          </h4>

          <p className="border-l-2 border-accent/50 pl-4 text-sm leading-7 text-gray-200 md:text-base">{selectedNews.description}</p>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-accent/50 bg-black px-4 py-3 font-mono text-[10px]">
          <span lang="en" className="mr-4 min-w-0 truncate text-white/60">SOURCE_NODE: {selectedNews.source}</span>
          <a
            href={selectedNews.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-accent hover:underline"
          >
            <span lang="en">OPEN_ORIGINAL</span> <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <section className="w-full overflow-hidden rounded-sm border-2 border-accent/50 bg-black/60 p-1 backdrop-blur-xl transition-colors duration-500">
        <div className="flex items-center justify-between border-b border-accent/50 bg-white/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Globe size={16} className="shrink-0 animate-pulse text-accent" />
            <h2 lang="en" className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
              MultiSource Threat Intelligence Stream
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span lang="en" className="hidden font-mono text-[10px] text-white/55 md:block">
              SOURCES: {Math.max(sourceCount - failedSources, 0)} / {sourceCount} ACTIVE_NODES
            </span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_8px_currentColor]" />
          </div>
        </div>

        {/* `max-h-[70vh]` acota el scroller anidado en pantallas bajas: 600px fijos dejaban el feed
            ocupando casi todo el viewport de un móvil, sin contexto de página alrededor. */}
        <div
          aria-busy={isLoading}
          className="custom-scrollbar h-[600px] max-h-[70vh] overflow-y-auto bg-gradient-to-b from-transparent to-black/20 p-6"
        >
          {/*
            Región viva permanente para los estados del stream: cargar, fallar o degradarse eran
            cambios totalmente silenciosos para un lector de pantalla. Tiene que existir en el DOM
            desde el primer render para que los cambios se anuncien, de ahí que quede fuera del
            `space-y-12` y se colapse con `empty:hidden` cuando no hay nada que decir (así no mete
            un hueco extra sobre la primera noticia en el caso normal).
          */}
          <div aria-live="polite" className="mb-12 empty:hidden">
            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-accent">
                <Loader2 className="animate-spin" size={28} aria-hidden="true" />
                <span lang="en" className="font-mono text-[10px] uppercase tracking-widest text-accent/70">Synchronizing_Data_Stream...</span>
              </div>
            )}

            {hasError && (
              <div className="border border-accent/40 bg-accent/10 p-5 font-mono text-xs text-accent">
                <span lang="en">STREAM_ERROR:</span> No se ha podido recuperar la inteligencia de amenazas. Reintenta más tarde.
              </div>
            )}

            {!isLoading && !hasError && isDegraded && (
              <div className="border border-yellow-500/40 bg-yellow-500/10 p-5 font-mono text-xs leading-relaxed text-yellow-100">
                <span lang="en">STREAM_DEGRADED:</span> {failedSources} de {sourceCount} fuentes no respondieron. Mostrando inteligencia
                disponible desde los nodos activos.
              </div>
            )}

            {!isLoading && !hasError && items.length === 0 && (
              <div className="border border-accent/40 bg-white/5 p-5 font-mono text-xs text-white/70">
                <span lang="en">STREAM_EMPTY:</span> las fuentes respondieron sin paquetes disponibles.
              </div>
            )}
          </div>

          <div className="space-y-12">
            {!isLoading &&
              !hasError &&
              visibleItems.map((item, i) => (
                <article key={`${item.guid}-${i}`} className="group relative">
                  <div className="absolute -left-6 bottom-0 top-0 w-px bg-accent opacity-20 transition-opacity group-hover:opacity-70" />

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="border border-accent bg-accent/20 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wide text-accent">
                        {item.source}
                      </span>
                      <time dateTime={item.pubDate} className="font-mono text-[11px] italic text-white/60">
                        {formatPublished(item.pubDate)}
                      </time>
                    </div>

                    <button type="button" onClick={() => openNews(item)} className="cursor-pointer text-left transition-transform duration-300 group-hover:translate-x-1">
                      <h3 className="font-mono text-base font-bold uppercase leading-tight tracking-wide text-white transition-colors group-hover:text-accent md:text-lg">
                        {item.title}
                      </h3>
                    </button>

                    <p className="line-clamp-2 max-w-3xl border-l border-white/10 pl-4 text-xs leading-relaxed text-gray-300 md:text-sm">
                      {item.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => openNews(item)}
                      className="flex cursor-pointer items-center gap-1 self-start font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent/75 transition-opacity group-hover:text-accent"
                    >
                      <span lang="en">Access_Safe_Reader</span> <ExternalLink size={10} />
                    </button>
                  </div>
                </article>
              ))}

            <div ref={sentinelRef} className="flex items-center justify-center py-4">
              {hasMore && (
                <Loader2 className="animate-spin text-accent/50" size={20} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-accent/50 bg-black/40 px-4 py-2">
          <span lang="en" className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">Encrypted_Stream_Active</span>
          <span lang="en" className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">Total_Packets: {visibleItems.length}</span>
        </div>
      </section>

      {selectedNews && typeof document !== "undefined" && modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
