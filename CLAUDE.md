## Meta Rule

After completing any task that corresponds to a checklist item in the Build Phases section, update this file by changing `- [ ]` to `- [x]` for that item. Do this at the end of every session where a feature was completed.

# CLAUDE.md

This file provides guidance to Claude Code when working on this project. Read this entire file before making any changes.

---

## Project Overview

**Georgian Football Talent Platform** — a full-stack web app that centralizes Georgian youth football players and connects them with international scouts, agents, and clubs. Built by a single developer (Andria) using Claude Code.

**The problem:** Georgian football talent is booming (Kvaratskhelia €70M to PSG, Mamardashvili €30M to Liverpool, 37,000+ registered youth players) but there is no centralized digital platform for scouts to discover Georgian youth players. Player data is fragmented, match footage is scattered, and international scouts have no single source.

**The solution:** A scouting platform where academies register player profiles, camera systems provide verified statistics automatically, and scouts can search, filter, compare, and contact players — all bilingual in English and Georgian.

### Target Users

- **Scouts/Agents** (international) — browse players, view verified camera stats, watch highlights, request contact. English-first experience.
- **Academy Admins** (Georgian) — register and manage their club's player profiles, respond to scout inquiries, handle transfer requests. Georgian-first experience.

---

## Tech Stack

| Layer      | Technology                  | Why                                                                                                                                   |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 15 (App Router)** | SSR for SEO (scouts find players via Google), API routes (no separate backend), server components for DB queries, middleware for auth |
| Database   | **Supabase (PostgreSQL)**   | Auth, row-level security, file storage, realtime — all built-in. No infrastructure to manage                                          |
| Auth       | **Supabase Auth**           | Email/password for scouts, magic link or invite-based for academy admins                                                              |
| Storage    | **Supabase Storage**        | Player photos, club logos                                                                                                             |
| Styling    | **Tailwind CSS v4**         | Utility-first, dark theme, responsive                                                                                                 |
| Deployment | **Vercel**                  | Native Next.js hosting, edge functions, preview deployments                                                                           |
| Camera API | **zone14 / Pixellot** (TBD) | Automated match footage + individual player statistics via API                                                                        |
| Language   | **TypeScript**              | Type safety across the full stack — prevents data shape bugs                                                                          |

### Key Libraries

