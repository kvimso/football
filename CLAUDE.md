## Meta Rule

After completing any task that corresponds to a checklist item in the Build Phases section, update this file by changing `- [ ]` to `- [x]` for that item. Do this at the end of every session where a feature was completed.

# CLAUDE.md

This file provides guidance to Claude Code when working on this project. Read this entire file before making any changes.

---

## Project Overview

**Georgian Football Talent Platform** — a full-stack web app that centralizes Georgian youth football players and connects them with international scouts, agents, and clubs. Built by a single developer (Andria) using Claude Code.

**The problem:** Georgian football talent is booming (Kvaratskhelia €70M to PSG, Mamardashvili €30M to Liverpool, 37,000+ registered youth players) but there is no centralized digital platform for scouts to discover Georgian youth players. Player data is fragmented, match footage is scattered, and international scouts have no single source.

**The solution:** A scouting platform where academies register player profiles, camera systems (provided by our partner Starlive via Pixellot cameras) deliver verified statistics automatically, and scouts can search, filter, compare, message academies, and discover players — all bilingual in English and Georgian.

### Revenue Model

- **Scout yearly subscription** — access to the platform, messaging, player data
- **Academy monthly payment** — premium features, enhanced profile visibility
- No free tier planned — all platform access will require subscription (not yet implemented)

### Target Users

- **Scouts/Agents** (international) — browse players, view verified camera stats, watch highlights, message academies. English-first experience.
- **Academy Admins** (Georgian) — register and manage their club's player profiles, respond to scout messages, handle transfer requests. Georgian-first experience.

### Camera Partner: Starlive

Starlive is an official Pixellot reseller (Kyrgyzstan, Armenia, expanding into Georgia). They already have cameras at several Georgian clubs. They provide cameras, video, and analytics to clubs. We provide the scouting platform as an add-on that makes their camera package more valuable.

**Deal:** Starlive provides camera data to us for free. When we start generating revenue, we negotiate a revenue share. Pixellot directly introduced us to Starlive.

---

## Site Architecture

### Part 1: Public Landing Page (no auth required)

A professional marketing page — clean, hrmony.com-style layout. This is what everyone sees first. Its job is to explain what the platform does, build trust, and convert visitors into registered users.

**Public pages:** `/` (landing), `/about`, `/contact`, `/login`, `/register`

### Part 2: Protected Platform (auth required)

A Transfermarkt-style data marketplace behind login. All player browsing, stats, matches, clubs, scout tools, and admin panel require authentication.

**Protected pages:** Everything under `/players`, `/matches`, `/clubs`, `/dashboard`, `/admin`, `/platform`

---

## Tech Stack

