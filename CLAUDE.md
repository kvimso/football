## Meta Rule

After completing any task that corresponds to a checklist item in the Build Phases section, update this file by changing `- [ ]` to `- [x]` for that item. Do this at the end of every session where a feature was completed.

# CLAUDE.md

This file provides guidance to Claude Code when working on this project. Read this entire file before making any changes.

---

## Project Overview

**Binocly** — a full-stack web app that connects Georgian youth football academies with international scouts. Built by a single developer (Andria) using Claude Code.

**The problem:** Georgian football talent is booming (Kvaratskhelia €70M to PSG, Mamardashvili €30M to Liverpool, 37,600+ registered youth players) but there is no centralized digital surface for scouts to discover Georgian academies and reach the people who can sign their players.

**The solution:** A *relationship layer* on top of Georgian youth football. Scouts browse paid-tier-ranked clubs, message academy admins directly, and link out to Starlive (our partner) for the actual match data, stats, and video. Binocly does not mirror Starlive — Binocly owns the discovery + chat thread.

### Revenue Model

- **Scout yearly subscription** — access to the platform + messaging.
- **Academy paid placement** — `clubs.tier` controls ranking on `/clubs` directory.
- No free tier planned — all platform access will require subscription (not yet implemented).

### Target Users

- **Scouts/Agents** (international) — browse clubs, message academies, follow Starlive link-out for match data. English-only.
- **Academy Admins** (Georgian) — manage their club page (logo, hero, history, gallery), register and edit their roster, respond to scout chat. English-only (per 2026-04-15 decision).

### Partners

- **Starlive** — Pixellot reseller across Caucasus. Provides Binocly free access to their **website** (match data, stats, league pages, video). Scouts click "Leagues" in our nav and are redirected out. **No API integration for launch** — deferred to v2 post-revenue (~2-3 months post-launch). See `Haveinmind.md`.
- **Free Football Agency** — recruiting/relationship partner.
- *Pixellot is not a partner* — it's Starlive's upstream camera tech.

---

## Site Architecture

### Two-world rule

The site has two strictly separate worlds. **No bridges except login/logout** — a logged-in user clicking "Leagues" must never land on a public marketing page; an anonymous user clicking a "Browse clubs" CTA must always go to register/login.

### World 1: Public (no auth)

Marketing surface. English copy hard-coded. Noto Serif scoped to this subtree (root layout loads it globally; public pages style with it).

**Routes:** `/` (landing), `/about`, `/contact`, `/demo`, `/login`, `/register`, `/pending`, `/auth/callback`.

### World 2: Platform (auth required)

The minimal scout surface plus academy admin tooling.

**Scout-facing (3 surfaces only):**
- `/clubs` — paid-tier-ranked directory.
- `/clubs/[slug]` — club detail (logo, hero, history, photo gallery, age+position-filtered roster, "Message Academy" button).
- `/leagues` — three Starlive link-out cards.
- `/messages` — chat (Phase 6.5).

**Academy admin tooling (under `/admin/`):**
- `/admin/players` — register/edit players (this is the source of truth for `/clubs/[slug]` rosters).
- `/admin/club/edit` — edit own club page (logo, hero, history, gallery).
- `/admin/transfers` — accept/decline transfer requests, search and claim free agents.
- `/admin/messages` — chat inbox.
- `/admin/announcements` — short academy posts visible on the club page.

**Platform admin tooling (under `/platform/`):**
- Manage all clubs, players, scouts, transfers, demo requests; invite academy admins.

### Login destination

Logged-in users land on **`/`** (landing), not `/clubs` or `/dashboard`. Landing CTAs swap via `useAuth()` to point at `/clubs` and `/messages`.

### What was killed in Phase 7

- Scout-facing player directory (`/players`, profile, comparison, PDF, similar, AI search).
- Scout dashboard (`/dashboard/*`).
- Match library (`/matches`, schedule, standings).
- Watchlist.
- Camera integration code (`/api/camera`, `lib/camera`, sync UI).
- Contact request system (chat replaced it in Phase 6.5).
- Bilingual i18n machinery (`LanguageContext`, `useLang`, `getServerT`, `t()` calls, `_ka` columns, language toggle, language cookie). Site is English-only.