- `@supabase/supabase-js` + `@supabase/ssr` — Supabase client for server/client components
- `next/image` — optimized image loading for player photos
- `recharts` or SVG — radar charts and stat visualizations
- `zod` — runtime validation for API inputs and form data
- `date-fns` — date formatting (match dates, player DOB, age calculation)

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
├── public/                     # Static assets (logos, OG images)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (providers, nav, footer)
│   │   ├── page.tsx            # Home page
│   │   ├── (public)/           # Route group: public pages (no auth required)
│   │   │   ├── players/
│   │   │   │   ├── page.tsx        # Player directory with filters
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Player profile (SSR for SEO)
│   │   │   ├── matches/
│   │   │   │   ├── page.tsx        # Match library
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Match detail
│   │   │   ├── clubs/
│   │   │   │   ├── page.tsx        # Club listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Club detail with squad
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   ├── (auth)/             # Route group: authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts    # Supabase auth callback handler
│   │   ├── dashboard/          # Protected: scout dashboard
│   │   │   ├── layout.tsx      # Auth guard wrapper
│   │   │   ├── page.tsx        # Scout home (saved players, recent activity)
│   │   │   ├── shortlist/
│   │   │   │   └── page.tsx    # Saved/shortlisted players
│   │   │   └── requests/
│   │   │       └── page.tsx    # Sent contact requests + statuses
│   │   ├── admin/              # Protected: academy admin panel
│   │   │   ├── layout.tsx      # Admin auth guard (role check)
│   │   │   ├── page.tsx        # Admin overview
│   │   │   ├── players/
│   │   │   │   ├── page.tsx    # Manage academy's players
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx    # Add player form
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit player profile
│   │   │   ├── requests/
│   │   │   │   └── page.tsx    # Incoming scout contact requests
│   │   │   └── transfers/
│   │   │       └── page.tsx    # Transfer requests (incoming, outgoing, search + claim)
│   │   └── api/                # API routes
│   │       ├── contact/
│   │       │   └── route.ts    # POST: scout sends contact request
│   │       ├── camera/
│   │       │   ├── webhook/
│   │       │   │   └── route.ts  # Camera system webhook receiver
│   │       │   └── sync/
│   │       │       └── route.ts  # Manual trigger to sync camera data
│   │       ├── transfers/
│   │       │   └── route.ts    # Transfer request actions
│   │       └── players/
│   │           └── search/
│   │               └── route.ts  # Search API for autocomplete and transfer search
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Primitive components (Button, Input, Card, Modal, Badge)
│   │   ├── player/             # Player-specific (PlayerCard, RadarChart, StatsTable, CompareView)
│   │   ├── match/              # Match-specific (MatchCard, MatchTimeline, TopPerformers)
│   │   ├── layout/             # Layout components (Navbar, Footer, Sidebar, MobileMenu)
│   │   └── forms/              # Form components (PlayerForm, ContactForm, FilterPanel)
│   ├── lib/                    # Shared utilities and config
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   ├── server.ts       # Server-side Supabase client (cookies-based)
│   │   │   └── admin.ts        # Service role client (for webhooks, admin ops)
│   │   ├── camera/
│   │   │   ├── client.ts       # Camera API client (zone14 or Pixellot)
│   │   │   ├── types.ts        # Camera API response types
│   │   │   └── sync.ts         # Logic to map camera data → our DB schema
│   │   ├── database.types.ts   # Auto-generated Supabase types (DO NOT EDIT MANUALLY)
│   │   ├── validations.ts      # Zod schemas for form/API validation
│   │   ├── utils.ts            # Helpers: slug generation, age calc, position colors, platform ID generation
│   │   └── constants.ts        # Position list, regions, stat thresholds, config values
│   ├── hooks/                  # Custom React hooks
│   │   ├── useShortlist.ts     # Add/remove players from shortlist
│   │   ├── useLang.ts          # Language toggle hook
│   │   └── useDebounce.ts      # Search input debouncing
│   ├── context/
│   │   └── LanguageContext.tsx  # i18n provider with en/ka translations
│   ├── middleware.ts           # Next.js middleware: auth session refresh, protected route checks
│   └── styles/
│       └── globals.css         # Tailwind config + CSS custom properties + component classes
├── supabase/
│   ├── migrations/             # SQL migration files (sequential, timestamped)
│   ├── seed.sql                # Demo data for development
│   └── config.toml             # Local Supabase config
├── .env.local                  # Supabase URL + anon key + service role key (NEVER commit)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── CLAUDE.md                   # This file
```

---

## Database Schema

### Core Tables

```sql
-- Clubs / Academies
create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ka text not null,
  slug text unique not null,
  logo_url text,
  city text,
  region text,
  description text,
  description_ka text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete set null,
  platform_id text unique not null,     -- Auto-generated unique ID (format: GFP-XXXXX), visible on profile
  name text not null,
  name_ka text not null,
  slug text unique not null,
  date_of_birth date not null,
  nationality text default 'Georgian',
  position text not null,               -- GK, DEF, MID, ATT, WNG, ST
  preferred_foot text,                  -- Left, Right, Both
  height_cm int,
  weight_kg int,
  photo_url text,
  jersey_number int,
  parent_guardian_contact text,          -- Email or phone, NEVER shown publicly, for future use
  status text default 'active',         -- 'active' | 'free_agent'
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Player Club History (tracks career across multiple clubs)
create table player_club_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  club_id uuid references clubs(id),
  joined_at date not null,
  left_at date                          -- null means currently at this club
);

-- Player Skills (1-100 ratings for radar chart — camera-generated only)
create table player_skills (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  pace int check (pace between 1 and 100),
  shooting int check (shooting between 1 and 100),
  passing int check (passing between 1 and 100),
  dribbling int check (dribbling between 1 and 100),
  defending int check (defending between 1 and 100),
  physical int check (physical between 1 and 100),
  updated_at timestamptz default now(),
  unique(player_id)
);

-- Season Stats (aggregated per season — camera-generated only)
create table player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  season text not null,
  matches_played int default 0,
  goals int default 0,
  assists int default 0,
  minutes_played int default 0,
  pass_accuracy numeric(5,2),
  shots_on_target int default 0,
  tackles int default 0,
  interceptions int default 0,
  clean_sheets int default 0,
  distance_covered_km numeric(6,2),
  sprints int default 0,
  source text not null,                 -- 'pixellot' | 'zone14' — always camera source, never manual
  created_at timestamptz default now(),
  unique(player_id, season)
);

-- Matches (camera-generated only)
create table matches (
  id uuid primary key default gen_random_uuid(),
  home_club_id uuid references clubs(id),
  away_club_id uuid references clubs(id),
  slug text unique not null,
  home_score int,
  away_score int,
  competition text,
  match_date date not null,
  venue text,
  video_url text,
  highlights_url text,
  match_report text,
  match_report_ka text,
  camera_source text not null,          -- 'pixellot' | 'zone14'
  external_event_id text,               -- Camera system's event ID for API sync
  created_at timestamptz default now()
);

