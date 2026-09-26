# Pai Travels

A travel website where customers discover small-group journeys, compare them, check dated departures and send booking inquiries, plus a secure admin portal to manage everything.

**Stack:** Next.js 16 (App Router, Node.js runtime) · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 · Zod

> The seed script only creates your admin account. To try the site with **sample content** (labelled "Sample" on the site and set to `noindex`), run it with `SEED_SAMPLE_DATA=true`; running it again without the flag removes that sample data.

---

## Quick start (local)

Requirements: **Node.js 20.19+** and **PostgreSQL 14+**.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create a database
createdb pai_travels

# 3. Configure environment
cp .env.example .env
#    then edit .env: set DATABASE_URL, SESSION_SECRET (openssl rand -base64 48),
#    ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters)

# 4. Create tables and your admin account (add SEED_SAMPLE_DATA=true for demo content)
npx prisma migrate deploy
npm run db:seed

# 5. Run
npm run dev
```

- Website: http://localhost:3000
- Admin portal: http://localhost:3000/admin (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

Re-running `npm run db:seed` is safe. It updates the admin password and removes any sample data (`isSample = true`), leaving your own trips alone. Add `SEED_SAMPLE_DATA=true` to recreate the samples.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run check` | ESLint + TypeScript |
| `npm run db:migrate` | Create/apply a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Admin account + sample content |
| `npm run db:studio` | Browse the database |

---

## What's included

### Public site

- **Home** (`/`): hero with destination/month/style search, featured journeys, travel categories with counts, upcoming departures with live seat counts, reviews and calls to action.
- **Journeys** (`/trips`): cards showing destination, name, duration, starting price, next dates, group size, key inclusions and cover image. Filters for search, destination, date range, budget, duration and trip type, plus six sort orders and pagination. Filters are a plain GET form, so they work without JavaScript and every result set has a shareable URL.
- **Compare** (`/compare`): tick "Compare" on up to 3 trips and view them side by side.
- **Trip detail** (`/trips/[slug]`): overview, highlights, day-by-day itinerary, dates and prices table (early bird, seats left, status per departure), accommodation, transport, meals, inclusions and exclusions, meeting point, travel requirements, cancellation policy, gallery, FAQs, reviews and contact details. Includes `TouristTrip` structured data.
- **Booking inquiry** (`/trips/[slug]/book`): choose a departure, number of travellers and contact details, with a live estimated total. On submit the customer sees a confirmation page with a reference. **No payment is collected.**
- **Past trips** (`/past-trips`, `/past-trips/[slug]`): published travel history with dates, places, activities and approved photos. Kept separate from bookable journeys: no departures, no booking links, and publishing is refused unless the trip ended before today.
- **About, Contact (working form), FAQs, Privacy, Terms, Cancellation Policy.** The policy pages are clearly marked templates for legal review.
- 404, error and loading states; skip link; keyboard focus styles; `prefers-reduced-motion`; sitemap and robots.

### Admin portal (`/admin`)

- Sign in with email and password (bcrypt hash, signed HTTP-only session cookie, rate-limited).
- **Trips:** create, edit, publish, unpublish, archive. Manage images (upload or URL, alt text, order, cover), itinerary days, FAQs and departures (dates, price, capacity, status, early bird, note).
- **Inquiries:** list and filter by status, view details, change status, add internal notes, export CSV.
- **Messages:** contact-form inbox (mark read, archive).
- **Reviews:** add, edit, hide or delete.
- **Import past trips:** upload photos or screenshots; Claude reads the clearly visible details (destination, dates, places, itinerary, accommodation, activities, prices) into an editable form beside the source image. Unclear or missing fields are marked *Needs review* and left blank rather than guessed. Choose to create a new past trip or update an existing one; likely duplicates (same image, similar destination, overlapping dates) are shown and must be confirmed before creating a new trip. Saved trips are drafts until published.
- **Past trips:** edit details, publish/unpublish, manage photos. Photos stay private until approved, and approval requires confirming you hold the rights (recorded with the photo). Original uploads are kept privately for reference.
- **Package pricing on trips:** trips sold on any date can have a "price from", price details and an offer end date; after that date the trip is hidden from the site. Drafts can be previewed at their public URL while signed in.

---

## Key implementation decisions

**Trip vs departure.** `Trip` holds the plan (itinerary, inclusions, policies). `Departure` holds each dated instance with its own `startDate`/`endDate`, `price`, `capacity`, `seatsReserved`, `status` (`OPEN`/`CLOSED`/`CANCELLED`) and optional `earlyBirdPrice` + `earlyBirdEndsAt`. See [prisma/schema.prisma](prisma/schema.prisma).

**Seats can't be oversold.** Submitting an inquiry holds its seats immediately. The hold is a single conditional SQL update (`… WHERE seatsReserved + n <= capacity AND status = 'OPEN' AND startDate > today`) inside a transaction, so concurrent requests can't exceed capacity. This was tested with 6 simultaneous 3-seat requests on a 12-seat departure: exactly 4 were accepted. Setting an inquiry to Declined or Cancelled releases its seats, and moving it back re-claims them only if seats are available. Admins can't reduce capacity below the seats currently held. Logic lives in [src/lib/bookings.ts](src/lib/bookings.ts).

**Past departures.** A departure is bookable only if its start date is after today (UTC), its status is `OPEN` and it has seats left. Past departures are hidden publicly and rejected server-side.

