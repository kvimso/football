---
title: "Platform Pivot Session 2: Leagues + Navigation"
type: feat
status: completed
date: 2026-03-24
origin: docs/superpowers/specs/2026-03-24-platform-pivot-design.md
---

# Platform Pivot Session 2: Leagues + Navigation

## Enhancement Summary

**Deepened on:** 2026-03-24
**Research agents used:** architecture-strategist, security-sentinel, data-integrity-guardian, performance-oracle, code-simplicity-reviewer, pattern-recognition-specialist, kieran-typescript-reviewer, julik-frontend-races-reviewer, deployment-verification-agent, best-practices-researcher, framework-docs-researcher

### Key Improvements from Research

1. **CRITICAL — Missing UNIQUE constraint**: `(name, age_group, season)` UNIQUE is mandatory — without it, Supabase `.upsert()` fails at runtime with "no unique or exclusion constraint matching the ON CONFLICT specification"
2. **CRITICAL — Root layout must pass `initialIsApproved`**: AuthContext extension requires root layout to query `is_approved` server-side and pass as initial prop. Without this, every page load flashes wrong nav state for 100-200ms
3. **CRITICAL — `onAuthStateChange` must fetch `is_approved`**: Current listener only queries `role`. Must update to `.select('role, is_approved')` for context to stay fresh
4. **CRITICAL — `router.refresh()` in PendingPolling**: After approval redirect, must call `router.refresh()` so root layout re-fetches profile and hydrates AuthProvider with `isApproved: true`
5. **Security fix — HTTPS enforcement in Zod**: `z.string().url()` accepts `http://`. Add `.refine(url => url.startsWith('https://'))` at schema level, not just render time
6. **Data integrity — Missing `updated_at` trigger**: Every other table has it via `update_updated_at_column()`. Leagues table must too
7. **Data integrity — Seed data belongs in `seed.sql`**: Not in the migration. Migrations run in production; seed data should not
8. **Pattern fix — Server actions take typed objects, not FormData**: Existing pattern passes `z.infer<typeof schema>`, not raw FormData
9. **Simplification — Cut JSON import**: YAGNI for 3 leagues. Manual CRUD suffices. Defer to future session if ever needed
10. **Simplification — Replace privacy/terms stubs with redirects**: `next.config.ts` redirects to `/contact` are 2 lines vs 2 new page files
11. **Accessibility fix — Use `sr-only` span, not `aria-label`**: `aria-label` replaces link text for screen readers. Use `<span className="sr-only">(opens in new tab)</span>` inside the link instead

### New Considerations Discovered

- Active toggle must be **idempotent** (send target state, not `NOT is_active` toggle) to prevent double-click race
- `isApproved` should be `boolean` (not `boolean | null`) — middleware defaults to `false`, null has no semantic meaning
- Create dedicated age-group color tokens (`--age-u15`, etc.) instead of reusing position tokens (semantic mismatch)
- `age_group` should use `z.enum` from const array in `constants.ts` (single source of truth pattern)
- Add `CHECK` constraint on `age_group` and `season` format in migration
- Add `REVOKE INSERT, UPDATE, DELETE ON leagues FROM authenticated` (belt-and-suspenders with RLS)
- RLS policies should use `(SELECT auth.uid())` pattern for performance (caches per-query, not per-row)
- Use `title.template` in layout metadata for consistent site name suffix
- Deployment order: migration MUST run before code deploy (inert table is harmless; code without table = 500)

---

## Overview

Session 2 of the platform pivot: create the `leagues` table, build the public `/leagues` page with reusable `LeagueCard` component, build platform admin league CRUD with JSON import, overhaul all navigation components (Navbar, LandingNav, Footer) with approval-aware logic, and create stub pages for `/privacy` and `/terms`.

This session builds the primary content layer that replaces the stripped player/match routes from Session 1.

## Problem Statement / Motivation

After Session 1 stripped data-dependent routes, the platform has minimal browsable content — only clubs remain. Scouts need something to explore (leagues linking to Starlive), navigation must reflect the new route structure, and the approval gate needs to be surfaced in nav state (unapproved scouts see different links than approved ones). The footer needs legal page links (Privacy/Terms) for compliance readiness.

## Proposed Solution

1. Create `leagues` table with RLS, seed 3 Georgian Golden Leagues
2. Build `LeagueCard` component (reusable across `/leagues` and dashboard)
3. Build `/leagues` as a public page in `(shared)/` route group
4. Build `/platform/leagues` CRUD following the existing `/platform/clubs` pattern + JSON import
5. Rewrite Navbar with 5 auth/approval states
6. Update LandingNav with new link structure
7. Rewrite Footer with legal + demo links
8. Create `/privacy` and `/terms` stub pages in `(shared)/`
9. Update redirects and cross-references from Session 1
10. Create `/demo` stub page to prevent 404 between sessions

