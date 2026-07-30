import { NextResponse } from "next/server";
import { fetchHomelabStatus } from "@/lib/homelab";

/**
 * Estado del nodo del homelab (Toshiba).
 *
 * `HOMELAB_API_URL` es OPCIONAL y de uso exclusivamente local/VPN — ningún despliegue
 * público del portfolio la configura (ver el comment-block al inicio de lib/homelab.ts).
 * Sin ella, esta ruta devuelve el contenido curado de `HOMELAB_FALLBACK` con
 * `status: "active"`: es el modo normal de producción, no un fallo.
 *
 * Si se configura (modo local/VPN opcional), se lee junto a `HOMELAB_PIHOLE_API_URL`
 * (opcional, solo aporta `dnsQueriesBlocked`) desde `.env.local` (no versionado,
 * documentadas sin valor en `.env.example`). Nunca se hardcodean, y al no llevar el
 * prefijo `NEXT_PUBLIC_` tampoco llegan al bundle del cliente: el fetch a las fuentes
 * ocurre solo aquí, en el servidor. El navegador únicamente habla con
 * `/api/homelab-status`, así que no hay que tocar `connect-src` en la CSP.
 *
 * `fetchHomelabStatus` combina las fuentes con `Promise.allSettled` y devuelve el fallo
 * parcial explícito en el propio payload: `status: "degraded"` + `failedSources`, o
 * `status: "unreachable"` si el nodo configurado no responde.
 */
export const revalidate = 300;

export async function GET() {
  const status = await fetchHomelabStatus(revalidate);

  return NextResponse.json(status, {
    /**
     * Siempre 200, a diferencia de `/api/cyber-news` (que devuelve 502 si fallan todas
     * las fuentes). En el caso normal de producción (sin `HOMELAB_API_URL`) esto ni
     * siquiera es un fallo: es contenido curado con `status: "active"`. Y en el modo
     * local/VPN opcional, que el nodo esté apagado tampoco es un error del portfolio:
     * viaja explícito en el payload como `status: "unreachable"`. Con un 5xx el cliente
     * entraría en su rama de error y perdería ese payload, que es justo lo que la
     * tarjeta necesita para degradar bien.
     */
    status: 200,
    headers: { "Cache-Control": `s-maxage=${revalidate}, stale-while-revalidate=600` },
  });
}
