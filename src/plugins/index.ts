import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { Plugin } from 'payload'

import { anyone } from '@/access/anyone'
import { isAdmin } from '@/access/isAdmin'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { isAdminUser } from '@/access/roles'
import { linkableCollections } from '@/fields/linkableCollections'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { contentLocale } from '@/lib/locales'
import { isLocale } from '@/lib/locale'
import { docHref } from '@/lib/routing'
import { Page, Post, Project } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { l } from '@/utilities/label'

const generateTitle: GenerateTitle<Post | Page | Project> = async ({ doc, req }) => {
  const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req })
  return [doc?.title, settings?.businessName].filter(Boolean).join(' | ')
}

const generateURL: GenerateURL<Post | Page | Project> = ({ collectionConfig, doc, locale }) => {
  const url = getServerSideURL()
  const href = docHref(
    isLocale(locale) ? locale : contentLocale,
    collectionConfig?.slug ?? 'pages',
    doc,
  )
  return href ? `${url}${href}` : url
}

/**
 * Plugins that every site gets. Feature modules add their own plugins in payload.config.ts.
 */
export const basePlugins: Plugin[] = [
  redirectsPlugin({
    collections: linkableCollections,
    overrides: {
      access: {
        create: isAdmin,
        delete: isAdmin,
        read: anyone,
        update: isAdmin,
      },
      admin: {
        group: l('Beheer', 'Administration'),
        hidden: ({ user }) => !isAdminUser(user),
      },
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    // Form definitions (fields, e-mail notifications) are technical: admins only.
    // Read stays public so the frontend can render forms.
    formOverrides: {
      access: {
        create: isAdmin,
        delete: isAdmin,
        read: anyone,
        update: isAdmin,
      },
      admin: {
        group: l('Formulieren', 'Forms'),
        hidden: ({ user }) => !isAdminUser(user),
      },
      labels: {
        singular: l('Formulier', 'Form'),
        plural: l('Formulieren', 'Forms'),
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    // Submissions: anyone can submit, editors and admins can view and delete them.
    // Updates stay disabled (plugin default) so submissions can't be altered.
    formSubmissionOverrides: {
      access: {
        create: anyone,
        delete: isAdminOrEditor,
        read: isAdminOrEditor,
      },
      admin: {
        group: l('Formulieren', 'Forms'),
      },
      labels: {
        singular: l('Inzending', 'Submission'),
        plural: l('Inzendingen', 'Submissions'),
      },
    },
  }),
]