## SpecFlow Analysis — Key Findings Incorporated

The following gaps were identified by SpecFlow analysis and incorporated into the plan:

1. **`/demo` stub page (CRITICAL):** "Request Demo" links appear in Session 2 nav but `/demo` is built in Session 3. If deployed between sessions, users get a 404 on the primary CTA. **Fix:** Create a stub page (like privacy/terms) with "Demo request form coming soon. Contact us at info@gft.ge."
2. **`showInfoLinks` prop removal:** Current Navbar uses a prop to show About/Contact. The 5-state auth logic makes this prop obsolete — link visibility should be auth-state-based, not route-group-based. **Fix:** Remove prop, bake logic into Navbar.
3. **Unread poll skip for unapproved scouts:** Navbar polls `get_total_unread_count` for all non-platform-admin users. Unapproved scouts don't see Messages but the poll still runs. **Fix:** Skip poll when `!isApproved && role === 'scout'`.
4. **CSP for external league logos:** If `logo_url` points to an external domain, `img-src` CSP blocks it. **Fix:** Either host logos in Supabase Storage, or add the external domain to CSP. For now, use Supabase Storage URLs or inline SVG placeholders.
5. **Loading states:** Add `loading.tsx` files for `(shared)/leagues/` and `platform/leagues/` route segments.
6. **LeagueCard URL validation:** Validate `starlive_url` starts with `https://` before rendering as a link (prevents `javascript:` URI injection from JSON import).
7. **Unapproved scout nav:** Spec intentionally hides About/Contact for unapproved scouts. They can still visit those pages directly (public routes). This is a deliberate UX decision, not a bug.

## Technical Considerations

### Leagues Table Design

Follows the spec exactly. No slug needed — leagues don't have detail pages (cards link externally to Starlive). `display_order` allows manual sorting. `is_active` allows soft-disable without deletion.

RLS: Public SELECT restricted to `is_active = true`. Platform admin full CRUD via service role client (no RLS policies for writes — same pattern as `demo_requests`). Actually, platform admin pages already use `createAdminClient()` (service role) which bypasses RLS. But adding explicit INSERT/UPDATE/DELETE policies for `platform_admin` role is more defensive — if we ever expose the table to a non-service-role client.

**Decision:** Add explicit platform admin write policies (defense in depth), plus public SELECT for active leagues.

### Navbar Approval-Aware Logic

The current Navbar uses `useAuth()` for `user` and `userRole`. Session 1 added `is_approved` to profiles but the Navbar doesn't yet use it. The Navbar needs a new signal: whether the current scout is approved.

**Approach:** Extend `useAuth()` context to expose `isApproved` (already available from the profile query in AuthProvider). The Navbar then renders different link sets based on `{ user, userRole, isApproved }`.

**Five nav states:**
1. Logged out → `Leagues | About | Contact | Request Demo | Login`
2. Unapproved scout → `Leagues | Request Demo | [User menu]`
3. Approved scout → `Leagues | Messages | [User menu]`
4. Academy admin → `Leagues | Messages | Admin | [User menu]`
5. Platform admin → `Leagues | [User menu]`

### JSON Import for Platform Admin

The platform admin pastes raw JSON from Starlive's system. The server action:
1. Parses JSON (try/catch for malformed input)
2. Validates each entry against a Zod schema
3. Upserts by matching `name + age_group + season` (natural composite key)
4. Returns count of created/updated/failed entries

**Security:** Input is validated server-side via Zod. The platform admin page is behind `getPlatformAdminContext()`. The server action uses service role client. No injection risk — Supabase parameterizes all queries.

### Dead Link Updates from Session 1

Session 1 temporarily pointed several CTAs to `/clubs` as a safe target. Now that `/leagues` exists:
- `next.config.ts` redirects: `/players/:path*` and `/matches/:path*` → change from `/clubs` to `/leagues`
- `LandingNav` authenticated CTA: `/clubs` → `/leagues`
- `AboutContent` CTA: `/clubs` → `/leagues`
- `ChatInbox`/`ChatEmptyState` empty state CTAs: `/clubs` → `/leagues`
- `/pending` page: update description to mention `/demo` (link exists, page built in Session 3)

### Stub Pages for Legal Content

`/privacy` and `/terms` go in `(shared)/` route group (public, Navbar+Footer layout). Session 2 creates minimal stub pages with "Content coming soon" bilingual message. Session 4 fills in the actual legal content.

### Translation Organization