| Layer      | Technology                  | Why                                                                                     |
| ---------- | --------------------------- | --------------------------------------------------------------------------------------- |
| Framework  | **Next.js 16 (App Router)** | API routes, server components, middleware for auth                                      |
| Database   | **Supabase (PostgreSQL)**   | Auth, RLS, storage, realtime — all built-in                                             |
| Realtime   | **Supabase Realtime**       | Instant chat messaging (Phase 6.5)                                                      |
| Auth       | **Supabase Auth**           | Email/password for scouts, magic link or invite-based for academy admins                |
| Storage    | **Supabase Storage**        | Player photos, club logos, chat file attachments (Phase 6.5)                            |
| Styling    | **Tailwind CSS v4**         | Utility-first, responsive                                                               |
| Deployment | **Vercel**                  | Native Next.js hosting, edge functions, preview deployments                             |
| Camera API | **Starlive (Pixellot)**     | Automated match footage + individual player statistics via API                          |
| Language   | **TypeScript**              | Type safety across the full stack                                                       |

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
    layout.tsx              # Root layout (AuthProvider wrapper, minimal — no nav)
    globals.css             # Tailwind config + CSS custom properties + component classes
    (public)/               # Route group: landing page ONLY (LandingNav + LandingFooter)
      layout.tsx
      page.tsx              # Landing page (professional, hrmony-style)
    (shared)/               # Route group: public pages accessible to everyone (Navbar + Footer)
      about/page.tsx
      contact/page.tsx
    (auth)/                 # Route group: login/register (LandingNav, .landing theme)
      layout.tsx
      login/page.tsx
      register/page.tsx
      callback/route.ts     # Supabase auth callback handler
    (platform)/             # Route group: auth-protected marketplace pages (Navbar + Footer + auth guard)
      layout.tsx            # Checks auth — redirects to /login if not authenticated
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
        requests/page.tsx   # Sent contact requests + statuses (→ Messages in Phase 6.5)
      admin/
        layout.tsx          # Admin role check (academy_admin only)
        page.tsx            # Admin overview
        players/            # Manage academy's players (list, add, edit)
        requests/page.tsx   # Incoming scout contact requests (→ Messages in Phase 6.5)
        transfers/page.tsx  # Transfer requests (incoming, outgoing, search + claim)
    platform/               # Platform admin routes (platform_admin role)
      layout.tsx            # getPlatformAdminContext() auth guard
      page.tsx              # Platform admin dashboard
      clubs/                # Manage all clubs (list, add, edit)
      players/              # Manage all players (list, add, edit)
      scouts/               # View scouts (list, detail)
      requests/page.tsx     # All contact requests
      transfers/page.tsx    # All transfer requests
      invite/page.tsx       # Invite academy admins
    api/
      contact/route.ts      # POST: scout sends contact request
      camera/
        webhook/route.ts    # Pixellot webhook receiver
        sync/route.ts       # Manual trigger to sync camera data
      transfers/route.ts    # Transfer request actions
      players/search/route.ts # Search API for autocomplete and transfer search
  components/
    ui/                     # Primitive components (Button, PlayerSilhouette, Icons, Modal, Badge)
    landing/                # Landing page sections (Hero, Services, ForScouts, ForAcademies, Partners)
    player/                 # Player-specific (PlayerCard, RadarChart, StatsTable, CompareView)
    match/                  # Match-specific (MatchCard, MatchTimeline, TopPerformers)
    layout/                 # Layout components (Navbar, Footer, Sidebar, MobileMenu)
    forms/                  # Form components (PlayerForm, ContactForm, FilterPanel)
    platform/               # Platform admin components (ClubForm, etc.)
  lib/
    supabase/
      client.ts             # Browser Supabase client
      server.ts             # Server-side Supabase client (cookies-based)
      admin.ts              # Service role client (for webhooks, admin ops)
    auth.ts                 # getAdminContext(), getPlatformAdminContext()
    camera/
      client.ts             # Pixellot API client
      types.ts              # Pixellot API response types
      sync.ts               # Logic to map Pixellot data → our DB schema
    database.types.ts       # Auto-generated Supabase types (DO NOT EDIT MANUALLY)
    translations.ts         # i18n translations object, getServerT() for server components
    validations.ts          # Zod schemas for form/API validation
    utils.ts                # Helpers: slug generation, age calc, position colors, platform ID generation
    constants.ts            # Position list, regions, stat thresholds, config values
  hooks/
    useShortlist.ts
    useLang.ts              # Client-side i18n: { t, lang, setLang }
    useDebounce.ts
  context/
    AuthContext.tsx          # AuthProvider — root-level auth context, useAuth() hook
    LanguageContext.tsx      # i18n provider with en/ka translations
  middleware.ts             # Auth session refresh + redirect unauthenticated users to /login
supabase/
  migrations/               # SQL migration files (sequential, timestamped)
  seed.sql                  # Demo data for development
  config.toml               # Local Supabase config