---

## Tech Stack

| Layer      | Technology                  | Why                                                                  |
| ---------- | --------------------------- | -------------------------------------------------------------------- |
| Framework  | **Next.js 16 (App Router)** | API routes, server components, server actions, middleware for auth |
| Database   | **Supabase (PostgreSQL)**   | Auth, RLS, storage, realtime — all built-in                          |
| Realtime   | **Supabase Realtime**       | Chat messaging                                                       |
| Auth       | **Supabase Auth**           | Email/password for scouts; invite-based for academy admins         |
| Storage    | **Supabase Storage**        | Club assets (logo, hero, gallery), chat attachments                  |
| Styling    | **Tailwind CSS v4**         | Utility-first, light-themed, warm                                     |
| Deployment | **Vercel**                  | Native Next.js hosting, edge functions, preview deployments         |
| Email      | **Resend**                  | Demo and contact alert emails                                         |
| Language   | **TypeScript** (strict)     | No `any`. Generated DB types via `supabase gen types`                |

---

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build (catches type errors)
npm run start        # Run production build locally
npm run lint         # ESLint + Next.js lint rules
npx supabase db push # Push migrations to remote Supabase
npx supabase gen types typescript --linked > src/lib/database.types.ts  # Regenerate DB types
```

**Always run `npm run build` before committing.** Catches TypeScript errors and broken imports that dev mode misses.

**After any database schema change**, regenerate types via the command above.

---

## Project Structure

```
src/
  app/
    layout.tsx                  # Root layout (AuthProvider, ThemeProvider, fonts incl. Noto Serif)
    globals.css                 # Tailwind config + CSS custom properties + component classes
    (public)/                   # Landing only — LandingNav + LandingFooter
      layout.tsx
      page.tsx                  # Landing
    (shared)/                   # About, Contact, Demo — accessible to everyone
      layout.tsx
      about/page.tsx
      contact/page.tsx
      demo/page.tsx
    (auth)/                     # Login, register, pending, callback
      layout.tsx
      login/page.tsx
      register/page.tsx
      pending/page.tsx
      callback/route.ts
    (platform)/                 # Scout surfaces — auth guard in layout
      layout.tsx
      clubs/
        page.tsx                # Tier-ranked directory
        [slug]/page.tsx         # Detail (hero, history, gallery, roster, message button)
      leagues/
        page.tsx                # Three Starlive link-out cards
      messages/
        page.tsx                # Inbox
        [conversationId]/page.tsx
    admin/                      # Academy admin — getAdminContext() guard
      layout.tsx
      page.tsx                  # Slim home (recent chats + roster shortcut)
      players/                  # Roster CRUD
      club/edit/page.tsx        # Edit own club page
      transfers/page.tsx
      messages/                 # Chat inbox
      announcements/page.tsx
    platform/                   # Platform admin — getPlatformAdminContext() guard
      layout.tsx
      page.tsx
      clubs/                    # Manage all clubs (incl. tier)
      scouts/                   # View scouts
      transfers/page.tsx
      demo-requests/page.tsx
      invite/page.tsx
    api/
      conversations/route.ts
      messages/route.ts
      chat-upload/route.ts
      transfers/route.ts
      clubs/route.ts
      notifications/route.ts
      admin/players/search/route.ts   # Used by chat PlayerSearchModal
  components/
    ui/                         # Primitives (Button, Modal, Badge, Icons)
    landing/                    # Landing sections (Hero, Services, Partners, etc.)
    layout/                     # Navbar, Footer, NotificationBell, AvatarDropdown
    chat/                       # ChatInbox, ChatThread, MessageBubble, PlayerRefCard, etc.
    club/                       # ClubCard, ClubDetailClient, ClubRosterFilter, ClubAnnouncements
    admin/                      # ClubProfileForm, PlayerForm, TransferCard, AnnouncementForm, etc.
    platform/                   # Platform admin components
  lib/
    supabase/{client,server,admin}.ts
    auth.ts                     # getAdminContext(), getPlatformAdminContext()
    database.types.ts           # Generated — do not edit
    validations.ts              # Zod schemas
    utils.ts                    # slug, age helpers, computeAgeGroup, position colors
    constants.ts                # Position list, regions, AGE_GROUPS, etc.
    storage.ts                  # uploadClubAsset helper
    notifications/              # Notification creation helpers
    chat-utils.ts               # Chat formatting helpers
    result.ts                   # Result<T,E> discriminated union for server actions
  hooks/
    useDebounce.ts
  context/
    AuthContext.tsx             # Root-level auth context, useAuth() hook
    ThemeContext.tsx            # Theme provider (light/dark)
  middleware.ts                 # Auth session refresh, role-scoped path protection
