import type { Field, NamedTab } from 'payload'

import { adminFieldOnly } from './adminFieldOnly'
import { isAdminUser } from './roles'

const withAdminAccess = (field: Field): Field => {
  // UI-only fields (e.g. the SEO plugin's overview/preview) hold no data.
  if (field.type === 'ui') return field
  if ('name' in field && field.name) {
    return { ...field, access: adminFieldOnly } as Field
  }
  // Layout fields (row, collapsible): apply to their children.
  if ('fields' in field && Array.isArray(field.fields)) {
    return { ...field, fields: field.fields.map(withAdminAccess) } as Field
  }
  return field
}

/**
 * Makes a named tab admin-only:
 * - API: tab + field-level access (create/update admin only; read hidden for editors,
 *   still public for anonymous requests such as the frontend).
 * - Admin UI: Payload builds permissions from field access, not tab access, so every
 *   data field gets `adminFieldOnly` and the tab is hidden for non-admins via `condition`.
 */
export const adminOnlyTab = (tab: NamedTab): NamedTab => ({
  ...tab,
  access: adminFieldOnly,
  admin: {
    ...tab.admin,
    condition: (_data, _siblingData, { user }) => isAdminUser(user),
  },
  fields: tab.fields.map(withAdminAccess),
})
