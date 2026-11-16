import type { GlobalConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: l('Footer', 'Footer'),
  access: {
    read: anyone,
    update: isAdminOrEditor,
  },
  admin: {
    group: l('Instellingen', 'Settings'),
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: l('Navigatie', 'Navigation'),
      labels: {
        singular: l('Menulink', 'Nav item'),
        plural: l('Menulinks', 'Nav items'),
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 12,
      localized: true,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'note',
      type: 'text',
      label: l('Handgeschreven notitie', 'Handwritten note'),
      localized: true,
      admin: { description: l('Bv. "Bedankt voor het scrollen!"', 'E.g. "Thanks for scrolling!"') },
    },
    {
      name: 'blurb',
      type: 'textarea',
      label: l('Korte tekst bij het logo', 'Short text by the logo'),
      localized: true,
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
