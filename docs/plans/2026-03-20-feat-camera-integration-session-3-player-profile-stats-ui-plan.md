---
title: "Camera Integration Session 3: Player Profile Camera Stats UI"
type: feat
status: completed
date: 2026-03-20
origin: docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md
---

# Camera Integration Session 3: Player Profile Camera Stats UI

## Enhancement Summary

**Deepened on:** 2026-03-20
**Agents used:** 9 completed (kieran-typescript-reviewer, code-simplicity-reviewer, performance-oracle, architecture-strategist, pattern-recognition-specialist, security-sentinel, framework-docs-researcher, theme-redesign-learning, accessibility-learning)

### Critical Fixes (3)

1. **Variable shadowing in `getRatingColor`** — plan used `t` as both outer variable and `.find()` callback parameter. Rename to `tier`/`threshold` to avoid ESLint `no-shadow` warning. *(TypeScript + Pattern Recognition)*
2. **Rating badge needs screen reader text** — color alone conveys quality tier. Add `sr-only` span with tier label (`"excellent"`, `"good"`, etc.) for accessibility. Same applies to match row ratings. *(Accessibility Learning)*
3. **`as unknown as CameraSkills` cast may be unnecessary** — `database.types.ts` already declares `isOneToOne: true` for `player_skills_player_id_fkey`, meaning postgrest-js v2.95.3 infers a single object. Investigate removing cast; at minimum add explanatory comment. *(Framework Docs)*

### High-Priority Improvements (5)

4. **Move `getRatingColor()` to `utils.ts`** — `constants.ts` contains only data (zero functions). Keep `RATING_THRESHOLDS` in constants, move the function to utils. *(Pattern Recognition)*
5. **Use `bg-primary-muted` instead of `bg-primary/15`** — matches existing design system pattern (used at page.tsx line 489). *(Pattern Recognition + Theme Learning)*
6. **Keep `label` in RATING_THRESHOLDS, drop `bg`** — `label` is needed for accessibility sr-only text. `bg` is not consumed by any code in this plan. *(Accessibility overrides Simplicity)*
7. **Let TypeScript infer return type** from `as const` array — explicit `{ readonly class: string; ... }` widens literal types. Use `type RatingTier = (typeof RATING_THRESHOLDS)[number]` if annotation desired. *(TypeScript)*
8. **Define `SeasonAccumulator` as explicit interface** — the reduce accumulator is only implicitly typed. Named interface makes the shape documented and enforced. *(TypeScript)*

### Medium-Priority Improvements (5)

9. **Use server-side ORDER BY where possible** — `.order('joined_at', { referencedTable: 'player_club_history', ascending: false })` for club_history. Keep client-side sort for match_stats (nested join depth limitation in PostgREST). *(Performance + Framework Docs)*
10. **Add sync-warning comments above Pick<> types** — "These columns must match the select string. Pick validates names against schema but does NOT verify they are fetched." *(TypeScript)*
11. **Define `MatchStatWithMatch` combined type** — `MatchStatScalars & { match: { ... } | null }` for the full match stat + join shape. *(TypeScript)*
12. **Add TODO at season aggregation** — "Extract to `src/lib/camera/stats.ts` when PDF route needs camera stats." *(Architecture)*
13. **Document 30-50 match pagination threshold** in deferred items — DOM analysis shows ~3,450 nodes at 30 matches (up from ~990). Mobile performance degrades above 3,000-5,000 nodes in a scroll section. *(Performance)*

### Informational (validated safe)

14. **All rating color tokens pass WCAG AA** on `bg-surface` in both light and dark themes. *(Theme Learning)*
15. **Position colors as category colors is safe** — tokens are contrast-verified in both themes. Use matching `-bg` token for tinted backgrounds. *(Theme Learning)*
16. **No security blockers** — read-only display, no new attack surface, React escapes all rendered values. *(Security)*
17. **Zero client bundle impact** — no new client components added. *(Performance)*
18. **6 additional columns add ~48 bytes per match row** — no measurable query impact. *(Performance)*

