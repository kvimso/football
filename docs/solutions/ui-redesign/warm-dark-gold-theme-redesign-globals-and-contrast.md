---
title: "Warm Dark Platform Theme + Georgian Gold Accent Redesign (Session 1)"
date: "2026-03-12"
tags:
  - ui-redesign
  - theme-colors
  - css-refactor
  - dark-mode
  - accessibility
  - tailwind-v4
category: ui-redesign
severity: high
component: "Theme System, CSS Variables, Color Palette"
related_files:
  - src/app/globals.css
  - src/app/(public)/layout.tsx
  - src/app/(auth)/layout.tsx
  - src/lib/constants.ts
---

# Warm Dark + Georgian Gold Theme Redesign (Session 1: Foundation)

## Problem

The platform had a clinical light/navy theme (cool slate grays `#f8fafc`/`#f1f5f9` + navy accent `#1e3a8a`) that felt sterile and institutional. Users described it as "hospital vibes." This was misaligned with the target audience: every major scouting platform (Wyscout, SciSports, StatsBomb) uses dark themes for data-dense marketplaces. The light theme also lacked cultural personality — no Georgian identity.

## Root Cause

The prior redesign was purely chromatic — a color swap without considering:
1. Dark themes reduce eye strain for extended data analysis (industry standard for scouting tools)
2. Cool slate grays lack warmth and cultural resonance
3. No scoping strategy for dual-theme (landing page should feel welcoming, platform should feel professional/data-dense)

## Solution Architecture

**Dual-theme CSS variable scoping:**

```
:root (dark platform — the default, 95% of user time)
  └── .landing (warm ivory override — landing + auth pages only)
      └── @theme inline (Tailwind bridge — utilities auto-adapt)
```

- `:root` defines dark platform values + `color-scheme: dark`
- `.landing` class overrides with warm ivory values + `color-scheme: light`
- `.landing` applied to `(public)/layout.tsx` and `(auth)/layout.tsx` wrapper divs
- Platform routes (`/players`, `/dashboard`, `/admin`, `/platform`) inherit dark `:root` by default

### Dark Platform Palette (`:root`)

| Variable | Value | Role |
|----------|-------|------|
| `--background` | `#141218` | Warm off-black, purple undertone |
| `--background-secondary` | `#1c1a22` | Elevated surfaces, sidebars |
| `--card` | `#23212b` | Card surface |
| `--card-hover` | `#2a2834` | Card hover, skeleton loading |
| `--foreground` | `#e8e6ef` | Primary text (warm off-white) |
| `--foreground-muted` | `#9896a3` | Secondary text (5:1 on bg) |
| `--accent` | `#c9a227` | Georgian gold (7:1 on bg) |
| `--accent-hover` | `#d4b03a` | Lighter gold for hover |
| `--accent-muted` | `rgba(201,162,39,0.15)` | Tinted gold backgrounds |
| `--border` | `#33313d` | Subtle borders |
| `--skeleton` | `#2a2834` | Loading skeleton blocks |

### Warm Ivory Palette (`.landing`)

| Variable | Value | Role |
|----------|-------|------|
| `--background` | `#faf8f5` | Warm ivory |
| `--foreground` | `#2c2a35` | Warm near-black |
| `--accent` | `#c9a227` | Same gold |
| `--accent-hover` | `#a68521` | Darker gold (better contrast on light) |
| `--border` | `#e8e4dd` | Warm gray border |

## Key Decisions

### 1. Button Contrast: Dark Text on Gold

Gold (`#c9a227`) + white text = 2.3:1 (fails WCAG). Solution: `color: var(--background)` gives dark text on gold = 8.6:1. This evokes trophy/medal aesthetics.

**Landing override needed:** On `.landing`, `--background` is ivory (`#faf8f5`), so `.btn-primary` text becomes ivory-on-gold (fails). Fixed with:

```css
.landing .btn-primary {
  color: var(--foreground);  /* #2c2a35 dark text */
}
```

### 2. Status Badges: Tinted Transparent Pattern

Old: `bg-yellow-100 text-yellow-800` (assumes light surface, invisible on dark)

New: `bg-{color}-500/15 text-{color}-400` (surface-agnostic):

```css
.status-badge-pending {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}
```

### 3. Card Depth: Borders Over Shadows

Shadows `rgba(0,0,0,0.08)` are invisible on `#141218`. Cards use `border border-border` at rest, shadows only on hover:

```css
.card {
  border: 1px solid var(--border);
  /* no box-shadow at rest */
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### 4. Position Colors: -500 with Tinted Backgrounds

Position colors shifted from -700 (too dark on dark bg) to -500 variants. Badge pattern: `bg-pos-X/20 text-pos-X` (tinted bg + colored text), avoiding white-text contrast failures.

### 5. BLUR_DATA_URL: Match Card Surface

Changed from light gray (`#e5e7eb`) to dark gray (`#23212b`) to prevent bright flash during image load on dark cards.

## Verification

- `npm run build` passes clean
- Visual spot check: players page (dark), login page (warm ivory), platform admin (dark)
- WCAG contrast verified: gold on dark = 7:1, body text = 10.2:1, muted text = 5:1

## Prevention Strategies

### Avoid Contrast Failures Across Themes

- Never pair two independently-varying semantic variables for fg/bg without a dedicated contrast variable
- When `--background` shifts meaning across themes, consuming components may lose contrast — add explicit `.landing` overrides
- Document the contrast contract for every semantic color pair in CSS comments

### Dual-Theme Component Design Rules

- Use tinted-transparent pattern (`bg-color-500/15 text-color-400`) as default for badges/indicators — surface-agnostic
- Prefer borders over shadows on dark surfaces
- Placeholder images and data URLs must match theme surface colors
- Component classes spanning both contexts should use explicit `.landing` overrides for color, not rely on accidental contrast

### Testing Checklist for Theme Changes

- [ ] WCAG contrast audit on every fg/bg semantic pair in both themes
- [ ] `npm run build` passes
- [ ] Landing page: buttons, hero text, CTA contrast
- [ ] Auth pages: form inputs, labels, submit button text
- [ ] Platform list pages: cards, badges, filter chips, position colors
- [ ] Dark-on-dark check: cards/modals visually distinct from page surface
- [ ] Light-flash check: no bright placeholders/skeletons flashing on dark pages
- [ ] Mobile (375px): tinted badges and small text still readable

### When to Use Semantic Variables vs Hardcoded Colors

- **Semantic variables:** Any color representing a role (background, foreground, accent, border) that changes per theme
- **Tailwind utilities:** Domain-specific colors that don't change per theme (position colors, status indicators), especially with opacity modifiers (`/15`, `/20`)
- **Never hardcode hex in component files** — define in `globals.css` or `constants.ts`

## Related Documents

- [Redesign Plan (Sessions 1-6)](../../plans/2026-03-12-refactor-warm-dark-gold-redesign-plan.md)
- [Brainstorm: Warm Dark Redesign](../../brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md)
- [UI Redesign Research](../../ui-redesign-research.md)
- [Transfer Page Glass-Morphism Pattern](../ui-bugs/transfer-page-premium-redesign-and-rpc-fix.md) — template for position left-border cards
- [Chat Polish & Accessibility](../ui-bugs/chat-session-f-polish-reliability-accessibility.md) — dark theme message bubble pattern
