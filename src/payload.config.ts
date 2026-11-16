import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { en } from '@payloadcms/translations/languages/en'
import { nl } from '@payloadcms/translations/languages/nl'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, type CollectionConfig, type Plugin, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Feature modules are only registered when their flag is on (see src/features.ts).
const collections: CollectionConfig[] = [
  Pages,
  Media,
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

// Without SMTP settings Payload logs outgoing e-mails to the console (fine for local dev).
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'noreply@example.com',
      defaultFromName: process.env.SMTP_FROM_NAME || 'Website',
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
      titleSuffix: ' – BrentWeb CMS',
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
    tasks: [],
  },
})
