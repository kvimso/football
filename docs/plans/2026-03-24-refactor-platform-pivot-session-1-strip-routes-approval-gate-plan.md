---
title: "Platform Pivot Session 1: Strip Routes + Approval Gate"
type: refactor
status: completed
date: 2026-03-24
origin: docs/superpowers/specs/2026-03-24-platform-pivot-design.md
---

# Platform Pivot Session 1: Strip Routes + Approval Gate

## Enhancement Summary

**Deepened on:** 2026-03-24
**Research agents used:** architecture-strategist, security-sentinel, data-migration-expert, performance-oracle, code-simplicity-reviewer, julik-frontend-races-reviewer, deployment-verification-agent, best-practices-researcher, framework-docs-researcher, pattern-recognition-specialist, data-integrity-guardian

### Key Improvements from Research
1. **CRITICAL security fix**: Profiles UPDATE RLS allows self-escalation — any user can set `role = 'platform_admin'` or `is_approved = true` via browser console. Must add column-level GRANT restrictions.
2. **CRITICAL security fix**: API routes bypass the approval gate entirely — `authenticateRequest()` must check `is_approved`.
3. **CRITICAL trigger fix**: `handle_new_user()` trigger (migration 39) regressed invite-aware logic — new academy admins get `is_approved = false` and are locked out.
4. **Safer migration**: Use `DEFAULT true` then `ALTER DEFAULT false` pattern — zero lockout window, no UPDATE needed.
5. **Simplified plan**: Dropped catch-all redirect files and `/leagues` stub (YAGNI). Use `next.config.ts` redirects and temporary `/clubs` links instead.

### New Considerations Discovered
- Middleware should fail-closed on Supabase errors (currently fails open)
- Auth callback should route approved scouts directly to `/dashboard` (avoid extra redirect hop)
- `/pending` page polling needs AbortController + redirect guard to prevent race conditions
- Future optimization: Supabase Custom Access Token Hook to embed `is_approved` in JWT (eliminates per-request DB query)

---

## Overview

Session 1 of the platform pivot: create a backup branch, remove data-dependent routes (players, matches, watchlist), fix all dead links, add `is_approved` column to profiles with security hardening, restructure middleware with an approval gate, and build the `/pending` waiting room page.

This is the heaviest session — it strips the platform down and installs the new access control layer. Sessions 2-4 build on top of this clean foundation.

## Problem Statement / Motivation

Starlive/Pixellot cannot provide an API — only JSON links to their platform. ~70% of built features depend on API data (player stats, matches, radar charts, comparison tool). The platform must pivot from a full scouting tool to a league portal + demo-driven sales funnel. Scouts must go through a demo call before accessing platform features.

## Proposed Solution

1. Preserve all current code on a `full-platform-backup` branch
2. Delete route folders for data-dependent features
3. Fix all dead links in remaining components
4. Add `is_approved` boolean to profiles + security hardening (column-level GRANTs, trigger rewrite)
5. Restructure middleware to enforce approval for scouts + add API route protection
6. Build a `/pending` page as the approval waiting room
7. Add `next.config.ts` redirects for bookmarked URLs

## Technical Considerations

### Middleware Restructuring

The current middleware (`src/middleware.ts`) only queries `profiles` inside role-scoped path blocks (`/dashboard`, `/admin`, `/platform`). The `is_approved` check must run for ALL authenticated protected routes (including `/clubs`). The profile query must move BEFORE the role-scoped block.

Three route categories after restructuring:
1. **Public routes** — no auth required: `/`, `/leagues`, `/about`, `/contact`, `/demo`, `/privacy`, `/terms`, `/login`, `/register`
2. **Auth-only route** — requires auth but skips approval: `/pending`
3. **Protected routes** — requires auth + approval (scouts only): everything else

#### Research Insights

**Best Practice — Defense in Depth (3 layers):**
1. **Middleware** — redirect unapproved scouts away from pages (UI-level gate)
2. **API routes** — return 403 for unapproved scouts in `authenticateRequest()` (data-level gate)
3. **Data Access Layer** — verify approval in `getAdminContext()` and similar server-side helpers

