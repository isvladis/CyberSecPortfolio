/**
 * Fuente única de la Content-Security-Policy. La consumen dos sitios con roles distintos:
 *
 * - `proxy.ts`: la construye con un `nonce` nuevo por request para las rutas que renderizan HTML.
 *   Es la que de verdad protege contra XSS, y la razón de que `script-src` ya no necesite
 *   'unsafe-inline'.
 * - `next.config.ts`: la construye SIN nonce, como baseline para lo que el proxy no cubre
 *   (`/api/*`, `/_next/static/*`, `robots.txt`, `sitemap.xml`, favicon). Ahí no hay HTML con
 *   scripts inline, así que un nonce no aportaría nada.
 *
 * Vive en un módulo aparte para que las dos no se separen con el tiempo: el peligro real de esta
 * arquitectura es endurecer una y olvidar la otra, y así solo hay una lista de directivas.
 */
interface CspOptions {
  /**
   * Nonce por request. Cuando se pasa, `script-src` acepta los scripts inline que lleven ese
   * nonce exacto (los de hidratación y de datos embebidos que inyecta Next) en vez de aceptar
   * cualquier script inline vía 'unsafe-inline'.
   */
  nonce?: string;
  isDev: boolean;
}

export const buildContentSecurityPolicy = ({ nonce, isDev }: CspOptions): string => {
  const scriptSrc = ["'self'"];

  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`);
    /**
     * 'strict-dynamic' hace que los navegadores que lo soportan ignoren `'self'` en `script-src` y
     * confíen únicamente en los scripts con el nonce correcto más los que esos scripts carguen por
     * su cuenta (que es exactamente cómo el runtime de Next pide sus chunks). Sube el nivel: sin
     * esto, cualquier fichero .js del propio origen seguiría siendo un vector válido si alguien
     * consiguiera subir uno; con esto, hace falta el nonce.
     */
    scriptSrc.push("'strict-dynamic'");
  }

  if (isDev) {
    // 'unsafe-eval' lo requiere el runtime de desarrollo de Next (HMR/React Refresh);
    // en producción no hace falta y debilitaría la protección contra XSS.
    scriptSrc.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    /**
     * `style-src` sigue con 'unsafe-inline' y NO puede pasar a nonce: framer-motion anima
     * escribiendo en el atributo `style` de los elementos, y los nonces no aplican a atributos
     * inline (solo a elementos `<style>`). Cambiarlo a `'nonce-...'` mataría todas las
     * animaciones del sitio sin ganar nada. Es una limitación del mecanismo, no un descuido.
     */
    "style-src 'self' 'unsafe-inline'",
    // `data:` es necesario: los cursores SVG de globals.css son data URI, y las imágenes CSS
    // entran por img-src. `blob:` se quitó — no se genera ninguna URL de objeto en el sitio.
    "img-src 'self' data:",
    // next/font/google descarga las fuentes en build y las sirve desde /_next/static/media,
    // así que 'self' basta; no hay ninguna fuente embebida como data URI.
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // Estas tres sí heredarían de `default-src 'self'`, así que hoy son redundantes. Se
    // declaran igual porque 'none' es más estricto que 'self' (el sitio no embebe ningún
    // plugin ni iframe) y porque así siguen en pie si algún día se relaja `default-src`.
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self'",
  ].join("; ");
};
