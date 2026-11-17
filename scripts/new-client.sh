#!/usr/bin/env bash
#
# new-client.sh – prepare the deploy files for a new client site.
#
#   scripts/new-client.sh <slug> <domain> [--blog] [--menu] [--ecommerce]
#                         [--image ghcr.io/<owner>/<repo>] [--tag latest]
#                         [--out DIR] [--force] [--dry-run]
#
# Writes <out>/<slug>/compose.yml and <out>/<slug>/.env (default out: ./out), ready to
# copy to /srv/sites/<slug>/ on the server, and prints the mongosh commands that create
# the site's database user.
#
# Idempotent: an existing .env is never touched unless --force is given (which
# regenerates every secret, including the database password).
#
# Works with the stock macOS bash (3.2) and on Linux.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$REPO_ROOT/deploy/site/compose.yml"

usage() {
  cat <<'EOF'
Usage: new-client.sh <slug> <domain> [options]

  <slug>      lowercase letters, digits and dashes, e.g. bakkerij-jansen
  <domain>    apex domain without scheme, e.g. bakkerijjansen.be (www is added)

Options:
  --blog          enable FEATURE_BLOG
  --menu          enable FEATURE_MENU
  --ecommerce     enable FEATURE_ECOMMERCE
  --image IMAGE   container image without tag (default: derived from the git remote,
                  ghcr.io/<owner>/<repo>)
  --tag TAG       image tag (default: latest)
  --out DIR       output root (default: ./out)
  --force         overwrite an existing .env (regenerates all secrets!)
  --dry-run       show what would be written, change nothing
  -h, --help      show this help
EOF
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

info() {
  printf '%s\n' "$*"
}

lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

rand_hex() {
  openssl rand -hex "$1"
}

# Value of KEY in an env file (last occurrence wins), without surrounding quotes.
env_get() {
  sed -n "s/^$1=//p" "$2" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

# ghcr.io/<owner>/<repo> from the origin remote, if it points to GitHub.
image_from_git_remote() {
  local url path
  url="$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null || true)"
  case "$url" in
    *github.com[:/]*) ;;
    *) return 0 ;;
  esac
  path="${url#*github.com}"
  path="${path#[:/]}"
  path="${path%.git}"
  case "$path" in
    */*) lower "ghcr.io/$path" ;;
  esac
}

# ── arguments ────────────────────────────────────────────────────────────────
slug=""
domain=""
nargs=0
blog=false
menu=false
ecommerce=false
image=""
tag="latest"
out_root="${OUT_DIR:-$REPO_ROOT/out}"
force=false
dry_run=false

while [ $# -gt 0 ]; do
  case "$1" in
    --blog) blog=true ;;
    --menu) menu=true ;;
    --ecommerce) ecommerce=true ;;
    --image)
      [ $# -ge 2 ] || die "--image needs a value"
      image="$2"
      shift
      ;;
    --image=*) image="${1#*=}" ;;
    --tag)
      [ $# -ge 2 ] || die "--tag needs a value"
      tag="$2"
      shift
      ;;
    --tag=*) tag="${1#*=}" ;;
    --out)
      [ $# -ge 2 ] || die "--out needs a value"
      out_root="$2"
      shift
      ;;
    --out=*) out_root="${1#*=}" ;;
    --force) force=true ;;
    --dry-run) dry_run=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*) die "unknown option: $1 (see --help)" ;;
    *)
      nargs=$((nargs + 1))
      case "$nargs" in
        1) slug="$1" ;;
        2) domain="$1" ;;
        *) die "unexpected argument: $1" ;;
      esac
      ;;
  esac
  shift
done

if [ "$nargs" -ne 2 ]; then
  usage >&2
  exit 2
fi

# ── validation ───────────────────────────────────────────────────────────────
command -v openssl >/dev/null 2>&1 || die "openssl is required"
[ -f "$TEMPLATE" ] || die "template not found: $TEMPLATE"

printf '%s' "$slug" | grep -Eq '^[a-z][a-z0-9-]{1,38}[a-z0-9]$' ||
  die "invalid slug '$slug' (3-40 chars: a-z, 0-9, '-', starting with a letter)"

domain="$(lower "$domain")"
case "$domain" in
  *://* | */* | *:*) die "domain must be a bare host name, e.g. example.be (got '$domain')" ;;
