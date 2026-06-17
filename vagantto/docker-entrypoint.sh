#!/bin/sh
# Sync the schema and seed today's menu, then start the server. Postgres is
# already healthy here thanks to compose's `depends_on: condition: service_healthy`.
set -e

echo "→ Syncing database schema…"
npx prisma db push --skip-generate

echo "→ Seeding today's menu…"
npm run db:seed || echo "  (seed skipped — data may already exist)"

echo "→ Starting Vagantto on http://localhost:3000"
exec npm run start
