import type { Block } from 'payload'

import { link } from '@/fields/link'
import { l } from '@/utilities/label'

export const Services: Block = {
  slug: 'services',
  interfaceName: 'ServicesBlock',
  labels: {
    singular: l('Diensten', 'Services'),
    plural: l('Diensten', 'Services'),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: l('Titel', 'Heading'),
    },
    {
      name: 'intro',
      type: 'textarea',
      label: l('Inleiding', 'Intro'),
    },
    {
      name: 'columns',
      type: 'select',
      label: l('Kolommen', 'Columns'),
      defaultValue: '3',
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      label: l('Diensten', 'Services'),
      labels: {
        singular: l('Dienst', 'Service'),
        plural: l('Diensten', 'Services'),
      },
      minRows: 1,
      required: true,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: l('Titel', 'Title'),
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: l('Omschrijving', 'Description'),
        },
        {
          name: 'image',
          type: 'upload',
          label: l('Afbeelding', 'Image'),
          relationTo: 'media',
        },
        {
          name: 'enableLink',
          type: 'checkbox',
          label: l('Link toevoegen', 'Add link'),
        },
        link({
          appearances: false,
          overrides: {
            admin: {
              condition: (_data, siblingData) => Boolean(siblingData?.enableLink),
            },
          },
        }),
      ],
    },
  ],
}
