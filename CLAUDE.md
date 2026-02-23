## Meta Rule

After completing any task that corresponds to a checklist item in the Build Phases section, update this file by changing `- [ ]` to `- [x]` for that item. Do this at the end of every session where a feature was completed.

# CLAUDE.md

This file provides guidance to Claude Code when working on this project. Read this entire file before making any changes.

---

## Project Overview

**Georgian Football Talent Platform** — a full-stack web app that centralizes Georgian youth football players and connects them with international scouts, agents, and clubs. Built by a single developer (Andria) using Claude Code.

**The problem:** Georgian football talent is booming (Kvaratskhelia €70M to PSG, Mamardashvili €30M to Liverpool, 37,000+ registered youth players) but there is no centralized digital platform for scouts to discover Georgian youth players. Player data is fragmented, match footage is scattered, and international scouts have no single source.

**The solution:** A scouting platform where academies register player profiles, camera systems (provided by our partner Starlive via Pixellot cameras) deliver verified statistics automatically, and scouts can search, filter, compare, and contact players — all bilingual in English and Georgian.

### Target Users

- **Scouts/Agents** (international) — browse players, view verified camera stats, watch highlights, request contact. English-first experience.
- **Academy Admins** (Georgian) — register and manage their club's player profiles, respond to scout inquiries, handle transfer requests. Georgian-first experience.

### Camera Partner: Starlive

Starlive is an official Pixellot reseller (Kyrgyzstan, Armenia, expanding into Georgia). They already have cameras installed at several Georgian clubs. They provide cameras, video, and analytics to clubs. We provide the scouting platform as an add-on that makes their camera package more valuable.

**Deal:** Starlive provides camera data to us for free. When we start generating revenue, we negotiate a revenue share. Pixellot directly introduced us to Starlive.

---

## Site Architecture

The platform has two distinct parts:

### Part 1: Public Landing Page (no auth required)

A professional marketing page — clean, hrmony.com-style layout. This is what everyone sees first. Its job is to explain what the platform does, build trust, and convert visitors into registered users.

**Public pages:** `/` (landing), `/about`, `/login`, `/register`

**Landing page structure:**

1. Hero — headline, subtitle, background image, CTA buttons (Register as Scout / Register Your Academy)
2. What We Do — brief explanation with icons for key features
3. Our Services — service cards (Player Database, Verified Camera Stats, Highlight Reels, Scout Contact System, Academy Management)
4. For Scouts — benefits and CTA to register
5. For Academies — benefits and CTA to register
6. Partners — "Powered by Pixellot" / Starlive logo (when approved)
7. Footer — links, contact info, register CTAs

### Part 2: Protected Platform (auth required)

A Transfermarkt-style data marketplace behind login. All player browsing, stats, matches, clubs, scout tools, and admin panel require authentication.

**Protected pages:** Everything under `/players`, `/matches`, `/clubs`, `/dashboard`, `/admin`

---

## Tech Stack

| Layer      | Technology                  | Why                                                                                                |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 15 (App Router)** | API routes (no separate backend), server components for DB queries, middleware for auth             |
| Database   | **Supabase (PostgreSQL)**   | Auth, row-level security, file storage, realtime — all built-in. No infrastructure to manage       |
| Auth       | **Supabase Auth**           | Email/password for scouts, magic link or invite-based for academy admins                           |
| Storage    | **Supabase Storage**        | Player photos, club logos                                                                          |
| Styling    | **Tailwind CSS v4**         | Utility-first, responsive                                                                          |
| Deployment | **Vercel**                  | Native Next.js hosting, edge functions, preview deployments                                        |
| Camera API | **Starlive (Pixellot)**     | Automated match footage + individual player statistics via API                                     |
| Language   | **TypeScript**              | Type safety across the full stack                                                                  |

