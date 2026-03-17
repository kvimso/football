---
title: "refactor: Frontend Redesign Session 6 — Player Profile Redesign"
type: refactor
status: completed
date: 2026-03-16
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-16
---

# Frontend Redesign Session 6 — Player Profile Redesign

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** Frontend Design Specialist, Architecture Strategist, Code Simplicity Reviewer, Kieran TypeScript Reviewer, Julik Frontend Races Reviewer, Performance Oracle, Pattern Recognition Specialist, Security Sentinel, UI Redesign Learnings Applicability

### Key Improvements from Research

1. **Cancel rAF loop on unmount in CountUpStat** — The `requestAnimationFrame` animation chain has no cancellation. If the user navigates away mid-animation (600ms window), `setDisplay` fires on a ghost component, leaking frames. Fix: add a cancellation token (`{ canceled: false }`) to the rAF loop and set `canceled = true` in the effect cleanup alongside `observer.disconnect()`. Both Races and TypeScript reviewers flagged this independently.

2. **Replace `as SectionId` cast with type guard** — `setActive(entry.target.id as SectionId)` is an unsafe assertion. If a section ID is mistyped in the page markup, this silently produces an invalid value. Fix: add a one-line `isSectionId()` type guard derived from the `SECTIONS` const tuple. Zero runtime cost, eliminates the unsafe cast entirely.

3. **Fix CountUpStat SSR hydration: initial state = value, not 0** — `useState(0)` causes server to render `0` while the client immediately starts the count-up. On slow devices this produces a visible `0` flash. Fix: set `useState(value ?? 0)` so SSR renders the real number. Only animate if the element was NOT already visible on mount — check `getBoundingClientRect` in the effect. Skip animation for above-the-fold content on initial page load; only count-up when scrolled into view (e.g., linked from another page where hero is below fold). This prevents meaningless animation on repeat visits.

4. **Video URL sanitization** — `player_videos.url` has no format validation in the database. A `javascript:` or `data:` URL could be stored by a compromised service role key. Fix: validate URL starts with `https://` before rendering as `<a href>`. Currently low risk (write access is service-role-only) but defense-in-depth for when camera sync is built.

5. **Drop `backdrop-blur` on sub-nav — use solid background** — `bg-background/95 backdrop-blur` is not used anywhere else in the codebase. The main Navbar uses `bg-nav-bg` (semi-transparent), but FilterPanel at the same `sticky top-[48px]` position uses solid `bg-surface`. For consistency and mobile performance, use `bg-background` (solid) on the sub-nav.

6. **Use `players.*` translation namespace, not `profile.*`** — All player page translations use the `players.*` namespace. Introducing a separate `profile.*` namespace breaks the established convention. Rename to `players.navOverview`, `players.navStats`, etc. This keeps translations discoverable and grep-friendly.

7. **Memoize `visibleSections` in ProfileSubNav** — The array is re-derived from `hiddenSections` every render. Without memoization, the `useEffect` dependency triggers IntersectionObserver reconnection on every parent re-render. Fix: wrap in `useMemo` keyed on `hiddenSections`.

8. **Verified by Pixellot badge placement** — The plan wraps `section-header` h3 + badge in a flex container, but `section-header` has `border-left: 3px solid` which looks awkward in a flex row. Place the badge on a separate line below the heading, or inline after the h3 text content (inside the h3 element).

9. **Add WCAG 3:1 graphical contrast check to acceptance criteria** — StatBar's `var(--foreground-muted)` fill (`#9A9590` on dark `#1C1A17`) may be hard to distinguish. The bar is a graphical object (WCAG 1.4.11: 3:1 minimum). Add explicit contrast verification step for all three StatBar colors against `bg-surface` in both themes.

10. **Add `priority` to hero Image** — The hero photo is the LCP element. Without `priority`, Next.js lazy-loads it, delaying LCP on the most-visited page. One-line fix (Performance reviewer).

11. **Move `<Link>` outside `<summary>` in match appearances** — A `<Link>` nested inside `<summary>` causes click propagation: clicking the link toggles the `<details>` AND navigates. Fix: move the match link to the expanded content, or add `onClick={e => e.stopPropagation()}` (Architecture + Frontend Design reviewers).

12. **Add `aria-current` to active sub-nav button** — Screen readers cannot distinguish the active section without `aria-current="true"`. Add `aria-current={active === id ? 'true' : undefined}` and `aria-label="Player profile sections"` to the nav element (Frontend Design reviewer).

13. **Responsive stat sizes** — `text-4xl` (36px) for 4 stat numerals at 375px with `gap-x-8` barely fits. Use `text-2xl sm:text-4xl` and `gap-x-4 sm:gap-x-8` to keep mobile hero compact (Frontend Design reviewer).

### Scope Adjustments from Research

| Original Plan Item | Decision | Reason |
|---|---|---|
| `useState(0)` in CountUpStat | **Set initial to `value`** | SSR hydration mismatch; 0 flash on slow devices (Design + Architecture + Races) |
| Count-up fires immediately on load | **Skip if above fold on mount** | Animation is noise when hero is already visible; only animate on scroll-in (Design) |
| `as SectionId` type cast | **Replace with type guard** | Unsafe assertion; 1-line fix eliminates compiler lie (TypeScript) |
| rAF cleanup in CountUpStat | **Add cancellation token** | Leak on unmount during 600ms animation window (Races + TypeScript) |
| `bg-background/95 backdrop-blur` | **Use solid `bg-background`** | Not used elsewhere; FilterPanel uses solid bg; saves GPU compositing (Patterns + Performance) |
| `profile.*` translation namespace | **Use `players.nav*` instead** | Matches existing `players.*` convention; grep-friendly (Patterns) |
| `<a href={v.url}>` for videos | **Add `https://` prefix check** | Defense-in-depth against stored URL injection (Security) |
| `visibleSections` in SubNav | **Wrap in `useMemo`** | Prevents observer reconnection on every parent re-render (Races) |
| Badge beside section-header | **Place below heading** | `section-header` has border-left; flex row breaks visual rhythm (Patterns) |
| Hero Image no `priority` | **Add `priority` prop** | LCP element should not be lazy-loaded (Performance) |
| `<Link>` inside `<summary>` | **Move to expanded content** | Click propagation toggles details AND navigates (Architecture + Design) |
| `text-4xl gap-x-8` stats on mobile | **`text-2xl sm:text-4xl gap-x-4 sm:gap-x-8`** | 375px barely fits 4 stats; wraps awkwardly (Design) |
| No `aria-current` on sub-nav | **Add `aria-current="true"` on active** | Screen readers need active section indication (Design) |

