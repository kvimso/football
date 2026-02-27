---
title: "refactor: Comprehensive Code Review Fixes"
type: refactor
status: completed
date: 2026-02-27
---

# Comprehensive Code Review Fixes

## Overview

An exhaustive 8-agent code review of all 152 TypeScript files (12,780 LOC) identified **44 unique findings** across security, type safety, performance, architecture, i18n, and code quality. This plan organizes every finding into 6 execution phases, ordered by severity and dependency. Each phase is independently committable.

**Review agents used:** kieran-typescript-reviewer, security-sentinel, performance-oracle, architecture-strategist, pattern-recognition-specialist, code-simplicity-reviewer, agent-native-reviewer, project-specific code-reviewer.

**Scope:** All files under `src/`. Phase D includes one database migration. No new features.

**Validated by:** SpecFlow Analyzer — identified 6 gaps, 4 edge cases, and 2 ordering issues, all incorporated below.

---

## Phase A: Critical Security & Build Fixes

**Priority:** P1 | **Risk:** High | **Effort:** ~30 min | **Branch:** `fix/security-and-build`

These fixes address real vulnerabilities and must ship first.

### A1. Add security headers to `next.config.ts`

**File:** `next.config.ts`

**Problem:** No security headers configured. The site is vulnerable to clickjacking, MIME sniffing, and other attacks.

**Fix:** Add a `headers()` function to the Next.js config:

```typescript
const nextConfig: NextConfig = {
  // ...existing config...
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}
```

### A2. Add HTML escaping to email templates

**File:** `src/lib/email-templates.ts`

**Problem:** User-controlled strings (`scoutName`, `scoutOrg`, `playerName`, `message`, `clubName`) are interpolated directly into HTML templates without escaping. A scout could inject `<script>` tags via their name or message.

**Fix:** Add an `escapeHtml` function at the top of the file and apply it to every user-controlled interpolation:

```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

Apply to all 3 template functions:
- `contactRequestReceivedEmail`: escape `scoutName`, `scoutOrg`, `playerName`, `message` (lines 42-52)
- `contactRequestStatusEmail`: escape `scoutName`, `playerName`, `clubName` (lines 55-73)
- `transferRequestReceivedEmail`: escape `playerName`, `fromClubName`, `toClubName` (lines 75-85)

Also escape the `subject` return values (lines 52, 72, 84) since those go into email subject headers.

### A3. Fix TOCTOU race condition in `claimFreeAgent`

**File:** `src/app/actions/admin-transfers.ts:167-206`

**Problem:** The function checks `player.club_id !== null || player.status !== 'free_agent'` (line 179), then updates without those conditions in the WHERE clause (line 185-188). Two concurrent claims could both pass the check and both succeed.

**Fix:** Add atomic WHERE conditions to the UPDATE:

```typescript
// Line 185-188: Change from:
const { error: updateErr } = await admin
  .from('players')
  .update({ club_id: clubId, status: 'active' as const, updated_at: new Date().toISOString() })
  .eq('id', playerId)

// To (IMPORTANT: must chain .select() with { count: 'exact' } to get affected row count):
const { error: updateErr, data: updated } = await admin
  .from('players')
  .update({ club_id: clubId, status: 'active' as const, updated_at: new Date().toISOString() })
  .eq('id', playerId)
  .is('club_id', null)
  .eq('status', 'free_agent')
  .select('id')

if (updateErr) return { error: updateErr.message }
if (!updated || updated.length === 0) return { error: 'Player is no longer a free agent' }
```

**Critical detail:** Supabase's `.update()` returns `null` for `data` by default. You MUST chain `.select('id')` to get matched rows back. Without `.select()`, `data` will always be `null` and you cannot verify the update matched. The `.select('id')` is lightweight (only returns the ID column) and lets you check `updated.length`.

### A5. Apply same TOCTOU fix to `releasePlayer`

**File:** `src/app/actions/admin-transfers.ts:36-39`

Same pattern as A3 — the release checks `player.club_id !== clubId` then updates without that condition. Add atomic WHERE:

```typescript
const { data: released } = await admin
  .from('players')
  .update({ club_id: null, status: 'free_agent' as const, updated_at: new Date().toISOString() })
  .eq('id', playerId)
  .eq('club_id', clubId)  // Atomic: only release if still at this club
  .select('id')

if (!released || released.length === 0) return { error: 'Player is no longer at your club' }
```

### A4. Verify build passes

After all Phase A changes, run `npm run build` to confirm no regressions.

---

## Phase B: Type Safety

**Priority:** P1-P2 | **Risk:** Medium | **Effort:** ~1 hour | **Branch:** `fix/type-safety`

These fixes close real type-safety holes where TypeScript is being bypassed.

### B1. Create shared domain types

**New file:** `src/lib/types.ts`

```typescript
import { POSITIONS, PREFERRED_FEET } from '@/lib/constants'

