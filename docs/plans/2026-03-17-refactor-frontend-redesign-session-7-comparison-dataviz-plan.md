---
title: "refactor: Frontend Redesign Session 7 — Comparison + Data Viz"
type: refactor
status: completed
date: 2026-03-17
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-17
---

# Frontend Redesign Session 7 — Comparison + Data Viz

## Enhancement Summary

**Deepened on:** 2026-03-17
**Research agents used:** Architecture Strategist, Code Simplicity Reviewer, Performance Oracle, Pattern Recognition Specialist, Kieran TypeScript Reviewer, Julik Frontend Races Reviewer, Security Sentinel, Learnings Researcher, Repo Research Analyst, SpecFlow Analyzer

### Key Improvements from Research

1. **Drop route restructure — keep query params** — 4 of 7 reviewers recommend against the `[[...slugs]]` catch-all. Query params (`?p1=&p2=`) already work, are shareable and bookmarkable, match industry standard (FotMob, SofaScore), and avoid introducing the first catch-all route in the codebase. The auth middleware blocks social crawlers anyway, so OG tags only benefit authenticated sharing (copy link, direct message). No route change needed.

2. **Fix loser bar color: `--foreground-faint` → `--foreground-muted`** — The plan originally used `var(--foreground-faint)` for the loser bar. But `StatBar.tsx` uses `var(--foreground-muted)` for "below average." The loser bar semantically maps to the same tier. Additionally, `--foreground-faint` (`#6B6660` dark) is nearly invisible on the `bg-border/30` track in dark mode. Pattern Recognition flagged this.

3. **Skip `--accent` token — use `--pos-gk` directly** — The proposed `--accent: #FBBF24` (dark) is pixel-identical to `--pos-gk: #FBBF24` (dark). No other token pair in the codebase shares a resolved value. Adding `--accent` for a single use case (radar chart P2) creates token confusion. Use `var(--pos-gk)` directly with a comment `/* gold — secondary player */`. (Pattern Recognition + Simplicity)

4. **Type-safe dynamic key access with `SkillKey` union** — `player1.skills?.[key]` where `key` is `string` fails TypeScript strict mode (no index signature). Must define `type SkillKey = keyof NonNullable<PlayerData['skills']>` and type the array as `SkillKey[]`. Same for `StatKey`. (TypeScript reviewer — **must fix**)

5. **Translation interpolation via `.replace()`, not `t()` params** — The `t()` function returns a raw string with no interpolation support. `t('compare.leadsIn', { count, total })` silently ignores the second argument, rendering literal `{count}`. Use `t('compare.leadsIn').replace('{count}', String(count)).replace('{total}', String(total))` — matches existing codebase pattern (`activeFilters`, `playersFound`). (TypeScript reviewer — **must fix**)

6. **Add AbortController to PlayerSearchSelect** — Pre-existing stale-fetch race: no cancellation on search API calls. If user focuses selector B while selector A's fetch is in-flight, stale results can overwrite. The `AISearchBar` component already uses `AbortController` — apply same pattern. (Races reviewer — medium severity)

7. **Clean up CopyLinkButton timeout on unmount** — `setTimeout(() => setCopied(false), 2000)` is not cleared on unmount. Use `useRef<ReturnType<typeof setTimeout>>` + cleanup in `useEffect` return. (Races reviewer)

8. **`transition-all` → `transition-[width] duration-150`** — `transition-all` monitors every CSS property unnecessarily. Bar width is the only property that should animate. Also, 500ms is too slow for a data update — bars sluggishly saunter to their position while the user waits. 150ms is enough for the eye to catch the motion. (Performance + Races reviewers)

9. **One responsive CompareBar, not two components** — Instead of `hidden md:block` + `md:hidden` with separate Desktop/Mobile bar components, make a single `CompareBar` that uses responsive Tailwind classes (`grid-cols-1 md:grid-cols-[1fr_auto_1fr]`). Avoids 40+ lines of duplication. (Simplicity reviewer)

10. **Keep `max-w-7xl` outer, add `max-w-4xl` inner** — `max-w-4xl` would be the only instance in the entire codebase. Every other page uses `max-w-7xl`. Keep the outer container consistent; wrap just the comparison bars section in a `max-w-4xl mx-auto` inner container. (Pattern Recognition)