---

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build (catches type errors)
npm run start        # Run production build locally
npm run lint         # ESLint + Next.js lint rules
npx supabase start   # Start local Supabase (Docker required)
npx supabase db push # Push migrations to remote Supabase
npx supabase gen types typescript --local > src/lib/database.types.ts  # Regenerate DB types
```

**Always run `npm run build` before committing.** This catches TypeScript errors and broken imports that `dev` mode misses.

**After any database schema change**, regenerate types with the `supabase gen types` command above.

---

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout (minimal — no platform nav for landing page)
    page.tsx                # Landing page (public, professional, hrmony-style)
    about/page.tsx          # About page (public)
    (auth)/
      login/page.tsx
      register/page.tsx
      callback/route.ts     # Supabase auth callback handler
    (platform)/             # Route group: ALL auth-protected marketplace pages
      layout.tsx            # Platform layout (Navbar, Footer, auth guard — redirects to /login if not authenticated)
      players/
        page.tsx            # Player directory with filters
        [slug]/page.tsx     # Player profile
      matches/
        page.tsx            # Match library
        [slug]/page.tsx     # Match detail
      clubs/
        page.tsx            # Club listing
        [slug]/page.tsx     # Club detail with squad
      dashboard/
        layout.tsx          # Scout role check
        page.tsx            # Scout home (saved players, recent activity)
        shortlist/page.tsx  # Saved/shortlisted players
        requests/page.tsx   # Sent contact requests + statuses
      admin/
        layout.tsx          # Admin role check (academy_admin only)
        page.tsx            # Admin overview
        players/
          page.tsx          # Manage academy's players
          new/page.tsx      # Add player form
          [id]/edit/page.tsx # Edit player profile
        requests/page.tsx   # Incoming scout contact requests
        transfers/page.tsx  # Transfer requests (incoming, outgoing, search + claim)
    api/
      contact/route.ts      # POST: scout sends contact request
      camera/
        webhook/route.ts    # Pixellot webhook receiver
        sync/route.ts       # Manual trigger to sync camera data
      transfers/route.ts    # Transfer request actions
      players/search/route.ts # Search API for autocomplete and transfer search
  components/
    ui/                     # Primitive components (Button, Input, Card, Modal, Badge)
    landing/                # Landing page sections (Hero, Services, ForScouts, ForAcademies, Partners)
    player/                 # Player-specific (PlayerCard, RadarChart, StatsTable, CompareView)
    match/                  # Match-specific (MatchCard, MatchTimeline, TopPerformers)
    layout/                 # Layout components (PlatformNavbar, Footer, Sidebar, MobileMenu)
    forms/                  # Form components (PlayerForm, ContactForm, FilterPanel)
  lib/
    supabase/
      client.ts             # Browser Supabase client
      server.ts             # Server-side Supabase client (cookies-based)
      admin.ts              # Service role client (for webhooks, admin ops)
    camera/
      client.ts             # Pixellot API client
      types.ts              # Pixellot API response types
      sync.ts               # Logic to map Pixellot data → our DB schema
    database.types.ts       # Auto-generated Supabase types (DO NOT EDIT MANUALLY)
    validations.ts          # Zod schemas for form/API validation
    utils.ts                # Helpers: slug generation, age calc, position colors, platform ID generation
    constants.ts            # Position list, regions, stat thresholds, config values
  hooks/
    useShortlist.ts
    useLang.ts
    useDebounce.ts
  context/
    LanguageContext.tsx      # i18n provider with en/ka translations
  middleware.ts             # Auth session refresh + redirect unauthenticated users from platform pages to /login
  styles/
    globals.css             # Tailwind config + CSS custom properties + component classes
supabase/
  migrations/               # SQL migration files (sequential, timestamped)
  seed.sql                  # Demo data for development
  config.toml               # Local Supabase config
```

---

## Database Schema

**Database schema** is defined in `supabase/migrations/`. Run `npx supabase gen types typescript --local > src/lib/database.types.ts` after any schema change.

---

## Permission Model

This is the core trust model of the platform. Follow it strictly.

### Player Statuses

- **active** — belongs to a club, club admin manages profile, scout contacts go through club admin
- **free_agent** — no club (club_id is null), visible to scouts with full career history, contact feature disabled

### Club Admin Permissions

**CAN do:**

