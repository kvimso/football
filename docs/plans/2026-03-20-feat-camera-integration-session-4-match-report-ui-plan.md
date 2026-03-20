---
title: "Camera Integration Session 4: Match Report UI"
type: feat
status: completed
date: 2026-03-20
origin: docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md
---

# Camera Integration Session 4: Match Report UI

## Enhancement Summary

**Deepened on:** 2026-03-20
**Agents used:** 9 completed (kieran-typescript-reviewer, code-simplicity-reviewer, performance-oracle, architecture-strategist, pattern-recognition-specialist, security-sentinel, framework-docs-researcher, best-practices-researcher, theme-learning)

### Critical Fixes (2)

1. **`parseTeamStats` must guard against `Json[]`** — `typeof [] === 'object'` is `true`, so a JSON array would pass the check and be silently cast to `StarliveTeamsData`. Add `Array.isArray` guard. Apply to all JSONB parsers. *(TypeScript)*
2. **Translation key duplication** — at least 5 keys already exist in `players.ts` and must be reused, not duplicated: `players.verifiedByPixellot`, `stats.tackles`, `stats.shotsOnTarget`, `camera.noDataYet`, `stats.passPercent`. Creating duplicate keys in `landing.ts` causes maintenance divergence. *(Pattern Recognition)*

### High-Priority Changes (7)

3. **Kill `MATCH_REPORT_STATS` config array** — premature abstraction for a static 10-item list. Hardcode the 10 stat rows directly in the component JSX. Each row is ~5 lines; the result is scannable and self-documenting without config indirection, `type: 'widget'` flags, or `useValue` special cases. *(Simplicity)*
4. **Defer `StatsTimeline` (PPDA) entirely** — hand-rolled SVG line chart with auto-scaled Y axis, grid lines, axis labels, legend, polyline paths is 80-120 lines of coordinate math for a niche tactical metric. Team comparison already shows possession, shots, passes. PPDA adds marginal scout value. Move to V2 when real users request it. *(Simplicity)*
5. **Create `src/lib/camera/extract.ts`** for JSONB read-side helpers — `parseJsonObject<T>()`, `getTeamStat()`, widget extraction functions. Session 5 comparison tool and Session 6 PDF export need the same parsers. Inline in `page.tsx` creates duplication. This is the read-side complement to `transform.ts` (write-side). *(Architecture + TypeScript + Performance)*
6. **Delete `MatchDetailClient.tsx` entirely** — after removing dead `report` variant, it only does `lang === 'ka' ? name_ka : name`. The match page already has `lang` from `getServerT()`. Replace with inline expressions, eliminating a `'use client'` component from the bundle. *(Architecture)*
7. **Extract `TeamStatSummary` named type** — the anonymous `{ count, accurate, percent, value? }` shape appears 3 times (return type, homeStats prop, awayStats prop). Use `Omit<StarliveTeamStat, 'events'>` or a simple named interface in `camera/types.ts`. *(TypeScript)*
8. **Use HTML divs for TeamComparisonStats, not SVG** — butterfly bar charts handle text wrapping, responsive sizing, and i18n text length better in HTML. FotMob and Sofascore use HTML divs for their comparison bars. *(Best Practices)*
9. **Use CSS flex for AttackDirection, not SVG** — three percentage-width `div` segments per team is ~25 lines of JSX. SVG with viewBox and manual coordinate placement is overkill for proportional bars. *(Simplicity + Best Practices)*

### Medium-Priority Improvements (6)