---

## Overview

Redesign the player profile page — the platform's flagship page — from a functional data-dump layout into a progressively layered scouting experience. Implement hero with oversized count-up stats ("the bold move"), sticky sub-nav with scroll spy, theme-aware color-coded stat bars, horizontal scrollable season cards, expandable match appearances, vertical career timeline, video section with empty state, and updated loading skeleton. This is Session 6 of 10 — the largest single-page transformation in the redesign.

**Branch:** Continue on `redesign/light-navy`

**Prerequisite:** Sessions 1-5 complete (A3 palette, ThemeProvider, navbar, landing page, player browse, AI search restyle).

## Problem Statement / Motivation

The player profile is where scouts make decisions. Currently it has five issues:

1. **Hero is generic** — Photo (224px) + name + meta grid in a padded card. No visual emphasis on key scouting numbers. The "At a Glance" section (goals/assists/MP/pass%) is buried below the fold as separate cards with `text-3xl` (30px) — not prominent enough for the flagship page.

2. **No navigation** — The page is a long scroll with no way to jump between sections. On a 4,000px profile (skills + 3 seasons + 8 matches + career history), scouts have to scroll and hunt. Professional platforms (Wyscout, TransferMarkt) always have section navigation.

3. **StatBar uses hardcoded hex colors** — `#10b981` (emerald-500), `#f59e0b` (amber-500), `#ef4444` (red-500) in `StatBar.tsx`. These don't respond to theme changes and clash with the A3 palette. The spec requires "green above avg, gold avg, muted below."

4. **Season stats are a flat table** — No visual progression between seasons. Tables are functional but dense and don't match the "data as design" principle.

5. **No video section** — The `player_videos` table exists in the database (id, player_id, match_id, title, url, video_type, duration_seconds) but has zero rendering. The spec calls for video embeds as a key section.

## Proposed Solution

### Component Changes

| Component | Change | Scope |
|---|---|---|
| `src/app/(platform)/players/[slug]/page.tsx` | Major — hero restructure (photo bleeds to edge, stat numerals integrated), section IDs for scroll spy, video query, season cards, match list with `<details>`, career timeline, video section | ~250 lines changed |
| `src/components/player/StatBar.tsx` | Minor — replace 3 hardcoded hex colors with CSS custom property equivalents | ~6 lines |
| `src/components/player/PlayerProfileClient.tsx` | Minor — unchanged structure, verify A3 token usage | Audit only |
| `src/components/player/RadarChart.tsx` | None — already uses `var(--primary)` and `var(--border)` tokens | No changes |
| `src/app/(platform)/players/[slug]/loading.tsx` | Moderate — update skeleton to reflect new hero layout + sub-nav | ~40 lines |
| `src/lib/translations/players.ts` | Minor — add ~15 new keys for sub-nav, video section, verified badge | ~30 lines (15 en + 15 ka) |

### New Files

| File | Purpose | Lines |
|---|---|---|
| `src/components/player/CountUpStat.tsx` | Client component — IntersectionObserver count-up animation for hero stats | ~50 |
| `src/components/player/ProfileSubNav.tsx` | Client component — sticky sub-nav with scroll spy | ~60 |

### Files NOT Changed

- `src/components/player/PlayerCard.tsx` — Session 4 (complete)
- `src/components/player/AISearchBar.tsx` — Session 5 (complete)
- `src/components/player/AIFilterTags.tsx` — Session 5 (complete)
- `src/components/player/CompareView.tsx` — Session 7
- `src/components/player/CompareRadarChart.tsx` — Session 7
- `src/components/player/WatchButton.tsx` — already uses A3 tokens
- `src/components/player/DownloadPdfButton.tsx` — already uses A3 tokens
- `src/lib/ai-search/*` — untouched
- `src/app/api/*` — untouched

---

## Technical Approach

### 1. CountUpStat Client Component

**File:** `src/components/player/CountUpStat.tsx` (new)

A small client component that animates a number from 0 to its target value when it enters the viewport. Used 4 times in the hero for the "bold move" stats.

```tsx
'use client'
import { useEffect, useRef, useState, useMemo } from 'react'

interface CountUpStatProps {
  value: number | null
  label: string
  suffix?: string
  accent?: boolean
}

export function CountUpStat({ value, label, suffix = '', accent }: CountUpStatProps) {
  // SSR-safe: initial state matches server render (no 0 flash)
  const [display, setDisplay] = useState(value ?? 0)
  const hasAnimatedRef = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || value == null || hasAnimatedRef.current) return

    // Skip animation if already in viewport on mount (above the fold)
    const rect = ref.current.getBoundingClientRect()
    if (rect.top >= 0 && rect.top < window.innerHeight) {
      hasAnimatedRef.current = true
      setDisplay(value)
      return
    }

    const cancelToken = { canceled: false }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cancelToken.canceled) {
          hasAnimatedRef.current = true
          observer.disconnect()
          const target = value
          const duration = 600 // ms
          const start = performance.now()
          function animate(now: number) {
            if (cancelToken.canceled) return
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setDisplay(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => {
      cancelToken.canceled = true
      observer.disconnect()
    }
  }, [value])

  if (value == null) return null

  return (
    <div ref={ref}>
      <div className={`text-4xl font-bold tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>
        {display}{suffix}
      </div>
      <div className="mt-0.5 text-xs text-foreground-muted">{label}</div>
    </div>
  )
}
```

**Key decisions:**
- `useState(value ?? 0)` — SSR-safe initial state, no hydration mismatch (Architecture + Design reviewers)
- `hasAnimatedRef` (ref, not state) — avoids unnecessary re-render when flag changes (Simplicity reviewer)
- `cancelToken` — stops rAF loop on unmount, prevents leaked frames (Races + TypeScript reviewers)
- `getBoundingClientRect` check on mount — skips animation if hero is already in viewport (above the fold on direct page load). Only animates when scrolled into view (e.g., linked from search results where hero is below fold). Prevents meaningless motion on repeat visits (Design reviewer)
- `tabular-nums` prevents layout shift during animation (numbers keep consistent width)
- `ease-out cubic` — fast start, gentle land, feels physical
- 600ms duration — long enough to notice, short enough not to annoy
- Returns `null` when value is null (no stats = no element)

### 2. ProfileSubNav Client Component

**File:** `src/components/player/ProfileSubNav.tsx` (new)

Sticky navigation bar that sits below the 48px main navbar. Uses IntersectionObserver to highlight the current section as the user scrolls.

```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { useLang } from '@/hooks/useLang'