- Register new players to their club (first_name, last_name, date_of_birth, position, photo optional, height, weight, preferred_foot, parent_guardian_contact optional)
- Edit their own club's player profiles (same fields only — never stats)
- View incoming scout contact requests for their players and respond (approve/reject)
- Accept or decline incoming transfer requests from other clubs
- Release a player from their club (player becomes free_agent)
- Transfer a player directly to a requesting club (one action — accept transfer request)
- Search for players from other clubs or free agents and send transfer requests

**CANNOT do:**

- Add, edit, or delete matches (camera system only)
- Enter or edit player statistics of any kind (player_season_stats, match_player_stats, player_skills)
- Upload match footage or highlights (camera system only)
- See or modify any other club's players or data

### Scout Permissions

**CAN do:**

- Register and log in freely (no approval needed)
- Browse all players (active and free_agent)
- View full player career history across all clubs
- Shortlist players and add private notes
- Send contact requests for active players (goes to club admin)
- Use player comparison tool

**CANNOT do:**

- Contact free_agent players (feature not built yet — show message "Contact not available for free agents")
- Edit any player, club, or match data

### Data Source Rules

- **All stats come from cameras only.** No manual entry by anyone.
- Stats display a "Verified by Pixellot" badge
- Player profile info (bio, photo, physical attributes) shows as "club submitted"
- Matches, match stats, highlights, and player videos are created exclusively by camera API integration

### Transfer Flow Summary

- **Active player transfer:** New club sends request → old club accepts/declines → 7-day expiry auto-releases player to free_agent if no response
- **Free agent claim:** New club claims directly (no request needed)
- **Release:** Club admin releases player → becomes free_agent, career history preserved via `player_club_history`

---

## Authentication & Authorization

### Roles

| Role            | Access                                                                   | How they register                                      |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `scout`         | Browse players, shortlist, send contact requests                         | Self-registration (email/password), no approval needed |
| `academy_admin` | Manage own club's player profiles, respond to requests, handle transfers | Invited (magic link)                                   |

### Auth Flow

1. Supabase Auth handles login/register/session
2. On signup, a trigger creates a row in `profiles` with default role `scout`
3. `middleware.ts` refreshes the session cookie on every request
4. **Only `/`, `/about`, `/login`, `/register` are publicly accessible** — everything else requires authentication
5. `(platform)/layout.tsx` checks for authenticated user — redirects to `/login` if not
6. Admin routes additionally verify `role === 'academy_admin'`
7. API routes validate session via `createServerClient` from `@supabase/ssr`

### Row-Level Security (RLS)

**Public read:**

- players, matches, clubs, player_club_history, player_skills, player_season_stats, match_player_stats, player_videos — anyone can SELECT

**Scout permissions:**

- contact_requests: INSERT where scout_id matches their auth id
- shortlists: INSERT/UPDATE/DELETE where scout_id matches their auth id

**Club admin permissions:**

- players: INSERT/UPDATE where club_id matches their profile's club_id (profile fields only)
- contact_requests: UPDATE where player belongs to their club_id (approve/reject only)
- transfer_requests: INSERT where to_club_id matches their club_id
- transfer_requests: UPDATE where from_club_id matches their club_id (accept/decline)
- transfer_requests: SELECT where from_club_id or to_club_id matches their club_id

**Club admin CANNOT write to:**

- matches, match_player_stats, player_season_stats, player_skills, player_videos — these are camera-only, written by service role via API

---

## Internationalization (i18n)

- Full English/Georgian bilingual support
- Translation keys stored in a translations object (context provider)
- Access via `useLang()` hook → returns `{ t, lang, setLang }`
- Every user-facing string uses `t('key.subkey')`
- Database fields have paired columns: `name` + `name_ka`, `description` + `description_ka`
- Georgian font: Noto Sans Georgian loaded via `next/font`
- Language preference stored in cookie (persists across sessions)
- **Landing page must be fully bilingual** — all headings, descriptions, CTAs need both languages

**Critical rule:** Never hardcode English or Georgian text in components. Always use `t()`. When adding new UI text, add both `en` and `ka` translations.

---

## Camera Integration (Phase 7)

Camera partner is **Starlive** (official Pixellot reseller). They already have cameras at Georgian clubs.

### How It Works

