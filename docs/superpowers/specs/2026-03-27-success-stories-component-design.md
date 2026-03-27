# Success Stories Component — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Scope:** "Georgian Talent on the World Stage" section on the landing page
**Visual reference:** `.superpowers/brainstorm/12170-1774630259/content/timeline-fix.html`

---

## Overview

A standalone section showcasing two Georgian football success stories (Kvaratskhelia and Mamardashvili) as side-by-side cards. Each card has a player photo on top, and a two-column body below with a career timeline on the left and achievement badges on the right.

## Component: `SuccessStories`

**Location:** `src/components/landing/SuccessStories.tsx`
**Type:** Server component (static content, no interactivity)
**i18n:** All text via `t()` — section title, achievement titles/descriptions, year labels, club names stay untranslated (proper nouns)

## Section Layout

- Centered section heading: "Georgian Talent on the World Stage" + green underline bar (3px, 48px wide, `--primary`)
- Two-column card grid below (1fr 1fr), stacks to single column on mobile (<700px)
- Section padding: consistent with other landing sections
- Background: page background (`--background`)

## Card Structure

Each card is a self-contained unit:

```
┌─────────────────────────────┐
│  PHOTO AREA (200px)         │
│  ┌───────────────────────┐  │
│  │ gradient overlay       │  │
│  │ 🇬🇪 Name              │  │
│  │ Position      €70M    │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  CAREER PATH  │ ACHIEVEMENTS│
│  ○ 2017-18    │ ┃ Title    │
│  │ Dinamo      │ ┃ Desc     │
│  ○ 2019       │            │
│  │ Rubin       │ ┃ Title    │
│  ○ 2022-24    │ ┃ Desc     │
│  │ Napoli      │            │
│  ● 2025-      │ ┃ Title    │
│  PSG (green)  │ ┃ Desc     │
└─────────────────────────────┘
```

### Photo Area

- Height: 200px, `overflow: hidden`, `border-radius` on card handles top corners
- Real player photos via `next/image` (store in `public/images/landing/`)
  - Kvara: green-tinted gradient fallback (`linear-gradient(135deg, #0D3B2E, #1B8A4A, #4ADE80)`)
  - Mamardashvili: red-tinted gradient fallback (`linear-gradient(135deg, #5C1A1A, #CC3333, #F87171)`)
- Gradient overlay at bottom: `linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)`
- Overlaid info at bottom-left: Georgian flag 🇬🇪, player name (bold, white), position (uppercase, smaller, 75% opacity white)
- Transfer fee at bottom-right: bold, `#4ADE80` (bright green), large text with text-shadow

### Card Body (Two-Column Split)

- `display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; padding: 1.25rem`
- `align-items: stretch` — both columns MUST be equal height
- Each column: `display: flex; flex-direction: column`
- Column headers: "CAREER PATH" / "ACHIEVEMENTS" — small, uppercase, letter-spaced, gray (`--foreground-faint`)

### Career Path (Left Column — Timeline)

**Structure per item:**
```html
<div class="tl-item">
  <div class="tl-track">
    <div class="tl-line-up"></div>    <!-- only on non-first items -->
    <div class="tl-dot"></div>
    <div class="tl-line-down"></div>  <!-- only on non-last items -->
  </div>
  <div class="tl-content">
    <div class="tl-year">2017 – 2018</div>
    <div class="tl-club">Dinamo Tbilisi</div>
  </div>
</div>
```

**Dot alignment (critical):**
- `tl-track`: fixed 20px width, `position: relative`, `align-self: stretch`
- `tl-dot`: 10px diameter, `position: absolute`, `top: 3px`, `left: 50%; transform: translateX(-50%)`, `z-index: 2`
- `tl-line-down`: `position: absolute`, `top: 8px` (dot center = 3px + 5px radius), `bottom: 0`, `left: 50%; transform: translateX(-50%)`, `width: 2px`, `z-index: 1`
- `tl-line-up`: `position: absolute`, `top: 0`, `height: 8px`, `left: 50%; transform: translateX(-50%)`, `width: 2px`, `z-index: 1`
- This ensures the line passes exactly through every dot center with no overshoot above the first or below the last

