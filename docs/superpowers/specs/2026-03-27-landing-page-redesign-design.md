# Landing Page Redesign — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Scope:** Landing page content sections only (navbar and footer unchanged)

---

## Overview

Redesign the Binocly landing page to follow a new section layout inspired by a provided HTML template, while keeping the existing color system, navbar, footer, and i18n architecture unchanged.

## Design Rules

- **No bilingual mixing** — one language at a time, controlled by the language toggle. Never show EN + KA text simultaneously in the same view.
- **Existing color system unchanged** — warm off-white light (#FDFCFA) / warm dark (#12110F) toggle, green accent (#1B8A4A / #4ADE80). All existing CSS custom properties and theme tokens stay as-is.
- **Navbar and footer untouched** — LandingNav and LandingFooter components are not modified.
- **All text via `t()` translations** — no hardcoded strings. Exception: proper nouns (player names, club names, company names) are not translated.
- **Real data from database** — player slider and club logos pull from actual DB records, not hardcoded.

## Page Sections (top → bottom)

### Section 1: Hero

**Layout:** Two-column grid (left ~60%, right ~40%). Stacks vertically on mobile.

**Left column:**
- Badge: "Elite Georgian Talent" (uppercase, green, pill-shaped)
- Headline: "Connecting International Scouts with the Future of Georgian Football" — "Georgian Football" in green accent
- Subtitle: one-liner about the platform value proposition
- Two CTA buttons: "Get Started" (primary green) + "Learn More" (outline)
- Stats row below CTAs (separated by border-top):
  - `37,600+` — Youth Players
  - `€100M+` — In Transfers
  - `✓ Verified` — By Starlive

**Right column:**
- Auto-rotating player slider (portrait, ~3:4 aspect ratio)
- Shows featured players from the database: photo/silhouette, name, position, age, club
- Dot indicators at bottom, auto-cycles every 4-5 seconds
- Player info overlaid at bottom with gradient overlay
- Pulls from a "featured" set of players (could be random or curated)

### Section 2: Club Logo Slider

**Layout:** Full-width band on surface background (#F4F1EC light / #1C1A17 dark).

- Label: "Featured Clubs" (centered, uppercase, small)
- Auto-scrolling infinite loop of real club logos from the database
- Circular logo containers
- Pauses on hover
- Duplicated items for seamless infinite scroll animation via CSS `@keyframes`

### Section 3: Georgian Talent on the World Stage

**Layout:** Section heading + two-column grid of story cards.

**Section heading:** "Georgian Talent on the World Stage" with green underline bar.

**Each card (Kvaratskhelia + Mamardashvili):**
- **Photo area** (top, 200px): Player photo with gradient overlay. Name, position (flag 🇬🇪), and transfer fee (€70M / €30M in #4ADE80 bright green) overlaid at bottom.
- **Card body** (below photo): Two-column split layout — Career Path on LEFT, Achievements on RIGHT. Both columns MUST be equal height (use flexbox stretch + space-between).

**Career Path (left column):** Vertical timeline with dots and connecting line.
- Dots: 10px diameter, centered on a 2px vertical line
- Line connects dot-center to dot-center only (no overshoot above first or below last dot)
- Implementation: Use separate `tl-line-up` and `tl-line-down` segments per item, both centered with `left: 50%; transform: translateX(-50%)` — same centering method as the dot. First item has line-down only, middle items have both, last item has line-up only.
- Last dot is green (#1B8A4A) with subtle glow, others are gray (#C4BFB8) with white fill
- Last club name in green

**Achievements (right column):** Stacked badge rows with green left border.
- Each badge: `background: #F4F1EC`, `border-left: 3px solid #1B8A4A`, `border-radius: 0.5rem`
- Title (bold, dark) + description line (smaller, gray)
- No emojis, no icons — text only with green left accent
- Use `justify-content: space-between` to distribute evenly and match timeline height

**Kvaratskhelia:**
- Timeline: Dinamo Tbilisi (2017–2018) → Rubin Kazan (2019) → SSC Napoli (2022–2024) → Paris Saint-Germain (2025–, current)
- Achievements: Serie A Champion (2022-23 with Napoli), Serie A MVP (2022-23 Season), 40+ International Caps (Georgia National Team)

**Mamardashvili:**
- Timeline: Dinamo Tbilisi (2016–2019) → Locomotive Tbilisi (2019–2021) → Valencia CF (2021–2025) → Liverpool FC (2025–, current)
- Achievements: La Liga Best Goalkeeper (2023-24 Season), Most Saves at Euro 2024 (29 saves — tournament leader), Record Georgian Transfer (€30M to Liverpool FC)

**Photos:** Use real player photos (editorial/press images). Source during implementation.

**Visual reference:** `.superpowers/brainstorm/12170-1774630259/content/timeline-fix.html`

**Note:** This section is static/hardcoded content — not database-driven. These are specific real-world success stories used for marketing.

### Section 4: For Scouts / For Academies

**Layout:** Two-column grid on surface background. Stacks vertically on mobile.

**Each card:**
- Icon (green-tinted background)
- Title: "For Scouts" / "For Academies"
- Description paragraph
- 3-item feature checklist with green checkmarks
- CTA button at bottom

**For Scouts features:**
- Direct messaging with academies
- Camera-verified player statistics
- Shortlists and comparison tools
- CTA: "Register as Scout" → `/register`

**For Academies features:**
- Global visibility for your players
- Scout inquiry management
- Verified profiles with camera data
- CTA: "Register Your Academy" → `/register`

### Section 5: Partners

**Layout:** Centered, minimal. On page background.

- Label: "Our Partners" (centered, uppercase, small)
- Two partner names/logos: **Free Football Agency** + **Starlive**
- Displayed at reduced opacity, color on hover
- No other partners (no Pixellot, no Erovnuli Liga)

## Sections Removed (vs. current landing)

- **How It Works** (3-step timeline) — removed
- **Social Proof** (standalone animated stat tiles) — stats integrated into hero instead
- **Bottom CTA Banner** (dark green banner) — removed, page ends cleanly with partners → footer

## Responsive Behavior

- Hero: 2-col → 1-col (player slider below headline on mobile)
- Club slider: continuous scroll, same on all sizes
- Success stories: 2-col → 1-col
- Audience panels: 2-col → 1-col
- Partners: always centered, wraps naturally

## Dark Mode

All sections must work in both light and dark themes using existing CSS custom properties. No new color tokens needed — use `--background`, `--surface`, `--elevated`, `--primary`, `--foreground-secondary`, etc.

## Data Requirements

- **Featured players for hero slider:** Query players table, select a set to feature (TBD: random, most-viewed, or manually flagged)
- **Club logos for slider:** Query clubs table, use `logo_url` field if available or club name as fallback
- **Success stories:** Hardcoded (Kvaratskhelia + Mamardashvili are not in our database — these are real-world marketing examples)
- **Audience panel content:** From translations via `t()`

## Visual Reference

Full mockup available at `.superpowers/brainstorm/19066-1774607651/content/final-layout.html`