---

## Overview

Enhance the player profile page (`/players/[slug]`) with categorized match stat breakdowns, season aggregation, and a color-coded rating system. Implements design spec section 4a (Player Profile — Camera Stats). Heatmap (4b) and TrendChart deferred until real data exists.

**Scope: 1 new file + 4 modified files = 5 files.**

## Problem Statement

After Sessions 1-2, the player profile page shows camera data in basic form: a radar chart with 6 category totals and expandable match rows with 6 stats (minutes, pass%, distance, shots, tackles, interceptions). Scouts need:

- **Detailed per-match breakdown** — attacking, passing, defending, physical categories (current expansion only shows 6 stats)
- **Season aggregation** — totals across all matches (the dropped `player_season_stats` table has no replacement yet)
- **Prominent rating** — the overall rating should be the first thing scouts see, color-coded by quality
- **Consistent rating colors** — the match row rating (line 662) uses a 3-tier inline ternary, inconsistent with the design spec's 4-tier system

**Deferred to later sessions:**
- ~~Heatmap~~ — unknown grid key encoding, zero data in DB
- ~~TrendChart~~ — zero data, useless with <5 match points
- ~~Match page full report~~ — Session 4

## Proposed Solution

1. **MatchStatDetail** — new component for categorized per-match stat breakdown (Attacking, Passing, Defending, Physical)
2. **Season Summary** — inline computed aggregation in page.tsx (grid of stat cards above skills section)
3. **Rating Badge** — color-coded overall rating replaces `CountUpStat` for overall in hero section, with screen reader tier text
4. **`RATING_THRESHOLDS` in constants.ts + `getRatingColor()` in utils.ts** — shared helper used by both rating badge and match row
5. **Expanded query** — 6 additional scalar columns from `match_player_stats`
6. **~15 new translation keys** (en + ka)

## Technical Approach

### Type Derivation from database.types.ts

Replace hand-written `CameraSkills` and `MatchStat` local types with derived types:

```ts
import type { Database } from '@/lib/database.types'

type PlayerSkillsRow = Database['public']['Tables']['player_skills']['Row']
type MatchPlayerStatsRow = Database['public']['Tables']['match_player_stats']['Row']

// IMPORTANT: These columns must match the select string in the Supabase query below.
// Pick<> validates column names against the schema, but does NOT verify they are fetched.
type CameraSkills = Pick<PlayerSkillsRow,
  'overall' | 'attack' | 'defence' | 'fitness' | 'dribbling' | 'shooting' |
  'possession' | 'tackling' | 'positioning' | 'matches_counted' | 'last_updated'>

type MatchStatScalars = Pick<MatchPlayerStatsRow,
  'minutes_played' | 'goals' | 'assists' | 'pass_success_rate' |
  'shots' | 'shots_on_target' | 'tackles' | 'interceptions' |
  'distance_m' | 'sprints_count' | 'overall_rating' |
  'key_passes' | 'passes_total' | 'passes_successful' |
  'dribbles_success' | 'dribbles_fail' | 'speed_avg'>

// Combined type for match stats with nested join
type MatchStatWithMatch = MatchStatScalars & {
  match: {
    slug: string
    match_date: string
    competition: string
    home_club: { name: string; name_ka: string } | null
    away_club: { name: string; name_ka: string } | null
  } | null
}
```

**Note on `as unknown as` casts:** The generated `database.types.ts` declares `isOneToOne: true` for `player_skills_player_id_fkey`, which means postgrest-js v2.95.3 should infer `player.skills` as a single object (not an array). **Try removing the cast first.** If the inferred types are correct, also remove the `unwrapRelation()` call for `player.skills`. If the cast is still needed (runtime mismatch), keep it with an explanatory comment:

```ts
// PostgREST returns one-to-one joins as arrays at runtime despite typed as objects
const skills = unwrapRelation(player.skills as unknown as CameraSkills | CameraSkills[])
```

### Stat-to-Category Mapping (MatchStatDetail)

