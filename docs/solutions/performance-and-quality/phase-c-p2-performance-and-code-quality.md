---
title: "Phase C: P2 Performance & Code Quality — 6 Fixes"
date: "2026-03-02"
category: performance-and-quality
tags: [performance, code-quality, caching, react-cache, promise-all, n-plus-one, deduplication, usememo]
severity: P2
component: "API routes, detail pages, context providers, utils"
status: complete
commit: 09354fd
related:
  - docs/solutions/security-issues/postgrest-rls-auth-bypass-fixes.md
  - docs/solutions/security-issues/phase-b-p2-security-hardening.md
---

# Phase C: P2 Performance & Code Quality — 6 Fixes

Part of the [consolidated 29-finding remediation](../../plans/2026-03-02-refactor-consolidated-review-remediation-plan.md). Phase A covered security, Phase B covered validation/indexes, Phase C addresses performance and code quality.

## Problem Summary

Six issues identified across two independent code reviews:

1. **Duplicate queries** — `generateMetadata()` and page component both queried the same entity per request (3 detail pages)
2. **Sequential independent queries** — view counts and similar players fetched serially instead of in parallel
3. **N+1 player counts** — clubs API fetched all player IDs just to `.length` them
4. **Code duplication** — `Array.isArray(x) ? x : x ? [x] : []` pattern copied 11 times across 8 files
5. **Context provider instability** — `AuthContext` and `LanguageContext` created new value objects every render
6. **Scattered UUID validation** — 3 files defined their own `uuidRegex` instead of using shared `uuidSchema`

## Solutions

### C1: React.cache() for Detail Pages

**Files:** `players/[slug]/page.tsx`, `matches/[slug]/page.tsx`, `clubs/[slug]/page.tsx`

Supabase client does not participate in Next.js `fetch()` deduplication. Both `generateMetadata()` and the page component were making independent identical queries.

```typescript
import { cache } from 'react'

const getPlayer = cache(async (slug: string) => {
  const supabase = await createClient()
  return supabase.from('players').select(`/* full column list */`).eq('slug', slug).single()
})

// Both call the same cached function — only one DB query per request
export async function generateMetadata({ params }) {
  const { data: player } = await getPlayer((await params).slug)
  // ...
}

export default async function PlayerPage({ params }) {
  const { data: player } = await getPlayer((await params).slug)
  // ...
}
```

**Key decision:** Metadata previously used lighter selects (`name, position`). The cached function uses the full page-level select; metadata picks the fields it needs.

### C2: Sequential Queries to Promise.all

**Files:** `api/players/[id]/route.ts`, `(platform)/clubs/[slug]/page.tsx`

View count RPC and similar players query are independent — no need to wait for one before starting the other.

```typescript
// Before: ~2x latency (sequential)
const { data: viewCounts } = await supabase.rpc('get_player_view_counts', ...)
const { data: rawSimilar } = await supabase.from('players').select(...)...

// After: ~1x latency (parallel)
const [viewCountResult, similarResult] = await Promise.all([
  supabase.rpc('get_player_view_counts', { player_ids: [player.id] }).then(
    (res) => res,
    () => ({ data: null, error: { message: 'RPC failed' } }),
  ),
  supabase.from('players').select(...)...,
])
```

Same pattern applied to clubs/[slug] page — auth check and players query run in parallel since both only depend on `club.id`.

### C3: Clubs API Embedded Count

**File:** `api/clubs/route.ts`

Replaced fetching all player ID rows with Supabase's built-in count aggregation.

```typescript
// Before: fetches thousands of {id} objects, counts in JS
.select(`..., players ( id )`)
// player_count: Array.isArray(c.players) ? c.players.length : 0

// After: count computed in SQL, returns single number
.select(`..., player_count:players(count)`)
// player_count: Array.isArray(c.player_count) ? (c.player_count[0]?.count ?? 0) : 0
```

### C4: normalizeToArray Utility

**Files:** `utils.ts` + 8 consumer files (11 replacements total)

Supabase returns joined relations as `T | T[] | null` depending on the relationship. The normalization pattern was duplicated everywhere.

```typescript
// src/lib/utils.ts — new utility
export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

// Before (in 8+ files):
const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []

// After:
const statsArr = normalizeToArray(p.season_stats)
```

