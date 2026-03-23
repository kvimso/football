# Platform Pivot — Design Spec

**Date:** 2026-03-24
**Status:** Approved (pending implementation)
**Context:** Starlive/Pixellot cannot provide an API at this time. They will provide JSON links to their platform instead. ~70% of built features depend on API data and must be temporarily disabled.

---

## Summary

Pivot the platform from a full scouting data tool to a league portal + demo-driven sales funnel. Strip data-dependent routes (players, matches, watchlist), add a leagues page linking to Starlive, a demo request form for lead capture, and an approval gate so scouts must go through a demo call before accessing platform features.

All removed code is preserved on a `full-platform-backup` branch. When Starlive provides API access, merge the backup to re-enable everything.

---

## 1. Route Changes

### Routes to Remove

Delete these route folders from `src/app/` (backup branch preserves them):

| Route folder | Reason |
|---|---|
| `src/app/(platform)/players/` | Player directory, profiles, compare — needs stats data |
| `src/app/(platform)/matches/` | Match library, detail — needs match data from API |
| `src/app/dashboard/watchlist/` | Watchlist — useless without player data to track |
| `src/app/dashboard/requests/` | Legacy contact requests — orphaned without player context |
| `src/app/dashboard/notifications/` | Notifications — mostly player/watchlist activity, not useful |
| `src/app/api/players/ai-search/` | AI search — needs data in database |

**Keep** `src/app/api/players/search/` — still used by chat `PlayerSearchModal` for player reference embeds. Also keep `api/players/route.ts`, `api/players/[id]/route.ts`, and `api/players/[id]/pdf/route.ts` — used by admin panel player management.

### Routes Kept As-Is (No Changes)

| Route | Reason |
|---|---|
| `src/app/platform/` | Entire platform admin including `/camera/*` — dead weight costs nothing, ready for API |
| `src/app/(platform)/clubs/` | Club listing + detail — basic club info is still valid |
| `src/app/admin/` | Academy admin — messages, players, transfers |
| `src/app/dashboard/messages/` | Scout messaging — still works |

### New Routes

| Route | Route group | Auth required | Purpose |
|---|---|---|---|
| `/leagues` | `(shared)/` | No | Public league cards linking to Starlive |
| `/demo` | `(shared)/` | No | Demo request form (lead capture) |
| `/privacy` | `(shared)/` | No | Privacy policy (bilingual) |
| `/terms` | `(shared)/` | No | Terms of service (bilingual) |
| `/pending` | `(auth)/` | Yes (unapproved only) | Approval waiting room |
| `/platform/leagues` | `platform/` | Yes (platform_admin) | League CRUD + JSON import |
| `/platform/demo-requests` | `platform/` | Yes (platform_admin) | Demo request management |

### Components to Update (Dead Link Fixes)

These components link to removed routes and must be patched:

| Component | Issue | Fix |
|---|---|---|
| `PlayerCard.tsx` | Links to `/players/${slug}` — used on club detail pages | Remove `<Link>` wrapper, make card non-clickable. Add tooltip: "Player profiles coming soon" |
| `PlayerRefCard.tsx` (chat) | Links to `/players/${slug}` in message embeds | Make display-only — show player info inline, remove link |
| `DashboardSidebar.tsx` | Links to `/dashboard/watchlist` and `/players/compare` | Rewrite sidebar: remove Watchlist and Compare links, keep only Home and Messages |
| `dashboard/layout.tsx` | Queries `watchlist` table for sidebar count | Remove watchlist query, simplify layout to only pass unread message count |
| `LandingNav.tsx` | Authenticated CTA links to `/players` ("Browse Players") | Change to `/leagues` with text "Explore Leagues" |
| `Navbar.tsx` | Links to `/players`, `/matches`, `/dashboard/watchlist` | Full nav rewrite per Section 5 |
| `Footer.tsx` | Links to `/players`, `/matches`, `/dashboard` | Full footer rewrite per Section 5 |
| `AboutContent.tsx` | "Browse Players" CTA links to `/players` | Change to `/leagues` with "Explore Leagues" |
| `ChatInbox.tsx` | Empty state CTA links to `/players` | Change to `/leagues` with "Explore Leagues" |
| `ChatEmptyState.tsx` | Empty state CTA links to `/players` | Change to `/leagues` with "Explore Leagues" |
| `NotificationDropdown.tsx` | "View All" links to `/dashboard/notifications` (removed) | Remove `NotificationBell` from Navbar entirely — most notification sources (player views, watchlist) are removed; messages have their own unread badge |

