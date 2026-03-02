---
title: "Consolidated Code Review Remediation — 29 Findings"
type: refactor
status: active
date: 2026-03-02
---

# Consolidated Code Review Remediation — 29 Findings

## Overview

Two independent code reviews (19-item todo set + 29-item full codebase audit) produced findings across security, type safety, performance, and code quality. After deduplication against the already-completed `2026-03-02-refactor-full-codebase-review-fixes-plan.md`, this plan covers **29 unique remaining findings** organized into 4 phases.

**Scope:** Security fixes, type safety improvements, performance optimizations, dead code removal across ~35 files + 4 new database migrations.

**Rules:**
- Fix P1 items first, in order
- Run `npm run build` after each fix to verify
- For database changes, create new migrations (never edit existing)
- After fixing each todo, rename `pending` → `complete` in the todo filename
- Read the individual todo file for full details before fixing each item

---

## Phase A: P1 Critical — Security & Auth (8 items)

Fix in this exact order. `npm run build` after each.

### A1. PostgREST Filter Injection in Matches API
**Todo:** `001-pending-p1-postgrest-filter-injection-matches-api.md`
**File:** `src/app/api/matches/route.ts:32`

The `club` query param is interpolated directly into `.or()` filter without UUID validation. Attacker can inject arbitrary PostgREST filter operators.

```typescript
// src/app/api/matches/route.ts — add UUID validation before .or()
import { uuidSchema } from '@/lib/validations'

if (club) {
  if (!uuidSchema.safeParse(club).success) {
    return apiError('errors.invalidInput', 400)
  }
  query = query.or(`home_club_id.eq.${club},away_club_id.eq.${club}`)
}
```

**Effort:** 5 min | **Risk:** None

- [x] `club` parameter validated as UUID before use in `.or()` filter
- [x] Invalid `club` values return 400 error
- [x] Valid UUID club filter still works correctly

---

### A2. RLS Allows Academy Admins to Write Camera-Only Tables
**Todo:** New (from audit set — no existing todo)
**Source:** `supabase/migrations/20250101000012_create_rls_policies.sql`

`player_skills`, `player_season_stats`, `matches`, `match_player_stats`, `player_videos` all have INSERT/UPDATE/DELETE RLS policies for `academy_admin`. This directly violates CLAUDE.md: "All stats come from cameras only."

**Fix:** New migration to DROP all academy_admin write policies on these 5 tables:

```sql
-- supabase/migrations/XXXXXXXXX_drop_academy_admin_camera_table_policies.sql
-- CLAUDE.md: "No club admin access to matches/stats/videos — camera-only tables"

-- player_skills
DROP POLICY IF EXISTS "Academy admins can insert own club player_skills" ON player_skills;
DROP POLICY IF EXISTS "Academy admins can update own club player_skills" ON player_skills;
DROP POLICY IF EXISTS "Academy admins can delete own club player_skills" ON player_skills;

-- player_season_stats
DROP POLICY IF EXISTS "Academy admins can insert own club player_season_stats" ON player_season_stats;
DROP POLICY IF EXISTS "Academy admins can update own club player_season_stats" ON player_season_stats;
DROP POLICY IF EXISTS "Academy admins can delete own club player_season_stats" ON player_season_stats;

-- matches
DROP POLICY IF EXISTS "Academy admins can insert matches" ON matches;
DROP POLICY IF EXISTS "Academy admins can update own club matches" ON matches;

-- match_player_stats
DROP POLICY IF EXISTS "Academy admins can insert own club match_player_stats" ON match_player_stats;
DROP POLICY IF EXISTS "Academy admins can update own club match_player_stats" ON match_player_stats;
DROP POLICY IF EXISTS "Academy admins can delete own club match_player_stats" ON match_player_stats;

-- player_videos
DROP POLICY IF EXISTS "Academy admins can insert own club player_videos" ON player_videos;
DROP POLICY IF EXISTS "Academy admins can update own club player_videos" ON player_videos;
DROP POLICY IF EXISTS "Academy admins can delete own club player_videos" ON player_videos;
```

**Important:** Verify exact policy names by reading the original migration first. The names above are inferred — actual names may differ.

**Effort:** 15 min | **Risk:** Low — no admin UI writes to these tables

