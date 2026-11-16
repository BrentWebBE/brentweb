/**
 * The visitor's IP, for rate limiting.
 *
 * The first X-Forwarded-For entry is whatever the client sent, so keying a
 * limiter on it lets anyone reset their budget by adding the header. Traefik
 * sets X-Real-Ip from the connection itself, so that comes first. Without it
 * (local dev, or a proxy that doesn't set it), the last X-Forwarded-For entry
 * is the one appended by the closest proxy, which the client can't choose.
 *
 * brentweb.be is proxied by Cloudflare, so that connection is usually a
 * Cloudflare edge server shared by many visitors. Only then is
 * CF-Connecting-IP used: Cloudflare always overwrites it with the visitor's
 * address. A request that reaches the server directly keeps its own address
 * and its CF-Connecting-IP is ignored, so the header cannot be used to dodge
 * the limit. (X-Real-IP cannot be set by Cloudflare, and a visitor-supplied
 * X-Real-IP is passed through by Cloudflare, so it must not be trusted.)
 */
export function clientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) {
    if (isCloudflare(realIp)) {
      const visitor = headers.get('cf-connecting-ip')?.trim()
      if (visitor) return visitor
    }
    return realIp
  }

  const forwarded = headers.get('x-forwarded-for')
  const last = forwarded
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .pop()
  return last || 'unknown'
}

// https://www.cloudflare.com/ips/ (fetched 2026-10-29). The list changes
// rarely; Cloudflare announces changes well in advance.
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
].map(parseCidr)

export function isCloudflare(ip: string): boolean {
  const addr = parseIp(ip)
  if (!addr) return false
  return CLOUDFLARE_RANGES.some(
    (r) => r.bits === addr.bits && addr.value >> BigInt(r.bits - r.prefix) === r.network,
  )
}

type Addr = { value: bigint; bits: 32 | 128 }

function parseIp(raw: string): Addr | null {
  const ip = raw.replace(/^::ffff:(?=\d+\.)/i, '') // IPv4-mapped IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split('.').map(Number)
    if (parts.some((p) => p > 255)) return null
    return { value: parts.reduce((acc, p) => (acc << 8n) | BigInt(p), 0n), bits: 32 }
  }
  if (!ip.includes(':') || !/^[0-9a-f:]+$/i.test(ip)) return null
  const halves = ip.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  if (groups.some((g) => g.length === 0 || g.length > 4)) return null
  return { value: groups.reduce((acc, g) => (acc << 16n) | BigInt(parseInt(g, 16)), 0n), bits: 128 }
}

function parseCidr(cidr: string): { network: bigint; prefix: number; bits: 32 | 128 } {
  const [ip, len] = cidr.split('/')
  const addr = parseIp(ip)
  if (!addr) throw new Error(`bad CIDR ${cidr}`)
  const prefix = Number(len)
  return { network: addr.value >> BigInt(addr.bits - prefix), prefix, bits: addr.bits }
}
