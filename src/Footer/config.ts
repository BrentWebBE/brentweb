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
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