const SECTIONS = ['overview', 'stats', 'matches', 'history', 'videos'] as const
type SectionId = (typeof SECTIONS)[number]

function isSectionId(value: string): value is SectionId {
  return (SECTIONS as readonly string[]).includes(value)
}

interface ProfileSubNavProps {
  /** Hide sections that have no content (e.g., no videos, no match history) */
  hiddenSections?: SectionId[]
}

export function ProfileSubNav({ hiddenSections = [] }: ProfileSubNavProps) {
  const { t } = useLang()
  const [active, setActive] = useState<SectionId>('overview')

  // Memoize to prevent IntersectionObserver reconnection on every parent re-render
  const visibleSections = useMemo(
    () => SECTIONS.filter(id => !hiddenSections.includes(id)),
    [hiddenSections]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Type guard instead of unsafe `as SectionId` cast
          if (entry.isIntersecting && isSectionId(entry.target.id)) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-97px 0px -60% 0px' }
      // -97px = navbar(48) + subnav(~49) = offset from top
      // -60% = fires when section enters top 40% of viewport
    )

    visibleSections.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [visibleSections])

  function handleClick(id: SectionId) {
    const el = document.getElementById(id)
    if (!el) return
    const offset = 48 + 49 // navbar + subnav
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const labels: Record<SectionId, string> = {
    overview: t('players.navOverview'),
    stats: t('players.navStats'),
    matches: t('players.navMatches'),
    history: t('players.navHistory'),
    videos: t('players.navVideos'),
  }

  return (
    <nav className="sticky top-[48px] z-30 -mx-4 border-b border-border bg-background px-4">
      <div className="flex gap-6 overflow-x-auto">
        {visibleSections.map(id => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`shrink-0 py-3 text-sm font-medium border-b-2 transition-colors ${
              active === id
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {labels[id]}
          </button>
        ))}
      </div>
    </nav>
  )
}
```

**Key decisions:**
- `isSectionId()` type guard — eliminates unsafe `as SectionId` cast, derived from `SECTIONS` source of truth (TypeScript reviewer)
- `useMemo` on `visibleSections` — prevents IntersectionObserver reconnection on every parent re-render (Races reviewer)
- `bg-background` (solid) — not `bg-background/95 backdrop-blur`. FilterPanel at the same `sticky top-[48px]` uses solid bg. Consistency + saves GPU compositing on mobile (Patterns + Performance reviewers)
- `players.nav*` translation keys — matches existing `players.*` namespace convention, not a separate `profile.*` (Patterns reviewer)
- `hiddenSections` prop lets the server component conditionally hide "Videos" when no videos exist, "Matches" when no match stats, etc.
- `-mx-4 px-4` makes the nav bar full-bleed within the `max-w-7xl px-4` container
- `overflow-x-auto` handles mobile where 5 items may overflow
- `rootMargin: '-97px 0px -60% 0px'` — accounts for both navbars stacked, activates section when it enters the top 40% of viewport
- Smooth scroll offset: 48 (navbar) + 49 (subnav) = 97px

### 3. Hero Redesign

**File:** `src/app/(platform)/players/[slug]/page.tsx` (lines 213-458, major restructure)

The hero card is restructured so the photo "bleeds to edge" (fills its container side-to-side with no padding) while the info section retains padding. The "At a Glance" stat cards are replaced by integrated oversized CountUpStat numerals inside the hero.

**Before (current structure):**
```
┌─ .card with padding ───────────────────┐
│  ┌──────┐  Name                        │
│  │Photo │  Position · Club             │
│  │224px │  Scouting report             │
│  │padded│  [Badges]                    │
│  └──────┘  [Actions] [Meta grid]       │
└────────────────────────────────────────┘

[At a Glance: 4 separate stat cards]     ← SEPARATE SECTION
```

**After (new structure):**
```
┌─ overflow-hidden, no card padding on photo ─┐
│ ┌────────┐  Name   [POS] [Featured]         │
│ │ Photo  │  Club · Age                       │
│ │ 240px  │  Scouting report                  │
│ │ bleeds │                                   │
│ │ edge   │  12     8      24     82%         │
│ │        │  Goals  Assists MP     Pass%      │
│ └────────┘  ← count-up animation             │
│                                              │
│  [★ Watch] [✉ Message] [⇄ Compare] [↓ PDF] │
│  [Meta grid: Platform ID, Height, etc.]      │
└──────────────────────────────────────────────┘
```

**Implementation:**

```tsx
{/* Hero — photo bleeds to card edge */}
<div id="overview" className={`mt-4 overflow-hidden rounded-xl border border-border bg-surface ${POSITION_BORDER_CLASSES[player.position as Position] ? 'border-t-4 ' + POSITION_BORDER_CLASSES[player.position as Position] : 'border-t-4 border-t-primary'}`}>
  <div className="flex flex-col md:flex-row">
    {/* Photo — full-bleed within card */}
    <div className="relative h-64 w-full md:h-auto md:w-60 shrink-0 bg-elevated">
      {player.photo_url ? (
        <Image src={player.photo_url} alt={player.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 240px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
      ) : (
        <div className="flex h-full items-center justify-center">
          <PlayerSilhouette size="lg" className="text-foreground-muted/20" />
        </div>
      )}
    </div>

    {/* Info — with padding */}
    <div className="flex-1 p-5 md:p-6">
      <PlayerProfileClient player={...} />

      {/* Badges: Popular + Trending */}
      {/* ... existing badge code ... */}

      {/* THE BOLD MOVE: 4 oversized stats with count-up */}
      {latestSeason && (
        <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
          <CountUpStat value={latestSeason.goals} label={t('compare.goals')} accent />
          <CountUpStat value={latestSeason.assists} label={t('compare.assists')} accent />
          <CountUpStat value={latestSeason.matches_played} label={t('compare.matches')} />
          <CountUpStat value={latestSeason.pass_accuracy} label={t('compare.passPercent')} suffix="%" />
        </div>
      )}

      {/* Free agent notice */}
      {/* ... existing ... */}

      {/* Action buttons */}
      {/* ... existing ... */}

      {/* Meta grid */}
      {/* ... existing ... */}
    </div>
  </div>
</div>
```

**Key changes:**
- Remove wrapping `.card` class (it adds padding and hover effects we don't want on the hero)
- Photo: `md:w-60` (240px) instead of `h-56 w-56` (224px), full-height on desktop via `md:h-auto`
- Photo: `h-64` on mobile (256px tall, full-width)
- No padding on photo container — it bleeds to the card edge
- `overflow-hidden rounded-xl` on outer div clips the photo to the border-radius
- Remove the separate "At a Glance" section — stats are now inside the hero via CountUpStat
- `sizes` prop on Image: `"(max-width: 768px) 100vw, 240px"` — serves appropriate size per breakpoint
- Position-colored top border preserved

### 4. StatBar Theme-Aware Colors

**File:** `src/components/player/StatBar.tsx` (6 lines changed)

Replace hardcoded hex with CSS custom properties. Spec: "green above avg, gold avg, muted below."

**Before:**
```tsx
function getColor(pct: number): string {
  if (pct >= 70) return '#10b981' // emerald-500
  if (pct >= 40) return '#f59e0b' // amber-500
  return '#ef4444' // red-500
}
```

**After:**
```tsx
function getColor(pct: number): string {
  if (pct >= 70) return 'var(--primary)'        // green (above avg)
  if (pct >= 40) return 'var(--pos-gk)'         // gold (average)
  return 'var(--foreground-muted)'               // muted (below avg)
}
```

**Rationale:**
- `var(--primary)` — green in both themes, the "good" signal
- `var(--pos-gk)` — gold/amber, already theme-aware (light: `#B87A08`, dark: `#FBBF24`), the "average" signal
- `var(--foreground-muted)` — muted gray, the "below average" signal (spec says "muted below", not "red/danger" — deliberately less judgmental, more professional)
- All three tokens are defined in `globals.css` with light/dark variants — zero new tokens needed

### 5. Season Stats — Horizontal Scrollable Cards

Replace the flat table (`src/app/(platform)/players/[slug]/page.tsx` lines 583-639) with horizontal scrollable cards showing one season each.

**Before:** An `<table>` with columns Season, MP, G, A, Min, Pass%, Tackles, Int.

**After:**
```tsx
{seasonStats.length > 0 && (
  <div className="mt-6">
    <h3 className="section-header mb-4">{t('players.seasonStats')}</h3>
    <div className="flex gap-4 overflow-x-auto pb-2" role="region" aria-label={t('players.seasonStats')}>
      {[...seasonStats].sort((a, b) => (b.season ?? '').localeCompare(a.season ?? '')).map(s => (
        <div key={s.season} className="min-w-[200px] shrink-0 rounded-xl border border-border bg-surface p-4">
          <div className="text-sm font-semibold text-foreground mb-3">{s.season}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <div className="text-foreground-muted text-xs">{t('stats.mp')}</div>
              <div className="font-semibold text-foreground">{s.matches_played ?? '-'}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs">{t('stats.g')}</div>
              <div className="font-semibold text-primary">{s.goals ?? '-'}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs">{t('stats.a')}</div>
              <div className="font-semibold text-primary">{s.assists ?? '-'}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs">{t('stats.min')}</div>
              <div className="font-semibold text-foreground">{s.minutes_played ?? '-'}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs">{t('stats.passPercent')}</div>
              <div className="font-semibold text-foreground">{s.pass_accuracy ? `${s.pass_accuracy}%` : '-'}</div>
            </div>
            <div>
              <div className="text-foreground-muted text-xs">{t('stats.tackles')}</div>
              <div className="font-semibold text-foreground">{s.tackles ?? '-'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**Key decisions:**
- `min-w-[200px] shrink-0` — each card has a fixed minimum width and doesn't shrink
- `overflow-x-auto pb-2` — horizontal scroll with slight padding for scrollbar
- Newest season first (sorted descending)
- Goals and assists in `text-primary` — the key scouting numbers stand out
- No separate component file — this is a one-time rendering pattern, inline in page.tsx
- Accessible: `role="region"` with `aria-label`

### 6. Match Appearances — Expandable List

Replace the flat table (`src/app/(platform)/players/[slug]/page.tsx` lines 641-735) with a list of expandable rows using HTML `<details>` element.

**Rationale for `<details>` over client-side toggle:**
- Zero JavaScript — works with JS disabled
- Accessible by default (screen readers understand `<details>`)
- Browser handles the toggle animation
- Can be styled with Tailwind `open:` modifier
- No new client component needed

**After:**
```tsx
{matchStats.length > 0 && (
  <div id="matches" className="mt-6">
    <h3 className="section-header mb-4">{t('players.matchHistory')}</h3>
    <div className="space-y-2">
      {matchStats.map((ms, i) => {
        const m = ms.match
        const homeClub = m ? unwrapRelation(m.home_club) : null
        const awayClub = m ? unwrapRelation(m.away_club) : null
        const matchLabel = /* ... existing label logic ... */
        const matchDate = m?.match_date ? format(new Date(m.match_date), 'MMM d, yyyy') : '-'

        return (
          <details key={i} className="group rounded-lg border border-border bg-surface overflow-hidden">
            <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-elevated transition-colors list-none [&::-webkit-details-marker]:hidden">
              {/* Date */}
              <span className="w-24 shrink-0 text-xs text-foreground-muted">{matchDate}</span>
              {/* Opponent */}
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {m?.slug ? <Link href={`/matches/${m.slug}`} className="hover:text-primary">{matchLabel}</Link> : matchLabel}
              </span>
              {/* Event icons */}
              <span className="flex items-center gap-2 text-xs">
                {ms.goals > 0 && <span className="text-primary font-semibold">{ms.goals}G</span>}
                {ms.assists > 0 && <span className="text-primary font-semibold">{ms.assists}A</span>}
              </span>
              {/* Rating */}
              {ms.rating && (
                <span className={`w-8 text-right text-sm font-bold ${Number(ms.rating) >= 7.5 ? 'text-primary' : Number(ms.rating) >= 6 ? 'text-foreground' : 'text-foreground-muted'}`}>
                  {ms.rating}
                </span>
              )}
              {/* Chevron */}
              <svg className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            {/* Expanded stats */}
            <div className="grid grid-cols-2 gap-3 border-t border-border px-4 py-3 text-sm sm:grid-cols-4">
              <div><span className="text-foreground-muted text-xs">{t('stats.min')}</span><div className="font-semibold">{ms.minutes_played ?? '-'}</div></div>
              <div><span className="text-foreground-muted text-xs">{t('stats.passPercent')}</span><div className="font-semibold">{ms.pass_accuracy ? `${ms.pass_accuracy}%` : '-'}</div></div>
              <div><span className="text-foreground-muted text-xs">{t('stats.dist')}</span><div className="font-semibold">{ms.distance_km ? `${ms.distance_km}km` : '-'}</div></div>
              <div><span className="text-foreground-muted text-xs">{t('stats.speed')}</span><div className="font-semibold">{ms.top_speed_kmh ? `${ms.top_speed_kmh}km/h` : '-'}</div></div>
              <div><span className="text-foreground-muted text-xs">{t('stats.shots')}</span><div className="font-semibold">{ms.shots ?? '-'}</div></div>
              <div><span className="text-foreground-muted text-xs">{t('stats.tackles')}</span><div className="font-semibold">{ms.tackles ?? '-'}</div></div>
              <div><span className="text-foreground-muted text-xs">{t('stats.int')}</span><div className="font-semibold">{ms.interceptions ?? '-'}</div></div>
            </div>
          </details>
        )
      })}
    </div>
  </div>
)}
```

**Key decisions:**
- `list-none [&::-webkit-details-marker]:hidden` — removes default disclosure triangle, replaced by custom chevron
- `group-open:rotate-180` — rotates chevron when expanded
- Compact summary: date, opponent (linked), event icons (goals/assists), rating
- Expanded detail: grid of stats (minutes, pass%, distance, speed, shots, tackles, interceptions)
- `sm:grid-cols-4` — 4 columns on tablet+, 2 on mobile
- No JavaScript — server-rendered, accessible, performant

### 7. Career Timeline — Vertical Design

Replace flat card list (`src/app/(platform)/players/[slug]/page.tsx` lines 738-777) with a vertical timeline.

**After:**
```tsx
{clubHistory.length > 0 && (
  <div id="history" className="mt-6">
    <h3 className="section-header mb-4">{t('players.careerHistory')}</h3>
    <div className="relative ml-3 border-l-2 border-primary/30 pl-6 space-y-6">
      {clubHistory.map((entry, i) => {
        const entryClubName = /* ... existing logic ... */
        const isCurrent = !entry.left_at
        return (
          <div key={entry.id} className="relative">
            {/* Timeline dot */}
            <div className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 ${
              isCurrent ? 'bg-primary border-primary' : 'bg-surface border-primary/50'
            }`} />
            {/* Content */}
            <div>
              {entry.club?.slug ? (
                <Link href={`/clubs/${entry.club.slug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                  {entryClubName}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-foreground">{entryClubName}</span>
              )}
              <p className="mt-0.5 text-xs text-foreground-muted">
                {format(new Date(entry.joined_at), 'MMM d, yyyy')} —{' '}
                {entry.left_at ? format(new Date(entry.left_at), 'MMM d, yyyy') : t('players.present')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}
```

**Key decisions:**
- `border-l-2 border-primary/30` — subtle green line
- Timeline dots: filled green for current club, outlined for past clubs
- `-left-[31px]` positions the dot centered on the border line (3px margin-left + 24px padding-left + half of 12px dot = 31px from left edge of content)
- No wrapping card — the timeline section is open (lighter visual weight)
- Sorted newest first (already done in existing code)

### 8. Video Section

**File:** `src/app/(platform)/players/[slug]/page.tsx` (new section, inline)

Add `player_videos` to the main Supabase query and render a video section. Since camera integration is Phase 7 (blocked on Starlive), this section will show an empty state for now but is structurally ready.

**Query addition (add to the player select at ~line 57):**
```
videos:player_videos ( id, title, url, video_type, duration_seconds )
```

**Rendering:**
```tsx
{/* Videos */}
<div id="videos" className="mt-6">
  <h3 className="section-header mb-4">{t('players.videos')}</h3>
  {videos.length > 0 ? (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {videos.filter(v => v.url.startsWith('https://')).map(v => (
        <a
          key={v.id}
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-elevated transition-colors"
        >
          {/* Play icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground truncate">{v.title}</div>
            <div className="text-xs text-foreground-muted">
              {v.video_type && <span className="capitalize">{v.video_type}</span>}
              {v.duration_seconds && <span> · {Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, '0')}</span>}
            </div>
          </div>
          {/* External link icon */}
          <svg className="h-4 w-4 shrink-0 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      ))}
    </div>
  ) : (
    /* Empty state — tasteful, expectation-setting */
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <svg className="h-10 w-10 text-foreground-muted/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
      <p className="text-sm text-foreground-muted">{t('players.noVideos')}</p>
      <p className="mt-1 text-xs text-foreground-faint">{t('players.noVideosHint')}</p>
    </div>
  )}
</div>
```

**Key decisions:**
- Videos render as clickable link cards, NOT embedded players. The actual embed/player integration comes with Phase 7 camera work. For now, URLs open in a new tab.
- **URL sanitization:** `.filter(v => v.url.startsWith('https://'))` — defense-in-depth against stored `javascript:` or `data:` URLs. Currently mitigated by service-role-only writes, but protects against future camera sync bugs (Security reviewer).
- Grid: 1 column mobile, 2 columns on `sm+`
- Video type badge (`highlight`, `full_match`, `goal`, etc.) shown as metadata
- Duration formatted as `mm:ss`
- Empty state: dashed border, camera icon, friendly message — sets expectation without feeling broken
- No separate component file — inline in page.tsx

### 9. "Verified by Pixellot" Badge

Add a small badge below the Stats section heading. This is a trust signal that communicates data source integrity. Place below the `section-header` h3, not beside it — the `section-header` class has `border-left: 3px solid` which looks awkward in a flex row (Patterns reviewer).

```tsx
<h3 className="section-header mb-2">{t('players.skills')}</h3>
<div className="mb-4 ml-3">
  <span className="inline-flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-primary">
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
    {t('players.verifiedByPixellot')}
  </span>
</div>
```

### 10. Section IDs for Scroll Spy

Add `id` attributes to section headings throughout the page:

| Section | ID | Element |
|---|---|---|
| Hero card wrapper | `id="overview"` | Outer `<div>` of hero |
| Skills/Stats area | `id="stats"` | Stats container `<div>` |
| Match appearances | `id="matches"` | Match section `<div>` |
| Career history | `id="history"` | Career section `<div>` |
| Videos | `id="videos"` | Video section `<div>` |

### 11. Translations — New Keys

**English (`en`) — add to `players` namespace:**
```tsx
// Sub-nav labels (players.nav* to match existing namespace convention)
navOverview: 'Overview',
navStats: 'Stats',
navMatches: 'Matches',
navHistory: 'History',
navVideos: 'Videos',
// Video section
videos: 'Videos',
noVideos: 'No video highlights yet',
noVideosHint: 'Video clips will appear here once camera coverage is active.',
verifiedByPixellot: 'Verified by Pixellot',
highlight: 'Highlight',
fullMatch: 'Full Match',
```

**Georgian (`ka`) — add to `players` namespace:**
```tsx
navOverview: 'მიმოხილვა',
navStats: 'სტატისტიკა',
navMatches: 'მატჩები',
navHistory: 'ისტორია',
navVideos: 'ვიდეოები',
videos: 'ვიდეოები',
noVideos: 'ვიდეო ჰაილაითები ჯერ არ არის',
noVideosHint: 'ვიდეო კლიპები აქ გამოჩნდება კამერის ინტეგრაციის შემდეგ.',
verifiedByPixellot: 'Pixellot-ით დადასტურებული',
highlight: 'ჰაილაითი',
fullMatch: 'სრული მატჩი',
```

### 12. Loading Skeleton Update

**File:** `src/app/(platform)/players/[slug]/loading.tsx`

Update to reflect new hero layout (photo-left, stats-right) and sub-nav bar.

```tsx
export default function PlayerProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 rounded bg-elevated" />

      {/* Hero card */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col md:flex-row">
          <div className="h-64 w-full md:h-72 md:w-60 shrink-0 bg-elevated" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-7 w-48 rounded bg-elevated" />
            <div className="h-5 w-32 rounded bg-elevated" />
            <div className="mt-4 flex gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-9 w-12 rounded bg-elevated" />
                  <div className="h-3 w-10 rounded bg-elevated" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-elevated" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-nav bar */}
      <div className="mt-0 -mx-4 px-4 border-b border-border py-3 flex gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-16 rounded bg-elevated" />
        ))}
      </div>

      {/* Stats section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface h-64 p-5" />
        <div className="rounded-xl border border-border bg-surface h-64 p-5 lg:col-span-2" />
      </div>

      {/* Season cards */}
      <div className="mt-6 flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-w-[200px] h-40 shrink-0 rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  )
}
```

---

## Technical Considerations

### Server/Client Boundary

The page remains a server component. Only two small client components are extracted:

| Component | Why Client? |
|---|---|
| `CountUpStat` | IntersectionObserver + requestAnimationFrame for count-up |
| `ProfileSubNav` | IntersectionObserver for scroll spy + onClick smooth scroll |

Everything else (hero layout, stat bars, season cards, match list, career timeline, video section, similar players) stays server-rendered. This minimizes client JS bundle.

### Scroll Spy + Sticky Stacking

Two sticky elements stack: main navbar (48px, `z-50`) and sub-nav (49px, `z-30`).

- Sub-nav: `sticky top-[48px]` positions it directly below the navbar
- rootMargin for IntersectionObserver: `-97px 0px -60% 0px` accounts for both heights
- Smooth scroll offset: `48 + 49 = 97px` to prevent the target section from being hidden behind both bars

### `<details>` Browser Support

HTML `<details>` is supported in all modern browsers (Chrome 12+, Firefox 49+, Safari 6+, Edge 79+). The `[&::-webkit-details-marker]:hidden` pattern removes the default triangle in WebKit/Blink, allowing a custom chevron. No polyfill needed.

### Empty State Strategy

The page conditionally hides sections and sub-nav items when data is missing:

| Condition | Behavior |
|---|---|
| No skills | Skills section hidden, "Stats" removed from sub-nav |
| No season stats | Season cards hidden |
| No match stats | Match section hidden, "Matches" removed from sub-nav |
| No club history | Timeline hidden, "History" removed from sub-nav |
| No videos | Video empty state shown, "Videos" stays visible (sets expectation) |
| No latest season | Hero stat numerals hidden (CountUpStat returns null for null values) |

This uses the `hiddenSections` prop on `ProfileSubNav`.

### Dark Mode

All new elements use CSS custom properties that are already theme-aware:
- `var(--primary)`, `var(--pos-gk)`, `var(--foreground-muted)` in StatBar
- `bg-surface`, `bg-elevated`, `border-border` on all cards and containers
- `text-foreground`, `text-foreground-muted`, `text-primary` for all text

No hardcoded hex values introduced.

### Mobile (375px)

| Section | Mobile Behavior |
|---|---|
| Hero | Photo full-width on top (h-64), info stacks below |
| Sub-nav | Horizontal scroll (overflow-x-auto) for 5 items |
| Stat numerals | `flex-wrap` — wraps to 2 rows if needed |
| Stats grid | Full width, single column |
| Season cards | Horizontal scroll (same as desktop) |
| Match details | `grid-cols-2` (4 on sm+) |
| Career timeline | Full width, no change needed |
| Video cards | Single column |

---

## Scope Boundaries — Session 6 vs Other Sessions

| Feature | Session | Why |
|---|---|---|
| Player profile hero redesign | **6** | This session |
| Sticky sub-nav with scroll spy | **6** | This session |
| StatBar theme-aware colors | **6** | This session |
| Season stat horizontal cards | **6** | This session |
| Expandable match appearances | **6** | This session |
| Career vertical timeline | **6** | This session |
| Video section with empty state | **6** | This session |
| CountUpStat animation component | **6** | This session |
| Comparison page redesign | **7** | Center-growing bars, radar overlay, stat diffs |
| Dashboard + Watchlist | **8** | Activity feed, folders, tags |
| Messages + Admin restyling | **9** | Chat in A3, admin pages |
| Full animation pass | **10** | Stagger animations, parallax, Playwright QA |
| Video player/embed integration | **Phase 7** | Blocked on Starlive camera API |
| Count-up on other pages | **10** | Profile gets it first, extend later if desired |

---

## Execution Order (5 Steps)

### Step 1: Foundation — StatBar + Translations + Section IDs
**Files:** `src/components/player/StatBar.tsx`, `src/lib/translations/players.ts`, `src/app/(platform)/players/[slug]/page.tsx`

1. Fix StatBar: replace 3 hardcoded hex colors with `var(--primary)`, `var(--pos-gk)`, `var(--foreground-muted)`
2. Add new translation keys: `profile.*` namespace (5 sub-nav labels), `players.videos`, `players.noVideos`, `players.noVideosHint`, `players.verifiedByPixellot`
3. Add `id="overview"`, `id="stats"`, `id="matches"`, `id="history"`, `id="videos"` to relevant sections in page.tsx
4. Verify: StatBar colors work in both themes

### Step 2: Hero Redesign + CountUpStat
**Files:** `src/components/player/CountUpStat.tsx` (new), `src/app/(platform)/players/[slug]/page.tsx`

1. Create `CountUpStat.tsx` — IntersectionObserver + requestAnimationFrame + ease-out cubic
2. Restructure hero: remove `.card` wrapper, add `overflow-hidden rounded-xl` outer container, photo `md:w-60` full-bleed, info with padding
3. Replace "At a Glance" separate section with 4 inline CountUpStat instances in hero
4. Add "Verified by Pixellot" badge to stats section heading
5. Verify: count-up fires on page load, photo bleeds correctly, mobile stacks vertically

### Step 3: Sticky Sub-Nav
**Files:** `src/components/player/ProfileSubNav.tsx` (new), `src/app/(platform)/players/[slug]/page.tsx`

1. Create `ProfileSubNav.tsx` — scroll spy + smooth scroll + hiddenSections
2. Add ProfileSubNav between hero and content in page.tsx
3. Compute `hiddenSections` array from data availability (no skills → hide "Stats", etc.)
4. Verify: scroll spy highlights correct section, smooth scroll accounts for both navbar + subnav offset, mobile horizontal scroll works

### Step 4: Content Sections Redesign
**Files:** `src/app/(platform)/players/[slug]/page.tsx`

1. Season stats: replace `<table>` with horizontal scrollable cards
2. Match appearances: replace `<table>` with `<details>` expandable list
3. Career history: replace flat bordered cards with vertical timeline
4. Video section: add `player_videos` to Supabase query, render video cards or empty state
5. Verify: all sections render correctly with existing seed data, empty states work for missing data

### Step 5: Loading Skeleton + Build + Visual Verification
**Files:** `src/app/(platform)/players/[slug]/loading.tsx`

1. Update loading skeleton to match new layout (hero with photo-left, sub-nav bar, season cards)
2. `npm run build` — catch TypeScript errors
3. Visual verification:
   - Both light and dark mode
   - Mobile at 375px
   - Both en and ka
   - Navigate to player profile → count-up fires → scroll sections → sub-nav highlights
   - Expand/collapse match appearances
   - StatBar colors: green (≥70), gold (40-69), muted (<40) in both themes
   - Season cards horizontal scroll
   - Career timeline visual
   - Video section empty state
   - Similar players section unchanged
   - Sub-nav hides items for missing sections

---

## Acceptance Criteria

- [x] Hero Image has `priority` prop (LCP element)
- [x] Hero stat numerals use responsive sizing (`text-2xl sm:text-4xl`, `gap-x-4 sm:gap-x-8`)
- [x] Hero photo bleeds to card edge (no padding on photo side)
- [x] Hero stat numerals display at 36px (`text-4xl`) with count-up animation
- [x] Count-up skips animation if hero is already in viewport on mount (shows final value directly)
- [x] Count-up rAF loop is cancelled on unmount (cancelToken pattern)
- [x] CountUpStat SSR hydration: initial state = value, no 0 flash
- [x] CountUpStat returns null for null values (no empty slots)
- [x] "At a Glance" separate section removed — stats integrated into hero
- [x] Sticky sub-nav positioned at `top-[48px]` below main navbar
- [x] Sub-nav scroll spy correctly highlights current section
- [x] Sub-nav smooth scroll accounts for both navbar + sub-nav offset (97px)
- [x] Sub-nav hides items for sections with no data
- [x] Sub-nav horizontal scrolls on mobile (375px)
- [x] StatBar uses `var(--primary)` (green, ≥70), `var(--pos-gk)` (gold, 40-69), `var(--foreground-muted)` (muted, <40)
- [x] StatBar colors are theme-aware (both light and dark)
- [x] StatBar WCAG 3:1 graphical contrast verified: all 3 bar colors visible against `bg-surface` in both themes
- [x] Season stats render as horizontal scrollable cards (not a table)
- [x] Match appearances use `<details>` expandable rows with custom chevron
- [x] Match link is NOT inside `<summary>` (moved to expanded content to prevent click propagation)
- [x] Career history displays as vertical timeline with dots
- [x] Current club has filled green dot, past clubs have outlined dots
- [x] Video section queries `player_videos` table
- [x] Video URLs filtered to `https://` only (no `javascript:` or `data:` URLs rendered)
- [x] Video empty state shows camera icon + friendly message
- [x] "Verified by Pixellot" badge displayed on stats section
- [x] Section IDs (`overview`, `stats`, `matches`, `history`, `videos`) present
- [x] Loading skeleton reflects new hero + sub-nav layout
- [x] Both light and dark mode correct
- [x] Mobile responsive at 375px+
- [x] Both en/ka translations verified
- [x] `npm run build` passes
- [x] No new hardcoded hex values introduced
- [x] ProfileSubNav uses `isSectionId()` type guard (no unsafe `as` cast)
- [x] ProfileSubNav `visibleSections` memoized with `useMemo`
- [x] ProfileSubNav uses solid `bg-background` (not `backdrop-blur`)
- [x] ProfileSubNav has `aria-current="true"` on active button and `aria-label` on nav element
- [x] Translation keys use `players.nav*` namespace (not `profile.*`)
- [x] Similar players section unchanged (verify A3 compatibility)

## Dependencies & Risks

**Dependencies:**
- Sessions 1-5 must be complete (A3 palette, ThemeProvider, browse layout, AI search restyle)
- Seed data must include players with skills, season stats, match stats, and club history for testing

**Risks:**
- **Hero layout complexity** — The photo-bleeds-to-edge pattern with `overflow-hidden` and `md:flex-row` is the trickiest CSS change. Verify at multiple breakpoints (375px, 768px, 1024px, 1280px).
- **IntersectionObserver rootMargin tuning** — The scroll spy's `-97px` rootMargin depends on exact navbar + subnav pixel heights. If either changes, the offset needs updating. Use `var(--navbar-height)` if possible, but IntersectionObserver options don't accept CSS vars (they need numeric pixels).
- **Count-up on SSR** — Mitigated by Enhancement Summary item #3: initial state is now `useState(value ?? 0)` so SSR and client match. No hydration mismatch. The `getBoundingClientRect` check on mount skips animation for above-the-fold content, showing the final value directly.
- **`<details>` styling limitations** — Browser default animations on `<details>` open/close vary. Chrome has no animation, Firefox has minimal transition. The chevron rotation provides visual feedback. If a smoother animation is desired later, swap to a client component with `max-height` transition.
- **Two sticky elements stacking** — On very short viewports (< 400px height), navbar (48px) + subnav (49px) = 97px of sticky content, leaving only ~303px of scrollable area. This is tight but acceptable for mobile — the sub-nav scrolls away once you start scrolling past its attached content. Sub-nav uses solid `bg-background` (not `backdrop-blur`) to avoid GPU compositing cost on low-end mobile devices.

## Future Work (Out of Scope for Session 6)

Issues discovered by review agents that are **out of scope** for this session but worth tracking:

- **Video player integration** — Phase 7 camera work. Currently videos link to external URLs.
- **Player comparison from profile** — The "Compare" button links to `/players/compare?p1=slug`. Session 7 redesigns the comparison page itself.
- **Full animation pass** — Session 10 adds staggered fade-in on section entry, parallax on hero photo. Session 6 only does the count-up (the spec's "bold move" for this page).
- **Scouting report expandable** — Currently shown as plain text. Could be a collapsible section with Markdown rendering. Future enhancement.
- **Admin edit button** — Academy admin viewing their own player should see an "Edit" button. Not part of redesign scope.

### Deferred from Research

**Page length concern (Architecture reviewer):** After Session 6, `page.tsx` grows to ~1000+ lines. Consider extracting season cards, match list, timeline, and video section into co-located server components in a future cleanup pass. Currently acceptable — all sections are one-time-use and share the same data props. Extraction would add import/interface overhead without reuse benefit.

**Shared IntersectionObserver (Performance):** 4 `CountUpStat` instances create 4 separate observers. At scale (many stat cards) this could be consolidated into a single shared observer. At 4 instances, overhead is ~0.1ms total — not worth the abstraction.

**Smooth scroll vs observer conflict (Races reviewer):** When the user clicks a sub-nav item, smooth scroll fires and the IntersectionObserver may rapidly update `active` as sections scroll past. This produces visual flicker on the nav items during the scroll. Potential fix: disable observer temporarily during programmatic scroll (set a `isScrolling` ref, clear after `scrollend` event). Low severity — the flicker lasts <500ms and is cosmetic only. Can address in Session 10 animation polish.

**`<details>` open/close animation (Simplicity reviewer):** Chrome has no native animation for `<details>`. If smoother transitions are desired, swap to a client component with `max-height` CSS transition. Current approach is simpler and accessible — defer animation enhancement to Session 10.

**Video URL format validation at DB level (Security reviewer):** Add a `CHECK (url ~ '^https://')` constraint to `player_videos` table when building the camera sync module (Phase 7). The client-side filter in Session 6 is defense-in-depth but the primary defense should be at the database layer.

## Sources & References

- **Design spec:** `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` — Moment 3 (lines 342-355), Component Patterns (lines 127-205), Animation Language (lines 449-460)
- **Session 4 plan:** `docs/plans/2026-03-16-refactor-frontend-redesign-session-4-player-browse-plan.md` — format reference, scope decisions
- **Session 5 plan:** `docs/plans/2026-03-16-refactor-frontend-redesign-session-5-ai-search-restyle-plan.md` — format reference, adjacent session
- **Current profile page:** `src/app/(platform)/players/[slug]/page.tsx` — 792 lines, server component
- **Current client wrapper:** `src/components/player/PlayerProfileClient.tsx` — 66 lines, renders name/position/badges
- **Current RadarChart:** `src/components/player/RadarChart.tsx` — 132 lines, SVG-based, already uses `var(--primary)`
- **Current StatBar:** `src/components/player/StatBar.tsx` — 32 lines, hardcoded hex colors (the main issue)
- **Database types:** `src/lib/database.types.ts` — `player_videos` table (line 735): id, player_id, match_id, title, url, video_type, duration_seconds
- **globals.css:** `src/app/globals.css` — A3 tokens, `--pos-gk` for gold color
- **Translations:** `src/lib/translations/players.ts` — existing keys (398 lines), needs ~15 new keys
- **Sticky patterns:** `src/components/layout/Navbar.tsx:93` (`sticky top-0`), `src/components/forms/FilterPanel.tsx:220` (`sticky top-[48px]`)
- **Constants:** `src/lib/constants.ts` — `POSITION_BORDER_CLASSES`, `BLUR_DATA_URL`
