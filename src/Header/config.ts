import type { GlobalConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: l('Header', 'Header'),
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
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