### Components Untouched

All other files in `/components/player/`, `/components/match/`, hooks, and lib stay in the codebase. They add zero bytes to the production build since no remaining route imports them. They'll be re-imported when the backup branch is merged.

---

## 2. Database Changes

### 2a. New Table: `leagues`

```sql
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ka text not null,
  age_group text not null,       -- 'U15', 'U17', 'U19'
  season text not null,          -- '2025-26'
  starlive_url text not null,
  description text,
  description_ka text,
  logo_url text,
  is_active boolean default true,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leagues_active on leagues(is_active, display_order);
```

**RLS:**
- Public SELECT where `is_active = true`
- Platform admin INSERT/UPDATE/DELETE

**Seed data:** 3 Golden Leagues (U15, U17, U19) with placeholder Starlive URLs.

### 2b. New Table: `demo_requests`

```sql
create table demo_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),  -- nullable: anonymous submissions have null
  full_name text not null,
  email text not null,
  organization text not null,
  role text not null,
  country text not null,
  message text,
  status text default 'new',    -- 'new' | 'contacted' | 'demo_done' | 'converted' | 'declined'
  created_at timestamptz default now()
);
```

**RLS:**
- No RLS policies needed — all access via server actions using service role client
- Server action handles anonymous INSERT (no auth required on the form)
- Platform admin reads/updates via service role client (`getPlatformAdminContext()`)
- No direct client-side access to this table (prevents spam via anon key)

**Registration backfill:** Runs in the auth callback route (`src/app/(auth)/callback/route.ts`) after email confirmation. Query `demo_requests` where `lower(email) = lower(user_email)` and `user_id IS NULL`. If found, update `user_id` to the newly created user. Case-insensitive matching prevents mismatches between form input and Supabase Auth's normalized email.

### 2c. Alter Table: `profiles`

```sql
alter table profiles add column is_approved boolean default false;

-- Set all existing users as approved (prevent lockout)
update profiles set is_approved = true;
```

- New self-registered scouts: `is_approved = false` by default
- Academy admins invited by platform admin: `is_approved = true` on creation
- Existing users: migration sets `is_approved = true`

---

## 3. Auth Approval Gate

### Middleware Logic (`src/middleware.ts`)

1. Session refresh (existing behavior)
2. Public routes pass through (no auth required): `/`, `/leagues`, `/about`, `/contact`, `/demo`, `/privacy`, `/terms`, `/login`, `/register`
3. All other routes require authentication — if no session, redirect to `/login`
4. `/pending` requires authentication but NOT approval — pass through for authenticated users
5. Authenticated user on any protected route (except `/pending`): fetch `is_approved` from profiles
6. `is_approved = false` → redirect to `/pending`
7. `is_approved = true` → pass through to protected route
8. Academy admins have `is_approved = true` on invite — they skip the demo flow

**Middleware restructuring note:** The current middleware only queries `profiles` inside the role-scoped path block (`/dashboard`, `/admin`, `/platform`). The `is_approved` check must run for ALL authenticated protected routes (including `/clubs`). This means the profile query (`select('role, is_approved')`) must move BEFORE the role-scoped block so it runs on every protected request.

**Performance note:** The `is_approved` check adds one Supabase query per protected route request. Acceptable for current scale. If needed later, cache `is_approved` in a cookie or JWT custom claim.

**Auth callback update:** Change default redirect from `/dashboard` to `/pending` for new users. The `/pending` page handles the redirect to `/dashboard` if already approved (state 3). This avoids a double-redirect for new scouts.

### `/pending` Page

Located in `(auth)/` route group (uses LandingNav).

**Three states:**
1. **No demo request:** "Your account is pending approval. Request a demo to get started." + link to `/demo`
2. **Demo requested:** Status display — "Demo requested — we'll contact you within 24 hours" (or "Demo scheduled", "Demo completed — approval in progress" based on status)
3. **Already approved:** Redirect to `/dashboard`

**Auto-refresh:** Poll `is_approved` every 30 seconds + check on visibility change (tab focus). When admin approves, scout gets redirected without manual refresh.

**Logout button** visible on the page.

### Platform Admin Approval

In `/platform/scouts`:
- "Approve" / "Revoke" toggle per scout
- Pending vs approved count at top of list
- Filter by approval status
- Bulk approve (select multiple → approve)

---

## 4. New Pages

### 4a. `/leagues` — Public League Cards

- Server component in `(shared)/` route group
- Fetches active leagues ordered by `display_order`
- Bilingual title: "Georgian Youth Leagues" / "საქართველოს ახალგაზრდული ლიგები"
- Bilingual subtitle about Starlive partnership
- Responsive grid: 3 columns desktop, stack on mobile