- [x] All academy_admin INSERT/UPDATE/DELETE policies dropped on 5 camera-only tables
- [x] Only service_role can write to camera-only tables
- [x] Migration applies cleanly
- [x] No regression in admin player management (bio/photo/physical fields are on `players` table, not camera tables)

---

### A3. accept_transfer_request RPC Missing Authorization
**Todo:** `002-pending-p1-rpc-accept-transfer-missing-authorization.md`
**Source:** `supabase/migrations/20250101000035_atomic_transfer_and_self_check.sql`

`SECURITY DEFINER` function has no `auth.uid()` check. Any authenticated user can call it directly via PostgREST.

**Fix:** New migration — `CREATE OR REPLACE FUNCTION` with authorization check added after fetching `v_request`, before any mutations:

```sql
-- After: SELECT ... INTO v_request FROM transfer_requests WHERE id = p_request_id;
-- Add:
IF NOT EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
    AND (
      (role = 'academy_admin' AND club_id = v_request.from_club_id)
      OR role = 'platform_admin'
    )
) THEN
  RETURN jsonb_build_object('error', 'errors.unauthorized');
END IF;
```

**Effort:** 15 min | **Risk:** Very low

- [x] Function rejects calls from users who are not from_club admins or platform_admins
- [x] Existing transfer accept flow (admin UI + API route) still works
- [x] Migration applies cleanly

---

### A4. authenticateRequest Discriminated Union Refactor
**Todo:** `003-pending-p1-authenticate-request-discriminated-union.md`
**File:** `src/lib/api-utils.ts` + all API routes using it

Returns nullable types forcing 30+ non-null assertions (`profile!.role`, `user!.id`).

**Fix:** Refactor return type to discriminated union:

```typescript
// src/lib/api-utils.ts
type AuthProfile = { role: string; club_id: string | null; full_name: string | null }

type AuthResult =
  | { ok: true; user: User; profile: AuthProfile }
  | { ok: false; error: NextResponse }

export async function authenticateRequest(
  supabase: SupabaseClient<Database>
): Promise<AuthResult> {
  // ... existing logic ...
  // On failure: return { ok: false, error: apiError(...) }
  // On success: return { ok: true, user, profile }
}
```

Then update all consumer routes:
```typescript
const auth = await authenticateRequest(supabase)
if (!auth.ok) return auth.error
// auth.user and auth.profile now narrowed — no ! needed
const { user, profile } = auth
```

**Files to update (11 total):**
1. `src/lib/api-utils.ts` (refactor function)
2. `src/app/api/shortlist/route.ts`
3. `src/app/api/contact-requests/route.ts`
4. `src/app/api/transfers/route.ts`
5. `src/app/api/transfers/[id]/route.ts`
6. `src/app/api/admin/players/route.ts`
7. `src/app/api/matches/route.ts`
8. `src/app/api/clubs/route.ts`
9. `src/app/api/players/route.ts`
10. `src/app/api/players/[id]/route.ts`
11. Any other routes using `authenticateRequest`

**Do this LAST in Phase A** since it touches all routes — complete other route fixes first so you only touch each route once.

**Effort:** 30 min (mechanical, 11 files) | **Risk:** Low

- [x] `authenticateRequest` returns discriminated union with `ok: true/false`
- [x] Zero non-null assertions (`!`) on auth result in any API route
- [x] All API routes compile without errors
- [x] `npm run build` passes

---

### A5. SupabaseClient Missing Database Generic
**Todo:** `004-pending-p1-supabase-client-missing-database-generic.md`
**File:** `src/lib/transfer-helpers.ts`

All 3 functions use untyped `SupabaseClient` — no compile-time safety on `.from()` calls.

```typescript
// src/lib/transfer-helpers.ts — add Database import and generic
import type { Database } from '@/lib/database.types'

export async function recordClubJoin(client: SupabaseClient<Database>, ...)
export async function executeTransferAccept(client: SupabaseClient<Database>, ...)
export async function executeTransferDecline(client: SupabaseClient<Database>, ...)
```

**Effort:** 5 min | **Risk:** None

- [x] All 3 functions use `SupabaseClient<Database>` parameter type
- [x] `npm run build` passes with no new type errors

---

