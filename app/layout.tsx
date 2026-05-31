import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