1. Starlive's Pixellot cameras record matches at partner academies
2. After match processing, data becomes available via Pixellot API
3. Our system pulls match video, individual player stats, highlights
4. Data maps to our `matches`, `match_player_stats`, and `player_videos` tables
5. Player identification via jersey number recognition → mapped to our player records via `jersey_number` + `club_id`

### Important Notes

- Player matching: `jersey_number` + `club_id` → our `players.jersey_number` + `players.club_id`
- If a player can't be matched, log a warning and skip (don't crash the sync)
- All camera data has `source: 'pixellot'`
- Do NOT build mock camera integration — use real API types but gate behind feature flag until Starlive provides API credentials

---

## Styling System

### Theme

- **Landing page:** Light/neutral theme, professional, clean — hrmony.com style. Must feel like a business website, not a developer project.
- **Platform (behind login):** Dark theme, data-dense, Transfermarkt-style. Football pitch aesthetic.
- CSS custom properties in `globals.css` for colors
- Primary accent: emerald green
- Position-specific colors: GK=amber, DEF=blue, MID=cyan, ATT=purple, WNG=emerald, ST=red

### Conventions

- Use Tailwind utilities for layout and spacing
- Use CSS custom properties for theme colors
- Use `globals.css` component classes for repeated patterns (`.btn-primary`, `.card`, etc.)
- Check `globals.css` before creating new component classes — most patterns exist
- Mobile-first responsive design — all pages must work at 375px+
- Use `next/image` for all images (player photos, club logos, hero images)
- **Landing page: no placeholder content, no developer UI, use real market numbers (37,600+ youth players, €100M+ in transfers)**

---

## Code Conventions

### General

- **TypeScript** everywhere — no `.js` or `.jsx` files
- **Functional components only** — no class components
- **Server components by default** — only add `'use client'` when you need interactivity (forms, state, effects)
- **Named exports** for components, **default exports** for pages
- **Absolute imports** using `@/` prefix (mapped to `src/`)

### Naming

- Files: PascalCase for components (`PlayerCard.tsx`), camelCase for utilities (`utils.ts`)
- Types/Interfaces: PascalCase with descriptive names (`PlayerWithStats`, `ContactRequestInsert`)
- Hooks: `use` prefix (`useShortlist`, `useLang`, `useDebounce`)
- Server actions: descriptive verbs (`createContactRequest`, `updatePlayer`, `releasePlayer`, `acceptTransfer`)

### Data Fetching

- **Server components**: Query Supabase directly in the component (no API route needed)
- **Client components**: Use API routes (`/api/*`) or server actions
- **Mutations**: Use Next.js server actions with `revalidatePath` for cache invalidation
- **Search/filters**: URL search params (`useSearchParams`) — keeps state in URL, shareable/bookmarkable

### Validation

- **All form inputs**: Validate with Zod schemas (defined in `src/lib/validations.ts`)
- **API routes**: Validate request body with Zod before processing
- **Database**: RLS policies as the last line of defense

### Error Handling

- Use Next.js `error.tsx` boundary files in route segments
- API routes return proper HTTP status codes with JSON error messages
- Supabase errors: check `.error` property, never assume success
- Camera API: wrap all calls in try/catch, log failures, never crash the app

---

## Build Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] Initialize Next.js 15 with TypeScript + Tailwind CSS v4
- [x] Set up Supabase project (remote + local dev)
- [x] Create database migrations for all tables
- [x] Implement Supabase Auth (register, login, logout, session refresh)
- [x] Create `profiles` trigger (auto-create profile on signup)
- [x] Set up middleware for session management
- [x] Create RLS policies for all tables
- [x] Set up seed data (3 clubs, 12 players, 5 matches)
- [x] Build root layout with Navbar + Footer + LanguageContext
- [x] Deploy skeleton to Vercel with env vars configured

### Phase 2: Public Pages ✅ COMPLETE

- [x] Home page: hero, platform stats, featured players, recent matches
- [x] Player directory: server-side filtered list with search, position/age/club/foot filters
- [x] Player profile: full stats, radar chart, season history, videos, scouting report
- [x] Match library: filterable match list
- [x] Match detail: score, report, player stats table, video embed
- [x] Club listing + club detail with squad
- [x] About page
- [x] 404 page
- [x] SEO: dynamic metadata, Open Graph images, structured data for player pages