### A6. Contact Requests PATCH Missing Club Ownership (IDOR)
**Todo:** `005-pending-p1-contact-requests-patch-missing-ownership-check.md`
**File:** `src/app/api/contact-requests/route.ts`

PATCH handler checks role but not that the contact request belongs to a player at the admin's club. GET handler for academy_admin has no club_id filter.

**Fix for PATCH:** Fetch the request, join to player for club_id, verify ownership:

```typescript
// Before update, add ownership check:
const { data: existingRequest } = await supabase
  .from('contact_requests')
  .select('id, player:players!contact_requests_player_id_fkey(club_id)')
  .eq('id', requestId)
  .single()

if (!existingRequest) return apiError('errors.requestNotFound', 404)
if (auth.profile.role !== 'platform_admin' && existingRequest.player?.club_id !== auth.profile.club_id) {
  return apiError('errors.unauthorized', 403)
}
```

**Fix for GET:** Add club_id filter for academy_admin role:

```typescript
if (auth.profile.role === 'academy_admin') {
  query = query.eq('players.club_id', auth.profile.club_id)
}
```

**Effort:** 15 min | **Risk:** None

- [x] PATCH rejects requests where player's club_id doesn't match admin's club_id
- [x] GET filters by admin's club_id for academy_admin role (via RLS)
- [x] Platform admins can still access all requests

---