esac
case "$domain" in
  www.*)
    domain="${domain#www.}"
    info "note: using apex domain '$domain' (www.$domain is routed and redirected automatically)"
    ;;
esac
printf '%s' "$domain" | grep -Eq '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$' ||
  die "invalid domain '$domain'"

if [ -z "$image" ]; then
  image="$(image_from_git_remote)"
fi
[ -n "$image" ] || die "could not derive the image from the git remote; pass --image ghcr.io/<owner>/<repo>"
image="$(lower "$image")"
case "$image" in
  *:*) die "--image must not contain a tag; use --tag" ;;
esac
printf '%s' "$tag" | grep -Eq '^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$' || die "invalid tag '$tag'"

out_dir="$out_root/$slug"
env_file="$out_dir/.env"
compose_file="$out_dir/compose.yml"

# Database + user are named after the slug; the user only gets readWrite on its own db.
mongo_db="$slug"
mongo_user="$slug"

# ── .env ─────────────────────────────────────────────────────────────────────
write_env() {
  # $1 = target file, $2 = mask secrets (true/false)
  local target="$1" mask="$2"
  local payload_secret preview_secret cron_secret mongo_password
  if [ "$mask" = true ]; then
    payload_secret="<generated>"
    preview_secret="<generated>"
    cron_secret="<generated>"
    mongo_password="<generated>"
  else
    payload_secret="$(rand_hex 32)"
    preview_secret="$(rand_hex 24)"
    cron_secret="$(rand_hex 24)"
    mongo_password="$(rand_hex 24)"
  fi

  # Stripe placeholders only for webshop sites.
  local stripe_block=""
  if [ "$ecommerce" = true ]; then
    stripe_block="# ── Webshop / Stripe (FEATURE_ECOMMERCE=true): fill in before starting ──
# Live keys from the client's Stripe account (Developers → API keys).
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# Webhook endpoint: https://${domain}/api/payments/stripe/webhooks
# events: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled
STRIPE_WEBHOOKS_SIGNING_SECRET=

"
  fi

  cat >"$target" <<EOF
# ${slug} – generated by scripts/new-client.sh on $(date '+%Y-%m-%d')
# Copy to /srv/sites/${slug}/.env on the server (chmod 600). Never commit this file.

# ── Deployment (used by compose.yml) ──
CLIENT_SLUG=${slug}
DOMAIN=${domain}
IMAGE=${image}
IMAGE_TAG=${tag}

# ── Database (shared Mongo, own database + user) ──
MONGO_DB=${mongo_db}
MONGO_USER=${mongo_user}
MONGO_PASSWORD=${mongo_password}
DATABASE_URI=mongodb://${mongo_user}:${mongo_password}@mongo:27017/${mongo_db}?replicaSet=rs0&authSource=${mongo_db}

# ── Payload / Next.js (read at runtime) ──
PAYLOAD_SECRET=${payload_secret}
NEXT_PUBLIC_SERVER_URL=https://${domain}
PREVIEW_SECRET=${preview_secret}
CRON_SECRET=${cron_secret}

# ── Feature flags (a container restart applies changes) ──
FEATURE_BLOG=${blog}
FEATURE_MENU=${menu}
FEATURE_ECOMMERCE=${ecommerce}

${stripe_block}# ── E-mail (password resets, form notifications) ──
# Resend: set RESEND_API_KEY (sender domain verified in Resend). Otherwise SMTP_HOST;
# with neither, mails are only logged.
RESEND_API_KEY=
MAIL_FROM_ADDRESS=noreply@${domain}
MAIL_FROM_NAME=${slug}
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# ── Runtime ──
# Keep the V8 heap below the container's 512m memory limit.
NODE_OPTIONS=--max-old-space-size=384
EOF
}