// Domain types derived from constants
export type Position = (typeof POSITIONS)[number]  // 'GK' | 'DEF' | 'MID' | 'ATT' | 'WNG' | 'ST'
export type PreferredFoot = (typeof PREFERRED_FEET)[number]  // 'Left' | 'Right' | 'Both'
export type PlayerStatus = 'active' | 'free_agent'
export type UserRole = 'scout' | 'academy_admin' | 'platform_admin'

// Server action result type (discriminated union)
export type ActionResult<T = void> =
  | { success: true } & (T extends void ? {} : { data: T })
  | { error: string }
```

### B2. Type `position` and `status` in component interfaces

> **IMPORTANT: Do B2 before B3.** Tightening the constants maps (B3) to `Record<Position, string>` will cause TypeScript errors if components still pass `string` as a key. Fix the component props first.

Update all component props that currently use `string` for position/status to use `Position`/`PlayerStatus` from `@/lib/types`. Key files:
- `src/components/player/PlayerCard.tsx:16,22`
- `src/components/player/PlayerProfileClient.tsx:12,19`
- `src/components/platform/PlatformPlayerForm.tsx:20`
- Any other component with `position: string` or `status: string` props

### B3. Type the constants maps with `Position` keys

**File:** `src/lib/constants.ts`

Change `Record<string, string>` to `Record<Position, string>` for both `POSITION_COLOR_CLASSES` (line 5) and `POSITION_BORDER_CLASSES` (line 14). Import `Position` from `types.ts`.

### B4. Fix server action parameter types

**Files (6 functions):**

| File | Function | Line |
|------|----------|------|
| `src/app/actions/admin-players.ts` | `createPlayer` | 8 |
| `src/app/actions/admin-players.ts` | `updatePlayer` | 69 |
| `src/app/actions/platform-players.ts` | `platformCreatePlayer` | 9 |
| `src/app/actions/platform-players.ts` | `platformUpdatePlayer` | 69 |
| `src/app/actions/platform-clubs.ts` | `createClub` | 10 |
| `src/app/actions/platform-clubs.ts` | `updateClub` | 48 |

**Fix:** Replace `Record<string, unknown>` with `z.infer<typeof schema>`:

```typescript
import { playerFormSchema } from '@/lib/validations'
import type { z } from 'zod'

type PlayerFormInput = z.infer<typeof playerFormSchema>

