import type { Block } from 'payload'

import { l } from '@/utilities/label'

export const Menu: Block = {
  slug: 'menu',
  interfaceName: 'MenuBlock',
  labels: {
    singular: l('Menukaart', 'Menu'),
    plural: l('Menukaarten', 'Menus'),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: l('Titel', 'Heading'),
      defaultValue: 'Menukaart',
    },
    {
      name: 'intro',
      type: 'textarea',
      label: l('Inleiding', 'Intro'),
    },
    {
      name: 'categories',
      type: 'text',
      hasMany: true,
      label: l('Enkel deze categorieën', 'Only these categories'),
      admin: {
        description: l(
          'Leeg = alle categorieën. Typ de naam exact zoals bij de menu-items en druk op Enter.',
          'Empty = all categories. Type the name exactly as on the menu items and press Enter.',
        ),
      },
    },
    {
      name: 'showUnavailable',
      type: 'checkbox',
      label: l('Niet-beschikbare items tonen', 'Show unavailable items'),
      admin: {
        description: l(
          'Toont ze doorgestreept in plaats van ze te verbergen.',
          'Shows them struck through instead of hiding them.',
        ),
      },
    },
  ],
}
