import canUseDOM from './canUseDOM'
import { runtimeEnv } from './runtimeEnv'

/** Public URL of the site, read from the container env at runtime (never inlined at build). */
export const getServerSideURL = (): string => {
  const serverURL = runtimeEnv('NEXT_PUBLIC_SERVER_URL')
  if (serverURL) return serverURL.replace(/\/$/, '')

  const vercelURL = runtimeEnv('VERCEL_PROJECT_PRODUCTION_URL')
  if (vercelURL) return `https://${vercelURL}`

  return 'http://localhost:3000'
}

export const getClientSideURL = (): string => {
  // In the browser the current origin is always right, whatever the image was built with.
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  // Server-side rendering of client components.
  return getServerSideURL()
}
