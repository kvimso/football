# UI Redesign: Warm Dark + Georgian Gold

**Date:** 2026-03-12
**Status:** Brainstorm complete
**Branch:** `redesign/light-navy` (will be repurposed or new branch created)
**Research:** `docs/ui-redesign-research.md`

---

## What We're Building

A full visual overhaul of the Georgian Football Talent Platform, moving from the current clinical light/navy theme to a warm dark platform with Georgian gold accent. This is not a color swap — it includes card redesigns, stat presentation improvements, landing page personality, and navigation restyling.

### The Problem

The current light/navy theme (Sessions 1-5 on `redesign/light-navy`) feels like a hospital. Cool slate grays (#f8fafc, #f1f5f9) + navy accent (#1e3a8a) create a sterile, corporate feel with no personality. The previous redesign was just a color swap with no actual UX improvements.

### The Solution

- **Dark platform** with warm purple-black backgrounds (industry standard for scouting platforms)
- **Warm ivory landing page** that feels confident and inviting
- **Georgian gold accent** (#c9a227) as the sole brand color — premium, culturally resonant
- **Redesigned cards, stats, and navigation** — actual UX improvements, not just palette changes

---

## Key Decisions

### 1. Theme Split: Dark Platform + Warm Light Landing

| Surface | Color | Hex | Notes |
|---------|-------|-----|-------|
| Platform background | Warm off-black | `#141218` | Purple undertone (Spotify-like) |
| Platform secondary | Elevated surface | `#1c1a22` | Slightly lighter for sections |
| Platform card | Card surface | `#23212b` | Cards float above background |
| Platform card hover | Hover state | `#2a2834` | Subtle lift |
| Platform border | Subtle borders | `#33313d` | Low contrast, not distracting |
| Platform text | Warm off-white | `#e8e6ef` | Primary text |
| Platform muted text | Secondary text | `#9896a3` | Labels, captions |
| Landing background | Warm ivory | `#faf8f5` | NOT cool slate |
| Landing secondary | Warm stone | `#f2efe9` | Section backgrounds |
| Landing card | White | `#ffffff` | Clean cards |
| Landing border | Warm gray | `#e8e4dd` | Warm, not blue-tinted |
| Landing text | Warm near-black | `#2c2a35` | Matches platform dark |
| Auth pages (login/register) | Warm ivory | `#faf8f5` | Same as landing |

### 2. Accent System: Georgian Gold + Contextual Colors

**Brand accent (gold):**
| State | Hex | Use |
|-------|-----|-----|
| Primary | `#c9a227` | Buttons, CTAs, active nav, highlights |
| Hover | `#d4b03a` | Button hover, link hover |
| Muted | `rgba(201,162,39,0.15)` | Backgrounds, subtle highlights |

**Contextual colors (unchanged from current, but recalibrated for dark bg):**
| Purpose | Color | Use |
|---------|-------|-----|
| Success/positive stat | `#10b981` (emerald) | Above-average performance |
| Warning/average stat | `#f59e0b` (amber) | Average performance |
| Danger/poor stat | `#ef4444` (red) | Below-average, alerts |
| GK position | `#b45309` (amber-700) | Badges, borders |
| DEF position | `#4338ca` (indigo-700) | Badges, borders |
| MID position | `#0e7490` (cyan-700) | Badges, borders |
| ATT position | `#7e22ce` (violet-700) | Badges, borders |
| WNG position | `#047857` (emerald-700) | Badges, borders |
| ST position | `#b91c1c` (red-700) | Badges, borders |

**No secondary brand accent.** Gold is the sole brand color. Position colors and stat rating colors provide all the visual variety needed.

### 3. PlayerCard Redesign: Layered Depth

- **Position indicator:** Colored left border (3px), not top border
- **Photo area:** Subtle gradient background (dark to slightly lighter), silhouette centered
- **Info section:** Name, club, age, position on dark card surface
- **Stats bar:** Bottom section with key stats (Goals, Assists, Minutes)
- **Hover effect:** Shadow lifts, subtle gold glow on featured players
- **Badges:** Position pill (colored bg), view count (bottom), featured star (gold)

### 4. Stat Presentation: Radar + Color-Coded Rows

- **Radar chart:** Dark background (makes polygon colors pop), filled polygon with 20% opacity + strong border
- **Stat rows:** Horizontal progress bars behind numbers, color-coded by performance level
  - Green (#10b981) = above average
  - Amber (#f59e0b) = average
  - Red (#ef4444) = below average
- **Stat grouping:** Categories (Attacking, Defensive, Physical, Passing) with subtle headers
- **"At a Glance" hero stats:** 4-5 large numbers at top of player profile

### 5. Navigation: Dark Top Bar

- Sticky dark header matching platform background
- Logo in gold or white text
- Gold underline on active link
- Subtle border-bottom separation from content
- Same structure as current (logo | links | actions)

### 6. Landing Page: Warm & Confident

- Warm ivory background (`#faf8f5`)
- Bold headline with gold accent on key word ("Georgian")
- Dark CTA button (primary) + outlined secondary
- Real market stats front and center (37,600+ players, etc.)
- Cards with warm white backgrounds and subtle shadows
- Professional but inviting — premium agency feel, not SaaS template

### 7. Timeline: Multiple Sessions (4-6)

Full visual overhaul broken into focused sessions (~80k tokens each). Each session delivers a working intermediate state. Suggested session breakdown:

1. **Foundation** — `globals.css` palette swap, CSS custom properties, position color recalibration for dark
2. **Components** — PlayerCard redesign, card hierarchy system, button/input restyling
3. **Layout** — Navbar dark restyle, Footer, sidebars (Dashboard, Admin), responsive
4. **Stats & Data** — Color-coded stat rows, radar chart dark bg, stat grouping, comparison view
5. **Landing Page** — Hero redesign, section restyling, CTA improvements, warm ivory theme
6. **Polish & QA** — Page-by-page audit, mobile responsive check, edge cases, CLAUDE.md update

---

## Why This Approach

1. **Industry alignment:** Every major scouting platform (Wyscout, SciSports, StatsBomb) uses dark themes for their data marketplace. Dark backgrounds reduce eye strain during long sessions and make data visualizations pop.

2. **Georgian gold is distinctive:** No other scouting platform uses gold as their primary accent. It's culturally resonant (Georgian craftsmanship, wine culture warmth) and communicates premium quality.

3. **Warm purple-black over cool blue-black:** The purple undertone (#141218) feels modern and warm rather than cold and corporate. This is the key difference from a generic dark theme.

4. **Contextual color over monochrome:** Using position colors, stat rating colors, and gold as the brand accent creates a rich visual experience without adding a second brand accent.

5. **Actual UX changes:** Card redesign (layered depth with left borders, hover glow), stat presentation (color-coded progress bars), and navigation restyling ensure this FEELS different, not just looks darker.

---

## Resolved Questions

1. **Position colors for dark backgrounds:** Use brighter -500 variants on dark backgrounds for better visibility and energy. Keep -700 for warm light surfaces (landing page, auth pages). Standard dark mode practice — Tailwind recommends -400/-500 for dark surfaces.
   - GK: `#f59e0b` (amber-500), DEF: `#6366f1` (indigo-500), MID: `#06b6d4` (cyan-500), ATT: `#a855f7` (violet-500), WNG: `#10b981` (emerald-500), ST: `#ef4444` (red-500)

2. **Auth pages (login/register):** Warm ivory, matching the landing page. Scouts register before ever seeing the platform — a warm welcome is better than a dark first impression.

3. **Dashboard/Admin sidebars:** Keep sidebar navigation, restyle with dark palette. Sidebar uses `--background-secondary` (#1c1a22), content area uses `--background` (#141218). Gold accent on active item.

4. **Comparison view:** Yes — add center-growing stat bars (FotMob/SofaScore style). Green highlight on the better value, muted gray on the other. More engaging than plain numbers side-by-side.

## Open Questions

None — all design decisions resolved.

---

## What This Is NOT

- Not a font change (keeping Geist Sans + Noto Sans Georgian)
- Not a layout restructure (same route groups, same page structure)
- Not adding new features (no sparklines, micro-animations, or new data views — those are Phase 8)
- Not changing the auth system or permissions
- Not touching the chat/messaging system
