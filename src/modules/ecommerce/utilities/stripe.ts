// Server-side only (uses the secret key); never import from client components.
import Stripe from 'stripe'

import { runtimeEnv } from '@/utilities/runtimeEnv'

/** Stripe API version the plugin's adapter is built against. */
export const STRIPE_API_VERSION = '2025-03-31.basil' as Stripe.StripeConfig['apiVersion']

let client: Stripe | undefined

export const getStripe = (): Stripe => {
  const secretKey = runtimeEnv('STRIPE_SECRET_KEY')
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set')
  client ??= new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    appInfo: { name: 'brentweb-starter' },
  })
  return client
}

/** Publishable key, read at runtime and passed to the checkout as a prop (never inlined). */
export const getStripePublishableKey = (): string | undefined =>
  runtimeEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
