#!/bin/sh
# Runs scripts/seo-backfill.ts (or seo-backfill-revert.ts) through Payload's Local API
# in a throwaway container built from the Dockerfile's `deps` stage, attached to the
# database network of the chosen target. Dry run unless --apply is given.
#
#   sh scripts/seo-backfill.sh --target scratch    --out backups/seo-2026-11-22-1915
#   sh scripts/seo-backfill.sh --target production --out backups/seo-2026-11-22-1915
#   sh scripts/seo-backfill.sh --target production --out backups/seo-2026-11-22-1915 --apply
#   sh scripts/seo-backfill.sh --target production --out backups/... --revert [--apply]
#
# --apply first writes a fresh mongodump to <out>/pre-backfill-<timestamp>.archive.gz
# (production asks for confirmation; SEO_BACKFILL_YES=1 skips the prompt), and after the
# run expires the site's caches with POST /next/revalidate.
#
# Targets:
#   production  brentweb-db on the `brentweb` network; PAYLOAD_SECRET read from the stack's
#               secrets/payload_secret inside the container (never printed)
#   scratch     the restored copy (container brentweb-seo-scratch, alias brentweb-seo-db,
#               network brentweb-seo-scratch); throwaway secret
set -eu

REPO=$(cd "$(dirname "$0")/.." && pwd)
STACK=/opt/brentweb/stacks/clients/brentweb
TOOLS_IMAGE=brentweb-seo-tools:local

TARGET='' OUT='' APPLY='' SCRIPT=scripts/seo-backfill.ts
while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET=$2; shift 2 ;;
    --out) OUT=$2; shift 2 ;;
    --apply) APPLY=--apply; shift ;;
    --revert) SCRIPT=scripts/seo-backfill-revert.ts; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$OUT" ] && [ -d "$REPO/$OUT" ] || { echo "--out must be an existing folder inside the repo" >&2; exit 2; }

case "$TARGET" in
  production)
    NETWORK=brentweb_brentweb   # compose project "brentweb", network "brentweb"
    DB_HOST=brentweb-db
    DUMP="docker compose -f $STACK/compose.yaml exec -T brentweb-db mongodump --db brentweb_be --archive --gzip"
    SECRET_MOUNT="-v $STACK/secrets/payload_secret:/run/secrets/payload_secret:ro"
    SITE_URL=https://brentweb.be
    CRON_SECRET_FILE=$STACK/secrets/cron_secret
    ;;
  scratch)
    NETWORK=brentweb-seo-scratch
    DB_HOST=brentweb-seo-db
    DUMP="docker exec brentweb-seo-scratch mongodump --db brentweb_be --archive --gzip"
    SECRET_MOUNT=''
    SITE_URL=${SCRATCH_SITE_URL:-}            # e.g. http://127.0.0.1:3901 (the test container)
    CRON_SECRET_FILE=${SCRATCH_CRON_SECRET_FILE:-}
    ;;
  *) echo "--target must be production or scratch" >&2; exit 2 ;;
esac

docker image inspect "$TOOLS_IMAGE" >/dev/null 2>&1 ||
  docker build -q -f "$REPO/docker/Dockerfile" --target deps -t "$TOOLS_IMAGE" "$REPO"

if [ -n "$APPLY" ]; then
  if [ "$TARGET" = production ] && [ "${SEO_BACKFILL_YES:-}" != 1 ]; then
    printf 'Apply %s to PRODUCTION (brentweb_be)? Type yes: ' "$(basename "$SCRIPT")"
    read -r answer
    [ "$answer" = yes ] || { echo "aborted"; exit 1; }
  fi
  STAMP=$(date +%F-%H%M%S)
  DUMPFILE="$REPO/$OUT/pre-backfill-$TARGET-$STAMP.archive.gz"
  (umask 077; $DUMP > "$DUMPFILE")
  [ -s "$DUMPFILE" ] || { echo "mongodump produced nothing; not applying" >&2; exit 1; }
  echo "fresh dump: $DUMPFILE ($(du -h "$DUMPFILE" | cut -f1), sha256 $(sha256sum "$DUMPFILE" | cut -c1-16)…)"
fi

docker run --rm --user 1000:1000 \
  -e HOME=/tmp -e NODE_OPTIONS=--no-deprecation -e CHROME_PATH= \
  -e SEO_TARGET="$TARGET" -e SEO_OUT="$OUT" -e SEO_APPLY="${APPLY:+1}" \
  -e DATABASE_URI="mongodb://$DB_HOST:27017/brentweb_be?replicaSet=rs0" \
  -e NEXT_PUBLIC_SERVER_URL=https://brentweb.be \
  -e FEATURE_BLOG=false -e FEATURE_MENU=false -e FEATURE_ECOMMERCE=false \
  $SECRET_MOUNT \
  --network "$NETWORK" \
  -v "$REPO:/app" -v /app/node_modules -w /app \
  "$TOOLS_IMAGE" sh -c '
    if [ -r /run/secrets/payload_secret ]; then PAYLOAD_SECRET=$(cat /run/secrets/payload_secret)
    else PAYLOAD_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d " \n"); fi
    export PAYLOAD_SECRET
    exec node_modules/.bin/payload run "$0"' "$SCRIPT"

if [ -n "$APPLY" ] && [ -n "$SITE_URL" ] && [ -n "$CRON_SECRET_FILE" ] && [ -r "$CRON_SECRET_FILE" ]; then
  HDR=$(mktemp); chmod 600 "$HDR"
  printf 'Authorization: Bearer %s\n' "$(cat "$CRON_SECRET_FILE")" > "$HDR"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H @"$HDR" "$SITE_URL/next/revalidate" || true)
  rm -f "$HDR"
  echo "cache revalidation: HTTP $code"
fi
