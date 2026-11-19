import type { Payload, TypedUser } from 'payload'
import React from 'react'

import { isAdminUser } from '@/access/roles'

const SOURCE_LABELS: Record<string, string> = {
  contactformulier: 'Contactformulier',
  schatter: 'Prijsschatter',
  websitecheck: 'Websitecheck',
}

const dateFormat = new Intl.DateTimeFormat('nl-BE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Brussels',
})

/** Open leads (status "Nieuw") on the dashboard, newest first. Admins only. */
export async function RecentLeads({ payload, user }: { payload: Payload; user?: TypedUser }) {
  if (!isAdminUser(user)) return null

  const { docs, totalDocs } = await payload.find({
    collection: 'leads',
    where: { status: { equals: 'new' } },
    sort: '-createdAt',
    limit: 5,
    depth: 0,
    pagination: true,
    user,
    overrideAccess: false,
  })

  const listUrl = '/admin/collections/leads?where[status][equals]=new'

  return (
    <div className="before-dashboard__leads">
      <h4>
        {totalDocs === 0
          ? 'Geen nieuwe aanvragen'
          : `${totalDocs} nieuwe ${totalDocs === 1 ? 'aanvraag' : 'aanvragen'}`}
      </h4>
      {docs.length > 0 && (
        <ul>
          {docs.map((lead) => (
            <li key={lead.id}>
              <a href={`/admin/collections/leads/${lead.id}`}>
                <strong>{lead.name}</strong>
              </a>
              {' · '}
              {SOURCE_LABELS[lead.source] ?? lead.source}
              {' · '}
              {dateFormat.format(new Date(lead.createdAt))}
            </li>
          ))}
        </ul>
      )}
      <a href={totalDocs > 0 ? listUrl : '/admin/collections/leads'}>Alle aanvragen →</a>
    </div>
  )
}
