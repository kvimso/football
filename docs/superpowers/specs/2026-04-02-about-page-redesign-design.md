# About Page Redesign — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Mockup reference:** `.superpowers/brainstorm/20333-1775123903/content/about-polished-v4.html`

---

## Overview

Complete redesign of the About page (`/about`). Replaces the current minimal `AboutContent.tsx` (title + two cards) with a full editorial-style page: Hero, Stats Strip, Problem/Solution Bento, Platform Features, Principles + Quote, and CTA Banner.

**Component location:** `src/components/about/AboutContent.tsx` (rewrite)
**Page:** `src/app/(shared)/about/page.tsx` (server component, passes `isLoggedIn`)
**Type:** Server component. No client interactivity beyond existing nav/footer.

---

## Page Structure (7 sections, top to bottom)

### Section 1: Hero (editorial text-first)

Two-column grid: text left (wider), portrait image right.

**Layout:**
- `max-width: 1200px`, grid `1fr 380px`, gap `3rem`, `align-items: start`
- Padding: `5rem` top, `5rem` bottom

**Left column:**
- Green uppercase label: "ABOUT BINOCLY" (with `t()`)
- Headline: `3.5rem`, weight 900, line-height 1.15, tracking -0.03em
  - Text: "The scouting platform *Georgian football* has been missing."
  - "Georgian football" is green italic (`color: primary`)
- Description paragraph: `1.1rem`, line-height 1.7, `color: fg-secondary`, max-width 560px
  - Text: "Georgian talent is making headlines — Kvaratskhelia at PSG, Mamardashvili headed to Liverpool. But behind the breakout stars, thousands of young players remain invisible to the world. Binocly changes that."

