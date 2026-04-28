---
title: "feat: Camera Integration Session 4b — Advanced Match Visualizations + Event System"
type: feat
status: active
date: 2026-03-20
---

# feat: Camera Integration Session 4b — Advanced Match Visualizations + Event System

## Enhancement Summary

**Deepened on:** 2026-03-20
**Agents used:** 11 (Architecture Strategist, TypeScript Reviewer, Performance Oracle, Code Simplicity Reviewer, Frontend Races Reviewer, Security Sentinel, Pattern Recognition Specialist, Best Practices Researcher, Framework Docs Researcher, Fullstack-nextjs Reviewer, Learnings Researcher)

### Scope Revision (Critical)

Original plan had 5 components / 12 file operations. **Reduced to 3 components / 7 file operations** based on Simplicity + Architecture consensus:

| Component | Decision | Reason |
|-----------|----------|--------|
| **EventMap** | KEEP (standalone `'use client'`) | Core feature — where events happened |
| **MatchTimeline** | KEEP (server component) | Core feature — when events happened |
| **Breakthroughs** | KEEP (server component) | Simple, clear data, follows butterfly bar pattern |
| ~~PressingTimeline~~ | **CUT** | Already deferred in Session 4 review; niche PPDA metric; hand-rolled SVG line chart for 80-120 lines of coordinate math |
| ~~ZoneBreakdown~~ | **CUT** | 22-zone mapping unconfirmed; building speculative spatial layout with fallback = two components |
| ~~MatchAdvancedViz~~ | **CUT** | Wrapper only needed for cross-component state; unnecessary without shared interaction |

### Key Architecture Changes

1. **Use `useLang()` in client components** — not serialized `translations: Record<string, string>`. All 60+ existing client components use `useLang()` from `LanguageContext`. (Architecture, Pattern, Frontend Races — 3 agents agree)
2. **Do NOT add `intervals_widgets` to query** — PressingTimeline was the only consumer and it's cut. `intervals` is 4.7MB. (Architecture, Fullstack-nextjs, Performance — 3 agents agree)
3. **EventMap is standalone `'use client'`** with own filter state. MatchTimeline is server component. No cross-component interaction in V1. (Simplicity)
4. **Use synthetic string IDs for FlatEvent** — `${teamKey}-${category}-${outcome}-${id}` prevents cross-team collision. (Architecture)
5. **Constrain `parseJsonObject<T>` generic** to `T extends Record<string, unknown>`. (TypeScript)
6. **Tooltip as explicit state machine** — store position at click time, clear on filter change, dismiss on outside-click. (Frontend Races)
7. **CSS `pointer-events: none` on mobile** via media query — zero JS, zero races. (Frontend Races)
8. **Cap rendered events at 200** per view with truncation notice. (Performance)
9. **`@keyframes` pulse animation in `globals.css`**, use `transform: scale()` not SVG `r` attribute. (Performance, Fullstack-nextjs)
10. **`overflow-hidden` on SVG container** to prevent horizontal scroll on mobile. (Learnings)

### New Deferred Items (from agent review)

- PressingTimeline (PPDA/OPDA line charts) → V2 when real users request it
- ZoneBreakdown (22-zone grid) → V2 when Starlive confirms zone mapping
- Cross-component interaction (timeline click → map highlight) → V2
- Player filter on EventMap → V2
- Translation file split (matches.ts from landing.ts) → V2 when key count exceeds ~80

---

## Overview

Add 3 visualization components to the match detail page: **EventMap** (interactive SVG pitch with individual events), **MatchTimeline** (minute-by-minute event list), and **Breakthroughs** (attack/defense zone penetration bars). All data comes from JSONB already stored in `matches.team_stats` and `matches.widgets`. EventMap is the first `'use client'` component on the match page.

## Problem Statement / Motivation

Session 4 delivered team-level summary visualizations (comparison bars, shot zones, attack direction). Scouts need deeper match analysis: **where on the pitch** did events happen, **when** during the match, and **where did teams break through**. These answer the questions that differentiate a scouting platform from a scoreboard.

## Proposed Solution

3 components organized by complexity:

| Tier | Component | Type | Interaction | Data Source |
|------|-----------|------|-------------|-------------|
| Simple | **Breakthroughs** | Server | None | `widgets.breakthroughs` |
| Medium | **MatchTimeline** | Server | None (static list) | `team_stats[team][cat].events` |
| Complex | **EventMap** | Client | Filter + click + tooltip | `team_stats[team][cat].events` |

