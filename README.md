# Halloween Tangier 2026

Premium event ticketing for an exclusive Halloween night in Tangier. Dark editorial storefront, guest checkout, concurrency-safe inventory, digital QR tickets, staff scanner, and an admin desk.

Tickets are never generated until payment is verified. Browser redirects never mark an order as paid.

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, Motion
- PostgreSQL + Prisma 6
- Auth.js (NextAuth v5) for admin and door staff
- Zod validation, QR codes, PDF tickets, Nodemailer

## Local development

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Generate the client, apply migrations, and seed the event plus staff accounts:

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seeded staff logins come from `.env`:

- Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Door staff: `STAFF_EMAIL` / `STAFF_PASSWORD`

Change those passwords before any real use.

## Payment

### Manual bank transfer (default)

Orders stay `PENDING_VERIFICATION` until an admin confirms funds in `/admin/orders`. Tickets and email/PDF delivery happen only after that confirmation.

Bank details are editable in Event Settings. Placeholders are labeled until the organizer supplies a real RIB.

### CMI / Moroccan card gateway

Online payment stays disabled until all of these are set:

- `CMI_ENABLED=true`
- `CMI_CLIENT_ID`
- `CMI_STORE_KEY`
- `CMI_GATEWAY_URL`

The CMI module builds a signed hosted-payment form and accepts only a server-to-server callback whose `HASH` verifies against the store key. The customer `okUrl` / `failUrl` pages never change payment status.

This repository does not invent merchant credentials or simulate a successful card charge.

### Stripe Checkout

Card payment stays disabled until both are set in `.env`:

- `STRIPE_SECRET_KEY` (`sk_test_…` or `sk_live_…` from the Stripe Dashboard)
- `STRIPE_WEBHOOK_SECRET` (`whsec_…` from the webhook endpoint or `stripe listen`)

Checkout redirects the guest to Stripe. Tickets are created only when `/api/payments/stripe/webhook` receives a signed `checkout.session.completed` (or async success) event with `payment_status=paid`. The Stripe success URL never marks an order paid.

Local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
```

Use the printed `whsec_…` as `STRIPE_WEBHOOK_SECRET`. Do not invent keys.

## Ticket lifecycle

1. Guest reserves 1–6 admissions. Inventory is incremented atomically (`reservedCount + confirmedCount + qty <= capacity`).
2. Unpaid reservations expire (`npm run expire` or `POST /api/cron/expire-reservations` with `Authorization: Bearer $CRON_SECRET`).
3. After verified payment, unique tickets and QR tokens are created.
4. QR payload is the unguessable token only — no name, email, or phone.
5. `/staff/scanner` checks in a ticket once, using a conditional update so two scanners cannot accept the same code.

## Email

If SMTP is unset, ticket emails and PDFs are written to `var/emails/`. That folder is a development sandbox, not a production inbox.

## Marketing

- Promo codes: percentage or fixed, expiry, usage cap, per-customer limit
- Ambassador links: `/?ref=HALLO01` (HALLO01 / HALLO02 / HALLO03 are seeded)
- UTM parameters are stored on the order
- Meta Pixel and Google Analytics load only after cookie consent

## Tests

```bash
npm test
```

Coverage includes inventory oversell protection, payment confirmation rules, webhook idempotency, and QR / check-in outcomes.

## Deployment

Production domain: **https://thesect.ma** (never `http://` for checkout or Stripe).

1. Host the Next.js app and PostgreSQL (Vercel + a cloud Postgres, or a VPS). A domain name alone does not serve the site.
2. At the registrar (ANRT / your `.ma` panel), point DNS at that host:
   - `thesect.ma` → A or ALIAS of the host
   - `www.thesect.ma` → CNAME to `thesect.ma` or the same host
3. Set `APP_URL="https://thesect.ma"`, plus `AUTH_SECRET`, `CRON_SECRET`, and `DATABASE_URL`.
4. Run `npx prisma migrate deploy && npm run db:seed` once.
5. Schedule reservation expiry every minute against `/api/cron/expire-reservations`.
6. Configure SMTP before selling live tickets.
7. Stripe webhook URL: `https://thesect.ma/api/payments/stripe/webhook`. Add CMI credentials only after the merchant account and callback URL are approved.
8. Serve the site over HTTPS.

Legal pages still contain organizer placeholders and must be replaced before public sale.

## Main routes

| Path | Purpose |
| --- | --- |
| `/` | Cinematic landing |
| `/tickets` | Quantity and availability |
| `/checkout` | Guest checkout |
| `/orders/[reference]` | Paid confirmation |
| `/orders/[reference]/pending` | Awaiting verification |
| `/tickets/view/[token]` | Digital ticket + PDF |
| `/faq` `/contact` `/terms` `/privacy` `/refund` | House pages |
| `/admin` | Dashboard |
| `/staff/scanner` | Door QR scanner |