**LeagueCard component** (reusable — shared between `/leagues` and dashboard):
- Age group badge (color-coded: U15 green, U17 gold, U19 blue)
- League name (bilingual)
- Season
- Short description (bilingual)
- "View on Starlive" link
- Entire card is clickable → `target="_blank" rel="noopener noreferrer"`

### 4b. `/demo` — Demo Request Form

- Server component in `(shared)/` route group
- Split layout: value prop left, form right (stack on mobile)

**Left side (value prop):**
- Headline: "See Georgian Talent Up Close" (bilingual)
- Benefits list: platform walkthrough, league analytics, direct messaging, custom pricing
- Pricing ranges (display only):
  - Club packages from EUR 1,990/year
  - Individual scout access from EUR 490/year
  - Georgian academies from EUR 350/month
- Partner logos: Starlive/Pixellot

**Right side (form):**
- Full name (required)
- Email (required)
- Organization / Club name (required)
- Role: dropdown — Scout, Club Sporting Director, Agent, Academy Director, Other
- Country (required)
- Message (optional textarea)
- "Request Demo" submit button

**Submit behavior:**
- Server action using service role client (anonymous INSERT allowed)
- If user is logged in: auto-fill email, attach `user_id`
- Zod validation on all required fields
- Success state replaces form with confirmation: "Thank you! We'll be in touch within 24 hours to schedule your demo."

### 4c. `/privacy` and `/terms` — Legal Pages

- Server components in `(shared)/` route group
- Bilingual content (EN/KA toggle)
- Content provided separately in Session 4
- Footer links to both pages

### 4d. Dashboard — Simplified Hub

Scout dashboard at `/dashboard` becomes a lightweight hub:

1. **Welcome card** with scout's name
2. **Unread messages** count + link to `/dashboard/messages`
3. **League cards** — reuse `LeagueCard` component (same 3 cards as `/leagues`)
4. **Demo request status** — if the scout has submitted a demo request, show current status
5. **"New here?" guide** — collapsible first-time user onboarding tips

**Removed:** watchlist panel, stat summaries, player activity feed, popular players.

---

## 5. Navigation Changes

### LandingNav (landing page only)

Links: `Leagues | About | Contact | Request Demo | Login`

If authenticated: replace Login with "Browse Platform" or avatar.

### Navbar (all other pages)

**Logged out:**
`Leagues | About | Contact | Request Demo | Login`

**Logged in — unapproved scout:**
`Leagues | Request Demo | [User menu]`

**Logged in — approved scout:**
`Leagues | Messages | [User menu]`

**Logged in — academy admin:**
`Leagues | Messages | Admin | [User menu]`

**Logged in — platform admin:**
`Leagues | [User menu]` (platform admin accesses `/platform` via user menu)

### Footer

`About | Contact | Privacy Policy | Terms of Service | Request Demo`

### Removed from All Navigation

Players, Matches, Dashboard (direct link), Watchlist/Shortlist, Compare.

### Clubs Discovery

Club routes (`/clubs`, `/clubs/[slug]`) remain accessible but are NOT in primary navigation. Scouts discover clubs through leagues (Starlive links) or messaging. Clubs are behind auth + approval (in `(platform)/` route group) — this is intentional: club detail pages with "Message Academy" buttons are a premium feature.

### Redirect for Removed Routes

Add a catch-all `not-found.tsx` in `(platform)/` that redirects `/players/*` and `/matches/*` to `/leagues`. This handles bookmarked URLs from existing users gracefully.

---

## 6. Landing Page Redesign

Update existing landing page components (not a full rebuild):

### Keep (update copy)
- **Hero:** New headline reflecting portal model. Primary CTA "Request Demo" → `/demo`. Secondary CTA "Explore Leagues" → `/leagues`
- **Social proof:** Keep as-is (37,600+ youth players, EUR 100M+ transfers)
- **Partners:** Keep Starlive/Pixellot logos

### Update
- **How it Works:** Simplify to 3 steps:
  1. Browse Georgian youth leagues
  2. Explore player analytics on Starlive (powered by Pixellot cameras)
  3. Connect directly with academies (messaging system)
- **Audience Panels:** Update "For Scouts" and "For Academies" copy for portal model
- **CTA Banner:** "Request Demo" instead of "Register"

### Remove
- Any mention of: AI search, advanced filters, player comparison, radar charts, watchlist, scouting reports, PDF export

