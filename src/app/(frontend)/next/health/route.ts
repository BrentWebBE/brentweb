/**
 * Liveness probe for the Docker HEALTHCHECK.
 *
 * Deliberately does not touch MongoDB: Traefik stops routing to unhealthy containers,
 * and a short database hiccup shouldn't take every site offline.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