export async function createPlayer(data: PlayerFormInput) {
  // Zod parse still validates at runtime
  const parsed = playerFormSchema.safeParse(data)
  // ...
}
```

Do the same for club form actions using `clubFormSchema`.

**Note on `ActionResult<T>` type:** The type defined in B1 is available as a utility for new code. Existing server actions that return `{ success: true, playerName: string }` (like `claimFreeAgent`) do NOT need to be refactored to use `ActionResult<T>` — that would change the return shape and break consumers. Apply `ActionResult` only to new actions or during a future dedicated refactor.

### B5. Fix non-null assertions in PlayerForm

**Files:**
- `src/components/admin/PlayerForm.tsx:64` — `player!.id!`
- `src/components/platform/PlatformPlayerForm.tsx:74` — `player!.id!`

**Fix:** Replace double non-null assertion with a proper guard:

```typescript
if (isEditing) {
  if (!player?.id) {
    setError('Player ID is missing')
    setSaving(false)
    return
  }
  const result = await updatePlayer(player.id, playerData)
  // ...
}
```

### B6. Fix `FormData.get() as string` casts

**Files:**
- `src/components/admin/PlayerForm.tsx:51-60`
- `src/components/platform/PlatformPlayerForm.tsx:59-71`
- `src/components/platform/ClubForm.tsx:34-40`

**Fix:** Replace `form.get('field') as string` with `String(form.get('field') ?? '')`.

### B7. Type `userRole` as union in AuthContext

**File:** `src/context/AuthContext.tsx`

Change `userRole: string | null` to `userRole: UserRole | null` in the interface (line 13) and state (line 39). Import `UserRole` from `@/lib/types`.

### B8. Verify build passes

Run `npm run build` after all Phase B changes.

---

## Phase C: Shared Utilities & Deduplication

**Priority:** P2 | **Risk:** Low | **Effort:** ~1.5 hours | **Branch:** `refactor/shared-utilities`

Extract repeated patterns into shared utilities. Each extraction is mechanical and safe.

### C1. Add `unwrapRelation()` to `src/lib/utils.ts`

```typescript
export function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}
```

Then find-and-replace all 60+ instances of `Array.isArray(x) ? x[0] : x` across 21 files.

> **Edge case:** The current pattern returns `T | undefined` (when array is empty). The new helper returns `T | null`. At callsites where the result feeds into a type expecting `T | undefined`, you may need to adjust. Most callsites use `if (club)` checks which handle both `null` and `undefined`, so this is safe in practice. But verify each replacement compiles.

Key files with the most instances:

| File | Approx. instances |
|------|-------------------|
| `src/app/(platform)/players/[slug]/page.tsx` | 6 |
| `src/app/admin/page.tsx` | 5 |
| `src/app/admin/transfers/page.tsx` | 6 |
| `src/app/(platform)/matches/[slug]/page.tsx` | 5 |
| `src/app/platform/page.tsx` | 3 |
| `src/app/platform/scouts/[id]/page.tsx` | 4 |
| `src/app/(platform)/players/compare/page.tsx` | 3 |
| `src/app/(platform)/matches/page.tsx` | 2 |
| `src/app/admin/requests/page.tsx` | 2 |
| `src/app/dashboard/shortlist/page.tsx` | 2 |
| `src/app/dashboard/requests/page.tsx` | 2 |
| `src/app/platform/requests/page.tsx` | 2 |
| `src/app/platform/transfers/page.tsx` | 3 |
| `src/app/(platform)/clubs/[slug]/page.tsx` | 1 |
| `src/app/admin/layout.tsx` | 1 |
| `src/components/admin/TransferSearch.tsx` | 1 |
| `src/components/platform/PlatformRequestsList.tsx` | 1 |
| `src/app/actions/admin-transfers.ts` | 1 |
| `src/app/actions/admin-requests.ts` | 3 |
| `src/app/(platform)/players/page.tsx` | 1 |
| `src/app/platform/players/page.tsx` | 1 |

### C2. Add `todayDateString()` to `src/lib/utils.ts`

```typescript
export function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}
```

Replace all 7 instances:
- `src/app/actions/admin-transfers.ts:17-19` — delete `today()` function, import from utils
- `src/app/actions/platform-transfers.ts:9-11` — delete `today()` function, import from utils
- `src/app/actions/platform-players.ts:58` — inline `new Date().toISOString().split('T')[0]`
- `src/app/actions/platform-players.ts:111` — inline version
- `src/app/actions/admin-players.ts:56` — inline version

### C3. Move `splitName()` to `src/lib/utils.ts`

```typescript
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return { first: parts[0] ?? '', last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}
```

Remove the duplicate definitions from:
- `src/components/admin/PlayerForm.tsx:25-29`
- `src/components/platform/PlatformPlayerForm.tsx:33-37`

### C4. Standardize UUID validation

Create a shared schema in `src/lib/validations.ts`:

```typescript
export const uuidSchema = z.string().uuid()
```

Replace all local `const uuidSchema = z.string().uuid()` definitions in:
- `src/app/actions/admin-transfers.ts:10`
- `src/app/actions/platform-transfers.ts:7`
- `src/app/actions/admin-requests.ts:11`
- `src/app/actions/shortlist.ts:7`
- `src/app/actions/platform-requests.ts:7`

Also standardize the inline `z.string().uuid().safeParse()` patterns in:
- `src/app/actions/platform-players.ts:70,144`
- `src/app/actions/platform-clubs.ts:49,78`

And remove the hand-rolled regex in `src/app/actions/admin-players.ts:75-76` — replace with the shared Zod schema.

### C5. Deduplicate `createAdminClient()` in admin dashboard

**File:** `src/app/admin/page.tsx`

The admin dashboard creates `createAdminClient()` 6 times inside separate IIFEs within `Promise.all()` (lines 82, 96, 117, 132, 148, 163). Create the client once at the top and reuse it:

```typescript
const admin = createAdminClient()

