---
title: "refactor: UI redesign — warm dark platform + Georgian gold accent"
type: refactor
status: active
date: 2026-03-12
origin: docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md
---

# UI Redesign: Warm Dark + Georgian Gold

## Overview

Complete visual overhaul replacing the current clinical light/navy theme with a warm dark platform and Georgian gold accent. This is not a color swap — it includes card redesigns, color-coded stat presentation, comparison view enhancements, landing page personality, and navigation restyling.

**Branch:** `redesign/light-navy` (repurposed — Sessions 1-5 of the old light/navy plan are applied, Session 6 QA/merge was never completed)

**Previous state:** The old light/navy migration already converted most hardcoded colors to semantic CSS custom properties. This means the warm dark + gold redesign primarily requires swapping CSS variable values and fixing ~15-20 remaining hardcoded instances. The semantic token infrastructure is already in place.

## Problem Statement

The current light/navy theme (applied on `redesign/light-navy` branch) feels like a hospital. Cool slate grays (`#f8fafc`, `#f1f5f9`) + navy accent (`#1e3a8a`) create a sterile, corporate feel. The previous redesign was just a color swap with no actual UX improvements. Every major scouting platform (Wyscout, SciSports, StatsBomb) uses dark themes for data marketplaces.

## Proposed Solution

1. **Dark platform** with warm purple-black backgrounds (`#141218`) — industry standard for scouting
2. **Warm ivory landing page** (`#faf8f5`) — welcoming first impression
3. **Georgian gold accent** (`#c9a227`) — premium, culturally resonant, distinctive
4. **PlayerCard redesign** — layered depth with position left borders, hover glow
5. **Color-coded stat presentation** — green/amber/red ratings with progress bars
6. **Center-growing comparison bars** — FotMob/SofaScore style
7. **Dark navigation** — gold active states, subtle borders

---

## Technical Approach

### Architecture: CSS Variable Scoping

The theme split (dark platform vs warm ivory landing) uses the same CSS custom property system the codebase already has, with scoping via CSS classes:

```
:root (dark platform — the default)
  └── .landing (warm ivory override — for public/auth pages)
      └── @theme inline (Tailwind bridge — name-dependent, auto-adapts)
          └── Utility classes (bg-background, text-foreground, etc.)
```

**Why `:root` = dark:** The platform (where users spend 95% of their time) should be the default. Only the landing page, auth pages, and About/Contact need the warm override. This means `(platform)`, `dashboard`, `admin`, and `platform` route groups need NO class — they inherit `:root` dark values.

**Implementation:**
- `:root` defines dark platform values + `color-scheme: dark`
- `.landing` class overrides with warm ivory values + `color-scheme: light`
- `.landing` applied to `(public)/layout.tsx` and `(auth)/layout.tsx` wrapper divs
- `(shared)` route group (About/Contact) gets dark theme (shares Navbar/Footer with platform)

### CSS Variable Palette

**Platform (dark) — `:root`:**

| Variable | Value | Notes |
|----------|-------|-------|
| `--background` | `#141218` | Warm off-black, purple undertone |
| `--background-secondary` | `#1c1a22` | Elevated surface, sidebars |
| `--card` | `#23212b` | Card surface |
| `--card-hover` | `#2a2834` | Card hover, skeleton loading |
| `--foreground` | `#e8e6ef` | Primary text (warm off-white) |
| `--foreground-muted` | `#9896a3` | Secondary text. 5:1 on `#141218` (AA pass), 4.1:1 on `#23212b` (borderline — monitor) |
| `--accent` | `#c9a227` | Georgian gold. 7:1 on `#141218` (AA pass) |
| `--accent-hover` | `#d4b03a` | Lighter gold for hover |
| `--accent-muted` | `rgba(201,162,39,0.15)` | Tinted gold backgrounds |
| `--border` | `#33313d` | Subtle borders |
| `--nav-bg` | `rgba(20,18,24,0.95)` | Nav with slight transparency |
| `--skeleton` | `#2a2834` | Loading skeleton blocks (matches card-hover) |