supabase/
  migrations/                   # SQL migration files (sequential, timestamped)
  seed.sql                      # Demo data
```

---

## Database Schema

Defined in `supabase/migrations/`. Regenerate types after any change.

**Tables (post-Phase-7):**

- **clubs** (id, slug, name, logo_url, hero_photo_url, history_text, gallery_urls, city, region, description, website, tier, created_at, updated_at)
- **players** (id, slug, name, club_id, status, position, date_of_birth, jersey_number, photo_url, scouting_report, …)
- **player_club_history** — preserved on transfer/release.
- **profiles** (id, role, club_id, full_name, country, is_approved, …)
- **conversations**, **messages**, **conversation_blocks** — chat (Phase 6.5).
- **transfer_requests** — active player transfers and free-agent claims.
- **academy_announcements** — short posts shown on club page.
- **notifications** — chat unread + transfer events only.
- **demo_requests** — demo-page submissions feeding the approval gate.
- **contact_requests** — historical only; no new writes (chat replaced it).

**Killed in Phase 7:**

- `player_views` — view tracking is gone (no global player browser).
- `watchlist`, `watchlist_folders`, `watchlist_folder_players`, `watchlist_tags` — scouts have no shortlist.
- `matches`, `match_player_stats`, `player_videos` — camera data deferred to v2; tables to be dropped in cleanup migration.
- `_ka` columns on every table — site is English-only.

---

## Permission Model

This is the core trust model. Follow it strictly.

### Player Statuses

- **active** — belongs to a club; admin manages profile.
- **free_agent** — no club; visible inside any club's history but not on scout-facing surfaces (scouts browse by club, not player).

### Roles

| Role            | Access                                                                  | Registration                                |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| `scout`         | Browse clubs, message any academy, link out to Starlive                 | Self-register; `is_approved=false` until    |
|                 |                                                                         | platform admin reviews via `/platform/demo` |
| `academy_admin` | Manage own club page + roster, message scouts, handle transfers         | Invite (magic link)                         |
| `platform_admin`| Full platform; assigned in DB                                           | Manual                                      |

### What scouts CAN'T do

- View any global player directory (it doesn't exist).
- Edit any data.
- See `parent_guardian_contact` or other private fields (RLS enforced).

### What academy admins CAN'T do

- Edit other clubs' data.
- Edit `clubs.tier`, `clubs.slug`, `clubs.name` (column-level GRANT blocks them).
- Edit player stats / matches / videos (camera-only tables — currently deferred).

### Approval gate

New scouts → `is_approved=false` → land on `/pending` → platform admin reviews demo request at `/platform/demo-requests` → flips `is_approved=true` → access platform.

---

## Authentication & Authorization

- Supabase Auth handles login/register/session.
- `profiles` row auto-created via DB trigger on signup with default role `scout`, `is_approved=false`.
- `middleware.ts` refreshes session, gates platform routes, redirects unapproved scouts to `/pending`.
- `AuthProvider` in root layout provides `useAuth()` with server-side initial state — no flash between route groups.
- All nav components use `useAuth()` — never standalone `useEffect` auth checks.
- `(platform)/layout.tsx` checks for authenticated approved user.
- `getAdminContext()` (`role='academy_admin'`) and `getPlatformAdminContext()` (`role='platform_admin'`) guard admin/platform routes.
- API routes validate session via `createServerClient` from `@supabase/ssr`.

---

## Row-Level Security (RLS)

**Public read:** clubs, players, player_club_history, academy_announcements.

**Scout writes:** conversations + messages (own scout_id), conversation_blocks (none — academy-side only).

**Academy admin writes:** clubs UPDATE (own club only, column-level GRANT restricts which columns); players INSERT/UPDATE (own club_id); transfer_requests (to_club_id INSERT, from_club_id UPDATE); academy_announcements (own club_id); messages.

**Service role only:** demo_requests inserts and approval flips, notification creation, future camera-data writes.

---

## Internationalization (i18n)

**Site is English-only** (decision 2026-04-15, codified in Phase 7 redesign).

- No `t()` calls, no `useLang()`, no `getServerT()`, no `LanguageContext`.
- No bilingual DB columns (`_ka` columns are dropped).
- No `LanguageToggle` component.
- Noto Serif loaded globally; used for hero headlines and section titles.
- Inter is the body sans serif.

If you reach for `t('foo')` while editing existing code, hardcode the English string instead.

---

## Camera Integration (Phase 9 — deferred to v2)

Was Phase 7 in earlier docs; renamed to Phase 9 and deferred. Starlive does not have API infrastructure built yet — they will only build it once Binocly proves revenue + partnership viability (~2-3 months post-launch). Until then, scouts get match data via the link-out at `/leagues`.

When Phase 9 starts:

1. Wire `STARLIVE_API_URL`, `STARLIVE_API_KEY`, `STARLIVE_WEBHOOK_SECRET` env vars.
2. Build `/api/starlive/{webhook,sync}/route.ts`.
3. Reintroduce `matches`, `match_player_stats`, `player_videos` tables (camera-only writes).
4. Player matching: `jersey_number` + `club_id`.
5. Add "Verified by Starlive" badge.

See `Haveinmind.md`.

---

## Styling System

### Theme

Light-first warm palette with `[data-theme="dark"]` override. Cookie-persisted via `ThemeContext`, FOUC-safe.

### Tokens (see `globals.css`)

| Token                     | Light    | Dark     |
| ------------------------- | -------- | -------- |
| `--background`            | `#FDFCFA` | `#12110F` |
| `--surface`               | `#F4F1EC` | `#1C1A17` |
| `--surface-alt` (Track 8) | `#F0EBE3` | `#1F1B17` |
| `--elevated`              | `#EAE6DF` | `#2A2623` |
| `--primary`               | `#1B8A4A` | `#4ADE80` |
| `--foreground`            | `#1A1917` | `#EEECE8` |
| `--foreground-secondary`  | `#4A4641` | `#C4BFB8` |
| `--foreground-faint`      | `#A39E97` | `#6B6660` |
| `--danger`                | `#CC3333` | `#E05252` |

