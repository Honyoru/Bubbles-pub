#!/usr/bin/env bash
# Runs the app without Docker, on Prisma's local Postgres (`prisma dev`).
# Usage: npm run dev:local            start (seeds the DB on first run)
#        npm run dev:local -- --reset  wipe and re-seed the DB first
#        npm run dev:local -- --stop   stop the local DB
set -euo pipefail
cd "$(dirname "$0")/.."

NAME="bubbles"

# `npm run x -- --flag` and some pnpm versions forward a literal "--"
[[ "${1:-}" == "--" ]] && shift

if [[ "${1:-}" == "--stop" ]]; then
    npx prisma dev stop "$NAME"
    exit 0
fi

echo "▶ Starting local Postgres ($NAME)…"
URL=$(npx prisma dev -d -n "$NAME" 2>&1 | grep -o 'postgres://[^[:space:]]*' | head -1)
if [[ -z "$URL" ]]; then
    echo "✖ Could not start the local database. Try: npx prisma dev -d -n $NAME" >&2
    exit 1
fi

# Overrides .env for this run only. prisma dev serves a single connection
# and doesn't support prepared statements, hence the extra parameters.
export DATABASE_URL="${URL}&connection_limit=1&pgbouncer=true"

echo "▶ Syncing schema…"
npx prisma db push --skip-generate >/dev/null
npx prisma generate >/dev/null

AD_COUNT=$(node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.advertisements.count().then((n) => console.log(n)).finally(() => prisma.$disconnect());
')

if [[ "${1:-}" == "--reset" || "$AD_COUNT" == "0" ]]; then
    echo "▶ Seeding demo data…"
    node prisma/seed.mjs
fi

echo "▶ Starting app on http://localhost:3000 (admin: admin@bubbles.dev / admin123)"
exec npx next dev
