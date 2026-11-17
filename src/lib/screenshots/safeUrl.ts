import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * The capture opens a URL an editor typed, from inside the server. Only public https
 * sites may be visited: anything resolving to a loopback, private, link-local or
 * otherwise internal address is refused, so the screenshot job can't be pointed at the
 * database or another container (SSRF).
 */
const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // carrier-grade NAT
  /^198\.1[89]\./,
  /^2(2[4-9]|[3-5]\d)\./, // multicast and reserved
]

export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) return PRIVATE_V4.some((re) => re.test(address))
  const a = address.toLowerCase()
  if (a.startsWith('::ffff:')) return isPrivateAddress(a.slice(7))
  return (
    a === '::1' || a === '::' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80')
  )
}

export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error(`Only https URLs are captured (${raw})`)
  if (url.username || url.password) throw new Error('URLs with credentials are not captured')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new Error(`Refusing internal host ${host}`)
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`Refusing ${host}: it resolves to a non-public address`)
  }
  return url
}
