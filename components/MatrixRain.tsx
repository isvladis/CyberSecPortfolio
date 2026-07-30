"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { THEME_COLORS } from "@/lib/theme";

const CHARS = "0101010101010101ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FONT_SIZE = 16;
const FRAME_INTERVAL_MS = 42;
const RESIZE_DEBOUNCE_MS = 150;

export const MatrixRain = ({ color = THEME_COLORS.matrixGreen }: { color?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);
  /** Solo se rellena en movimiento reducido: es el único modo sin loop que repinte por su cuenta. */
  const redrawStaticRef = useRef<(() => void) | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    colorRef.current = color;
    // Sin esto, con `prefers-reduced-motion` el frame estático se queda con el color con el que se
    // pintó y la lluvia nunca pasa a rojo al entrar en modo alerta.
    redrawStaticRef.current?.();
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame = 0;
    let lastFrame = 0;
    let drops: number[] = [];
    let columns = 0;
    let resizeTimeout = 0;

    const drawStaticFrame = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = colorRef.current;
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < columns; i++) {
        // drops tiene exactamente `columns` elementos (ver resizeCanvas), así que i siempre es un índice válido.
        const drop = drops[i]!;
        const text = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        ctx.fillText(text, i * FONT_SIZE, drop * FONT_SIZE);
      }
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.ceil(window.innerWidth / FONT_SIZE);
      drops = Array.from({ length: columns }, () => Math.random() * -100);

      if (reducedMotion) drawStaticFrame();
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, RESIZE_DEBOUNCE_MS);
    };

    const draw = (timestamp: number) => {
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
        // drops tiene exactamente `columns` elementos (ver resizeCanvas), así que i siempre es un índice válido.
        const drop = drops[i]!;
        const text = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        ctx.fillText(text, i * FONT_SIZE, drop * FONT_SIZE);

        if (drop * FONT_SIZE > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] = drop + 1;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resizeCanvas();
    if (reducedMotion) {
      redrawStaticRef.current = drawStaticFrame;
    } else {
      animationFrame = requestAnimationFrame(draw);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      redrawStaticRef.current = null;
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
    // `reducedMotion` es dependencia real: si el usuario cambia la preferencia con la página
    // abierta hay que rearmar el canvas en el otro modo (arrancar o detener el loop).
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-40"
      aria-hidden="true"
    />
  );
};
