---
title: "refactor: Frontend Redesign Session 4 — Player Browse"
type: refactor
status: completed
date: 2026-03-16
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-16
---

# Frontend Redesign Session 4 — Player Browse

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** Architecture Strategist, Code Simplicity Reviewer, Performance Oracle, Pattern Recognition Specialist, Kieran TypeScript Reviewer, Julik Frontend Races Reviewer, Security Sentinel, Learnings Researcher (UI Redesign + Transfer Page), Repo Research Analyst, Spec Flow Analyzer

### Key Improvements from Research

1. **Drop sortable columns from list view** — Client-side sort written to URL params causes a snap-back race: user clicks "Goals" header → list reorders instantly → `router.push` triggers server re-render → server returns default order → list jumps back. With 12 players and 24-per-page pagination, sorting a single page is also functionally useless. Build list rows as static display only. Add server-side sorting in a future session if needed.

2. **Use `localStorage` for view toggle, NOT URL params** — View mode is a personal preference, not a shareable filter state. URL param approach requires propagation through `pageUrl()`, `clearFilters()`, every `router.push`, and creates stale-props sync issues between server and client. `localStorage` is simpler, persists across sessions, and avoids all race conditions.

3. **Inline the featured banner, don't create a separate file** — `FeaturedPlayerBanner.tsx` is 30 lines of JSX used in exactly one place (`PlayerDirectoryClient`). A separate file adds a new import, interface, and fictional "server component" claim (it renders inside a client wrapper, so it's client code regardless). Inline it.

4. **Label it "Featured" not "Trending this week"** — There is no trending calculation. The `is_featured` flag is manually set in the DB. Calling it "trending" is misleading and introduces a concept that doesn't exist. The translation key `players.featured` already exists.

5. **Extract `PlayerBrowseData` type to `src/lib/types.ts`** — Three components (PlayerCard, PlayerListRow, featured banner) need the same player shape. Currently duplicated between `PlayerCard.tsx` (with optional `id`) and `PlayerDirectoryClient.tsx` (with required `id`). Extract once, make `id` required, import everywhere.

6. **Use `rounded-full` for position badges** — The existing codebase (WatchlistPlayerRow, current PlayerCard, PlayerRefCard) uses `rounded-full` on small position badges. The plan initially used `rounded`. Match the established pattern.

7. **`sizes` prop fix = 10x image bandwidth reduction** — Current `sizes="(max-width: 640px) 100vw, ..."` serves 640px images for 56px containers on mobile. Setting `sizes="56px"` reduces per-card image transfer from ~30KB to ~3KB. With 24 cards, that's 720KB → 72KB per page load.

8. **Drop blur placeholder for tiny images** — `placeholder="blur"` adds decode/composite overhead for a 56px surface area where pop-in is imperceptible. Remove from PlayerCard (56px) and PlayerListRow (32px).

9. **Guard watchlist optimistic state against server revalidation** — Rapid starring across rows triggers overlapping `revalidatePath` calls. A ref-based in-flight guard prevents server data from resetting stars the user just toggled.

10. **Scroll to top on view toggle** — Grid/list toggle changes content height dramatically. Without scroll reset, the browser may snap to past-the-end position. Add `window.scrollTo({ top: 0, behavior: 'instant' })`.

11. **Preserve `POSITION_LEFT_BORDER_CLASSES` in constants** — PlayerCard stops using it, but `TransferCard` and `TransferSearch` still do. Don't delete from `constants.ts`.

12. **Preserve `{}` arg in `get_player_view_counts` RPC call** — The empty `{}` disambiguates the parameterized version of the function. Accidentally removing it reintroduces a resolved bug.

### Scope Adjustments from Research

