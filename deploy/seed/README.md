# Seed: brentweb.be content

A snapshot of the local site for the first launch on the server: every page, project,
testimonial, the site settings and all uploaded media (photos and live screenshots), in
Dutch and English. It holds no user accounts and no form submissions.

| File | What |
|---|---|
| `db.archive.gz` | `mongodump --archive --gzip` of the database (without job queue, locks, admin preferences) |
| `media.tar.gz` | the contents of `public/media`, laid out like the site's media volume |
| `SOURCE_DB` | the database name inside the dump |
| `SHA256SUMS` | checksums, verified by the import |

## Import on the server

The site must exist (`scripts/new-client.sh`) and have run once, so its database user
and media volume are there. Then, from this repo on the server:

```sh
scripts/import-seed.sh <slug>                    # asks before replacing anything
cd /srv/sites/<slug> && docker compose restart
```

It restores into the site's own database (dropping what is there) and unpacks the media
into `<slug>_media`, owned by the app user so new uploads and screenshot refreshes work.

Afterwards open `https://<domain>/admin`: with no users in the dump, Payload asks you to
create the first (admin) account.

## Refresh the seed

After more local edits: `scripts/export-seed.sh` (reads `DATABASE_URI` from `.env`).
