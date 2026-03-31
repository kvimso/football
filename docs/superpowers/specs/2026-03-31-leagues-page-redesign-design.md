# Leagues Page Redesign — Design Spec

**Date:** 2026-03-31
**Status:** Approved (pending implementation)
**Context:** The current `/leagues` page is a minimal card grid (title + 3 small text cards). This redesign transforms it into an editorial showcase page with cinematic imagery, a dynamic bento layout, and supporting sections that build trust and convert scouts.

---

## Summary

Redesign the public `/leagues` page from a basic card grid into a premium editorial showcase. The page uses real Georgian football photography, a dynamic bento grid layout that adapts to any number of leagues, and supporting sections (How It Works, Season Calendar, CTA Banner) that guide scouts toward requesting a demo.

---

## 1. Page Structure (top to bottom)

### Section 1: Hero Intro
Two-column layout inside the existing `(shared)/` route group (Navbar + Footer).

**Left column (50%):**
- Eyebrow: "Georgian Youth Football" (green, uppercase, letter-spaced)
- Headline: `"Discover the Next Generation of Georgian Talent"` — Noto Serif, 44px, near-black. "Georgian Talent" in green italic
- Description: one paragraph mentioning Starlive + Pixellot partnership
- All text uses `t()` translations

**Right column (50%):**
- Overlapping photo collage:
  - Large photo (88% width, top-right aligned, 240px tall, rounded 12px, shadow)
  - Smaller accent photo (55% width, bottom-left, 160px tall, overlapping the main photo, white border)
  - Floating green badge: "Powered by Starlive / Pixellot Camera Systems" (bottom-right)
- Photos sourced by Andria — real Georgian football imagery
- Use `next/image` with explicit width/height for all photos
- Placeholder: use a subtle gradient background until photos are provided

**Mobile:** Stack vertically — headline first, photos below (single photo, no overlap on mobile).

### Section 2: Dynamic Bento League Grid
The core of the page. Fetches from `leagues` table ordered by `display_order`.

**Layout algorithm based on league count:**
- **1 league:** Full-width hero card
- **2 leagues:** Hero card (full-width) + one card below
- **3 leagues:** Hero card (full-width) + row of 2 cards (5:7 ratio)
- **4 leagues:** Hero card + row of 2 + one full-width card below
- **5+ leagues:** Hero card + row of 2 + additional rows of 2 (alternating 5:7 and 7:5 ratios)

**Card styles (3 variants, assigned by position):**

1. **Hero card** (first league, always full-width):
   - Height: 380px
   - Background: league photo with dark gradient overlay (`linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.15))`)
   - Content at bottom: tier label (green), league name (Noto Serif, 42px, white), meta (clubs, matches, "Pixellot Tracked"), green CTA button "View on Starlive"
   - Hover: subtle scale(1.005) with 0.5s transition
   - Entire card is an `<a>` linking to `starlive_url` (target="_blank")

2. **Warm card** (even positions in rows):
   - Background: `#F4F1EC` (surface token) with dot-grid texture overlay
   - Age group badge (color-coded per existing `AGE_GROUP_COLOR_CLASSES`)
   - League name (Noto Serif, 28px, near-black), meta line, "View on Starlive" link
   - Hover: scale(1.01)

3. **Green card** (odd positions in rows):
   - Background: `#1B8A4A` (primary token)
   - White text, white/translucent badge
   - Same content structure as warm card
   - Hover: scale(1.01)

**Data requirements:**
- Existing `leagues` table columns are sufficient
- New column needed: `photo_url text` — URL to the league's hero photo (used for hero card and bento card backgrounds)
- New columns needed: `season_start date`, `season_end date` — used by the Season Calendar section

**Bilingual:** League name uses `name` / `name_ka`, description uses `description` / `description_ka` based on `lang`.

### Section 3: How It Works
Centered section with top/bottom borders (`#E8E4DE`).

**3 steps in a horizontal row (stack on mobile):**
1. **Browse Leagues** — "Explore Georgian youth leagues and find the age group and talent level you're looking for."
2. **Watch on Starlive** — "Access full match footage and AI-powered player analytics through our Pixellot camera network."
3. **Connect with Academies** — "Message academy directors directly through our platform to discuss players and opportunities."

**Visual:** Each step has a numbered circle (green bg, white number), title (bold), description (gray). Steps connected by thin horizontal lines between circles.

**All text via `t()` translations.**

### Section 4: Season Calendar
Full-width section showing Gantt-style timeline bars.

**Title:** "Season Calendar" (Noto Serif, centered)
**Subtitle:** "Plan your scouting — see when each league is active"

**For each active league:**
- League name label (left, 100px wide)
- Horizontal bar on a track background (`#F4F1EC`)
- Bar color: matches the league's age group color from `AGE_GROUP_COLOR_CLASSES`
- Bar text: "Sep 2025 — May 2026" (start/end dates)
- Bar position and width calculated from `season_start` and `season_end` relative to a Sep-May axis

**Month labels below:** Sep through May, evenly spaced.

**Data source:** `season_start` and `season_end` columns from `leagues` table.

**Mobile:** Bars stack vertically with labels above each bar.

### Section 5: CTA Banner
Green (`#1B8A4A`) rounded banner with dot-grid texture overlay.

