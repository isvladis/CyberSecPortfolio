"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado de `prefers-reduced-motion`, suscrito a los cambios de la propia media query.
 *
 * El override de `app/globals.css` solo neutraliza animaciones y transiciones CSS: todo lo que se
 * anima desde JavaScript (el canvas de MatrixRain, la serie de NetworkTraffic, el placeholder de
 * las terminales) tiene que consultar la preferencia a mano. Este hook es el único punto donde se
 * hace, en lugar de repetir un `matchMedia(...).matches` suelto en cada componente.
 *
 * `useSyncExternalStore` y no `useState` + efecto por dos motivos: da el valor correcto ya en el
 * primer render del cliente sin desajuste de hidratación (vía `getServerSnapshot`), y reacciona si
 * el usuario cambia la preferencia del sistema con la página abierta — con una lectura única al
 * montar, ese cambio no se veía hasta recargar.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onStoreChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onStoreChange);

  return () => media.removeEventListener("change", onStoreChange);
};

const getSnapshot = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** En el servidor no hay media queries: se asume movimiento permitido y se corrige al hidratar. */
const getServerSnapshot = () => false;

export const usePrefersReducedMotion = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
