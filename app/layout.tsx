import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
