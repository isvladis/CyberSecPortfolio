"use client";

import { useEffect, useState } from "react";
import { HOMELAB_REFRESH_INTERVAL_MS } from "@/lib/constants";
import { parseHomelabStatus } from "@/lib/homelab";
import type { HomelabStatus } from "@/lib/homelab";

type UseHomelabStatusOptions = {
  /** Periodo del refetch. Ver la justificación de `HOMELAB_REFRESH_INTERVAL_MS`. */
  refreshIntervalMs?: number;
};

export type UseHomelabStatusResult = {
  data: HomelabStatus | null;
  /** Solo el primer ciclo. Los refetch periódicos nunca lo reactivan. */
  isLoading: boolean;
  /**
   * La propia ruta no respondió (no confundir con "el nodo está caído": eso viaja dentro del
   * payload como `status: "unreachable"`). Con `data` presente, lo que se ve es la última
   * lectura buena y esta bandera la marca como potencialmente vieja.
   */
  error: string | null;
  /** El homelab respondió pero algo va mal: estado degradado o alguna fuente caída. */
  isDegraded: boolean;
};

/**
 * Estado del homelab, con refetch periódico contra `/api/homelab-status` SOLO cuando la
 * respuesta trae `metrics`.
 *
 * En producción (sin `HOMELAB_API_URL`) la ruta devuelve contenido curado sin `metrics` —
 * ver el comment-block al inicio de lib/homelab.ts — y ese dato no cambia entre ticks, así
 * que sondearlo cada minuto no tiene sentido. El hook detecta esto en la primera respuesta:
 * si no hay `metrics`, no programa ni el `setInterval` ni el refetch al volver a la pestaña,
 * y un único fetch al montar alcanza. En modo local/VPN opcional (con `HOMELAB_API_URL`
 * configurada y el nodo reportando métricas), el polling de Fases A/B sigue intacto.
 *
 * Mismo origen, así que no toca la CSP (`connect-src 'self'`): el fetch a las fuentes reales
 * lo sigue haciendo el Route Handler en el servidor.
 */
export const useHomelabStatus = ({
  refreshIntervalMs = HOMELAB_REFRESH_INTERVAL_MS,
}: UseHomelabStatusOptions = {}): UseHomelabStatusResult => {
  const [data, setData] = useState<HomelabStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    let isFetching = false;
    // Sigue `null` para siempre si la primera respuesta no trae `metrics` (dato curado):
    // ese es la señal de que no hace falta seguir sondeando. Ver el docstring del hook.
    let intervalId: number | null = null;

    const load = async () => {
      // Evita que un tick se solape con una petición aún en vuelo (y que las respuestas
      // lleguen desordenadas si el nodo tarda más que el intervalo).
      if (isFetching) return;
      isFetching = true;

      try {
        const response = await fetch("/api/homelab-status", {
          signal: controller.signal,
          // La ruta ya cachea en el servidor (`s-maxage=300`). Sin esto el navegador podría
          // servir su propia copia heurística y el poll no vería nunca datos nuevos.
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Homelab route responded ${response.status}`);

        const parsed = parseHomelabStatus(await response.json());
        if (!isActive) return;

        setData(parsed);
        setError(null);

        // Recién acá se decide si vale la pena seguir sondeando: sin `metrics` (contenido
        // curado, el caso normal en producción) un solo fetch alcanza.
        if (parsed.metrics && intervalId === null) {
          intervalId = window.setInterval(() => {
            if (!document.hidden) load();
          }, refreshIntervalMs);
        }
      } catch (cause) {
        // Se conserva el `data` anterior a propósito: un fallo puntual de red no debe vaciar
        // la tarjeta, solo marcarla como posiblemente desactualizada.
        if (!isActive) return;

        setError(cause instanceof Error ? cause.message : "Homelab status unavailable");
      } finally {
        isFetching = false;
        // Único punto que apaga el loading, y nunca vuelve a encenderlo: por eso un refetch
        // con éxito reemplaza los datos sin parpadeo.
        if (isActive) setIsLoading(false);
      }
    };

    load();

    // Al volver a la pestaña se refresca ya, sin esperar al siguiente tick — pero solo si
    // el polling está activo (`intervalId` seteado): en modo curado no hay nada que refrescar.
    const handleVisibilityChange = () => {
      if (!document.hidden && intervalId !== null) load();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      controller.abort();
      if (intervalId !== null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshIntervalMs]);

  return {
    data,
    isLoading,
    error,
    isDegraded: data?.status === "degraded" || (data?.failedSources?.length ?? 0) > 0,
  };
};
