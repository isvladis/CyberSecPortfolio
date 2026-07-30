/**
 * `NEXT_PUBLIC_SITE_URL` alimenta `metadataBase`, `openGraph.url`, `sitemap.xml` y `robots.txt`
 * (ver `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`). Sin la variable seteada en el
 * dashboard de Vercel (Project Settings → Environment Variables, ver `.env.example`), esos
 * cuatro lugares caían en `https://dyslabs-sec.local` — un placeholder con forma de dominio
 * real que, si el sitio se desplegaba sin configurar la variable, podía colarse en producción
 * sin que nadie lo notara al mirar el sitemap o el robots.txt.
 *
 * El fallback de abajo usa el TLD `.invalid`, reservado por la IANA/RFC 2606 específicamente
 * para nombres garantizados no-resolubles: si aparece en `sitemap.xml`/`robots.txt`/`og:url` es
 * inconfundible con un dominio real, así que la falta de configuración queda obvia en el propio
 * output en vez de pasar desapercibida. El `console.warn` al evaluar el módulo es la misma señal
 * durante el build (aparece una vez por cada ruta estática que importe `SITE_URL`).
 */
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!configuredSiteUrl) {
  console.warn(
    "[lib/site.ts] NEXT_PUBLIC_SITE_URL no está configurada. " +
      "En Vercel: Project Settings → Environment Variables → NEXT_PUBLIC_SITE_URL, con el dominio " +
      "*.vercel.app asignado al proyecto (o el dominio propio si se configura uno). " +
      "Mientras tanto, sitemap.xml/robots.txt/og:url van a mostrar un placeholder .invalid.",
  );
}

export const SITE_URL = configuredSiteUrl ?? "https://site-url-not-configured.invalid";

export const SITE_NAME = "DYSLABS_SEC";

export const SITE_DESCRIPTION =
  "Portfolio interactivo de ciberseguridad, hardening, redes privadas, automatizacion y proyectos fullstack.";