**No new Supabase query columns needed** — `team_stats` and `widgets` are already fetched.

## Technical Approach

### Data Already Available

The match detail page (`src/app/(platform)/matches/[slug]/page.tsx`) already fetches:
- `team_stats` — JSONB with `StarliveTeamsData` (event arrays inside each stat category)
- `widgets` — JSONB with `StarliveWidgets` (zone data, pressing, breakthroughs, etc.)

No additional columns needed for this session.

### Coordinate System (from sample data analysis)

Events use a coordinate system: **X: 200–10,300 / Y: 200–6,200** (roughly 105m × 68m pitch proportions scaled ~100x). To plot on SVG `viewBox="0 0 1050 680"`:

```typescript
function toSvg(coords: [number, number]): [number, number] {
  return [
    ((coords[0] - 200) / 10100) * 1050,
    ((coords[1] - 200) / 6000) * 680,
  ]
}
```

### Event Data Shape (confirmed from `index-3.json`)

```typescript
// StarliveTeamStatEvent.extra fields (actual shapes from sample data):
extra: {
  player: {  // object, NOT number — type.ts says `number | null` (WRONG, must fix)
    jersey: '12',          // string
    player_id: 1,          // Starlive internal ID
    team_id: 2,
    position: { name: 'goalkeeper', side: 'center' },
    kind: 'right_team',
    super_track_id: 1,
  } | null
  coords_start: [8217, 1844]  // [number, number] — currently typed as `unknown`
  coords_finish: [10036, 2992] // [number, number] — currently typed as `unknown`
  video_start: '0:23:01'       // match elapsed time string
  video_end: '0:23:08.720000'  // match elapsed time string
}
timestamp: '00:23:04.039999'   // match elapsed time string
```

### Breakthroughs Data Shape

```typescript
// breakthroughs: { attack: Record<"1"-"11", number>, attack_total: number,
//                  defense: Record<"1"-"11", number>, defense_total: number }
```

### Server/Client Architecture

```
[Server] page.tsx
  ├── fetches match data (team_stats, widgets) — NO QUERY CHANGES
  ├── parses JSONB via parseJsonObject<T>()
  ├── extracts events via extractMatchEvents() for EventMap + MatchTimeline
  ├── extracts breakthroughs inline from widgets
  ├── renders server components: Breakthroughs, MatchTimeline
  └── passes pre-parsed FlatEvent[] to:
      └── [Client] EventMap (standalone, manages own filter state via useLang())
```

### Research Insights: Server/Client Boundary

**From Architecture Strategist:**
- `useLang()` hook from `LanguageContext` is available to all client components (60+ call sites in codebase). Use it instead of serializing translations.
- EventMap should receive pre-parsed `FlatEvent[]` from server, not raw JSONB.

**From Pattern Recognition:**
- Pure components without `'use client'` rendered inside a client wrapper already exists (CompareView → RadarChart). BUT since MatchTimeline is now a server component and EventMap is standalone, this pattern is not needed.

**From Frontend Races:**
- Tooltip state machine: store `{event, x, y} | null` at click time. Dismiss on filter change, outside-click, and resize.
- Mobile: CSS `pointer-events: none` via media query is the cleanest approach — zero JS.

## Implementation Phases

### Phase A: Type Updates + Extraction Utilities

**Files:**
- `src/lib/camera/types.ts` — Fix `StarliveTeamStatEvent.extra` types
- `src/lib/camera/extract.ts` — Add event extraction helpers + constrain generics

**Tasks:**

1. **Update `StarliveTeamStatEvent.extra` types** (`src/lib/camera/types.ts:152-161`)

   Current `extra.player` is `number | null` but actual data is an object. Update:
   ```typescript
   extra: {
     player: {
       jersey: string
       player_id: number
       team_id: number
       position: { name: string; side: string } | null
       kind: string
       super_track_id: number
       super_track_uid: number
       match_id: number
     } | null
     video_start: string | null
     video_end: string | null
     event_end: string | null
     coords_start: [number, number] | null
     coords_finish: [number, number] | null
     additional_events: Record<string, unknown> | null
     training_part_id: number | null
   }
   ```