Explicit mapping for the 4 categories. Hardcode these directly in JSX — no config object or dynamic renderer:

| Category | Stats | Color |
|----------|-------|-------|
| **Attacking** | goals, assists, key_passes, shots (on target), dribbles (success/fail with %) | `text-pos-att` |
| **Passing** | passes_total, passes_successful, pass_success_rate | `text-pos-mid` |
| **Defending** | tackles, interceptions | `text-pos-def` |
| **Physical** | minutes_played, distance (m→km), sprints_count, speed_avg | `text-pos-wng` |

This matches the existing skills section categories (line 511-618 of page.tsx) which already use these exact colors and category names. Copy the 4 SVG icons verbatim from the skills section — duplication of 4 small SVGs is cheaper than an abstraction layer.

### Season Aggregation — Single-Pass, Null-Safe

Computed from the already-fetched `matchStats` array. Single reduce for readability (8 aggregations in one block, easy to audit):

```ts
interface SeasonAccumulator {
  goals: number
  assists: number
  minutes: number
  distance: number
  passesTotal: number
  passesSuccessful: number
  ratingSum: number
  ratingCount: number
}

const initial: SeasonAccumulator = {
  goals: 0, assists: 0, minutes: 0, distance: 0,
  passesTotal: 0, passesSuccessful: 0, ratingSum: 0, ratingCount: 0,
}

// TODO: Extract to src/lib/camera/stats.ts when PDF route needs camera stats
const season = matchStats.reduce<SeasonAccumulator>((acc, ms) => {
  acc.goals += ms.goals ?? 0
  acc.assists += ms.assists ?? 0
  acc.minutes += ms.minutes_played ?? 0
  acc.distance += ms.distance_m ?? 0
  acc.passesTotal += ms.passes_total ?? 0
  acc.passesSuccessful += ms.passes_successful ?? 0
  if (ms.overall_rating != null) { acc.ratingSum += Number(ms.overall_rating); acc.ratingCount++ }
  return acc
}, initial)
```

**Critical:** Pass accuracy recomputed from `passesSuccessful / passesTotal * 100` (NOT averaged from `pass_success_rate`, which is mathematically incorrect when pass volumes differ across matches). Average rating uses `ratingSum / ratingCount` to exclude null-rated matches.

### Rating Color System

4-tier thresholds using existing CSS tokens (no new tokens needed):

| Rating | Color | CSS class | Token |
|--------|-------|-----------|-------|
| >= 7.5 | Green (excellent) | `text-primary` | existing `--primary` |
| >= 6.5 | Default (good) | `text-foreground` | existing `--foreground` |
| >= 5.5 | Gold/amber (average) | `text-pos-gk` | existing `--pos-gk` |
| < 5.5 | Red (poor) | `text-danger` | existing `--danger` |

All four pass WCAG AA on `bg-surface` in both light and dark themes (verified via Theme Redesign learning).

Replaces the inline 3-tier ternary on line 662 of page.tsx with `getRatingColor()` for consistency.

### Match History Ordering

Sort `matchStats` by `match_date` after fetch. Keep this client-side because PostgREST nested ordering across `match_player_stats → matches` join depth is unreliable. But for `club_history`, add `.order('joined_at', { referencedTable: 'player_club_history', ascending: false })` to the query and remove the client-side `.sort()` on line 134:

```ts
const toTime = (d: string | undefined | null) => d ? new Date(d).getTime() : 0
const matchStats = [...rawMatchStats].sort((a, b) => toTime(b.match?.match_date) - toTime(a.match?.match_date))
```

### Implementation Phases

#### Phase A: Constants + Rating Helper

**`src/lib/constants.ts`** — add data only:

```ts
// Rating color thresholds (1-10 scale, descending order)
export const RATING_THRESHOLDS = [
  { min: 7.5, class: 'text-primary', label: 'excellent' },
  { min: 6.5, class: 'text-foreground', label: 'good' },
  { min: 5.5, class: 'text-pos-gk', label: 'average' },
  { min: 0, class: 'text-danger', label: 'poor' },
] as const
```