- Headline: "Ready to Scout Georgian Talent?" (Noto Serif, white)
- Subtitle: "Get a guided walkthrough of the full platform and start discovering players."
- Button: "Request a Demo" (white bg, green text) → links to `/demo`

**All text via `t()` translations.**

---

## 2. Database Changes

### Migration: Alter `leagues` table

```sql
alter table leagues add column photo_url text;
alter table leagues add column season_start date;
alter table leagues add column season_end date;

-- Seed existing leagues with placeholder dates
update leagues set season_start = '2025-09-01', season_end = '2026-05-31'
  where age_group = 'U19';
update leagues set season_start = '2025-09-01', season_end = '2026-04-30'
  where age_group = 'U17';
update leagues set season_start = '2025-10-01', season_end = '2026-04-30'
  where age_group = 'U15';
```

After migration, regenerate types: `npx supabase gen types typescript --local > src/lib/database.types.ts`

---

## 3. Component Architecture

### New Components

| Component | Location | Type | Purpose |
|---|---|---|---|
| `LeagueHero` | `src/components/league/LeagueHero.tsx` | Server | Hero intro section (two-column with photo collage) |
| `BentoLeagueGrid` | `src/components/league/BentoLeagueGrid.tsx` | Server | Dynamic bento layout algorithm + card rendering |
| `BentoHeroCard` | `src/components/league/BentoHeroCard.tsx` | Server | Full-width cinematic league card |
| `BentoLeagueCard` | `src/components/league/BentoLeagueCard.tsx` | Server | Warm or green league card (variant prop) |
| `HowItWorks` | `src/components/league/HowItWorks.tsx` | Server | 3-step section |
| `SeasonCalendar` | `src/components/league/SeasonCalendar.tsx` | Server | Gantt-style timeline |
| `LeagueCTA` | `src/components/league/LeagueCTA.tsx` | Server | Green CTA banner |

### Modified Files

| File | Change |
|---|---|
| `src/app/(shared)/leagues/page.tsx` | Complete rewrite — compose new sections |
| `src/lib/translations/core.ts` | Add ~30 new translation keys for all sections |
| `src/app/globals.css` | Add bento card styles, calendar bar styles (use CSS custom properties) |
| `src/lib/constants.ts` | No changes — existing `AGE_GROUP_COLOR_CLASSES` reused |
| Platform admin league form | Add `photo_url`, `season_start`, `season_end` fields |

### Removed/Replaced

| File | Action |
|---|---|
| `src/components/league/LeagueCard.tsx` | Keep for now (used by dashboard). Not used on `/leagues` page anymore. |

---

## 4. Styling

**Theme:** Light mode (`#FDFCFA` background), matching the rest of the public site. Uses existing CSS custom properties from `globals.css`.

**Typography:**
- Headlines: Noto Serif (already loaded via `next/font`)
- Body: Inter / system font (already the default)

**New CSS classes needed (in `globals.css`):**
- `.bento-hero-card` — full-width photo card with gradient overlay
- `.bento-card-warm` — surface-colored card with dot texture
- `.bento-card-green` — primary-colored card
- `.cal-bar` — Gantt bar with color variants
- `.photo-collage` — overlapping photo layout

**All colors use existing CSS custom properties** (`--primary`, `--surface`, `--foreground`, `--foreground-secondary`, etc.). No hardcoded hex values in components.

**Responsive breakpoints:**
- Desktop (1024px+): Full two-column hero, bento grid, horizontal steps
- Tablet (768px-1023px): Hero stacks, bento 2-column maintained, steps wrap
- Mobile (375px-767px): Everything stacks, single column, photos simplified

---

## 5. i18n

All user-facing strings use `t()` via `getServerT()` (server component).

**New translation keys (both EN and KA):**

```
leagues.hero.eyebrow
leagues.hero.title
leagues.hero.titleAccent
leagues.hero.description
leagues.hero.badgeMain
leagues.hero.badgeSub
leagues.howItWorks.title
leagues.howItWorks.step1Title
leagues.howItWorks.step1Desc
leagues.howItWorks.step2Title
leagues.howItWorks.step2Desc
leagues.howItWorks.step3Title
leagues.howItWorks.step3Desc
leagues.calendar.title
leagues.calendar.subtitle
leagues.cta.title
leagues.cta.subtitle
leagues.cta.button
leagues.bento.viewOnStarlive
leagues.bento.pixellotTracked
leagues.bento.clubsCount (with interpolation)
leagues.bento.matchesCount (with interpolation)
```

---

## 6. Image Strategy

- All photos sourced by Andria — real Georgian football imagery
- Stored as URLs in `photo_url` column (Supabase Storage or external CDN)
- Use `next/image` with explicit dimensions and `sizes` prop for responsive loading
- Fallback: if `photo_url` is null, use a dark gradient with the league's age group color
- Hero collage photos can be stored as static assets in `/public/images/leagues/` initially

---

## 7. Mockup Reference

The approved visual mockup is saved at:
`.superpowers/brainstorm/55746-1774956962/content/08-full-design.html`

Open locally to see the exact layout, spacing, and visual treatment.

---

## 8. Out of Scope

- Dark mode variant (uses light theme only, like other public pages)
- League detail pages (`/leagues/[id]`)
- Filtering or search on leagues
- Animation beyond hover effects
- Mobile app considerations