10. **Add SVG accessibility on ShotMap** — `role="img"`, `aria-labelledby` pointing to `<title>` + `<desc>`, `role="presentation"` on child graphical elements. Include data summary in `<desc>` (e.g., "X total shots, Y on target"). *(Best Practices + Accessibility)*
11. **Cut "Other" player group** — edge case (player transferred post-match) cannot occur with current or near-future data. When it does, the real fix is storing `club_id` on `match_player_stats` at sync time. Add a TODO comment instead. *(Simplicity)*
12. **SVG responsive pattern** — `viewBox` + `className="w-full"`, omit explicit `width`/`height` attributes. Default `preserveAspectRatio="xMidYMid meet"` is correct. Already used in `RadarChart.tsx`. *(Framework Docs + Best Practices)*
13. **Team colors: `var(--primary)` for home, `var(--foreground-muted)` for away** — colorblind-safe (green vs gray), meets WCAG 3:1, theme-adaptive. Never hardcode hex in SVG — use `var()` CSS tokens. For SVG opacity patterns, use `opacity` attribute on element, not `rgba()`. *(Best Practices + Theme Learning)*
14. **Specify `card` class wrapping** — each visualization section wraps in `<div className="mt-6 card">` with `<h3>` section header, matching existing player stats table pattern. Wrapping in `page.tsx`, not inside components. *(Pattern Recognition)*
15. **Add TODO for `team_stats` JSONB size optimization** — `team_stats` includes full event arrays (~70 categories x events per match, potentially 500KB-2MB). We only use `.count/.percent/.value`. When real Starlive data flows, consider: (a) Supabase RPC to extract summary server-side, or (b) separate `report_summary` column populated at sync time. *(Performance)*

### Informational (validated safe)

16. **Inline SVG in server components is fully safe** — no hydration step, no streaming issues. React renders SVG as static HTML. *(Framework Docs)*
17. **React JSX auto-escapes all SVG text content** — team names in `<text>` elements are safe from XSS. No `dangerouslySetInnerHTML` in codebase. *(Security)*
18. **No critical security issues** — read-only display, proper RLS policies, `source` column protected by lack of user-facing INSERT/UPDATE policies. *(Security)*
19. **DOM count addition ~200-250 nodes** (down from ~300 after cutting StatsTimeline). Well within limits. *(Performance)*
20. **Adding `source` to list query is negligible** — 8 bytes per row × 200 rows = 1.6KB. *(Performance)*

### Conflict Resolutions

- **StatsTimeline**: Simplicity says cut, Architecture neutral, Best Practices provided full implementation. **Resolution: Defer.** PPDA is niche; team comparison covers the match story.
- **AttackDirection rendering**: Simplicity says CSS divs, Best Practices says stacked horizontal bars (also CSS). **Resolution: CSS flex divs.** No SVG needed.
- **JSONB helpers location**: TypeScript says extract to `camera/extract.ts`, Simplicity says keep inline. Architecture strongly recommends extracting. **Resolution: Extract.** Session 5 comparison tool needs these.

---

## Overview

Build the match report display on `/matches/[slug]` with camera-derived team comparison stats, shot map, attack direction visualization, and an improved player ratings table. Implements design spec section 4c (Match Page — Full Report). Minor updates to the match list page (source indicator on cards).

**Scope: 3 new files + 1 new utility + 4 modified files = 8 files total.**
- New: `TeamComparisonStats.tsx`, `ShotMap.tsx`, `AttackDirection.tsx`, `camera/extract.ts`
- Modified: `matches/[slug]/page.tsx`, `MatchCard.tsx`, `matches/page.tsx`, `translations/landing.ts`
- Deleted: `MatchDetailClient.tsx`

## Problem Statement

After Sessions 1-3, the match detail page (249 lines) shows only a basic header, video link, and a player stats table with inline 3-tier rating colors. The JSONB columns on the `matches` table (`team_stats`, `widgets`) store rich camera data that is not displayed. Scouts need:

- **Team comparison** — side-by-side stats (possession, xG, shots, passes, etc.) to understand the match
- **Shot map** — visual shot locations and outcomes on a pitch diagram
- **Attack patterns** — left/center/right attack distribution for each team
- **Better player table** — split by home/away team, using `getRatingColor()` for consistency with player profiles

