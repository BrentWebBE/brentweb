import { EUR } from '../config'

const formatter = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: EUR.code })

/** Formats an amount in cents (as stored by the ecommerce plugin), e.g. 1250 → "€ 12,50". */
export const formatCents = (cents: number | null | undefined): string =>
  typeof cents === 'number' ? formatter.format(cents / 10 ** EUR.decimals) : ''
