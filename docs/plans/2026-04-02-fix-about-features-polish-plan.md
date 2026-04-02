---
title: About Features Section — Visual Polish
type: fix
status: completed
date: 2026-04-02
origin: docs/superpowers/specs/2026-04-02-about-features-polish-spec.md
---

# About Features Section — Visual Polish

Purely visual polish on the "What you get" features section in `AboutFeatures.tsx`. No layout changes, no new translations, no DB changes. Same 4-card bento grid — just cleaner styling.

## Changes

### 1. Card borders — remove dashed, use subtle solid
- Light cards: `border: 1px solid var(--border)` + `bg-surface` + `rounded-2xl`
- Dark card (Comparison): `bg: linear-gradient(155deg, #141310, #0A0908)` + `border: 1px solid rgba(74,222,128,0.08)`

### 2. Fading green title underline on every card
- `::after` pseudo on titles: `width: 50px`, `height: 2px`, green-to-transparent gradient, `opacity: 0.5` (dark card: `0.6`)

### 3. Corner gradient + blue orb ONLY on dark comparison card
- `::before`: top-right 140px green gradient slice
- `::after`: bottom-left 140px blue glow orb
- Light cards: NO decorative pseudo-elements

### 4. Replace badge pills with minimal dot + audience label
- Remove green badge pills ("FOR SCOUTS", "BOTH")
- Replace with: dot (5px green circle) + uppercase faint label (0.65rem)
- Labels: Search → "Scouts", Trending → "Scouts", Chat → "Scouts & Academies", Comparison → "Scouts"

### 5. Hover effects
- Light: `translateY(-3px)`, border brightens, `box-shadow: 0 12px 32px -8px rgba(0,0,0,0.25)`
- Dark: `translateY(-3px)`, green border brightens, green-tinted shadow

### 6. Visual mockup containers (large cards)
- Light (Search): `bg: rgba(255,255,255,0.02)`, `border: 1px solid var(--border)`
- Dark (Comparison): `bg: rgba(74,222,128,0.02)`, `border: 1px solid rgba(74,222,128,0.06)`

### 7. Improved radar chart SVG
- 3 concentric hexagonal rings (was 2)
- 3 axis lines through center
- Vertex dots at each hexagon corner
- Player A: green fill/stroke solid, Player B: blue fill/stroke dashed
- Labels: PAC, SHO, PAS, DEF, PHY, DRI (7px, faint)

## Acceptance Criteria

- [x] No green dashed borders on any card
- [x] Fading green underline visible below every card title
- [x] Corner gradient + blue orb only on dark comparison card, not light cards
- [x] Badge pills replaced with dot + audience label
- [x] Hover lifts cards with appropriate shadow (green-tinted for dark card)
- [x] Radar chart has 3 rings, vertex dots, and 6 stat labels
- [x] `prefers-reduced-motion` respected on hover transitions
- [x] Dark mode renders correctly (dark card distinguishable from page bg)
- [x] `npm run build` passes

## Files

- `src/components/about/AboutFeatures.tsx` (edit — all changes here)
- `src/app/globals.css` (optional — if adding reusable classes for title underline/audience label)

## What NOT to change

Grid layout, card content, section header, SVG icons in icon boxes, search mockup content, i18n keys, mobile responsive behavior.

## Sources

- **Spec:** [docs/superpowers/specs/2026-04-02-about-features-polish-spec.md](docs/superpowers/specs/2026-04-02-about-features-polish-spec.md)
- **Mockup:** `.superpowers/brainstorm/37961-1775138083/content/features-final-v5.html`
- **Component:** `src/components/about/AboutFeatures.tsx`
