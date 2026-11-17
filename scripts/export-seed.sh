#!/usr/bin/env bash
#
# export-seed.sh – snapshot the local site (database + uploaded media) into deploy/seed/,
# for a first import on the server with scripts/import-seed.sh.
#
#   scripts/export-seed.sh [DATABASE_URI]     (default: DATABASE_URI from .env)
#
# Writes deploy/seed/{db.archive.gz,media.tar.gz,SHA256SUMS,SOURCE_DB}. Run-time state (job queue,
# document locks, admin preferences) is left out; the server builds its own.
set -euo pipefail
cd "$(dirname "$0")/.."

uri="${1:-$(grep -E '^DATABASE_URI=' .env | cut -d= -f2-)}"
[ -n "$uri" ] || { echo "error: no DATABASE_URI (pass one or set it in .env)" >&2; exit 1; }
command -v mongodump >/dev/null || { echo "error: mongodump not found (brew install mongodb-database-tools)" >&2; exit 1; }

out=deploy/seed
mkdir -p "$out"
# The database name from the URI path, for import-seed.sh's --nsFrom.
db="$(printf '%s' "$uri" | sed -E 's#^mongodb(\+srv)?://[^/]*/##; s#[?].*$##')"
[ -n "$db" ] || { echo "error: no database name in DATABASE_URI" >&2; exit 1; }
printf '%s\n' "$db" >"$out/SOURCE_DB"

mongodump --uri="$uri" --archive="$out/db.archive.gz" --gzip --quiet \
  --excludeCollection=payload-jobs \
  --excludeCollection=payload-locked-documents \
  --excludeCollection=payload-preferences

# The media volume's layout: the files at the root, screenshots/ below. No macOS metadata.
COPYFILE_DISABLE=1 tar -czf "$out/media.tar.gz" --exclude='.DS_Store' --exclude='._*' \
  -C public/media .

(cd "$out" && shasum -a 256 db.archive.gz media.tar.gz >SHA256SUMS)
echo "seed written to $out:"
ls -lh "$out" | awk 'NR > 1 { print "  " $5 "  " $9 }'