### Phase 3: Scout Features ✅ COMPLETE

- [x] Scout registration + login flow (no approval needed)
- [x] Scout dashboard (home, activity feed)
- [x] Shortlist: add/remove players, private notes
- [x] Contact request: form on player profile → sends to academy admin (active players only)
- [x] Contact disabled message for free_agent players
- [x] Request status tracking (pending/approved/rejected)
- [x] Player comparison tool (side-by-side stats)

### Phase 4: Academy Admin Panel + Transfers ✅ COMPLETE

- [x] Admin layout with sidebar navigation
- [x] Player management: list, add new, edit profile (scoped to own club, profile fields only)
- [x] Player registration form with auto-generated platform_id
- [x] Release player button with confirmation
- [x] Incoming contact requests: view, approve, reject
- [x] Basic stats dashboard (how many scouts viewed your players)
- [x] Transfer system: search players by platform_id or name
- [x] Transfer system: send transfer request for active players at other clubs
- [x] Transfer system: claim free agent players directly
- [x] Transfer system: incoming transfer requests — accept or decline
- [x] Transfer system: outgoing transfer requests — view status

### Phase 4.5: Database Migration ✅ COMPLETE

- [x] Add players.platform_id (unique, format GFP-XXXXX)
- [x] Add players.parent_guardian_contact (nullable)
- [x] Change players.status to only allow 'active' | 'free_agent'
- [x] Create player_club_history table
- [x] Create transfer_requests table
- [x] Update RLS: remove club admin INSERT/UPDATE on matches, match_player_stats, player_season_stats, player_skills, player_videos
- [x] Update seed data with platform_id, status, and player_club_history rows

### Phase 5: Audit & Bug Fixes ✅ COMPLETE

- [x] Run `npm run build` — fix all TypeScript errors
- [x] Run `npm run lint` — fix all lint warnings
- [x] Fix race condition: all action buttons must have disabled/loading state while processing (use `useTransition` or local state). Affects: shortlist add/remove, contact request send, admin approve/reject, transfer actions, player edit/add forms
- [x] Fix slow rendering: identify unnecessary `'use client'` components, add missing `loading.tsx` files in route segments, add Suspense boundaries for independent data fetches
- [x] Verify all API routes have auth validation
- [x] Verify all Supabase `.from()` calls check `.error` before using `.data`
- [x] Mobile responsive check on all pages

### Phase 6: Site Redesign ← CURRENT PRIORITY

Transform the site from a developer project into a professional product.

**6a. Landing Page (public)**
- [ ] New landing page: professional, hrmony.com-style, clean layout
- [ ] Hero section: headline, subtitle, background image, two CTAs (Register as Scout / Register Your Academy)
- [ ] "What We Do" section with feature icons
- [ ] "Our Services" cards: Player Database, Verified Camera Stats, Highlight Reels, Scout Contact System, Academy Management
- [ ] "For Scouts" section with benefits and CTA
- [ ] "For Academies" section with benefits and CTA
- [ ] Partners section (Starlive/Pixellot logos when approved)
- [ ] Professional footer with register CTAs
- [ ] All landing page content bilingual (English/Georgian)
- [ ] Use real market numbers: 37,600+ youth players, €100M+ in recent Georgian transfers

**6b. Auth Protection**
- [ ] Move all player/match/club browsing behind authentication
- [ ] Update middleware: redirect unauthenticated users from `/players`, `/matches`, `/clubs`, `/dashboard`, `/admin` to `/login`
- [ ] Create `(platform)/` route group with auth guard layout
- [ ] Keep `/`, `/about`, `/login`, `/register` public
- [ ] Professional login and register page design

**6c. Platform UI Polish**
- [ ] Redesign platform navigation (Transfermarkt-style, data-dense)
- [ ] Replace letter-initial player cards with proper silhouette fallback images
- [ ] Improve player profile layout
- [ ] Improve admin panel design
- [ ] Consistent dark theme color scheme across all platform pages
- [ ] Mobile responsive on all platform pages