**Landing (warm ivory) — `.landing`:**

| Variable | Value | Notes |
|----------|-------|-------|
| `--background` | `#faf8f5` | Warm ivory |
| `--background-secondary` | `#f2efe9` | Warm stone |
| `--card` | `#ffffff` | White cards |
| `--card-hover` | `#f5f3ee` | Warm hover |
| `--foreground` | `#2c2a35` | Warm near-black |
| `--foreground-muted` | `#6b6878` | Muted purple-gray |
| `--accent` | `#c9a227` | Same gold (3.2:1 on ivory — passes large text only) |
| `--accent-hover` | `#a68521` | Darker gold for better contrast on light |
| `--accent-muted` | `rgba(201,162,39,0.12)` | Subtle gold tint |
| `--border` | `#e8e4dd` | Warm gray border |
| `--nav-bg` | `rgba(250,248,245,0.95)` | Warm ivory nav |

**Position colors (updated to -500 for dark bg visibility):**

| Variable | Value | Tailwind | White text contrast |
|----------|-------|----------|-------------------|
| `--pos-gk` | `#f59e0b` | amber-500 | 2.1:1 — use dark text or tinted bg |
| `--pos-def` | `#6366f1` | indigo-500 | 4.8:1 — passes AA |
| `--pos-mid` | `#06b6d4` | cyan-500 | 3.0:1 — borderline, use as text-on-dark |
| `--pos-att` | `#a855f7` | violet-500 | 3.4:1 — use as text-on-dark |
| `--pos-wng` | `#10b981` | emerald-500 | 2.8:1 — use dark text or tinted bg |
| `--pos-st` | `#ef4444` | red-500 | 4.0:1 — borderline |

**Position badge pattern on dark:** `bg-pos-X/20 text-pos-X` (tinted bg + colored text). This avoids the white-text contrast problem entirely — colored text on dark bg passes easily for all -500 variants.

**On `.landing` (light) pages:** Position colors auto-inherit from `:root` (-500 values). For badges on light backgrounds, use `bg-pos-X/15 text-pos-X` (tinted bg + colored text) — same pattern works on both themes.

### Gold Accent Contrast Resolution

| Context | Pairing | Ratio | Status |
|---------|---------|-------|--------|
| Gold text on dark bg | `#c9a227` on `#141218` | ~7:1 | AA pass |
| Gold text on card | `#c9a227` on `#23212b` | ~5.7:1 | AA pass |
| Gold text on ivory | `#c9a227` on `#faf8f5` | ~3.2:1 | Large text only (hero heading OK) |
| Gold button + white text | white on `#c9a227` | ~2.3:1 | FAILS |
| Gold button + dark text | `#141218` on `#c9a227` | ~8.6:1 | AA pass |
| Darker gold + white text | white on `#a68521` | ~4.5:1 | AA pass (borderline) |

**Button strategy:** `.btn-primary` uses `bg-accent text-background` (dark text on gold). This is the accessible choice and looks natural — gold buttons with dark text evoke trophy/medal aesthetics. On `.landing`, buttons use a slightly darker gold (`--accent-hover: #a68521`) as the button background.

**Alternative for key CTAs that MUST have white text:** Use `#8b7720` (darker gold) as `--accent-dark` for button backgrounds. White on `#8b7720` = ~5.5:1 (AA pass).

### Chat Sent Bubble Resolution

Sent bubbles (`bg-accent text-white`) become gold bg + white text = 2.3:1 (fails). Options:

- **Chosen: `bg-accent text-[var(--background)]`** — dark text on gold. Accessible (8.6:1). Distinctive. Gold sent messages stand out clearly against the dark thread background.
- The `.landing` override is irrelevant here since chat is always on the platform (dark) theme.

### Shadow Strategy on Dark Surfaces

Shadows with `rgba(0,0,0,0.08)` are invisible on `#141218`. Dark theme needs different elevation techniques:

