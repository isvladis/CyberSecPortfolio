"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
  color?: string;
}

const CHARS = "0101010101010101ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FONT_SIZE = 16;
const FRAME_INTERVAL_MS = 42;

export const MatrixRain = ({ color = "#00FF41" }: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!ctx) return;

    let animationFrame = 0;
    let lastFrame = 0;
    let drops: number[] = [];
    let columns = 0;
    let isReducedMotion = reducedMotion.matches;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.ceil(window.innerWidth / FONT_SIZE);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    };

    const draw = (timestamp: number) => {
      if (isReducedMotion) return;

      if (document.hidden) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      if (timestamp - lastFrame < FRAME_INTERVAL_MS) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      lastFrame = timestamp;
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = colorRef.current;
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < columns; i++) {
        const text = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        ctx.fillText(text, i * FONT_SIZE, drops[i] * FONT_SIZE);

        if (drops[i] * FONT_SIZE > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }

      animationFrame = requestAnimationFrame(draw);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      isReducedMotion = event.matches;
      if (!isReducedMotion) animationFrame = requestAnimationFrame(draw);
      if (isReducedMotion) {
        cancelAnimationFrame(animationFrame);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    resizeCanvas();
    if (!isReducedMotion) animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resizeCanvas);
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" aria-hidden="true" />;
};
