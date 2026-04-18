# LeagueShowcase Header — Design Spec

**Date:** 2026-04-15
**Status:** Approved, ready for implementation plan
**Surface:** `/leagues` public page, `LeagueShowcase` section

## Problem

The `LeagueShowcase` section on `/leagues` renders the three Golden League cards (U15, U17, U19) with no section header. Every other section on the page (`HowItWorks`, `SeasonCalendar`, `LeagueCTA`) opens with a titled header. The showcase drops straight into cards, breaking the page's visual rhythm and giving visitors no framing for what they're about to see.

## Goal

Add a header to `LeagueShowcase` that names the Golden Leagues brand, states the scope (three age groups), and acts as a section transition from the hero above.

## Non-goals

- Rewriting the cards themselves.
- Changing other section headers on the page.
- Adding any new data to the database — all content comes from existing columns + new translation keys.

## Design

### Layout — editorial split

```
┌─────────────────────────────────────────────────────────────────┐
│  GEORGIA'S OFFICIAL YOUTH COMPETITIONS            3 LEAGUES     │
│  Georgia's Golden Leagues                         2025–26 Season│
│  Three age groups. Every match captured.                        │
│  One source of verified player data.                            │
│  ─────────────────────────────────────────────────────────────  │  ← border rule
│                                                                 │
│  [ Golden League U15 — hero card (full width) ]                 │
│  [ U17 (5/12) ] [ U19 (7/12) ]                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Left block (title stack):**
- Eyebrow: uppercase micro label in primary green.
- Title: serif (Noto Serif), extrabold, two-part — `"Georgia's "` then italic green accent `"Golden Leagues"`.
- Description: secondary-foreground body copy, capped ~540px.

**Right block (meta stack), bottom-aligned with left block:**
- Count line: `{leagues.length} LEAGUES` — bold uppercase primary green, wide letter-spacing.
- Season line: `{leagues[0].season} Season` — faint foreground, smaller, below the count.

A `border-b border-white/[0.06]` rule sits below both blocks, separating the header from the card grid.

### Responsive behavior

- **`sm` and up (≥ 640px):** flex row, `justify-between`, `items-end`. Border rule spans full width below both blocks.
- **Below `sm`:** stacks vertically — title block on top, meta block below it right-aligned (so the count/season still reads as metadata, not as a heading). Border rule still present, spans full width.

Rationale: pinning meta right-aligned on mobile (rather than left-aligned or centered) keeps the visual role clear — it's supplementary data, not a second headline.

### Empty state

If `leagues.length === 0`, the entire `LeagueShowcase` already returns the existing empty-state markup. The header is **not** rendered in that case — no header, no cards, just the existing `emptyState` translation.

### Typography tokens (from existing system)

| Element | Classes |
| --- | --- |
| Eyebrow | `text-xs font-bold uppercase tracking-widest text-primary` |
| Title | `text-[26px] sm:text-3xl font-extrabold tracking-tight leading-[1.1]` + `font-noto-serif` (en) or `font-sans` (ka) |
| Title accent | `text-primary italic` |
| Description | `text-sm sm:text-base leading-relaxed text-foreground-secondary max-w-[540px]` |
| Count | `text-xs font-bold uppercase tracking-wider text-primary` |
| Season | `text-xs text-foreground-faint` |
| Rule | `border-b border-white/[0.06] pb-5` |

Font-family branching mirrors the existing pattern in `LeagueHero.tsx` and `HowItWorks.tsx` — when `lang === 'ka'`, fall back to `font-sans` because Noto Serif has no Georgian cut.

## Data

All values come from data the component already has in props (`leagues: League[]`):

| Display | Source |
| --- | --- |
| Count number | `leagues.length` |
| Season string | `leagues[0]?.season` — guaranteed present when `leagues.length > 0` |

No new Supabase columns, no new queries.

## i18n

Add a new `header` namespace under `leagues.showcase` in `src/lib/translations/core.ts` — both English and Georgian. All user-facing copy uses these keys, no hardcoded strings.

```ts
// English (core.ts)
leagues: {
  showcase: {
    pixellotTracked: '...',       // existing
    clubsCount: 'clubs',          // existing
    matchesCount: 'matches',      // existing
    header: {
      eyebrow: "Georgia's Official Youth Competitions",
      title: "Georgia's ",
      titleAccent: 'Golden Leagues',
      description: 'Three age groups. Every match captured. One source of verified player data.',
      leaguesLabel: 'Leagues',
      seasonSuffix: 'Season',
    },
  },
},
```

```ts
// Georgian (core.ts, ka block)
leagues: {
  showcase: {
    header: {
      eyebrow: 'საქართველოს ოფიციალური ახალგაზრდული ჩემპიონატები',
      title: 'საქართველოს ',
      titleAccent: 'ოქროს ლიგები',
      description: 'სამი ასაკობრივი ჯგუფი. ყოველი მატჩი ჩაწერილი. ერთი წყარო გადამოწმებული სტატისტიკისთვის.',
      leaguesLabel: 'ლიგა',
      seasonSuffix: 'სეზონი',
    },
  },
},
```

Rendering: `{leagues.length} {t('leagues.showcase.header.leaguesLabel')}` and `{season} {t('leagues.showcase.header.seasonSuffix')}`.

## Component change (single file)

`src/components/league/LeagueShowcase.tsx`:

1. Keep `computeLeagueLayout` unchanged.
2. Keep the early-return empty state unchanged.
3. Inside the main return, **before** the hero card, render a header block using the tokens above. The block lives inside the existing `<section className="py-10 sm:py-14">` container, inside the same `max-w-7xl` wrapper, above the `space-y-6` card stack.
4. Read `lang` from `getServerT()` (already destructured) to switch font-family on the title, matching the pattern in `LeagueHero.tsx:77`.

No new files. No changes to `page.tsx`, `LeagueHero.tsx`, or other siblings.

## Accessibility

- Title uses `<h2>` (the page's `<h1>` lives in `LeagueHero`).
- Count/season are rendered as plain `<div>` text — they're decorative metadata, not a heading.
- Color contrast: primary green on warm near-black background passes WCAG AA at these sizes (verified elsewhere in the design system).

## Testing

- Visual verification in browser at `/leagues` on desktop (≥ 1024px), tablet (~768px), and mobile (375px).
- Language toggle: English renders with Noto Serif title; Georgian renders with sans fallback; both sides render the Georgian copy correctly.
- Empty state: with `is_active = false` on all leagues, the existing empty state still renders with no header.
- `npm run build` clean (no TS errors, no unused imports).

## Out of scope

- Animating the count/season (could be a future polish).
- Pulling season from a derived max across leagues (currently all three share one season value by design).
- A "View all leagues" link on the header (there is no archive view).
