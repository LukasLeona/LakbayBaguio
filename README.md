<p align="center">
  <img src="public/assets/img/logo.svg" alt="Baguio Buddy" width="300" />
</p>

<p align="center">
  <strong>A mobile-first Baguio travel companion for discovering places, building practical itineraries, and meeting fellow travelers safely.</strong>
</p>

<p align="center">
  <a href="https://lakbay-baguio.vercel.app/">View the live experience</a>
  ·
  <a href="https://lakbay-baguio.vercel.app/explore">Explore Baguio</a>
  ·
  <a href="https://lakbay-baguio.vercel.app/plan">Build an itinerary</a>
</p>

## Meet Baguio Buddy

Baguio Buddy turns trip planning into one connected experience. Instead of jumping between saved posts, map searches, fare estimates, and handwritten schedules, travelers can discover places and turn their choices into a day-by-day Baguio route.

The product is designed around three goals:

- **Make planning feel simple** — choose the trip details and preferred destinations, then receive an organized itinerary.
- **Make every stop more useful** — provide practical directions, travel-time and fare estimates, maps, and place details.
- **Make the trip feel social** — offer privacy-conscious traveler discovery, anonymous conversations, community stories, and product suggestions.

## Who it is for

| Audience | The value they receive |
| --- | --- |
| **First-time visitors** | A guided starting point for choosing places and understanding how to move between them. |
| **Returning travelers** | A faster way to combine familiar favorites with something new. |
| **Solo travelers and groups** | A route that accounts for shared interests, available time, pace, and transport preferences. |
| **Local businesses** | A thoughtful channel for reaching travelers while they are actively building their trip. |
| **Tourism and product partners** | A focused digital experience that can support local discovery, visitor confidence, and community feedback. |

## The traveler experience

| Experience | What it helps the traveler do |
| --- | --- |
| **Home** | See trip highlights, return to a pending itinerary, discover restaurants and stays, and ask Kabsat for quick help. |
| **Explore** | Browse parks, attractions, restaurants, and hotels through clearly separated place categories. |
| **Itinerary** | Choose destinations and travel preferences, then generate a practical multi-day route with estimated fares, directions, and timings. |
| **Wall** | Share a text or photo memory anonymously and react to stories from other visitors. |
| **Chat** | Use the traveler radar in Baguio and start an anonymous, time-limited conversation with someone nearby. |
| **Suggestions** | Propose improvements for Baguio Buddy and upvote ideas from the community. |

### A trip from idea to route

1. **Discover** places that match the traveler’s interests.
2. **Choose** destinations, dates, pace, transport preferences, and available time.
3. **Generate** a day-by-day route with stop order, directions, time, and fare estimates.
4. **Keep or share** the plan through local saving, copying, printing/PDF, or a private share link and QR code.
5. **Travel with context** using map links, place details, and a pending-plan reminder across the experience.

Travel times, fares, operating hours, and loading areas are planning estimates. Travelers should confirm current conditions before traveling.

### What a successful experience should deliver

- **Less planning friction:** one flow replaces scattered notes, tabs, and screenshots.
- **More confident decisions:** each stop includes enough context to understand where it fits in the trip.
- **A plan people can use:** the generated route can be revisited, printed, saved as a PDF, or shared with companions.
- **Better local discovery:** restaurants, stays, and attractions are presented as part of the journey rather than isolated listings.
- **A visible feedback loop:** community suggestions help future improvements reflect what travelers actually need.

## Value for local businesses

Baguio Buddy gives restaurants, cafés, stays, tours, and local shops a clear way to introduce their place to travelers already deciding where to go.

The business inquiry journey:

- collects the business and contact details needed for review;
- protects the form with validation, a honeypot, Cloudflare Turnstile, and submission limits;
- stores the inquiry privately in Supabase;
- sends a notification through a dedicated EmailJS template; and
- makes no promise of automatic or paid placement.

