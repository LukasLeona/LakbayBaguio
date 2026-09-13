# Lakbay Baguio

Lakbay Baguio is now a mobile-first Next.js application with five independent product areas:

- **Home** — brand story, pending itinerary, restaurant discovery, restaurant-owner inquiry, and Kabsat
- **Explore** — searchable parks and attractions, restaurants, and hotels
- **Plan** — an itinerary generator that clusters stops and saves a pending trip locally
- **Nearby** — time-limited traveler discovery with a privacy-safe MapLibre map
- **Chats** — anonymous requests, conversations, real-time messages, unread counts, and safety actions

The original static `index.html`, `assets/`, and `v2/` folders remain in the repository as migration references. The Next.js application in `app/`, `components/`, and `lib/` is the new entry point.

## Requirements

- Node.js **20.9 or newer** (Node 22 LTS is recommended)
- npm
- A Supabase project for live Nearby, Chats, and restaurant inquiries

The project uses Next.js 16 App Router, TypeScript, React, Supabase, MapLibre GL, and Lucide icons.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Supabase environment values, Nearby and Chats run in a non-persistent preview mode. This makes the full UI reviewable while clearly labeling that it is not live.

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
4. Add the three Supabase values to `.env.local`.
5. Restart the Next.js development server.

The SQL installs PostGIS and creates:

- anonymous profiles
- protected exact presence
- nearby discovery RPCs
- chat requests and conversations
- conversation messages and Realtime publication
- blocks, reports, chat ending, and basic request/message rate limits
- restaurant inquiries readable only through the server-side service role

## Nearby privacy model

- Exact coordinates are stored only in the protected `presence` table.
- The browser cannot select from `presence` directly.
- Other travelers receive a distance band and coordinates rounded to a coarse map cell, not exact coordinates.
- Presence is discoverable only while fresh and is refreshed by an active page heartbeat.
- The user chooses a 15, 30, or 60 minute visibility window and can go offline immediately.
- Discovery is limited to roughly 5 km and excludes blocked users.
- Starting a conversation requires an accepted request.

This is a safer baseline, not a substitute for a formal privacy and abuse review before public launch. Production should also add server-side moderation operations, retention/deletion policies, monitoring, and scheduled stale-presence cleanup.

## Restaurant inquiries

Restaurant owners use `/partner`. The form posts to `/api/restaurant-inquiries`, which:

- validates required values on the server
- uses a honeypot for simple bot traffic
- limits repeated submissions from the same email
- writes with a server-only Supabase client
- makes no promise of automatic or paid placement

No inquiry data is stored when Supabase is not configured; the UI returns a clear setup message instead.

## Project map

```text
app/
  api/restaurant-inquiries/route.ts
  chats/page.tsx
  explore/page.tsx
  nearby/page.tsx
  partner/page.tsx
  plan/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
lib/
  supabase/
public/assets/img/
supabase/community.sql
```

Kabsat is imported only by `app/page.tsx`, so it is intentionally absent from Explore, Plan, Nearby, Chats, and Partner.