2. **Constrain `parseJsonObject<T>` and `getWidget<T>` generics** in `src/lib/camera/extract.ts`

   Change `<T>` to `<T extends Record<string, unknown>>` for type safety. (TypeScript reviewer)

3. **Add `extractMatchEvents()`, `FlatEvent`, `parseMatchMinute()` to `src/lib/camera/extract.ts`**

   Flatten events from `team_stats[teamId][category].events.{success,fail,neutral}[]` into a sorted, deduplicated list:

   ```typescript
   export interface FlatEvent {
     uid: string                    // synthetic: `${teamKey}-${category}-${outcome}-${id}`
     id: number                     // original Starlive event ID
     category: string               // 'shots', 'passes', 'tackles', etc.
     outcome: 'success' | 'fail' | 'neutral'
     teamKey: '1' | '2'
     timestamp: string              // "00:23:04.039999"
     minuteNum: number              // parsed: 23
     coordsStart: [number, number] | null
     coordsFinish: [number, number] | null
     playerJersey: string | null
     playerPosition: string | null
     videoStart: string | null
     videoEnd: string | null
   }

   export const EVENT_MAP_CATEGORIES = [
     'shots', 'key_passes', 'goals', 'passes', 'tackles',
     'interceptions', 'dribbles', 'fouls', 'clearances',
   ] as const

   export const TIMELINE_CATEGORIES = [
     'goals', 'shots_on_target', 'key_passes', 'yellow_cards', 'red_cards',
   ] as const

   export function extractMatchEvents(
     teamStats: StarliveTeamsData | null,
     categories: readonly string[]
   ): FlatEvent[]

   export function parseMatchMinute(timestamp: string): number
   ```

   **Key implementation details (from agent review):**
   - Deduplicate by `id` field — when same ID appears in multiple categories, prefer the more specific (goal > shot)
   - Use synthetic `uid` string for React keys and highlight state (prevents cross-team collision)
   - Cap at 200 events per extraction (truncate with warning) — prevents SVG performance issues with 800+ elements (Performance)
   - Events without `coordsStart` are excluded from EventMap but included in MatchTimeline

4. **Add `extractBreakthroughs()` and `BreakthroughData` to `src/lib/camera/extract.ts`**

   ```typescript
   export interface BreakthroughData {
     attack: Record<string, number>
     attackTotal: number
     defense: Record<string, number>
     defenseTotal: number
   }

   export function extractBreakthroughs(
     widgets: StarliveWidgets | null,
     teamKey: string
   ): BreakthroughData | null
   ```

### Phase B: Components — Breakthroughs + MatchTimeline + EventMap

**5. Breakthroughs component** (`src/components/match/Breakthroughs.tsx`)

Server component. Horizontal butterfly bar chart following `TeamComparisonStats.tsx` pattern.

Props:
```typescript
interface BreakthroughsProps {
  homeData: BreakthroughData | null
  awayData: BreakthroughData | null
  homeTeamName: string
  awayTeamName: string
  t: (key: string) => string
}
```

Layout:
- Two sections: "Attack Breakthroughs" and "Defense Breakthroughs"
- Each section: butterfly bar chart (home left, away right) with zone numbers 1-11 vertically
- Zone bar width proportional to count, `divide-y divide-border/50` container, `tabular-nums` on values
- Total displayed below each section
- Return `null` if both `homeData` and `awayData` are null

**6. MatchTimeline component** (`src/components/match/MatchTimeline.tsx`)

**Server component** (no interactivity needed in V1). Receives pre-extracted `FlatEvent[]` from page.

Props:
```typescript
interface MatchTimelineProps {
  events: FlatEvent[]        // pre-filtered to TIMELINE_CATEGORIES
  homeTeamName: string
  awayTeamName: string
  t: (key: string) => string
}
```

Layout:
- Scrollable container (`max-h-[400px] overflow-y-auto overflow-x-hidden`)
- Each entry: `[minute'] [icon] [team color dot] [description]`
- Icons per category: Goal (circle filled), Shot on target (target), Key pass (arrow), Card (rectangle)
- Team color: `var(--primary)` dot for home, `var(--foreground-muted)` dot for away
- Entries sorted by minute ascending
- Empty state: "No key events recorded" if list is empty
- Accessibility: standard list semantics (`<ol>` with `role="list"`)

