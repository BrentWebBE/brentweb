# brentweb-starter

Payload 3 + Next.js starter for BrentWeb client sites (Flemish SMEs). Clients edit content;
design, SEO internals and code stay with BrentWeb. Based on the official Payload website template
(original README below).

## Quick start

```bash
cp .env.example .env            # fill in PAYLOAD_SECRET / PREVIEW_SECRET / CRON_SECRET
docker compose -f docker/compose.dev.yml up -d   # MongoDB 8, replica set rs0 on 127.0.0.1:27017
pnpm install
pnpm dev                        # http://localhost:3000/admin → create the first user (becomes admin)
```

## Where things live

| What | Where |
| --- | --- |
| Feature flags (`FEATURE_BLOG`, `FEATURE_MENU`, `FEATURE_ECOMMERCE`) | `src/features.ts`, wired in `src/payload.config.ts` |
| Blog (posts, categories, search, archive block, `/posts`, `/search`) | `src/modules/blog/` (route files in `src/app/(frontend)` only guard + delegate) |
| Menu (MenuItems + Menu block) | `src/modules/menu/` |
| Page blocks | `src/blocks/<Block>/{config.ts,Component.tsx}`, rendered by `src/blocks/RenderBlocks.tsx` |
| Business data (NAP, hours, socials, JSON-LD type) | `SiteSettings` global, `src/SiteSettings/` |
| Roles & access helpers | `src/access/` (`isAdmin`, `isAdminOrEditor`, `adminFieldOnly`, `adminOnlyTab`) |
| **Everything client-specific (styling)** | `src/client/` → `theme.css` (tokens), `fonts.ts`, `branding/` (admin logo/icon) |
| Docker image / CI | `docker/Dockerfile`, `.github/workflows/build.yml` |
| Server: shared Mongo, per-site compose, Traefik middleware | `deploy/infra/`, `deploy/site/`, `deploy/traefik/` |
| New client, backup, restore | `scripts/new-client.sh`, `scripts/backup.sh`, `scripts/restore.sh` |

## Rules of thumb

- Flags, URL and secrets are runtime env only: the build needs no database and bakes in nothing
  client-specific (see "Build once, configure at runtime" below).
- `pnpm generate:types` / `pnpm generate:importmap` always run with every flag on, so
  `payload-types.ts` covers all modules. `pnpm dev` does not regenerate types (`autoGenerate: false`).
- Admin-only fields: use `adminFieldOnly` (field) or `adminOnlyTab()` (named tab). Tab-level `access`
  alone is not reflected in admin permissions in Payload 3, so the helper also hides the tab.
- New page block: add `config.ts` + `Component.tsx`, register it in `src/collections/Pages/index.ts`,
  add a `case` to `RenderBlocks.tsx` (the type check fails until you do), run `pnpm generate:types`.

## Build once, configure at runtime

One Docker image per client repo, built in GitHub Actions, configured entirely by the
container's `.env`. The image contains no secrets, no domain and no feature flags.

**Do `NEXT_PUBLIC_*` values need to be present at build time?** In a stock Next.js app:
yes. Next replaces every `process.env.NEXT_PUBLIC_*` reference with a literal at build
time, in the browser bundles **and** in server code (checked in
`next/dist/build/define-env.js`). On top of that, the template prerendered pages at build
time, which needs MongoDB (unreachable from CI) and froze feature flags into static HTML.

What the starter does instead (runtime config, not build args):

- **`NEXT_PUBLIC_SERVER_URL` is read at runtime.** Server code goes through
  `src/utilities/runtimeEnv.ts`, which looks the variable up with a dynamic key; Next
  documents that dynamic lookups are never inlined. In the browser,
  `getClientSideURL()` uses `window.location`, so the browser never needs the value.
  No other `NEXT_PUBLIC_*` variables exist; if you add one that the browser needs, pass
  it from a server component as a prop rather than reading `process.env` in client code.
- **The frontend renders on request** (`export const dynamic = 'force-dynamic'` in
  `src/app/(frontend)/layout.tsx`), so `next build` never touches the database.
  Published pages, posts and globals are cached in Next's data cache (`unstable_cache` +
  tags) and the Payload `afterChange`/`afterDelete` hooks expire those tags, so most
  requests don't query MongoDB. The cache starts cold after a container restart.
