---
title: About Page Redesign — Editorial Showcase
type: feat
status: active
date: 2026-04-02
origin: docs/superpowers/specs/2026-04-02-about-page-redesign-design.md
---

# About Page Redesign — Editorial Showcase

## Overview

Complete redesign of `/about` from a minimal 62-line component (title + two cards) into a 7-section editorial page: Hero, Stats Strip, Problem/Solution Bento, Platform Features, Principles + Quote, and CTA Banner. Server component, no new API routes, no DB queries — only an auth check for the CTA.

**Design spec:** `docs/superpowers/specs/2026-04-02-about-page-redesign-design.md`
**Visual mockup:** `.superpowers/brainstorm/20333-1775123903/content/about-polished-v4.html`

## Problem Statement / Motivation

The current About page is a bare-minimum placeholder (title, two paragraphs, two CTA cards). As a public marketing page in the `(shared)/` route group, it needs to match the editorial quality of the redesigned landing page and leagues page — building trust and converting scouts.

## Proposed Solution

7-section editorial page, all server components, following established patterns from the leagues page redesign:

1. **Hero** — Two-column: editorial text left (headline + description), portrait image right
2. **Stats Strip** — 4 stats in horizontal grid with vertical dividers (37,600+ / €100M+ / 200+ / 0)
3. **Problem/Solution Bento** — 3 asymmetric cards: Problem (dark), Image (photo + overlay), Solution (green gradient)
4. **Platform Features** — 4 feature cards in asymmetric bento (Search, Trending, Chat, Comparison)
5. **Principles + Quote** — Two-column: 3 numbered principles left, editorial quote card right
6. **CTA Banner** — Dark banner with auth-aware buttons

## Implementation Phases

### Phase 1: Images & Assets

**Create directory and source images:**
- `public/images/about/hero.jpg` — Stadium from the stands, 3:4 portrait crop
- `public/images/about/bento-camera.jpg` — Data screens / analytics (from spec)

Images sourced by Andria. Until provided, use `bg-elevated` placeholder with aspect-ratio containers.

**Hero image:** `next/image` with `priority`, `sizes="(max-width: 768px) 100vw, 380px"`, `fill` + `object-cover`
**Bento image:** `next/image` with `fill` + `object-cover`, `sizes="(max-width: 768px) 100vw, 33vw"`

**Files:**
- `public/images/about/hero.jpg` (new — provided by Andria)
- `public/images/about/bento-camera.jpg` (new — provided by Andria)

### Phase 2: Translations

Expand the `about.*` namespace in `src/lib/translations/landing.ts` with ~50 new keys (both EN and KA). All editorial copy is specified in the design spec.

**Key groups:**
```
about.label, about.hero.title, about.hero.titleAccent, about.hero.description
about.stats.players/transfers/academies/platforms (number + label)
about.bento.label, about.bento.heading, about.bento.pullQuote
about.problem.label/title/subtitle, about.problem.items[0-3].title/desc
about.solution.label/title/subtitle, about.solution.items[0-3].title/desc
about.bento.imageTag, about.bento.imageDesc
about.features.label/heading/subtitle
about.features.items[0-3].title/desc/badge
about.principles[0-2].title/desc
about.quote.text/source/sourceDesc
about.cta.heading/subtitle/primary/secondary
```

> Translation pattern: each server component calls `getServerT()` independently — never pass `t` as prop across file boundaries.

**Files:**
- `src/lib/translations/landing.ts` (add ~50 keys in both en and ka objects)

### Phase 3: CSS & Styling

Add new CSS classes to `globals.css` in `@layer components` (per leagues redesign pattern — allows Tailwind overrides):

```css
@layer components {
  /* Dark content card (Problem card, CTA banner) */
  .card-dark {
    background-color: var(--foreground);
    color: #EEECE8;
    border-radius: 1rem;
    border: 1px solid rgba(255,255,255,0.06);
  }

  /* Green gradient card (Solution card) */
  .card-solution {
    background: linear-gradient(135deg, #1B8A4A 0%, #0F6B35 40%, #0A4F28 100%);
    color: white;
    border-radius: 1rem;
  }

  /* Stats strip with vertical dividers */
  .stats-strip {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  /* Feature card hover */
  .feature-card {
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  @media (hover: hover) {
    .feature-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .feature-card { transition: none !important; }
  }
}
```

