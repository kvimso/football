# UI Redesign Brainstorm

**Date:** 2026-03-12
**Status:** Ready for planning

---

## What We're Building

A complete visual redesign of the Georgian Football Platform — moving from the current dark/emerald theme to a clean, light, navy-accented professional design. The redesign targets international scouts as the primary audience and prioritizes fast data scanning, professional aesthetics, and clean information hierarchy.

This is an incremental migration — page by page, starting with the design system (globals.css, tokens) then moving through each route group.

---

## Why This Approach

- **Scouts are the primary user** — they need to evaluate talent quickly across many platforms. A clean, light UI feels familiar (like LinkedIn, Transfermarkt) and reduces cognitive load.
- **Light + navy is the professional standard** — dark themes can feel like gaming apps. Light with strategic dark accents signals credibility to business-oriented users (scouts, agents, clubs).
- **Incremental rollout** — rewriting all pages at once is risky. Migrating page-by-page lets us validate the design on simple pages before tackling complex ones.

---

## Key Decisions

### 1. Theme: Light base with navy accents
- Light backgrounds (`#f8fafc` slate-50) with white cards
- Navy (`#1e3a8a`) as primary accent for buttons, links, active states
- Dark navy (`#0f172a`) for headers and strong text

### 2. Color Palette

**Core:**
| Token | Value | Usage |
|---|---|---|
| `--primary` | `#1e3a8a` (blue-800) | Buttons, links, active states |
| `--primary-hover` | `#1e40af` (blue-700) | Hover states |
| `--primary-muted` | `#dbeafe` (blue-100) | Subtle backgrounds, badges |
| `--background` | `#f8fafc` (slate-50) | Page background |
| `--surface` | `#ffffff` | Cards, panels |
| `--foreground` | `#0f172a` (slate-900) | Primary text |
| `--foreground-secondary` | `#64748b` (slate-500) | Secondary text |
| `--foreground-muted` | `#94a3b8` (slate-400) | Hints, placeholders |
| `--border` | `#e2e8f0` (slate-200) | Borders, dividers |
| `--border-strong` | `#cbd5e1` (slate-300) | Emphasized borders |

**Status:**
| Token | Value | Usage |
|---|---|---|
| `--success` | `#16a34a` (green-600) | Approved, active |
| `--warning` | `#d97706` (amber-600) | Pending, caution |
| `--error` | `#dc2626` (red-600) | Rejected, error |

**Position colors (kept, slightly refined):**
| Position | Color | Value |
|---|---|---|
| GK | Amber | `#d97706` |
| DEF | Indigo | `#6366f1` |
| MID | Cyan | `#0891b2` |
| ATT | Purple | `#9333ea` |
| WNG | Emerald | `#059669` |
| ST | Red | `#dc2626` |

### 3. Typography: Inter
- Replace Geist Sans with Inter (keep Noto Sans Georgian for ka)
- Clean, highly readable at small sizes, excellent number rendering
- Standard for modern SaaS/data UIs

### 4. Navigation: Top navbar + admin sidebars
- **Platform pages** (`/players`, `/matches`, `/clubs`): Top navbar, full-width content
- **Admin pages** (`/admin/*`): Keep left sidebar (AdminSidebar), restyle to navy palette
- **Scout dashboard** (`/dashboard/*`): Keep left sidebar (DashboardNav), restyle to navy palette
- Sidebars make sense for admin/dashboard with many menu items; top nav for browsing pages

### 5. Player cards: Compact info card
- Photo, name, position (colored dot), age, club
- Key stats always visible (goals, assists, appearances)
- No hidden hover states — scouts see everything at a glance
- Clean separator between identity and stats
- Shortlist action: bookmark icon (replaces star) — stays on card, restyled to navy
- Remove: colored top border, multiple badge overlays, hover lift animations

### 6. Visual density: Balanced
- Clean spacing but information-rich
- Data accessible without excessive scrolling
- Whitespace used for hierarchy, not decoration

### 7. Identity: Internationally neutral
- No Georgian flag colors in the chrome
- Georgia is the content, not the branding
- Global SaaS feel — scouts from anywhere feel at home

### 8. Unified theme, variable density
- Same colors and typography on landing and platform
- Landing page: more whitespace, marketing layout
- Platform: denser, data-focused layout
- No separate light/dark themes to maintain

---

## Design Principles

1. **Data first** — every element earns its pixel. If it doesn't help a scout evaluate talent, remove it.
2. **Scan speed** — scouts should find what they need in <3 seconds on any page.
3. **Quiet confidence** — no flashy animations, gradients, or decorative patterns. Let the data speak.
4. **Consistent rhythm** — same spacing, same card patterns, same typography scale everywhere.
5. **Reduce, don't decorate** — remove visual noise (pitch patterns, hex backgrounds, glow effects) rather than adding new decoration.

---

## What Changes

### Remove
- Dark theme entirely (globals.css dark variables)
- `.landing` theme class (unified now)
- Pitch pattern and hex pattern backgrounds
- Card hover lift/glow animations
- Colored top borders on cards
- Multiple badge overlays (featured, popular, view count)
- Emerald accent color → navy
- Decorative corner arcs on landing page

### Keep
- Position colors (as small dots/pills, not big badges)
- Mobile-first responsive approach
- Filter chips pattern (restyle to navy)
- Card-based layouts for players, matches, clubs
- Stats always visible on cards
- Bilingual support and Georgian typography

### Add/Change
- Inter font
- Navy color palette
- Cleaner card design with subtle borders
- More whitespace between sections
- Consistent 4px/8px/16px/24px/32px spacing scale
- Subtle box shadows instead of border-heavy cards

---

## Migration Order (suggested)

1. **Design tokens** — Update globals.css with new palette, remove dark/landing split
2. **Typography** — Swap to Inter, adjust type scale
3. **Core components** — Buttons, inputs, cards, filter chips, badges
4. **Layout** — Navbar, Footer (both landing and platform share one now)
5. **Landing page** — Restyle with unified theme, marketing density
6. **Players list** — PlayerCard redesign, filters
7. **Player profile** — Detail page
8. **Matches & Clubs** — List and detail pages
9. **Dashboard** — Scout dashboard
10. **Admin** — Academy admin pages
11. **Auth pages** — Login, Register
12. **Chat** — Message UI

---

## Open Questions

None — all major decisions resolved through brainstorming.

---

## References

- **Wyscout** — card layouts, stat organization, professional scouting tool aesthetic
- **InStat** — clean data presentation, balanced density
- **Linear** — spacing, typography, navy palette execution
- **Inter font** — https://rsms.me/inter/