### Conventions

- Custom properties for all colors — never hardcode hex in components.
- Tailwind utilities for layout, custom properties for theme colors.
- Mobile-first; all pages work at 375px+. Use `100dvh` not `100vh` on full-height containers.
- `next/image` for all images.
- Loading skeletons: `bg-elevated`.
- Green focus-visible ring on all interactive elements.

---

## Code Conventions

### General

- TypeScript everywhere. No `.js` / `.jsx`.
- Functional components only.
- Server components by default; `'use client'` only for interactivity.
- Named exports for components, default exports for pages.
- Absolute imports via `@/` (mapped to `src/`).

### Naming

- PascalCase for components and types; camelCase for utilities.
- Hooks: `use` prefix.
- Server actions: descriptive verbs (`updateMyClub`, `createConversation`, `sendMessage`).

### Patterns to standardize on (Phase 7+)

- `Result<T, E>` discriminated union (`src/lib/result.ts`) for every server action / helper that can fail.
- `as const` arrays + `(typeof X)[number]` for closed enums (`AGE_GROUPS`, `POSITIONS`, `ASSET_KINDS`).
- `satisfies z.ZodType<Partial<RowType>>` on every Zod schema mapped to a DB row.
- `Pick<Database['public']['Tables']['X']['Row'], …>` for component prop types — never hand-roll DTOs.
- `useActionState` + `useFormStatus` for forms (React 19 / Next 16 idiom).
- Direct browser → Supabase Storage for files; never route bytes through server actions (4MB body limit).
- URL search params for filter state (native `useTransition` + `router.replace` for ≤2 params; `nuqs` library if/when it grows past).