**Right column:**
- Portrait image, `aspect-ratio: 3/4`, `border-radius: 16px`
- `box-shadow: 0 16px 48px -8px rgba(26,25,23,0.1)`
- `filter: grayscale(15%) contrast(108%)`
- **Photo:** Stadium from the stands (Pexels #61135) — save to `public/images/about/hero.jpg`
- Fallback: use `next/image` with priority loading

**Mobile (< 768px):** Single column, image hidden or placed above text at reduced height.

---

### Section 2: Stats Strip

Four stats in a horizontal grid with vertical dividers.

**Layout:**
- `max-width: 1200px`, grid `repeat(4, 1fr)`
- Top and bottom border: `1px solid border`
- Each stat centered, padding `2.5rem 1.5rem`
- Vertical divider between items: `1px` line at 25–75% height via `::after`

**Stats (all via `t()`):**
| Number | Label | Style |
|--------|-------|-------|
| 37,600+ | Registered Youth Players | Green `+` accent |
| €100M+ | In Recent Transfers | Green `+` accent |
| 200+ | Academies Nationwide | Green `+` accent |
| 0 | Centralized Scouting Platforms | Red (`danger`) number |

**Numbers:** `2.5rem`, weight 900, tracking -0.03em
**Labels:** `0.65rem`, weight 700, uppercase, tracking 0.15em, `color: fg-faint`

**Mobile:** 2x2 grid.

---

### Section 3: Problem/Solution Bento Grid

Three-card asymmetric bento layout in a 3-column grid.

**Header (above grid):**
- Flex row: left side (label + heading) + right side (pull quote)
- Label: "WHY BINOCLY EXISTS" with green line `::before` (20px × 2px)
- Heading: `2.75rem`, weight 900, "Georgian talent is booming. / The infrastructure isn't."
- Right pull quote: max-width 280px, `border-left: 2px solid primary`, padding-left 1.25rem
  - Text: "The next Kvaratskhelia is training right now at a Georgian academy. The question is whether the world will find them in time."

**Grid:** `grid-template-columns: repeat(3, 1fr)`, gap `1.25rem`

#### Card A: The Problem (spans 2 columns, row 1)

- **Background:** `var(--fg)` (#1A1917), text `#EEECE8`
- **Decorative:** Subtle red glow orb, top-right corner (`rgba(204,51,51,0.06)`, 250px circle)
- **Label:** Red dot (6px) + "THE PROBLEM" in red, uppercase
- **Title:** "Scouts are flying blind" — `1.6rem`, weight 800
- **Subtitle:** "International scouts interested in Georgian talent face the same obstacles over and over." — `0.85rem`, opacity 0.5
- **List:** 2×2 grid of pain points, each with:
  - SVG X icon in red-tinted box (30×30px, radius 8px, `rgba(204,51,51,0.12)`)
  - Title (bold 0.9rem) + description (0.78rem, opacity 0.55)
  - Key phrases highlighted in `#F87171`

**Pain points:**
1. **Fragmented Data** — "Player info scattered across academy websites, PDFs, and word of mouth. *No single source of truth.*"
2. **No Verified Stats** — "Self-reported numbers with *no way to verify* without attending matches in person."
3. **Scattered Footage** — "Match clips on random YouTube channels, or *not recorded at all.* Finding footage means knowing someone."
4. **Communication Gap** — "No direct channel between international scouts and Georgian academies. *Language and logistics block deals.*"

#### Card B: Image Card (spans 1 column, spans 2 rows)

- Full-bleed image with gradient overlay at bottom
- **Photo:** Data screens / analytics office (from Stitch template Google AI image) — save to `public/images/about/bento-camera.jpg`
- **Overlay:** gradient from `rgba(26,25,23,0.9)` at bottom to transparent
- **Tag:** Green badge with shield SVG icon + "VERIFIED BY STARLIVE"
- **Text:** "AI-powered Pixellot cameras at partner academies capture every match. Stats extracted automatically — zero manual entry."
- **Scan line effect:** `::after` pseudo with repeating-linear-gradient (subtle green horizontal lines, 0.03 opacity)

#### Card C: The Binocly Solution (spans 2 columns, row 2)

- **Background:** Gradient `linear-gradient(135deg, #1B8A4A 0%, #0F6B35 40%, #0A4F28 100%)`
- **Decorative:** Two glow orbs — bottom-left white (0.06 opacity), top-right green (#4ADE80, 0.1 opacity)
- **Accent color:** Mint green `#A7F3D0` (used for label, dot, check icons, highlights, subtitle)
- **Label:** Mint dot (6px) + "THE BINOCLY SOLUTION" in mint
- **Title:** "One platform. Every player. Verified data." — `1.6rem`, weight 800, white
- **Subtitle:** "Everything scouts need to discover Georgian talent — and everything academies need to be discovered." — `0.85rem`, mint, opacity 0.7
- **List:** 2×2 grid, each with:
  - SVG checkmark in mint-tinted box (30×30px, `rgba(167,243,208,0.15)`, border `rgba(167,243,208,0.2)`)
  - Title (bold 0.9rem, white) + description (0.78rem, white 0.55 opacity)
  - Key phrases highlighted in `#A7F3D0`

**Solutions:**
1. **Centralized Directory** — "Search every registered player by position, age, club, and *camera-verified performance metrics.*"
2. **Camera-Verified Stats** — "Starlive's Pixellot cameras extract stats automatically. *No manual entry, no bias* — just data."
3. **Direct Messaging** — "Real-time chat between scouts and academy admins. *Discuss, share files, negotiate* — all in one place."
4. **Fully Bilingual** — "Complete *English and Georgian* support. International scouts and local academies on the same platform."

**Mobile:** All cards stack to single column, full width.

---

### Section 4: Platform Features (Bento Grid)

Four feature cards in asymmetric bento layout.

**Header:**
- Label: "PLATFORM CAPABILITIES" with green line `::before`
- Heading: "What you get" — `2.25rem`
- Subtitle: "Every tool scouts and academies need — in one place."

**Grid:** `repeat(3, 1fr)`, 2 rows

**Layout:**
- Row 1: Large Search card (span 2) + Trending Players (span 1)
- Row 2: Scout-Academy Chat (span 1) + Large Comparison card (span 2, dark)

**Each card:** `bg: surface`, `border-radius: 16px`, hover: translateY(-3px) + subtle shadow

**Card icons:** SVG line icons (stroke, no fill, no emojis)

#### Feature 1: Advanced Player Search (large, span 2)
- Two-column inner grid: text left, visual mockup right
- **Visual:** Search input mockup + filter pill row (U17 active, Midfielder, Tbilisi active, 170cm+)
- **Icon:** Magnifying glass SVG
- **Badge:** "FOR SCOUTS"

#### Feature 2: Trending Players (small)
- **Icon:** Trending line chart SVG (polyline up-right + arrow)
- **Text:** "See which players are getting the most views from scouts this week. Discover rising talent before the crowd."
- **Badge:** "FOR SCOUTS"

#### Feature 3: Scout-Academy Chat (small)
- **Icon:** Chat bubble SVG
- **Text:** "Direct messaging with file sharing and embedded player references. No middlemen."
- **Badge:** "BOTH"

#### Feature 4: Player Comparison (large, span 2, DARK)
- `background: var(--fg)`, text `#EEECE8`
- Two-column: text left, radar chart SVG right
- **Radar chart:** Hexagonal grid with two overlapping player polygons (green solid + blue dashed)
- **Icon:** Bar chart SVG, mint green (`#4ADE80`)
- **Badge:** "FOR SCOUTS" (mint green bg)

**Mobile:** All cards single column, large cards lose the visual mockup column.

---

### Section 5: Principles + Quote (two columns)

**Layout:** `border-top: 1px solid border`, grid `1fr 1fr`, gap `5rem`

**Left: Three numbered principles**

Each principle: big faded number + text block

- **Number:** `3rem`, weight 900, `color: primary`, opacity 0.3, width 60px
- **Title:** weight 800, `1.05rem`
- **Description:** `0.875rem`, `color: fg-secondary`, line-height 1.65

**Principles:**
1. **Every stat verified by camera** — "No self-reported data. Starlive's Pixellot cameras record matches and extract statistics automatically using AI. What you see on Binocly is what happened on the pitch."
2. **Built bilingual from day one** — "Full English and Georgian throughout — not a translation layer bolted on later. International scouts and local academy admins both work in their preferred language."
3. **Direct connections, no gatekeepers** — "Scouts message academies directly. No agents in the middle, no approval gates. Subscribe, search, connect. The platform gets out of the way."

**Right: Quote card**

- `bg: surface`, `border-radius: 16px`, padding `3rem`
- Large faded quote mark: `6rem`, Georgia serif, `color: primary`, opacity 0.12, absolute top-left
- **Quote text:** `1.35rem`, weight 700, line-height 1.45
  - "Georgian football produced a *€70M* forward and a *€30M* goalkeeper in two years. Imagine what happens when the world can actually *see* the next generation."
  - Emphasized words in green (`color: primary`)
- Green divider bar: 40px × 3px
- **Source:** "The Binocly Thesis" (bold) + "The talent exists. The infrastructure didn't — until now." (faint)

**Mobile:** Single column, quote card below principles.

---

### Section 6: CTA Banner

Dark rounded banner with registration call-to-action.

- `bg: var(--fg)`, `border-radius: 20px`, padding `4rem`
- Flex row: text left, buttons right
- Decorative: Large faded green circle, top-right (500px, opacity 0.06)
- **Heading:** "Ready to discover Georgian talent?" — `2rem`, weight 900, `#EEECE8`
- **Subtitle:** "Join as a scout or register your academy." — `1rem`, opacity 0.6
- **Buttons:**
  - Primary: "Create Account" → links to `/register` (or `/players` if logged in)
  - Secondary: "Contact Us" → links to `/contact`

**Mobile:** Stack vertically, buttons full width.

---

## Images to Source

| Image | Location | Source | Notes |
|-------|----------|--------|-------|
| Hero portrait | `public/images/about/hero.jpg` | Pexels #61135 | Stadium from the stands, 3:4 crop |
| Bento camera card | `public/images/about/bento-camera.jpg` | From Stitch template (Google AI) | Data screens / analytics office |

Download and save locally. Use `next/image` with proper width/height/alt.

---

## i18n Keys

All text via `t()`. Add keys under `about.*` namespace:

```
about.label
about.hero.title (with interpolation for italic span)
about.hero.description
about.stats.players / about.stats.transfers / about.stats.academies / about.stats.platforms
about.bento.label
about.bento.heading
about.bento.pullQuote
about.problem.label / about.problem.title / about.problem.subtitle
about.problem.items[0-3].title / about.problem.items[0-3].desc
about.solution.label / about.solution.title / about.solution.subtitle
about.solution.items[0-3].title / about.solution.items[0-3].desc
about.bento.imageTag / about.bento.imageDesc
about.features.label / about.features.heading / about.features.subtitle
about.features.items[0-3].title / about.features.items[0-3].desc / about.features.items[0-3].badge
about.principles[0-2].title / about.principles[0-2].desc
about.quote.text / about.quote.source / about.quote.sourceDesc
about.cta.heading / about.cta.subtitle / about.cta.primary / about.cta.secondary
```

Both `en` and `ka` translations required.

---

## Dark Mode

Use existing CSS custom properties. All colors reference `var(--*)` tokens which auto-switch with `[data-theme="dark"]`. Special cases:

- Problem card: dark bg in both modes (already dark)
- Solution card: green gradient in both modes (already green)
- Image card: overlay works in both modes
- Stats strip borders, feature card backgrounds, quote card bg — all use theme tokens
- CTA banner: dark bg in both modes

No additional dark mode overrides needed for the bento cards since they use explicit colors.

---

## Responsive Breakpoints

- **Desktop (≥1024px):** Full layout as designed
- **Tablet (768–1023px):** Bento cards 2-col (problem full-width, solution full-width, image goes above or below), features 2-col
- **Mobile (<768px):** Single column everything. Hero image hidden or small. Stats 2×2. All bento cards full-width stacked. Features stacked. Principles + quote stacked. CTA buttons full-width.

---

## What NOT to Build

- No photo switcher UI (that was for design exploration only)
- No animations beyond hover transforms on feature cards
- No new API routes
- No new database queries (only auth check for CTA button text)
- Navbar and footer are untouched — provided by `(shared)/layout.tsx`