**Dot styles:**
- Default: `background: #FDFCFA; border: 2px solid #C4BFB8` (gray outline, white fill)
- Current (last): `border-color: #1B8A4A; box-shadow: 0 0 0 3px rgba(27,138,74,0.15)`
- Line color: `#E0DDD8`

**Text:**
- Year: 0.6rem, 600 weight, uppercase, letter-spaced, `--foreground-faint`
- Club: 0.8rem, 600 weight, `--foreground`
- Current club: `--primary` color, 700 weight

**Content spacing:** `padding-bottom: 1rem` per item, last item `padding-bottom: 0`

### Achievements (Right Column)

- `flex: 1; display: flex; flex-direction: column; justify-content: space-between` — distributes badges evenly to match timeline height
- Three achievement badge rows per card

**Badge row:**
- `background: var(--surface)` (light: `#F4F1EC`, dark: `#1C1A17`)
- `border-left: 3px solid var(--primary)`
- `border-radius: 0.5rem`
- `padding: 0.5rem 0.65rem`
- No icons, no emojis — text only

**Badge content:**
- Title: 0.7rem, 700 weight, `--foreground` color
- Description: 0.6rem, 500 weight, `--foreground-secondary` color

## Player Data (Hardcoded)

### Kvaratskhelia
- **Photo:** Real image (source during implementation, store at `public/images/landing/kvaratskhelia.jpg`)
- **Name:** Khvicha Kvaratskhelia
- **Position:** Left Winger
- **Fee:** €70M
- **Timeline:**
  1. 2017–2018 — Dinamo Tbilisi
  2. 2019 — Rubin Kazan
  3. 2022–2024 — SSC Napoli
  4. 2025– — Paris Saint-Germain (current)
- **Achievements:**
  1. Serie A Champion — 2022-23 with Napoli
  2. Serie A MVP — 2022-23 Season
  3. 40+ International Caps — Georgia National Team

### Mamardashvili
- **Photo:** Real image (source during implementation, store at `public/images/landing/mamardashvili.jpg`)
- **Name:** Giorgi Mamardashvili
- **Position:** Goalkeeper
- **Fee:** €30M
- **Timeline:**
  1. 2016–2019 — Dinamo Tbilisi
  2. 2019–2021 — Locomotive Tbilisi
  3. 2021–2025 — Valencia CF
  4. 2025– — Liverpool FC (current)
- **Achievements:**
  1. La Liga Best Goalkeeper — 2023-24 Season
  2. Most Saves at Euro 2024 — 29 saves, tournament leader
  3. Record Georgian Transfer — €30M to Liverpool FC

## Dark Mode

All colors must respect the theme toggle:
- Card background: `--background` or white equivalent
- Card border: use `--elevated` or `outline-variant` token
- Photo overlays: rgba-based, work on both themes
- Timeline line/dots: use theme-aware tokens (`--foreground-faint` for line, `--primary` for current dot)
- Achievement badge background: `--surface`
- Achievement badge border: `--primary`
- Text colors: `--foreground`, `--foreground-secondary`, `--foreground-faint`

## Responsive

- **Desktop (>700px):** Two cards side by side, two-column body in each card
- **Mobile (<700px):** Cards stack vertically (single column), card body stays two-column (timeline + achievements side by side within each card)

## Translation Keys

Add to landing translations namespace:
- `landing.successStories.title` — "Georgian Talent on the World Stage"
- `landing.successStories.careerPath` — "Career Path"
- `landing.successStories.achievements` — "Achievements"
- `landing.successStories.present` — "Present"
- Achievement titles and descriptions (6 total, one key each)
- Player position labels (2 total)

Club names, player names, and league names are NOT translated (proper nouns).

## Images

Source real player photos during implementation:
- Look for press/editorial photos with permissive licensing
- Fallback: use the gradient backgrounds (already defined per player) if photos can't be sourced
- Store at `public/images/landing/kvaratskhelia.jpg` and `public/images/landing/mamardashvili.jpg`
- Use `next/image` with `fill` + `object-fit: cover` for responsive sizing
