"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

/** Contenedor del sitio que se neutraliza mientras el diálogo está abierto (`<main id="site-root">`). */
const SITE_ROOT_ID = "site-root";

export type OverlayDialog = {
  /** Se pasa al nodo con `role="dialog"`: delimita el foco atrapado. */
  dialogRef: RefObject<HTMLDivElement | null>;
  /** Se pasa al botón de cierre: recibe el foco inicial al abrir. */
  closeButtonRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Cableado común de los overlays modales que se montan con `createPortal` sobre `document.body`:
 * bloqueo de scroll, focus trap + Escape, y `inert`/`aria-hidden` sobre el resto del sitio.
 *
 * Pensado para componentes que solo se montan cuando están abiertos, de ahí que `active`
 * sea por defecto `true`.
 */
export const useOverlayDialog = (onClose: () => void, active = true): OverlayDialog => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;

    const siteRoot = document.getElementById(SITE_ROOT_ID);
    if (!siteRoot) return;

    siteRoot.setAttribute("inert", "");
    siteRoot.setAttribute("aria-hidden", "true");

    return () => {
      siteRoot.removeAttribute("inert");
      siteRoot.removeAttribute("aria-hidden");
    };
  }, [active]);

  useLockBodyScroll(active);
  useDialogFocusTrap({ active, dialogRef, initialFocusRef: closeButtonRef, onEscape: onClose });

  return { dialogRef, closeButtonRef };
};