| Original Plan Item | Decision | Reason |
|---|---|---|
| Sortable list-view columns | **Remove from Session 4** | Race condition (snap-back), useless at 12-24 items, misleading with pagination |
| URL param `view=list` | **Use `localStorage` instead** | View mode is preference, not filter; avoids sync races + URL clutter |
| Separate `FeaturedPlayerBanner.tsx` file | **Inline in PlayerDirectoryClient** | One-time use, 30 lines, no reuse case |
| "Trending this week" label | **Use "Featured" instead** | No trending calculation exists; `is_featured` is manual |
| `rounded` on position badges | **Use `rounded-full`** | Matches existing codebase pattern |
| `placeholder="blur"` on images | **Remove for small images** | Negligible UX benefit at 56px/32px; saves paint overhead |
| Separate `ViewToggle.tsx` component | **Inline in PlayerDirectoryClient** | Two buttons, used once |
| 9 execution steps | **Collapse to 4** | Translation keys added inline; banner inlined; card + skeleton combined |

---

## Overview

Redesign the player browse page from a generic card grid to a professional scouting discovery interface. Implement compact PlayerCard with stat chips, list view with static display rows, grid/list toggle, sticky filter bar, and inline featured player banner ("the bold move" for this page). This is Session 4 of 10 — player browse only, AI search restyling is Session 5.

**Branch:** Continue on `redesign/light-navy`

**Prerequisite:** Sessions 1-3 complete (A3 palette, ThemeProvider, 48px navbar, landing page redesign).

## Problem Statement / Motivation

The current player browse page has three issues:

1. **PlayerCard is oversized** — 176px (h-44) photo area dominates the card, pushing stat content below the fold. Position badge and view count overlay a large empty photo placeholder. The `border-l-[3px]` position-colored border is a nice touch but fights with the card structure.

2. **No view flexibility** — Scouts browsing 50+ players need a compact list view for quick scanning. The current grid-only layout works for casual browsing but not for focused evaluation. Professional scouting tools (Wyscout, TransferMarkt) always offer both.

3. **No bold move** — The page is functional but forgettable. Every player card looks the same. The `is_featured` flag exists in the DB and already sorts featured players first, but there's no visual emphasis.

## Proposed Solution

### Component Changes

| Component | Change | Scope |
|---|---|---|
| `src/lib/types.ts` | **Add** `PlayerBrowseData` shared type | Extract |
| `PlayerCard.tsx` | **Major redesign** — compact layout, rounded-square photo, stat chips, less whitespace | Rewrite |
| `PlayerListRow.tsx` | **New** — 40px static display row (no sortable columns) | Create |
| `PlayerDirectoryClient.tsx` | **Modify** — add grid/list toggle, inline featured banner, `localStorage` view mode | Update |
| `FilterPanel.tsx` | **Minor** — make sticky | Polish |
| `players/page.tsx` | **Minor** — extract featured player, pass separately | Update |
| `players/loading.tsx` | **Update** — skeleton matches new compact card | Update |
| `src/lib/translations/players.ts` | **Add** — ~4 new keys (viewGrid, viewList, name) | Update |

### New page layout:

```
[Navbar - 48px, sticky]
[AI Search Bar - from Session 5, untouched]
[FilterPanel - sticky below navbar when scrolling]
[Results header: "12 players found" + Grid/List toggle]
[Featured banner - inline, if featured player exists & not AI mode]
[Player Grid (cards) OR Player List (static rows)]
[Pagination]
```

---

## Technical Approach

### 0. Extract Shared Type (`src/lib/types.ts`)

**Do this first** — before any component work. Three components will consume this type.

```typescript
/** Player data shape for browse-page components (PlayerCard, PlayerListRow, featured banner). */
export interface PlayerBrowseData {
  id: string          // Required (not optional — every DB row has an id)
  slug: string
  name: string
  name_ka: string
  position: Position
  date_of_birth: string
  height_cm: number | null
  preferred_foot: string | null
  is_featured: boolean | null
  photo_url: string | null
  status: PlayerStatus
  club: { name: string; name_ka: string } | null
  season_stats: {
    goals: number | null
    assists: number | null
    matches_played: number | null
  } | null
}

export type ViewMode = 'grid' | 'list'
```

Delete `PlayerCardData` from `PlayerDirectoryClient.tsx` and update the inline `player` type in `PlayerCardProps` to reference `PlayerBrowseData`. The `viewCount` and `isWatched` props remain component-specific.

