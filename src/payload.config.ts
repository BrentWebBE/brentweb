import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import { en } from '@payloadcms/translations/languages/en'
import { nl } from '@payloadcms/translations/languages/nl'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, type CollectionConfig, type Plugin, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Projects } from './collections/Projects'
import { Screenshots } from './collections/Screenshots'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { features } from './features'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { blogCollections, blogPlugins } from './modules/blog'
import { ecommerceCollections, ecommercePlugins } from './modules/ecommerce'
import { menuCollections } from './modules/menu'
import { basePlugins } from './plugins'
import { SiteSettings } from './SiteSettings/config'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { contentLocale, localeLabels, locales } from './lib/locales'
import { captureScreenshotsTask, SCREENSHOT_QUEUE } from './jobs/captureScreenshots'
import { chromePath } from './lib/screenshots/capture'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Feature modules are only registered when their flag is on (see src/features.ts).
const collections: CollectionConfig[] = [
  Pages,
  Projects,
  Testimonials,
  Media,
  Screenshots,
  ...(features.menu ? menuCollections : []),
  ...(features.ecommerce ? ecommerceCollections() : []),
  ...(features.blog ? blogCollections : []),
  Users,
]

const plugins: Plugin[] = [
  ...basePlugins,
  ...(features.blog ? blogPlugins : []),
  ...(features.ecommerce ? ecommercePlugins() : []),
]

/*
 * Payload's own mail (password resets, admin invites, form-builder notifications).
 * Resend when RESEND_API_KEY is set: the same account as the lead mails (src/lib/resend.ts),
 * and it works next to Microsoft 365, which no longer allows SMTP basic auth. SMTP stays
 * as a fallback for sites with a classic mail host. Neither: mails are logged to the
 * console (fine for local dev).
 */
const mailFrom = {
  defaultFromAddress:
    process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM_ADDRESS || 'noreply@example.com',
  defaultFromName: process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Website',
}
const email = process.env.RESEND_API_KEY
  ? resendAdapter({ ...mailFrom, apiKey: process.env.RESEND_API_KEY })
  : process.env.SMTP_HOST
    ? nodemailerAdapter({
        ...mailFrom,
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      })
    : undefined

export default buildConfig({
  admin: {
    components: {
      // Login and dashboard notes for editors.
      beforeLogin: ['@/components/BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard'],
      // BrentWeb branding: replace the files in src/client/branding/.
      graphics: {
        Icon: '@/client/branding/Icon',
        Logo: '@/client/branding/Logo',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' – BrentWeb',
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // Content languages. The codes double as URL prefixes (/nl-BE, /en). Dutch is written
  // first; an untranslated field falls back to it.
  localization: {
    locales: locales.map((code) => ({ code, label: localeLabels[code] })),
    defaultLocale: contentLocale,
    fallback: true,
  },
  i18n: {
    fallbackLanguage: 'nl',
    supportedLanguages: { nl, en },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections,
  cors: [getServerSideURL()].filter(Boolean),
  email,
  globals: [Header, Footer, SiteSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    // Types must always include every feature module, so they're only generated via
    // `pnpm generate:types` (which turns all flags on), never by `pnpm dev`.
    autoGenerate: false,
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [captureScreenshotsTask],
    // Live project screenshots: picked up every ten minutes, scheduled weekly by the
    // task itself. Only where Chrome is available (CHROME_PATH) and never during a build.
    autoRun: [{ cron: '0 */10 * * * *', queue: SCREENSHOT_QUEUE }],
    shouldAutoRun: () =>
      Boolean(chromePath()) && process.env.NEXT_PHASE !== 'phase-production-build',
  },
})
