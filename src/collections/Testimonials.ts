import type { CollectionConfig } from 'payload'

import { expireTag } from '@/utilities/expireTag'

import { anyone } from '@/access/anyone'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { TESTIMONIALS_TAG } from '@/utilities/cacheTags'
import { l } from '@/utilities/label'

/**
 * Client quotes. Only real, attributable quotes, with the client's permission, copied
 * word for word: never invented copy. Stars are shown only as the client gave them on
 * Google (`rating`), never as Review/AggregateRating markup (Google treats reviews a
 * business publishes about itself as self-serving).
 */
export const Testimonials: CollectionConfig<'testimonials'> = {
  slug: 'testimonials',
  labels: { singular: l('Review', 'Testimonial'), plural: l('Reviews', 'Testimonials') },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: anyone,
    update: isAdminOrEditor,
  },
  admin: {
    group: l('Inhoud', 'Content'),
    useAsTitle: 'business',
    defaultColumns: ['business', 'name', 'visible'],
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      label: l('Citaat (letterlijk, niet vertaald)', 'Quote (verbatim, not translated)'),
      required: true,
    },
    {
      name: 'lang',
      type: 'select',
      label: l('Taal van het citaat', 'Language of the quote'),
      defaultValue: 'nl',
      options: [
        { label: 'Nederlands', value: 'nl' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: l('Naam', 'Name') },
        { name: 'role', type: 'text', label: l('Functie', 'Role') },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'business', type: 'text', label: l('Zaak', 'Business'), required: true },
        {
          name: 'website',
          type: 'text',
          label: l('Website (zonder https://)', 'Website (no https://)'),
        },
      ],
    },
    {
      name: 'context',
      type: 'text',
      label: l('Context', 'Context'),
      localized: true,
      admin: { description: l('Bv. "Klant sinds 2021".', 'E.g. "Client since 2021".') },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'source',
          type: 'select',
          label: l('Bron', 'Source'),
          defaultValue: 'direct',
          options: [
            { label: l('Rechtstreeks', 'Direct'), value: 'direct' },
            { label: 'Google', value: 'google' },
          ],
          admin: {
            description: l(
              'Google: toont een Google-badge bij het citaat.',
              'Google: shows a Google badge with the quote.',
            ),
          },
        },
        {
          name: 'rating',
          type: 'number',
          label: l('Sterren (zoals op Google)', 'Stars (as on Google)'),
          min: 1,
          max: 5,
          admin: {
            condition: (_, siblingData) => siblingData?.source === 'google',
            description: l(
              'Alleen invullen zoals de klant het echt gaf. Leeg = geen sterren.',
              'Only as the client actually gave it. Empty = no stars.',
            ),
          },
        },
      ],
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      label: l('Bijhorend project', 'Related project'),
    },
    {
      name: 'visible',
      type: 'checkbox',
      label: l('Tonen op de site', 'Show on the site'),
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) expireTag(TESTIMONIALS_TAG)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) expireTag(TESTIMONIALS_TAG)
        return doc
      },
    ],
  },
}