**`src/lib/utils.ts`** — add function (constants.ts is data-only by convention):

```ts
import { RATING_THRESHOLDS } from '@/lib/constants'

type RatingTier = (typeof RATING_THRESHOLDS)[number]

const FALLBACK_TIER = RATING_THRESHOLDS[3] // 'poor' tier

/** Get rating color class and tier label. Returns 'poor' for NaN/negative. */
export function getRatingColor(rating: number): RatingTier {
  const tier = Number.isFinite(rating)
    ? RATING_THRESHOLDS.find(threshold => rating >= threshold.min)
    : undefined
  return tier ?? FALLBACK_TIER
}
```

#### Phase B: Translations

**`src/lib/translations/players.ts`** — add ~15 keys to both `en` and `ka`:

**In `stats` namespace** (new stat labels for MatchStatDetail):
- `keyPasses` — "Key Passes" / "საკვანძო პასები"
- `passesTotal` — "Total Passes" / "პასები სულ"
- `passesSuccessful` — "Accurate Passes" / "ზუსტი პასები"
- `dribblesSuccess` — "Successful Dribbles" / "წარმატებული დრიბლინგი"
- `dribblesFail` — "Failed Dribbles" / "წარუმატებელი დრიბლინგი"
- `speedAvg` — "Avg Speed" / "საშ. სიჩქარე"
- `shotsOnTarget` — "On Target" / "კარის კარში"

**In `camera` namespace** (season summary + rating):
- `overallRating` — "Overall Rating" / "საერთო რეიტინგი"
- `seasonSummary` — "Season Summary" / "სეზონის შეჯამება"
- `totalGoals` — "Total Goals" / "გოლები სულ"
- `totalAssists` — "Total Assists" / "ასისტები სულ"
- `totalMinutes` — "Total Minutes" / "წუთები სულ"
- `avgRating` — "Avg Rating" / "საშ. რეიტინგი"
- `avgPassAccuracy` — "Pass Accuracy" / "პასის სიზუსტე"
- `totalDistance` — "Total Distance" / "დისტანცია სულ"
- `matchesPlayed` — "Matches" / "მატჩები"

**In `camera` namespace** (rating tier labels for screen readers):
- `ratingExcellent` — "Excellent" / "შესანიშნავი"
- `ratingGood` — "Good" / "კარგი"
- `ratingAverage` — "Average" / "საშუალო"
- `ratingPoor` — "Poor" / "სუსტი"

Reuse existing keys: `players.attacking`, `players.passingCategory`, `players.defensive`, `players.physicalCategory` — already defined with Georgian translations.

#### Phase C: MatchStatDetail Component (NEW)

**`src/components/player/MatchStatDetail.tsx`**

Server-compatible component (no `'use client'`). Extracts the match expansion stats from page.tsx lines 683-724 and replaces it with a categorized layout.

**Props:**
```ts
interface MatchStatDetailProps {
  stats: Pick<MatchPlayerStatsRow,
    'minutes_played' | 'goals' | 'assists' | 'key_passes' |
    'shots' | 'shots_on_target' | 'tackles' | 'interceptions' |
    'distance_m' | 'sprints_count' | 'speed_avg' | 'passes_total' |
    'passes_successful' | 'pass_success_rate' | 'dribbles_success' |
    'dribbles_fail' | 'overall_rating'>
  matchSlug: string | null
  t: (key: string) => string  // TODO: type translation keys as a union when i18n system supports it
}
```