11. **Fixed-width span for diff alignment, not `text-transparent`** — `text-transparent` is a novel pattern in this codebase and causes screen readers to read invisible "+3" text. Use a fixed-width `w-10` container instead: populated with `+{diff}` on winner side, empty on non-winner side. Add `aria-hidden="true"` on the diff for safety. (Pattern Recognition + a11y)

12. **Add ARIA labels to comparison bars** — CompareBar has no `aria-label` or `role` attributes. Screen readers cannot interpret "Player A has 75 pace, Player B has 82 pace." Add `aria-label` describing the comparison result. (SpecFlow Analyzer)

13. **Rapid selection race: use local pending state** — When user changes P1 then immediately changes P2, the second `router.push` reads stale `selectedP2` from server props (not yet updated). Fix: track pending slugs in local state, synced from server props via `useEffect`. (Races reviewer — low-medium)

### Scope Adjustments from Research

| Original Plan Item | Decision | Reason |
|---|---|---|
| `[[...slugs]]` catch-all route | **Keep query params** | 4/7 reviewers; YAGNI; only catch-all in codebase; auth blocks crawlers |
| New `--accent` / `--accent-muted` tokens | **Use `--pos-gk` directly** | Dark mode identical to `--pos-gk`; single use case |
| `var(--foreground-faint)` for loser bar | **Use `var(--foreground-muted)`** | Matches StatBar pattern; better dark mode contrast |
| Separate MobileCompareBar component | **One responsive CompareBar** | Simplicity; avoids 40+ lines duplication |
| `text-transparent` diff alignment | **Fixed-width span** | A11y; novel pattern; screen reader confusion |
| `max-w-4xl` container | **`max-w-7xl` outer + `max-w-4xl` inner** | Only 4xl in codebase |
| `transition-all duration-500` | **`transition-[width] duration-150`** | Performance; UX — 500ms too slow |
| `t('key', { count })` interpolation | **`.replace('{count}', String(count))`** | `t()` has no interpolation support |
| OG tags for social crawlers | **Auth-only sharing** | Middleware blocks unauthenticated crawlers |
| 8 files modified | **6 files modified** | No route files moved, no globals.css token additions |

---

## Overview

Redesign the player comparison tool from a functional utility into a polished evaluation interface. Implement quick verdict summary, stat diffs beside every bar, theme-aware colors (replace all hardcoded hex), gold accent for player 2 on radar overlay, enhanced Open Graph metadata, responsive mobile layout, and race condition fixes. This is Session 7 of 10 — comparison page only.

**Branch:** Continue on `redesign/light-navy`

**Prerequisite:** Sessions 1-6 complete (A3 palette, ThemeProvider, 48px navbar, landing page, player browse, AI search, player profile).

## Problem Statement / Motivation

The current comparison tool (`CompareView.tsx`) is functionally complete but has four issues:

1. **Hardcoded colors break theming** — `CompareBar` uses `#10b981` (winner green), `rgba(152, 150, 163, 0.3)` (loser gray), and `text-emerald-500` (Tailwind class). These bypass the CSS custom property system, causing inconsistency in dark mode and against the A3 palette.

2. **No verdict or stat diffs** — Scouts must visually scan every bar to determine who leads. Professional tools (SofaScore, FotMob) show a summary verdict ("Player A leads in 7/12 stats") and numeric diffs ("+3.2") beside each bar. This is "the bold move" for the comparison page per the design spec.

3. **Radar overlay uses red for player 2** — Currently `var(--pos-def)` (red). The spec calls for green + gold fills, which is more neutral and avoids the "bad player" association of red.

4. **No Open Graph metadata** — The page generates a dynamic `<title>` but has no OpenGraph or Twitter card tags. The existing query-param URL (`?p1=slug&p2=slug`) is already shareable; it just needs proper social meta tags for when scouts share via copy-link or messaging.

## Proposed Solution

### Component Changes

