/**
 * Fuente de verdad canónica de la paleta del tema.
 *
 * Estos valores están replicados manualmente en el bloque `@theme` de `app/globals.css`
 * (como tokens `--color-*`). Si se cambia un color aquí, hay que actualizar también
 * `app/globals.css` — y viceversa.
 *
 * Regla de uso: en JSX/Tailwind siempre se usan las clases de token (`text-accent`,
 * `bg-accent-strong`, `text-matrix-bright`...). Estas constantes existen solo para el
 * código que necesita un color *computado* y no puede usar clases CSS — hoy únicamente
 * el canvas de `MatrixRain`.
 */
export const THEME_COLORS = {
  /** Verde Matrix clásico. Origen del acento en modo idle. */
  matrixGreen: "#00ff41",
  /** Verde claro casi menta. Texto de énfasis sobre superficies en modo idle. */
  matrixBright: "#b6ffd0",
  /** Verde oscuro apagado. Superficies y raíles secundarios. */
  matrixDim: "#063d17",
  /** Negro base del documento. */
  matrixDark: "#000000",
  /**
   * Acento en modo alerta (`[data-mode="alert"]`). Vuelto al rojo original a pedido explícito
   * — ver el comentario en `app/globals.css` sobre el trade-off de contraste que esto reabre.
   */
  accentAlert: "#ef4444",
  /** Variante fuerte del acento en modo alerta. */
  accentAlertStrong: "#dc2626",
} as const;
