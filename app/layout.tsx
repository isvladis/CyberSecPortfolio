import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { connection } from "next/server";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Dos familias con roles fijos (ver `app/globals.css`, tokens `--font-mono`/`--font-sans`):
 * `font-mono` (JetBrains Mono) para títulos, menús, badges — texto corto en mayúsculas;
 * `font-sans` (Inter) para párrafos largos (resumen ejecutivo, descripciones).
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Cybersecurity Portfolio`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: `${SITE_NAME} | Cybersecurity Portfolio`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Cybersecurity Portfolio`,
    description: SITE_DESCRIPTION,
  },
};

/**
 * `colorScheme: "dark"` es el que importa aquí: el sitio es negro absoluto y sin esta declaración
 * el navegador pinta los widgets de UA (barras de scroll, controles de formulario, autofill) en su
 * variante clara, que sobre este fondo se ve como un parche blanco.
 */
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
};

/**
 * `await connection()` es el precio del nonce de la CSP, no un capricho: Next solo puede inyectar
 * el `nonce` de `proxy.ts` en los scripts durante el SSR, leyéndolo de la cabecera del request. Una
 * ruta prerenderizada en build no tiene request, así que su HTML saldría con scripts inline sin
 * nonce y la CSP (que ya no lleva 'unsafe-inline') los bloquearía: página sin hidratar.
 *
 * Va en el layout y no en `app/page.tsx` para que cubra de una vez todo lo que renderiza dentro de
 * él, incluido el 404. `robots.txt` y `sitemap.xml` son rutas aparte y siguen siendo estáticas.
 *
 * Efecto secundario asumido: `/` pasa de estática a renderizada por request. Sin datos por usuario
 * ni consultas en el render (el contenido dinámico ya vive en `/api/*`, con su propio cacheo), el
 * coste es el render de un árbol de Server Components por visita.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <html lang="es" className={`h-full antialiased ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