### A7. Missing Role Check on Shortlist Server Actions
**Todo:** New (from audit set #4)
**File:** `src/app/actions/shortlist.ts`

`addToShortlist`, `removeFromShortlist`, `updateShortlistNote` authenticate user but never verify `role === 'scout'`.

```typescript
// Add after auth check in each of the 3 functions:
if (profile.role !== 'scout') {
  return { error: 'errors.unauthorized' }
}
```

**Effort:** 5 min | **Risk:** None

- [x] All 3 shortlist functions check `role === 'scout'`
- [x] Non-scout users get unauthorized error

---

### A8. Raw Supabase Errors Leaked to Client
**Todo:** New (from audit set #5)
**Files:**
- `src/app/api/conversations/[conversationId]/block/route.ts:96,111`
- `src/app/api/messages/[conversationId]/read/route.ts:43`

Returns `error.message` directly, exposing table/constraint names.

```typescript
// Before:
return NextResponse.json({ error: insertError.message }, { status: 500 })

// After:
console.error('[block/POST] Insert error:', insertError.message)
return NextResponse.json({ error: 'errors.serverError' }, { status: 500 })
```

Apply to all 3 locations (2 in block route, 1 in read route).

**Effort:** 5 min | **Risk:** None

- [x] No raw Supabase error messages in client responses
- [x] Server-side console.error preserved for debugging

---

## Phase B: P2 Important — Validation, Indexes & Security (6 items)

### B1. CSP unsafe-eval in Production
**Todo:** `015-pending-p3-csp-unsafe-inline-unsafe-eval.md` (elevated from P3)
**File:** `next.config.ts`

`script-src` includes `'unsafe-eval'` which weakens XSS protection significantly.

```typescript
// next.config.ts — conditionally include unsafe-eval
const isDev = process.env.NODE_ENV === 'development'
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`
```

**Effort:** 10 min (must test prod build for CSP violations) | **Risk:** Low-Medium

- [x] `'unsafe-eval'` removed from production CSP
- [x] Dev build still works with eval
- [x] `npm run build` and `npm start` work without CSP errors

---

### B2. Missing Database Indexes
**Todo:** `014-pending-p2-missing-index-players-date-of-birth.md` (expanded with audit #6)

New migration with all needed indexes:

```sql
-- Performance indexes for player queries
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_dob ON public.players(date_of_birth);

-- Trigram indexes for ILIKE search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_players_name_trgm ON public.players USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_players_name_ka_trgm ON public.players USING gin(name_ka gin_trgm_ops);
```

**Effort:** 5 min | **Risk:** None

- [x] Indexes exist on status, date_of_birth, name (trigram), name_ka (trigram)
- [x] Migration applies cleanly

---

### B3. Guardian Contact RPC Missing search_path
**Todo:** `006-pending-p2-guardian-contact-rpc-missing-search-path.md`

New migration — `CREATE OR REPLACE FUNCTION` with `SET search_path = public` added.

**Effort:** 5 min | **Risk:** None

- [x] Function includes `SET search_path = public`

---

### B4. File Upload Double-Extension Defense + Filename Sanitization
**Todo:** `007-pending-p2-file-upload-double-extension-defense.md`
**File:** `src/app/api/chat-upload/route.ts`

Validate only the final extension and sanitize the filename:

```typescript
// Sanitize filename (prevent XSS in rendered filenames)
const safeName = file.name.replace(/[<>"'&\x00]/g, '_').substring(0, 200)

// Check ONLY the final extension (prevents double-extension bypass)
const lastDotIndex = safeName.lastIndexOf('.')
const ext = lastDotIndex > 0 ? safeName.substring(lastDotIndex).toLowerCase() : ''
if (!ALLOWED_CHAT_FILE_EXTENSIONS.includes(ext)) {
  return NextResponse.json({ error: 'errors.fileTypeNotAllowed' }, { status: 400 })
}
```

**Effort:** 10 min | **Risk:** None

- [x] Only the final file extension is validated
- [x] Filenames sanitized before storage and response
- [x] Double-extension files like `evil.jpg.svg` rejected

---

### B5. file_url Validation Too Permissive
**Todo:** New (from audit set #14)
**File:** `src/lib/validations.ts:60-61`

Accepts any string including `javascript:` URIs or phishing URLs.

```typescript
// src/lib/validations.ts — add .refine() to file_url
file_url: z.string().min(1).refine(
  val => val.startsWith('chat-attachments/') || val.includes('.supabase.co/storage/'),
  'File URL must be a valid storage path'
).optional()
```

**Effort:** 5 min | **Risk:** None

- [x] file_url only accepts Supabase storage paths
- [x] `javascript:` and external URLs rejected

---

### B6. RPC Result Type Cast Needs Zod
**Todo:** `008-pending-p2-rpc-result-type-cast-needs-zod.md`
**File:** `src/lib/transfer-helpers.ts:59`

Raw `as` cast on RPC response.

```typescript
// src/lib/transfer-helpers.ts — add Zod schema, remove `as` cast
import { z } from 'zod'

const transferRpcResultSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
}).nullable()

// Replace: const result = data as { error?: string; success?: boolean } | null
// With:
const parsed = transferRpcResultSchema.safeParse(data)
if (!parsed.success) {
  console.error('[transfer] Invalid RPC response:', parsed.error)
  return { error: 'errors.serverError' }
}
const result = parsed.data
```

**Effort:** 5 min | **Risk:** None

- [x] RPC result validated with Zod schema
- [x] No `as` cast on RPC response

---

## Phase C: P2 Important — Performance & Code Quality (6 items)

### C1. Duplicate Queries in generateMetadata + Page Component
**Todo:** New (from audit set #7)
**Files:** `src/app/(platform)/players/[slug]/page.tsx`, `matches/[slug]/page.tsx`, `clubs/[slug]/page.tsx`

Same entity fetched twice per page load. Supabase client does NOT participate in Next.js `fetch()` deduplication.

**Fix:** Wrap queries in `React.cache()`:

```typescript
import { cache } from 'react'

const getPlayer = cache(async (slug: string) => {
  const supabase = await createClient()
  return supabase.from('players').select(/* full column list */).eq('slug', slug).single()
})

// Call in both generateMetadata AND page component
export async function generateMetadata({ params }: Props) {
  const { data: player } = await getPlayer(params.slug)
  // ...
}

export default async function PlayerPage({ params }: Props) {
  const { data: player } = await getPlayer(params.slug)
  // ...
}
```

**Note:** Research found metadata queries intentionally use lighter selects in some files. In those cases, the cached query should use the full select and metadata can pick the fields it needs.

**Effort:** 15 min (3 files) | **Risk:** Low

- [x] Each detail page creates entity once with `React.cache()`
- [x] Both `generateMetadata` and page component call the cached function

---

### C2. Sequential Query Waterfalls → Promise.all
**Todo:** `010-pending-p2-players-api-sequential-queries.md` (expanded)
**Files:**
- `src/app/api/players/[id]/route.ts` — view count + similar players run sequentially
- `src/app/(platform)/clubs/[slug]/page.tsx:54-64` — user + profile queries sequential

```typescript
// players/[id]/route.ts — wrap independent queries
const [viewCountResult, similarResult] = await Promise.all([
  supabase.rpc('get_player_view_counts', { player_ids: [player.id] }),
  supabase.from('players').select(...).eq('position', player.position)...
])
```

**Effort:** 10 min | **Risk:** None

- [x] Independent queries run in parallel via Promise.all
- [x] Response data unchanged

---

### C3. Clubs API N+1 Player Counts
**Todo:** `011-pending-p2-clubs-api-n1-player-counts.md`
**File:** `src/app/api/clubs/route.ts`

Fetches every player ID per club just to count them.

```typescript
// Before: players ( id ) — fetches all IDs
// After: use Supabase embedded count
.select(`
  id, name, name_ka, slug, logo_url, city, region, description, description_ka, website,
  player_count:players(count)
`)
// Then map: club.player_count[0]?.count ?? 0
```

**Effort:** 10 min | **Risk:** None

- [x] Player counts computed without fetching all player IDs

---

### C4. season_stats Normalization Utility
**Todo:** `013-pending-p2-season-stats-normalization-duplicated.md`
**File:** `src/lib/utils.ts` + 6 consumer files

The pattern `Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []` is duplicated 6+ times.

```typescript
// src/lib/utils.ts — add utility
export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}
```

**Consumer files to update:**
- `src/app/api/players/route.ts` (2 occurrences)
- `src/app/api/players/[id]/route.ts`
- `src/app/api/clubs/[slug]/route.ts`
- `src/app/api/shortlist/route.ts`
- `src/app/(platform)/players/[slug]/page.tsx`

**Effort:** 15 min | **Risk:** None

- [x] `normalizeToArray` utility in utils.ts
- [x] All 6+ occurrences replaced

---

### C5. Context Provider Value Stability (useMemo)
**Todo:** New (from audit set #23)
**Files:** `src/context/LanguageContext.tsx`, `src/context/AuthContext.tsx`

Provider values created fresh each render without `useMemo`, causing unnecessary consumer re-renders.

```typescript
// LanguageContext.tsx
const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
return <LanguageContext.Provider value={value}>...</LanguageContext.Provider>

// AuthContext.tsx
const value = useMemo(() => ({ user, userRole, signOut }), [user, userRole, signOut])
return <AuthContext.Provider value={value}>...</AuthContext.Provider>
```

**Effort:** 10 min | **Risk:** None

- [x] Both context providers wrap value in useMemo

---

### C6. Inline UUID Regex → uuidSchema
**Todo:** New (from audit set #24)
**Files:**
- `src/app/actions/player-views.ts:8`
- `src/app/api/chat-upload/route.ts:25`
- `src/app/api/players/[id]/pdf/route.ts:14`

3 files define their own `uuidRegex` instead of using `uuidSchema.safeParse()` from `validations.ts`.

```typescript
// Replace in each file:
// Before: const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
//         if (!uuidRegex.test(id)) return ...
// After:
import { uuidSchema } from '@/lib/validations'
if (!uuidSchema.safeParse(id).success) return ...
```

**Effort:** 10 min | **Risk:** None

- [x] All 3 files use `uuidSchema.safeParse()` instead of inline regex

---

## Phase D: P3 Nice-to-have — Cleanup & Polish (9 items)

### D1. Delete Dead Files
**Files to delete:**
- `vite.config.js` (old Vite SPA config — project is Next.js)
- `index.html` (old SPA root template — references non-existent `/src/main.jsx`)
- `nul` (35.5KB Windows artifact / grep output)
- `src/components/forms/ContactRequestForm.tsx` (replaced by chat, never imported)

**Note:** `vercel.json` is confirmed in use — DO NOT delete.

**Effort:** 2 min

- [ ] All 4 dead files deleted

---

### D2. Remove Dead Code
- `ActionResult<T>` type in `src/lib/types.ts:9-11` (exported, never imported)
- `.card-enhanced` CSS class in `src/app/globals.css:161-174` (never used)
- Unused `__dirname` + related imports in `eslint.config.mjs:1-2,9`
- `FetchConversationsResult` export in `src/lib/chat-queries.ts:4-7` (if unused)

**Effort:** 10 min

- [ ] All dead code removed
- [ ] `npm run build` still passes

---

### D3. Dynamic Zod Import → Static
**File:** `src/lib/chat-queries.ts:73`

```typescript
// Before: const { safeParse } = await import('zod').then(...)
// After:
import { uuidSchema } from '@/lib/validations'
// Use: uuidSchema.safeParse(conversationId)
```

**Effort:** 2 min

---

### D4. DashboardScoutActivity Duplicate Label
**Todo:** `017-pending-p3-dashboard-scout-activity-duplicate-label.md`
**File:** `src/components/admin/DashboardScoutActivity.tsx:59`

Empty state renders `noActivityLabel` twice. Remove the second `<p>` or use a different subtitle.

**Effort:** 2 min

- [ ] Empty state shows one label, not duplicate

---

### D5. TransferCard/Tabs Status String → Union Type
**Todo:** `018-pending-p3-status-string-types-need-unions.md`
**Files:** `src/components/admin/TransferCard.tsx`, `TransferTabs.tsx`

```typescript
type TransferStatus = 'pending' | 'accepted' | 'declined' | 'expired'
```

**Effort:** 10 min

- [ ] Transfer status uses union type

---

### D6. Navbar Visibility-Aware Polling
**Todo:** `019-pending-p3-navbar-visibility-aware-polling.md`
**File:** `src/components/layout/Navbar.tsx`

```typescript
// Add visibilitychange listener to pause/resume polling
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) { /* clear interval */ }
    else { /* restart interval + immediate fetch */ }
  }
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [])
```

**Effort:** 10 min

- [ ] Polling pauses when tab is hidden
- [ ] Polling resumes when tab becomes visible

---

### D7. ChatInbox Stale Realtime Subscription
**Todo:** `016-pending-p3-chatinbox-stale-realtime-subscription.md`
**File:** `src/components/chat/ChatInbox.tsx`

When a new conversation is created, the Realtime channel filter doesn't include it. Re-subscribe when conversation list changes or use a broader RLS-scoped filter.

**Effort:** 15 min

- [ ] New conversations receive real-time updates without page refresh

---

### D8. Dual Analytics on Player Profile
**File:** `src/app/(platform)/players/[slug]/page.tsx:76-77`

Both `trackPageView` and `trackPlayerView` fire on the same page. `player_views` already covers player-specific tracking.

**Fix:** Remove the `trackPageView` call — `trackPlayerView` is more specific.

**Effort:** 2 min

---

### D9. Redundant Auth Checks in Child Pages
**Files:** `src/app/dashboard/page.tsx`, `src/app/admin/page.tsx`

Both re-check `getUser()` + redirect when parent layout already enforces auth.

**Fix:** Remove the duplicate auth checks.

**Effort:** 5 min

---

## Deferred Items (Separate Tasks)

These are too large for this remediation pass and should be planned separately:

| ID | Item | Effort | Reason to Defer |
|----|------|--------|-----------------|
| D.1 | Player directory 500-row stat filtering → DB RPC | 2-4h | Needs RPC design + testing (todo #9) |
| D.2 | trackPlayerView 3-5 sequential queries → single RPC | 1-2h | New RPC + migration (audit #10) |
| D.3 | Business logic duplication actions ↔ API routes | 2-3h | Large refactor, many files (todo #12) |
| D.4 | Chat API route consistency (createApiClient + authenticateRequest) | 1-2h | Many files, regression risk (audit #13) |
| D.5 | PlayerForm / PlatformPlayerForm 85% dedup | 1-2h | Complex component refactor (audit #12) |
| D.6 | PDF route i18n (~30 hardcoded English strings) | 1h | Needs translation keys (audit #20) |
| D.7 | Extract shared ErrorView component (5 error.tsx files) | 30m | Low impact (audit #19) |
| D.8 | CLAUDE.md documentation drift | 15m | Non-code (audit #25) |

---

## Implementation Order Summary

```
Phase A: Security & Auth (8 items)     ≈ 95 min
  A1 → A2 → A3 → A5 → A8 → A7 → A6 → A4 (do A4 last, touches all routes)

