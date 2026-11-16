# Shared infrastructure (once per server)

One MongoDB 8 instance (replica set `rs0`, keyfile auth) for every client site.
Sites reach it as `mongo:27017` on the internal Docker network `mongo`; nothing is
published on the host.

All commands run on the server as root (or with sudo).

## 1. Files

```sh
mkdir -p /srv/infra && cd /srv/infra
# copy compose.yml and .env.example from this folder into /srv/infra
cp .env.example .env
chmod 600 .env
```

Set a strong root password in `.env`:

```sh
sed -i "s/^MONGO_ROOT_PASSWORD=.*/MONGO_ROOT_PASSWORD=$(openssl rand -hex 32)/" .env
```

`MONGO_CACHE_GB` (default 1) caps MongoDB's WiredTiger cache; keep it well below the
server's RAM so the sites have room.

## 2. Keyfile

A replica set with authentication needs a keyfile, readable only by the `mongodb`
user inside the image (uid/gid 999):

```sh
cd /srv/infra
openssl rand -base64 756 > mongo-keyfile
chmod 400 mongo-keyfile
chown 999:999 mongo-keyfile
```

## 3. Start MongoDB

```sh
docker compose up -d
docker compose ps        # wait for "healthy"
```

The first start creates the root user from `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`.

## 4. Initialise the replica set (once)

```sh
docker exec -it mongo mongosh --authenticationDatabase admin \
  -u "$(sed -n 's/^MONGO_ROOT_USERNAME=//p' /srv/infra/.env)" -p \
  --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] })'
```

Check: `rs.status().members[0].stateStr` should be `PRIMARY` (give it a few seconds).
The member host must be `mongo:27017`: that's the name the site containers use.

## 5. Per site

`scripts/new-client.sh` prints the `db.createUser(...)` commands for each new site:
its own database and a user with `readWrite` on that database only.

## Notes

- The `mongo` network is `internal: true`: containers on it can't reach the internet
  through it. Sites also join the `traefik` network for their outbound traffic.
- Root credentials are for administration and `scripts/restore.sh` only; sites never
  use them.
- Upgrading MongoDB: change the image tag, `docker compose pull && docker compose up -d`.
  Follow MongoDB's upgrade notes for major versions (featureCompatibilityVersion).