### 1. PlayerCard Redesign (`src/components/player/PlayerCard.tsx`)

**New design per spec (Component Patterns, lines 127-195):**

```tsx
// PlayerCard.tsx — redesigned
<Link href={`/players/${player.slug}`} className="card group block overflow-hidden">
  {/* Top row: rounded-square photo + info */}
  <div className="flex gap-3">
    {/* Photo — 56px rounded square (border-radius: 6px per spec) */}
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-elevated">
      {player.photo_url ? (
        <Image src={player.photo_url} alt={player.name} fill className="object-cover" sizes="56px" />
      ) : (
        <PlayerSilhouette size="sm" className="text-foreground-muted/20" />
      )}
    </div>

    {/* Name + meta */}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        {/* Position badge — rounded-full per existing codebase pattern */}
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}>
          {player.position}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
        {isFreeAgent ? (
          <span className="font-medium text-yellow-500 shrink-0">{t('players.freeAgent')}</span>
        ) : clubName ? (
          <span className="truncate">{clubName}</span>
        ) : null}
        <span>·</span>
        <span className="shrink-0">{age}</span>
        {player.preferred_foot && (
          <>
            <span>·</span>
            <span>{player.preferred_foot.charAt(0)}</span>
          </>
        )}
      </div>
    </div>

    {/* Watchlist star */}
    {initialWatched !== undefined && (
      <button onClick={handleWatch} disabled={isPending} ...>
        {isWatched ? '★' : '☆'}
      </button>
    )}
  </div>

  {/* Stat chips — per spec: bg-elevated, radius 4px, number 14px w500, label 9px text-faint */}
  {player.season_stats && (
    <div className="mt-3 flex gap-2">
      <div className="flex-1 rounded bg-elevated px-2 py-1.5 text-center">
        <span className="block text-sm font-medium text-foreground">{stats.goals}</span>
        <span className="text-[9px] text-foreground-faint">{t('players.goals')}</span>
      </div>
      <div className="flex-1 rounded bg-elevated px-2 py-1.5 text-center">
        <span className="block text-sm font-medium text-foreground">{stats.assists}</span>
        <span className="text-[9px] text-foreground-faint">{t('players.assists')}</span>
      </div>
      <div className="flex-1 rounded bg-elevated px-2 py-1.5 text-center">
        <span className="block text-sm font-medium text-foreground">{stats.matches_played}</span>
        <span className="text-[9px] text-foreground-faint">{t('players.matches')}</span>
      </div>
    </div>
  )}

  {/* Featured badge — below stats */}
  {isFeatured && (
    <span className="mt-2 inline-block rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold text-primary">
      {t('players.featured')}
    </span>
  )}
</Link>
```