- **robots.txt and the sitemap index are routes**, generated per request from the
  runtime URL (they used to be written to `public/` by `next-sitemap` at build time).
- **Feature flags are runtime env**: changing `FEATURE_*` in `.env` + `docker compose up -d`
  is enough, no rebuild.

Why not build args: they'd tie each image to one domain and flag set (so staging needs
its own build), put client values in the CI config, and still wouldn't solve the build's
database dependency.

## Deploying a client site

### Once per server

1. **Traefik**: already running, with the external network `traefik`, entrypoint
   `websecure` and certresolver `letsencrypt`. Nothing changes in its config except one
   new file for the file provider: copy `deploy/traefik/admin-ratelimit.yml` into the
   directory your file provider watches. Without it, the admin routers point to a missing
   `admin-ratelimit@file` middleware and Traefik won't serve `/admin`.
2. **MongoDB**: follow [`deploy/infra/README.md`](deploy/infra/README.md) (keyfile,
   `docker compose up -d`, `rs.initiate()`).
3. **Registry access**: GHCR packages are private by default. On the server, log in once
   with a GitHub token that has `read:packages`:
   `echo <token> | docker login ghcr.io -u <github-user> --password-stdin`.
4. **Backups**: see [Backups](#backups) below.

### Per client

1. **Create the client repo** from this starter (GitHub → "Use this template") and push
   to `main`. The *Build image* workflow pushes `ghcr.io/<owner>/<repo>:latest` and
   `:sha-<short>`; tag `vX.Y.Z` for versioned images. For an ARM server (Hetzner CAX), set
   the repo variable `IMAGE_PLATFORMS=linux/amd64,linux/arm64`.
2. **Generate the deploy files** in the client repo (on your machine):
   ```sh
   scripts/new-client.sh bakkerij-jansen bakkerijjansen.be --menu
   ```
   This writes `out/bakkerij-jansen/compose.yml` and `.env` (random secrets, flags,
   `DATABASE_URI`; `out/` is gitignored) and prints the next commands. The image name
   comes from the git remote (`--image` to override). Re-running never overwrites an
   existing `.env`; `--force` regenerates it, and `--dry-run` previews.
3. **Create the database user** on the server with the printed `mongosh` commands. Paste
   `MONGO_PASSWORD` from the site's `.env` at the `passwordPrompt()`. The user gets
   `readWrite` on its own database only.
4. **Copy and start**:
   ```sh
   ssh server 'mkdir -p /srv/sites/bakkerij-jansen && chmod 700 /srv/sites/bakkerij-jansen'
   scp out/bakkerij-jansen/compose.yml out/bakkerij-jansen/.env server:/srv/sites/bakkerij-jansen/
   ssh server 'cd /srv/sites/bakkerij-jansen && chmod 600 .env && docker compose pull && docker compose up -d'
   ```
5. **DNS**: A/AAAA records for `bakkerijjansen.be` and `www.bakkerijjansen.be` → the
   server. Traefik requests the certificates on the first HTTPS request.
6. **Check**:
   ```sh
   curl -sI https://www.bakkerijjansen.be | head -3   # 308 → https://bakkerijjansen.be/
   curl -s  https://bakkerijjansen.be/next/health     # {"status":"ok"}
   ssh server 'docker compose -f /srv/sites/bakkerij-jansen/compose.yml ps'   # healthy
   ```
7. **Hand over**: open `https://bakkerijjansen.be/admin`. The first account you create
   becomes admin. Fill in *Bedrijfsgegevens*, create the contact form, then create
   editor accounts for the client.

### Updating a site

```sh
ssh server 'cd /srv/sites/<slug> && docker compose pull && docker compose up -d'
```

Pin a version by setting `IMAGE_TAG=1.2.0` (or `sha-abc1234`) in `.env`. Roll back the same
way. Feature flags or mail settings (`RESEND_API_KEY`, `MAIL_FROM_*`): edit `.env`, then `docker compose up -d`.

### Backups

`scripts/backup.sh` dumps every site in `/srv/sites/*` (`mongodump --archive --gzip`
with the site's own credentials + a tar.gz of its media volume). It uploads to a Hetzner
Storage Box with rsync over SSH (port 23) and keeps 14 daily and 8 weekly sets.

1. In the Hetzner console, enable SSH for the Storage Box. Then, on the server:
   ```sh
   ssh-keygen -t ed25519 -f /root/.ssh/storagebox_ed25519 -N ''
   cat /root/.ssh/storagebox_ed25519.pub | ssh -p 23 uXXXXXX@uXXXXXX.your-storagebox.de install-ssh-key
   ssh -p 23 -i /root/.ssh/storagebox_ed25519 uXXXXXX@uXXXXXX.your-storagebox.de mkdir -p backups/brentweb
   ```
2. Install the scripts and config:
   ```sh
   install -d -m 700 /opt/brentweb /etc/brentweb
   install -m 700 scripts/backup.sh scripts/restore.sh /opt/brentweb/
   install -m 600 deploy/backup/backup.conf.example /etc/brentweb/backup.conf   # then edit
   /opt/brentweb/backup.sh --dry-run
   /opt/brentweb/backup.sh            # first real run
   ```
3. Cron (`/etc/cron.d/brentweb-backup`). Output only reaches cron mail on failure; set
   `KUMA_PUSH_URL` in the config for an Uptime Kuma push monitor (it reports down when
   the run fails, and when no push arrives within the monitor's interval):
   ```
   MAILTO=you@example.com
   15 3 * * * root /opt/brentweb/backup.sh >/dev/null 2>&1 || echo "brentweb backup failed, see /var/log/brentweb-backup.log"
   ```
4. Rotate `/var/log/brentweb-backup.log` with logrotate (weekly, rotate 8, compress).
5. Test a restore regularly. It goes into a separate database and never the live one:
   ```sh
   /opt/brentweb/restore.sh bakkerij-jansen --target-db bakkerij-jansen_restoretest            # newest daily
   /opt/brentweb/restore.sh bakkerij-jansen --target-db bakkerij-jansen_restoretest --date 2026-11-10 --drop
   ```

---

# Payload Website Template

This is the official [Payload Website Template](https://github.com/payloadcms/payload/blob/3.x/templates/website). Use it to power websites, blogs, or portfolios from small to enterprise. This repo includes a fully-working backend, enterprise-grade admin panel, and a beautifully designed, production-ready website.

This template is right for you if you are working on:

- A personal or enterprise-grade website, blog, or portfolio
- A content publishing platform with a fully featured publication workflow
- Exploring the capabilities of Payload

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [Live Preview](#live-preview)
- [On-demand Revalidation](#on-demand-revalidation)
- [SEO](#seo)
- [Search](#search)
- [Redirects](#redirects)
- [Jobs and Scheduled Publishing](#jobs-and-scheduled-publish)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

Use the `create-payload-app` CLI to clone this template directly to your machine:

```bash
pnpx create-payload-app my-project -t website
```

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `pnpm install && pnpm dev` to install dependencies and start the dev server
1. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel and unpublished content. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/3.x/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Posts

  Posts are used to generate blog posts, news articles, or any other type of content that is published over time. All posts are layout builder enabled so you can generate unique layouts for each post using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Posts are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

- #### Categories

  A taxonomy used to group posts together. Categories can be nested inside of one another, for example "News > Technology". See the official [Payload Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic access control is setup to limit access to various content based based on publishing status.

- `users`: Users can access the admin panel and create or edit content.
- `posts`: Everyone can access published posts, but only users can create, update, or delete them.
- `pages`: Everyone can access published pages, but only users can create, update, or delete them.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Layout Builder

Create unique page layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## Lexical editor

A deep editorial experience that allows complete freedom to focus just on writing content without breaking out of the flow with support for Payload blocks, media, links and other features provided out of the box. See [Lexical](https://payloadcms.com/docs/rich-text/overview) docs.

## Draft Preview

All posts and pages are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new post, project, or page, it will be saved as a draft and will not be visible on your website until you publish it. This also means that you can preview your draft before publishing it to your website. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Since the front-end of this template is statically generated, this also means that pages, posts, and projects will need to be regenerated as changes are made to published documents. To do this, we use an `afterChange` hook to regenerate the front-end when a document has changed and its `_status` is `published`.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/3.x/examples/draft-preview).

## Live preview

In addition to draft previews you can also enable live preview to view your end resulting page as you're editing content with full support for SSR rendering. See [Live preview docs](https://payloadcms.com/docs/live-preview/overview) for more details.

## On-demand Revalidation

We've added hooks to collections and globals so that all of your pages, posts, footer, or header changes will automatically be updated in the frontend via on-demand revalidation supported by Nextjs.

> Note: if an image has been changed, for example it's been cropped, you will need to republish the page it's used on in order to be able to revalidate the Nextjs image cache.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Search

This template also pre-configured with the official [Payload Search Plugin](https://payloadcms.com/docs/plugins/search) to showcase how SSR search features can easily be implemented into Next.js with Payload. See [Website](#website) for more details.

## Redirects

If you are migrating an existing site or moving content to a new URL, you can use the `redirects` collection to create a proper redirect from old URLs to new ones. This will ensure that proper request status codes are returned to search engines and that your users are not left with a broken link. This template comes pre-configured with the official [Payload Redirects Plugin](https://payloadcms.com/docs/plugins/redirects) for complete redirect control from the admin panel. All redirects are fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Jobs and Scheduled Publish

We have configured [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish) which uses the [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) in order to publish or unpublish your content on a scheduled time. The tasks are run on a cron schedule and can also be run as a separate instance if needed.

> Note: When deployed on Vercel, depending on the plan tier, you may be limited to daily cron only.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a instance. This makes it so that you can deploy both your backend and website where you need it.

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/3.x/packages/admin-bar)
- [TailwindCSS styling](https://tailwindcss.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- User Accounts and Authentication
- Fully featured blog
- Publication workflow
- Dark mode
- Pre-made layout building blocks
- SEO
- Search
- Redirects
- Live preview

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://www.npmjs.com/package/@payloadcms/payload-cloud). This means that Next.js caching is not needed and is disabled by default. If you are hosting your app outside of Payload Cloud, you can easily reenable the Next.js caching mechanisms by removing the `no-store` directive from all fetch requests in `./src/app/_api` and then removing all instances of `export const dynamic = 'force-dynamic'` from pages files, such as `./src/app/(pages)/[slug]/page.tsx`. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Working with Postgres

Postgres and other SQL-based databases follow a strict schema for managing your data. In comparison to our MongoDB adapter, this means that there's a few extra steps to working with Postgres.

Note that often times when making big schema changes you can run the risk of losing data if you're not manually migrating it.

#### Local development

Ideally we recommend running a local copy of your database so that schema updates are as fast as possible. By default the Postgres adapter has `push: true` for development environments. This will let you add, modify and remove fields and collections without needing to run any data migrations.

If your database is pointed to production you will want to set `push: false` otherwise you will risk losing data or having your migrations out of sync.

#### Migrations

[Migrations](https://payloadcms.com/docs/database/migrations) are essentially SQL code versions that keeps track of your schema. When deploy with Postgres you will need to make sure you create and then run your migrations.

Locally create a migration

```bash
pnpm payload migrate:create
```

This creates the migration files you will need to push alongside with your new configuration.

On the server after building and before running `pnpm start` you will want to run your migrations

```bash
pnpm payload migrate
```

This command will check for any migrations that have not yet been run and try to run them and it will keep a record of migrations that have been run in the database.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages, posts, and projects you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Author
  - Email: `demo-author@payloadcms.com`
  - Password: `password`

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.
1. When you're ready to go live, see Deployment below for more details.

### Deploying to Vercel

This template can also be deployed to Vercel for free. You can get started by choosing the Vercel DB adapter during the setup of the template or by manually installing and configuring it:

```bash
pnpm add @payloadcms/db-vercel-postgres
```

```ts
// payload.config.ts
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  // ...
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  // ...
```

We also support Vercel's blob storage:

```bash
pnpm add @payloadcms/storage-vercel-blob
```

```ts
// payload.config.ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  // ...
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  // ...
```

There is also a simplified [one click deploy](https://github.com/payloadcms/payload/tree/3.x/templates/with-vercel-postgres) to Vercel should you need it.

### Self-hosting

Before deploying your app, you need to:

1. Ensure your app builds and serves in production. See [Production](#production) for more details.
2. You can then deploy Payload as you would any other Node.js or Next.js application either directly on a VPS, DigitalOcean's Apps Platform, via Coolify or more. More guides coming soon.

You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
