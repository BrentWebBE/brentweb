'use client'

import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'


import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { shopRoutes, supportedCountries } from '../config'
import type { LegalLinks } from '../utilities/legalPages'
import { formatCents } from '../utilities/formatPrice'
import { lineInfo } from './CartView'

type Details = {
  email: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  postalCode: string
  city: string
  country: string
}

const emptyDetails: Details = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  postalCode: '',
  city: '',
  country: 'BE',
}

const stripePromises = new Map<string, Promise<Stripe | null>>()
const getStripe = (key: string) => {
  if (!stripePromises.has(key)) stripePromises.set(key, loadStripe(key, { locale: 'nl' }))
  return stripePromises.get(key)!
}

const Field: React.FC<{
  id: keyof Details
  label: string
  type?: string
  autoComplete?: string
  value: string
  onChange: (value: string) => void
  className?: string
}> = ({ autoComplete, className, id, label, onChange, type = 'text', value }) => (
  <div className={className}>
    <Label className="mb-1 block" htmlFor={id}>
      {label}
    </Label>
    <Input
      autoComplete={autoComplete}
      id={id}
      name={id}
      onChange={(e) => onChange(e.target.value)}
      required
      type={type}
      value={value}
    />
  </div>
)

const PaymentStep: React.FC<{ total: string; onBack: () => void }> = ({ onBack, total }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onPay = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    // Card and Bancontact both come back to the confirmation page, which verifies the
    // payment server-side. The webhook confirms it too, even if the customer never returns.
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${shopRoutes.confirmation}` },
    })
    setError(stripeError?.message ?? 'De betaling is niet gelukt. Probeer het opnieuw.')
    setSubmitting(false)
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onPay}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p className="text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={!stripe || submitting} size="lg" type="submit">
          {submitting ? 'Bezig met betalen…' : `Betalen ${total}`}
        </Button>
        <button className="text-sm underline-offset-4 hover:underline" onClick={onBack} type="button">
          Gegevens wijzigen
        </button>
      </div>
    </form>
  )
}

export const CheckoutView: React.FC<{ legalLinks: LegalLinks; publishableKey: string }> = ({
  legalLinks,
  publishableKey,
}) => {
  const { cart } = useCart()
  const { initiatePayment } = usePayments()
  const [details, setDetails] = useState<Details>(emptyDetails)
  const [accepted, setAccepted] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const stripePromise = useMemo(() => getStripe(publishableKey), [publishableKey])

  const items = (cart?.items ?? []).filter((item) => item.quantity > 0)
  const total = formatCents(cart?.subtotal)
  const set = (key: keyof Details) => (value: string) => setDetails((d) => ({ ...d, [key]: value }))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>Je winkelmand is leeg.</p>
        <Button asChild>
          <Link href={shopRoutes.listing}>Naar de shop</Link>
        </Button>
      </div>
    )
  }

  const onContinue = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accepted) {
      setError('Aanvaard de algemene voorwaarden om verder te gaan.')
      return
    }
    setLoading(true)
    setError(null)
    const address = {
      firstName: details.firstName,
      lastName: details.lastName,
      phone: details.phone,
      addressLine1: details.addressLine1,
      postalCode: details.postalCode,
      city: details.city,
      country: details.country,
    }
    try {
      const result = (await initiatePayment('stripe', {
        additionalData: {
          acceptedTerms: true,
          billingAddress: address,
          customerEmail: details.email,
          shippingAddress: address,
        },
      })) as { clientSecret?: string }
      if (!result?.clientSecret) throw new Error('missing client secret')
      setClientSecret(result.clientSecret)
    } catch {
      setError('Betalen starten lukte niet. Controleer je gegevens en probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
      <div>
        {clientSecret ? (
          <section aria-labelledby="betalen">
            <h2 className="font-heading mb-6 text-2xl" id="betalen">
              Betalen
            </h2>
            <Elements options={{ clientSecret, locale: 'nl' }} stripe={stripePromise}>
              <PaymentStep onBack={() => setClientSecret(null)} total={total} />
            </Elements>
          </section>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={onContinue}>
            <h2 className="font-heading text-2xl">Je gegevens</h2>
            <Field autoComplete="email" id="email" label="E-mailadres" onChange={set('email')} type="email" value={details.email} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field autoComplete="given-name" id="firstName" label="Voornaam" onChange={set('firstName')} value={details.firstName} />
              <Field autoComplete="family-name" id="lastName" label="Achternaam" onChange={set('lastName')} value={details.lastName} />
            </div>
            <Field autoComplete="tel" id="phone" label="Telefoon" onChange={set('phone')} type="tel" value={details.phone} />

            <h2 className="font-heading mt-4 text-2xl">Leveradres</h2>
            <Field autoComplete="street-address" id="addressLine1" label="Straat en nummer" onChange={set('addressLine1')} value={details.addressLine1} />
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <Field autoComplete="postal-code" id="postalCode" label="Postcode" onChange={set('postalCode')} value={details.postalCode} />
              <Field autoComplete="address-level2" id="city" label="Gemeente" onChange={set('city')} value={details.city} />
            </div>
            <div>
              <Label className="mb-1 block" htmlFor="country">
                Land
              </Label>
              <select
                autoComplete="country"
                className="h-10 w-full rounded-md border border-input bg-background px-3"
                id="country"
                onChange={(e) => set('country')(e.target.value)}
                value={details.country}
              >
                {supportedCountries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                checked={accepted}
                className="mt-1"
                name="acceptedTerms"
                onChange={(e) => setAccepted(e.target.checked)}
                type="checkbox"
              />
              <span>
                Ik heb de{' '}
                <Link className="underline" href={legalLinks.termsPage} target="_blank">
                  algemene voorwaarden
                </Link>{' '}
                gelezen en ga ermee akkoord. Ik ken mijn{' '}
                <Link className="underline" href={legalLinks.withdrawalPage} target="_blank">
                  herroepingsrecht
                </Link>{' '}
                en het{' '}
                <Link className="underline" href={legalLinks.privacyPage} target="_blank">
                  privacybeleid
                </Link>
                .
              </span>
            </label>

            {error && (
              <p className="text-destructive" role="alert">
                {error}
              </p>
            )}
            <div>
              <Button disabled={loading} size="lg" type="submit">
                {loading ? 'Even geduld…' : 'Verder naar betalen'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="font-heading text-xl">Overzicht</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => {
            const info = lineInfo(item)
            return (
              <li className="flex justify-between gap-4" key={item.id}>
                <span>
                  {item.quantity} × {info.title}
                  {info.variantTitle ? ` – ${info.variantTitle}` : ''}
                </span>
                <span className="tabular-nums">{formatCents(info.lineTotal)}</span>
              </li>
            )
          })}
        </ul>
        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-medium">Totaal (incl. btw)</span>
          <span className="text-xl font-medium tabular-nums">{total}</span>
        </div>
        <p className="text-xs text-muted-foreground">Betalen kan met Bancontact of kaart (Visa, Mastercard).</p>
      </aside>
    </div>
  )
}