This is essential because of [CVE-2025-29927](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — a March 2025 Next.js vulnerability where middleware could be bypassed entirely. The patch is in Next.js 16.x, but the lesson stands: **middleware is an optimization, not a security boundary**.

**Performance:** The profile query adds ~20-80ms per protected request (network RTT to Supabase). Primary key lookup is O(1) regardless of table size. Acceptable at current scale. Future optimization: use [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) to embed `role` and `is_approved` in JWT claims — eliminates the DB query entirely.

**Fail-Closed Error Handling:** Current middleware catch block fails open (passes request through on Supabase error). Change to fail-closed: redirect to `/login` on error for protected routes.

### `is_approved` — Role-Scoped Check

Only check `is_approved` when `role === 'scout'`. Academy admins (`is_approved = true` on invite) and platform admins should **never** hit the approval gate regardless of column value. This is more defensive than relying on the column value for non-scout roles.

### Profile Creation Race Condition

After Supabase Auth creates a user, the DB trigger fires to insert into `profiles`. There is a small window where `auth.getUser()` succeeds but `profiles` has no row. **Solution:** treat missing profile as `{ role: 'scout', is_approved: false }` and redirect to `/pending`. This matches the expected flow for new scouts.

#### Research Insight
On the `/pending` page, the polling query may also hit this race. If `profiles` returns no row, the Supabase client returns an error (not null). The polling callback must handle this: treat error as "try again next cycle", not as "unapproved" or "error state". This prevents a janky error flash for the 200ms before the trigger fires.

### Deleted Route Handling

**Approach: `next.config.ts` redirects** (not `[[...slug]]` catch-all files).

#### Research Insight
The pattern-recognition agent found that `[[...slug]]` catch-all files could conflict with existing `[slug]` dynamic segments in the same route tree. The official Next.js docs recommend `next.config.ts` `redirects` for known, static URL changes — these run at the CDN/edge level, are declarative, and don't require creating new route files:

```typescript
// next.config.ts
async redirects() {
  return [
    { source: '/players/:path*', destination: '/clubs', permanent: false },
    { source: '/matches/:path*', destination: '/clubs', permanent: false },
  ]
}
```

Redirect to `/clubs` (exists and works) rather than `/leagues` (not built until Session 2).

### `/pending` Page — 2 States for Session 1

The `demo_requests` table is built in Session 3, so Session 1 can only show:
1. **Unapproved:** "Your account is pending approval. Contact us to request a demo." + email contact info (not `/demo` link — that page doesn't exist until Session 3)
2. **Approved:** Redirect to role-appropriate page

#### Research Insight — Polling Implementation
The races reviewer identified 6 potential timing issues with the polling pattern. The recommended implementation:

- **AbortController** per query — cancels previous in-flight request, prevents overlap
- **`isRedirectingRef`** — synchronous boolean guard prevents dual `router.push()`
- **`canceledRef`** — checked after every `await` to prevent post-unmount side effects
- **Reset interval on visibility change** — prevents interval + visibility handler overlap
- **`routerRef`** — stable ref for router to prevent callback identity changes
- **Error handling**: return early on error (missing profile, network) — retry next cycle

```typescript
// Skeleton — full implementation in Task 10
const checkApproval = useCallback(async () => {
  if (canceledRef.current || isRedirectingRef.current) return;
  abortRef.current?.abort();
  abortRef.current = new AbortController();
  const { data, error } = await supabase
    .from('profiles').select('is_approved, role')
    .eq('id', userId).abortSignal(abortRef.current.signal).single();
  if (canceledRef.current || isRedirectingRef.current) return;
  if (error) return; // missing profile or network error — retry next cycle
  if (data.is_approved) {
    isRedirectingRef.current = true;
    routerRef.current.push(data.role === 'academy_admin' ? '/admin' : '/dashboard');
  }
}, [userId, supabase]);
```

**Alternative considered:** Supabase Realtime subscription on the profiles row (instant feedback). Rejected for Session 1 — adds complexity for a page users visit once. The 30s polling with proper race condition handling is simpler and adequate.

### API Route Protection — CRITICAL

#### Research Insight — Security Finding
The original plan stated "Middleware redirect is sufficient." **This is incorrect.** An unapproved scout can call API endpoints directly using `curl` or browser DevTools with their valid session cookie:

```bash
curl -b "sb-*-auth-token=<session>" https://football-v44v.vercel.app/api/players
# Returns full player data JSON despite being unapproved
```

**Fix:** Add `is_approved` check to `authenticateRequest()` in `src/lib/api-utils.ts`:
```typescript
// Extend the existing profile query to include is_approved
const { data: profile } = await supabase
  .from('profiles').select('role, club_id, full_name, is_approved')
  .eq('id', user.id).single()
if (profile.role === 'scout' && !profile.is_approved) {
  return { ok: false, error: apiError('errors.accountPendingApproval', 403) }
}
```

### Migration — Security Hardening (CRITICAL)

#### Research Insight — Pre-Existing Vulnerability
The security sentinel discovered that the current `profiles` UPDATE RLS policy allows any authenticated user to update **any column** on their own row — including `role` and `is_approved`:

```javascript
// An unapproved scout can run this in the browser console RIGHT NOW:
await supabase.from('profiles').update({ role: 'platform_admin' }).eq('id', myId)
```

This must be fixed in the same migration as `is_approved`. Use column-level GRANT restrictions:

```sql
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, organization, email, phone, country) ON public.profiles TO authenticated;
```

Platform admin uses the service role client, which bypasses GRANTs entirely.

#### Research Insight — Trigger Regression
Migration `20250101000039` overwrote the invite-aware trigger from `20250101000019` with a simpler version that always sets `role = 'scout'`. The invite flow for academy admins is broken. The trigger must be rewritten in this migration to:
- Read `role` and `club_id` from `raw_user_meta_data`
- Validate club_id exists
- Set `is_approved = true` for academy admins, `false` for scouts

Additionally, `src/app/actions/admin-invite.ts` line 61 (scout promotion path) must add `is_approved: true` to the UPDATE.

---

## Acceptance Criteria

### Task 1: Create Backup Branch
- [x] Create `full-platform-backup` branch from current `main`
- [x] Push to remote origin
- [x] Verify all current code is preserved

### Task 2: Delete Route Folders
- [x] Delete `src/app/(platform)/players/` (entire directory — 6 files)
- [x] Delete `src/app/(platform)/matches/` (entire directory — 4 files)
- [x] Delete `src/app/dashboard/watchlist/` (entire directory — 2 files)
- [x] Delete `src/app/dashboard/requests/` (entire directory — 2 files)
- [x] Delete `src/app/dashboard/notifications/` (entire directory — 2 files)
- [x] Delete `src/app/api/players/ai-search/` (entire directory + `history/` subfolder)
- [x] **KEEP** `src/app/api/players/search/` (used by chat `PlayerSearchModal`)
- [x] **KEEP** `src/app/api/players/route.ts`, `api/players/[id]/route.ts`, `api/players/[id]/pdf/route.ts` (used by admin panel)

### Task 3: Add Redirects for Deleted Routes
- [x] Add `redirects()` in `next.config.ts`: `/players/:path*` → `/clubs`, `/matches/:path*` → `/clubs` (temporary: `permanent: false`)
- [x] Update to redirect to `/leagues` in Session 2 when that page exists

### Task 4: Fix Dead Links — Component Patches (add translation keys inline)

#### `src/components/player/PlayerCard.tsx`
- [x] Replace `<Link href="/players/${player.slug}">` wrapper with a non-clickable `<div>` (only remaining consumer is club detail page — player directory and similar players sections are being deleted)
- [x] Remove `next/link` import if no longer used
- [x] Remove cursor-pointer hover styling

#### `src/components/chat/PlayerRefCard.tsx`
- [x] Replace `<Link href="/players/${player.slug}">` wrapper with display-only `<div>`
- [x] Remove `next/link` import if no longer used

#### `src/components/dashboard/DashboardSidebar.tsx`
- [x] Remove watchlist link from `links` array — both desktop sidebar AND mobile tab bar
- [x] Remove compare link object
- [x] Remove `watchlistCount` prop from component interface + `DashboardSidebarProps` type
- [x] Sidebar should show only: Home, Messages

#### `src/app/dashboard/layout.tsx`
- [x] Remove watchlist count query from `Promise.all`
- [x] Remove `watchlistCount` prop passed to `DashboardSidebar`

#### `src/components/landing/LandingNav.tsx`
- [x] Change authenticated CTA from `/players` ("Browse Players") to `/clubs` ("Explore Clubs")
- [x] Add translation key `nav.exploreClubs` (en: "Explore Clubs" / ka: Georgian equivalent)
- [x] **Note:** Updated to `/leagues` in Session 2

#### `src/components/about/AboutContent.tsx`
- [x] Change "Browse Players" CTA from `/players` to `/clubs` with "Explore Clubs"

#### `src/components/chat/ChatInbox.tsx`
- [x] Change empty state CTA from `/players` to `/clubs` with "Explore Clubs"

#### `src/components/chat/ChatEmptyState.tsx`
- [x] Change empty state CTA from `/players` to `/clubs` with "Explore Clubs"

#### `src/components/layout/Navbar.tsx`
- [x] Remove `NotificationBell` import and render (dead code — notification sources removed)
- [x] Remove `/players` and `/matches` links from both desktop nav and mobile menu
- [x] Remove `/dashboard/watchlist` from mobile menu
- [x] Keep `/clubs` link (still valid behind auth + approval)
- [x] **Note:** Full Navbar rewrite with approval-aware logic is Session 2

#### `src/components/layout/AvatarDropdown.tsx`
- [x] Remove `/dashboard/watchlist` link (scout-only section)

#### `src/components/layout/Footer.tsx`
- [x] Remove `/players` and `/matches` links
- [x] Keep `/clubs`, `/about`, `/contact`
- [x] **Note:** Full Footer rewrite is Session 2

### Task 5: Simplify Dashboard Page
- [x] Replace `src/app/dashboard/page.tsx` (180 lines) with minimal server component
- [x] Show: welcome card with scout's name + link to `/dashboard/messages`
- [x] Show: "More features coming soon" placeholder
- [x] Query only: profile full_name (sidebar already handles unread badges)
- [x] Must be a server component with `Metadata` export per codebase convention
- [x] Add translation keys inline: `dashboard.welcome`, `dashboard.comingSoon`

### Task 6: Verify Build is Clean
- [x] Run `npm run build` — zero TypeScript errors, zero broken imports
- [x] Grep for remaining references to deleted routes — verify all are intentional (kept API routes, orphan components)
- [x] **This must pass before proceeding to the approval gate work**

### Task 7: Database Migration — `is_approved` + Security Hardening

**Migration file: single file, single transaction for atomicity.**

#### 7a. Add `is_approved` column (zero-lockout pattern)
- [x] `ALTER TABLE profiles ADD COLUMN is_approved boolean NOT NULL DEFAULT true` — existing rows instantly read as `true` (PG11+ catalog-only, no table rewrite)
- [x] `ALTER TABLE profiles ALTER COLUMN is_approved SET DEFAULT false` — new signups get `false`

#### 7b. Column-level GRANT restrictions (CRITICAL security fix)
- [x] `REVOKE UPDATE ON public.profiles FROM authenticated`
- [x] `GRANT UPDATE (full_name, organization, email, phone, country) ON public.profiles TO authenticated`
- [x] Verify: platform admin uses service role client (bypasses GRANTs) — no impact

#### 7c. Rewrite `handle_new_user()` trigger (invite-aware + is_approved)
- [x] Read `role` and `club_id` from `raw_user_meta_data`
- [x] Validate club_id exists in clubs table
- [x] Set `is_approved = true` for academy admins with valid club, `false` for scouts
- [x] Include `country` field from migration 39
- [x] Include `is_approved` in INSERT columns

#### 7d. Fix admin-invite.ts promotion path
- [x] In `src/app/actions/admin-invite.ts` line ~61: add `is_approved: true` to the UPDATE for scout → academy_admin promotion

#### 7e. Post-migration
- [x] Run migration via Supabase MCP
- [x] Regenerate types: `npx supabase gen types typescript --local > src/lib/database.types.ts`
- [x] Verify: `SELECT id, email, role, is_approved FROM profiles ORDER BY created_at` — all existing users approved

### Task 8: Add API Route Protection
- [x] In `src/lib/api-utils.ts` `authenticateRequest()`: extend profile SELECT to include `is_approved`
- [x] Add check: if `role === 'scout' && !is_approved` → return 403 with `errors.accountPendingApproval`
- [x] Add translation key: `errors.accountPendingApproval` (en: "Your account is pending approval" / ka: equivalent)
- [x] Verify: API routes that DON'T use `authenticateRequest()` (messages, conversations, chat-upload) — either refactor to use it or add inline checks

### Task 9: Restructure Middleware
- [x] Define public routes list: `['/', '/leagues', '/about', '/contact', '/demo', '/privacy', '/terms', '/login', '/register']`
- [x] Define auth-only routes (skip approval): `['/pending']`
- [x] Move profile query (`select('role, is_approved')`) BEFORE the role-scoped block so it runs for ALL protected routes
- [x] Add approval gate logic: if `role === 'scout' && !is_approved` → redirect to `/pending`
- [x] Handle missing profile row: treat as `{ role: 'scout', is_approved: false }` → redirect to `/pending`
- [x] Ensure `academy_admin` and `platform_admin` always pass through (role-scoped check, not column check)
- [x] **Change error handling to fail-closed**: catch block redirects to `/login` instead of passing through
- [x] Add clear comments documenting the three route categories

### Task 10: Update Auth Callback
- [x] In `src/app/(auth)/callback/route.ts`: make routing approval-aware
- [x] Route directly: `academy_admin` → `/admin`, `platform_admin` → `/platform`, approved scout → `/dashboard`, unapproved scout → `/pending`
- [x] Query `is_approved` alongside `role` in the existing profile query
- [x] This eliminates the extra redirect hop through `/pending` for approved scouts

### Task 11: Build `/pending` Page (add translation keys inline)
- [x] Create `src/app/(auth)/pending/page.tsx` — server component wrapper (checks auth, redirects if already approved)
- [x] Create `src/components/auth/PendingPolling.tsx` — client component for polling
- [x] **State 1 — Unapproved:** "Your account is pending approval. Contact us at [email] to schedule a demo."
- [x] **State 2 — Approved:** Redirect to role-appropriate page (`/dashboard` for scout, `/admin` for academy_admin, `/platform` for platform_admin)
- [x] Polling with race condition protection:
  - `AbortController` per query (cancels previous in-flight request)
  - `isRedirectingRef` boolean guard (prevents dual router.push)
  - `canceledRef` checked after every await (prevents post-unmount side effects)
  - Reset interval on visibility change (prevents interval + handler overlap)
  - `routerRef` for stable router reference
  - Error handling: return early on error, retry next cycle
- [x] Auto-polling: 30 seconds interval
- [x] Visibility change listener: re-check on tab focus + reset interval
- [x] Online event listener: re-check when device comes back online
- [x] Logout button visible on the page
- [x] Bilingual: all strings via `useLang()` with en/ka translations
- [x] Namespace: `auth.pendingTitle`, `auth.pendingDescription`, `auth.pendingContact`, `auth.approved`
- [x] If user is not authenticated: redirect to `/login`

### Task 12: Final Verification
- [x] `npm run build` passes clean
- [x] Manual test: existing approved user can navigate to `/clubs`, `/dashboard/messages`
- [x] Manual test: unapproved scout hits any protected route → redirected to `/pending`
- [x] Manual test: unapproved scout calls API route directly → receives 403 JSON
- [x] Manual test: `/pending` page shows correct state, polling works
- [x] Manual test: bookmarked `/players/foo` → redirects to `/clubs`
- [x] Manual test: `PlayerCard` on club detail page is non-clickable
- [x] Manual test: `PlayerRefCard` in chat messages is display-only
- [x] Manual test: Navbar/Footer no longer show Players/Matches links
- [x] Manual test: scout cannot self-approve via browser console (`profiles.update({ is_approved: true })` → fails)
- [x] Commit all changes

## Build Order (Execution Sequence)

```
Phase A — Strip and Patch
  1. Backup branch (Task 1)
  2. Delete routes (Task 2)
  3. Add next.config.ts redirects (Task 3)
  4. Dead link fixes + inline translations (Task 4)
  5. Dashboard simplification (Task 5)
  6. BUILD CHECK — must pass (Task 6)

Phase B — Security + Approval Gate
  7. Migration: is_approved + column GRANTs + trigger rewrite (Task 7)
  8. API route protection (Task 8)
  9. Middleware restructure (Task 9)
  10. Auth callback update (Task 10)
  11. /pending page + polling (Task 11)
  12. Final verification (Task 12)
```

Phase A is purely removing/fixing existing code.
Phase B adds new functionality + security hardening.
Task 6 is the checkpoint between phases.

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| Build breaks from removed imports | Task 6 checkpoint verifies before proceeding |
| Existing users locked out | Migration uses `DEFAULT true` — zero lockout window |
| Profile trigger race condition | Middleware + polling: treat missing profile as unapproved scout, retry next cycle |
| Dead links to `/leagues` (built Session 2) | Redirects go to `/clubs` (exists); update to `/leagues` in Session 2 |
| Dead links to `/demo` (built Session 3) | `/pending` shows email contact instead of `/demo` link |
| API routes called by unapproved scouts | `authenticateRequest()` returns 403 (Task 8) |
| Self-approval via browser console | Column-level GRANTs restrict UPDATE to safe columns only (Task 7b) |
| Deploy before migration | **CRITICAL**: migration must run first — see deployment checklist below |
| Supabase outage during middleware | Fail-closed: redirect to `/login` on error (Task 9) |
| Academy admin invite broken (pre-existing) | Trigger rewrite restores invite-aware logic (Task 7c) |

## Deployment Sequence

**Order is critical: migration MUST run before code deploy.**

1. **Pre-deploy**: Run `SELECT id, email, role FROM profiles ORDER BY created_at` to audit current profiles
2. **Run migration** via Supabase MCP (`apply_migration`)
3. **Verify migration**: `SELECT id, email, role, is_approved FROM profiles` — all existing users show `is_approved = true`
4. **Verify GRANTs**: Test from a scout session: `UPDATE profiles SET is_approved = false WHERE id = '<scout_id>'` — should fail with permission denied
5. **Deploy code** to Vercel (`npx vercel --prod --force`)
6. **Post-deploy smoke test**: Login as approved scout → can access `/clubs`, `/dashboard/messages`. Login as new scout → lands on `/pending`.

**Rollback procedure:**
- If migration causes issues: `ALTER TABLE profiles DROP COLUMN is_approved;` + restore GRANT permissions
- If code causes issues: `git revert` — old middleware ignores `is_approved` column (safe)

## Sources & References

- **Origin spec:** [docs/superpowers/specs/2026-03-24-platform-pivot-design.md](../superpowers/specs/2026-03-24-platform-pivot-design.md) — Session 1 defined in Section 8
- **Learnings:** [docs/solutions/database-issues/chat-system-rls-policy-and-displayname-fixes.md](../solutions/database-issues/chat-system-rls-policy-and-displayname-fixes.md) — incremental RLS policy pattern
- **Learnings:** [docs/solutions/feature-migrations/shortlist-to-watchlist-system-migration.md](../solutions/feature-migrations/shortlist-to-watchlist-system-migration.md) — column addition migration pattern
- **Learnings:** [docs/solutions/security-issues/comprehensive-audit-security-code-quality-fixes.md](../solutions/security-issues/comprehensive-audit-security-code-quality-fixes.md) — route cleanup audit pattern
- **Security:** [CVE-2025-29927](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — Next.js middleware bypass, defense-in-depth lesson
- **Best Practice:** [Next.js Official Authentication Guide](https://nextjs.org/docs/app/guides/authentication) — Data Access Layer pattern
- **Best Practice:** [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) — future JWT-based approval check
- **Best Practice:** [Next.js Redirecting Guide](https://nextjs.org/docs/app/guides/redirecting) — `next.config.ts` redirects vs catch-all routes
- **Deployment:** [docs/checklists/2026-03-24-platform-pivot-session1-deployment-checklist.md](../checklists/2026-03-24-platform-pivot-session1-deployment-checklist.md) — full deployment checklist
- Current middleware: `src/middleware.ts`
- Auth callback: `src/app/(auth)/callback/route.ts`
- Dashboard layout: `src/app/dashboard/layout.tsx`
- API utils: `src/lib/api-utils.ts`
- Admin invite: `src/app/actions/admin-invite.ts`
- Profiles UPDATE policy: `supabase/migrations/20250101000017_fix_linter_warnings.sql`
- handle_new_user trigger: `supabase/migrations/20250101000039_add_country_to_profiles_and_demand_rpcs.sql`
