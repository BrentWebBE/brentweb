declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URI: string
      PAYLOAD_SECRET: string
      NEXT_PUBLIC_SERVER_URL: string
      PREVIEW_SECRET?: string
      CRON_SECRET?: string
      VERCEL_PROJECT_PRODUCTION_URL?: string

      FEATURE_BLOG?: 'true' | 'false'
      FEATURE_MENU?: 'true' | 'false'
      FEATURE_ECOMMERCE?: 'true' | 'false'

      STRIPE_SECRET_KEY?: string
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string
      STRIPE_WEBHOOKS_SIGNING_SECRET?: string

      SMTP_HOST?: string
      SMTP_PORT?: string
      SMTP_USER?: string
      SMTP_PASS?: string
      SMTP_FROM_ADDRESS?: string
      SMTP_FROM_NAME?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