### Data fetching

- Server components query Supabase directly.
- Client components hit `/api/*` or call server actions.
- Mutations: server actions with `revalidatePath`.
- Search/filters: URL search params — shareable, bookmarkable.

### Validation & error handling

- Zod schemas in `src/lib/validations.ts` or per-action.
- API routes validate request body with Zod first.
- Always check `.error` before using `.data` from Supabase.
- `error.tsx` boundaries on every route segment.

---

## Build Phases

### Phases 1-6.5 (complete)

- **1-5:** Foundation, public pages, scout features, admin panel, transfers, audit + bug fixes.
- **6:** Site Redesign (landing, auth protection, route groups, dark theme, AuthProvider).
- **6.5:** Chat System — real-time messaging, file attachments, player refs, block/unblock, mobile responsive.

### Phase 7: Minimal Scout Surface Redesign (current)

Master plan: `docs/plans/2026-04-28-phase-7-redesign-master-plan.md`.

Tracks (in execution order):

- [ ] Track 0 — Audit decisions resolved.
- [ ] Track 1 — Clubs schema migration (tier, hero_photo_url, history_text, gallery_urls, column-level GRANT, `club-assets` storage bucket).
- [ ] Track 2 — `/clubs` directory + detail rewrite, navbar update, middleware C1 fix.
- [ ] Track 3 — `/leagues` Starlive link-out page.
- [ ] Track 4 — `/admin/club/edit` editor (logo, hero, history, gallery).
- [ ] Track 5 — Chat redesign (move to `/messages`, strip `t()`, rework PlayerRefCard).
- [ ] Track 6 — Demolition (kill `/players`, `/dashboard`, `/matches`, watchlist, AI search, camera code).
- [ ] Track 7 — i18n machinery removal + drop `_ka` columns.
- [ ] Track 8 — Warmth pass.

### Phase 8: Polish & Launch

- [ ] Performance optimization (lazy loading, image optimization, caching).
- [x] Error boundaries and loading states on all pages.
- [ ] Email notifications (chat, transfers).
- [ ] Subscription/payment system.
- [ ] Custom domain (see `Haveinmind.md`).
- [ ] Production deployment.

### Phase 9: Starlive API Integration (deferred to v2)

Post-revenue, ~2-3 months post-launch. See `Haveinmind.md`.

---

## Environment Variables

