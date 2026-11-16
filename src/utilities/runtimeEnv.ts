/**
 * Reads an environment variable at runtime.
 *
 * Next.js inlines every `process.env.NEXT_PUBLIC_*` reference at build time, in server
 * bundles too. The Docker image is built once in CI without client-specific values, so
 * server code must read such variables through a dynamic key, which Next documents as
 * never inlined. Use this helper for any value that comes from the container's env.
 */
export const runtimeEnv = (name: string): string | undefined => {
  const value = process.env[name]
  return value === '' ? undefined : value
}