**7. EventMap component** (`src/components/match/EventMap.tsx`)

**`'use client'` component** — standalone, manages own filter state via `useLang()`.

Props:
```typescript
interface EventMapProps {
  allEvents: FlatEvent[]        // all EVENT_MAP_CATEGORIES events from server
  homeTeamName: string
  awayTeamName: string
}
```

Internal state:
```typescript
const { t } = useLang()
const [eventTypeFilter, setEventTypeFilter] = useState<string>('shots')
const [activeTooltip, setActiveTooltip] = useState<{
  event: FlatEvent
  svgX: number
  svgY: number
} | null>(null)
```

**Filter change clears tooltip** (Frontend Races):
```typescript
const handleFilterChange = (val: string) => {
  setEventTypeFilter(val)
  setActiveTooltip(null)  // dismiss stale tooltip
}
```

**Filtered events with useMemo** (Performance):
```typescript
const filteredEvents = useMemo(
  () => allEvents.filter(e => e.category === eventTypeFilter && e.coordsStart),
  [allEvents, eventTypeFilter]
)
```

SVG rendering (`viewBox="0 0 1050 680"`):
- Full pitch outline (both halves, penalty areas, center circle, halfway line)
- CSS custom properties for all colors: `var(--border)` for pitch, `var(--primary)` for success, `var(--danger)` for fail, `var(--foreground-faint)` for neutral
- **Filled vs outline circles** for accessibility (not color-only): filled circle for success, outline-only circle for fail (2 visual channels: fill + color)
- Arrows from `coordsStart` to `coordsFinish` for passes/shots (SVG `<line>` with `markerEnd`)
- Key each element by `event.uid` (synthetic string ID, never index)
- Highlighted event: CSS `@keyframes eventPulse` defined in `globals.css`, uses `transform: scale(1.5)` not SVG `r` attribute
- SVG container: `overflow-hidden` class to prevent mobile horizontal scroll
- Accessibility: `role="img"`, `<title>`, `<desc>` summarizing event count

**Tooltip (state machine pattern from Frontend Races):**
```typescript
const handleEventClick = (event: FlatEvent, svgX: number, svgY: number) => {
  setActiveTooltip(prev =>
    prev?.event.uid === event.uid ? null : { event, x: svgX, y: svgY }
  )
}
```
- Position computed from SVG coordinates + scale factor (not `getBoundingClientRect` on SVG children)
- Rendered as HTML `<div>` positioned over SVG container
- Shows: minute, player jersey, outcome, "Video coming soon" if `videoStart` exists
- Clamped to viewport bounds
- Escape key dismisses (via `onKeyDown` handler)

**Mobile: CSS `pointer-events: none`** (Frontend Races):
```css
/* In globals.css */
@media (max-width: 767px) {
  .event-map-dots { pointer-events: none; }
}
```
Zero JS, zero state, zero hydration mismatch. MatchTimeline below provides the mobile-friendly text view.

### Phase C: Page Integration + Translations + Verification

**Files:**
- `src/app/(platform)/matches/[slug]/page.tsx` — Wire in 3 new components
- `src/lib/translations/landing.ts` — Add new match keys (no file split)
- `src/app/globals.css` — Add `@keyframes eventPulse` + mobile media query

**8. Update match detail page** (`src/app/(platform)/matches/[slug]/page.tsx`)

- **No Supabase query changes** — `team_stats` and `widgets` already fetched
- Import and call `extractMatchEvents(teamStats, EVENT_MAP_CATEGORIES)` for EventMap data
- Import and call `extractMatchEvents(teamStats, TIMELINE_CATEGORIES)` for MatchTimeline data
- Import and call `extractBreakthroughs(widgets, '1')` / `extractBreakthroughs(widgets, '2')` for Breakthroughs
- Render new components below existing Session 4 sections:

```
[Existing: Team Comparison, Shot Map, Attack Direction]
[NEW: Breakthroughs — server component, conditionally rendered]
[NEW: MatchTimeline — server component, conditionally rendered]
[NEW: EventMap — client component, conditionally rendered]
[Existing: Player Ratings Tables]
```

Section header pattern: `<h3 className="mb-4 text-lg font-semibold text-foreground">` (matches existing page pattern).