```

---

## Database Schema

Schema is defined in `supabase/migrations/`. Regenerate types after any change.

**Current tables:** clubs, players, player_club_history, player_skills, player_season_stats, matches, match_player_stats, profiles, shortlists, contact_requests, player_videos, transfer_requests, player_views.

**Phase 6.5 tables (planned):** conversations, messages, conversation_blocks.

The `contact_requests` table will remain for historical data once chat is built.

---

## Permission Model

This is the core trust model of the platform. Follow it strictly.

### Player Statuses

- **active** — belongs to a club, club admin manages profile, scout contacts go through club admin
- **free_agent** — no club (club_id is null), visible to scouts with full career history, contact feature disabled

### Club Admin Permissions

**CAN:** Register players to their club, edit own club's player profiles (bio/photo/physical only — never stats), view/respond to scout contact requests, accept/decline transfers, release players, search and send transfer requests, message scouts (Phase 6.5), block scouts (Phase 6.5).

**CANNOT:** Add/edit/delete matches (camera only), enter/edit player statistics (camera only), upload footage/highlights (camera only), see or modify other clubs' data.

### Scout Permissions

**CAN:** Register freely, browse all players, view career history, shortlist with private notes, send contact requests (active players only), use comparison tool, message any academy (Phase 6.5), download player PDFs.

**CANNOT:** Contact free_agent players (show "Contact not available for free agents"), edit any data.

### Data Source Rules

- **All stats come from cameras only.** No manual entry by anyone.
- Stats display a "Verified by Pixellot" badge
- Player profile info (bio, photo, physical attributes) shows as "club submitted"
- Matches, match stats, highlights, and player videos are created exclusively by camera API integration

### Transfer Flow

- **Active player transfer:** New club sends request → old club accepts/declines → 7-day expiry auto-releases to free_agent
- **Free agent claim:** New club claims directly (no request needed)
- **Release:** Club admin releases player → becomes free_agent, career history preserved via `player_club_history`

---

## Messaging System (Phase 6.5 — Planned)

Real-time chat between scouts and academy admins. **Will replace the contact request system.**

### Architecture

- One conversation thread per scout-academy pair (all player discussions in one thread)
- Any subscribed scout can message any academy directly (no approval gate)
- Real-time via Supabase Realtime subscriptions
- Both sides can send: text, file attachments (images/PDFs/docs, max 10MB), and player references (embedded player cards)

### Anti-Spam

- Max 10 new conversations per scout per day
- Max 30 messages per user per conversation per hour
- Max 5 file uploads per user per day, max 10MB per file
- Academy can block scouts
- All users are subscribers — verified and paying

### Navigation Changes

- Scout sidebar: Home | Shortlist | **Messages** (replaces Requests)
- Admin sidebar: Overview | Players | **Messages** (replaces Requests) | Transfers
- "Message Academy" button on every player profile and club page

---

## Authentication & Authorization

### Roles

| Role            | Access                                                                   | How they register                                      |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `scout`         | Browse players, shortlist, message, compare                              | Self-registration (email/password), no approval needed |
| `academy_admin` | Manage own club's player profiles, message scouts, handle transfers      | Invited (magic link)                                   |
| `platform_admin`| Full platform management (all clubs, players, scouts, requests)          | Manually assigned in DB                                |

### Auth Flow

1. Supabase Auth handles login/register/session
2. On signup, a trigger creates a row in `profiles` with default role `scout`
3. `middleware.ts` refreshes the session cookie on every request
4. **Only `/`, `/about`, `/contact`, `/login`, `/register` are publicly accessible** — everything else requires authentication
5. `AuthProvider` in root layout provides `useAuth()` context with server-side initial state — eliminates flash between route groups
6. All nav components use `useAuth()` — never standalone `useEffect` auth checks
7. `(platform)/layout.tsx` checks for authenticated user — redirects to `/login` if not
8. Admin routes additionally verify `role === 'academy_admin'`; platform admin routes use `getPlatformAdminContext()`
9. API routes validate session via `createServerClient` from `@supabase/ssr`

### Row-Level Security (RLS)

**Public read:** players, matches, clubs, player_club_history, player_skills, player_season_stats, match_player_stats, player_videos — anyone can SELECT.

**Scout permissions:** contact_requests INSERT (scout_id match), shortlists INSERT/UPDATE/DELETE (scout_id match).

**Club admin permissions:** players INSERT/UPDATE (club_id match, profile fields only), contact_requests UPDATE (player's club_id match), transfer_requests INSERT (to_club_id match), transfer_requests UPDATE (from_club_id match), transfer_requests SELECT (from/to club_id match).

**Club admin CANNOT write to:** matches, match_player_stats, player_season_stats, player_skills, player_videos — camera-only, written by service role.

---

## Internationalization (i18n)

- Full English/Georgian bilingual support via `useLang()` hook → `{ t, lang, setLang }`
- Server-side: `getServerT()` from `translations.ts`
- Every user-facing string uses `t('key.subkey')` — never hardcode English or Georgian
- Database: paired columns (`name` + `name_ka`, `description` + `description_ka`)
- Georgian font: Noto Sans Georgian loaded via `next/font`
- Language preference stored in cookie (persists across sessions)
- **All pages including landing page and chat (Phase 6.5) must be fully bilingual**

---

## Camera Integration (Phase 7 — Blocked on Starlive)

1. Starlive's Pixellot cameras record matches at partner academies
2. After processing, data available via Pixellot API
3. Our system pulls match video, player stats, highlights
4. Maps to `matches`, `match_player_stats`, `player_videos` tables
5. Player matching: `jersey_number` + `club_id` → our player records
6. Unmatched players: log warning and skip (don't crash)
7. All camera data has `source: 'pixellot'`
8. Do NOT build mock integration — use real API types but gate behind feature flag

---

## Styling System

- **Landing page:** Light/neutral theme, professional, hrmony.com-style
- **Platform:** Dark theme, data-dense, Transfermarkt-style football pitch aesthetic
- CSS custom properties in `globals.css` for colors
- Primary accent: emerald green
- Position colors: GK=amber, DEF=blue, MID=cyan, ATT=purple, WNG=emerald, ST=red
- Use Tailwind utilities for layout, CSS custom properties for theme colors
- Check `globals.css` before creating new component classes — most patterns exist
- Mobile-first — all pages work at 375px+
- Use `next/image` for all images
- **Landing page: no placeholder content, use real market numbers (37,600+ youth players, €100M+)**

---

## Code Conventions

### General

- **TypeScript** everywhere — no `.js` or `.jsx` files
- **Functional components only** — no class components
- **Server components by default** — only add `'use client'` when you need interactivity
- **Named exports** for components, **default exports** for pages
- **Absolute imports** using `@/` prefix (mapped to `src/`)

### Naming

- Files: PascalCase for components (`PlayerCard.tsx`), camelCase for utilities (`utils.ts`)
- Types/Interfaces: PascalCase (`PlayerWithStats`, `ContactRequestInsert`)
- Hooks: `use` prefix (`useShortlist`, `useLang`)
- Server actions: descriptive verbs (`createContactRequest`, `updatePlayer`, `releasePlayer`)

### Data Fetching

- **Server components**: Query Supabase directly (no API route needed)
- **Client components**: Use API routes (`/api/*`) or server actions
- **Mutations**: Server actions with `revalidatePath` for cache invalidation
- **Search/filters**: URL search params (`useSearchParams`) — shareable/bookmarkable

### Validation & Error Handling

- All form inputs: Zod schemas in `src/lib/validations.ts`
- API routes: validate request body with Zod before processing
- Supabase calls: always check `.error` before using `.data`
- Use `error.tsx` boundary files in route segments
- Camera API: wrap in try/catch, log failures, never crash

---

## Build Phases

### Phases 1-6 + Feature Sessions ✅ ALL COMPLETE

- **Phase 1:** Foundation (Next.js, Supabase, Auth, RLS, seed data, Vercel deployment)
- **Phase 2:** Public Pages (player directory, profiles, matches, clubs, about, SEO)
- **Phase 3:** Scout Features (dashboard, shortlist, contact requests, comparison tool)
- **Phase 4:** Admin Panel + Transfers (player CRUD, transfer system, contact request management)
- **Phase 4.5:** Database Migrations (platform_id, player_club_history, transfer_requests, RLS updates)
- **Phase 5:** Audit & Bug Fixes (TypeScript/lint clean, loading states, error handling, mobile responsive)
- **Phase 6:** Site Redesign (landing page, auth protection, route groups, dark platform theme, AuthProvider)
- **Feature Sessions:** PlayerCard redesign, view tracking, comparison enhancements (overlay radar, stat diffs, shareable URLs), advanced filters (weight, stat ranges), PDF export, similar players section

### Phase 6.5: Chat System ← CURRENT

- [x] Database: conversations, messages, conversation_blocks tables + RLS + indexes
- [x] Enable Supabase Realtime on messages table
- [x] Supabase Storage bucket: chat-attachments (private)
- [x] API: create/list conversations, send/load messages, mark read, file upload
- [x] Anti-spam: rate limits + block check
- [x] Scout inbox + admin inbox pages
- [x] Conversation thread: real-time messages, auto-scroll, date dividers, read indicators
- [x] Chat input: text + file attach + player reference embed
- [x] File attachments: upload, display images inline, docs as downloads
- [x] Player reference: search modal, embedded player card in message
- [x] "Message Academy" button on player profiles and club pages
- [x] Block/unblock system for academy admins
- [x] Remove old contact request UI (keep table for historical data)
- [ ] Update navigation: Requests → Messages
- [x] Empty states, loading states, error handling
- [ ] Global unread badge in navigation
- [ ] Mobile responsive
- [ ] i18n: all chat strings bilingual

### Phase 7: Camera Integration (blocked on Starlive)

- [ ] Pixellot API client + webhook endpoint
- [ ] Data sync + player matching (jersey number + club)
- [ ] "Verified by Pixellot" badge on camera data
- [ ] Highlight clips + manual sync trigger

### Phase 8: Polish & Launch

- [ ] Performance optimization (lazy loading, image optimization, caching)
- [x] Error boundaries and loading states on all pages
- [ ] Email notifications (messages, transfers, contact requests)
- [ ] Analytics dashboard (page views, popular players, scout activity)
- [ ] Academy admin invitation flow
- [ ] Subscription/payment system
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

**Security:** `NEXT_PUBLIC_*` exposed to browser (only Supabase URL/anon key). `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — server-only. `PIXELLOT_*` server-only in `/api/camera/*`.

---

## Critical Rules — Do NOT

### Architecture
- No separate backend — Next.js API routes only
- No ORM — Supabase client with generated types
- No state management libraries — Context + hooks + URL params
- No CSS/component libraries — Tailwind + custom globals.css

### Data & Permissions
- No manual stats entry — camera API only
- No club admin access to matches/stats/videos — camera-only tables
- No exposing service role key to client
- No skipping RLS policies
- No showing parent_guardian_contact publicly
- No deleting player data on club change — set free_agent, preserve history
- No hardcoded demo data in components

### Chat (Phase 6.5)
- No contact request system once chat is live — chat replaces it entirely
- No messages in blocked conversations
- No file uploads over 10MB
- Allowed file types only: jpg, png, gif, webp, pdf, doc, docx

### Design
- No developer-looking landing page — professional, hrmony.com-style
- No placeholder data on landing page — use market statistics
- No unauthenticated platform access
- No letter initials for player photos — use silhouette images

### i18n
- No hardcoded strings — use `t()` with both en/ka translations
- No English without Georgian — both must exist
- No translated slugs — URLs always English

### Code Quality
- No `any` type — proper TypeScript types always
- No skipping Supabase error checks — always check `.error`
- No `useEffect` for server-fetchable data
- No action buttons without disabled/loading state
- No `.js`/`.jsx` files

### Scope (not yet)
- No subscription/payment system yet
- No mobile app — responsive web only
- No AI-powered scouting recommendations
- No auto-expiry cron for transfer requests

### Auth Guards
- **Do not bypass platform admin auth guards** — `platform_admin` role exists with full `/platform/*` admin routes; always use `getPlatformAdminContext()` for authorization