**Deferred to later sessions:**
- ~~PPDA / pressing timeline~~ — niche tactical metric, marginal scout value for V1 complexity. Move to V2.
- ~~`intervals_team_stats` full breakdown~~ — 70 stat categories × 19 intervals. Overkill.
- ~~Event-level shot coordinates~~ — zone-based aggregate is enough for V1

## Proposed Solution

1. **`src/lib/camera/extract.ts`** — generic `parseJsonObject<T>()` + `getTeamStat()` + widget extraction helpers. Reusable by Session 5 (comparison) and Session 6 (PDF).
2. **TeamComparisonStats** — server component with **HTML div butterfly bars** for 10 key metrics. 10 hardcoded rows, no config array.
3. **ShotMap** — server SVG component showing shot volume by zone (12-zone grid), two side-by-side half-pitches.
4. **AttackDirection** — server component with **CSS flex percentage bars** for L/C/R attack distribution.
5. **Updated match detail page** — fetch JSONB columns, wire in components, split player table by team, use `getRatingColor()`, delete `MatchDetailClient.tsx`.
6. **Updated MatchCard** — add `source` prop for camera data indicator badge.
7. **~19 new translation keys** (en + ka), reusing 5 existing keys from `players.ts`.

## Technical Approach

### JSONB Extraction Module (`src/lib/camera/extract.ts`)

