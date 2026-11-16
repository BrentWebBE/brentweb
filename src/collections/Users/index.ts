import type { CollectionConfig } from 'payload'

import { adminFieldOnly } from '@/access/adminFieldOnly'
import { isAdmin } from '@/access/isAdmin'
import { hasRole, isAdminUser, ROLES } from '@/access/roles'
import { l } from '@/utilities/label'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'

export const Users: CollectionConfig<'users'> = {
  slug: 'users',
  labels: {
    singular: l('Gebruiker', 'User'),
    plural: l('Gebruikers', 'Users'),
  },
  access: {
    // Both roles can log in to the admin panel.
    admin: ({ req: { user } }) => hasRole(user, 'admin', 'editor'),
    create: isAdmin,
    delete: isAdmin,
    // Editors can only read and update their own account (name, password).
    read: ({ req: { user } }) => {
      if (isAdminUser(user)) return true
      if (user) return { id: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => {
      if (isAdminUser(user)) return true
      if (user) return { id: { equals: user.id } }
      return false
    },
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    group: l('Beheer', 'Administration'),
    // Editors manage their own account via /admin/account only.
    hidden: ({ user }) => !isAdminUser(user),
    useAsTitle: 'name',
  },
  auth: {
    lockTime: 10 * 60 * 1000, // 10 minutes
    maxLoginAttempts: 5,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: l('Naam', 'Name'),
    },
    {
      name: 'role',
      type: 'select',
      label: l('Rol', 'Role'),
      access: adminFieldOnly,
      defaultValue: 'editor',
      options: [
        { label: l('Beheerder', 'Admin'), value: 'admin' },
        { label: l('Redacteur', 'Editor'), value: 'editor' },
      ] satisfies { label: Record<string, string>; value: (typeof ROLES)[number] }[],
      required: true,
      saveToJWT: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [ensureFirstUserIsAdmin],
  },
  timestamps: true,
}