**Layout:** 4 hardcoded category groups in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`). Each group has:
- Icon + category header (copy 4 SVG icons verbatim from skills section — no shared mapping)
- Stat rows: label + value, null shows "—"
- Derived stats: dribble success % (`success / (success + fail) * 100`), distance km conversion (`Math.round(distance_m / 100) / 10`)

**Match link preserved:** if `matchSlug` is provided, show a link to `/matches/[slug]` at the top.

#### Phase D: Player Profile Page Integration

**`src/app/(platform)/players/[slug]/page.tsx`** — the core changes:

**1. Replace inline types with Pick<>** (lines 88-120):
- Delete `CameraSkills` and `MatchStat` local types
- Import `Database` from `@/lib/database.types`
- Define `CameraSkills`, `MatchStatScalars`, `MatchStatWithMatch` as Pick-based types
- Add sync-warning comment above each Pick type
- Try removing `as unknown as` cast (see Type Derivation section above)

**2. Expand data query** (line 61):
Add 6 columns to `match_stats:match_player_stats` select:
```
key_passes, passes_total, passes_successful, dribbles_success, dribbles_fail, speed_avg
```

**3. Sort matchStats by date** (after line 128):
```ts
const toTime = (d: string | undefined | null) => d ? new Date(d).getTime() : 0
const matchStats = [...rawMatchStats].sort((a, b) => toTime(b.match?.match_date) - toTime(a.match?.match_date))
```

**4. Compute season stats** (after matchStats, before return):
Single-pass reduce with `SeasonAccumulator` interface producing `{ goals, assists, minutes, distance, passesTotal, passesSuccessful, ratingSum, ratingCount }`. Derived values:
- `avgRating = ratingCount > 0 ? ratingSum / ratingCount : null`
- `avgPassAccuracy = passesTotal > 0 ? Math.round(passesSuccessful / passesTotal * 100) : null`
- `totalDistanceKm = Math.round(distance / 100) / 10`

**5. Replace CountUpStat overall with Rating Badge** (lines 324-337):
Replace the `CountUpStat` for `skills.overall` with a color-coded large rating with screen reader text:
```tsx
<div className={`text-3xl font-bold tabular-nums sm:text-5xl ${getRatingColor(skills.overall).class}`}>
  {skills.overall.toFixed(1)}
  <span className="sr-only">
    {` — ${t(`camera.rating${getRatingColor(skills.overall).label.charAt(0).toUpperCase() + getRatingColor(skills.overall).label.slice(1)}`)}`}
  </span>
</div>
```
Keep `CountUpStat` for attack, defence, fitness.

**6. Add Season Summary** (above `#stats` section, after hero):
Grid of stat cards (`grid-cols-2 sm:grid-cols-4`). Each card uses `bg-surface border border-border` pattern (verified for both themes). Only shown when `matchStats.length > 0`.

**7. Replace match expansion grid** (lines 683-724):
Replace the inline 6-stat grid with:
```tsx
<MatchStatDetail stats={ms} matchSlug={m?.slug ?? null} t={t} />
```

**8. Update match row rating color** (line 662):
Replace inline ternary with `getRatingColor(Number(ms.overall_rating)).class`.

**9. Add server-side ordering for club_history** (line 76):
Add `.order('joined_at', { referencedTable: 'player_club_history', ascending: false })` to the main query. Remove the client-side `.sort()` on line 134.

#### Phase E: API Route Consistency

**`src/app/api/players/[id]/route.ts`** — add the same 6 columns to the `match_player_stats` select. This is ~1 line change. The API route is used by the compare view and potentially external consumers — having fewer columns creates a data contract divergence.

#### Phase F: Build Verification

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero new warnings (no variable shadowing, no unused imports)
3. Navigate to `/players/[slug]` — verify page renders (empty camera data = graceful empty states)
4. Verify rating badge hidden when `skills.overall` is null
5. Verify season summary hidden when `matchStats.length === 0`
6. Verify all null stats show "—" in MatchStatDetail
7. Verify screen reader text on rating badge (inspect DOM for sr-only span)

## System-Wide Impact

### Interaction Graph

- Player profile page → `createClient()` → reads `player_skills` + `match_player_stats` (6 additional scalar columns) + nested `matches` join
- **No writes** — entirely read-only display
- `RadarChart`, `StatBar`, `CountUpStat`, `ProfileSubNav` — unchanged
- API route `/api/players/[id]` updated for consistency (Phase E)
- PDF route NOT modified — acceptable until camera data flows

