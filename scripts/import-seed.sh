#!/usr/bin/env bash
#
# import-seed.sh – load deploy/seed/ (made by scripts/export-seed.sh) into a site on the
# server: the database into the site's own database, the media into its media volume.
# Meant for the first launch of a site; it REPLACES the site's content.
#
#   scripts/import-seed.sh <slug> [--seed DIR] [--yes]
#
# Needs: /srv/sites/<slug>/.env (MONGO_DB), /srv/infra/.env (Mongo root credentials),
# the running "mongo" container and the volume <slug>_media (docker compose up once).
set -euo pipefail

SLUG=""
SEED="$(cd "$(dirname "$0")/.." && pwd)/deploy/seed"
YES=false
SITES_DIR="${SITES_DIR:-/srv/sites}"
INFRA_ENV="${INFRA_ENV:-/srv/infra/.env}"
MONGO_CONTAINER="${MONGO_CONTAINER:-mongo}"
HELPER_IMAGE="${HELPER_IMAGE:-alpine:3.20}"
APP_UID=1001 # the nextjs user in the Docker image; it must own the media to write uploads

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
env_get() { grep -E "^$1=" "$2" | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --seed) SEED="$2"; shift ;;
    --yes) YES=true ;;
    -h | --help) sed -n '3,11p' "$0"; exit 0 ;;
    -*) die "unknown option: $1" ;;
    *) SLUG="$1" ;;
  esac
  shift
done
[ -n "$SLUG" ] || die "usage: import-seed.sh <slug> [--seed DIR] [--yes]"

site_env="$SITES_DIR/$SLUG/.env"
[ -r "$site_env" ] || die "not readable: $site_env"
[ -r "$INFRA_ENV" ] || die "not readable: $INFRA_ENV"
for f in db.archive.gz media.tar.gz SHA256SUMS SOURCE_DB; do [ -s "$SEED/$f" ] || die "missing $SEED/$f"; done
(cd "$SEED" && sha256sum -c --quiet SHA256SUMS) || die "checksum mismatch in $SEED"

target_db="$(env_get MONGO_DB "$site_env")"
[ -n "$target_db" ] || target_db="$SLUG"
root_user="$(env_get MONGO_ROOT_USERNAME "$INFRA_ENV")"
root_password="$(env_get MONGO_ROOT_PASSWORD "$INFRA_ENV")"
[ -n "$root_user" ] && [ -n "$root_password" ] || die "Mongo root credentials missing in $INFRA_ENV"
volume="${SLUG}_media"
docker volume inspect "$volume" >/dev/null 2>&1 || die "volume $volume not found (run docker compose up -d in $SITES_DIR/$SLUG once)"

# The database name the dump was taken from (written by export-seed.sh).
source_db="$(cat "$SEED/SOURCE_DB")"
[ -n "$source_db" ] || die "empty $SEED/SOURCE_DB"

echo "This replaces the content of site '$SLUG':"
echo "  database  $source_db.* -> $target_db.* (existing collections dropped)"
echo "  media     $SEED/media.tar.gz -> volume $volume (existing files kept, same names overwritten)"
if [ "$YES" != true ]; then
  read -r -p "Continue? [y/N] " answer
  [ "$answer" = y ] || [ "$answer" = Y ] || die "aborted"
fi

# Password on stdin (never on the command line), then the archive.
{ printf '%s\n' "$root_password"; cat "$SEED/db.archive.gz"; } |
  docker exec -i -e ROOT_USER="$root_user" "$MONGO_CONTAINER" sh -c \
    "IFS= read -r pw; exec mongorestore --host localhost --username \"\$ROOT_USER\" --password \"\$pw\" --authenticationDatabase admin --archive --gzip --drop --nsFrom '${source_db}.*' --nsTo '${target_db}.*'" ||
  die "mongorestore failed"

docker run --rm -i -v "$volume:/data" "$HELPER_IMAGE" \
  sh -c "tar -xzf - -C /data --no-same-owner && chown -R $APP_UID:$APP_UID /data" \
  <"$SEED/media.tar.gz" || die "media import failed"

echo "done. Restart the site so its caches start empty:"
echo "  cd $SITES_DIR/$SLUG && docker compose restart"
