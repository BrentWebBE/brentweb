import type { CollectionBeforeChangeHook } from 'payload'

import type { User } from '@/payload-types'

/**
 * The first user (created via /admin/create-first-user) has no session yet, so the
 * admin-only `role` field would fall back to its default ("editor"). Promote that
 * first account to admin so the site always has at least one administrator.
 */
export const ensureFirstUserIsAdmin: CollectionBeforeChangeHook<User> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  // Not `count()`: without a filter it maps to estimatedDocumentCount, which MongoDB
  // refuses inside a transaction (and create runs in one on a replica set).
  const { docs } = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    select: {},
  })

  if (docs.length === 0) {
    return { ...data, role: 'admin' }
  }

  return data
}