### Error & Failure Propagation

- Missing skills → rating badge hidden, stats section hidden (existing behavior)
- Missing matchStats → season summary hidden, matches section hidden
- Null values in individual stats → MatchStatDetail shows "—"
- All nulls in `overall_rating` → season avgRating shows "—"
- `getRatingColor(NaN)` → returns "poor" tier (safe fallback via `Number.isFinite` check)

### State Lifecycle Risks

- **No state mutations** — purely display
- **match_date type** — already `timestamptz` from Session 1. `format(new Date(m.match_date), ...)` handles it fine.
- **Page size growth** — 862 lines → ~950 lines. MatchStatDetail extraction offsets the season summary addition. Acceptable for now.

## Acceptance Criteria

### Functional

- [x] Overall rating in hero section is color-coded (green >=7.5, default >=6.5, gold >=5.5, red <5.5)
- [x] Rating badge includes `sr-only` screen reader text with tier label (e.g., "— Excellent")
- [x] Rating badge replaces CountUpStat for overall; attack/defence/fitness CountUpStats remain
- [x] "Verified by Pixellot" badge visible on skills section (already exists)
- [x] Season summary shows: matches played, total goals, total assists, total minutes, avg rating, pass accuracy %, total distance (km)
- [x] Season summary pass accuracy uses `sum(successful) / sum(total)` (not averaged percentages)
- [x] Season summary avg rating excludes matches with null overall_rating from divisor
- [x] Season summary hidden when no match stats exist
- [x] Match expansion shows 4 categorized groups: Attacking, Passing, Defending, Physical
- [x] New stat fields displayed: key_passes, passes_total, passes_successful, dribbles_success, dribbles_fail, speed_avg
- [x] Match row rating color uses `getRatingColor()` (consistent with hero badge)
- [x] Match list sorted by match_date descending (most recent first)
- [x] Match link to `/matches/[slug]` preserved in expansion
- [x] All null stats show "—" (not 0, not undefined)
- [x] All new translation keys have both `en` and `ka` values
- [x] All components handle empty camera data (zero matches, null skills) without crashing

### Non-Functional

- [x] `npm run build` passes with zero errors
- [x] `npm run lint` — zero new warnings (no variable shadowing)
- [x] No `any` types in new code — `Pick<>` from generated types
- [x] No JSONB columns fetched (scalar columns only)
- [x] Mobile-responsive: grids stack on small screens
- [x] Works in both light and dark themes (uses CSS variable tokens only — all verified WCAG AA)
- [x] `getRatingColor()` in `utils.ts`, `RATING_THRESHOLDS` in `constants.ts` (preserves data-only convention)

## File Inventory

### New Files (1)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/components/player/MatchStatDetail.tsx` | Categorized per-match stat breakdown grid |