env_action=""
if [ -f "$env_file" ] && [ "$force" != true ]; then
  env_action="keep"
elif [ -f "$env_file" ]; then
  env_action="overwrite"
else
  env_action="create"
fi

info "Client:   $slug"
info "Domain:   $domain (+ www.$domain → redirect)"
info "Image:    $image:$tag"
info "Features: blog=$blog menu=$menu ecommerce=$ecommerce"
info "Output:   $out_dir"
info ""

if [ "$dry_run" = true ]; then
  info "[dry-run] would write $compose_file (from deploy/site/compose.yml)"
  case "$env_action" in
    keep) info "[dry-run] would keep existing $env_file (use --force to regenerate)" ;;
    overwrite) info "[dry-run] would OVERWRITE $env_file with new secrets (--force)" ;;
    create) info "[dry-run] would create $env_file:" ;;
  esac
  if [ "$env_action" != keep ]; then
    preview="$(mktemp)"
    trap 'rm -f "$preview"' EXIT
    write_env "$preview" true
    sed 's/^/    /' "$preview"
  fi
else
  mkdir -p "$out_dir"

  if [ -f "$compose_file" ] && cmp -s "$TEMPLATE" "$compose_file"; then
    info "compose.yml is up to date"
  else
    cp "$TEMPLATE" "$compose_file"
    info "wrote $compose_file"
  fi

  case "$env_action" in
    keep)
      info "kept existing $env_file (use --force to regenerate secrets)"
      ;;
    create | overwrite)
      [ "$env_action" = overwrite ] &&
        info "warning: overwriting $env_file – the database password changes too; update the Mongo user"
      tmp_env="$(umask 077 && mktemp "$out_dir/.env.XXXXXX")"
      trap 'rm -f "$tmp_env"' EXIT
      write_env "$tmp_env" false
      chmod 600 "$tmp_env"
      mv "$tmp_env" "$env_file"
      trap - EXIT
      info "wrote $env_file (chmod 600)"
      ;;
  esac

  # An existing .env wins: report what it actually contains.
  mongo_db="$(env_get MONGO_DB "$env_file")"
  mongo_user="$(env_get MONGO_USER "$env_file")"
  existing_domain="$(env_get DOMAIN "$env_file")"
  if [ "$env_action" = keep ]; then
    [ "$existing_domain" = "$domain" ] ||
      info "warning: existing .env has DOMAIN=$existing_domain (not $domain); left unchanged"
    for flag in BLOG MENU ECOMMERCE; do
      case "$flag" in
        BLOG) wanted="$blog" ;;
        MENU) wanted="$menu" ;;
        ECOMMERCE) wanted="$ecommerce" ;;
      esac
      current="$(env_get "FEATURE_$flag" "$env_file")"
      [ "$current" = "$wanted" ] ||
        info "warning: existing .env has FEATURE_$flag=$current (requested $wanted); edit it by hand"
    done
  fi
fi

cat <<EOF

── Next steps ─────────────────────────────────────────────────────────────

1. Create the database user (on the server, once):

     docker exec -it mongo mongosh --authenticationDatabase admin \\
       -u "\$(sed -n 's/^MONGO_ROOT_USERNAME=//p' /srv/infra/.env)" -p

   then in mongosh (paste MONGO_PASSWORD from the site's .env at the prompt):

     use ${mongo_db}
     db.createUser({ user: "${mongo_user}", pwd: passwordPrompt(), roles: [{ role: "readWrite", db: "${mongo_db}" }] })

2. Copy the files and start the site:

     ssh <server> 'mkdir -p /srv/sites/${slug} && chmod 700 /srv/sites/${slug}'
     scp ${out_dir}/compose.yml ${out_dir}/.env <server>:/srv/sites/${slug}/
     ssh <server> 'cd /srv/sites/${slug} && chmod 600 .env && docker compose pull && docker compose up -d'

3. Point DNS for ${domain} and www.${domain} to the server, then open
   https://${domain}/admin to create the first (admin) user.
EOF
