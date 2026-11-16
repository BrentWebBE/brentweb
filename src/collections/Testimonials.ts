import type { CollectionConfig } from 'payload'

import { revalidateTag } from 'next/cache'

import { anyone } from '@/access/anyone'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { EXPIRE_NOW, TESTIMONIALS_TAG } from '@/utilities/cacheTags'
import { l } from '@/utilities/label'

/**
 * Client quotes. Only real, attributable quotes, with the client's permission, copied
 * word for word: never invented copy. No stars or Review markup (Google treats reviews a
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
        if (!context.disableRevalidate) revalidateTag(TESTIMONIALS_TAG, EXPIRE_NOW)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) revalidateTag(TESTIMONIALS_TAG, EXPIRE_NOW)
        return doc
      },
    ],
  },
}
