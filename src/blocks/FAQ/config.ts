import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { l } from '@/utilities/label'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: {
    singular: l('Veelgestelde vragen', 'FAQ'),
    plural: l('Veelgestelde vragen', 'FAQ'),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: l('Titel', 'Heading'),
      defaultValue: 'Veelgestelde vragen',
    },
    {
      name: 'items',
      type: 'array',
      label: l('Vragen', 'Questions'),
      labels: {
        singular: l('Vraag', 'Question'),
        plural: l('Vragen', 'Questions'),
      },
      minRows: 1,
      required: true,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'question',
          type: 'text',
          label: l('Vraag', 'Question'),
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          label: l('Antwoord', 'Answer'),
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
        },
      ],
    },
  ],
}