```bash
# .env.local (NEVER commit)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key            # Server-only

# Resend (email)
RESEND_API_KEY=

# Starlive league link-out URLs (placeholders until Andria provides — Haveinmind)
NEXT_PUBLIC_STARLIVE_LEAGUE_URL_1=https://starlive.example/u19
NEXT_PUBLIC_STARLIVE_LEAGUE_URL_2=https://starlive.example/u17
NEXT_PUBLIC_STARLIVE_LEAGUE_URL_3=https://starlive.example/u15

# Optional
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Phase 9 (deferred — do NOT wire yet):
# STARLIVE_API_URL=
# STARLIVE_API_KEY=
# STARLIVE_WEBHOOK_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — server-only; never `NEXT_PUBLIC_*`.

---

## Critical Rules — Do NOT

### Architecture

- No separate backend — Next.js API routes only.
- No ORM — Supabase client with generated types.
- No state management libraries — Context + hooks + URL params.
- No CSS/component libraries — Tailwind + custom `globals.css`.

### Two-world rule

- Logged-in users do NOT see public marketing routes (`/about`, `/contact`, `/demo` are exceptions — explicitly shared). Logged-in `/leagues` always means platform `/leagues`, never any `(shared)/leagues` page.
- Anonymous users hitting platform routes redirect to `/login`.
- The middleware does NOT redirect logged-in users from `/` — they land on the landing page with `useAuth()`-driven CTAs.

### Data & permissions

- No `/players` route anywhere — the surface is gone.
- No global player browser, shortlist, comparison, PDF export, or AI search for scouts.
- No view tracking, scout demand cards, or "browse all players" CTAs.
- No manual stats entry by anyone — camera-only when Phase 9 lands.
- No exposing service role key to client.
- No skipping RLS policies.
- No showing `parent_guardian_contact` publicly.
- No deleting player data on club change — set `free_agent`, preserve history via `player_club_history`.

### Chat (Phase 6.5+)

- No new contact request system — chat replaces it. `contact_requests` table kept for historical data only.
- No messages in blocked conversations.
- No file uploads over 10MB.
- Allowed file types only: jpg, png, gif, webp, pdf, doc, docx.
- Player ref cards are non-clickable; "from <club>" footer links to `/clubs/[slug]`.

### Design

- No developer-looking landing page — professional, hrmony.com-style.
- No placeholder data on landing — use real market statistics (37,600+ youth players, €100M+).
- No unauthenticated platform access.
- No letter initials for player photos — use silhouette images.

### i18n

- No `t()` calls. Site is English-only.
- No `_ka` columns. They are dropped in Phase 7 Track 7.
- No `LanguageToggle`. The component is deleted.
- No language cookie handling in middleware.

### Code quality

- No `any` type — proper TypeScript types always.
- No skipping Supabase error checks — always check `.error`.
- No `useEffect` for server-fetchable data.
- No action buttons without disabled/loading state.
- No `.js`/`.jsx` files.
- No hand-rolled DTO types that duplicate generated DB types — use `Pick<Database['public']['Tables']['X']['Row'], ...>`.

### Auth Guards

- Always use `getAdminContext()` for `/admin/*` and `getPlatformAdminContext()` for `/platform/*`.
- Never accept `clubSlug` / `clubId` from the caller in admin actions — always derive from `getAdminContext()`.

### Scope (not yet)

- No subscription/payment system yet.
- No mobile app — responsive web only.
- No AI-powered scouting recommendations.
- No auto-expiry cron for transfer requests.
- No Starlive API integration until Phase 9.

---

## Visual Companion (superpowers brainstorming)

When using the visual companion during UI brainstorming:

- **Always build whole-page mockups** (nav + content + footer). No isolated component fragments — Andria needs full-page context to judge designs.
- **Multi-variant comparisons get in-page navigation.** If you're showing two or more design options, embed tab/arrow buttons inside the mockup itself that swap the body via JS `onclick` handlers. One HTML file, one URL — flip between variants without waiting for a new screen.
- Use real project tokens (cream `#FDFCFA`, green `#1B8A4A`, etc.) and real copy where possible — placeholders hide problems.

---

## Have in Mind (pre-launch checklist)

`Haveinmind.md` (project root) is a running list of decisions and setup steps **deferred during development** that MUST be resolved before Binocly ships to production — domain purchase, env wiring, email sender, final pricing, Starlive URLs, etc.

**Claude's responsibility:**

- Any time a discussion reaches a "we'll deal with that later" or "not yet" point on a launch-blocking item, **append a new section to `Haveinmind.md`** with status + what to do + why deferred.
- Before claiming a feature "complete" or before final-launch work, **remind Andria to review `Haveinmind.md`** — unresolved items there likely block shipping.
- Keep entries dated and concrete (links, file paths, exact addresses) so future-Andria can act without re-research.