| Element | Technique | CSS |
|---------|-----------|-----|
| Base card rest | Border brightness | `border border-border` (borders provide layering) |
| Card hover | Slight lighten + glow | `bg-card-hover shadow-[0_4px_16px_rgba(0,0,0,0.4)]` |
| Featured player | Gold glow | `shadow-[0_0_20px_rgba(201,162,39,0.12)]` |
| Modal/popover | Deep shadow | `shadow-[0_8px_32px_rgba(0,0,0,0.5)]` |
| Navbar | Bottom border | `border-b border-border` (no shadow needed) |

### Loading State Visibility

Current `bg-background-secondary` skeletons (`#1c1a22` on `#141218`) have only ~1 shade difference — invisible. Use `--skeleton` (`#2a2834`, same as card-hover) for skeleton blocks. This provides ~8 brightness levels of contrast on the main background.

### `BLUR_DATA_URL` Update

Current: light gray SVG (`fill="#e5e7eb"`) — flashes bright on dark cards. Update to dark gray matching card surface (`fill="#23212b"`).

### Browser Form Controls

`color-scheme: dark` on `:root` forces browser-rendered UI (checkboxes, selects, scrollbars) to dark mode. `.landing { color-scheme: light; }` restores light controls on landing/auth pages.

### Focus-Visible Strategy

