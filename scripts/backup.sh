#!/usr/bin/env bash
#
# backup.sh – nightly backup of every site in /srv/sites (run as root via cron).
#
#   scripts/backup.sh [--config FILE] [--site SLUG] [--no-upload] [--dry-run]
#
# Per site: mongodump (--archive --gzip) of its own database + tar.gz of its media
# volume. Everything is uploaded to a Hetzner Storage Box over rsync/SSH:
#
#   <STORAGEBOX_PATH>/daily/YYYY-MM-DD/<slug>/{db.archive.gz,media.tar.gz,SHA256SUMS}
#   <STORAGEBOX_PATH>/weekly/YYYY-Www/<slug>/...   (on WEEKLY_DAY)
#
# Retention: newest KEEP_DAILY daily and KEEP_WEEKLY weekly sets (default 14 / 8).
# Logs to LOG_FILE and exits non-zero when anything failed, so cron mail or an
# Uptime Kuma push monitor (KUMA_PUSH_URL) can alert.
#
# Config: /etc/brentweb/backup.conf (see deploy/backup/backup.conf.example).

set -euo pipefail

CONFIG="${BACKUP_CONFIG:-/etc/brentweb/backup.conf}"
ONLY_SITE=""
UPLOAD=true
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: backup.sh [--config FILE] [--site SLUG] [--no-upload] [--dry-run]

  --config FILE   config file (default: /etc/brentweb/backup.conf or $BACKUP_CONFIG)
  --site SLUG     only back up this site
  --no-upload     create the local backup set only (kept in WORK_DIR), no upload/prune
  --dry-run       print what would happen, change nothing
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --config)
      [ $# -ge 2 ] || { echo "error: --config needs a value" >&2; exit 2; }
      CONFIG="$2"
      shift
      ;;
    --config=*) CONFIG="${1#*=}" ;;
    --site)
      [ $# -ge 2 ] || { echo "error: --site needs a value" >&2; exit 2; }
      ONLY_SITE="$2"
      shift
      ;;
    --site=*) ONLY_SITE="${1#*=}" ;;
    --no-upload) UPLOAD=false ;;
    --dry-run) DRY_RUN=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

[ -r "$CONFIG" ] || { echo "error: config not readable: $CONFIG" >&2; exit 2; }
# shellcheck source=/dev/null
. "$CONFIG"

# Defaults for optional settings
SITES_DIR="${SITES_DIR:-/srv/sites}"
WORK_DIR="${WORK_DIR:-/var/backups/brentweb}"
LOG_FILE="${LOG_FILE:-/var/log/brentweb-backup.log}"
MONGO_CONTAINER="${MONGO_CONTAINER:-mongo}"
HELPER_IMAGE="${HELPER_IMAGE:-alpine:3.20}"
STORAGEBOX_HOST="${STORAGEBOX_HOST:-}"
STORAGEBOX_USER="${STORAGEBOX_USER:-}"
STORAGEBOX_PATH="${STORAGEBOX_PATH:-}"
STORAGEBOX_PORT="${STORAGEBOX_PORT:-23}"
SSH_KEY="${SSH_KEY:-}"
KEEP_DAILY="${KEEP_DAILY:-14}"
KEEP_WEEKLY="${KEEP_WEEKLY:-8}"
WEEKLY_DAY="${WEEKLY_DAY:-7}"
KUMA_PUSH_URL="${KUMA_PUSH_URL:-}"

# ── logging ──────────────────────────────────────────────────────────────────
if [ "$DRY_RUN" != true ]; then
  mkdir -p "$(dirname "$LOG_FILE")"
  # Everything (including command errors) goes to the log and to stdout (cron mail).
  exec > >(tee -a "$LOG_FILE") 2>&1
fi

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

FAILURES=0
fail() {
  log "ERROR: $*"
  FAILURES=$((FAILURES + 1))
}

