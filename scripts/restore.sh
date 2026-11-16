#!/usr/bin/env bash
#
# restore.sh – restore one site's database backup into a separate database for testing.
#
#   scripts/restore.sh <slug> --target-db NAME [--date YYYY-MM-DD | --file PATH]
#                      [--drop] [--config FILE] [--dry-run]
#
# Source: a local archive (--file), the daily set of --date on the Storage Box, or
# (default) the newest daily set on the Storage Box. The dump is restored with
# --nsFrom/--nsTo into NAME; the live database is never touched (restoring into the
# site's own database name is refused). Media archives are not restored by this script.
#
# Uses the same config as backup.sh, plus INFRA_ENV (default /srv/infra/.env) for the
# Mongo root credentials.

set -euo pipefail

CONFIG="${BACKUP_CONFIG:-/etc/brentweb/backup.conf}"
SLUG=""
TARGET_DB=""
DATE=""
FILE=""
DROP=false
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: restore.sh <slug> --target-db NAME [--date YYYY-MM-DD | --file PATH] [options]

  --target-db NAME  database to restore into (must differ from the site's database)
  --date DATE       use daily/DATE from the Storage Box (default: newest daily set)
  --file PATH       use a local db.archive.gz instead of the Storage Box
  --drop            drop existing collections in NAME first (required if NAME is not empty)
  --config FILE     config file (default: /etc/brentweb/backup.conf or $BACKUP_CONFIG)
  --dry-run         print what would happen, change nothing
EOF
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

info() {
  printf '%s\n' "$*"
}

need_value() {
  [ "$2" -ge 2 ] || die "$1 needs a value"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --target-db)
      need_value "$1" $#
      TARGET_DB="$2"
      shift
      ;;
    --target-db=*) TARGET_DB="${1#*=}" ;;
    --date)
      need_value "$1" $#
      DATE="$2"
      shift
      ;;
    --date=*) DATE="${1#*=}" ;;
    --file)
      need_value "$1" $#
      FILE="$2"
      shift
      ;;
    --file=*) FILE="${1#*=}" ;;
    --config)
      need_value "$1" $#
      CONFIG="$2"
      shift
      ;;
    --config=*) CONFIG="${1#*=}" ;;
    --drop) DROP=true ;;
    --dry-run) DRY_RUN=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*) die "unknown option: $1 (see --help)" ;;
    *)
      [ -z "$SLUG" ] || die "unexpected argument: $1"
      SLUG="$1"
      ;;
  esac
  shift
done

[ -n "$SLUG" ] || {
  usage >&2
  exit 2
}
[ -n "$TARGET_DB" ] || die "--target-db is required"
[ -z "$DATE" ] || [ -z "$FILE" ] || die "use either --date or --file, not both"

[ -r "$CONFIG" ] || die "config not readable: $CONFIG"
# shellcheck source=/dev/null
. "$CONFIG"

SITES_DIR="${SITES_DIR:-/srv/sites}"
MONGO_CONTAINER="${MONGO_CONTAINER:-mongo}"
INFRA_ENV="${INFRA_ENV:-/srv/infra/.env}"
STORAGEBOX_HOST="${STORAGEBOX_HOST:-}"
STORAGEBOX_USER="${STORAGEBOX_USER:-}"
STORAGEBOX_PATH="${STORAGEBOX_PATH:-}"
STORAGEBOX_PORT="${STORAGEBOX_PORT:-23}"
SSH_KEY="${SSH_KEY:-}"

env_get() {
  sed -n "s/^$1=//p" "$2" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

ssh_opts() {
  printf '%s' "-p $STORAGEBOX_PORT -o BatchMode=yes -o ConnectTimeout=20"
  [ -z "$SSH_KEY" ] || printf ' -i %s' "$SSH_KEY"
}

remote() {
  # ssh_opts is intentionally word-split; remote arguments are validated paths that are
  # meant to expand locally.
  # shellcheck disable=SC2046,SC2029
  ssh $(ssh_opts) "$STORAGEBOX_USER@$STORAGEBOX_HOST" "$@"
}

# Root credentials + a mongosh/mongorestore call inside the mongo container. The
# password is sent over stdin (first line) so it never appears in the host process list.
mongo_root() {
  # $1 = shell snippet run in the container with $pw set; stdin after the first line is passed on
  printf '%s\n' "$ROOT_PASSWORD" | cat - "${STDIN_FILE:-/dev/null}" |
    docker exec -i -e ROOT_USER="$ROOT_USER" "$MONGO_CONTAINER" sh -c "IFS= read -r pw; $1"
}

# ── validation ───────────────────────────────────────────────────────────────
printf '%s' "$SLUG" | grep -Eq '^[a-z][a-z0-9-]{1,38}[a-z0-9]$' || die "invalid slug '$SLUG'"
printf '%s' "$TARGET_DB" | grep -Eq '^[A-Za-z0-9_-]{1,63}$' || die "invalid target database name '$TARGET_DB'"
[ -z "$DATE" ] || printf '%s' "$DATE" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' || die "invalid --date '$DATE'"

SITE_ENV="$SITES_DIR/$SLUG/.env"
[ -r "$SITE_ENV" ] || die "site env not found: $SITE_ENV"
uri="$(env_get DATABASE_URI "$SITE_ENV")"
SOURCE_DB="$(printf '%s' "$uri" | sed -e 's#^mongodb\(+srv\)\{0,1\}://[^/]*/##' -e 's#?.*$##')"
[ -n "$SOURCE_DB" ] || die "could not read the database name from DATABASE_URI in $SITE_ENV"
printf '%s' "$SOURCE_DB" | grep -Eq '^[A-Za-z0-9_-]{1,63}$' || die "unexpected database name '$SOURCE_DB' in $SITE_ENV"
[ "$TARGET_DB" != "$SOURCE_DB" ] || die "refusing to restore into the live database '$SOURCE_DB'; pick another --target-db"
case "$TARGET_DB" in
  admin | local | config) die "refusing to restore into system database '$TARGET_DB'" ;;