Add global focus-visible styles for dark theme. Gold focus ring on all interactive elements:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Gold on dark (#c9a227 on #141218) = 7:1 — highly visible. On `.landing`, gold on ivory = 3.2:1 — adequate for focus indicators (WCAG requires 3:1 for non-text UI).

---

## System-Wide Impact

### Interaction Graph

- CSS variable change in `globals.css` → propagates to 141+ files via `@theme inline` bridge → all semantic utilities auto-update
- `.landing` class on layout divs → scopes warm ivory to (public)/(auth) route groups
- PlayerCard structural change (top→left border) → affects player grid, shortlist, comparison, search results
- Stat color-coding → new component logic in player profile page
- Comparison bars → new component replacing current text-based comparison table

### Error Propagation

- CSS variable mistakes propagate everywhere instantly — test in one file of each type
- Position color changes affect 78 files using `bg-accent`/`text-accent` — all auto-update
- Hardcoded colors in ~15-20 files need manual fixing

### State Lifecycle Risks

- No database changes — pure frontend
- No auth changes
- Cookie-stored language preference unaffected
- Shortlist state unaffected

### API Surface Parity

- No API changes needed
- PDF export has its own hardcoded light palette — unaffected by dark theme
- Email templates deferred to Phase 8

---

## Implementation Sessions (~80k tokens each)

### Session 1: Foundation (~70-80k)

**Scope:** `globals.css` full dark rewrite, `.landing` scope, position colors, layout class additions

**Files changed:** ~5-8

- [x] `globals.css`: Replace all `:root` variable values with dark platform palette
- [x] `globals.css`: Change `color-scheme: light` → `color-scheme: dark` on `:root`
- [x] `globals.css`: Add `.landing` class with warm ivory variable overrides + `color-scheme: light`
- [x] `globals.css`: Update position colors from -700 to -500 variants
- [x] `globals.css`: Add `--skeleton: #2a2834` variable
- [x] `globals.css`: Update `.card` shadow → `border border-border` (rest), `shadow-[0_4px_16px_rgba(0,0,0,0.4)]` (hover)
- [x] `globals.css`: Update `.btn-primary` → `bg-accent text-background` (dark text on gold)
- [x] `globals.css`: Update `.btn-secondary` for dark theme (outlined, gold border/text on dark)
- [x] `globals.css`: Update `.input` for dark theme (dark bg, light text, gold focus)
- [x] `globals.css`: Update `.filter-chip` for dark theme
- [x] `globals.css`: Update `.section-header` for dark theme
- [x] `globals.css`: Update status badges — review contrast on dark surfaces
- [x] `globals.css`: Update `.table-row-hover` — dark-appropriate hover (current navy rgba → gold/white rgba)
- [x] `globals.css`: Update scrollbar colors for dark surfaces
- [x] `globals.css`: Add global `:focus-visible` style (gold outline)
- [x] `globals.css`: Update `.landing .btn-primary` → gold bg + darker gold hover + dark text
- [x] `globals.css`: Update `.landing .btn-secondary` for warm ivory
- [x] `globals.css`: Add `.landing` scrollbar overrides (warm gray)
- [x] `src/app/(public)/layout.tsx`: Add `landing` class to wrapper div
- [x] `src/app/(auth)/layout.tsx`: Add `landing` class to wrapper div
- [x] `src/lib/constants.ts`: Update `BLUR_DATA_URL` to dark gray SVG (`fill="#23212b"`)
- [x] `src/lib/constants.ts`: Update `POSITION_COLOR_CLASSES` if pattern changes needed for -500 on dark
- [x] `npm run build` — verify no type errors
- [x] Visual spot check: landing (warm ivory), login (warm ivory), players (dark), admin (dark)

### Session 2: Component Restyling (~70-80k)

**Scope:** PlayerCard redesign, Navbar/Footer dark restyle, sidebars, buttons, inputs

**Files changed:** ~15-20

**PlayerCard redesign:**
- [x] `PlayerCard.tsx`: Change from `border-t-[3px]` to `border-l-[3px]` using `POSITION_LEFT_BORDER_CLASSES`
- [x] `PlayerCard.tsx`: Photo area gradient background (dark → slightly lighter, position-tinted)
- [x] `PlayerCard.tsx`: Update view count badge — `bg-black/60` → `bg-white/10` (visible on dark)
- [x] `PlayerCard.tsx`: Update popular badge — `bg-amber-500/90` → verify visibility on dark
- [x] `PlayerCard.tsx`: Add gold glow on featured players — `shadow-[0_0_20px_rgba(201,162,39,0.12)]`
- [x] `PlayerCard.tsx`: Hover effect — shadow lift + subtle card lighten
- [x] `PlayerCard.tsx`: Free agent label — `text-yellow-700` → `text-yellow-500` (for dark bg)

**Navigation:**
- [x] `Navbar.tsx`: Dark bg matching platform, gold active underline, warm off-white text
- [x] `Navbar.tsx`: Logo pill — `bg-accent text-background` (gold bg, dark text)
- [x] `Navbar.tsx`: Mobile menu — dark bg, gold active items
- [x] `Navbar.tsx`: Notification badge — keep `bg-red-500` (semantic, works on dark)
- [x] `LandingNav.tsx`: Warm ivory bg, gold accents, dark text — adapts via `.landing` scope
- [x] `Footer.tsx`: Dark bg, warm off-white text, gold links
- [x] `LandingFooter.tsx`: Warm ivory bg — adapts via `.landing` scope

**Sidebars:**
- [x] `AdminSidebar.tsx`: Verify dark styling — `bg-background-secondary` (#1c1a22), gold active state
- [x] `AdminSidebar.tsx`: Active item `bg-accent/10` → verify gold tint visible on `#1c1a22`. If too subtle, increase to `bg-accent/15`
- [x] `DashboardNav.tsx`: Dark tab bar, gold active border
- [x] `PlatformSidebar.tsx`: Same treatment as AdminSidebar

**Chat (palette-affected):**
- [x] `MessageBubble.tsx`: Sent bubble → `bg-accent text-[var(--background)]` (dark text on gold)
- [x] `MessageBubble.tsx`: Sent file cards → `bg-white/20 hover:bg-white/30` → verify on gold
- [x] `MessageBubble.tsx`: Received file cards → `bg-background` → verify contrast on `bg-background-secondary`
- [x] `ChatInput.tsx`, `ChatSidebar.tsx`, `ChatThread.tsx`: Verify auto-adapted dark styling

**Hardcoded color fixes (remaining from research):**
- [x] `FilterPanel.tsx`: Replace `focus:shadow-[0_0_12px_rgba(30,58,138,0.08)]` with gold rgba
- [x] Fix any remaining `text-yellow-700` → `text-yellow-500` on dark surfaces
- [x] Fix any remaining hardcoded colors that fail on dark backgrounds

- [x] `npm run build`
- [x] Visual spot check: player grid, player profile, navbar, admin sidebar, chat

### Session 3: Stat Presentation + Comparison (~60-70k)

**Scope:** Color-coded stat rows, progress bars, radar chart enhancement, comparison redesign

**Files changed:** ~5-8

**Color-coded stat rows:**
- [x] Create `StatBar` component (or add to existing) — thin horizontal progress bar with color-coded fill
  - Green (`#10b981`) = above average
  - Amber (`#f59e0b`) = average
  - Red (`#ef4444`) = below average
  - Bar width = percentile (0-100 scale based on stat value)
  - Dark bg behind bar, colored fill, stat value overlaid
- [x] Player profile page (`[slug]/page.tsx`): Add color-coded stat indicators to stat grid
- [x] Player profile page: Add "At a Glance" hero stats section — 4-5 large numbers in mini-cards at top
- [x] Player profile page: Group stats by category (Attacking, Defensive, Physical, Passing) with subtle headers
- [x] Stat grouping: Each category gets a subtle icon and label divider

**Radar chart:**
- [x] `RadarChart.tsx`: Verify gold polygon on dark bg looks good (filled at 20% + gold stroke)
- [x] `RadarChart.tsx`: Grid lines use `var(--border)` (#33313d) — subtle on dark, good
- [x] `RadarChart.tsx`: Consider adding subtle background circle/polygon to make chart area distinct

**Comparison view:**
- [x] `CompareView.tsx`: Replace text-based stat comparison with center-growing bars
  - Bars grow outward from center divider
  - Winner side: filled bar in green (`#10b981`)
  - Loser side: filled bar in muted gray (`var(--foreground-muted)`)
  - Equal values: both sides neutral
  - Zero vs zero: no bars
  - Missing stat: show "—" with no bar
- [x] `CompareRadarChart.tsx`: Player 1 = gold (`var(--accent)`), Player 2 = indigo (`var(--pos-def)` = `#6366f1`). Verify contrast of gold vs indigo overlay on dark
- [x] Comparison page: Dark bg, card surfaces for each player column

- [x] `npm run build`
- [x] Visual spot check: player profile stats, comparison view, radar charts

### Session 4: Landing Page + Auth (~60-70k)

**Scope:** Landing page warm ivory styling, hero redesign, auth page styling

**Files changed:** ~10-12

**Landing page hero:**
- [x] `LandingHero.tsx`: Gold-highlighted "Georgian" word (large text = 3.2:1 passes WCAG large text threshold at text-4xl)
- [x] `LandingHero.tsx`: Primary CTA — dark bg button (not gold — for stronger contrast against warm ivory). E.g., `bg-foreground text-card` (dark button, white text)
- [x] `LandingHero.tsx`: Secondary CTA — outlined gold (`border-accent text-accent`)
- [x] `LandingHero.tsx`: Mock player card — show as dark card (previews platform experience) on warm ivory bg
- [x] `LandingHero.tsx`: Stat bar — warm tones, gold numbers

**Landing sections:**
- [x] `MarketStats.tsx`: Warm ivory bg, gold numbers, warm text
- [x] `Services.tsx`: Service cards — warm white cards on ivory bg, gold accent top border
- [x] `ForScouts.tsx`: Warm ivory alt bg, gold check icons
- [x] `ForAcademies.tsx`: Update decorative formation dots (currently hardcoded amber/blue/cyan/purple) — verify on warm ivory
- [x] `WhatWeDo.tsx`: Warm styling
- [x] `Partners.tsx`: Warm styling

**Auth pages:**
- [x] Login page: Warm ivory bg (via `.landing` on layout), gold focus states on inputs
- [x] Register page: Same treatment
- [x] Verify form controls render with `color-scheme: light` on `.landing`

- [x] `npm run build`
- [x] Visual spot check: landing page all sections, login, register

### Session 5: Page-by-Page Polish (~70-80k)

**Scope:** Every route audited, edge cases fixed, mobile verification

**Files changed:** ~10-15 (fixes and tweaks)

**Route-by-route audit:**
- [x] `/` (landing) — warm ivory, all sections correct
- [x] `/about` — dark theme, Navbar dark, content readable
- [x] `/contact` — dark theme, form inputs styled for dark
- [x] `/login`, `/register` — warm ivory, form controls light
- [x] `/players` — dark, player grid, filter panel, search
- [x] `/players/[slug]` — dark, stat cards, career history, videos, similar players
- [x] `/players/compare` — dark, radar overlay, center bars, shareable URL
- [x] `/matches` — dark, match cards
- [x] `/matches/[slug]` — dark, match detail, top performers
- [x] `/clubs` — dark, club cards
- [x] `/clubs/[slug]` — dark, club detail, squad list
- [x] `/dashboard` — dark, stat cards, watchlist, messages nav
- [x] `/dashboard/shortlist` — dark, shortlisted players
- [x] `/dashboard/messages` — dark, chat sidebar, thread, input
- [x] `/admin` — dark, dashboard cards, sidebar
- [x] `/admin/players` — dark, player list, add/edit forms
- [x] `/admin/messages` — dark, chat
- [x] `/admin/transfers` — dark, transfer cards, search
- [x] `/platform/*` — dark, all platform admin pages

**Edge cases:**
- [x] Loading states (33 loading.tsx files) — update skeleton color to `--skeleton`/`bg-card-hover`
- [x] Error boundaries — verify dark bg inheritance
- [x] Empty states — verify muted text/icons on dark
- [x] Modals/popovers — verify `bg-card` + `border-border` on dark
- [x] Dropdowns (`<select>`) — verify `color-scheme: dark` renders dark option menus
- [x] PlayerActionsMenu popover — dark styling
- [x] NotificationDropdown — dark styling

**Mobile responsive (375px):**
- [x] Landing page — stacked hero, readable gold text
- [x] Navbar mobile menu — dark drawer
- [x] Player grid — single column cards
- [x] Admin sidebar → horizontal tabs — dark bg, gold active
- [x] Chat — full-width thread on mobile
- [x] Filter panel — dark mobile sheet

**i18n verification:**
- [x] Georgian text on dark backgrounds — verify Noto Sans Georgian readability
- [x] Georgian text on warm ivory — verify readability
- [x] All gold accent text readable in both languages
- [x] Letter-spacing/line-height adjustments still correct

- [x] `npm run build`

### Session 6: QA + Documentation + Merge (~40-50k)

**Scope:** Full verification, CLAUDE.md update, merge to main

- [ ] Full Playwright walkthrough: every route, both languages, mobile + desktop
- [ ] WCAG contrast spot check:
  - Gold accent on dark bg (buttons, links, nav)
  - Gold accent on warm ivory (hero, landing CTAs)
  - Muted text on card surfaces
  - Position badges on dark cards
  - Status badges on dark surfaces
- [ ] Search for any remaining hardcoded light-theme values: `#f8fafc`, `#f1f5f9`, `#1e3a8a`, `#e2e8f0`, `#334155`
- [ ] Search for any `color-scheme: light` not inside `.landing`
- [ ] Verify PDF export still generates light-themed documents
- [ ] Update CLAUDE.md:
  - Styling System: document dark platform + warm ivory landing split
  - Primary accent: navy → Georgian gold
  - Position colors: updated -500 values
  - Add `.landing` class documentation
  - Update "Transfermarkt-style football pitch aesthetic" → "Warm dark scouting platform"
  - Document gold button contrast strategy (dark text on gold)
- [ ] `npm run build` — clean pass
- [ ] `npm run lint` — clean pass
- [ ] Merge `redesign/light-navy` → `main`

---

## Acceptance Criteria

### Functional Requirements

- [ ] Platform pages render with dark background (#141218) + gold accent (#c9a227)
- [ ] Landing page renders with warm ivory (#faf8f5) + gold accent
- [ ] Auth pages (login/register) render with warm ivory theme
- [ ] PlayerCards use position-colored left border (not top)
- [ ] PlayerCards have hover glow effect, featured players have gold glow
- [ ] Player profile shows color-coded stat indicators (green/amber/red)
- [ ] Player profile has "At a Glance" hero stats section
- [ ] Comparison view has center-growing stat bars
- [ ] Navbar is dark with gold active underline
- [ ] Sidebars are dark with gold active indicators
- [ ] Chat sent bubbles are gold with dark text
- [ ] Language toggle works on both dark and warm ivory surfaces

### Non-Functional Requirements

- [ ] All text passes WCAG AA contrast (4.5:1 normal, 3:1 large)
- [ ] Gold accent text on dark bg ≥ 4.5:1
- [ ] Position badges readable on dark cards (colored text on tinted bg)
- [ ] Status badges readable on dark surfaces
- [ ] Focus-visible indicators visible on all interactive elements
- [ ] Browser form controls render in correct color-scheme per theme
- [ ] Mobile works at 375px+ on all pages
- [ ] Loading skeletons visible on dark backgrounds
- [ ] `npm run build` + `npm run lint` pass clean

### Quality Gates

- [ ] Every route visited and verified in both languages
- [ ] No hardcoded light-theme hex values remain (except in `.landing` overrides)
- [ ] No `color-scheme: light` outside `.landing` scope
- [ ] Georgian font rendering verified on dark backgrounds
- [ ] CLAUDE.md updated with new styling documentation

---

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gold on warm ivory fails contrast for body text | High | Only use gold for large text (headings). Use darker gold `#a68521` for landing CTAs |
| Dark gold buttons look "disabled" | Medium | Test visually. If dark text on gold feels disabled, use `#8b7720` bg + white text (5.5:1) |
| `<select>` dropdowns broken on dark | Medium | `color-scheme: dark` should handle it. Test Safari specifically |
| Loading skeletons invisible on dark | Low | New `--skeleton` variable solves this |
| Chat sent bubbles with dark text feel unusual | Low | Gold + dark text is distinctive. If users dislike it, revisit with deeper gold + white text |
| Position -500 colors too bright on dark | Low | Using as text-on-dark (not bg+white), all pass contrast |
| Merge conflicts with main | Medium | Branch is 3 commits ahead. Merge main into branch before starting |

---

## Dependencies & Prerequisites

- **Old plan Session 6 was never completed** — no merge happened. The light/navy changes are only on `redesign/light-navy` branch. We're building on top of those changes.
- **Merge main into branch** before starting — ensure no conflicts with any main branch changes.
- **No database changes** — pure frontend.
- **No new npm packages** — using existing Tailwind v4 + CSS custom properties.

---

## Sources & References

### Origin

- **Brainstorm:** [docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md](docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md)
- Key decisions: dark platform + warm ivory landing, Georgian gold accent, position left borders, color-coded stats, center-growing comparison bars, 6-session timeline

### Internal References

- Theme system: `src/app/globals.css:1-65` (CSS custom properties)
- Component classes: `src/app/globals.css:70-250`
- Position constants: `src/lib/constants.ts:7-41`
- Tailwind bridge: `src/app/globals.css:28-46` (`@theme inline`)
- PlayerCard: `src/components/player/PlayerCard.tsx`
- RadarChart: `src/components/player/RadarChart.tsx`
- CompareView: `src/components/player/CompareView.tsx`
- Old light/navy plan: `docs/plans/2026-03-12-refactor-ui-redesign-light-navy-plan.md`
- Transfer page glass-morphism pattern: `docs/solutions/ui-bugs/transfer-page-premium-redesign-and-rpc-fix.md`
- Research document: `docs/ui-redesign-research.md`

### External References

- [WCAG Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [CSS color-scheme property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme)

### Learnings Applied

- CSS custom properties: never hardcode hex in components (from chat code review fixes)
- Tailwind v4 cascade layer gotcha: unlayered classes override all utilities (MEMORY)
- `color-scheme` controls browser UI chrome — must match theme (from prior plan research)
- Glass-morphism card pattern with position left border proven on transfer page (from docs/solutions)
- `100dvh` not `100vh` for mobile (from chat polish solution)