### C5: Context Provider useMemo

**Files:** `AuthContext.tsx`, `LanguageContext.tsx`

Provider values were new objects every render, causing all consumers (Navbar, sidebar, language selector) to re-render unnecessarily.

```typescript
// Before: new object reference every render
<AuthContext.Provider value={{ user, userRole, signOut }}>

// After: stable reference, only changes when deps change
const value = useMemo(() => ({ user, userRole, signOut }), [user, userRole, signOut])
<AuthContext.Provider value={value}>
```

### C6: Shared uuidSchema

**Files:** `player-views.ts`, `chat-upload/route.ts`, `players/[id]/pdf/route.ts`

Three files defined their own `uuidRegex`. Replaced with `uuidSchema.safeParse()` from `validations.ts`.

```typescript
// Before (3 files):
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!uuidRegex.test(id)) return ...

// After:
import { uuidSchema } from '@/lib/validations'
if (!uuidSchema.safeParse(id).success) return ...
```

## Prevention Guide

### Code Review Checklist

| Issue | What to grep for | Rule |
|-------|-----------------|------|
| Duplicate metadata queries | Two `createClient()` calls in a `page.tsx` with `generateMetadata` | Wrap fetch in `React.cache()` |
| Sequential independent queries | Multiple consecutive `await supabase.from(...)` with no data dependency | Use `Promise.all()` |
| N+1 counts | `players ( id )` or `.length` on query results | Use `player_count:players(count)` |
| Array normalization | `Array.isArray(x) ? x : x ? [x] : []` | Use `normalizeToArray()` from utils |
| Context instability | `<Provider value={{ ... }}>` without `useMemo` | Always `useMemo` provider values |
| Inline regex validation | `/^[0-9a-f]{8}-.../` in route files | Use `uuidSchema` from validations |

### Detection Commands

```bash
# Duplicate normalization patterns
grep -rn "Array\.isArray.*season_stats\|Array\.isArray.*club_history" src/ | grep -v utils.ts

# Inline UUID regex
grep -rn "uuidRegex" src/

# Pages with duplicate createClient
grep -rl "generateMetadata" src/app --include="*.tsx" | xargs -I{} sh -c 'echo "--- {} ---"; grep -c "await createClient" {}'

# Context providers without useMemo
grep -A5 "Provider value=" src/context/*.tsx | grep -v useMemo

# N+1 count patterns (fetching IDs just to count)
grep -n "players.*( id )" src/app/api/
```

## Impact

| Item | Type | Improvement |
|------|------|-------------|
| C1 | Performance | -1 DB query per detail page load (3 pages) |
| C2 | Performance | ~20-80ms faster player API + club page |
| C3 | Scalability | O(1) count vs O(N) ID fetch for club listing |
| C4 | Maintainability | 11 duplicated expressions → 1 utility |
| C5 | Performance | Eliminates unnecessary context consumer re-renders |
| C6 | Maintainability | 3 inline regex → 1 shared Zod schema |

## Files Changed

19 files, 293 insertions, 148 deletions. Key files:

- `src/lib/utils.ts` — added `normalizeToArray<T>()`
- `src/context/AuthContext.tsx` — added `useMemo`
- `src/context/LanguageContext.tsx` — added `useMemo`
- `src/app/(platform)/players/[slug]/page.tsx` — `React.cache()` + `normalizeToArray`
- `src/app/(platform)/matches/[slug]/page.tsx` — `React.cache()`
- `src/app/(platform)/clubs/[slug]/page.tsx` — `React.cache()` + `Promise.all`
- `src/app/api/players/[id]/route.ts` — `Promise.all` + `normalizeToArray`
- `src/app/api/clubs/route.ts` — embedded count
- `src/app/api/players/route.ts` — `normalizeToArray`
- `src/app/api/shortlist/route.ts` — `normalizeToArray`
- `src/app/api/clubs/[slug]/route.ts` — `normalizeToArray`
- `src/app/actions/player-views.ts` — `uuidSchema`
- `src/app/api/chat-upload/route.ts` — `uuidSchema`
- `src/app/api/players/[id]/pdf/route.ts` — `uuidSchema` + `normalizeToArray`