# Run a command, or print it in dry-run mode.
run() {
  if [ "$DRY_RUN" = true ]; then
    printf '[dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

die() {
  log "ERROR: $*"
  notify down "$*"
  exit 1
}

notify() {
  # $1 = up|down, $2 = message
  [ -n "$KUMA_PUSH_URL" ] || return 0
  if [ "$DRY_RUN" = true ]; then
    printf '[dry-run] push %s to Uptime Kuma\n' "$1"
    return 0
  fi
  curl -fsS -m 15 -G "$KUMA_PUSH_URL" --data-urlencode "status=$1" --data-urlencode "msg=$2" \
    >/dev/null || log "warning: Uptime Kuma push failed"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

# Value of KEY in an env file (last occurrence wins), without surrounding quotes.
env_get() {
  sed -n "s/^$1=//p" "$2" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$@"
  else
    shasum -a 256 "$@"
  fi
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

# ── checks ───────────────────────────────────────────────────────────────────
for var in KEEP_DAILY KEEP_WEEKLY WEEKLY_DAY STORAGEBOX_PORT; do
  eval "value=\${$var}"
  # shellcheck disable=SC2154  # value is set by eval
  case "$value" in
    '' | *[!0-9]*) die "$var must be a number (got '$value')" ;;
  esac
done
if [ "$UPLOAD" = true ]; then
  for var in STORAGEBOX_HOST STORAGEBOX_USER STORAGEBOX_PATH; do
    eval "value=\${$var:-}"
    [ -n "$value" ] || die "$var is not set in $CONFIG"
  done
  case "$STORAGEBOX_PATH" in
    /* | *..* | '') die "STORAGEBOX_PATH must be a relative path inside the Storage Box home" ;;
  esac
fi
[ -d "$SITES_DIR" ] || die "SITES_DIR does not exist: $SITES_DIR"

if [ "$DRY_RUN" != true ]; then
  require_cmd docker
  [ "$UPLOAD" != true ] || require_cmd rsync
  [ "$UPLOAD" != true ] || require_cmd ssh
fi

DAY="$(date '+%Y-%m-%d')"
WEEK="$(date '+%G-W%V')"
IS_WEEKLY=false
[ "$(date '+%u')" = "$WEEKLY_DAY" ] && IS_WEEKLY=true
STAGE="$WORK_DIR/stage"

log "backup started (day=$DAY week=$WEEK weekly=$IS_WEEKLY upload=$UPLOAD dry_run=$DRY_RUN)"

# One run at a time.
if [ "$DRY_RUN" != true ]; then
  mkdir -p "$WORK_DIR"
  chmod 700 "$WORK_DIR"
  if command -v flock >/dev/null 2>&1; then
    exec 9>"$WORK_DIR/.lock"
    flock -n 9 || die "another backup run is in progress"
  fi
  rm -rf "$STAGE"
fi

# ── per site ─────────────────────────────────────────────────────────────────
# A failed site must not leave a partial set behind that would be uploaded.
discard_site() {
  rm -rf "$1" "$1.err"
}

backup_site() {
  local site_dir="$1" env_file slug uri db volume dest
  env_file="$site_dir/.env"
  slug="$(env_get CLIENT_SLUG "$env_file")"
  [ -n "$slug" ] || slug="$(basename "$site_dir")"

  if [ -n "$ONLY_SITE" ] && [ "$slug" != "$ONLY_SITE" ]; then
    return 0
  fi

  uri="$(env_get DATABASE_URI "$env_file")"
  if [ -z "$uri" ]; then
    fail "$slug: DATABASE_URI missing in $env_file"
    return 0
  fi
  db="$(printf '%s' "$uri" | sed -e 's#^mongodb\(+srv\)\{0,1\}://[^/]*/##' -e 's#?.*$##')"
  volume="${slug}_media"
  dest="$STAGE/daily/$DAY/$slug"

  log "$slug: database '$db', volume '$volume'"
  run mkdir -p "$dest"

  # Database. The URI (with the site's own credentials) goes in over stdin so it never
  # shows up in the host's process list; mongodump runs inside the mongo container.
  if [ "$DRY_RUN" = true ]; then
    printf '[dry-run] docker exec -i %s mongodump --uri=<DATABASE_URI of %s> --archive --gzip > %s\n' \
      "$MONGO_CONTAINER" "$slug" "$dest/db.archive.gz"
  elif ! printf '%s\n' "$uri" |
    docker exec -i "$MONGO_CONTAINER" sh -c 'IFS= read -r uri; exec mongodump --uri="$uri" --archive --gzip' \
      >"$dest/db.archive.gz" 2>"$dest.err"; then
    fail "$slug: mongodump failed: $(tail -n 3 "$dest.err" | tr '\n' ' ')"
    discard_site "$dest"
    return 0
  elif [ ! -s "$dest/db.archive.gz" ]; then
    fail "$slug: mongodump produced an empty archive"
    discard_site "$dest"
    return 0
  fi
  [ "$DRY_RUN" = true ] || rm -f "$dest.err"

  # Media volume (read-only mount in a throwaway container).
  if [ "$DRY_RUN" = true ]; then
    printf '[dry-run] docker run --rm -v %s:/data:ro %s tar -czf - -C /data . > %s\n' \
      "$volume" "$HELPER_IMAGE" "$dest/media.tar.gz"
  elif ! docker volume inspect "$volume" >/dev/null 2>&1; then
    log "$slug: warning: volume $volume not found, skipping media"
  elif ! docker run --rm -v "$volume:/data:ro" "$HELPER_IMAGE" tar -czf - -C /data . \
    >"$dest/media.tar.gz"; then
    fail "$slug: media archive failed"
    discard_site "$dest"
    return 0
  fi

  if [ "$DRY_RUN" != true ]; then
    (cd "$dest" && sha256_file ./* >SHA256SUMS)
    log "$slug: ok ($(du -sh "$dest" | cut -f1))"
  fi

  if [ "$IS_WEEKLY" = true ]; then
    # Hard links: no extra local disk space for the weekly copy.
    run mkdir -p "$STAGE/weekly/$WEEK"
    run cp -R -l "$dest" "$STAGE/weekly/$WEEK/$slug" 2>/dev/null ||
      run cp -R "$dest" "$STAGE/weekly/$WEEK/$slug"
  fi
}

found=0
for site_dir in "$SITES_DIR"/*/; do
  site_dir="${site_dir%/}"
  [ -f "$site_dir/.env" ] || continue
  found=$((found + 1))
  backup_site "$site_dir"
done
[ "$found" -gt 0 ] || log "warning: no sites with a .env found in $SITES_DIR"

# ── upload + retention ───────────────────────────────────────────────────────
prune() {
  # $1 = daily|weekly, $2 = keep count, $3 = name pattern (ERE)
  local kind="$1" keep="$2" pattern="$3" names old
  if [ "$DRY_RUN" = true ]; then
    printf '[dry-run] keep newest %s %s sets in %s/%s, delete older ones\n' "$keep" "$kind" "$STORAGEBOX_PATH" "$kind"
    return 0
  fi
  if ! names="$(remote ls "$STORAGEBOX_PATH/$kind" 2>/dev/null)"; then
    log "warning: could not list $STORAGEBOX_PATH/$kind"
    return 0
  fi
  # Names sort chronologically (YYYY-MM-DD / YYYY-Www); strict pattern before any rm.
  old="$(printf '%s\n' "$names" | awk '{ for (i = 1; i <= NF; i++) print $i }' | grep -E "^$pattern\$" | sort |
    awk -v keep="$keep" '{ n[NR] = $0 } END { for (i = 1; i <= NR - keep; i++) print n[i] }')"
  for name in $old; do
    log "prune: $kind/$name"
    remote rm -r "$STORAGEBOX_PATH/$kind/$name" || fail "could not delete $kind/$name"
  done
}

if [ "$UPLOAD" = true ]; then
  log "uploading to $STORAGEBOX_USER@$STORAGEBOX_HOST:$STORAGEBOX_PATH/"
  if [ "$DRY_RUN" = true ]; then
    printf '[dry-run] rsync -a %s/ %s@%s:%s/  (ssh %s)\n' "$STAGE" "$STORAGEBOX_USER" "$STORAGEBOX_HOST" "$STORAGEBOX_PATH" "$(ssh_opts)"
  elif [ -d "$STAGE" ]; then
    if rsync -a --partial -e "ssh $(ssh_opts)" "$STAGE/" "$STORAGEBOX_USER@$STORAGEBOX_HOST:$STORAGEBOX_PATH/"; then
      log "upload ok"
      rm -rf "$STAGE"
    else
      fail "upload failed (local copy kept in $STAGE)"
    fi
  fi

  if [ "$FAILURES" -eq 0 ]; then
    prune daily "$KEEP_DAILY" '[0-9]{4}-[0-9]{2}-[0-9]{2}'
    prune weekly "$KEEP_WEEKLY" '[0-9]{4}-W[0-9]{2}'
  else
    log "skipping retention because of earlier errors"
  fi
else
  log "upload skipped (--no-upload); backup set is in $STAGE"
fi

if [ "$FAILURES" -gt 0 ]; then
  log "backup finished with $FAILURES error(s)"
  notify down "$FAILURES error(s), see $LOG_FILE"
  exit 1
fi

log "backup finished ok ($found site(s))"
notify up "OK: $found site(s)"