New translation keys go in:
- `landing.ts` — public-facing league strings, demo link text
- `core.ts` — nav link labels, footer labels
- `admin.ts` — platform admin league management strings

New namespace: `leagues.*` for league-specific strings (page title, card labels, empty state, age group names).

---

## Acceptance Criteria

### Task 1: Database Migration — `leagues` Table + RLS + Seed

**Migration file:** `supabase/migrations/20250101000045_create_leagues_table.sql`

#### 1a. Create `leagues` table
- [x] Table with columns: `id` (uuid PK), `name` (text not null), `name_ka` (text not null), `age_group` (text not null), `season` (text not null), `starlive_url` (text not null), `description` (text), `description_ka` (text), `logo_url` (text), `is_active` (boolean default true), `display_order` (int default 0), `created_at` (timestamptz default now()), `updated_at` (timestamptz default now())
- [x] **UNIQUE constraint** (CRITICAL): `UNIQUE (name, age_group, season)` — required for `.upsert()` with `onConflict` to work. Without this, upsert fails at runtime
- [x] **CHECK constraint** on `age_group`: `CHECK (age_group IN ('U13', 'U15', 'U17', 'U19', 'U21', 'Senior'))` — prevents typos and format inconsistency
- [x] **CHECK constraint** on `season` format: `CHECK (season ~ '^\d{4}-\d{2}$')` — enforces `YYYY-YY` format
- [x] **CHECK constraint** on `starlive_url`: `CHECK (starlive_url ~ '^https://')` — enforces HTTPS at database level
- [x] Create index: `idx_leagues_active` on `(is_active, display_order)`

#### 1b. `updated_at` trigger
- [x] Add trigger using existing `update_updated_at_column()` function (from migration 011): `CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON public.leagues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()`
- [x] Without this, `updated_at` always shows insertion timestamp — inconsistent with every other table

#### 1c. RLS policies + GRANT restrictions
- [x] Enable RLS: `ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY`
- [x] Public SELECT: `CREATE POLICY "Public can view active leagues" ON public.leagues FOR SELECT USING (is_active = true)`
- [x] **REVOKE write access** from authenticated role: `REVOKE INSERT, UPDATE, DELETE ON public.leagues FROM authenticated` — prevents any non-service-role writes
- [x] **Note:** Platform admin CRUD uses `createAdminClient()` (service role, bypasses both RLS and GRANTs). No write policies needed — REVOKE is sufficient.
- [x] Use `(SELECT auth.uid())` pattern in policies for performance (caches per-query, not per-row)

#### 1d. Wrap in transaction
- [x] `BEGIN; ... COMMIT;` for atomicity — consistent with migration 044 pattern

#### 1e. Seed 3 Golden Leagues (in `seed.sql`, NOT in migration)
- [x] **Add to `supabase/seed.sql`** — migrations run in production; seed data should not
- [x] UUID pattern: `d1b2c3d4-0001-4000-8000-000000000001` through `...-000000000003`
- [x] U15 Golden League: `name: "Golden League U15"`, `name_ka: "ოქროს ლიგა U15"`, `age_group: "U15"`, `season: "2025-26"`, `starlive_url: "https://starlive.com"` (placeholder), `display_order: 1`
- [x] U17 Golden League: same pattern, `display_order: 2`
- [x] U19 Golden League: same pattern, `display_order: 3`
- [x] All seeded as `is_active: true`

#### 1f. Post-migration
- [x] Run migration via Supabase MCP
- [x] Regenerate types: `npx supabase gen types typescript --local > src/lib/database.types.ts`
- [x] Verify: `SELECT * FROM leagues ORDER BY display_order` — 3 rows returned (if seed was run)
- [x] Verify REVOKE: test `INSERT INTO leagues ...` as authenticated user — should fail with permission denied

### Task 2: Build `LeagueCard` Component

**File:** `src/components/league/LeagueCard.tsx`

- [x] Server component (no interactivity needed — entire card is an external link)
- [x] Typed prop: `league` matching the generated `Database['public']['Tables']['leagues']['Row']` type
- [x] Uses `getServerT()` for server-side translations
- [x] Bilingual: `lang === 'ka' ? league.name_ka : league.name` (same for description)
- [x] **Layout:**
  - Age group badge at top (color-coded via dedicated tokens — see below)
  - League name (bilingual)
  - Season text
  - Short description (bilingual, truncated if long)
  - Logo if `logo_url` exists, otherwise a trophy/shield icon placeholder
  - "View on Starlive" link text at bottom
