import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./lib/csp";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      {
        /**
         * CSP baseline, SIN nonce y sin 'unsafe-inline' en `script-src`.
         *
         * Las rutas que renderizan HTML no se quedan con esta: `proxy.ts` sobreescribe la cabecera
         * con la misma política más el `'nonce-...'` del request. Esta baseline es la que cubre lo
         * que el matcher del proxy deja fuera (`/api/*`, `/_next/static/*`, `robots.txt`,
         * `sitemap.xml`, favicon) — sitios donde no hay HTML ni scripts inline y un nonce no
         * aportaría nada.
         *
         * Importante para no romper el nonce: aquí ya no puede volver 'unsafe-inline'. Si estuviera,
         * el navegador aceptaría cualquier script inline y el nonce dejaría de significar nada, que
         * es justo lo que este cambio elimina.
         */
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy({ isDev }),
      },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