| Component | Change | Scope |
|---|---|---|
| `CompareView.tsx` | Verdict, stat diffs, theme-aware colors, responsive mobile layout, pending state fix, AbortController | Major |
| `CompareRadarChart.tsx` | Change player 2 color from red (`--pos-def`) to gold (`--pos-gk`) | Minor |
| `PlayerSearchSelect.tsx` | Add AbortController for stale-fetch race | Minor |
| `compare/page.tsx` | Enhanced OG metadata (query params kept) | Minor |
| `compare/loading.tsx` | Updated skeleton matching new layout | Minor |
| `translations/players.ts` | New compare keys (verdict, diffs) | Minor |

### No New Files, No Route Changes

All changes are modifications to existing files. URL stays as `/players/compare?p1=slug&p2=slug`.

## Technical Approach

### 1. Enhanced Open Graph Metadata (existing route)

Add OG + Twitter card tags to the existing `generateMetadata` in `compare/page.tsx`. The `searchParams` approach stays unchanged:

```tsx
export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const params = await searchParams
  if (!params.p1 || !params.p2) {
    return {
      title: 'Compare Players | Georgian Football Talent Platform',
      description: 'Side-by-side comparison of Georgian youth football players.',
    }
  }

  const supabase = await createClient()
  const [{ data: p1 }, { data: p2 }] = await Promise.all([
    supabase.from('players').select('name, position').eq('slug', params.p1).single(),
    supabase.from('players').select('name, position').eq('slug', params.p2).single(),
  ])

  const title = p1 && p2
    ? `${p1.name} vs ${p2.name} | Compare Players`
    : 'Compare Players | Georgian Football Talent Platform'

  const description = p1 && p2
    ? `Head-to-head comparison of ${p1.name} (${p1.position}) and ${p2.name} (${p2.position}). Skills, stats, and career data.`
    : 'Side-by-side comparison of Georgian youth football players.'

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Georgian Football Talent Platform' },
    twitter: { card: 'summary', title, description },
  }
}
```

> **OG for authenticated sharing only** — The `(platform)/` auth guard and middleware redirect unauthenticated requests (including social crawlers) to `/login`. OG tags work when authenticated users share links via messaging apps that follow redirects with cookies. Social preview cards (Twitter, Slack unfurl) will NOT render — this is a fundamental limitation of auth-gated platforms. Fixing this requires middleware allow-listing and is out of scope for Session 7.

> **No OG image generation** — Server-side image generation (e.g., `ImageResponse` from `next/og`) is out of scope. Add in a future polish session.

### 4. Quick Verdict Summary

Add a verdict bar between the player selectors and the chart/bars section. Shows "Player A leads in 7 of 12 stats" as a concise evaluation summary. Only count stats where **both** players have non-null values (avoids penalizing missing data). Hide verdict entirely if no stats are comparable.

**Type-safe key access** — derive union types from `PlayerData`:

```tsx
type SkillKey = keyof NonNullable<PlayerData['skills']>
type StatKey = keyof NonNullable<PlayerData['season_stats']>

const SKILL_KEYS: SkillKey[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical']
const STAT_KEYS: StatKey[] = ['goals', 'assists', 'matches_played', 'minutes_played', 'pass_accuracy', 'tackles']
```

**Translation interpolation** — use `.replace()` since `t()` has no param support:

```tsx
function QuickVerdict({ player1, player2, getName, t }: VerdictProps) {
  let p1Wins = 0, p2Wins = 0, totalCompared = 0

  for (const key of SKILL_KEYS) {
    const v1 = player1.skills?.[key] ?? null  // type-safe: key is SkillKey
    const v2 = player2.skills?.[key] ?? null
    if (v1 != null && v2 != null) {
      totalCompared++
      if (v1 > v2) p1Wins++
      else if (v2 > v1) p2Wins++
    }
  }
  for (const key of STAT_KEYS) {
    const v1 = player1.season_stats?.[key] ?? null
    const v2 = player2.season_stats?.[key] ?? null
    if (v1 != null && v2 != null) {
      totalCompared++
      if (v1 > v2) p1Wins++
      else if (v2 > v1) p2Wins++
    }
  }

  if (totalCompared === 0) return null  // no comparable data

  const leader = p1Wins > p2Wins ? getName(player1) : p2Wins > p1Wins ? getName(player2) : null
  const leadCount = Math.max(p1Wins, p2Wins)

  const leadsText = t('compare.leadsIn')
    .replace('{count}', String(leadCount))
    .replace('{total}', String(totalCompared))

  return (
    <div className="rounded-lg bg-surface border border-border px-4 py-3 text-center text-sm">
      {leader ? (
        <span>
          <span className="font-semibold text-primary">{leader}</span>{' '}
          <span className="text-foreground-muted">{leadsText}</span>
        </span>
      ) : (
        <span className="text-foreground-muted">{t('compare.evenMatch')}</span>
      )}
    </div>
  )
}
```