**Key changes from current:**
- Photo: `h-14 w-14` (56px) rounded square, inline with name (not stacked above). `sizes="56px"` (10x bandwidth reduction).
- **No `placeholder="blur"`** — image is too small to benefit from blur-up loading.
- Position badge: next to name with `rounded-full` (matches existing pattern), not overlaying photo.
- Stats: 3 chip pills (`bg-elevated rounded`) instead of divider-separated bar.
- View count + popular badges: removed from card (was cluttering).
- `border-l-[3px]` position border: removed (spec says uniform card borders). **Keep `POSITION_LEFT_BORDER_CLASSES` in constants.ts** — TransferCard still uses it.
- Featured badge: `rounded-full bg-primary-muted text-primary` (tinted-transparent pattern, theme-safe).
- `.card` class provides 20px padding (unlayered CSS, can't be overridden by Tailwind utilities). Accept this padding.

**Watchlist optimistic state guard** (prevents server revalidation from resetting toggled stars):
```tsx
const actionInFlightRef = useRef(false)
const [isWatched, setIsWatched] = useState(initialWatched ?? false)

// Sync from server only when no local action is pending
useEffect(() => {
  if (!actionInFlightRef.current && initialWatched !== undefined) {
    setIsWatched(initialWatched)
  }
}, [initialWatched])

function handleWatch(e: React.MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (!player.id) return
  actionInFlightRef.current = true
  startTransition(async () => {
    try {
      if (isWatched) {
        const result = await removeFromWatchlist(player.id)
        if (!result.error) setIsWatched(false)
      } else {
        const result = await addToWatchlist(player.id)
        if (!result.error) setIsWatched(true)
      }
    } finally {
      actionInFlightRef.current = false
    }
  })
}
```

### 2. PlayerListRow — New Component (`src/components/player/PlayerListRow.tsx`)

Compact 40px **static display** row for professional scanning. No sortable columns — just data display.

```tsx
// PlayerListRow.tsx — 'use client' (for watchlist toggle)
import type { PlayerBrowseData } from '@/lib/types'

interface PlayerListRowProps {
  player: PlayerBrowseData
  viewCount?: number
  isWatched?: boolean
}

<Link href={`/players/${player.slug}`}
  className="table-row-hover flex items-center gap-3 px-4 py-2 text-sm transition-colors"
  style={{ minHeight: '40px' }}
>
  {/* Photo — 32px rounded square, sizes="32px", no blur placeholder */}
  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-elevated">
    {player.photo_url ? (
      <Image src={player.photo_url} alt={player.name} fill className="object-cover" sizes="32px" />
    ) : (
      <PlayerSilhouette size="sm" className="scale-75 text-foreground-muted/20" />
    )}
  </div>

  {/* Name — flex-1 */}
  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
    {displayName}
  </span>

  {/* Position badge — rounded-full */}
  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}>
    {player.position}
  </span>

  {/* Age — fixed width */}
  <span className="w-8 text-center text-foreground-muted">{age}</span>

  {/* Club — truncated, hidden on mobile */}
  <span className="hidden w-28 truncate text-foreground-muted sm:block">
    {clubName || '—'}
  </span>

  {/* Stats — fixed width columns */}
  <span className="w-8 text-center font-medium">{stats?.goals ?? '—'}</span>
  <span className="hidden w-8 text-center font-medium sm:block">{stats?.assists ?? '—'}</span>
  <span className="hidden w-8 text-center font-medium md:block">{stats?.matches_played ?? '—'}</span>

  {/* Watchlist star — same optimistic guard pattern as PlayerCard */}
  <button onClick={handleWatch} disabled={isPending} className="shrink-0 ...">
    {isWatched ? '★' : '☆'}
  </button>
</Link>
```

**List view header row (rendered in PlayerDirectoryClient before rows):**
```tsx
<div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
  <span className="w-8" /> {/* Photo spacer */}
  <span className="flex-1">{t('players.name')}</span>
  <span className="w-12 text-center">{t('players.position')}</span>
  <span className="w-8 text-center">{t('players.age')}</span>
  <span className="hidden w-28 sm:block">{t('players.club')}</span>
  <span className="w-8 text-center">{t('players.goals')}</span>
  <span className="hidden w-8 text-center sm:block">{t('players.assists')}</span>
  <span className="hidden w-8 text-center md:block">{t('players.matches')}</span>
  <span className="w-6" /> {/* Star spacer */}
</div>
```

**No sortable columns.** Headers are static labels. Server-side sorting can be added in a future session when the database supports `ORDER BY` on joined stat columns.

### 3. Grid/List Toggle + Featured Banner (in `PlayerDirectoryClient.tsx`)

**View mode from `localStorage`** — not URL param, not server prop:

```tsx
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  if (typeof window === 'undefined') return 'grid'
  return (localStorage.getItem('playerViewMode') as ViewMode) ?? 'grid'
})

function handleToggleView(mode: ViewMode) {
  setViewMode(mode)
  localStorage.setItem('playerViewMode', mode)
  window.scrollTo({ top: 0, behavior: 'instant' }) // Reset scroll on toggle
}
```

**Toggle buttons in results header:**
```tsx
<div className="mt-6 mb-4 flex items-center justify-between">
  <p className="text-sm text-foreground-muted" aria-live="polite">
    <span className="font-semibold text-foreground">{displayCount}</span>{' '}
    {displayCount !== 1 ? t('players.playerPlural') : t('players.player')} {t('common.found')}
  </p>

  <div className="flex items-center gap-1">
    <button
      onClick={() => handleToggleView('grid')}
      className={`rounded-md p-1.5 transition-colors ${
        viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:text-foreground'
      }`}
      aria-label={t('players.viewGrid')}
    >
      {/* Grid icon SVG */}
    </button>
    <button
      onClick={() => handleToggleView('list')}
      className={`rounded-md p-1.5 transition-colors ${
        viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:text-foreground'
      }`}
      aria-label={t('players.viewList')}
    >
      {/* List icon SVG */}
    </button>
  </div>
</div>
```

**Inline featured banner** (above grid/list, hidden during AI search):
```tsx
{featuredPlayer && !isAIActive && (
  <Link
    href={`/players/${featuredPlayer.slug}`}
    className="group relative mb-6 flex items-center gap-6 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary-muted to-surface p-5 transition-all hover:shadow-md"
  >
    {/* 80px photo, sizes="80px" */}
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-elevated">
      {featuredPlayer.photo_url ? (
        <Image src={featuredPlayer.photo_url} alt={featuredPlayer.name} fill className="object-cover" sizes="80px" />
      ) : (
        <PlayerSilhouette size="sm" className="scale-125 text-foreground-muted/20" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
        {t('players.featured')}
      </span>
      <h3 className="mt-1 truncate text-lg font-bold text-foreground group-hover:text-primary transition-colors">
        {lang === 'ka' ? featuredPlayer.name_ka : featuredPlayer.name}
      </h3>
      <div className="mt-0.5 flex items-center gap-2 text-sm text-foreground-muted">
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${POSITION_COLOR_CLASSES[featuredPlayer.position]}`}>
          {featuredPlayer.position}
        </span>
        {/* club · age */}
      </div>
    </div>
    {/* Stats on sm+ */}
    <div className="hidden items-center gap-4 sm:flex">
      {/* goals + assists as large numerals */}
    </div>
    {/* Chevron-right */}
  </Link>
)}
```

**Conditional rendering grid vs list:**
```tsx
{viewMode === 'grid' ? (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {displayPlayers.map((player) => (
      <PlayerCard key={player.slug} player={player} viewCount={viewCountMap[player.id]} isWatched={...} />
    ))}
  </div>
) : (
  <div className="rounded-xl border border-border bg-surface overflow-hidden">
    {/* List header */}
    <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs ...">...</div>
    {/* List rows */}
    {displayPlayers.map((player) => (
      <PlayerListRow key={player.slug} player={player} viewCount={viewCountMap[player.id]} isWatched={...} />
    ))}
  </div>
)}
```

### 4. Sticky FilterPanel (`FilterPanel.tsx`)

One-line change:

```tsx
<div className="sticky top-[48px] z-10 rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
```

`bg-surface` provides opaque backdrop. `z-10` is already on the element. `FilterPopover` uses absolute positioning within the panel div — stacking works correctly.

### 5. Server Page Updates (`players/page.tsx`)

Minimal changes — no `view` param (handled by `localStorage`):

```tsx
// Separate featured player from results:
const featuredPlayer = allCards.find(p => p.is_featured) ?? null