### Modified Files (4)

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/constants.ts` | Add `RATING_THRESHOLDS` (data only) |
| 2 | `src/lib/utils.ts` | Add `getRatingColor()` function |
| 3 | `src/lib/translations/players.ts` | Add ~19 camera stat/season/rating translation keys (en + ka) |
| 4 | `src/app/(platform)/players/[slug]/page.tsx` | Types via Pick<>, expanded query, season summary, rating badge with a11y, MatchStatDetail integration, match ordering, rating color unification |
| 5 | `src/app/api/players/[id]/route.ts` | Add 6 columns to match_player_stats select (API consistency) |

**Total: 1 new + 5 modified = 6 files**

## Commit Strategy

2 commits:

1. **`feat(camera): add rating helper, translations, and MatchStatDetail component`**
   - `constants.ts` (RATING_THRESHOLDS) + `utils.ts` (getRatingColor) + `translations/players.ts` + `MatchStatDetail.tsx`

2. **`feat(camera): integrate camera stats UI into player profile`**
   - `page.tsx` (types, query, season summary, rating badge, MatchStatDetail, ordering)
   - `route.ts` (API consistency)

## Deferred Items

| Item | Re-entry Criteria | Target Session |
|------|-------------------|----------------|
| Heatmap (`Heatmap.tsx`, `heatmap-utils.ts`) | Starlive confirms grid key encoding format AND heatmap data exists in DB | Session 5+ |
| TrendChart (`TrendChart.tsx`) | >= 5 matches with ratings in DB for at least one player | Session 5+ |
| ProfileSubNav "Heatmap" section | When Heatmap component is built | Session 5+ |
| CSS pitch variables (`--pitch-bg`, `--pitch-line`) | When Heatmap component is built | Session 5+ |
| Unused sub-score fields in skills query | When a UI component needs them (e.g. detailed radar breakdown) | Future |
| Match list pagination | Any player exceeds ~40 camera-tracked matches (DOM ~4,600+ nodes in match section) | Phase 8 or when camera data flows |
| Shared type extraction | When PDF route adds camera stats — consolidate `CameraSkills` type from page.tsx, route.ts, pdf/route.ts into shared file | Phase 8 |
| Season aggregation extraction | When PDF route needs camera stats — extract from page.tsx to `src/lib/camera/stats.ts` | Phase 8 |

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Camera tables are empty (no test data) | Low | All UI shows graceful empty states. Components verified against null/empty data. |
| Pass accuracy recompute vs average gives different numbers | Medium | Using correct recompute method (sum/sum). Document the difference for future reference. |
| Page grows to ~950 lines | Low | MatchStatDetail extraction offsets growth. Further extraction (SeasonSummary component) possible later. |
| Georgian translations too long for grid cells | Low | Use abbreviations where needed (Georgian translations reviewed). Grid is responsive. |
| `as unknown as CameraSkills` cast still needed | Low | Try removing first (isOneToOne: true should work). If needed, keep with comment explaining why. Pick<> ensures type shape matches schema regardless. |
| DOM size at 30+ matches | Low | ~3,450 nodes at 30 matches. `<details>` collapsed content doesn't participate in layout reflow. Paginate at ~40 matches (documented in deferred items). |
| Variable shadowing in getRatingColor | None | Fixed in plan — use `tier`/`threshold` as variable names. |

## Sources & References

### Origin

- **Design spec:** `docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md` — Section 4a (Player Profile Camera Stats)
- **Sessions overview:** `docs/plans/2026-03-20-camera-integration-sessions.md` — Session 3 tasks

### Internal References

- Player profile page: `src/app/(platform)/players/[slug]/page.tsx` — 862-line server component
- RadarChart pattern: `src/components/player/RadarChart.tsx` — pure SVG, CSS variables, 1-10 scale
- Existing category colors: page.tsx lines 511-618 (Attacking=pos-att, Passing=pos-mid, Defensive=pos-def, Physical=pos-wng)
- Position color tokens: `globals.css` (`--pos-gk`, `--pos-def`, `--pos-mid`, `--pos-att`, `--pos-wng`)
- Camera types: `src/lib/camera/types.ts` — Starlive interfaces
- Database types: `src/lib/database.types.ts` — match_player_stats Row, player_skills Row (isOneToOne: true at line 784)
- Translations: `src/lib/translations/players.ts` — existing stats/skills/camera namespaces
- postgrest-js: `node_modules/@supabase/postgrest-js/dist/index.d.mts` — overrideTypes at line 702, isOneToOne check at line 819

### Institutional Learnings Applied

- **Theme redesign** from `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` — position colors as category colors is safe; use matching `-bg` tokens for tinted backgrounds; prefer borders over shadows for cards on dark
- **Accessibility patterns** from `docs/solutions/ui-bugs/chat-session-f-polish-reliability-accessibility.md` — color-coded indicators need sr-only text equivalents; expandable elements need aria-expanded (already handled by native `<details>`)
- **Migration checklist** from `docs/solutions/feature-migrations/shortlist-to-watchlist-system-migration.md` — grep for old references, regenerate types, verify build
- **RLS silent failures** from `docs/solutions/database-issues/chat-system-rls-policy-and-displayname-fixes.md` — verify queries return expected data with actual user roles
