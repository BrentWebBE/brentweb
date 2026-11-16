import React from 'react'

import { getSiteSettings } from '@/utilities/getSiteSettings'

import { CheckoutView } from '../components/CheckoutView'
import { LEGAL_PAGES, resolveLegalLinks } from '../utilities/legalPages'
import { getStripePublishableKey } from '../utilities/stripe'

export async function CheckoutPage() {
  const settings = await getSiteSettings()
  const legalLinks = resolveLegalLinks(settings)
  const publishableKey = getStripePublishableKey()

  return (
    <div className="container pt-16 pb-24">
      <h1 className="font-heading mb-8 text-4xl">Afrekenen</h1>
      {!legalLinks || !publishableKey ? (
        <div
          className="max-w-2xl rounded-[var(--radius)] border border-border bg-card p-6"
          role="alert"
        >
          <p className="font-medium">Bestellen is tijdelijk niet mogelijk.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {!legalLinks
              ? `De webshop is nog niet volledig ingesteld: koppel en publiceer de pagina's ${LEGAL_PAGES.map((p) => p.label).join(', ')} in Instellingen → Bedrijfsgegevens → Juridische pagina's.`
              : 'De betaalmodule is nog niet geconfigureerd.'}
          </p>
        </div>
      ) : (
        <CheckoutView legalLinks={legalLinks} publishableKey={publishableKey} />
      )}
    </div>
  )
}