Business owners can start at the [feature inquiry page](https://lakbay-baguio.vercel.app/partner).

## Experience principles

- **Mobile first** — five primary actions stay within reach through the bottom navigation.
- **Baguio specific** — destinations, travel language, visual design, and community features are grounded in the city.
- **Useful before decorative** — routes, fares, directions, maps, and clear next actions support real travel decisions.
- **Privacy conscious** — nearby discovery uses coarse public locations, while exact presence remains protected.
- **Community shaped** — anonymous stories and suggestions give travelers a voice without requiring a public profile.
- **Inclusive by default** — semantic controls, visible focus states, responsive layouts, and a skip link support broader access.

## Privacy and safety at a glance

| Data or feature | How it is handled |
| --- | --- |
| Generated itinerary | Remains in the traveler’s browser unless they explicitly create a share link. |
| Shared itinerary | Uses a private random token, hides the creator’s account ID, and expires after 90 days. |
| Nearby presence | Stores exact coordinates in a protected table; other travelers receive only a distance band and coarse map position. |
| Anonymous chat | Is visible only to conversation members and is scheduled for deletion after 30 minutes of inactivity. |
| Wall photos | Are resized and re-encoded in the browser to remove embedded metadata such as GPS information before upload. |
| Reports | Remain private and are not displayed with public posts or profiles. |
| Business inquiries | Are written through a server-only Supabase client and are not publicly readable. |

Anonymous participation hides the account identity from other users; it cannot prevent someone from identifying themselves through the text or images they choose to publish. The interface therefore reminds people not to share faces, contact details, or live locations.

## Product and technology

- **Frontend:** Next.js 16 App Router, React 19, and TypeScript
- **Design:** Poppins, Lucide icons, responsive custom CSS, and a mobile bottom-navigation pattern
- **Data and realtime:** Supabase Postgres, Authentication, Storage, Realtime, PostGIS, Row Level Security, and narrow RPCs
- **Maps:** MapLibre GL with Google Maps links for turn-by-turn route handoff
- **Abuse protection:** Cloudflare Turnstile, server validation, honeypots, database constraints, and rate limits
- **Notifications:** EmailJS
- **Deployment:** Vercel

## Run the project locally

### Requirements

- Node.js 20.9 or newer; Node.js 22 LTS is recommended
- npm
- A Supabase project for persistent community, sharing, chat, and inquiry features

### Start the app

~~~bash
npm install
copy .env.example .env.local
npm run dev
~~~

Open <code>http://localhost:3000</code>.

Without Supabase configuration, selected community interfaces use clearly labeled preview data so the visual experience can still be reviewed. Persistent posting, chat, sharing, and inquiry storage require the backend configuration.

### Environment variables

The committed [<code>.env.example</code>](.env.example) contains blank placeholders. Real values belong only in <code>.env.local</code> or the deployment provider’s encrypted environment settings.

| Variable | Exposure | Purpose |
| --- | --- | --- |
| <code>NEXT_PUBLIC_SUPABASE_URL</code> | Browser-visible | Supabase project endpoint |
| <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> | Browser-visible | Publishable key protected by RLS |
| <code>SUPABASE_SERVICE_ROLE_KEY</code> | **Server secret** | Private server writes and administration |
| <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> | Browser-visible | Turnstile widget configuration |
| <code>TURNSTILE_SECRET_KEY</code> | **Server secret** | Server-side Turnstile verification |
| <code>NEXT_PUBLIC_MAP_STYLE_URL</code> | Browser-visible | Optional MapLibre-compatible map style |
| <code>EMAILJS_SERVICE_ID</code> | Server configuration | Contact notification service |
| <code>EMAILJS_TEMPLATE_ID</code> | Server configuration | Contact notification template |
| <code>EMAILJS_PUBLIC_KEY</code> | Public identifier | EmailJS account identifier |
| <code>EMAILJS_PRIVATE_KEY</code> | **Server secret** | EmailJS private authorization when enabled |
| <code>NEXT_PUBLIC_EMAILJS_SERVICE_ID</code> | Browser-visible | Business inquiry notification service |
| <code>NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID</code> | Browser-visible | Business inquiry template |
| <code>NEXT_PUBLIC_EMAILJS_PUBLIC_KEY</code> | Browser-visible | EmailJS public identifier |

Never add a service-role key, Turnstile secret, EmailJS private key, database password, or personal access token to a <code>NEXT_PUBLIC_*</code> variable.

### Public repository safety

The repository is structured so that runtime secrets stay outside Git:

- <code>.env.local</code>, Vercel project metadata, dependencies, and build output are ignored.
- Browser variables and publishable keys must be treated as public and protected by Row Level Security, domain restrictions, validation, and rate limits.
- Database rows are not part of the repository, but the database schema and security rules are visible and should be reviewed like any other public code.
- Contact details, public service identifiers, bundled media, destination information, and the complete source history become downloadable when the repository is public.
- Database exports, moderation evidence, user screenshots, production logs, and real credentials must never be added to issues, pull requests, or commits.

If a private credential is ever committed, removing the line in a later commit is not enough. Revoke or rotate the credential first, then clean the Git history before publishing.

<details>
<summary><strong>Configure Supabase</strong></summary>

1. Create a Supabase project.
2. Enable **Authentication → Providers → Anonymous Sign-Ins**.
3. Run <code>supabase/community.sql</code> in the SQL editor.
4. Run the dated files in <code>supabase/migrations/</code> in ascending order.
5. Add the Supabase URL, publishable key, and service-role key to <code>.env.local</code>.
6. Restart the development server.

The SQL creates anonymous profiles, protected nearby presence, direct conversations and messages, blocks and reports, restaurant inquiries, community suggestions, private itinerary shares, Wall posts and reactions, cleanup jobs, and database-side rate limits.

</details>

## Quality checks

~~~bash
npm run lint
npm run build
npm audit
~~~

## Project structure

~~~text
app/
  api/                         Server endpoints for contact and inquiries
  chat/                        Nearby radar and anonymous conversations
  explore/                     Destination discovery
  partner/                     Local-business feature inquiry
  plan/                        Itinerary builder and generated routes
  suggestions/                 Community idea board
  wall/                        Anonymous Baguio stories
  page.tsx                     Home experience
components/                    Shared product and feature components
lib/                           Places, itinerary logic, integrations, and helpers
public/assets/                 Brand and destination media
supabase/                      Database schema and migrations
~~~

The original static <code>index.html</code>, <code>assets/</code>, and <code>v2/</code> directories remain as migration references. The active product is the Next.js application in <code>app/</code>, <code>components/</code>, and <code>lib/</code>.

## Project status

Baguio Buddy is an independently developed product and an active work in progress. Before a larger public launch, the project should complete a formal privacy and abuse review, define moderation operations, confirm content and image licenses, monitor database and hosting usage, and test the full experience with real travelers in Baguio.

No license is currently granted for reuse or redistribution of this repository’s source code or media.
