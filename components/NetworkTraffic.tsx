"use client";

import { useEffect, useState } from "react";
import {
  NETWORK_ALERT_INTERVAL_MS,
  NETWORK_IDLE_INTERVAL_MS,
  NETWORK_REDUCED_MOTION_INTERVAL_MS,
  NETWORK_SERIES_LENGTH,
} from "@/lib/constants";

interface NetworkTrafficProps {
  isAlertMode: boolean;
}

export const NetworkTraffic = ({ isAlertMode }: NetworkTrafficProps) => {
  const [data, setData] = useState<number[]>(Array(NETWORK_SERIES_LENGTH).fill(18));
  const [packets, setPackets] = useState("0");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateData = () => {
      if (document.hidden) return;

      setData((prevData) => {
        const nextValue = reducedMotion
          ? isAlertMode
            ? 78
            : 22
          : isAlertMode
            ? Math.floor(Math.random() * 40) + 60
            : Math.floor(Math.random() * 25) + 15;
        return [...prevData.slice(1), nextValue];
      });

      setPackets(reducedMotion ? (isAlertMode ? "8810" : "142") : isAlertMode ? (Math.random() * 1000 + 8000).toFixed(0) : (Math.random() * 100 + 120).toFixed(0));
    };

    updateData();
    const interval = window.setInterval(
      updateData,
      reducedMotion ? NETWORK_REDUCED_MOTION_INTERVAL_MS : isAlertMode ? NETWORK_ALERT_INTERVAL_MS : NETWORK_IDLE_INTERVAL_MS,
    );
    return () => window.clearInterval(interval);
  }, [isAlertMode]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex h-24 items-end justify-between gap-1 px-2">
        {data.map((value, i) => (
          <div
            key={i}
            className={`w-full bg-accent shadow-bar transition-[height,background-color,box-shadow] duration-200 ${
              isAlertMode ? "" : "opacity-60"
            }`}
            style={{ height: `${value}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[9px] uppercase">
        <div className="flex flex-col">
          <span className="opacity-40">Packets/sec</span>
          <span className={`text-accent ${isAlertMode ? "animate-pulse font-bold" : ""}`}>{packets}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="opacity-40">Load Factor</span>
          <span className={`text-accent ${isAlertMode ? "font-bold" : ""}`}>{isAlertMode ? "98.2%" : "12.4%"}</span>
        </div>
      </div>
    </div>
  );
};