> **Unweighted count** — All stats count equally (industry standard — SofaScore, FotMob do the same). Weighted scoring deferred to Future Work.

### 5. Stat Diffs on Every CompareBar + Theme-Aware Colors

Add `+N` beside the winner's value. Replace all hardcoded hex colors. Fix transition.

**Color replacement table:**

| Before | After | Why |
|---|---|---|
| `#10b981` (winner) | `var(--primary)` | Matches theme green |
| `rgba(152, 150, 163, 0.3)` (loser) | `var(--foreground-muted)` | Matches StatBar "below avg" pattern; visible in dark mode |
| `text-emerald-500` (winner text) | `text-primary` | A3 Tailwind utility |
| `transition-all duration-500` | `transition-[width] duration-150` | Scoped transition; 150ms snappy response |

**Diff alignment** — use fixed-width `w-10` span (not `text-transparent`):

```tsx
function CompareBar({ label, v1, v2, max, suffix = '' }: CompareBarProps) {
  const n1 = v1 ?? 0
  const n2 = v2 ?? 0
  const reference = max ?? Math.max(n1, n2, 1)
  const pct1 = (n1 / reference) * 100
  const pct2 = (n2 / reference) * 100
  const diff = Math.abs(n1 - n2)
  const winner = n1 > n2 ? 1 : n2 > n1 ? 2 : 0
  const hasDiff = diff > 0 && v1 != null && v2 != null

  const winnerColor = 'var(--primary)'
  const loserColor = 'var(--foreground-muted)'  // matches StatBar pattern
  const tieColor = 'var(--foreground-muted)'

  const color1 = winner === 1 ? winnerColor : winner === 0 ? tieColor : loserColor
  const color2 = winner === 2 ? winnerColor : winner === 0 ? tieColor : loserColor
  const textColor1 = winner === 1 ? 'text-primary font-semibold' : 'text-foreground'
  const textColor2 = winner === 2 ? 'text-primary font-semibold' : 'text-foreground'
  const diffText = hasDiff ? (suffix === '%' ? `+${diff.toFixed(1)}` : `+${diff}`) : ''

  return (
    <div aria-label={`${label}: ${n1}${suffix} vs ${n2}${suffix}`}>
      <div className="text-center text-xs text-foreground-muted mb-1">{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        {/* P1 side */}
        <div className="flex items-center gap-1.5">
          <span className="w-10 shrink-0 text-[10px] tabular-nums text-primary text-left" aria-hidden="true">
            {winner === 1 ? diffText : ''}
          </span>
          <span className={`shrink-0 text-sm tabular-nums ${textColor1}`}>
            {v1 == null ? '—' : `${n1}${suffix}`}
          </span>
          <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden relative">
            <div
              className="absolute inset-y-0 right-0 rounded-full transition-[width] duration-150"
              style={{ width: `${pct1}%`, backgroundColor: color1 }}
            />
          </div>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* P2 side */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150"
              style={{ width: `${pct2}%`, backgroundColor: color2 }}
            />
          </div>
          <span className={`shrink-0 text-sm tabular-nums ${textColor2}`}>
            {v2 == null ? '—' : `${n2}${suffix}`}
          </span>
          <span className="w-10 shrink-0 text-[10px] tabular-nums text-primary text-right" aria-hidden="true">
            {winner === 2 ? diffText : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
```

**Design decisions:**
- Fixed-width `w-10` spans on both sides maintain alignment without `text-transparent`
- Winner side shows `+N`, non-winner side is empty — screen readers skip via `aria-hidden`
- Format: `+3` for integers, `+3.2` for percentages
- No diff when values are equal or either is null
- `aria-label` on the container describes the comparison for screen readers

### 6. CompareRadarChart — Gold for Player 2

