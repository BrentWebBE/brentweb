import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { eyebrowField } from '@/fields/heading'
import { linkGroup } from '@/fields/linkGroup'
import { l } from '@/utilities/label'

export const TextImage: Block = {
  slug: 'textImage',
  interfaceName: 'TextImageBlock',
  labels: {
    singular: l('Tekst + afbeelding', 'Text + image'),
    plural: l('Tekst + afbeelding', 'Text + image'),
  },
  fields: [
    eyebrowField(),
    {
      name: 'richText',
      type: 'richText',
      label: l('Tekst', 'Text'),
      required: true,
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
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: l('Afbeelding', 'Image'),
          relationTo: 'media',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'imagePosition',
          type: 'radio',
          label: l('Positie afbeelding', 'Image position'),
          defaultValue: 'right',
          options: [
            { label: l('Links', 'Left'), value: 'left' },
            { label: l('Rechts', 'Right'), value: 'right' },
          ],
          required: true,
          admin: { layout: 'horizontal', width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'photoStyle',
          type: 'select',
          label: l('Fotostijl', 'Photo style'),
          defaultValue: 'polaroid',
          options: [
            { label: l('Polaroid met tape', 'Taped polaroid'), value: 'polaroid' },
            { label: l('Getekend kader', 'Sketched frame'), value: 'frame' },
            { label: l('Gewoon', 'Plain'), value: 'plain' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'caption',
          type: 'text',
          label: l('Handgeschreven onderschrift', 'Handwritten caption'),
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'note',
      type: 'text',
      label: l('Handgeschreven notitie', 'Handwritten note'),
    },
    linkGroup({
      appearances: ['default', 'outline'],
      overrides: { maxRows: 2 },
    }),
  ],
}
