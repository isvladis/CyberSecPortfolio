"use client";

import { Network, ShieldOff, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface HomelabExperienceProps {
  isAlertMode: boolean;
}

const STACK_TECH = ["Debian 12", "Docker", "Docker Compose", "Pi-hole", "Nginx Proxy Manager", "WireGuard", "Fail2Ban", "DuckDNS"];

const PORTFOLIO_REPO_URL = "https://github.com/isvladis/CyberSecPortfolio";

export const HomelabExperience = ({ isAlertMode }: HomelabExperienceProps) => (
  <Card className="grid grid-cols-1 gap-6 p-7 md:grid-cols-[1.3fr_1fr] md:p-8">
    <div>
      <div className="mb-4 flex items-center gap-2 text-accent">
        <Network size={18} />
        <span lang="en" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
          Homelab_Infrastructure_Project
        </span>
      </div>

      <h3
        className={`mb-3 font-mono text-xl font-black uppercase leading-tight tracking-wide md:text-2xl ${
          isAlertMode ? "text-accent" : "text-matrix-bright"
        }`}
      >
        Nodo Toshiba: laboratorio de hardening personal
      </h3>

      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-gray-300">
        Un portátil Toshiba Satellite reconvertido en nodo de infraestructura casera: DNS propio con bloqueo de
        publicidad y telemetría a nivel de red, reverse proxy con SSL automático, VPN cifrada para acceso remoto y
        defensa activa contra fuerza bruta — todo containerizado y aislado por servicio.
      </p>

      <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
        La decisión de arquitectura más relevante no es técnica sino de criterio:{" "}
        <span className="font-bold text-accent">este portfolio nunca se conecta a la infraestructura real</span>.
        La tarjeta de estado del homelab que se ve más arriba en este sitio (Stack Log) sirve siempre datos curados
        a mano, nunca una llamada en vivo al Toshiba. Exponer un panel de estado en tiempo real a cualquier
        visitante anónimo de internet es superficie de ataque gratuita para un beneficio puramente cosmético — así
        que esa puerta se queda cerrada a propósito, y la API del homelab (FastAPI, ver más abajo) solo es
        alcanzable por red interna o VPN, nunca a través de un Proxy Host público.
      </p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {STACK_TECH.map((tech) => (
          <Badge key={tech} variant="neutral">
            {tech}
          </Badge>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={PORTFOLIO_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-normal text-accent transition-colors hover:text-white"
        >
          <Terminal size={12} aria-hidden="true" />
          <span lang="en">Portfolio_Repo</span>
        </a>

        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white/40">
          <ShieldOff size={12} aria-hidden="true" />
          <span lang="en">Homelab_API_Repo:</span>
          <Badge variant="private">
            <span lang="en">PRIVATE_LAB</span>
          </Badge>
        </span>
      </div>
    </div>

    <div className="flex flex-col justify-between gap-4 rounded-lg border border-dashed border-accent/30 bg-black/40 p-5">
      <div>
        <p lang="en" className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent/70">
          Design_Decisions
        </p>
        <ul className="space-y-3 font-mono text-xs leading-relaxed text-gray-300">
          <li className="flex gap-2">
            <span className="text-accent" aria-hidden="true">
              &gt;
            </span>
            <span>Sin panel de estado en vivo expuesto a internet: menos superficie de ataque, sin ganancia real.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent" aria-hidden="true">
              &gt;
            </span>
            <span>Cada servicio (DNS, proxy, VPN) vive en su propio contenedor, aislado del resto.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent" aria-hidden="true">
              &gt;
            </span>
            <span>SSH solo con llave pública. Sin contraseñas, sin acceso root directo.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent" aria-hidden="true">
              &gt;
            </span>
            <span>Fail2Ban vigila intentos de fuerza bruta y banea IPs de forma activa.</span>
          </li>
        </ul>
      </div>

      {/*
        Slot pendiente para capturas reales del proyecto (dashboard de Pi-hole, terminal del
        Toshiba, etc.). Sin imágenes reales disponibles todavía, no se genera ningún placeholder
        visual — solo el texto de arriba. Cuando haya capturas, van aquí con next/image (mismo
        origen, respeta la CSP sin necesitar excepciones).
      */}
      <p className="border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.18em] text-white/40">
        Capturas del proyecto: pendiente
      </p>
    </div>
  </Card>
);
