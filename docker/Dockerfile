# syntax=docker/dockerfile:1.7
#
# brentweb-starter production image (Next.js standalone + Payload).
#
#   docker build -f docker/Dockerfile -t brentweb-site .
#
# The image contains no secrets and no client-specific values: DATABASE_URI,
# PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL, FEATURE_* etc. come from the container env.

ARG NODE_VERSION=22

# ── base: node + pnpm (via corepack, version from package.json "packageManager") ──
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ── deps: install node_modules (cached on lockfile changes only) ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Installing inside Alpine pulls sharp's prebuilt linuxmusl binaries (@img/sharp-linuxmusl-*).
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ── builder: next build (output: 'standalone') ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders so the Payload config can be loaded during the build. The build never
# connects to MongoDB (the frontend renders on request) and these values don't reach
# the runner stage.
ENV PAYLOAD_SECRET=build-time-placeholder \
    DATABASE_URI=mongodb://build-time-placeholder:27017/build
RUN pnpm build

# ── runner: minimal runtime ──
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone server + static assets + public files, owned by the unprivileged `node` user
# (uid 1000) so the Next cache in .next/ is writable.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Uploads live here (mount a volume). Creating it in the image makes a fresh named
# volume inherit node:node ownership on first mount.
RUN mkdir -p /app/public/media && chown -R node:node /app/public/media
VOLUME ["/app/public/media"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/next/health || exit 1

CMD ["node", "server.js"]
