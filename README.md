# Baguio Buddy

Baguio Buddy is a mobile-first Next.js application with five core tabs and a utility idea board:

- **Home** — brand story, pending itinerary, restaurant discovery, restaurant-owner inquiry, and Kabsat
- **Explore** — searchable parks and attractions, restaurants, and hotels
- **Plan** — an itinerary generator that clusters stops, saves a pending trip locally, prints an A4-ready route, and creates read-only QR/link shares
- **Wall** — an anonymous Baguio freedom wall for text/photo stories, hearts, owner deletion, and private reports
- **Chat** — time-limited, privacy-safe traveler discovery and direct anonymous conversations in one surface
- **Suggestions** — an anonymous community idea board with categories, upvotes, and duplicate-vote protection

The original static `index.html`, `assets/`, and `v2/` folders remain in the repository as migration references. The Next.js application in `app/`, `components/`, and `lib/` is the new entry point.

## Requirements

- Node.js **20.9 or newer** (Node 22 LTS is recommended)
- npm
- A Supabase project for live Wall, Chat, Suggestions, itinerary shares, and restaurant inquiries

The project uses Next.js 16 App Router, TypeScript, React, Supabase, MapLibre GL, and Lucide icons.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Supabase environment values, Wall and Chat run in a non-persistent preview mode. This makes the full UI reviewable while clearly labeling that it is not live.

Useful checks:

```bash
npm run lint
npm run build
npm audit
```

## Environment variables

Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is browser-safe when Row Level Security is correctly configured. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_`, copied into browser code, or committed.

For production, replace the development map style with a production-ready MapLibre-compatible provider and follow that provider's attribution and usage requirements.

## Supabase setup

1. Create a Supabase project.
2. Open **Authentication → Providers → Anonymous Sign-Ins** and enable anonymous sign-ins.
3. Run [`supabase/community.sql`](supabase/community.sql) in the SQL editor.
4. Run the dated files in [`supabase/migrations`](supabase/migrations) in ascending order, including the Suggestions, itinerary-sharing, and Baguio Wall migrations.
5. Add the three Supabase values to `.env.local`.
6. Restart the Next.js development server.

The SQL installs PostGIS and creates:

- anonymous profiles
- protected exact presence
- nearby discovery RPCs
- direct conversations started from the Nearby radar
- conversation messages and Realtime publication
- blocks, reports, chat ending, and basic request/message rate limits
- restaurant inquiries readable only through the server-side service role
- anonymous suggestions and one-vote-per-account upvotes exposed through privacy-safe RPCs
- private, read-only itinerary shares that expire after 90 days and use rate-limited RPCs
- anonymous Wall posts, one-heart-per-account reactions, private reports, and a rate-limited public photo bucket

## Baguio Wall privacy model

- Public cards never expose the author’s anonymous account ID or generated chat alias.
- Optional JPG, PNG, or WebP photos are resized to a maximum 1600 px side and re-encoded in the browser, stripping embedded metadata such as GPS information.
- Stored uploads are limited to 4 MB, while posting is limited to five posts and two photos per account per hour.
- An account can react only once per post, can remove its reaction, and can permanently delete its own post and photo.
- Reports are private and limited to one report per account per post. Public table access is revoked; the browser uses narrow security-definer RPCs.
- Visible text or image content can still reveal identity, so the UI warns people not to post faces, contact details, or live locations.

## Itinerary sharing and printing

Generated itineraries can be copied, printed or saved as a PDF, and shared from the itinerary action bar. Sharing creates a private token through Supabase; the QR code is generated locally in the browser and the shared page never includes the creator's anonymous account ID. Opening a shared route remembers only a small preview on that browser so Home can offer a convenient “Shared with you” card. The recipient can dismiss that card at any time.

The print view contains every day, stop, fare estimate, travel instruction, and Google Maps leg. It uses an A4-friendly layout on desktop and mobile print dialogs while leaving the interactive controls out of the PDF.

## Nearby privacy model

- Exact coordinates are stored only in the protected `presence` table.
- The browser cannot select from `presence` directly.
- Other travelers receive a distance band and coordinates rounded to a coarse map cell, not exact coordinates.
- Presence is discoverable only while fresh and is refreshed by an active page heartbeat.
- The user chooses a 15, 30, or 60 minute visibility window and can go offline immediately.
- Discovery is limited to roughly 5 km and excludes blocked users.
- Nearby is limited to the Baguio area in both the browser and the database.
- Selecting Chat beside a nearby traveler starts a direct conversation immediately; no approval request is required.

This is a safer baseline, not a substitute for a formal privacy and abuse review before public launch. Production should also add server-side moderation operations, retention/deletion policies, monitoring, and scheduled stale-presence cleanup.

## Restaurant inquiries

Restaurant owners use `/partner`. The form posts to `/api/restaurant-inquiries`, which:

- validates required values on the server
- uses a honeypot for simple bot traffic
- limits repeated submissions from the same email
- writes with a server-only Supabase client
- sends the owner notification from the browser with the dedicated `Baguio Buddy Inquiry` EmailJS template only after the protected Supabase save succeeds
- makes no promise of automatic or paid placement

No inquiry data is stored when Supabase is not configured; the UI returns a clear setup message instead. If EmailJS cannot accept the notification, the saved inquiry remains in Supabase and the UI reports that the email alert failed without encouraging a duplicate submission.

## Project map

```text
app/
  api/restaurant-inquiries/route.ts
  chat/page.tsx
  chats/page.tsx
  explore/page.tsx
  nearby/page.tsx
  partner/page.tsx
  plan/page.tsx
  suggestions/page.tsx
  wall/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
lib/
  supabase/
public/assets/img/
supabase/community.sql
```

Kabsat is imported only by `app/page.tsx`, so it is intentionally absent from Explore, Itinerary, Wall, Chat, Suggestions, and Partner.