// Pass to client (no initialView prop needed):
<PlayerDirectoryClient
  clubs={clubs ?? []}
  serverPlayers={allCards}
  viewCountMap={viewCountObj}
  watchedPlayerIds={watchedPlayerIds}
  pagination={paginationElement}
  totalCount={total}
  featuredPlayer={featuredPlayer}
/>
```

**IMPORTANT: Do not modify the existing `supabase.rpc('get_player_view_counts', { player_ids: playerIds })` call.** The `{}` argument pattern is intentional — removing it reintroduces a resolved overload ambiguity bug.

---

## Technical Considerations

### Client/Server Boundary

- `PlayerCard` — stays `'use client'` (watchlist toggle)
- `PlayerListRow` — `'use client'` (same watchlist pattern)
- Featured banner — **inline JSX in PlayerDirectoryClient** (client component, renders conditionally on `isAIActive`)
- `PlayerDirectoryClient` — already client, holds toggle + banner state
- `FilterPanel` — already client, minor CSS
- `players/page.tsx` — server component, passes `featuredPlayer` prop

### Performance

- **10x image bandwidth reduction** — `sizes="56px"` instead of `sizes="100vw"` on cards. ~720KB → ~72KB per page on mobile.
- **No blur placeholder on small images** — saves paint overhead at 56px/32px scale.
- **No new queries** — featured player comes from existing query.
- **List view is lighter** — 32px photos, no stat chips, simpler DOM.
- **Known scaling debt** — stat filter path fetches up to 500 rows (`page.tsx:192`). Fine at 12 players, ceiling at 500+. Future fix: Postgres RPC for filtered+paginated stat queries.

### Mobile (375px+)

- **PlayerCard** — Photo + name row works at all widths. Stat chips 3-across.
- **PlayerListRow** — Hide club, assists, matches on mobile. Show: photo + name + position + age + goals + star.
- **Featured banner** — Stats hidden on mobile (`hidden sm:flex`).
- **Grid/list toggle** — Always visible. Touch targets 44px+.

### Accessibility

- Grid/list toggle buttons: `aria-label` text
- List view header row: semantic labels for columns
- Featured banner: focusable `<Link>` with full content
- Results count: `aria-live="polite"`
- Position badges: readable text (not color-only)

### Dark Mode

- Stat chips: `bg-elevated` → `#2A2623` dark, `#EAE6DF` light — readable
- Featured banner gradient: `from-primary-muted to-surface` → resolves in both themes. Verify contrast on gradient text.
- Position badges: theme-aware via `--pos-*` tokens
- All text uses semantic tokens

