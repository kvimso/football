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
- **Photo area** (top): Player photo with gradient overlay. Name, position (flag 🇬🇪), and transfer fee (€70M / €30M in bright green) overlaid at bottom.
- **Timeline area** (bottom): Vertical timeline with dots showing career path.

**Kvaratskhelia timeline:**
1. 2017–2018 — Dinamo Tbilisi
2. 2019 — Rubin Kazan
3. 2022–2024 — SSC Napoli
4. 2025– — Paris Saint-Germain (current, green dot + green text)

**Mamardashvili timeline:**
1. 2016–2019 — Dinamo Tbilisi
2. 2019–2021 — Locomotive Tbilisi
3. 2021–2025 — Valencia CF
4. 2025– — Liverpool FC (current, green dot + green text)

**Photos:** Use real player photos (editorial/press images). Source during implementation.

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