Use existing `--pos-gk` token (gold) instead of `--pos-def` (red). No new `--accent` token needed.

```tsx
// Before (CompareRadarChart.tsx):
<polygon fill="var(--pos-def)" fillOpacity={0.15} stroke="var(--pos-def)" strokeWidth={2} />
<circle fill="var(--pos-def)" />
<span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--pos-def)]" />

// After:
<polygon fill="var(--pos-gk)" fillOpacity={0.15} stroke="var(--pos-gk)" strokeWidth={2} />
<circle fill="var(--pos-gk)" />
<span className="inline-block h-2.5 w-2.5 rounded-full bg-pos-gk" />
```

**Legend:** Green dot + name (P1) | Gold dot + name (P2)

> **Why `--pos-gk` not a new `--accent`?** — `--accent` dark value (`#FBBF24`) is identical to `--pos-gk` dark value (`#FBBF24`). No token pair in the codebase shares a resolved value. For a single use case, reusing the existing gold token is simpler.

### 7. Responsive Mobile Layout (One Component)

Instead of duplicating `CompareBar` for mobile, use responsive Tailwind classes within the single component. The center-growing bar grid becomes stacked below `md`:

```tsx
{/* Responsive: center-growing on md+, stacked on mobile */}
<div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-1 md:gap-2 items-center">
  {/* On mobile: P1 value + bar on first row */}
  {/* On md+: P1 side with bar growing left */}
  ...
</div>
```

On mobile (< 768px), each bar section stacks:
```
Pace
  Kvaratskhelia: ████████░░ 78 (+12)
  Mamardashvili: █████░░░░░ 66
```

**Mobile radar chart:** Add `max-w-[200px] md:max-w-[280px]` (scale down).

**Player selectors:** Already `grid-cols-1 sm:grid-cols-2` — no change needed.

### 8. Race Condition Fixes

**8a. AbortController for PlayerSearchSelect** (pre-existing fix):

```tsx
// In PlayerSearchSelect.tsx:
const abortRef = useRef<AbortController | null>(null)

const search = useCallback(async (q: string) => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  setIsLoading(true)
  try {
    const res = await fetch(`/api/players/search?${params}`, { signal: controller.signal })
    const data = await res.json()
    setResults(data.players ?? [])
  } catch (err) {
    if ((err as Error).name !== 'AbortError') setResults([])
  } finally {
    if (!controller.signal.aborted) setIsLoading(false)
  }
}, [])

// Cleanup on unmount:
useEffect(() => () => { abortRef.current?.abort() }, [])
```

**8b. Local pending state for rapid selection** (in CompareView):

```tsx
const [pendingP1, setPendingP1] = useState(selectedP1)
const [pendingP2, setPendingP2] = useState(selectedP2)

useEffect(() => { setPendingP1(selectedP1) }, [selectedP1])
useEffect(() => { setPendingP2(selectedP2) }, [selectedP2])

function updatePlayer(which: 'p1' | 'p2', slug: string) {
  const s1 = which === 'p1' ? slug : pendingP1
  const s2 = which === 'p2' ? slug : pendingP2
  if (which === 'p1') setPendingP1(slug)
  else setPendingP2(slug)
  const params = new URLSearchParams()
  if (s1) params.set('p1', s1)
  if (s2) params.set('p2', s2)
  router.push(`/players/compare?${params.toString()}`)
}
```

**8c. CopyLinkButton timeout cleanup:**

```tsx
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

async function handleCopy() {
  await navigator.clipboard.writeText(window.location.href)
  setCopied(true)
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
  timeoutRef.current = setTimeout(() => setCopied(false), 2000)
}
```

### 9. Updated Loading Skeleton