> **Dark card in dark mode:** The Problem card uses `var(--foreground)` (#1A1917) as bg. In dark mode, `--foreground` is #EEECE8 (light!) — so the card needs explicit hardcoded dark bg, NOT `var(--foreground)`. Use `#1A1917` directly with `border: 1px solid rgba(255,255,255,0.06)` for separation in both themes.

> **Solution card:** Green gradient uses hardcoded greens (#1B8A4A → #0A4F28) — works in both themes since it's always green regardless of mode.

**Files:**
- `src/app/globals.css` (add ~30 lines in `@layer components`)

### Phase 4: Section Components

Split into 6 sub-components in `src/components/about/`, following the landing page pattern (`LandingHero.tsx`, `SuccessStories.tsx`, etc.):

**`src/components/about/AboutHero.tsx`** (server component):
- Two-column grid: `1fr 380px`, gap `3rem`
- Left: green label "ABOUT BINOCLY", headline (3.5rem, weight 900, "Georgian football" in green italic), description paragraph
- Right: portrait image, 3:4 aspect, rounded-2xl, subtle shadow, grayscale(15%) contrast(108%)
- Mobile (<768px): single column, image hidden or reduced height above text
- All text via `t()`

**`src/components/about/AboutStats.tsx`** (server component):
- 4 stats in `grid-cols-4` with vertical `::after` dividers
- Numbers: 2.5rem, weight 900; Labels: 0.65rem, uppercase, tracking-widest
- Green `+` accent on first 3, red number on "0" (danger color)
- Mobile: 2x2 grid, dividers adapted

**`src/components/about/AboutBento.tsx`** (server component):
- Header: label + heading (left) + pull quote with green left border (right)
- 3-column grid:
  - **Card A (Problem):** spans 2 cols, row 1 — dark bg (#1A1917 hardcoded), red glow orb, 4 pain points in 2x2 grid with red X icons
  - **Card B (Image):** spans 1 col, spans 2 rows — full-bleed photo with gradient overlay, green "VERIFIED BY STARLIVE" badge, scan line effect
  - **Card C (Solution):** spans 2 cols, row 2 — green gradient, decorative glow orbs, 4 solutions in 2x2 grid with mint checkmark icons
- Mobile: all cards stack single column, full width
- Mint accent color: `#A7F3D0` for solution card labels, dots, check icons, highlights

**`src/components/about/AboutFeatures.tsx`** (server component):
- Header: label + heading + subtitle
- 3-column grid, 2 rows:
  - Row 1: Advanced Search (span 2, with filter mockup visual) + Trending Players (span 1)
  - Row 2: Scout-Academy Chat (span 1) + Player Comparison (span 2, dark variant with radar SVG)
- Each card: `bg-surface`, rounded-2xl, hover translateY(-3px)
- SVG line icons (stroke, no fill, no emojis)
- Badges: "FOR SCOUTS", "BOTH"
- Mobile: single column, large cards lose visual mockup column

**`src/components/about/AboutPrinciples.tsx`** (server component):
- Two-column grid with border-top
- Left: 3 numbered principles — big faded green number + title + description
- Right: quote card — large faded quote mark, bold quote text with green emphasized words, divider bar, source attribution
- Mobile: single column, quote below principles

**`src/components/about/AboutCTA.tsx`** (server component):
- Dark banner (`#1A1917` hardcoded), rounded-2xl, decorative green circle top-right
- Flex row: heading + subtitle (left), buttons (right)
- **Auth-aware:** Accept `isLoggedIn` prop
  - Anonymous: "Create Account" → `/register`, "Contact Us" → `/contact`
  - Authenticated: "Explore Leagues" → `/leagues`, "Contact Us" → `/contact`
- Mobile: stack vertically, buttons full width

**Files:**
- `src/components/about/AboutHero.tsx` (new)
- `src/components/about/AboutStats.tsx` (new)
- `src/components/about/AboutBento.tsx` (new)
- `src/components/about/AboutFeatures.tsx` (new)
- `src/components/about/AboutPrinciples.tsx` (new)
- `src/components/about/AboutCTA.tsx` (new)

### Phase 5: Page Assembly & Polish

**Rewrite `src/app/(shared)/about/page.tsx`:**
- Keep existing auth check pattern (createClient → getUser → isLoggedIn)
- Compose sections wrapped in `FadeInOnScroll` with staggered delays (0, 50, 100, 150, 200, 250)
- Consistent section spacing: `py-16 sm:py-24` (matching leagues page)
- Alternating backgrounds for visual rhythm
- ISR caching: `export const revalidate = 300` (static content, infrequent changes)

**Update metadata:**
```tsx
export const metadata: Metadata = {
  title: 'About',
  description: 'Binocly is the scouting platform Georgian football has been missing. Verified camera stats, direct messaging, and a centralized player directory.',
  openGraph: {
    title: 'About Binocly',
    description: 'The scouting platform Georgian football has been missing.',
    images: [{ url: '/images/about/hero.jpg', width: 570, height: 760 }],
  },
}
```

**Rewrite `src/components/about/AboutContent.tsx`:**
- Replace the entire 62-line component with composition of the 6 new sub-components
- Or: remove it entirely and compose directly in `page.tsx` (simpler, matches landing page pattern)

**Add `error.tsx`** (must be `'use client'`):
- Graceful error boundary with retry

**Files:**
- `src/app/(shared)/about/page.tsx` (rewrite)
- `src/components/about/AboutContent.tsx` (remove or rewrite as composition)
- `src/app/(shared)/about/error.tsx` (new)

## Technical Considerations

### Architecture
- All 6 new components are **server components** — no `'use client'`
- Each calls `getServerT()` independently
- Page does auth check, passes `isLoggedIn` to CTA only (existing pattern from current `page.tsx`)
- No new DB queries, no new API routes
- `FadeInOnScroll` wraps each section at page level (client component wrapper, established pattern)

### Dark Mode
- Problem card + CTA: use **hardcoded** `#1A1917` (not `var(--foreground)` which flips in dark mode!)
- Solution card: hardcoded green gradient (always green in both themes)
- Image card overlay: `rgba(26,25,23,0.9)` → transparent (works in both)
- All other sections use theme-aware CSS custom properties
- Cards with explicit dark bg need `border: 1px solid rgba(255,255,255,0.06)` for dark-mode separation

### Performance
- ISR caching: `revalidate = 300` — static page, rare changes
- Hero image: `priority` for LCP, proper `sizes` prop
- Other images: `loading="lazy"`
- `content-visibility: auto` on below-fold sections (Features, Principles, CTA)
- SVGs inline (radar chart, icons) — no extra network requests
- No new fonts needed (uses existing Inter + Noto Sans Georgian)

### Accessibility
- Single `<h1>` in hero section
- `<h2>` for each section title
- `<h3>` for sub-items within sections
- Decorative SVGs: `aria-hidden="true"`, empty `alt=""`
- Hero image: descriptive `alt` text via `t()`
- Stats: `aria-label` on number elements for screen reader clarity
- Touch targets: min 44x44px on all interactive elements

### Image Fallback
- If images not yet provided: `bg-elevated` placeholder div with matching aspect-ratio
- `BLUR_DATA_URL` from constants for blur placeholder on `next/image`
- Hero image hidden on mobile (<768px) or shown at reduced height

## Acceptance Criteria

### Functional
- [x] Hero section renders with headline, description, and portrait image
- [x] Stats strip shows 4 stats with vertical dividers; "0" in red
- [x] Problem card: dark background, 4 pain points with red X icons
- [x] Solution card: green gradient, 4 solutions with mint check icons
- [x] Image card: full-bleed photo with gradient overlay and "VERIFIED BY STARLIVE" badge
- [x] Features section: 4 cards in asymmetric grid with SVG icons
- [x] Comparison card: dark variant with inline radar chart SVG
- [x] Principles: 3 numbered items with faded green numbers
- [x] Quote card: large quote marks, green-highlighted words, attribution
- [x] CTA: "Create Account" for anonymous, role-appropriate for authenticated
- [x] All text bilingual (EN/KA) via `t()` — ~50+ keys in both languages
- [ ] All 7 sections render correctly in dark mode

### Non-Functional
- [x] All colors use CSS custom properties or intentionally hardcoded (dark cards documented)
- [x] Responsive: 375px (mobile), 768px (tablet), 1024px+ (desktop)
- [x] `next/image` with proper `sizes`, `priority` on hero
- [x] `content-visibility: auto` on below-fold sections
- [x] `prefers-reduced-motion: reduce` respected
- [x] Error boundary (`error.tsx`)
- [x] OG metadata (title, description, image)
- [x] ISR caching (`revalidate = 300`)
- [x] `npm run build` passes clean
- [x] Semantic heading hierarchy (h1 → h2 → h3)

## Component Architecture

```
src/components/about/
  AboutContent.tsx     (existing — remove or rewrite as thin composition layer)
  AboutHero.tsx        (new — hero section)
  AboutStats.tsx       (new — stats strip)
  AboutBento.tsx       (new — problem/solution/image bento)
  AboutFeatures.tsx    (new — platform features grid)
  AboutPrinciples.tsx  (new — principles + quote)
  AboutCTA.tsx         (new — auth-aware CTA banner)
```

**Total: 6 new files** + rewrite of page.tsx

## Dependencies & Risks

- **Images from Andria:** `hero.jpg` and `bento-camera.jpg` need to be sourced. Use placeholder until provided.
- **Georgian translations:** ~50 new KA keys needed. Can use approximate translations initially; Andria reviews.
- **Problem card dark bg:** Must use hardcoded `#1A1917`, NOT `var(--foreground)` — easy to get wrong.
- **Radar chart SVG:** Decorative inline SVG in the comparison feature card. Keep simple (two polygons on a hexagonal grid).
- **Existing `AboutContent.tsx`:** Will be replaced. Current role-aware CTA logic should be preserved in `AboutCTA.tsx`.

## Sources & References

- **Design spec:** [docs/superpowers/specs/2026-04-02-about-page-redesign-design.md](docs/superpowers/specs/2026-04-02-about-page-redesign-design.md)
- **Visual mockup:** `.superpowers/brainstorm/20333-1775123903/content/about-polished-v4.html`
- **Current about page:** `src/app/(shared)/about/page.tsx` (21 lines)
- **Current about content:** `src/components/about/AboutContent.tsx` (62 lines)
- **About translations:** `src/lib/translations/landing.ts:131-160` (EN), `:287-320` (KA)
- **Leagues redesign patterns:** `docs/plans/2026-03-31-feat-leagues-page-redesign-plan.md` (ISR, getServerT, FadeInOnScroll, CSS @layer)
- **Landing page composition:** `src/app/(public)/page.tsx` (section composition reference)
- **FadeInOnScroll:** `src/components/ui/FadeInOnScroll.tsx`
- **Theme tokens:** `src/app/globals.css` (CSS custom properties)