- [x] Entire card wrapped in `<a href={league.starlive_url} target="_blank" rel="noopener noreferrer">`
- [x] Uses `.card` CSS class from globals.css + hover effect
- [x] External link icon (`aria-hidden="true"`) on the CTA — decorative, screen readers get text instead
- [x] **Accessibility:** Use `<span className="sr-only">(opens in new tab)</span>` inside the link — NOT `aria-label` (which replaces link text for screen readers)
- [x] **URL safety:** Only render as link if `starlive_url` starts with `https://` — otherwise render as non-clickable card with "URL not available" text. (Also enforced at DB level via CHECK constraint)

#### Age group color tokens (add to `globals.css`)
- [x] Create dedicated tokens instead of reusing position colors (semantic mismatch — `pos-gk` means goalkeeper, not U17):
  - `--age-u15` / `--age-u15-bg` — aliased to green (`var(--pos-mid)` / `var(--pos-mid-bg)`)
  - `--age-u17` / `--age-u17-bg` — aliased to gold (`var(--pos-gk)` / `var(--pos-gk-bg)`)
  - `--age-u19` / `--age-u19-bg` — aliased to blue (`var(--pos-st)` / `var(--pos-st-bg)`)
- [x] Add `AGE_GROUP_COLOR_CLASSES` to `constants.ts`: `{ U15: 'bg-age-u15-bg text-age-u15', ... }`
- [x] Badge pattern: `bg-age-X-bg text-age-X` — same as position badges but with correct semantics

### Task 3: Build `/leagues` Public Page

**File:** `src/app/(shared)/leagues/page.tsx`