### Tailwind v4 Cascade Layer Warning

The `.card` class in `globals.css` is **unlayered** — it overrides all Tailwind utilities. You cannot use `card p-3` to reduce padding. Either:
- Accept `.card`'s default 20px (1.25rem) padding, or
- Don't use `.card` class and replicate with Tailwind utilities

For Session 4, accept the default padding. It works fine with the compact layout.

---

## Scope Boundaries — Session 4 vs Session 5

| Feature | Session | Why |
|---|---|---|
| PlayerCard redesign (compact, stat chips) | **4** | Core browse experience |
| List view (static display rows) | **4** | Core browse experience |
| Grid/list toggle (localStorage) | **4** | Required for list view |
| Featured player banner (inline) | **4** | The bold move for this page |
| Sticky filter panel | **4** | Minor CSS, improves UX |
| ~~Sortable list columns~~ | **Removed** | Race conditions, useless at current scale |
| AI Search bar restyling | **5** | Separate scope per spec |
| AI filter tag restyling | **5** | Separate scope per spec |

**Do NOT touch in Session 4:**
- `AISearchBar.tsx`, `AIFilterTags.tsx` — Session 5
- Any AI search API routes
- Player profile page (Session 6)
- Comparison page (Session 7)
- `POSITION_LEFT_BORDER_CLASSES` in constants.ts — still used by TransferCard

---

## Execution Order (4 Steps)

### Step 1: Types + PlayerCard + Loading Skeleton
**Files:** `src/lib/types.ts`, `src/components/player/PlayerCard.tsx`, `src/app/(platform)/players/loading.tsx`
1. Add `PlayerBrowseData` and `ViewMode` to `types.ts`
2. Rewrite PlayerCard: inline photo (56px), `sizes="56px"`, no blur, `rounded-full` position badge, stat chips, watchlist guard, remove `border-l-[3px]`
3. Update loading skeleton to match new compact card layout (use `.card` without padding override)
4. Add translation keys (`viewGrid`, `viewList`, `name`) inline as needed
5. Test: both themes, mobile, en/ka

