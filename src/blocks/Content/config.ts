import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { l } from '@/utilities/label'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    label: l('Breedte', 'Size'),
    defaultValue: 'oneThird',
    options: [
      {
        label: l('Een derde', 'One third'),
        value: 'oneThird',
      },
      {
        label: l('Helft', 'Half'),
        value: 'half',
      },
      {
        label: l('Twee derde', 'Two thirds'),
        value: 'twoThirds',
      },
      {
        label: l('Volledig', 'Full'),
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: l('Tekst', 'Text'),
  },
  {
    name: 'enableLink',
    type: 'checkbox',
    label: l('Link toevoegen', 'Add link'),
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: {
    singular: l('Tekst (kolommen)', 'Content (columns)'),
    plural: l('Tekst (kolommen)', 'Content (columns)'),
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: l('Kolommen', 'Columns'),
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
  ],
}
