import React from 'react'

import type { ContactBlock as ContactBlockProps } from '@/payload-types'

import { FormBlock, type FormBlockType } from '@/blocks/Form/Component'
import RichText from '@/components/RichText'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { cn } from '@/utilities/ui'

import { isAllowedMapEmbedUrl } from './mapEmbed'

export const ContactBlock: React.FC<ContactBlockProps> = async ({
  form,
  introContent,
  mapEmbedUrl,
  showContactDetails,
}) => {
  const settings = showContactDetails ? await getSiteSettings() : null
  const address = settings?.address
  const hasAddress = Boolean(address?.street || address?.city)
  const showDetails = Boolean(settings && (hasAddress || settings.phone || settings.email))

  return (
    <section className="container">
      {introContent && (
        <RichText className="mb-10 max-w-2xl" data={introContent} enableGutter={false} />
      )}

      <div className={cn('grid gap-10', { 'lg:grid-cols-[2fr_1fr]': showDetails })}>
        {form && typeof form === 'object' && (
          <FormBlock
            className="w-full"
            enableIntro={false}
            // The generated `Form` type and the plugin's form type describe the same document.
            form={form as unknown as FormBlockType['form']}
          />
        )}

        {showDetails && settings && (
          <address className="not-italic flex flex-col gap-4">
            {settings.businessName && (
              <p className="font-heading text-xl">{settings.businessName}</p>
            )}
            {hasAddress && (
              <p>
                {address?.street}
                <br />
                {[address?.postalCode, address?.city].filter(Boolean).join(' ')}
              </p>
            )}
            {settings.phone && (
              <p>
                <a
                  className="underline-offset-4 hover:underline"
                  href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                >
                  {settings.phone}
                </a>
              </p>
            )}
            {settings.email && (
              <p>
                <a className="underline-offset-4 hover:underline" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </p>
            )}
          </address>
        )}
      </div>

      {isAllowedMapEmbedUrl(mapEmbedUrl) && (
        <div className="mt-10 overflow-hidden rounded-[var(--radius)] border border-border">
          <iframe
            allowFullScreen
            className="block h-[24rem] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbedUrl}
            title={settings?.businessName ? `Kaart – ${settings.businessName}` : 'Kaart'}
          />
        </div>
      )}
    </section>
  )
}
