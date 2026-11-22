import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { adminOnlyTab } from '@/access/adminOnlyTab'
import { anyone } from '@/access/anyone'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { features } from '@/features'
import { ecommerceSiteSettingsTabs } from '@/modules/ecommerce'
import { l } from '@/utilities/label'

import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'
import { DAYS, SCHEMA_TYPES, SOCIAL_PLATFORMS } from './options'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const validateTime: TextFieldSingleValidation = (value, { siblingData }) => {
  if ((siblingData as { closed?: boolean })?.closed) return true
  if (!value) return 'Vul een uur in (bv. 09:00) of vink "Gesloten" aan.'
  return TIME_PATTERN.test(value) || 'Gebruik het formaat UU:MM, bv. 09:00.'
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: l('Bedrijfsgegevens', 'Site settings'),
  access: {
    read: anyone,
    update: isAdminOrEditor,
  },
  admin: {
    group: l('Instellingen', 'Settings'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: l('Bedrijf', 'Business'),
          fields: [
            {
              name: 'businessName',
              type: 'text',
              label: l('Bedrijfsnaam', 'Business name'),
              required: true,
            },
            {
              name: 'logo',
              type: 'upload',
              label: l('Logo', 'Logo'),
              relationTo: 'media',
            },
            {
              name: 'vatNumber',
              type: 'text',
              label: l('Btw-nummer', 'VAT number'),
              admin: {
                placeholder: 'BE0123.456.789',
              },
            },
            {
              name: 'kboNumber',
              type: 'text',
              label: l('Ondernemingsnummer (KBO)', 'Enterprise number (KBO)'),
              admin: { placeholder: '1039.059.149' },
            },
            {
              name: 'vatExempt',
              type: 'checkbox',
              label: l(
                'Kleine onderneming, vrijgesteld van btw (art. 56bis WBTW)',
                'Small business, VAT exempt (art. 56bis WBTW)',
              ),
            },
            {
              name: 'availability',
              type: 'select',
              label: l('Beschikbaarheid', 'Availability'),
              defaultValue: 'open',
              options: [
                { label: l('Open voor nieuw werk', 'Open for new work'), value: 'open' },
                { label: l('Beperkt beschikbaar', 'Limited availability'), value: 'limited' },
                {
                  label: l('Geen nieuwe projecten', 'Not taking new projects'),
                  value: 'unavailable',
                },
              ],
            },
            {
              name: 'personName',
              type: 'text',
              label: l(
                'Naam van de persoon achter de zaak',
                'Name of the person behind the business',
              ),
            },
            {
              name: 'portrait',
              type: 'upload',
              relationTo: 'media',
              label: l('Portretfoto', 'Portrait'),
            },
          ],
        },
        {
          label: l('Contact', 'Contact'),
          fields: [
            {
              name: 'address',
              type: 'group',
              label: l('Adres', 'Address'),
              fields: [
                {
                  name: 'street',
                  type: 'text',
                  label: l('Straat en nummer', 'Street and number'),
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'postalCode',
                      type: 'text',
                      label: l('Postcode', 'Postal code'),
                      admin: { width: '30%' },
                    },
                    {
                      name: 'city',
                      type: 'text',
                      label: l('Gemeente', 'City'),
                      admin: { width: '70%' },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'phone',
                  type: 'text',
                  label: l('Telefoon', 'Phone'),
                  admin: { width: '50%', placeholder: '+32 3 123 45 67' },
                },
                {
                  name: 'email',
                  type: 'email',
                  label: l('E-mail', 'Email'),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'whatsapp',
                  type: 'text',
                  label: l('WhatsApp-link', 'WhatsApp link'),
                  admin: { width: '50%', placeholder: 'https://wa.me/32465921862' },
                },
                {
                  name: 'bookingUrl',
                  type: 'text',
                  label: l('Link om een gesprek te plannen', 'Booking link'),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'locations',
              type: 'array',
              label: l('Plaatsen waar ik werk (kaart)', 'Places I work from (map)'),
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: l('Plaats', 'Place'), required: true },
                    { name: 'lat', type: 'number', label: 'Lat', required: true },
                    { name: 'lng', type: 'number', label: 'Lng', required: true },
                  ],
                },
              ],
            },
            {
              name: 'replyNote',
              type: 'textarea',
              label: l('Hoe snel ik antwoord', 'How fast I reply'),
              localized: true,
            },
          ],
        },
        {
          label: l('Openingsuren', 'Opening hours'),
          fields: [
            {
              name: 'openingHours',
              type: 'array',
              label: l('Openingsuren', 'Opening hours'),
              labels: {
                singular: l('Dag', 'Day'),
                plural: l('Dagen', 'Days'),
              },
              admin: {
                description: l(
                  'Voeg een dag twee keer toe voor een middagpauze (bv. 09:00–12:00 en 13:30–18:00).',
                  'Add a day twice for a lunch break (e.g. 09:00–12:00 and 13:30–18:00).',
                ),
                components: {
                  RowLabel: '@/SiteSettings/RowLabels#OpeningHoursRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'day',
                      type: 'select',
                      label: l('Dag', 'Day'),
                      options: DAYS.map(({ value, nl, en }) => ({ label: l(nl, en), value })),
                      required: true,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'open',
                      type: 'text',
                      label: l('Open', 'Opens'),
                      validate: validateTime,
                      admin: {
                        width: '20%',
                        placeholder: '09:00',
                        condition: (_, siblingData) => !siblingData?.closed,
                      },
                    },
                    {
                      name: 'close',
                      type: 'text',
                      label: l('Sluit', 'Closes'),
                      validate: validateTime,
                      admin: {
                        width: '20%',
                        placeholder: '18:00',
                        condition: (_, siblingData) => !siblingData?.closed,
                      },
                    },
                    {
                      name: 'closed',
                      type: 'checkbox',
                      label: l('Gesloten', 'Closed'),
                      admin: { width: '15%', style: { alignSelf: 'flex-end' } },
                    },
                  ],
                },
                {
                  name: 'note',
                  type: 'text',
                  label: l('Opmerking', 'Note'),
                  admin: {
                    placeholder: 'bv. enkel op afspraak',
                  },
                },
              ],
            },
          ],
        },
        {
          label: l('Sociale media', 'Social media'),
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              label: l('Sociale media', 'Social links'),
              labels: {
                singular: l('Link', 'Link'),
                plural: l('Links', 'Links'),
              },
              admin: {
                components: {
                  RowLabel: '@/SiteSettings/RowLabels#SocialLinkRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      label: l('Platform', 'Platform'),
                      options: SOCIAL_PLATFORMS.map(({ value, label }) => ({ label, value })),
                      required: true,
                      admin: { width: '30%' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: l('URL', 'URL'),
                      required: true,
                      validate: (value: string | null | undefined) =>
                        !value ||
                        /^https:\/\/\S+$/.test(value) ||
                        'Gebruik een volledige link die begint met https://',
                      admin: { width: '70%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        // Webshop module: legal pages required by the checkout.
        ...(features.ecommerce ? ecommerceSiteSettingsTabs : []),
        // Admin-only: structured data + indexing. Hidden for editors.
        adminOnlyTab({
          name: 'technical',
          label: l('Technisch', 'Technical'),
          fields: [
            {
              name: 'schemaType',
              type: 'select',
              label: l('Schema.org-type', 'Schema.org type'),
              defaultValue: 'LocalBusiness',
              options: SCHEMA_TYPES.map((value) => ({ label: value, value })),
              required: true,
              admin: {
                description: l(
                  'Type in de LocalBusiness JSON-LD.',
                  'Type used in the LocalBusiness JSON-LD.',
                ),
              },
            },
            {
              name: 'priceRange',
              type: 'text',
              label: l('Prijsklasse', 'Price range'),
              admin: { placeholder: '€€' },
            },
            {
              name: 'areaServed',
              type: 'array',
              label: l('Gebied voor zoekmachines', 'Area served (search engines)'),
              labels: { singular: l('Gebied', 'Area'), plural: l('Gebieden', 'Areas') },
              admin: {
                initCollapsed: true,
                description: l(
                  'Gemeenten en regio\'s in de bedrijfs-JSON-LD (areaServed). "België" wordt altijd toegevoegd. Leeg = Kempen, Geel, Blankenberge.',
                  'Towns and regions in the business JSON-LD (areaServed). "België" is always added. Empty = Kempen, Geel, Blankenberge.',
                ),
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'kind',
                      type: 'select',
                      defaultValue: 'City',
                      options: ['City', 'AdministrativeArea'],
                      required: true,
                      admin: { width: '30%' },
                    },
                    { name: 'name', type: 'text', required: true, admin: { width: '70%' } },
                  ],
                },
              ],
            },
            {
              name: 'noIndex',
              type: 'checkbox',
              label: l('Zoekmachines blokkeren (noindex)', 'Block search engines (noindex)'),
              admin: {
                description: l(
                  'Voor staging of een site in opbouw.',
                  'For staging or a site under construction.',
                ),
              },
            },
          ],
        }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}