```tsx
export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      {/* Title */}
      <div className="h-8 w-48 rounded bg-elevated mb-6" />
      {/* Player selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <div className="h-10 rounded-lg bg-elevated" />
        <div className="h-10 rounded-lg bg-elevated" />
      </div>
      {/* Verdict bar */}
      <div className="mx-auto max-w-4xl">
        <div className="h-12 rounded-lg bg-elevated mb-6" />
        {/* Radar chart */}
        <div className="mx-auto h-64 w-64 rounded-lg bg-elevated mb-6" />
        {/* Bars */}
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-8 rounded bg-elevated" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 10. Translation Keys

Add to `src/lib/translations/players.ts`. Use `{count}` / `{total}` placeholders consumed via `.replace()`:

**English (`en.compare`):**
```ts
leadsIn: 'leads in {count} of {total} comparable stats',
evenMatch: 'Even match — both players are comparable',
```

**Georgian (`ka.compare`):**
```ts
leadsIn: 'ლიდერია {count} სტატისტიკაში {total}-დან',
evenMatch: 'თანაბარი მატჩი — ორივე მოთამაშე შედარებადია',
```

> Existing unused keys `compare.diff` and `compare.attribute` can be repurposed if needed.

### 11. Container Width — Inner Wrapper

Keep `max-w-7xl` on the outer page container (matches every other platform page). Wrap the comparison section (verdict + radar + bars) in a narrower inner container:

```tsx
<div className="mx-auto max-w-7xl px-4 py-8">
  {/* Title + selectors at full width */}
  ...
  {/* Comparison content narrower */}
  <div className="mx-auto max-w-4xl">
    <QuickVerdict ... />
    <CompareRadarChart ... />
    <CompareBar ... />
  </div>