esac

if [ "$DRY_RUN" != true ]; then
  command -v docker >/dev/null 2>&1 || die "docker is required"
  [ -r "$INFRA_ENV" ] || die "infra env not readable: $INFRA_ENV"
fi
ROOT_USER=""
ROOT_PASSWORD=""
if [ -r "$INFRA_ENV" ]; then
  ROOT_USER="$(env_get MONGO_ROOT_USERNAME "$INFRA_ENV")"
  ROOT_PASSWORD="$(env_get MONGO_ROOT_PASSWORD "$INFRA_ENV")"
fi
[ "$DRY_RUN" = true ] || [ -n "$ROOT_USER" ] || die "MONGO_ROOT_USERNAME missing in $INFRA_ENV"

info "site:   $SLUG (database '$SOURCE_DB')"
info "target: $TARGET_DB"

# ── fetch the archive ────────────────────────────────────────────────────────
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [ -n "$FILE" ]; then
  [ -r "$FILE" ] || die "archive not readable: $FILE"
  ARCHIVE="$FILE"
  info "source: $FILE"
else
  for var in STORAGEBOX_HOST STORAGEBOX_USER STORAGEBOX_PATH; do
    eval "value=\${$var:-}"
    # shellcheck disable=SC2154  # value is set by eval
    [ -n "$value" ] || die "$var is not set in $CONFIG"
  done
  if [ -z "$DATE" ]; then
    if [ "$DRY_RUN" = true ]; then
      DATE="<newest>"
    else
      DATE="$(remote ls "$STORAGEBOX_PATH/daily" | awk '{ for (i = 1; i <= NF; i++) print $i }' |
        grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort | tail -n 1)"
      [ -n "$DATE" ] || die "no daily backups found in $STORAGEBOX_PATH/daily"
    fi
  fi
  remote_file="$STORAGEBOX_PATH/daily/$DATE/$SLUG/db.archive.gz"
  ARCHIVE="$WORK/db.archive.gz"
  info "source: $STORAGEBOX_HOST:$remote_file"
  if [ "$DRY_RUN" = true ]; then
    info "[dry-run] rsync -e 'ssh $(ssh_opts)' $STORAGEBOX_USER@$STORAGEBOX_HOST:$remote_file $ARCHIVE"
  else
    rsync -e "ssh $(ssh_opts)" "$STORAGEBOX_USER@$STORAGEBOX_HOST:$remote_file" "$ARCHIVE" ||
      die "download failed"
  fi
fi

# ── restore ──────────────────────────────────────────────────────────────────
restore_cmd="exec mongorestore --host localhost --username \"\$ROOT_USER\" --password \"\$pw\" --authenticationDatabase admin --archive --gzip --nsFrom '${SOURCE_DB}.*' --nsTo '${TARGET_DB}.*'"
[ "$DROP" = true ] && restore_cmd="$restore_cmd --drop"

if [ "$DRY_RUN" = true ]; then
  info "[dry-run] check that '$TARGET_DB' is empty (or --drop is given)"
  info "[dry-run] docker exec -i $MONGO_CONTAINER mongorestore --archive --gzip --nsFrom '$SOURCE_DB.*' --nsTo '$TARGET_DB.*'$([ "$DROP" = true ] && printf ' --drop') < $ARCHIVE"
  exit 0
fi

existing="$(mongo_root "exec mongosh --quiet --host localhost -u \"\$ROOT_USER\" -p \"\$pw\" --authenticationDatabase admin --eval 'print(db.getSiblingDB(\"$TARGET_DB\").getCollectionNames().length)'")"
if [ "${existing:-0}" != "0" ] && [ "$DROP" != true ]; then
  die "database '$TARGET_DB' already has $existing collection(s); add --drop to replace them"
fi

info "restoring…"
if ! STDIN_FILE="$ARCHIVE" mongo_root "$restore_cmd" >"$WORK/restore.log" 2>&1; then
  tail -n 20 "$WORK/restore.log" >&2
  die "mongorestore failed"
fi
grep -E 'document\(s\) restored' "$WORK/restore.log" | tail -n 1 || true

count="$(mongo_root "exec mongosh --quiet --host localhost -u \"\$ROOT_USER\" -p \"\$pw\" --authenticationDatabase admin --eval 'const d = db.getSiblingDB(\"$TARGET_DB\"); print(d.getCollectionNames().length + \" collections, \" + (d.getCollectionNames().includes(\"pages\") ? d.pages.countDocuments() : 0) + \" pages\")'")"
info "done: '$TARGET_DB' now has $count"
info "to inspect it with the site image, run a container with DATABASE_URI pointing at '$TARGET_DB'"
info "(the site's own user has no access to it; create a temporary user or use the root account)."