---

## 7. Platform Admin Additions

### `/platform/leagues` — League CRUD

- Table view: all leagues (active + inactive)
- Add/edit form: name, name_ka, age_group, season, starlive_url, description, description_ka, logo_url, is_active, display_order
- Inline active/inactive toggle
- JSON import: admin pastes raw JSON from Starlive → parse and upsert leagues
- Delete with confirmation

### `/platform/demo-requests` — Demo Request Management

- Table: name, organization, role, country, date, status
- Click row to expand full details + message
- Status dropdown: new → contacted → demo_done → converted / declined
- **Approve Account shortcut:** When a demo request has `user_id` and status is `converted`, show an "Approve Account" button that toggles `is_approved` on their profile — two clicks instead of navigating to `/platform/scouts`
- Counter badge in platform sidebar: "X new requests"

### `/platform/scouts` Updates

- Approve / Revoke toggle per scout (uses admin client — service role bypasses RLS)
- Pending vs approved count at top
- Filter by approval status
- Bulk approve (select multiple → approve)

### Platform Sidebar Navigation

Add: `Leagues | Demo Requests`

---

## 8. Build Order

### Session 1: Backup + Strip Routes + Approval Gate

1. Create + push `full-platform-backup` branch
2. Remove route folders: `(platform)/players/`, `(platform)/matches/`, `dashboard/watchlist/`, `dashboard/requests/`, `dashboard/notifications/`, `api/players/ai-search/`
3. Fix dead links: patch `PlayerCard` (non-clickable), `PlayerRefCard` (display-only), `DashboardSidebar` (remove watchlist/compare links), `dashboard/layout.tsx` (remove watchlist query), `LandingNav` (change `/players` to `/leagues`), `AboutContent` (change `/players` CTA), `ChatInbox`/`ChatEmptyState` (change empty state CTAs), remove `NotificationBell` from Navbar
4. Stub `dashboard/page.tsx` with minimal placeholder (full rewrite happens in Session 4 — this prevents broken imports between sessions)
5. Add catch-all redirect in `(platform)/` for bookmarked `/players/*` and `/matches/*` URLs
6. **Verify build is clean** — fix any broken imports before adding new code
7. Migration: add `is_approved` to profiles (default false, set true for existing users)
8. Restructure middleware: move profile query before role-scoped block, add `is_approved` check, redirect unapproved to `/pending`
9. Update auth callback: default redirect to `/pending` for new users
10. Build `/pending` page with auto-polling (30s interval + visibility change)

### Session 2: Leagues + Navigation

1. Migration: create `leagues` table + RLS + seed 3 Golden Leagues
2. Build `LeagueCard` component (reusable)
3. Build `/leagues` page in `(shared)/`
4. Build `/platform/leagues` CRUD + JSON import
5. Update Navbar: remove Players/Matches, add Leagues, approval-aware scout nav
6. Update LandingNav: new links
7. Update Footer: add Privacy/Terms placeholders, Request Demo

### Session 3: Demo Requests + Landing Redesign

1. Migration: create `demo_requests` table (nullable `user_id`, no RLS — accessed via service role only)
2. Auth callback backfill: on email confirmation, match `lower(email)` against `demo_requests` where `user_id IS NULL`, link account
3. Build `/demo` page (value prop + form + Zod validation, server action with service role)
4. Build `/platform/demo-requests` management (with "Approve Account" shortcut)
5. Link demo request status to `/pending` page
6. Redesign landing page (hero CTAs, How it Works, audience panels, remove hidden feature refs)
7. Update platform sidebar (add Leagues + Demo Requests)

### Session 4: Privacy/Terms + Dashboard + Polish

1. Build `/privacy` and `/terms` pages (content provided separately)
2. Add "I agree to Terms" checkbox on register page
3. Rewrite scout dashboard page (full rewrite of `DashboardHome` — old component has watchlist/stats/activity that are all removed; new component: messages count + league cards + demo status + new user guide)
4. Update `/platform/scouts` (approve/revoke toggle, counts, bulk approve)
5. Final responsive testing
6. Deploy to Vercel

---

## 9. Deferred Features (Restore When API Comes)

All code preserved in `full-platform-backup` branch:

- Player profiles, stats, radar charts
- Player comparison tool, advanced filters
- AI Search (spec ready)
- Watchlist with notifications
- Scouting Report Builder
- Video Event Tagging
- Player DNA
- League-Wide Analytics
- Scout Demand Signals

When Starlive provides API access: merge the backup branch, re-enable routes, resume Phase 7 camera integration.