- [x] Server component in `(shared)/` route group (uses Navbar + Footer layout)
- [x] Metadata export: `title: 'Leagues'` (renders as "Leagues | Georgian Football Talent" via `title.template` in layout — add template if not present)
- [x] Fetch active leagues from Supabase: `.from('leagues').select('*').eq('is_active', true).order('display_order')`
- [x] Uses `getServerT()` for translations
- [x] **Layout:**
  - Page title: "Georgian Youth Leagues" / "საქართველოს ახალგაზრდული ლიგები" (bilingual)
  - Subtitle about Starlive partnership (bilingual)
  - Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` gap-6
  - Each league renders as `<LeagueCard league={league} />`
- [x] **Empty state:** If no active leagues, show "No leagues available yet" with a subtle icon
- [x] **No loading.tsx** — 3-row query resolves in <100ms. Skeleton would flash and disappear, creating visual noise. Add later only if delay is perceptible

### Task 4: League Server Actions + Validation

**Files:**
- `src/app/actions/platform-leagues.ts` — server actions
- `src/lib/validations.ts` — add `leagueFormSchema`

#### 4a. Constants + types (single source of truth)
- [x] Add to `constants.ts`: `export const AGE_GROUPS = ['U13', 'U15', 'U17', 'U19', 'U21', 'Senior'] as const`
- [x] Add to `types.ts`: `export type AgeGroup = (typeof AGE_GROUPS)[number]`
- [x] Add to `types.ts`: `export type LeagueFormInput = z.infer<typeof leagueFormSchema>` (after schema is defined)

#### 4b. Zod validation schema
- [x] Add `leagueFormSchema` to `validations.ts`:
  - `name`: `z.string().min(1).max(200)`
  - `name_ka`: `z.string().min(1).max(200)`
  - `age_group`: `z.enum(AGE_GROUPS)` — uses const array, not free string
  - `season`: `z.string().min(1).max(20).regex(/^\d{4}-\d{2}$/)` — enforces `YYYY-YY` format
  - `starlive_url`: `z.string().url().max(500).refine(url => url.startsWith('https://'), 'URL must use HTTPS')` — HTTPS enforced at schema level, not just render time
  - `description`: `z.string().max(2000).optional()`
  - `description_ka`: `z.string().max(2000).optional()`
  - `logo_url`: `z.string().url().max(500).refine(url => url.includes('.supabase.co/storage/') || url.startsWith('/'), 'Logo must be in platform storage').optional().or(z.literal(''))` — CSP only allows Supabase Storage URLs for images
  - `is_active`: `z.boolean().optional()` (default true)
  - `display_order`: `z.number().int().min(0).optional()` (default 0)

#### 4c. CRUD server actions
- [x] `createLeague(data: LeagueFormInput)` — `getPlatformAdminContext()` → validate → `createAdminClient().from('leagues').insert()` → `revalidatePath('/platform/leagues')` + `revalidatePath('/leagues')`
- [x] `updateLeague(id: string, data: LeagueFormInput)` — same auth + validate → `.update().eq('id', id)` → revalidate
- [x] `deleteLeague(id: string)` — auth → `.delete().eq('id', id)` → revalidate
- [x] **JSON import deferred** — cut for Session 2 (YAGNI: 3 leagues, manual CRUD suffices). Build if/when Starlive provides bulk data
- [x] All actions return `{ error: string }` or `{ success: true }` (follow existing pattern in `platform-clubs.ts`)
- [x] **Server actions take typed objects, not FormData** — `LeagueForm` client component extracts values and passes typed object (matches `ClubForm` pattern)

### Task 5: Build `/platform/leagues` CRUD Pages

**Files:**
- `src/app/platform/leagues/page.tsx` — list view
- `src/app/platform/leagues/new/page.tsx` — create form
- `src/app/platform/leagues/[id]/edit/page.tsx` — edit form
- `src/components/platform/LeagueForm.tsx` — reusable form component

#### 5a. List page (`platform/leagues/page.tsx`)
- [x] Server component, uses `createAdminClient()` to fetch ALL leagues (including inactive — service role bypasses RLS)
- [x] Uses `getServerT()` for translations
- [x] **Layout:**
  - Page title + "Add League" button (links to `/platform/leagues/new`)
  - Table with columns: Name, Age Group, Season, Active (toggle), Display Order, Actions (Edit, Delete)
  - **Active toggle:** Inline `<form>` with `useFormStatus()` to disable during submission. Action must be **idempotent** — send target state (`is_active: true/false`), NOT toggle (`NOT is_active`). Prevents double-click race condition
  - Delete button with confirmation
- [x] Order by `display_order` then `created_at`
- [x] Add `toggleLeagueActive(id: string, isActive: boolean)` server action — sets explicit value, not toggle

#### 5b. LeagueForm component (`components/platform/LeagueForm.tsx`)
- [x] Client component (`'use client'`)
- [x] Optional `league` prop (determines create vs edit mode)
- [x] Fields: name, name_ka, age_group (dropdown populated from `AGE_GROUPS` constant), season, starlive_url, description, description_ka, logo_url, is_active (checkbox), display_order (number input)
- [x] Constructs typed object from form fields, passes to `createLeague(data)` or `updateLeague(id, data)` — NOT raw FormData
- [x] Loading/error states on submit button
- [x] Cancel button → `router.push('/platform/leagues')`
- [x] Uses `.input` CSS class for form fields
- [x] Follow `ClubForm.tsx` pattern exactly

#### 5c. New/Edit pages
- [x] `platform/leagues/new/page.tsx`: minimal server component, renders `<LeagueForm />`
- [x] `platform/leagues/[id]/edit/page.tsx`: fetches league by ID, renders `<LeagueForm league={league} />`, `notFound()` if not found

### Task 6: Update PlatformSidebar

**File:** `src/components/platform/PlatformSidebar.tsx`

- [x] Add "Leagues" link to sidebar: `/platform/leagues` with a trophy/list icon
- [x] Position after "Clubs" in the link order (natural grouping: Clubs → Leagues)
- [x] Add translation key `platform.sidebar.leagues`

### Task 7: `/demo` Stub Page + Privacy/Terms Redirects

#### 7a. `/demo` stub page
**File:** `src/app/(shared)/demo/page.tsx`
- [x] Server component in `(shared)/` route group
- [x] Metadata export: `title: 'Request Demo | Georgian Football Talent'`
- [x] Minimal content: "Demo request form coming soon. Contact us at info@gft.ge to schedule a demo." (bilingual)
- [x] Add translation keys: `demo.title`, `demo.comingSoon`

#### 7b. Privacy/Terms — `next.config.ts` redirects (not stub pages)
- [x] Add to `next.config.ts` `redirects()`: `{ source: '/privacy', destination: '/contact', permanent: false }` and `{ source: '/terms', destination: '/contact', permanent: false }`
- [x] **Rationale:** No legal content exists yet. Redirects are 2 lines vs 2 page files + 4 translation keys. Build real pages in Session 4 when content is ready
- [x] Footer still links to `/privacy` and `/terms` — users are redirected to `/contact` transparently

### Task 8: Navbar Overhaul — Approval-Aware Navigation

**File:** `src/components/layout/Navbar.tsx`

#### 8a. Extend AuthContext with `isApproved` (CRITICAL — 4 agents flagged this)

**File:** `src/context/AuthContext.tsx`
- [x] Add `isApproved: boolean` to `AuthState` interface (use `boolean`, not `boolean | null` — middleware defaults to `false`, null has no semantic meaning)
- [x] Add `initialIsApproved: boolean` to `AuthProvider` props
- [x] Initialize state: `const [isApproved, setIsApproved] = useState(initialIsApproved)`
- [x] Update `useMemo` value to include `isApproved`

**File:** `src/app/layout.tsx` (root layout — server-side initial state)
- [x] Extend profile query from `.select('role')` to `.select('role, is_approved')`
- [x] Pass `initialIsApproved={data?.is_approved ?? false}` to `AuthProvider`
- [x] This eliminates the 100-200ms flash of wrong nav state on every page load

**File:** `src/context/AuthContext.tsx` (onAuthStateChange listener)
- [x] Update `.select('role')` to `.select('role, is_approved')` in the auth state change handler
- [x] Set both `setUserRole` and `setIsApproved` in the same `.then()` callback (React 18 batches these)
- [x] **Note:** `onAuthStateChange` does NOT fire when approval status changes (only on login/logout/token refresh). Server-side initial props from root layout are the authoritative source for `isApproved`

**File:** `src/components/auth/PendingPolling.tsx`
- [x] After approval detected: call `router.refresh()` after `router.push(destination)` — this re-runs the root layout server fetch and hydrates AuthProvider with `isApproved: true`. Without this, Navbar shows stale unapproved-scout links after redirect

#### 8b. Navbar rewrite — boolean flags, not 5-state branches
- [x] Import `isApproved` from `useAuth()`
- [x] Remove `showInfoLinks` prop — link visibility now purely auth-state-based
- [x] **Derive boolean flags** at top of component (cleaner than 5 ternary branches):
  ```
  const showPublicLinks = !user  // About, Contact — only for logged-out
  const showRequestDemo = !user || (userRole === 'scout' && !isApproved)
  const showMessages = user && userRole !== 'platform_admin' && !(userRole === 'scout' && !isApproved)
  const showAdmin = userRole === 'academy_admin'
  ```
- [x] **All states get "Leagues" link** — universal
- [x] **Desktop nav** renders conditionally based on flags above
- [x] **Mobile menu** mirrors desktop flags
- [x] "Request Demo" links to `/demo` (stub page created in Task 7)
- [x] "Leagues" links to `/leagues`
- [x] "Messages" retains role-aware href: `/admin/messages` or `/dashboard/messages`
- [x] "Admin" links to `/admin`
- [x] User menu (AvatarDropdown) unchanged
- [x] **Skip unread message poll** when `!user || userRole === 'platform_admin' || (userRole === 'scout' && !isApproved)` — no Messages link means no badge needed
- [x] Remove the now-unused `/clubs` link from center nav
- [x] **Reference states for testing** (verify each manually in Task 14):
  1. Logged out → Leagues, About, Contact, Request Demo, Login+Register
  2. Unapproved scout → Leagues, Request Demo, [User menu]
  3. Approved scout → Leagues, Messages, [User menu]
  4. Academy admin → Leagues, Messages, Admin, [User menu]
  5. Platform admin → Leagues, [User menu]

#### 8c. Update layouts that pass props to Navbar
- [x] Remove `showInfoLinks` prop from `(shared)/layout.tsx`
- [x] Remove `showInfoLinks` prop from `(platform)/layout.tsx` if present
- [x] Verify all other Navbar consumers — link visibility is now purely auth-state-based

### Task 9: Update LandingNav

**File:** `src/components/landing/LandingNav.tsx`

- [x] **Desktop links:** Replace anchor links (`/#for-scouts`, `/#for-academies`) with: `Leagues (/leagues) | About (/about) | Contact (/contact)`
- [x] **CTA area:**
  - Logged out: "Request Demo" button → `/demo` + "Login" text link → `/login`
  - Logged in: "Browse Platform" button → role-aware dashboard href (same logic as current)
