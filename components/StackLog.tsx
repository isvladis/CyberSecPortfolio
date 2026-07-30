"use client";

import { Cpu } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useHomelabStatus } from "@/hooks/useHomelabStatus";
import type { HomelabStatusLevel } from "@/lib/homelab";

interface StackLogProps {
  isAlertMode: boolean;
}

const STATUS_LABELS: Record<HomelabStatusLevel, string> = {
  active: "NODE_ACTIVE",
  degraded: "NODE_DEGRADED",
  unreachable: "NODE_UNREACHABLE",
};

/**
 * Todas las variantes se pintan sobre el token `--color-accent`, así que la tarjeta
 * sigue al modo alerta (`[data-mode="alert"]`) sin colores fijos propios. El estado
 * degradado se distingue por borde discontinuo y opacidad, no por otro color.
 */
const STATUS_STYLES: Record<HomelabStatusLevel, string> = {
  active: "",
  degraded: "border-dashed opacity-70",
  unreachable: "border-dashed opacity-60",
};

/**
 * Uptime en granularidad gruesa (días+horas, u horas+minutos por debajo del día). Es
 * deliberado: las métricas viven dentro de la región `aria-live`, así que cuanto menos
 * cambie el texto entre refetches, menos ruido para un lector de pantalla.
 */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${minutes}m`;
};

/**
 * Notación compacta ("12.4K"). Cabe en la píldora y, por el mismo motivo que `formatUptime`,
 * evita que el contador de Pi-hole reescriba la región `aria-live` en cada consulta bloqueada.
 * Locale fijo para que el formato no dependa del navegador.
 */
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const StackLog = ({ isAlertMode }: StackLogProps) => {
  const { data: homelab, isLoading, error, isDegraded } = useHomelabStatus();

  return (
    <Card className="p-6">
      <Cpu className={`mb-4 text-accent transition-all hover:rotate-12 ${isDegraded ? "opacity-60" : ""}`} size={30} />
      <h2 lang="en" className={`mb-3 font-mono text-sm font-bold uppercase tracking-wide ${isAlertMode ? "text-accent" : "text-matrix-bright"}`}>
        Stack Log
      </h2>

      <div className="space-y-1 font-mono text-[11px] text-accent/70">
        {homelab ? (
          homelab.stack.map((entry) => <p key={entry}>&gt; {entry}</p>)
        ) : (
          // Sin atenuación propia: multiplicada con el `text-accent/70` del contenedor, cualquier
          // `opacity` extra baja esta línea de AA (4.5:1), y aquí también se lee "Node_Link_Down".
          // El pulso ya transmite la espera.
          <p lang="en" className={isLoading ? "animate-pulse" : ""}>&gt; {isLoading ? "Sync_Node..." : "Node_Link_Down"}</p>
        )}
      </div>

      {/*
        Región viva única para estado y métricas: los refetches de useHomelabStatus reescriben
        estas píldoras sin remontar nada, así que un lector de pantalla anuncia tanto un cambio
        de estado como una métrica nueva.
      */}
      <div aria-live="polite" className="mt-4 flex flex-wrap items-center gap-2">
        {homelab && (
          <>
            <Badge className={STATUS_STYLES[homelab.status]}>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full bg-accent ${homelab.status === "active" ? "animate-pulse" : ""}`}
              />
              <span lang="en">{STATUS_LABELS[homelab.status]}</span>
            </Badge>
            <Badge variant="neutral">
              <span lang="en">SEC_LEVEL: {homelab.secLevel}</span>
            </Badge>

            {homelab.metrics && (
              <>
                <Badge variant="neutral">
                  <span lang="en">UPTIME: {formatUptime(homelab.metrics.uptimeSeconds)}</span>
                </Badge>
                <Badge variant="neutral">
                  <span lang="en">
                    CONTAINERS: {homelab.metrics.containersUp}/{homelab.metrics.containersTotal}
                  </span>
                </Badge>
                {homelab.metrics.dnsQueriesBlocked !== undefined && (
                  <Badge variant="neutral">
                    <span lang="en">DNS_BLOCKED: {compactNumber.format(homelab.metrics.dnsQueriesBlocked)}</span>
                  </Badge>
                )}
              </>
            )}

            {/* Solo la clave de la fuente ("pihole"), nunca su URL. */}
            {homelab.failedSources && (
              <Badge className="border-dashed opacity-70">
                <span lang="en">SRC_DOWN: {homelab.failedSources.join(" ")}</span>
              </Badge>
            )}
            {error && (
              <Badge className="border-dashed opacity-70">
                <span lang="en">LINK_STALE</span>
              </Badge>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