Phase B: Validation & Indexes (6 items) ≈ 40 min
  B2 → B3 → B4 → B5 → B6 → B1

Phase C: Perf & Code Quality (6 items)  ≈ 70 min
  C4 → C6 → C5 → C1 → C2 → C3

Phase D: Cleanup & Polish (9 items)     ≈ 58 min
  D1 → D2 → D3 → D4 → D5 → D8 → D9 → D6 → D7
```

**Total: 29 items, ≈ 4.5 hours of focused work**

---

## Acceptance Criteria

### Security (Phase A)
- [x] No PostgREST filter injection vectors remain
- [x] Academy admins cannot write to camera-only tables
- [x] All SECURITY DEFINER RPCs have internal authorization checks
- [x] All API routes verify club ownership for admin operations
- [x] No raw Supabase error messages exposed to clients
- [x] Shortlist actions restricted to scout role

### Validation & Indexes (Phase B)
- [x] CSP `unsafe-eval` removed from production
- [x] Database indexes on players.status, date_of_birth, name/name_ka (trigram)
- [x] Guardian RPC has search_path set
- [x] File upload validates final extension only, sanitizes filenames
- [x] file_url only accepts Supabase storage paths
- [x] RPC results validated with Zod (no raw `as` casts)

### Performance & Quality (Phase C)
- [x] generateMetadata + page share cached queries via React.cache()
- [x] Independent queries use Promise.all
- [x] Clubs API uses count instead of fetching all player IDs
- [x] normalizeToArray utility replaces all duplicated expressions
- [x] Context providers use useMemo for value stability
- [x] All UUID validation uses shared uuidSchema

### Cleanup (Phase D)
- [ ] Dead files deleted (4 files)
- [ ] Dead code removed
- [ ] Duplicate labels fixed
- [ ] Transfer status uses union type
- [ ] Navbar polling is visibility-aware

### Global
- [ ] `npm run build` passes with zero errors at every phase
- [ ] Each todo file renamed from `pending` → `complete` after fix

---

## Todo File Tracking

Existing todo files (rename after fix):
```
todos/001-pending-p1-... → todos/001-complete-p1-...  (A1)
todos/002-pending-p1-... → todos/002-complete-p1-...  (A3)
todos/003-pending-p1-... → todos/003-complete-p1-...  (A4)
todos/004-pending-p1-... → todos/004-complete-p1-...  (A5)
todos/005-pending-p1-... → todos/005-complete-p1-...  (A6)
todos/006-pending-p2-... → todos/006-complete-p2-...  (B3)
todos/007-pending-p2-... → todos/007-complete-p2-...  (B4)
todos/008-pending-p2-... → todos/008-complete-p2-...  (B6)
todos/010-pending-p2-... → todos/010-complete-p2-...  (C2)
todos/011-pending-p2-... → todos/011-complete-p2-...  (C3)
todos/013-pending-p2-... → todos/013-complete-p2-...  (C4)
todos/014-pending-p2-... → todos/014-complete-p2-...  (B2)
todos/015-pending-p3-... → todos/015-complete-p3-...  (B1, elevated)
todos/016-pending-p3-... → todos/016-complete-p3-...  (D7)
todos/017-pending-p3-... → todos/017-complete-p3-...  (D4)
todos/018-pending-p3-... → todos/018-complete-p3-...  (D5)
todos/019-pending-p3-... → todos/019-complete-p3-...  (D6)
```

Items without existing todos (A2, A7, A8, B1, B5, C1, C5, C6, D1-D3, D8-D9) — create completion notes inline or as new todo files.

**Skipped todos (superseded or deferred):**
- `009-pending-p2-players-api-500-row-client-filtering.md` → Deferred (D.1)
- `012-pending-p2-business-logic-duplication-actions-vs-api.md` → Deferred (D.3)

---

## Sources

### Internal
- Todo files: `todos/001-019` (19 detailed finding files)
- Full codebase audit: inline session prompt (29 findings from 6 review agents)
- Previous completed plan: `docs/plans/2026-03-02-refactor-full-codebase-review-fixes-plan.md`
- Key patterns: `src/lib/api-utils.ts`, `src/lib/transfer-helpers.ts`, `src/lib/validations.ts`

### Standards
- OWASP A01:2021 — Broken Access Control
- OWASP A03:2021 — Injection
- TypeScript strict mode
- Supabase RLS best practices