- [x] **Mobile menu:** Same links + Request Demo CTA
- [x] Remove `/#for-scouts` and `/#for-academies` anchor links (landing page sections may still exist but nav doesn't link to them individually)
- [x] Add translation keys: `nav.requestDemo`, `nav.leagues`

### Task 10: Footer Rewrite

**File:** `src/components/layout/Footer.tsx`

- [x] Simplify from 4-column grid to a cleaner layout:
  - **Links row:** `About | Contact | Privacy Policy | Terms of Service | Request Demo`
  - **Brand + copyright** below
  - **Contact info:** `info@gft.ge` + "Tbilisi, Georgia"
- [x] All links bilingual via `t()`
- [x] "Privacy Policy" → `/privacy`, "Terms of Service" → `/terms`
- [x] "Request Demo" → `/demo`
- [x] Remove conditional login/register/dashboard links (Footer shouldn't duplicate nav auth logic)
- [x] Remove the "Clubs" navigation column (clubs not in primary nav anymore)
- [x] Add translation keys: `footer.privacy`, `footer.terms`, `footer.requestDemo`

### Task 11: LandingFooter — DEFERRED

**Rationale:** LandingFooter is functional as-is. It serves a different purpose (marketing/conversion) than the platform Footer. Adding Privacy/Terms links is a 2-line change that can happen when real legal pages exist (Session 4). Do not touch in this session.

### Task 12: Update Cross-References from Session 1

#### 12a. `next.config.ts` redirects
- [x] Change destination from `/clubs` to `/leagues` for both redirects:
  - `/players/:path*` → `/leagues`
  - `/matches/:path*` → `/leagues`

#### 12b. Component CTA updates (Session 1 pointed to `/clubs`, now point to `/leagues`)
- [x] `LandingNav.tsx`: authenticated CTA `/clubs` → `/leagues` (handled in Task 9)
- [x] `AboutContent.tsx`: CTA `/clubs` → `/leagues`, text "Explore Clubs" → "Explore Leagues"
- [x] `ChatInbox.tsx`: empty state CTA `/clubs` → `/leagues`
- [x] `ChatEmptyState.tsx`: empty state CTA `/clubs` → `/leagues`
- [x] Update translation keys: `nav.exploreClubs` → `nav.exploreLeagues` (or add new key)

#### 12c. Pending page update
- [x] Update `auth.pendingDescription` translation to mention `/demo` page: "Request a demo to get started" with link
- [x] In `PendingPolling.tsx`: change email contact CTA to a `/demo` link (page built in Session 3, but link is better than email for conversion)
- [x] **Fallback:** If concerned about 404, keep email as secondary: "Request a demo or contact us at info@gft.ge"

### Task 13: Add Translation Keys

**Across `src/lib/translations/`:**

- [x] `core.ts` — nav labels: `nav.leagues`, `nav.requestDemo`, `nav.exploreLeagues`, `nav.admin`
- [x] `core.ts` — footer labels: `footer.privacy`, `footer.terms`, `footer.requestDemo`
- [x] `core.ts` — stub page strings: `demo.title`, `demo.comingSoon`
- [x] `core.ts` — leagues page: `leagues.title`, `leagues.subtitle`, `leagues.viewOnStarlive`, `leagues.emptyState`
- [x] **No age group translation keys** — "U15"/"U17"/"U19" are identical in both languages, use raw string
- [x] `admin.ts` — platform admin: `platform.leagues.title`, `platform.leagues.addLeague`, `platform.leagues.editLeague`, `platform.leagues.name`, `platform.leagues.ageGroup`, `platform.leagues.season`, `platform.leagues.starliveUrl`, `platform.leagues.active`, `platform.leagues.displayOrder`, `platform.leagues.deleteConfirm`
- [x] **No import-related keys** — JSON import deferred
- [x] Both `en` and `ka` for every key

### Task 14: Final Verification

- [x] `npm run build` passes clean — zero TypeScript errors
- [x] Grep for remaining `/clubs` references in nav/CTA components — all should be `/leagues` now (except club detail pages which still exist)
- [x] Manual test: `/leagues` page loads, shows 3 league cards, cards link externally
- [x] Manual test: `/demo` shows stub content, `/privacy` and `/terms` redirect to `/contact`
- [x] Manual test: `/platform/leagues` — list, add, edit, delete, JSON import all work
- [x] Manual test: Navbar shows correct links for each of the 5 auth states
- [x] Manual test: LandingNav shows correct links (logged in vs out)
- [x] Manual test: Footer shows new link structure
- [x] Manual test: `/players/some-slug` redirects to `/leagues` (updated redirect)
- [x] Manual test: mobile responsive — all nav states, league cards, platform admin
- [x] Manual test: language toggle — all new strings appear in both EN and KA
- [x] Commit all changes

## Build Order (Execution Sequence)

```
Phase A — Database + Core Component
  1. Migration: leagues table + constraints + RLS + REVOKE + trigger (Task 1)
  2. Seed data in seed.sql (Task 1e)
  3. Regenerate types
  4. Age group color tokens in globals.css + constants.ts (Task 2)
  5. LeagueCard component (Task 2)
  6. /leagues public page (Task 3)
  BUILD CHECK — /leagues renders with 3 cards

Phase B — Platform Admin CRUD
  7. Constants + types (AGE_GROUPS, AgeGroup, LeagueFormInput) (Task 4a)
  8. Zod validation schema with HTTPS refine (Task 4b)
  9. Server actions — create, update, delete, toggleActive (Task 4c)
  10. LeagueForm component (Task 5b)
  11. Platform league pages: list, new, edit (Task 5a, 5c)
  12. PlatformSidebar update (Task 6)
  BUILD CHECK — CRUD works end-to-end

Phase C — Auth + Navigation
  13. AuthContext isApproved extension + root layout + PendingPolling fix (Task 8a — CRITICAL)
  14. Navbar rewrite with boolean flags (Task 8b, 8c)
  15. LandingNav update (Task 9)
  16. Footer rewrite (Task 10)
  17. /demo stub + privacy/terms redirects (Task 7)
  BUILD CHECK — all 5 nav states correct

Phase D — Cleanup + Verification
  18. Update cross-references: /clubs → /leagues (Task 12)
  19. Verify all translation keys (Task 13)
  20. Final verification + manual test all 5 nav states (Task 14)
```

Phase A is the foundation — new table + public page.
Phase B is the admin tooling — CRUD for managing leagues.
Phase C is the most complex — auth context extension + navigation overhaul. Task 8a is the critical path.
Phase D is cleanup and verification.

Build checks after each phase catch issues early.

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| `isApproved` not in AuthContext | Task 8a adds it — extend root layout query + AuthProvider props + onAuthStateChange listener |
| Stale `isApproved` after approval | `PendingPolling` calls `router.refresh()` after redirect — re-runs root layout server fetch |
| `/demo` page not built until Session 3 | Create stub page in Task 7 — no 404 between sessions |
| Starlive URLs are placeholders | Use `https://starlive.com` — platform admin can update via CRUD when real URLs arrive |
| Missing UNIQUE constraint blocks upsert | Added to migration (Task 1a) — `UNIQUE (name, age_group, season)` |
| Navbar complexity (5 states) | Use boolean flags, not 5 branches. Test each state explicitly in Task 14 |
| Translation key count (~20 new keys) | Add keys as you build each component — Task 13 is verification sweep |
| LeagueCard used by dashboard (Session 4) | Build as reusable `async` server component with typed props from the start |
| Active toggle double-click race | Use `useFormStatus()` to disable + idempotent action (send target state, not toggle) |
| Deploy before migration | **CRITICAL**: migration must run first — see deployment checklist |

## Deployment Sequence

**Order is critical: migration MUST run before code deploy.**

1. **Run migration** via Supabase MCP (`apply_migration`)
2. **Verify**: `SELECT * FROM leagues LIMIT 1` — table exists (empty in prod, seeded in dev)
3. **Verify REVOKE**: `INSERT INTO leagues (...) VALUES (...)` as authenticated user — should fail
4. **Deploy code** to Vercel: `npx vercel --prod --force`
5. **Post-deploy smoke test**: Visit `/leagues` — page loads. Login as scout — correct nav state.

**Rollback:** If migration fails: `DROP TABLE leagues`. If code fails: `git revert`. They are independent.

**Full deployment checklist:** [docs/checklists/2026-03-24-platform-pivot-session2-deployment-checklist.md](../checklists/2026-03-24-platform-pivot-session2-deployment-checklist.md)

## Sources & References

- **Origin spec:** [docs/superpowers/specs/2026-03-24-platform-pivot-design.md](../superpowers/specs/2026-03-24-platform-pivot-design.md) — Session 2 defined in Section 8, leagues in Section 4a, nav in Section 5
- **Session 1 plan (completed):** [docs/plans/2026-03-24-refactor-platform-pivot-session-1-strip-routes-approval-gate-plan.md](2026-03-24-refactor-platform-pivot-session-1-strip-routes-approval-gate-plan.md)
- **Pattern reference — ClubCard:** `src/components/club/ClubCard.tsx` — server component card pattern
- **Pattern reference — Platform CRUD:** `src/app/platform/clubs/` — list/new/edit page pattern
- **Pattern reference — ClubForm:** `src/components/platform/ClubForm.tsx` — client form component pattern
- **Pattern reference — Server actions:** `src/app/actions/platform-clubs.ts` — CRUD action pattern
- **Pattern reference — Validation:** `src/lib/validations.ts:30-38` — Zod schema pattern
- **Pattern reference — Seed data:** `supabase/seed.sql` — UUID pattern, bilingual data
- **Learnings:** Column-level GRANTs pattern from Session 1 migration 44
- **Learnings:** RLS policy patterns from `docs/solutions/database-issues/chat-system-rls-policy-and-displayname-fixes.md`
- **Learnings:** TOCTOU prevention from `docs/solutions/security-issues/comprehensive-audit-security-code-quality-fixes.md`
- Current middleware: `src/middleware.ts` (already has `/leagues` in PUBLIC_ROUTES)
- Current Navbar: `src/components/layout/Navbar.tsx`
- Current LandingNav: `src/components/landing/LandingNav.tsx`
- Current Footer: `src/components/layout/Footer.tsx`
