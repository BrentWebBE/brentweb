/**
 * Feature flags for brentweb-starter.
 *
 * Flags are read from the environment at runtime and default to `false`. They decide
 * which collections, plugins, blocks and frontend routes are registered. The build
 * doesn't depend on them (the frontend renders on request), so one image serves any
 * combination; changing a flag only needs a container restart.
 *
 * Note: `pnpm generate:types` and `pnpm generate:importmap` force every flag on,
 * so `payload-types.ts` always contains the types of every module.
 */
const isEnabled = (value: string | undefined): boolean => value === 'true' || value === '1'

export const features = {
  blog: isEnabled(process.env.FEATURE_BLOG),
  menu: isEnabled(process.env.FEATURE_MENU),
  ecommerce: isEnabled(process.env.FEATURE_ECOMMERCE),
} as const

export type Feature = keyof typeof features
