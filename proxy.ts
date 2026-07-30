import { NextResponse } from "next/server";
import type { NextProxy } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/csp";

/**
 * Nonces por request para la CSP.
 *
 * Este fichero se llama `proxy.ts` y no `middleware.ts` porque en Next 16 el convention
 * `middleware` está deprecado y renombrado a `proxy` (la función exportada también). Es el
 * mecanismo que la guía de CSP de Next señala para esto: el nonce tiene que existir antes de que
 * la página se renderice, y el proxy es el único punto que corre por request antes del render.
 *
 * Cómo encaja con el render, que es lo que hace que no haya que tocar ningún componente:
 * 1. Aquí se genera el nonce y se mete en la cabecera `Content-Security-Policy` de la REQUEST.
 * 2. Next parsea esa cabecera durante el SSR, extrae el valor de `'nonce-{...}'` y lo aplica solo
 *    a los scripts del framework, los bundles de la página y sus scripts/estilos inline.
 * 3. La misma CSP va en la RESPONSE, que es la que el navegador acaba aplicando.
 *
 * El `x-nonce` es para el caso en que algún Server Component necesite el nonce a mano (leyéndolo
 * con `headers()`, p.ej. para un `<Script>` de terceros). Hoy no hay ninguno: el sitio no tiene un
 * solo `<script>` inline propio, todos los scripts inline del HTML los pone Next y los cubre el
 * paso 2. Se deja porque es la vía documentada y no cuesta nada.
 *
 * Requisito que esto impone: el nonce solo puede inyectarse durante el SSR, así que las rutas que
 * lo usan tienen que renderizarse por request (ver `await connection()` en `app/layout.tsx`). Una
 * página prerenderizada en build no tiene request de la que sacar un nonce.
 */
const isDev = process.env.NODE_ENV === "development";

export const proxy: NextProxy = (request) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({ nonce, isDev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  // `NextResponse.next({ request })` propaga las cabeceras hacia el render (paso 2), no hacia el
  // cliente; la del cliente es el `headers.set` de abajo (paso 3). Hacen falta las dos.
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
};

export const config = {
  matcher: [
    /**
     * Solo lo que renderiza HTML. Queda fuera todo aquello donde un nonce no aporta nada y el
     * trabajo por request sería puro coste:
     * - `api`: los Route Handlers (`/api/cyber-news`, `/api/homelab-status`) devuelven JSON. Al
     *   excluirlos, el proxy no toca su pipeline ni su cacheo (`s-maxage`), y siguen recibiendo la
     *   CSP baseline de `next.config.ts`.
     * - `_next/static`: assets con hash, servidos con cache inmutable.
     * - `favicon.ico`, `robots.txt`, `sitemap.xml`: ficheros estáticos, sin scripts.
     * `_next/image` sí se usa (el logo en `CyberPortfolio` pasa por `next/image`) y también queda
     * fuera: son assets con hash servidos por el optimizador de imágenes, sin HTML ni scripts
     * inline que firmar, así que un nonce por request tampoco aportaría nada aquí.
     *
     * El bloque `missing` descarta los prefetch de `next/link`: se responden con el payload RSC,
     * no con HTML, así que no hay scripts inline que firmar y sería un nonce generado para nada.
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