Generic JSONB parser with `Array.isArray` guard (critical fix #1):

```typescript
import type { Json } from '@/lib/database.types'
import type { StarliveTeamsData, StarliveTeamStat } from './types'

/** Cast Supabase Json to a typed object, guarding against null, primitives, and arrays. */
export function parseJsonObject<T>(json: Json | null): T | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null
  return json as unknown as T
}

/** Stripped-down stat shape for display (events array excluded). */
export interface TeamStatSummary {
  count: number
  accurate: number
  percent: number
  value?: number
}

/** Safe stat extraction — never throws. */
export function getTeamStat(
  teamStats: Record<string, StarliveTeamStat> | undefined,
  key: string
): TeamStatSummary {
  const stat = teamStats?.[key]
  return {
    count: stat?.count ?? 0,
    accurate: stat?.count_accurate ?? 0,
    percent: stat?.percent ?? 0,
    value: stat?.value,
  }
}
```

Usage in page.tsx:
```typescript
import { parseJsonObject, getTeamStat } from '@/lib/camera/extract'
import type { StarliveTeamsData, StarliveWidgets } from '@/lib/camera/types'

const teamStats = parseJsonObject<StarliveTeamsData>(match.team_stats)
const widgets = parseJsonObject<StarliveWidgets>(match.widgets)
const homeStats = teamStats?.['1']
const awayStats = teamStats?.['2']
const homePossession = (widgets?.['1'] as Record<string, unknown>)?.possession
// ... etc
```

### Data Shapes (from sample JSON)

**team_stats** shape: `Record<"1"|"2", Record<statName, StarliveTeamStat>>` where `"1"` = home, `"2"` = away.
- Most stats: use `.count` (total) and `.count_accurate` (successful), `.percent` (accuracy)
- xG: uses `.value` field (float, e.g., 6.1), NOT `.count`
- Possession: from `widgets.{team}.possession.percent`, NOT team_stats

**widgets** shape: `Record<"1"|"2", Record<widgetName, unknown>>`.
- `possession`: `{ possession_time: number, percent: number }`
- `attacks_direction`: `{ attack: { left/center/right: { num, percent } }, defense: { ... } }`
- `shots_zones`: `Record<"0".."11", number>` — aggregate shot counts per zone (12 zones)
- `shots_on_target_zones`: same shape — on-target counts per zone

### Component Architecture

All 3 new components are **server components** (no `'use client'`). They accept typed props and a `t` function. Zero client bundle impact. `MatchDetailClient.tsx` is deleted (removing a client component).

| Component | Rendering | Props | Data Source |
|---|---|---|---|
| `TeamComparisonStats` | **HTML divs** | `TeamStatSummary` records, possession, team names, `t` | `team_stats` + `widgets.possession` |
| `ShotMap` | **SVG** | zone records, team names, `t` | `widgets.shots_zones` + `shots_on_target_zones` |
| `AttackDirection` | **CSS flex** | `{ left, center, right }`, team names, `t` | `widgets.attacks_direction` |

### Shot Map Zone Layout

The 12 zones (0-11) map to a 4x3 grid on the attacking half of the pitch:

```
         Goal line
    ┌──────────────────┐
    │  0  │  1  │  2   │  Near goal (6-yard box area)
    ├─────┼─────┼──────┤
    │  3  │  4  │  5   │  Penalty area edge
    ├─────┼─────┼──────┤
    │  6  │  7  │  8   │  Mid-range (just outside box)
    ├─────┼─────┼──────┤
    │  9  │ 10  │ 11   │  Long range
    └──────────────────┘
         Midfield
```

Zone center coordinates for `viewBox="0 0 360 240"`:
```typescript
const ZONE_CENTERS: Record<string, [number, number]> = {
  '0':  [90,  30],  '1':  [180, 30],  '2':  [270, 30],
  '3':  [90,  82],  '4':  [180, 82],  '5':  [270, 82],
  '6':  [90, 140],  '7':  [180, 140], '8':  [270, 140],
  '9':  [90, 200],  '10': [180, 200], '11': [270, 200],
}
```

Each zone renders as a circle: size proportional to shot count, color indicates on-target ratio:
- Zone has shots AND on-target > 0: `fill="var(--primary)"` (productive zone)
- Zone has shots but 0 on-target: `fill="var(--foreground-faint)"` (low quality)
- Zone has 0 shots: no circle
- Shot count as `<text>` inside each circle for accessibility (not color-only)

Two side-by-side half-pitches (one per team). SVG responsive: `viewBox` + `className="w-full"`, no explicit dimensions. `preserveAspectRatio` defaults to `xMidYMid meet`.

SVG accessibility: `role="img"`, `aria-labelledby="shotmap-title shotmap-desc"`, `<title>` + `<desc>` with data summary. `role="presentation"` on child graphic elements.

Pitch markup: rect outline, penalty area rect, goal area rect, penalty spot circle, penalty arc path. All strokes use `var(--border)`.

### Player Ratings Table: Home/Away Split

Add `home_club_id, away_club_id` to the match query. Split `playerStats` into two arrays by matching `player.club_id`. Players matching neither team go into the unsorted combined table (no separate "Other" group — just a TODO comment for the sync-time fix).

Use `getRatingColor()` from `utils.ts` (replaces inline 3-tier ternary). Add `sr-only` tier label per Session 3 pattern. Reuse existing `camera.ratingExcellent/Good/Average/Poor` keys from `players.ts`.

### MatchDetailClient Elimination

Delete the file entirely. Replace the two `<MatchDetailClient type="home_club" ...>` calls with inline `{lang === 'ka' ? homeClub.name_ka : homeClub.name}`. The page already has `lang` from `getServerT()`. This removes a `'use client'` component.

---

## Implementation Phases

### Phase A: Extract module + Translations

**New file:** `src/lib/camera/extract.ts`
**Modified file:** `src/lib/translations/landing.ts`

1. Create `src/lib/camera/extract.ts` with:
   - `parseJsonObject<T>(json: Json | null): T | null` (generic, with `Array.isArray` guard)
   - `TeamStatSummary` interface (exported)
   - `getTeamStat(teamStats, key): TeamStatSummary`

2. Add ~19 new i18n keys to `landing.ts` (en + ka) under `matches`:
   - Section headers: `teamComparison`, `shotMap`, `attackDirection`
   - Stats (new, not in `players.ts`): `possession`, `xG`, `totalPasses`, `corners`, `freeKicks`, `fouls`
   - Direction labels: `home`, `away`, `leftFlank`, `center`, `rightFlank`
   - Context labels: `attack`, `defense`
   - **Reuse from `players.ts` (do NOT duplicate):** `players.verifiedByPixellot`, `stats.tackles`, `stats.shotsOnTarget`, `stats.passPercent`, `camera.noDataYet`

### Phase B: TeamComparisonStats Component

**New file:** `src/components/match/TeamComparisonStats.tsx`

Server component. **HTML divs** (not SVG) rendering butterfly comparison bars. 10 hardcoded stat rows — no config array.

Each row layout:
```
Home value  ◄═══════╪═══════►  Away value
              stat label
```

Props interface:
```typescript
import type { TeamStatSummary } from '@/lib/camera/extract'

interface TeamComparisonStatsProps {
  homeStats: Record<string, TeamStatSummary>
  awayStats: Record<string, TeamStatSummary>
  homePossession: number | null
  awayPossession: number | null
  t: (key: string) => string
}
```

Implementation:
- Each bar row: `div` with `flex` layout. Left bar uses `flex-row-reverse` + `bg-primary`, right bar uses `bg-foreground-muted`.
- Bar width: `Math.max(homeVal / (homeVal + awayVal) * 100, 2)` — minimum 2% keeps losing side visible.
- xG row: display `.value` with 1 decimal (`6.1`), not `.count`.
- Possession row: display possession widget `percent`, not from team_stats.
- Zero-total rows: show dashes instead of bars.
- Wrap in `card` div with `<h3>` section header in `page.tsx`.

### Phase C: ShotMap + AttackDirection Components

**New file:** `src/components/match/ShotMap.tsx`

SVG server component. `viewBox="0 0 360 240"`, `className="w-full"`. Two side-by-side instances (one per team) rendered by the parent page.

Props:
```typescript
interface ShotMapProps {
  zones: Record<string, number> | null
  onTargetZones: Record<string, number> | null
  teamName: string
  t: (key: string) => string
}
```

Note: Single-team component. Page renders two `<ShotMap>` side-by-side in a `grid grid-cols-1 sm:grid-cols-2` layout.

SVG accessibility: `<svg role="img" aria-labelledby="..."><title>...</title><desc>...</desc>`. Child graphical elements get `role="presentation"`.

**New file:** `src/components/match/AttackDirection.tsx`

**CSS flex** server component (not SVG). 100% stacked horizontal bar (3 segments: L/C/R) per team, stacked vertically.

Props:
```typescript
interface AttackDirectionProps {
  homeAttack: { left: number; center: number; right: number } | null
  awayAttack: { left: number; center: number; right: number } | null
  homeTeamName: string
  awayTeamName: string
  t: (key: string) => string
}
```

Implementation: Three `div`s with `style={{ width: `${percent}%` }}`, different opacities for L/C/R within each team's color. `bg-primary` for home, `bg-foreground-muted` for away. Percentage labels centered in each segment.

### Phase D: Match Detail Page Overhaul

**Modified file:** `src/app/(platform)/matches/[slug]/page.tsx`
**Deleted file:** `src/components/match/MatchDetailClient.tsx`

1. **Expand Supabase query** — add JSONB columns + club IDs:
   ```
   id, slug, home_score, away_score, competition, match_date, venue,
   video_url, source, home_club_id, away_club_id,
   team_stats, widgets,
   home_club:clubs!matches_home_club_id_fkey ( name, name_ka, slug ),
   away_club:clubs!matches_away_club_id_fkey ( name, name_ka, slug ),
   player_stats:match_player_stats (
     minutes_played, goals, assists, pass_success_rate, shots, shots_on_target,
     tackles, interceptions, distance_m, sprints_count, overall_rating, key_passes,
     player:players!match_player_stats_player_id_fkey ( name, name_ka, slug, position, club_id )
   )
   ```
   Note: `intervals` and `intervals_widgets` are NOT fetched.

   ```typescript
   // TODO: team_stats JSONB includes full event arrays (~70 categories x events).
   // We only use .count/.count_accurate/.percent/.value per stat.
   // When real Starlive data is flowing, measure JSONB size and consider:
   // (a) Supabase RPC to extract summary server-side, or
   // (b) Separate report_summary column populated at sync time.
   ```

2. **Parse JSONB** using `parseJsonObject<T>()` from `camera/extract.ts`.

3. **Extract team comparison data** — 10 hardcoded `getTeamStat()` calls per team.

4. **Extract widget data** — possession, shots_zones, shots_on_target_zones, attacks_direction for both teams. Type-narrow each widget with `?.` and `?? null` defaults.

5. **Split player stats by team** — match `player.club_id` against `home_club_id`/`away_club_id`. Players matching neither go into the combined table.
   ```typescript
   // TODO: Player team assignment uses current club_id, which can be wrong
   // after transfers. Fix: add club_id column to match_player_stats,
   // populate in extractMatchPlayerStats() in transform.ts.
   ```

6. **Fix PlayerStat type** — use `Pick<>` from `database.types.ts`:
   ```typescript
   type MatchPlayerStatsRow = Database['public']['Tables']['match_player_stats']['Row']
   // IMPORTANT: These columns must match the select string in the Supabase query.
   type PlayerStatScalars = Pick<MatchPlayerStatsRow,
     | 'minutes_played' | 'goals' | 'assists' | 'pass_success_rate'
     | 'shots' | 'shots_on_target' | 'tackles' | 'interceptions'
     | 'distance_m' | 'sprints_count' | 'overall_rating' | 'key_passes'
   >
   ```

7. **Delete `MatchDetailClient.tsx`** — replace with inline `{lang === 'ka' ? homeClub.name_ka : homeClub.name}`.

8. **Page layout** (top to bottom):
   - Back link
   - Match header (existing, updated to inline bilingual names)
   - "Verified by Pixellot" badge (if `source === 'pixellot'`, reuse `t('players.verifiedByPixellot')`)
   - Video link (existing)
   - **Team Comparison Stats** in `card` div (if team_stats present)
   - **Shot Map** in `card` div with `grid grid-cols-1 sm:grid-cols-2` (if widgets.shots_zones present)
   - **Attack Direction** in `card` div (if widgets.attacks_direction present)
   - Player Ratings — Home team (section header with team name)
   - Player Ratings — Away team (section header with team name)

9. **Empty state** — if all JSONB columns are null, show camera icon (`&#128247;`) + `t('camera.noDataYet')` in smaller variant (`py-12 text-3xl`).

10. **Fix rating colors** — replace inline ternary with `getRatingColor()` + `sr-only` span using existing `camera.rating*` keys.

### Phase E: MatchCard Source Indicator

**Modified file:** `src/components/match/MatchCard.tsx`

Add optional `source` prop. When `source === 'pixellot'`, show a small camera icon in the competition/date header bar.

**Modified file:** `src/app/(platform)/matches/page.tsx`

Add `source` to the list query select string (scalar column, not JSONB). Pass to MatchCard.

---

## Acceptance Criteria

### Functional

- [x] Match detail page shows team comparison horizontal bars with 10 stats when camera data exists
- [x] Shot map shows 12-zone visualization with shot counts and on-target coloring
- [x] Attack direction shows L/C/R distribution for both teams
- [x] Player ratings table split by home/away team, using `getRatingColor()`
- [x] "Verified by Pixellot" badge shown when `source === 'pixellot'`
- [x] MatchCard shows camera data indicator when `source === 'pixellot'`
- [x] Graceful empty state when no camera data exists (camera icon + `t('camera.noDataYet')`)
- [x] Partial data handled (e.g., team_stats present but widgets null — show comparison, hide shot map)
- [x] All new strings bilingual (en + ka), reusing existing keys where available
- [x] Both light and dark themes work correctly for all visualizations
- [x] Mobile responsive (375px+) — visualizations stack and scale
- [x] SVG shot map has `role="img"`, `<title>`, `<desc>` for accessibility

### Quality Gates

- [x] `npm run build` passes with zero errors
- [x] `npm run lint` passes
- [x] No `any` types — all JSONB data properly typed via `parseJsonObject<T>()`
- [x] No `'use client'` on new components — all server-rendered
- [x] `MatchDetailClient.tsx` deleted
- [x] No hardcoded hex colors in SVG — all use `var()` CSS tokens
- [x] JSONB extraction helpers in `src/lib/camera/extract.ts` (not inline in page)

## Commit Strategy

**Commit 1:** Phase A-C — extract module, translations, 3 new components
**Commit 2:** Phase D-E — page overhaul, MatchDetailClient deletion, MatchCard update

## Deferred Items

1. **PPDA / pressing timeline** — hand-rolled SVG line chart is 80-120 lines for a niche metric. TeamComparisonStats covers the match story. Build in V2 when real users request it. *(Simplicity)*
2. **Individual shot scatter plot** — requires mapping Starlive coord system (e.g., `[9222, 1168]`) to pitch SVG. Zone aggregates sufficient for V1.
3. **Counterattack vs positional attack breakdown** — `breakthroughs` widget has zone counts, not the breakdown the spec mentions. Defer until data confirmed.
4. **`intervals_team_stats` visualization** — 70 stats × 19 intervals. Overkill for scout value.
5. **Hover tooltips on SVG** — would require `'use client'`. Static rendering with visible numbers is accessible and sufficient.
6. **Match-time `club_id` for player team assignment** — current approach uses player's current `club_id`. **Fix requires two steps:** (a) add `club_id` column to `match_player_stats` (migration), (b) populate in `extractMatchPlayerStats()` in `transform.ts`. Match detail page then joins on `match_player_stats.club_id` instead of `player.club_id`. *(Architecture)*
7. **Team color integration** — `home_team_color`/`away_team_color` format unknown. Use `var(--primary)` / `var(--foreground-muted)` defaults.
8. **OPDA timeline** — `opda` widget exists alongside `ppda`. Defer with PPDA.
9. **Shot map goal-specific coloring** — requires parsing `teams_data.shots.events` for individual outcomes. Zone-aggregate + on-target overlay is V1.
10. **`team_stats` JSONB size optimization** — when real data flows (potentially 500KB-2MB per match), consider Supabase RPC or summary column. *(Performance)*
11. **Translation file splitting** — `landing.ts` is growing. When match keys exceed ~30, consider `matches.ts` split. *(Pattern Recognition)*
12. **`matches.source` CHECK constraint** — unlike `match_player_stats.source` which has a CHECK constraint, `matches.source` does not. Add in a future migration for defense-in-depth. *(Security)*

## Sources & References

- **Design spec section 4c:** `docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md` (lines 547-584)
- **Session 3 patterns:** `docs/plans/2026-03-20-feat-camera-integration-session-3-player-profile-stats-ui-plan.md` — Pick<> types, getRatingColor(), server components, sr-only accessibility
- **Camera types:** `src/lib/camera/types.ts` — StarliveTeamsData, StarliveWidgets, StarliveTeamStat
- **Sample match report:** `/mnt/c/Users/kvims/OneDrive/Pictures/Saved Pictures/index-3.json`
- **Current match page:** `src/app/(platform)/matches/[slug]/page.tsx` (249 lines)
- **Session 3 component:** `src/components/player/MatchStatDetail.tsx` (server component, typed props, `t` function)
- **SVG accessibility:** W3C Wiki SVG Accessibility, Vispero/TPGi ARIA guides, `role="img"` + `<title>` + `<desc>` pattern
- **SVG responsive:** CSS-Tricks Scale SVG, MDN preserveAspectRatio, `viewBox` + `w-full` pattern
- **Football UI patterns:** FotMob, Sofascore butterfly bars, Pixellot 12-zone grid layout
- **Theme tokens:** `src/app/globals.css` — `--primary`, `--foreground-muted`, `--border`, `--foreground-faint` for SVG fills/strokes
