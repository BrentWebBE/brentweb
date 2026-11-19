import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { l } from '@/utilities/label'

/**
 * Every lead from the site's own forms (contact form, estimator, website check), saved
 * next to the e-mail and the n8n → Twenty hand-off so nothing depends on one channel.
 * Written only by the server actions (local API, overrideAccess); never public.
 * Personal data: admins only, delete what you no longer need.
 */
export const Leads: CollectionConfig<'leads'> = {
  slug: 'leads',
  labels: { singular: l('Aanvraag', 'Lead'), plural: l('Aanvragen', 'Leads') },
  access: {
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    group: l('Klanten', 'Clients'),
    useAsTitle: 'name',
    defaultColumns: ['name', 'source', 'status', 'email', 'createdAt'],
    listSearchableFields: ['name', 'email', 'companyWebsite', 'message'],
  },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: l('Naam', 'Name'), required: true },
        { name: 'email', type: 'email', label: l('E-mail', 'E-mail'), required: true },
      ],
    },
    {
      name: 'source',
      type: 'select',
      label: l('Bron', 'Source'),
      required: true,
      options: [
        { label: l('Contactformulier', 'Contact form'), value: 'contactformulier' },
        { label: l('Prijsschatter', 'Estimator'), value: 'schatter' },
        { label: l('Websitecheck', 'Website check'), value: 'websitecheck' },
      ],
      admin: { readOnly: true },
    },
    { name: 'companyWebsite', type: 'text', label: l('Website', 'Website') },
    {
      type: 'row',
      fields: [
        { name: 'budget', type: 'text', label: l('Budget', 'Budget') },
        { name: 'timeline', type: 'text', label: l('Timing', 'Timeline') },
      ],
    },
    { name: 'message', type: 'textarea', label: l('Bericht', 'Message') },
    {
      name: 'estimator',
      type: 'json',
      label: l('Schatting (antwoorden + berekening)', 'Estimate (answers + result)'),
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.estimator),
      },
    },
    {
      name: 'status',
      type: 'select',
      label: l('Status', 'Status'),
      defaultValue: 'new',
      required: true,
      options: [
        { label: l('Nieuw', 'New'), value: 'new' },
        { label: l('Gecontacteerd', 'Contacted'), value: 'contacted' },
        { label: l('Offerte', 'Quoted'), value: 'quoted' },
        { label: l('Gewonnen', 'Won'), value: 'won' },
        { label: l('Verloren', 'Lost'), value: 'lost' },
        { label: l('Spam', 'Spam'), value: 'spam' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: l('Interne notities', 'Internal notes'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'delivery',
      type: 'group',
      label: l('Doorgestuurd', 'Delivered'),
      admin: { position: 'sidebar', readOnly: true },
      fields: [
        { name: 'email', type: 'checkbox', label: l('E-mail verstuurd', 'E-mail sent') },
        { name: 'crm', type: 'checkbox', label: l('In CRM (n8n → Twenty)', 'In CRM (n8n → Twenty)') },
      ],
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'locale', type: 'text', label: l('Taal', 'Language'), admin: { readOnly: true } },
      ],
    },
    {
      name: 'pageUrl',
      type: 'text',
      label: l('Verstuurd vanaf', 'Sent from'),
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
