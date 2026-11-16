import type { Block, TextFieldSingleValidation } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { l } from '@/utilities/label'

import { isAllowedMapEmbedUrl, normalizeMapEmbedUrl } from './mapEmbed'

const validateMapEmbedUrl: TextFieldSingleValidation = (value) => {
  if (!value) return true
  if (isAllowedMapEmbedUrl(normalizeMapEmbedUrl(value))) return true
  return 'Gebruik een Google Maps- of OpenStreetMap-insluitlink (Delen → Kaart insluiten).'
}

export const Contact: Block = {
  slug: 'contact',
  interfaceName: 'ContactBlock',
  labels: {
    singular: l('Contact', 'Contact'),
    plural: l('Contact', 'Contact'),
  },
  fields: [
    {
      name: 'introContent',
      type: 'richText',
      label: l('Inleiding', 'Intro'),
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'form',
      type: 'relationship',
      label: l('Formulier', 'Form'),
      relationTo: 'forms',
      required: true,
    },
    {
      name: 'showContactDetails',
      type: 'checkbox',
      label: l('Contactgegevens tonen', 'Show contact details'),
      defaultValue: true,
      admin: {
        description: l(
          'Adres, telefoon en e-mail uit de bedrijfsgegevens.',
          'Address, phone and email from site settings.',
        ),
      },
    },
    {
      name: 'mapEmbedUrl',
      type: 'text',
      label: l('Kaart (optioneel)', 'Map (optional)'),
      validate: validateMapEmbedUrl,
      admin: {
        description: l(
          'Google Maps → Delen → Kaart insluiten → kopieer de HTML en plak die hier. De link wordt automatisch overgenomen.',
          'Google Maps → Share → Embed a map → copy the HTML and paste it here. The link is extracted automatically.',
        ),
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? normalizeMapEmbedUrl(value) : value),
        ],
      },
    },
  ],
}
