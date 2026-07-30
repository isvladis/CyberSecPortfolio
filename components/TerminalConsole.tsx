"use client";

import { useEffect, useRef, useState } from "react";
import { TERMINAL_SCAN_INTERVAL_MS, TERMINAL_SCAN_TICKS } from "@/lib/constants";
import { useTerminalSession } from "@/hooks/useTerminalSession";

interface TerminalProps {
  onTriggerAlert?: () => void;
  onKeyPress?: () => void;
}

const COMMANDS = {
  help: "Comandos disponibles: status, projects, toshiba, clear, whoami | [SUDO]: override_lock (DENEGADO)",
  whoami: "USUARIO: Operador_Vladi | ROL: SysAdmin & Fullstack Dev | STATUS: Hardened",
  status: "SISTEMA: Online | Uptime: 124h 32m | Amenazas bloqueadas: 14,209 | VPN: Active",
  projects: "1. Pi-hole_VPN (Toshiba) 2. Cyber-Matrix-Portfolio 3. Nginx_Hardening",
  toshiba: "HARDWARE: Toshiba Satellite A200 | OS: Debian 12 | SERVICIO: Nodo central Pi-hole + VPN + Nginx Proxy",
};

const SCAN_PATHS = [
  "root/sys/kernel/security...",
  "var/www/html/assets/auth...",
  "etc/nginx/sites-available...",
  "home/vladi_dev/projects/pihole...",
  "usr/bin/python3.11/search...",
  "mnt/toshiba_blade/ssd/logs...",
  "dev/sda1/boot/grub/search...",
];

export const TerminalConsole = ({ onTriggerAlert, onKeyPress }: TerminalProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanText, setScanText] = useState("");
  // El comando en curso se guarda aparte del input: `handleCommand` vacía el input en el mismo
  // lote de estado que arranca el escaneo, así que leer `input` durante el escaneo daría "".
  const [scanCommand, setScanCommand] = useState("");
  const scanIntervalRef = useRef<number | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);
  const { input, setInput, history, setHistory, placeholder, scrollRef, inputRef } = useTerminalSession({
    initialHistory: ["SISTEMA_READY > Esperando órdenes..."],
    placeholderText: "Introducir comando...",
    autoFocus: !isScanning,
    scrollSignal: `${isScanning}-${scanText}`,
  });

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current !== null) window.clearInterval(scanIntervalRef.current);
      if (alertTimeoutRef.current !== null) window.clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  const executeWithScan = (cmd: string) => {
    setIsScanning(true);
    setScanCommand(cmd);
    let count = 0;
    const isHackTriggered = cmd === "override_lock" || cmd === "sudo override_lock";

    scanIntervalRef.current = window.setInterval(() => {
      if (isHackTriggered) {
        setScanText(`[CRÍTICO] BRECHA DE SEGURIDAD EN SECTOR 0x${Math.floor(Math.random() * 9999)}...`);
      } else {
        const randomPath = SCAN_PATHS[Math.floor(Math.random() * SCAN_PATHS.length)];
        setScanText(`[BUSCANDO] ${randomPath}`);
      }

      count += 1;

      if (count > TERMINAL_SCAN_TICKS) {
        if (scanIntervalRef.current !== null) window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        setIsScanning(false);
        setScanText("");

        if (isHackTriggered) {
          setHistory((prev) => [...prev, `> ${cmd}`, "ALERTA: intento de brecha detectado. Iniciando protocolo de defensa..."]);
          alertTimeoutRef.current = window.setTimeout(() => onTriggerAlert?.(), 500);
        } else if (cmd in COMMANDS) {
          setHistory((prev) => [...prev, `> ${cmd}`, COMMANDS[cmd as keyof typeof COMMANDS]]);
        } else {
          setHistory((prev) => [...prev, `> ${cmd}`, `ERR: recurso '${cmd}' no encontrado. Escribe "help" para ver comandos.`]);
        }

      }
    }, TERMINAL_SCAN_INTERVAL_MS);
  };

  const handleCommand = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter" || isScanning) return;

    onKeyPress?.();
    const cmd = input.toLowerCase().trim();
    if (cmd === "") return;

    if (cmd === "clear") {
      setHistory([]);
      setInput("");
      return;
    }

    executeWithScan(cmd);
    setInput("");
  };

  return (
    <div className="flex h-full cursor-text flex-col font-mono text-[11px] leading-relaxed" onClick={() => inputRef.current?.focus()}>
      {/*
        `role="log"` + `aria-live` hace que la salida de cada comando se anuncie sola: sin esto un
        lector de pantalla no daba ninguna respuesta al pulsar Enter. Las líneas del escaneo van
        con `aria-hidden` porque cambian cada 120ms y saturarían el anuncio; el eco del comando y
        el resultado final (que entra en `history`) sí se leen.
      */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Salida de la consola"
        className="scrollbar-hide mb-2 flex-1 space-y-1 overflow-y-auto pr-2"
      >
        {history.map((line, i) => (
          <p key={i} className={line.startsWith(">") ? "font-bold text-matrix-bright" : "text-accent/80"}>
            {line}
          </p>
        ))}

        {isScanning && (
          <div className="space-y-1">
            <p className="font-bold text-matrix-bright">{`> ${scanCommand}`}</p>
            <p
              aria-hidden="true"
              className={scanText.includes("[CRÍTICO]") ? "animate-pulse font-bold text-accent" : "animate-pulse text-yellow-500"}
            >
              {scanText}
            </p>
            <p aria-hidden="true" className="text-[9px] text-accent/70">
              {scanText.includes("[CRÍTICO]") ? "Bloqueando puertos de red..." : "Accediendo a sectores de memoria de Toshiba..."}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-accent/20 bg-black/20 pt-2">
        <span className="animate-pulse font-bold text-accent">{isScanning ? "!!" : "$"}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            onKeyPress?.();
          }}
          onKeyDown={handleCommand}
          placeholder={isScanning ? "SISTEMA OCUPADO..." : placeholder}
          // El placeholder es animado, así que no vale como nombre accesible del campo.
          aria-label="Comando de la consola interactiva"
          disabled={isScanning}
          className="w-full flex-1 border-none bg-transparent font-mono uppercase text-accent outline-none drop-shadow-[0_0_3px_var(--color-accent)] focus:ring-0 disabled:opacity-50"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
};