</div>
```

## Execution Order

### Step 1: Foundation (translations + OG metadata)
1. Add new translation keys to `players.ts` (en + ka)
2. Add OG + Twitter card metadata to `compare/page.tsx` `generateMetadata`
3. Verify: `npm run build`

### Step 2: Theme-Aware CompareBar + Diffs
1. Replace hardcoded hex in `CompareBar` with CSS variable colors (`--primary`, `--foreground-muted`)
2. Replace `text-emerald-500` → `text-primary`
3. Replace `transition-all duration-500` → `transition-[width] duration-150`
4. Add stat diff display (fixed-width `w-10` spans with `+N` on winner side)
5. Add `aria-label` to CompareBar container
6. Test both themes visually

### Step 3: Verdict + Radar Gold
1. Define `SkillKey` / `StatKey` union types (from `PlayerData`)
2. Add `QuickVerdict` inline in `CompareView.tsx` (with `.replace()` interpolation)
3. Change `CompareRadarChart` player 2 from `--pos-def` to `--pos-gk`
4. Update legend colors

### Step 4: Race Fixes + Mobile + Polish
1. Add AbortController to `PlayerSearchSelect.tsx`
2. Add pending state for rapid selection in `CompareView.tsx`
3. Fix CopyLinkButton timeout cleanup
4. Make CompareBar responsive (stacked below `md`)
5. Scale down radar chart on mobile
6. Add `max-w-4xl` inner wrapper for comparison section
7. Update loading skeleton

### Step 5: Build + Verification
1. Run `npm run build` — verify no type errors
2. Both themes verified (light + dark)
3. Mobile verified at 375px
4. Both languages verified (en + ka)
5. Verify AbortController cancels stale fetches (DevTools network throttling)

## Acceptance Criteria

### Functional Requirements
- [x] `/players/compare?p1=slug1&p2=slug2` shows comparison (query params preserved)
- [x] `/players/compare` shows empty state with player selectors
- [x] Quick verdict displays correct lead count (only non-null shared stats counted)
- [x] Verdict hidden when no comparable data exists
- [x] Even match displayed when leads are equal
- [x] Stat diffs show `+N` on winner side for each bar
- [x] No diff shown when values are equal or null
- [x] Player selector works (search, select, clear)
- [x] Copy link button copies the current URL
- [x] Open Graph meta tags render correctly (title, description, og:title, twitter:card)

### Theme Requirements
- [x] CompareBar uses `var(--primary)` for winner (no hardcoded hex)
- [x] CompareBar uses `var(--foreground-muted)` for loser (matches StatBar)
- [x] Winner text uses `text-primary` (not `text-emerald-500`)
- [x] Radar chart player 2 uses gold (`var(--pos-gk)`) not red
- [x] Both light and dark themes render correctly
- [x] No hardcoded hex values remain in compare components
- [x] WCAG 3:1 graphical contrast verified for bar colors on `bg-border/30` in both themes

### Mobile Requirements
- [x] Below 768px: bars use responsive stacked layout
- [x] Below 768px: radar chart scales to `max-w-[200px]`
- [x] Player selectors work on touch devices
- [x] Touch targets minimum 44px
- [x] Content readable at 375px width

### i18n Requirements
- [x] All new strings use `t()` with both en and ka
- [x] Verdict uses `.replace()` interpolation (not `t()` params)
- [x] Verdict sentence reads naturally in both languages

### Accessibility Requirements
- [x] CompareBar has `aria-label` describing the comparison
- [x] Diff spans have `aria-hidden="true"`
- [x] Winner differentiated by bold text weight (not color alone)

### Quality Gates
- [x] `npm run build` passes with zero errors
- [x] No `any` types introduced
- [x] `SkillKey` / `StatKey` union types used (no `as` casts on dynamic access)
- [x] CSS variables used for all colors (no hardcoded hex)
- [x] AbortController on PlayerSearchSelect (stale fetch race fixed)
- [x] CopyLinkButton timeout cleaned on unmount
- [x] Loading skeleton matches new layout

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| `t()` has no interpolation support | Use `.replace('{count}', String(n))` — matches existing codebase pattern |
| `--pos-gk` gold used for radar P2 could confuse with GK position | Add comment in code: `/* gold — secondary player */` |
| Responsive CompareBar on mobile may need iteration | Start with `grid-cols-1 md:grid-cols-[1fr_auto_1fr]`, adjust after visual check |
| Pending state adds local state to CompareView | Minimal — 2 `useState` + 2 `useEffect`, synced from server props |
| OG tags not visible to social crawlers | Auth middleware blocks; OG works for auth'd sharing only. Middleware allow-list is future work. |

## Future Work (NOT Session 7)
- OG image generation via `next/og` (dynamic comparison card image)
- Middleware allow-listing for social crawler OG tag access
- Clean slug-based URLs (`/players/compare/slug1/slug2`) if needed post-launch
- Animated bar growth on initial view (count-up style)
- Swap players button (reverse P1 and P2 in one click)
- Season label display in stats section (avoid cross-season comparison confusion)
- Weighted verdict scoring (goals > tackles)
- Keyboard navigation in PlayerSearchSelect (arrow keys, Enter)
- Print-friendly comparison layout
- Export comparison as PDF

## Sources & References

### Design Spec
- `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` — Moment 4: Evaluation (lines 357-367), Session 7 (line 473)

### Internal References
- `src/components/player/CompareView.tsx` — Current comparison UI (423 lines)
- `src/components/player/CompareRadarChart.tsx` — Overlay radar chart (163 lines)
- `src/components/player/PlayerSearchSelect.tsx` — Search dropdown (148 lines), no AbortController
- `src/components/player/AISearchBar.tsx` — Reference for AbortController pattern (line 29)
- `src/app/(platform)/players/compare/page.tsx` — Server component with data fetching (86 lines)
- `src/components/player/StatBar.tsx` — Theme-aware color pattern (`--primary`, `--pos-gk`, `--foreground-muted`)
- `src/app/globals.css` — A3 palette tokens, position colors
- `src/lib/translations/players.ts` — Existing compare translation keys (lines 184-209, 395-420)
- `src/lib/translations/players.ts:72` — Existing `.replace('{count}')` interpolation pattern

### Related Sessions
- Session 6 plan: `docs/plans/2026-03-16-refactor-frontend-redesign-session-6-player-profile-plan.md` — StatBar theme-aware pattern (reuse in CompareBar)

### Review Agent Findings
- Architecture Strategist: Route auth guard cascade verified; `SkillKey` typing flagged
- Code Simplicity: Route restructure dropped; duplicate mobile bars dropped
- Performance Oracle: `transition-[width]` fix; metadata queries acceptable
- Pattern Recognition: Loser bar color corrected; container width inner-wrapper approach
- TypeScript Reviewer: `SkillKey` union type required; `t()` interpolation broken
- Races Reviewer: AbortController for search; pending state for rapid selection; CopyLinkButton cleanup
- Security Sentinel: Overall LOW risk; slug injection safe via `.eq()` parameterization
- SpecFlow Analyzer: OG auth blocker; season mismatch noted; a11y gaps flagged