Conditional rendering pattern: `{hasBreakthroughData && (<div className="mt-6 card">...)}` (matches existing `hasShotMap` pattern).

**9. Add translation keys to `src/lib/translations/landing.ts`**

Add new keys to existing `matches:` block (~15 keys, not 30 — reduced scope):

```
matches.eventMap, matches.matchTimeline, matches.breakthroughs,
matches.filterByEvent, matches.allEvents,
matches.success, matches.fail, matches.neutral,
matches.minute, matches.videoComingSoon, matches.noEvents,
matches.attackBreakthroughs, matches.defenseBreakthroughs,
matches.total, matches.advancedAnalysis
```

Both en + ka. Reuse existing keys: `stats.tackles`, `stats.shotsOnTarget`, `matches.home`, `matches.away`, `camera.noDataYet`.

**10. Add CSS to `src/app/globals.css`**

```css
@keyframes eventPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.7; }
}

@media (max-width: 767px) {
  .event-map-dots { pointer-events: none; }
}
```

**11. Verify with test data** — All 3 components render correctly with the synced `index-3.json` sample data.

## Acceptance Criteria

### Functional

- [ ] EventMap plots events on SVG pitch with correct positions from Starlive coordinates
- [ ] EventMap filters by event type via dropdown (shots, passes, tackles, interceptions, etc.)
- [ ] EventMap shows tooltip on click with minute, player jersey, outcome
- [ ] EventMap tooltip dismisses on: click same event (toggle), filter change, Escape key
- [ ] MatchTimeline lists key events (goals, shots on target, cards, key passes) sorted by minute
- [ ] Breakthroughs shows attack/defense zone penetration as butterfly bar charts
- [ ] All components return `null` when their data is absent (no crashes)
- [ ] All user-facing strings use `t()` with en + ka translations
- [ ] `npm run build` passes with zero errors

### Non-Functional

- [ ] SVG visualizations scale responsively via `viewBox` + `className="w-full"`
- [ ] Only 1 client component added (EventMap) — minimal bundle impact
- [ ] EventMap defaults to "shots" filter — limits rendered SVG elements to ~20-100
- [ ] EventMap caps at 200 rendered events with truncation notice
- [ ] SVG elements keyed by `event.uid` (synthetic string), never by index
- [ ] Accessibility: SVG has `role="img"` + `<title>` + `<desc>`
- [ ] Accessibility: Filled vs outline circles (not color-only) for success/fail
- [ ] Mobile: EventMap dots have `pointer-events: none` via CSS media query
- [ ] Both light and dark themes render correctly (CSS custom properties in all SVG colors)
- [ ] SVG container has `overflow-hidden` to prevent mobile horizontal scroll

## File Operations Summary

| Operation | File | Component |
|-----------|------|-----------|
| Modify | `src/lib/camera/types.ts` | Fix event extra types |
| Modify | `src/lib/camera/extract.ts` | Add extraction utilities, constrain generics |
| Create | `src/components/match/Breakthroughs.tsx` | Server component |
| Create | `src/components/match/MatchTimeline.tsx` | Server component |
| Create | `src/components/match/EventMap.tsx` | Client component (standalone) |
| Modify | `src/app/(platform)/matches/[slug]/page.tsx` | Wire in 3 components |
| Modify | `src/lib/translations/landing.ts` | Add ~15 new match keys |
| Modify | `src/app/globals.css` | Add @keyframes + mobile media query |

**Total: 3 new files, 5 modified files = 8 file operations** (down from 12)

## Commits

1. **Single commit:** `feat: add event map, match timeline, and breakthroughs to match page`
   - Type updates, extraction utilities, all 3 components, page integration, translations, CSS

## Dependencies & Risks

**Dependencies:**
- Session 4 components exist and page fetches `team_stats` + `widgets` (already done)
- Test match data synced from `index-3.json` in database (already done in Session 2)

**Risks:**

1. **Event `extra.player` type mismatch** — TypeScript type says `number | null` but actual data is an object. Mitigation: Phase A fixes the type before any component uses it.

2. **Client bundle size** — Adding 1 `'use client'` component to a previously all-server page. Mitigation: EventMap is the only client component, data is pre-parsed server-side, `useLang()` is already in the client bundle.

3. **Event volume** — ~800 events across both teams for a single match. Mitigation: default to single event type filter + 200 cap limits rendered elements to 20-100 per view.

