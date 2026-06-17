# Vagantto 🍱

To-go **bento ordering** for **Nishi-Kani Station (西可児駅)**.

Commuters order a bento from their phone (QR code on a platform poster), pick a
pickup window tied to their train, and grab it on the way through. Staff manage
the daily menu and watch stock drain in real time.

## What's in this scaffold (M0 + M1)

- **Customer mobile web** (`/`) — today's menu with live "X left" stock badges and
  sold-out states.
- **Staff dashboard** (`/staff`) — create bentos, set the day's menu, and adjust
  stock counts.
- **Data model** — `Bento`, `DailyAvailability`, `Order`, `OrderItem` (Prisma + Postgres).
- **Atomic stock reservation** (`src/lib/inventory.ts`) — the one correctness-critical
  piece: two commuters can't buy the last unagi bento at once.

The full ordering flow, pickup-window picker, and staff order queue land in M2–M4
(see Roadmap below).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| DB | PostgreSQL |
| ORM | Prisma |
| Hosting (intended) | Vercel |

## Getting started

### Option A — Docker (one command, no local Postgres needed)

```bash
cd vagantto
docker compose up            # builds the app + starts Postgres, seeds today's menu
```

Then open **http://localhost:3000** (staff dashboard at **/staff**). Stop with
`Ctrl+C`; `docker compose down -v` removes the database volume.

### Option B — Local Node + your own Postgres

```bash
cd vagantto
cp .env.example .env          # then set DATABASE_URL to your Postgres
npm install
npm run db:push               # create tables
npm run db:seed               # load sample bentos + today's menu
npm run dev                   # http://localhost:3000  (staff: /staff)
```

### Try the flow

1. On the menu, tap **+** on a couple of bentos → **Checkout**.
2. Pick a pickup window, optionally add a name → **Place order**.
3. You'll land on a confirmation page with a **pickup code** — stock drops on the
   menu and the staff dashboard immediately.

## Roadmap

- **M0** — Scaffold ✅
- **M1** — Menu & inventory + staff CRUD ✅ (this commit)
- **M2** — Customer cart + browse polish
- **M3** — Ordering: pickup-window picker → place order (atomic decrement) → pickup code
- **M4** — Staff order queue (preparing / ready / picked-up) + realtime stock
- **M5** — i18n pass, order cutoff/lead-time, daily menu reset
- **Later** — Payments (PayPay / Stripe), accounts & favorites, LINE/push notifications

## Open product questions

1. **Pickup windows** — fixed slots aligned to train departures (recommended) vs. free-pick time.
2. **Order lead time** — minimum minutes between order and pickup for the kitchen (e.g. 20 min).
3. **Single stall vs. multi-station** — add a `Location` model now if expansion is likely.