### Phase 7: Camera Integration

Connect Starlive/Pixellot camera data to the platform.

- [ ] Pixellot API client with authentication (via Starlive credentials)
- [ ] Webhook endpoint to receive match completion events
- [ ] Data sync: transform Pixellot stats → our schema
- [ ] Player matching logic (jersey number + club)
- [ ] Display verified camera stats on player profiles and match pages
- [ ] "Verified by Pixellot" badge on all camera-generated data
- [ ] Auto-generated highlight clips on player profiles
- [ ] Manual sync trigger for admin (in case webhook fails)

### Phase 8: Polish & Launch

- [ ] Performance optimization (lazy loading, image optimization, caching)
- [x] Error boundaries and loading states on all pages
- [ ] Email notifications (contact request received, request status update, transfer request received)
- [ ] Analytics (basic page views, popular players, scout activity)
- [ ] Academy admin invitation flow
- [ ] Production deployment + custom domain

---

## Environment Variables

```bash
# .env.local (NEVER commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key     # Server-only, never expose to client

# Camera API (add when Starlive provides credentials)
PIXELLOT_API_URL=
PIXELLOT_API_KEY=
PIXELLOT_WEBHOOK_SECRET=

# Optional
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Security rules:**

- `NEXT_PUBLIC_*` vars are exposed to the browser — only Supabase URL and anon key should be public
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use ONLY in API routes and server actions, NEVER in client components
- `PIXELLOT_*` vars are server-only — used in `/api/camera/*` routes only

---

## Critical Rules — Do NOT

### Architecture

- **Do not create a separate backend** (Express, Fastify, etc.) — Next.js API routes handle server-side logic
- **Do not use an ORM** (Prisma, Drizzle) — use Supabase client directly with generated types
- **Do not install state management libraries** (Redux, Zustand, Jotai) — React Context + hooks + URL params are sufficient
- **Do not add CSS frameworks or component libraries** (Chakra, MUI, shadcn) — use Tailwind + custom components in `globals.css`

### Data and Permissions

- **Do not allow manual stats entry by anyone** — all stats come from Pixellot camera API only
- **Do not let club admins add/edit matches** — matches come from camera system
- **Do not let club admins edit player stats, skills, or videos** — camera data only
- **Do not expose service role key to client** — only use in server-side code
- **Do not skip RLS policies** — every table must have policies
- **Do not show parent_guardian_contact to scouts or publicly** — internal use only
- **Do not delete player data when they leave a club** — set status to free_agent, preserve history
- **Do not hardcode demo data in components** — all data comes from Supabase queries (seed.sql for dev)

### Design

- **Do not make the landing page look like a developer project** — must be professional, hrmony.com-style
- **Do not show player counts or demo data on the landing page** — use market statistics instead
- **Do not allow unauthenticated access to platform pages** — `/players`, `/matches`, `/clubs`, `/dashboard`, `/admin` all require login
- **Do not use letter initials as player photo fallbacks** — use proper silhouette images per position

### i18n

- **Do not hardcode strings** — every user-facing string uses `t('key')` from `useLang()`
- **Do not add English text without adding Georgian** — both translations must exist
- **Do not translate slugs** — URLs are always English

### Code Quality

- **Do not use `any` type** — always define proper TypeScript types
- **Do not skip error handling on Supabase calls** — always check `.error` before using `.data`
- **Do not use `useEffect` for data that can be fetched in server components** — prefer server-side data fetching
- **Do not create files without the `.ts` or `.tsx` extension** — no `.js`/`.jsx`
- **Do not submit forms or trigger actions without disabling the button during processing** — always use `useTransition` or loading state to prevent race conditions

### Scope

- **Do not build payment/subscription system** — not in MVP scope
- **Do not build a mobile app** — responsive web only
- **Do not build real-time chat between scouts and academies** — contact requests are async
- **Do not build AI-powered scouting recommendations** — future feature, not MVP
- **Do not build platform admin role** — not in MVP scope, manage directly in Supabase dashboard
- **Do not build auto-expiry cron for transfer requests** — will add later