-- Per-Match Player Stats (camera-generated only)
create table match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  minutes_played int,
  goals int default 0,
  assists int default 0,
  pass_accuracy numeric(5,2),
  shots int default 0,
  shots_on_target int default 0,
  tackles int default 0,
  interceptions int default 0,
  distance_km numeric(5,2),
  sprints int default 0,
  top_speed_kmh numeric(4,1),
  heat_map_data jsonb,
  rating numeric(3,1),
  source text not null,                 -- 'pixellot' | 'zone14'
  created_at timestamptz default now(),
  unique(match_id, player_id)
);

-- User Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'scout',   -- 'scout' | 'academy_admin'
  full_name text,
  organization text,
  email text,
  phone text,
  club_id uuid references clubs(id),    -- Only for academy_admin role
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contact Requests (scout → player)
create table contact_requests (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references profiles(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  message text not null,
  status text default 'pending',        -- 'pending' | 'approved' | 'rejected'
  responded_at timestamptz,
  responded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Player Shortlists (scout saves players)
create table shortlists (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references profiles(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  notes text,
  created_at timestamptz default now(),
  unique(scout_id, player_id)
);

-- Player Videos (camera-generated highlight clips)
create table player_videos (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  match_id uuid references matches(id),
  title text not null,
  url text not null,
  video_type text default 'highlight',  -- 'highlight' | 'full_match' | 'training'
  duration_seconds int,
  created_at timestamptz default now()
);

-- Transfer Requests (club → club player transfers)
create table transfer_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  from_club_id uuid references clubs(id),
  to_club_id uuid references clubs(id),
  status text default 'pending',        -- 'pending' | 'accepted' | 'declined' | 'expired'
  requested_at timestamptz default now(),
  resolved_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days')
);
```

### Indexes

```sql
create index idx_players_club on players(club_id);
create index idx_players_position on players(position);
create index idx_players_slug on players(slug);
create index idx_players_platform_id on players(platform_id);
create index idx_players_status on players(status);
create index idx_player_club_history_player on player_club_history(player_id);
create index idx_matches_date on matches(match_date desc);
create index idx_match_stats_player on match_player_stats(player_id);
create index idx_contact_requests_scout on contact_requests(scout_id);
create index idx_contact_requests_player on contact_requests(player_id);
create index idx_shortlists_scout on shortlists(scout_id);
create index idx_transfer_requests_from on transfer_requests(from_club_id);
create index idx_transfer_requests_to on transfer_requests(to_club_id);
```

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
- Claim a free agent who was released from another club without going through a transfer request (7-day timeout then auto-release)

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
- Stats display a "verified" indicator with the camera source (zone14/Pixellot)
- Player profile info (bio, photo, physical attributes) shows as "club submitted"
- Matches, match stats, highlights, and player videos are created exclusively by camera API integration

---

## Transfer System

### Registration

- Club admin registers a player with required fields (first_name, last_name, date_of_birth, position)
- System auto-generates a unique platform_id (format: GFP-XXXXX)
- A player_club_history row is inserted with joined_at as today

### Transfer Flow

1. New club admin searches for a player by platform_id or name
2. If player is **active** at another club: sends a transfer request (inserts into transfer_requests with status 'pending')
3. Old club admin sees incoming requests in their dashboard
4. Old club admin **accepts** → player.club_id changes to new club, player_club_history updated (old row gets left_at, new row inserted), transfer_requests.status set to 'accepted'
5. Old club admin **declines** → transfer_requests.status set to 'declined', nothing changes on player
6. If **7 days pass** with no response → transfer_requests.status set to 'expired', player.club_id set to null, player.status set to 'free_agent'
7. If player is already **free_agent**: new club admin can claim them directly (set player.club_id, insert player_club_history row)

### Release Flow

- Club admin clicks "Release Player"
- Confirmation dialog required
- player.club_id set to null, player.status set to 'free_agent'
- player_club_history current row gets left_at set to today

### Player Career History

- player_club_history tracks every club a player has been part of with dates
- Player profile page shows a career timeline (club name + joined/left dates)
- All match stats persist across transfers (linked to player_id, not club_id)
- Scouts see the full career arc — this is a key selling point

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
4. Protected routes (`/dashboard/*`, `/admin/*`) check session in their `layout.tsx`
5. Admin routes additionally verify `role === 'academy_admin'`
6. API routes validate session via `createServerClient` from `@supabase/ssr`

### Auth Implementation Pattern

```typescript
// Server component auth check pattern:
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'academy_admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
```

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

**Critical rule:** Never hardcode English or Georgian text in components. Always use `t()`. When adding new UI text, add both `en` and `ka` translations.

---

## Camera Integration (Phase 5)

Camera partner is TBD (zone14 or Pixellot — both in discussion). The architecture is camera-agnostic.

### How It Works

1. Camera system records matches at partner academies
2. After match processing, camera sends data via webhook to `/api/camera/webhook`
3. Webhook triggers data sync: pull match video, individual player stats, highlights
4. Data maps to our `matches`, `match_player_stats`, and `player_videos` tables
5. Player identification via jersey number recognition → mapped to our player records via `jersey_number` + `club_id`

### Camera Client (`src/lib/camera/`)

- `client.ts` — Authenticated API client (abstract, works with zone14 or Pixellot)
- `types.ts` — TypeScript types for camera API responses
- `sync.ts` — Functions that transform camera data → our DB schema

### Mapping Logic

```
Camera Event → matches (one row per event)
Camera Player Stats → match_player_stats (one row per player per match)
Camera Highlights → player_videos (auto-generated clips)
Camera Season Aggregates → player_season_stats (periodic sync)
```

### Important Notes

- Player matching: `jersey_number` + `club_id` → our `players.jersey_number` + `players.club_id`
- If a player can't be matched, log a warning and skip (don't crash the sync)
- All camera data has `source` field set to 'zone14' or 'pixellot'
- Do NOT build mock camera integration — use real API types but gate behind feature flag until API credentials are available

---

## Styling System

### Theme

- Dark theme (football pitch aesthetic)
- CSS custom properties in `globals.css` for colors
- Primary accent: emerald green
- Position-specific colors: GK=amber, DEF=blue, MID=cyan, ATT=purple, WNG=emerald, ST=red

### Conventions

- Use Tailwind utilities for layout and spacing
- Use CSS custom properties for theme colors
- Use `globals.css` component classes for repeated patterns (`.btn-primary`, `.card`, etc.)
- Check `globals.css` before creating new component classes — most patterns exist
- Mobile-first responsive design — all pages must work at 375px+
- Use `next/image` for all images (player photos, club logos)

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

The project should be built in this exact order. Complete each phase before moving to the next.

### Phase 1: Foundation (Week 1-2)

Set up the project skeleton with auth working end-to-end.

- [x] Initialize Next.js 15 with TypeScript + Tailwind CSS v4
- [x] Set up Supabase project (remote + local dev)
- [x] Create database migrations for all tables above
- [x] Implement Supabase Auth (register, login, logout, session refresh)
- [x] Create `profiles` trigger (auto-create profile on signup)
- [x] Set up middleware for session management
- [x] Create RLS policies for all tables
- [x] Set up seed data (3 clubs, 12 players, 5 matches — port from current MVP)
- [x] Build root layout with Navbar + Footer + LanguageContext
- [x] Deploy skeleton to Vercel with env vars configured

### Phase 2: Public Pages (Week 3-4)

The pages scouts see. These must be excellent — they're the product.

- [x] Home page: hero, platform stats, featured players, recent matches
- [x] Player directory: server-side filtered list with search, position/age/club/foot filters
- [x] Player profile: full stats, radar chart, season history, videos, scouting report
- [x] Match library: filterable match list
- [x] Match detail: score, report, player stats table, video embed
- [x] Club listing + club detail with squad
- [x] About page
- [x] 404 page
- [x] SEO: dynamic metadata, Open Graph images, structured data for player pages
- [ ] Mobile responsive testing on all public pages

### Phase 3: Scout Features (Week 5-6)

The features that make scouts come back.

- [x] Scout registration + login flow (no approval needed)
- [x] Scout dashboard (home, activity feed)
- [x] Shortlist: add/remove players, private notes
- [x] Contact request: form on player profile → sends to academy admin (active players only)
- [x] Contact disabled message for free_agent players
- [x] Request status tracking (pending/approved/rejected)
- [x] Player comparison tool (side-by-side stats)

### Phase 4: Academy Admin Panel (Week 7-8)

How academies manage their data. **No match/stats management — camera only.**

- [x] Admin layout with sidebar navigation
- [x] Player management: list, add new, edit profile (scoped to own club, profile fields only)
- [x] Player registration form (first_name, last_name, DOB, position required; photo, height, weight, preferred_foot, parent_guardian_contact optional)
- [x] Auto-generate platform_id on player registration
- [x] Release player button with confirmation
- [x] Incoming contact requests: view, approve, reject
- [x] Basic stats dashboard (how many scouts viewed your players)
- [ ] Academy admin invitation flow (platform admin sends invite)
- [x] Transfer system: search players by platform_id or name
- [x] Transfer system: send transfer request for active players at other clubs
- [x] Transfer system: claim free agent players directly
- [x] Transfer system: incoming transfer requests — accept or decline
- [x] Transfer system: outgoing transfer requests — view status

### Phase 4.5: Database Migration for Permissions & Transfers

Run before implementing Phase 4 transfer features.

- [x] Add players.platform_id (unique, format GFP-XXXXX)
- [x] Add players.parent_guardian_contact (nullable)
- [x] Change players.status to only allow 'active' | 'free_agent'
- [x] Create player_club_history table
- [x] Create transfer_requests table
- [x] Update RLS: remove club admin INSERT/UPDATE on matches, match_player_stats, player_season_stats, player_skills, player_videos
- [x] Update seed data with platform_id, status, and player_club_history rows

### Phase 5: Camera Integration (Week 9-10)

Connect camera data to the platform. Camera partner TBD (zone14 or Pixellot).

- [ ] Camera API client with authentication (zone14 or Pixellot)
- [ ] Webhook endpoint to receive match completion events
- [ ] Data sync: transform camera stats → our schema
- [ ] Player matching logic (jersey number + club)
- [ ] Display verified camera stats on player profiles and match pages
- [ ] "Verified by [camera source]" badge on all camera-generated data
- [ ] Auto-generated highlight clips on player profiles
- [ ] Manual sync trigger for admin (in case webhook fails)

### Phase 6: Polish & Launch (Week 11-12)

- [ ] Performance optimization (lazy loading, image optimization, caching)
- [x] Error boundaries and loading states on all pages
- [ ] Email notifications (contact request received, request status update, transfer request received)
- [ ] Analytics (basic page views, popular players, scout activity)
- [ ] Final mobile testing
- [ ] Production deployment + custom domain

---

## Environment Variables

```bash
# .env.local (NEVER commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key     # Server-only, never expose to client

# Camera API (add when partnership is confirmed — zone14 or Pixellot)
CAMERA_API_URL=
CAMERA_API_KEY=
CAMERA_WEBHOOK_SECRET=

# Optional
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Security rules:**

- `NEXT_PUBLIC_*` vars are exposed to the browser — only Supabase URL and anon key should be public
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use ONLY in API routes and server actions, NEVER in client components
- `CAMERA_*` vars are server-only — used in `/api/camera/*` routes only

---

## Critical Rules — Do NOT

### Architecture

- **Do not create a separate backend** (Express, Fastify, etc.) — Next.js API routes handle server-side logic
- **Do not use an ORM** (Prisma, Drizzle) — use Supabase client directly with generated types
- **Do not install state management libraries** (Redux, Zustand, Jotai) — React Context + hooks + URL params are sufficient
- **Do not add CSS frameworks or component libraries** (Chakra, MUI, shadcn) — use Tailwind + custom components in `globals.css`

### Data and Permissions

- **Do not allow manual stats entry by anyone** — all stats come from camera API only
- **Do not let club admins add/edit matches** — matches come from camera system
- **Do not let club admins edit player stats, skills, or videos** — camera data only
- **Do not expose service role key to client** — only use in server-side code
- **Do not skip RLS policies** — every table must have policies
- **Do not show parent_guardian_contact to scouts or publicly** — internal use only
- **Do not delete player data when they leave a club** — set status to free_agent, preserve history
- **Do not hardcode demo data in components** — all data comes from Supabase queries (seed.sql for dev)

### i18n

- **Do not hardcode strings** — every user-facing string uses `t('key')` from `useLang()`
- **Do not add English text without adding Georgian** — both translations must exist
- **Do not translate slugs** — URLs are always English (`/players/vakhtang-salia`, not `/მოთამაშეები/ვახტანგ-სალია`)

### Code Quality

- **Do not use `any` type** — always define proper TypeScript types
- **Do not skip error handling on Supabase calls** — always check `.error` before using `.data`
- **Do not use `useEffect` for data that can be fetched in server components** — prefer server-side data fetching
- **Do not create files without the `.ts` or `.tsx` extension** — no `.js`/`.jsx`

### Scope

- **Do not build payment/subscription system** — not in MVP scope
- **Do not build a mobile app** — responsive web only
- **Do not build real-time chat between scouts and academies** — contact requests are async
- **Do not build AI-powered scouting recommendations** — future feature, not MVP
- **Do not build platform admin role** — not in MVP scope, manage directly in Supabase dashboard
- **Do not build auto-expiry cron for transfer requests** — will add later