### Step 2: PlayerListRow + Toggle + Featured Banner
**Files:** `src/components/player/PlayerListRow.tsx` (new), `src/components/player/PlayerDirectoryClient.tsx`, `src/app/(platform)/players/page.tsx`
1. Create `PlayerListRow` — static display row, 32px photo, `sizes="32px"`, no blur, same watchlist guard
2. In `PlayerDirectoryClient`: add `localStorage`-based view toggle, inline featured banner, conditional grid/list rendering, scroll-to-top on toggle
3. In `page.tsx`: extract `featuredPlayer`, pass as prop (no `view` param needed)
4. Update `PlayerDirectoryClient` to import `PlayerBrowseData` from types.ts, delete inline `PlayerCardData`
5. Test: toggle works, banner shows/hides, AI mode + toggle combo, both themes, mobile

### Step 3: Sticky FilterPanel
**Files:** `src/components/forms/FilterPanel.tsx`
1. Add `sticky top-[48px]` to outer div (z-10 already present)
2. Test: scroll behavior, popovers open correctly above sticky panel, both themes

### Step 4: Build + Visual Verification
1. `npm run build` — catch TypeScript errors
2. Both light and dark mode verification
3. Mobile at 375px
4. Both en and ka
5. Grid and list views
6. With and without featured player
7. Empty state (no players match filters)
8. AI search active + view toggle
9. Dark-on-dark contrast check: stat chips on card surface, badge readability

---

## Acceptance Criteria

- [x] `PlayerBrowseData` type extracted to `src/lib/types.ts`, used by all browse components
- [x] PlayerCard redesigned: 56px rounded-square photo inline, `rounded-full` position badge, 3 stat chips, `sizes="56px"`, no blur placeholder
- [x] PlayerListRow created: 40px static display rows (no sortable columns)
- [x] Grid/list toggle: `localStorage` persistence, scroll-to-top on toggle
- [x] Featured banner: inline in PlayerDirectoryClient, gradient, "Featured" label, hidden during AI search
- [x] FilterPanel sticky below navbar on scroll
- [x] Watchlist optimistic state guarded against server revalidation (ref-based in-flight flag)
- [x] All new strings bilingual (en/ka)
- [x] Both light and dark mode correct (including gradient contrast check)
- [x] Mobile responsive at 375px+
- [x] `npm run build` passes
- [x] Loading skeleton updated for compact card layout
- [x] No changes to AI search components (Session 5)
- [x] `POSITION_LEFT_BORDER_CLASSES` preserved in constants.ts
- [x] `get_player_view_counts` RPC call `{}` argument preserved

## Dependencies & Risks

**Dependencies:**
- Sessions 1-3 must be complete (A3 palette, ThemeProvider, navbar height)
- `is_featured` field must have at least one `true` value in DB for banner testing

**Risks:**
- **Stat chip layout may feel too small** — significant density increase. Mitigate by testing with real data, adjusting padding if needed.
- **List view column alignment** can drift on different content lengths. Use fixed `w-*` classes for numeric columns.
- **Sticky filter on mobile** — filter panel is tall (position chips + popovers). May push content too far down. Stretch: collapse to simpler sticky bar on mobile.
- **`.card` padding lock-in** — unlayered CSS gives 20px padding regardless of Tailwind utilities. If tighter padding needed, must either avoid `.card` or add `@layer components` wrapping (future refactor).

## Sources & References

- **Design spec:** `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` — Moment 2 (lines 332-340), Component Patterns (lines 127-205)
- **Session 3 plan:** `docs/plans/2026-03-16-refactor-frontend-redesign-session-3-landing-page-plan.md` — format reference
- **Current PlayerCard:** `src/components/player/PlayerCard.tsx` — baseline for redesign
- **Current page:** `src/app/(platform)/players/page.tsx` — server component data flow
- **Current client wrapper:** `src/components/player/PlayerDirectoryClient.tsx` — client state management
- **Constants:** `src/lib/constants.ts` — position color classes (keep `POSITION_LEFT_BORDER_CLASSES`)
- **Translations:** `src/lib/translations/players.ts` — existing player keys
- **Learnings:** `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` — tinted-transparent badge pattern, borders over shadows
- **Learnings:** `docs/solutions/ui-bugs/transfer-page-premium-redesign-and-rpc-fix.md` — RPC `{}` argument, position border constants