**Admin security, in layers.**
1. [src/proxy.ts](src/proxy.ts) (Next 16's replacement for middleware) redirects or returns 401 for `/admin/*` and `/api/admin/*` without a valid signed session.
2. Every admin page, server action and API handler calls `requireAdmin()`/`getAdmin()`, which re-verifies the token **and** checks that the admin still exists in the database. Server actions are public POST endpoints, so this per-action check matters.
3. Admin pages send `noindex` and `no-store`. Login is rate-limited and uses constant-time-ish comparison for unknown emails.

**Spam protection.** Public forms have a hidden honeypot field and a per-IP rate limit.

**Freshness.** Pages that show prices and seats render on every request (`force-dynamic`), so availability is never stale.

**Images.** `next/image` serves AVIF/WebP, responsive sizes and lazy loading. Admins can paste URLs from allowed hosts (`images.unsplash.com` plus `IMAGE_REMOTE_HOSTS`) or upload JPEG/PNG/WebP/AVIF up to 5 MB. Uploads are checked by file signature (not by extension), stored in `UPLOAD_DIR` and served from `/media/…`.

**Past-trip imports.** Originals and past-trip photos live under `UPLOAD_DIR/private/`, which the public `/media` route can't reach. Admins view them via `/api/admin/files/…`; the public `/photos/[id]` route serves a photo only while it is approved and its trip is published, resized on the fly and not cached by `next/image`, so withdrawing approval takes effect within minutes. Extraction uses structured output with a "transcribe, never infer" instruction and per-field clarity, and handles refusals and API errors as failures the admin can retry. Logic: [src/lib/extraction.ts](src/lib/extraction.ts), [src/lib/past-trips.ts](src/lib/past-trips.ts), [src/app/admin/past-trip-actions.ts](src/app/admin/past-trip-actions.ts).

**Email.** Inquiries and messages are always stored in the database first. If `RESEND_API_KEY`, `EMAIL_FROM` and `ADMIN_NOTIFY_EMAIL` are set, the admin is notified and the customer gets an acknowledgement. Without them, emails are skipped and logged.

**Design.** An editorial "travel journal" palette: warm paper, ink, deep moss, with oxblood and antique brass as sparing accents. Cormorant Garamond headings, Inter body. Tokens live in [src/app/globals.css](src/app/globals.css).

---

## What you need to provide

| Item | Required? | Notes |
| --- | --- | --- |
| PostgreSQL database | Yes | Local, or hosted (Neon, Supabase, Railway, RDS…) |
| `SESSION_SECRET` | Yes | `openssl rand -base64 48` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes | Used by the seed script to create or update the admin |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Your public domain, e.g. `https://paitravels.com` |
| Business contact details | Recommended | `NEXT_PUBLIC_CONTACT_*` (placeholders show until set) |
| Resend account + verified domain | Optional | For email notifications |
| `ANTHROPIC_API_KEY` | Optional | Needed for **Import past trips** to read images. Create one at console.anthropic.com → API keys, add it to `.env` and restart. Without it, uploads are stored but can't be read. `ANTHROPIC_MODEL` overrides the default `claude-opus-5`. |
| Real trip content, photos, reviews | Yes, before launch | Replace the sample trips and reviews |
| Legal review of policy pages | Yes, before launch | Privacy, Terms and Cancellation pages are templates |
| Payment provider | Not used | The site deliberately collects no payments |

---

## Deployment

### Option A: Node server or VPS (Render, Railway, Fly.io, a VM)

Recommended if admins will **upload** images, because uploads need a persistent disk.

```bash
npm ci
npx prisma migrate deploy
npm run db:seed          # first deploy only (creates the admin account)
npm run build
npm start                # serves on $PORT or 3000
```

- Set all environment variables from `.env.example`.
- Mount a persistent volume and point `UPLOAD_DIR` at it (for example `/data/uploads`).
- Put the app behind HTTPS. Session cookies are `Secure` in production.

### Option B: Vercel (or another serverless host)

1. Create a hosted Postgres database (Neon, Supabase, etc.) and set `DATABASE_URL`.
2. Import the repo into Vercel and add the environment variables.
3. Build command: `npm run build` (the default works).
4. Apply migrations from your machine or CI: `DATABASE_URL=… npx prisma migrate deploy`, then `npm run db:seed` once.
5. **Uploads:** serverless filesystems don't persist, so use image **URLs** instead. Host photos on a CDN (Cloudinary, S3/CloudFront, etc.), add its hostname to `IMAGE_REMOTE_HOSTS` and redeploy.
6. The in-memory rate limiter is per instance on serverless. For stricter limits, swap [src/lib/rate-limit.ts](src/lib/rate-limit.ts) for a shared store such as Upstash Redis.

### After deploying

- Sign in at `/admin` and review your trips, reviews and policy text.
- Submit `https://your-domain/sitemap.xml` to search engines. Only published, non-sample trips are listed.

---

## Project structure

```
prisma/
  schema.prisma          data model
  migrations/            SQL migrations
  seed.ts                admin account + sample content
src/
  proxy.ts               admin route gate
  app/
    (site)/              public pages, forms and server actions
    admin/               login, portal pages and admin server actions
    api/admin/           protected API (CSV export)
    media/[...path]/     serves uploaded images
    sitemap.ts, robots.ts
  components/            UI (site + admin form kit)
  lib/                   db, auth, bookings, validation, queries, formatting
```

## Known limitations

- Rate limiting is in memory, so it is per process and resets on restart.
- The customer confirmation page shows booking details for 24 hours via an unguessable reference. Customers don't have accounts.
- One admin role (no granular permissions). Add more admins by inserting into `AdminUser` or extending the seed script.
