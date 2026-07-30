import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // 'unsafe-eval' lo requiere el runtime de desarrollo de Next (HMR/React Refresh);
          // en producción no hace falta y debilitaría la protección contra XSS.
          `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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
        ].join("; "),
      },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
