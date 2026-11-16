import type { Tab } from 'payload'

import { l } from '@/utilities/label'

const pageField = (name: string, nl: string, en: string) => ({
  name,
  type: 'relationship' as const,
  label: l(nl, en),
  relationTo: 'pages' as const,
})

/**
 * SiteSettings tab (only registered when FEATURE_ECOMMERCE=true). The checkout links to
 * these pages and refuses to start a payment while any of them is missing.
 */
export const legalPagesTab: Tab = {
  label: l("Juridische pagina's", 'Legal pages'),
  fields: [
    {
      name: 'legalPages',
      type: 'group',
      label: l("Juridische pagina's (webshop)", 'Legal pages (shop)'),
      admin: {
        description: l(
          'Verplicht voor de webshop: de checkout linkt naar deze pagina’s en werkt pas als alle drie gepubliceerd zijn.',
          'Required for the shop: checkout links to these pages and only works once all three are published.',
        ),
      },
      fields: [
        pageField('termsPage', 'Algemene voorwaarden', 'Terms and conditions'),
        pageField('privacyPage', 'Privacybeleid', 'Privacy policy'),
        pageField('withdrawalPage', 'Herroepingsrecht', 'Right of withdrawal'),
      ],
    },
  ],
}
