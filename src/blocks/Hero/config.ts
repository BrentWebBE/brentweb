import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'
import { l } from '@/utilities/label'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: l('Hero', 'Hero'),
    plural: l('Heroes', 'Heroes'),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'highImpact',
      label: l('Type', 'Type'),
      options: [
        {
          label: l('Groot (beeld op volle breedte)', 'High impact (full-width image)'),
          value: 'highImpact',
        },
        {
          label: l('Middel (tekst boven beeld)', 'Medium impact (text above image)'),
          value: 'mediumImpact',
        },
        {
          label: l('Klein (enkel tekst)', 'Low impact (text only)'),
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: l('Tekst', 'Text'),
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      label: l('Afbeelding', 'Image'),
      admin: {
        condition: (_, siblingData) =>
          ['highImpact', 'mediumImpact'].includes(siblingData?.type as string),
      },
      relationTo: 'media',
      required: true,
    },
  ],
}