const [playersResult, ...] = await Promise.all([
  admin.from('players').select('...').eq('club_id', clubId),
  admin.from('contact_requests').select('...'),
  // ... use `admin` everywhere instead of creating new clients
])
```

### C6. Add `escapePostgrestValue()` to `src/lib/utils.ts`

The function at `src/app/actions/admin-transfers.ts:13-15` and the inline equivalent at `src/app/(platform)/players/page.tsx:112` perform the same sanitization. Extract to utils:

```typescript
export function escapePostgrestValue(value: string): string {
  return value.replace(/[,.()"\\%_]/g, '')
}
```

### C7. Verify build passes

Run `npm run build` after all Phase C changes.

---

## Phase D: Performance

**Priority:** P2 | **Risk:** Medium | **Effort:** ~1 hour | **Branch:** `fix/performance`

### D1. Create database function for player view counts

**New migration file:** `supabase/migrations/YYYYMMDDHHMMSS_add_player_view_count_function.sql`

```sql
CREATE OR REPLACE FUNCTION get_player_view_counts()
RETURNS TABLE(player_id uuid, total_views bigint, weekly_views bigint) AS $$
  SELECT
    player_id,
    COUNT(*) AS total_views,
    COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') AS weekly_views
  FROM player_views
  GROUP BY player_id
$$ LANGUAGE sql STABLE;
```

Add a SELECT RLS policy on `player_views` for authenticated users to read, so we can stop using the admin client for this:

```sql
CREATE POLICY "Authenticated users can read player views"
  ON player_views FOR SELECT
  TO authenticated
  USING (true);
```

After creating the migration, regenerate types:
- **If local Supabase is running (Docker):** `npx supabase gen types typescript --local > src/lib/database.types.ts`
- **Fallback (no Docker):** `npx supabase gen types typescript --project-id jodnjhqnoawsxigrxqgv > src/lib/database.types.ts`

> **D2, D3, and D4 are blocked by D1.** The RPC function must exist and types must be regenerated before any calling code will compile.

### D2. Replace 10k-row fetch in players page

**File:** `src/app/(platform)/players/page.tsx:162-180`

Replace the `createAdminClient()` + `.select('player_id').limit(10000)` pattern with an RPC call using the regular client:

```typescript
const { data: viewCounts } = await supabase.rpc('get_player_view_counts')
if (viewCounts) {
  viewCountMap = new Map(viewCounts.map(v => [v.player_id, Number(v.total_views)]))
}
```

This also removes the `createAdminClient` import from this file (fixes P1-8: service role client in platform pages).

### D3. Replace 10k-row fetch in admin dashboard

**File:** `src/app/admin/page.tsx:148-172`

Replace the raw `player_views` query with the RPC. The admin dashboard needs per-player breakdown for its club's players, so filter the RPC results client-side:

```typescript
const { data: allViewCounts } = await admin.rpc('get_player_view_counts')
const clubViewCounts = (allViewCounts ?? []).filter(v => playerIds.includes(v.player_id))
const viewsAllTime = clubViewCounts.reduce((sum, v) => sum + Number(v.total_views), 0)
```

This replaces both the per-player views query AND the `viewsAllTimeResult` count query (lines 160-172) with a single RPC call.

Note: `admin/page.tsx` is NOT inside `(platform)` route group — it's a top-level `/admin` route. The `createAdminClient()` usage here is acceptable since it's an admin page. However, using the RPC still eliminates the 10k-row fetch.

### D4. Replace admin client in player profile page

**File:** `src/app/(platform)/players/[slug]/page.tsx:77-107`

The player profile page uses `createAdminClient()` to run 3 separate count queries: total views, last-7-day views, and previous-7-day views (for trend calculation). The RPC from D1 only returns `total_views` and `weekly_views` — it does NOT return the previous week's count needed for trend percentage.

**Two options (pick one):**

**Option A (recommended): Keep 3 direct queries but use the regular `supabase` client.** The RLS policy added in D1 allows authenticated users to SELECT from `player_views`. Replace `createAdminClient()` with the regular `supabase` client (already available in this page). No logic changes needed — just swap the client:

```typescript
// Replace: const admin = createAdminClient()
// Use: const supabase (already created on line 42)
const [totalResult, recentResult, previousResult] = await Promise.all([
  supabase.from('player_views').select('id', { count: 'exact', head: true }).eq('player_id', player.id),
  supabase.from('player_views').select('id', { count: 'exact', head: true }).eq('player_id', player.id).gte('viewed_at', sevenDaysAgo),
  supabase.from('player_views').select('id', { count: 'exact', head: true }).eq('player_id', player.id).gte('viewed_at', fourteenDaysAgo).lt('viewed_at', sevenDaysAgo),
])
```

**Option B: Extend the RPC function to include `previous_week_views`.** Add a third column to `get_player_view_counts()`:
```sql
COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '14 days' AND viewed_at < NOW() - INTERVAL '7 days') AS prev_week_views
```
Then call the RPC and filter for the single player. This is cleaner but requires updating the migration and regenerating types again.

### D5. Include free agents in compare page

**File:** `src/app/(platform)/players/compare/page.tsx:48`

Change `.eq('status', 'active')` to `.in('status', ['active', 'free_agent'])` so free agents can be compared too.

### D6. Verify build passes

Run `npm run build && npm run lint` after all Phase D changes.

---

## Phase E: i18n Compliance

**Priority:** P2 | **Risk:** Low | **Effort:** ~2 hours | **Branch:** `fix/i18n-compliance`

This is the largest phase by file count. Every hardcoded English string violates CLAUDE.md. There are **82+ instances** across 17 files.

### E1. Add missing translation keys to `src/lib/translations.ts`

Add these new keys to both `en` and `ka` sections:

```typescript
// Roles
'roles.scout': 'Scout' / 'სკაუტი',
'roles.admin': 'Admin' / 'ადმინი',
'roles.platform': 'Platform' / 'პლატფორმა',

// Landing mock card (for LandingHero)
'landing.mockPlayerName': 'Giorgi B.' / 'გიორგი ბ.',
'landing.mockPosition': 'MF' / 'ნშმ',
'landing.mockAge': '17 yrs' / '17 წ.',
'landing.mockClub': 'FC Dinamo Tbilisi' / 'დინამო თბილისი',
'landing.verifiedStats': 'Verified Stats' / 'ვერიფიცირებული სტატისტიკა',
'landing.mockGoals': 'Goals' / 'გოლი',
'landing.mockAssists': 'Assists' / 'ასისტი',
'landing.mockMatches': 'Matches' / 'მატჩი',

// Common fallbacks
'common.unknown': 'Unknown' / 'უცნობი',
'common.unknownScout': 'Unknown Scout' / 'უცნობი სკაუტი',
'common.unknownClub': 'the club' / 'კლუბი',

// Server action error messages (keys for client-side lookup)
'errors.unauthorized': 'Unauthorized' / 'არაავტორიზებული',
'errors.invalidId': 'Invalid ID' / 'არასწორი ID',
'errors.invalidInput': 'Invalid input' / 'არასწორი მონაცემები',
'errors.notAuthenticated': 'Not authenticated' / 'არ ხართ ავტორიზებული',
'errors.playerNotFound': 'Player not found' / 'მოთამაშე ვერ მოიძებნა',
'errors.requestNotFound': 'Request not found' / 'მოთხოვნა ვერ მოიძებნა',
'errors.requestNoLongerPending': 'Request is no longer pending' / 'მოთხოვნა აღარ არის მოლოდინში',
'errors.playerNotFreeAgent': 'Player is not a free agent' / 'მოთამაშე არ არის თავისუფალი აგენტი',
'errors.playerAlreadyAtClub': 'Player is already at your club' / 'მოთამაშე უკვე თქვენს კლუბშია',
'errors.transferAlreadyPending': 'A transfer request is already pending' / 'ტრანსფერის მოთხოვნა უკვე მოლოდინშია',
'errors.contactNotAvailableForFreeAgents': 'Contact is not available for free agents' / 'კონტაქტი მიუწვდომელია თავისუფალი აგენტებისთვის',
'errors.alreadySentRequest': 'You have already sent a request for this player' / 'თქვენ უკვე გაგზავნეთ მოთხოვნა ამ მოთამაშეზე',
'errors.notesTooLong': 'Notes too long (max 2000 characters)' / 'შენიშვნა ძალიან გრძელია (მაქს. 2000 სიმბოლო)',
'errors.playerNoLongerAtClub': 'Player is no longer at your club' / 'მოთამაშე აღარ არის თქვენს კლუბში',
'errors.clubNotFound': 'Club not found' / 'კლუბი ვერ მოიძებნა',
'errors.alreadyAdmin': 'This user is already an academy admin' / 'ეს მომხმარებელი უკვე არის აკადემიის ადმინი',
'errors.failedToSendMessage': 'Failed to send message. Please try again.' / 'შეტყობინების გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.',
```

### E2. Fix hardcoded role labels in Navbar

**File:** `src/components/layout/Navbar.tsx:41-45`

Replace:
```typescript
const ROLE_LABELS: Record<string, string> = {
  scout: 'Scout',
  academy_admin: 'Admin',
  platform_admin: 'Platform',
}
```

With dynamic lookup using `t()` (Navbar already has `useLang()`):
```typescript
const roleLabel = userRole ? t(`roles.${userRole === 'academy_admin' ? 'admin' : userRole === 'platform_admin' ? 'platform' : 'scout'}`) : ''
```

Or create a simple mapping object with translation keys and look them up.

### E3. Fix hardcoded strings in LandingHero mock card

**File:** `src/components/landing/LandingHero.tsx:83-123`

Replace all inline bilingual ternaries (`lang === 'ka' ? '...' : '...'`) with `t()` calls. This is a server component using `getServerT()`, so use `t('landing.mockPlayerName')`, etc. Also fix the fully hardcoded `"Verified Stats"` on line 123.

### E4. Fix hardcoded 'Unknown' fallbacks across platform

Replace all hardcoded `'Unknown'` and `'Unknown Scout'` strings with `t('common.unknown')` or `t('common.unknownScout')`:

| File | Line | Replace with |
|------|------|-------------|
| `src/components/platform/PlatformTransfersList.tsx` | 58 | `t('common.unknown')` |
| `src/components/platform/PlatformRequestsList.tsx` | 53 | `t('common.unknownScout')` |
| `src/components/platform/PlatformRequestsList.tsx` | 60 | `t('common.unknown')` |
| `src/app/platform/page.tsx` | 152 | Use `getServerT()` then `t('common.unknown')` |
| `src/app/platform/scouts/[id]/page.tsx` | 91, 126 | Use `getServerT()` then `t('common.unknown')` |

### E5. Fix server action error messages

**Strategy:** Server actions cannot easily use `t()` since they don't know the user's language. Instead, return **error keys** from server actions (e.g., `'errors.unauthorized'`) and let the client components translate them.

**IMPORTANT: Apply E5 atomically across ALL action files and ALL client consumers in one pass.** Partial application will leave some users seeing raw translation keys like `errors.unauthorized` instead of "Unauthorized". If you cannot finish all 12 action files + all client error handlers in one session, skip E5 entirely and come back to it.

Create a helper in the client that translates action error results:

```typescript
// In each client component that handles action results:
const errorMessage = result.error.startsWith('errors.')
  ? t(result.error)
  : result.error  // fallback for raw Supabase error messages
```

**Note on Supabase errors:** Raw Supabase error messages (e.g., `"duplicate key value violates unique constraint"`) will pass through untranslated. This is acceptable — these are rare edge cases. If you want to sanitize them, wrap in the server action: `return { error: supabaseError.message.includes('duplicate') ? 'errors.alreadyExists' : 'errors.genericError' }`

Then in all 12 server action files, replace hardcoded English strings with translation keys. The full list of **93 error string replacements** is documented in the research output. Key patterns:

- `'Unauthorized'` → `'errors.unauthorized'` (appears ~15 times)
- `'Invalid ID'` → `'errors.invalidId'` (appears ~12 times)
- `'Invalid input'` → `'errors.invalidInput'` (appears ~6 times)
- `'Not authenticated'` → `'errors.notAuthenticated'` (appears ~5 times)
- `'Player not found'` → `'errors.playerNotFound'` (appears ~4 times)
- And 15+ more unique messages (see E1 key list above)

**Files to update:**
- `src/app/actions/admin-players.ts` (7 strings)
- `src/app/actions/admin-transfers.ts` (18 strings)
- `src/app/actions/admin-requests.ts` (6 strings)
- `src/app/actions/admin-invite.ts` (5 strings)
- `src/app/actions/contact.ts` (5 strings)
- `src/app/actions/contact-message.ts` (2 strings)
- `src/app/actions/shortlist.ts` (7 strings)
- `src/app/actions/platform-players.ts` (7 strings)
- `src/app/actions/platform-clubs.ts` (6 strings)
- `src/app/actions/platform-transfers.ts` (8 strings)
- `src/app/actions/platform-requests.ts` (4 strings)

### E6. Replace `alert()` with inline error state

**Files:**
- `src/components/platform/PlatformRequestsList.tsx:31`
- `src/components/platform/PlatformTransfersList.tsx:33`

Replace `alert(result.error)` with state-based error display (matching pattern used in admin `RequestActions` and `TransferActions` components):

```typescript
const [error, setError] = useState<string | null>(null)

// In handler:
if (result.error) {
  const msg = result.error.startsWith('errors.') ? t(result.error) : result.error
  setError(msg)
}

// In JSX:
{error && (
  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
    {error}
  </div>
)}
```

### E7. Email template strings

**File:** `src/lib/email-templates.ts`

Email templates have 11+ hardcoded English strings. Since emails are sent server-side, the simplest approach is to keep them English-only for now (international scouts are the primary email recipients). Add a `// TODO: i18n email templates when needed` comment.

**Low priority** — emails are less user-facing than the platform UI. Can be addressed later by accepting a `lang` parameter and looking up templates per language.

### E8. Verify build passes

Run `npm run build` after all Phase E changes.

---

## Phase F: Dead Code & Cleanup

**Priority:** P3 | **Risk:** Low | **Effort:** ~45 min | **Branch:** `fix/dead-code-cleanup`

### F1. Remove unreachable `/admin/invite` route

**Files to delete:**
- `src/app/admin/invite/page.tsx` (38 lines)
- `src/app/admin/invite/loading.tsx` (24 lines)

**Why:** The admin layout redirects all non-`academy_admin` users away, but the invite page checks for `platform_admin` role (line 19). This means no one can reach it — `academy_admin` users can access the route group but the page rejects them; `platform_admin` users get redirected by the layout. The working invite page is at `/platform/invite/`.

Also remove the conditional invite link from `src/components/admin/AdminSidebar.tsx:59` (the `role === 'platform_admin'` check for the Invite link).

### F2. Remove unused icon components

**File:** `src/components/ui/Icons.tsx`

Remove `SearchIcon`, `ChartIcon`, and `UsersIcon` — they are defined but never imported anywhere. (~23 lines)

### F3. Remove dead translation keys

**File:** `src/lib/translations.ts`

Remove 10 dead `home.*` keys from both `en` and `ka` sections. These are leftover from the pre-Phase 6 landing page and are no longer referenced:
- `home.title`, `home.subtitle`, `home.featuredPlayers`, `home.recentMatches`, `home.platformStats`, `home.totalPlayers`, `home.totalClubs`, `home.totalMatches`, `home.viewAll`, `home.noMatches`

### F4. Fix `isLoading` in AuthContext

**File:** `src/context/AuthContext.tsx:40`

Current code: `const [isLoading] = useState(false)` — the setter is destructured away, so `isLoading` is always `false`.

Since the AuthProvider receives server-side initial state and never truly "loads", the simplest fix is to **remove `isLoading` entirely**:

1. Remove `isLoading` from the `AuthState` interface (line 14)
2. Remove `isLoading: true` from the default context value (line 21)
3. Remove `const [isLoading] = useState(false)` (line 40)
4. Remove `isLoading` from the Provider value (line 76)

**Verified safe:** A grep for `isLoading` across `src/` shows it is only referenced in `AuthContext.tsx` itself. The `isLoading` in `TransferActions.tsx:33` is a local variable unrelated to AuthContext. No consumers destructure `isLoading` from `useAuth()`, so removal is safe.

If any consumer is added in the future that legitimately needs a loading state, set it properly:
```typescript
const [isLoading, setIsLoading] = useState(!initialUser)
// Then setIsLoading(false) after onAuthStateChange fires
```

### F5. Clean up empty API directories

**Verify first:** Run `find src/app/api -type f` to confirm these directories are truly empty (confirmed empty as of 2026-02-27).

Delete these empty directories (their functionality was moved to server actions):
- `src/app/api/contact/`
- `src/app/api/pixellot/sync/`
- `src/app/api/pixellot/webhook/`
- `src/app/api/players/search/`

Keep `src/app/api/pixellot/` parent directory with a `.gitkeep` for Phase 7 (camera integration). Delete the others entirely with `rm -rf`.

### F6. Convert `LandingFooter` to server component

**File:** `src/components/landing/LandingFooter.tsx`

Remove `'use client'`, replace `useLang()` with `getServerT()`, and make the component `async`. It has no interactive state, event handlers, or effects — it only uses translations.

### F7. Add `void` to fire-and-forget promises

**File:** `src/app/(platform)/players/[slug]/page.tsx:74-75`

Add `void` prefix to signal intentional fire-and-forget:
```typescript
void trackPageView({ pageType: 'player', entityId: player.id, entitySlug: player.slug })
void trackPlayerView(player.id)
```

### F8. Log errors in AuthContext catch block

**File:** `src/context/AuthContext.tsx:63-65`

Change the empty catch to at least log the error:
```typescript
} catch (err) {
  console.error('Failed to initialize Supabase auth listener:', err)
}
```

### F9. Verify build passes

Run `npm run build && npm run lint` after all Phase F changes.

---

## Acceptance Criteria

### Per-Phase

- [x] Phase A: Security headers present, email templates escaped, claimFreeAgent atomic, build passes
- [x] Phase B: No `Record<string, unknown>` in actions, no `as string` casts on FormData, shared types used, build passes
- [x] Phase C: `unwrapRelation()` used everywhere (0 remaining `Array.isArray` patterns for relation unwrapping), no duplicate helpers, build passes
- [x] Phase D: No `createAdminClient()` in `(platform)` pages, view counts use DB aggregation, build passes
- [x] Phase E: Zero hardcoded English strings in components (grep for `'Unknown'`, `'Unauthorized'`, `ROLE_LABELS`), all use `t()` or error keys, build passes
- [x] Phase F: No dead code, no empty directories, isLoading fixed/removed, build passes

### Overall

- [x] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [x] No regressions in existing functionality
- [x] Each phase has its own commit with descriptive message

---

## Implementation Notes for Claude Code Sessions

### How to use this plan

Each phase is independent and can be executed in a separate Claude Code session. Phases A-C have no dependencies on each other. Phase D depends on a database migration. Phase E is the largest and can be split across multiple sessions.

**Recommended per-session approach:**
1. Read this plan
2. Pick one phase (A through F)
3. Make all changes in that phase
4. Run `npm run build` to verify
5. Commit with message: `fix: Phase X — <description>`

### Key files to read before starting

- `src/lib/constants.ts` — position/foot constants
- `src/lib/validations.ts` — Zod schemas
- `src/lib/translations.ts` — all translation keys (1077 lines)
- `src/lib/utils.ts` — existing utility functions
- `src/context/AuthContext.tsx` — auth context
- `src/lib/email-templates.ts` — email templates
- `next.config.ts` — Next.js config

### Testing strategy

- Run `npm run build` after every phase (catches type errors)
- Run `npm run lint` after phases D and F
- For Phase D (database changes): test locally with `npx supabase start` first, then `npx supabase db push` to remote

---

## Known Risks Not In Scope

These issues were identified during review but are intentionally excluded from this plan:

1. **`acceptTransfer` has no transaction/rollback.** It runs 5 sequential writes (update request → cancel others → transfer player → close old history → insert new history). If step 3 fails, the request is marked "accepted" but the player stays at the old club. A proper fix requires a Supabase RPC wrapping all 5 operations in a single SQL transaction. **Deferred:** Low probability with current user count; fix when transaction support is added.

2. **Admin/Dashboard/Platform routes outside `(platform)` route group.** These top-level routes duplicate the auth guard pattern. Moving them inside `(platform)` would eliminate ~100 lines of duplicate auth code but is a major structural refactor that changes URL paths. **Deferred:** Architectural cleanup, not a bug fix.

3. **Duplicate admin vs platform action files.** `admin-players.ts` vs `platform-players.ts`, `admin-transfers.ts` vs `platform-transfers.ts`, etc. share ~60% of their logic. Extracting shared operations would save ~200 lines but requires careful testing. **Deferred:** Code quality improvement, not a bug fix.

4. **Duplicate `PlayerForm` / `PlatformPlayerForm` components.** ~200 lines of near-identical code. Should be unified into a single configurable component. **Deferred:** Same reason as #3.

5. **Duplicate `AdminSidebar` / `PlatformSidebar` components.** Same UI pattern, different links. Should be a generic `Sidebar` component. **Deferred:** Same reason as #3.

6. **No rate limiting on API routes / server actions.** Supabase Auth has built-in rate limiting on auth endpoints. Application-level rate limiting would require middleware changes. **Deferred:** Phase 8 (Polish & Launch).

---

## Sources

### Review Agents (run 2026-02-27)
- kieran-typescript-reviewer: 23 findings (4 critical, 13 warning, 6 suggestion)
- security-sentinel: security headers, HTML injection, rate limiting findings
- performance-oracle: 10k-row fetch, redundant queries, duplicate auth checks
- architecture-strategist: route group structure, duplicate layouts, admin client usage
- pattern-recognition-specialist: Array.isArray pattern (60+), duplicate helpers
- code-simplicity-reviewer: dead code, YAGNI violations, redundant queries
- agent-native-reviewer: agent parity analysis
- project-specific code-reviewer: 28 findings (5 critical, 11 warning, 12 suggestion)

### Key Files Referenced
- `next.config.ts` — security headers target
- `src/lib/email-templates.ts:42-85` — XSS vulnerability
- `src/app/actions/admin-transfers.ts:167-206` — TOCTOU race condition
- `src/context/AuthContext.tsx:40` — isLoading bug
- `src/app/(platform)/players/page.tsx:162-180` — 10k row fetch
- `src/lib/constants.ts:5,14` — loose Record types

---

## Handoff Instructions for New Claude Code Sessions

### What to say when starting a new session

Copy-paste one of these prompts depending on which phase you want to execute:

**For Phase A (Security — do this first):**
```
Read the plan at docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md, then execute Phase A (Critical Security & Build Fixes). This includes: adding security headers to next.config.ts, adding HTML escaping to email templates, fixing the TOCTOU race condition in claimFreeAgent and releasePlayer. Run npm run build when done to verify. Commit as: fix: add security headers, HTML escaping, and atomic transfer operations
```

**For Phase B (Type Safety):**
```
Read the plan at docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md, then execute Phase B (Type Safety). This includes: creating shared domain types in src/lib/types.ts, typing component props with Position/PlayerStatus/UserRole, fixing server action params from Record<string, unknown> to z.infer, fixing non-null assertions and FormData casts. IMPORTANT: Do B2 before B3 (component props before constants). Run npm run build when done. Commit as: fix: add shared domain types and close type-safety holes
```

**For Phase C (Deduplication):**
```
Read the plan at docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md, then execute Phase C (Shared Utilities & Deduplication). This includes: adding unwrapRelation(), todayDateString(), splitName(), escapePostgrestValue() to utils.ts, replacing 60+ Array.isArray patterns, standardizing UUID validation, deduplicating createAdminClient calls in admin dashboard. Run npm run build when done. Commit as: refactor: extract shared utilities and eliminate code duplication
```

**For Phase D (Performance — requires database migration):**
```
Read the plan at docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md, then execute Phase D (Performance). This includes a database migration to create get_player_view_counts() RPC and add an RLS policy on player_views, then replacing the 10k-row fetches in the players page and admin dashboard with the RPC. For the player profile page, use Option A (swap admin client for regular client). Include free agents in compare page. Run npm run build when done. Commit as: fix: replace unbounded view count queries with database aggregation
```

**For Phase E (i18n — largest phase, can split):**
```
Read the plan at docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md, then execute Phase E (i18n Compliance). This includes: adding translation keys, fixing hardcoded role labels in Navbar, fixing LandingHero mock card strings, fixing 'Unknown' fallbacks, converting server action error messages to translation keys, replacing alert() with inline errors. IMPORTANT: E5 (action error keys) must be applied atomically across all files or skipped entirely. Run npm run build when done. Commit as: fix: resolve all i18n violations with proper translation keys
```

**For Phase F (Dead Code Cleanup):**
```
Read the plan at docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md, then execute Phase F (Dead Code & Cleanup). This includes: removing unreachable /admin/invite route, removing unused icon components, removing dead translation keys, removing isLoading from AuthContext, cleaning up empty API directories, converting LandingFooter to server component, adding void to fire-and-forget promises. Run npm run build when done. Commit as: fix: remove dead code and clean up unused artifacts
```

### Phase execution order

**Recommended order:** A → F → C → B → D → E

- **A first** — security fixes are highest priority
- **F next** — quick dead code removal, low risk, cleans up the codebase for subsequent phases
- **C next** — shared utilities make B and E easier (e.g., `unwrapRelation` reduces noise)
- **B next** — type safety improvements, depends on nothing
- **D next** — requires a DB migration, test carefully
- **E last** — largest phase, benefits from all prior cleanup

Phases A, B, C, F have zero dependencies on each other and can technically run in any order. D depends on its own migration. E should come after the codebase is otherwise clean.

### After all phases are done

Run these verification commands:
```bash
npm run build    # Must pass with 0 errors
npm run lint     # Must pass with 0 warnings
```

Then push all commits and deploy:
```bash
git push origin feat/advanced-player-filters  # Or whatever branch
npx vercel --prod --force                      # Deploy to production
```
