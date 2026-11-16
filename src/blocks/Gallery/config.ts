import type { Block } from 'payload'

import { l } from '@/utilities/label'

export const Gallery: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: {
    singular: l('Galerij', 'Gallery'),
    plural: l('Galerijen', 'Galleries'),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: l('Titel', 'Heading'),
    },
    {
      name: 'images',
      type: 'upload',
      label: l('Afbeeldingen', 'Images'),
      relationTo: 'media',
      hasMany: true,
      minRows: 1,
      required: true,
      admin: {
        description: l(
          'Het bijschrift van de afbeelding wordt onder de foto getoond.',
          'The image caption is shown below the photo.',
        ),
      },
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
  ],
}