4. **JSONB payload size** — `team_stats` includes full event arrays (~70 categories × events). Already fetched. Mitigation: existing TODO at page.tsx:226-230 acknowledges this; no change in Session 4b. Future: `team_stats_summary` column populated at sync time (Performance reviewer).

5. **Tooltip positioning in SVG** — Computing position from SVG coordinates + container scale factor. Mitigation: avoid `getBoundingClientRect` on SVG children; use `toSvg()` coordinates directly.

## Deferred Items (V2)

1. **PressingTimeline** (PPDA/OPDA line charts) — Cut per Session 4 review + Simplicity reviewer. Niche metric, 80-120 lines of SVG coordinate math. Build when real users request it.
2. **ZoneBreakdown** (22-zone intensity grid) — Cut per Simplicity reviewer. Zone mapping unconfirmed; wait for Starlive docs.
3. **Cross-component interaction** (timeline click → map highlight) — Cut per Simplicity reviewer. Each component works independently. Add shared state wrapper when users request it.
4. **Player filter on EventMap** — Event type filter is sufficient for V1.
5. **Video play buttons** on EventMap/MatchTimeline — Waiting on Starlive video URLs.
6. **Bidirectional interaction** — Map click → timeline scroll. Use `flushSync` + `rAF` pattern from ChatThread.
7. **Pinch-to-zoom on mobile EventMap** — Touch interaction for dense maps.
8. **Translation file split** — Move `matches.*` keys to `matches.ts` when key count exceeds ~80.
9. **`team_stats_summary` column** — Populated at sync time to reduce JSONB payload. Only stores count/accurate/percent/value per category (~12KB vs full events).
10. **`intervals_widgets` query** — Add when a component needs interval-level data.

## Sources & References

### Internal References
- Session 4 plan: `docs/plans/2026-03-20-feat-camera-integration-session-4-match-report-ui-plan.md`
- Session sessions doc: `docs/plans/2026-03-20-camera-integration-sessions.md` (Session 4b)
- Design spec: `docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md` (sections 4b, 4c)
- Match detail page: `src/app/(platform)/matches/[slug]/page.tsx`
- Camera types: `src/lib/camera/types.ts`
- Camera extract: `src/lib/camera/extract.ts`
- ShotMap pattern: `src/components/match/ShotMap.tsx` (SVG pitch, zone circles, accessibility)
- TeamComparisonStats pattern: `src/components/match/TeamComparisonStats.tsx` (butterfly bars)
- AttackDirection pattern: `src/components/match/AttackDirection.tsx` (CSS flex bars)
- Sample JSON: `/mnt/c/Users/kvims/OneDrive/Pictures/Saved Pictures/index-3.json`

### Learnings Applied
- `docs/solutions/ui-bugs/chat-session-f-polish-reliability-accessibility.md` — Escape-to-close on overlays, `role="img"` on containers
- `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md` — No hardcoded strings, no fallback `??` patterns, `overflow-hidden` on scroll containers, test at 375px
- `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` — CSS custom properties for all SVG colors, borders over shadows, WCAG contrast ratios (foreground 10.2:1, muted 5:1)

### Agent Review Findings Reference
- **Architecture Strategist**: Use `useLang()`, no `intervals_widgets`, pre-extract data server-side, synthetic string IDs
- **TypeScript Reviewer**: Constrain generics to `T extends Record<string, unknown>`, add `translationKey` to RATING_THRESHOLDS (separate fix)
- **Performance Oracle**: `useMemo` on filtered events, cap at 200, CSS `transform: scale()` for pulse, `intervals` column is 4.7MB — never fetch
- **Code Simplicity Reviewer**: Cut PressingTimeline, ZoneBreakdown, MatchAdvancedViz; reduce from 12 to ~6 files
- **Frontend Races Reviewer**: Clear highlight on filter change, tooltip state machine, CSS `pointer-events: none`, key by `event.uid`
- **Security Sentinel**: No new concerns — React auto-escapes JSX, JSONB written by service role, public SELECT via RLS
- **Pattern Recognition**: Translation pattern deviation fixed (use `useLang()`), ZoneBreakdown raw widgets deviation fixed (component cut)
- **Fullstack-nextjs Reviewer**: `@keyframes` in globals.css, confirm extract.ts is right location, no `intervals_widgets`
