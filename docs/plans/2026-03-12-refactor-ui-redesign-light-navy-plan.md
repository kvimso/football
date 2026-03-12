---
title: "refactor: UI redesign — light theme + navy accent"
type: refactor
status: active
date: 2026-03-12
origin: docs/brainstorms/2026-03-12-ui-redesign-brainstorm.md
---

# UI Redesign: Dark/Emerald to Light/Navy

## Enhancement Summary

**Deepened on:** 2026-03-12
**Research agents used:** 8 (best-practices, framework-docs, architecture, performance, pattern-recognition, code-simplicity, learnings, frontend-design)

### Key Improvements from Research
1. **Keep Geist Sans** — eliminates font migration, CLS risk, and ~54KB payload increase
2. **WCAG-verified position colors** — -700 variants as colored bg + white text badges (all pass AA)
3. **Simplified glass-morphism replacement** — 3 semantic rules instead of 7-row mapping table
4. **Delete decorative patterns** instead of recoloring (simpler, aligns with "remove visual noise")
5. **Drop position glow shadows** — dark-theme pattern, invisible on light backgrounds
6. **Defer email templates** — unverifiable, independent of web theme, Phase 8 scope
7. **Split PlayerCard redesign** out — feature change ≠ theme change (separate task)
8. **Add `color-scheme: light`** — forces browser chrome (scrollbars, form controls) to light mode
9. **Remove `backdrop-blur-md` from Navbar** — 95% opaque white makes blur invisible, wastes GPU
10. **Fix `bg-surface` bug** — used in PlatformSidebar but never defined
11. **Extend color shift** to ALL semantic colors (amber, purple, cyan, blue — not just yellow/green/red)
12. **Sidebars auto-adapt** — already use semantic tokens, no dark navy scoping needed
13. **Use only semantic tokens** in replacements — no `bg-slate-*` mixed with `bg-background-secondary`
14. **Restructured into 6 sessions** sized for ~80k tokens each

---

## Overview

Complete visual redesign replacing the dark/emerald theme with a light/navy design. The CSS variable system propagates changes from 11 root variables to 141+ files automatically. The remaining work is fixing ~80 hardcoded color references across ~48 component files and restyling layout components.

**Branch strategy:** Work on `redesign/light-navy` feature branch. Do not merge to `main` until Sessions 1+2 are complete (intermediate state is visually broken).

## Problem Statement

The current dark/emerald theme feels more like a gaming app than a professional scouting tool. International scouts expect clean, corporate aesthetics. The dual-theme system (dark `:root` + light `.landing`) adds maintenance overhead.

## Proposed Solution

Single light theme with navy (`#1e3a8a`) as primary accent. Incremental migration in 6 sessions. (See brainstorm: `docs/brainstorms/2026-03-12-ui-redesign-brainstorm.md`)

---

## Technical Approach

### Architecture

```
:root (CSS variables) → @theme inline (Tailwind bridge) → Utility classes (bg-accent, text-foreground, etc.)
```

Changing `:root` propagates to 141+ files using semantic classes automatically. The `@theme inline` bridge is name-dependent (not value-dependent) — as long as CSS property names stay the same, the bridge survives unchanged.

**Key constraint:** globals.css component classes are unlayered and override ALL Tailwind utilities. Update them in globals.css directly. Consider wrapping in `@layer components` during the rewrite for better Tailwind interop (optional, low-risk improvement).

### CSS Variable Palette (WCAG-verified)

**New `:root` values:**

| Variable | Old (dark) | New (light) | Contrast on white | Notes |
|---|---|---|---|---|
| `--background` | `#0a0f0d` | `#f8fafc` | — | slate-50 |
| `--background-secondary` | `#111916` | `#f1f5f9` | — | slate-100 |
| `--foreground` | `#ededed` | `#334155` | 10.35:1 AAA | slate-700 (not slate-900, less harsh) |
| `--foreground-muted` | `#9ca3af` | `#64748b` | 4.76:1 AA | slate-500 |
| `--accent` | `#10b981` | `#1e3a8a` | 10.36:1 AAA | blue-800 (navy) |
| `--accent-hover` | `#059669` | `#1e40af` | 8.6:1 AAA | blue-700 |
| `--accent-muted` | `#065f46` | `#dbeafe` | — | blue-100 (backgrounds) |
| `--border` | `#1f2937` | `#e2e8f0` | — | slate-200 |
| `--card` | `#111916` | `#ffffff` | — | white |
| `--card-hover` | `#162118` | `#f8fafc` | — | slate-50 |
| `--nav-bg` | `#080d0b` | `rgba(255,255,255,0.95)` | — | solid white nav (no blur needed) |

Also add: `color-scheme: light;` to `:root` (forces browser chrome to light mode).

**Position colors (WCAG-verified, -700 variants for colored bg + white text badges):**

| Variable | Old | New | White text contrast | Pattern |
|---|---|---|---|---|
| `--pos-gk` | `#f59e0b` | `#b45309` | 5.02:1 AA | `bg-pos-gk text-white` |
| `--pos-def` | `#3b82f6` | `#4338ca` | 7.51:1 AAA | indigo-700 (distinct from navy) |
| `--pos-mid` | `#06b6d4` | `#0e7490` | 5.36:1 AA | `bg-pos-mid text-white` |
| `--pos-att` | `#a855f7` | `#7e22ce` | 6.98:1 AAA | `bg-pos-att text-white` |
| `--pos-wng` | `#10b981` | `#047857` | 5.48:1 AA | `bg-pos-wng text-white` |
| `--pos-st` | `#ef4444` | `#b91c1c` | 6.47:1 AAA | `bg-pos-st text-white` |

### Glass-Morphism Replacement (3 Rules)

All `bg-white/[0.0x]` and `border-white/[0.0x]` patterns are invisible on white backgrounds. Replace with semantic tokens only (no `bg-slate-*` mixing):

| Dark theme pattern | Light theme replacement |
|---|---|
| Any `bg-white/[0.0x]` | `bg-background-secondary` (surfaces) or remove (subtle tints) |
| Any `border-white/[0.0x]` | `border-border` |
| `bg-[#1a2420]` | `bg-card border border-border shadow-sm` |

Also remove: `colorScheme: 'dark'` from FilterPanel, all `backdrop-blur-sm` from cards/filters (keep only on modals).

**Files:** FilterPanel.tsx (30+), TransferCard.tsx (~5), TransferSearch.tsx (~10), TransferTabs.tsx (~4), PlayerActionsMenu.tsx (~5), AISearchBar.tsx (~5), FilterPopover.tsx, MessageBubble.tsx.

### Status Badges (accessible on light bg)

Consolidate all status colors to CSS classes in globals.css. Dark text on light tinted backgrounds:

| Badge | Background | Text | Contrast |
|---|---|---|---|
| Pending | `#fef9c3` (yellow-100) | `#854d0e` (yellow-800) | 6.38:1 AAA |
| Approved | `#d1fae5` (emerald-100) | `#065f46` (emerald-800) | 6.78:1 AAA |
| Rejected | `#fee2e2` (red-100) | `#991b1b` (red-800) | 6.80:1 AAA |

### Card Shadows (light-calibrated)

| Element | Old | New |
|---|---|---|
| `.card` | `rgba(0,0,0,0.25)` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| `.card:hover` | `rgba(0,0,0,0.4)` + `translateY(-2px)` | `0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` (shadow only, no translateY) |

### Color Shift Scope (ALL semantic colors)

Not just yellow/green/red — extend to ALL -400 variants that fail WCAG on light:

| Old | New | Context |
|---|---|---|
| `text-yellow-400` | `text-yellow-700` | free agent badges, warnings |
| `text-green-400` | `text-green-700` | success, approve actions |
| `text-red-400` | `text-red-600` | errors, decline actions |
| `text-amber-400` | `text-amber-700` | warnings, caution |
| `text-purple-400` | `text-purple-700` | AI search elements |
| `text-cyan-400` | `text-cyan-700` | notifications |
| `text-blue-400` | `text-blue-700` | info, links |

**Audit each instance:** Some `-400` on colored backgrounds may be fine. Only shift those on white/light backgrounds.

### Bug Fixes (discovered during research)

- `bg-surface` and `bg-surface-alt` used in PlatformSidebar.tsx, PlatformRequestsList.tsx, RequestActions.tsx but **never defined** — replace with `bg-background-secondary` and `bg-card`
- `BLUR_DATA_URL` in constants.ts is a dark pixel — update to light gray SVG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=`

### Things NOT Changing

- **Font:** Keep Geist Sans (already loaded, good character, no migration needed)
- **PlayerCard layout:** Separate task (feature change ≠ theme change). Only fix colors in this plan.
- **Email templates:** Deferred to Phase 8 (independent of web theme, unverifiable)
- **`bg-black/60` overlays:** These are image/modal overlays — work on both themes, leave alone
- **PDF generation:** Already light-themed, no changes needed

### Sidebar Decision

The admin/dashboard/platform sidebars already use semantic tokens (`bg-background-secondary`, `border-border`, `hover:bg-background-secondary`). They will **auto-adapt** to the light theme. No dark navy scoping needed — this was over-engineering. If the auto-adapted light sidebar doesn't look good after the swap, we can revisit with scoped variables as a follow-up.

---

## Implementation Sessions (~80k tokens each)

### Session 1: Foundation (~60-70k)

**Scope:** `globals.css` full rewrite, `constants.ts`, `.landing` removal
**Branch:** Create `redesign/light-navy`

- [x] Create feature branch `redesign/light-navy`
- [x] `globals.css`: Replace all 11 `:root` variable values with light/navy palette
- [x] `globals.css`: Add `color-scheme: light` to `:root`
- [x] `globals.css`: Update 6 position color variables to -700 WCAG-verified values
- [x] `globals.css`: Remove `.landing` variable overrides entirely
- [x] `globals.css`: Remove `.landing .btn-primary` and `.landing .btn-secondary` overrides
- [x] `globals.css`: Remove `.landing` scrollbar overrides
- [x] `globals.css`: Update `.card` and `.card-enhanced` shadows (layered, lighter)
- [x] `globals.css`: Remove `.card:hover` `translateY(-2px)` (shadow-only elevation)
- [x] `globals.css`: Update `.status-badge-*` with accessible colors (dark text on tinted bg)
- [x] `globals.css`: Update `.table-row-hover` even-row to `rgba(0,0,0,0.02)`, hover to `rgba(30,58,138,0.04)`
- [x] `globals.css`: Update scrollbar colors to `rgba(148,163,184,0.3)` (slate-400)
- [x] `globals.css`: **DELETE** `.pitch-pattern` and `.hex-pattern` classes entirely
- [ ] `globals.css`: Consider wrapping component classes in `@layer components` (optional — deferred)
- [x] `constants.ts`: Replace `POSITION_GLOW_CLASSES` with simple `bg-pos-X/15 text-white border-pos-X/30` (no shadows)
- [x] `constants.ts`: Update `BLUR_DATA_URL` to light gray SVG placeholder
- [x] Remove `landing` class from `src/app/(public)/layout.tsx`
- [x] Remove `landing` class from `src/app/(auth)/layout.tsx`
- [x] Remove pitch-pattern/hex-pattern overlay `<div>`s from `LandingHero.tsx`, `Services.tsx`, `MarketStats.tsx`
- [x] `npm run build` — verify no type errors
- [x] Visual spot check: landing, players, login, admin (will look broken until Session 2)

### Session 2: Glass-Morphism + Hardcoded Dark Fixes (~60-70k)

**Scope:** 8 files with glass-morphism, 4 files with `bg-[#1a2420]`
**Must complete before merging** (Session 1 + 2 are atomic)

- [x] `FilterPanel.tsx`: Replace all `bg-white/[0.0x]` → `bg-background-secondary`, `border-white/[0.0x]` → `border-border`, remove `colorScheme: 'dark'`, remove `backdrop-blur-sm`
- [x] Fix `POSITION_GLOW_CLASSES` contrast: `bg-pos-X/15 text-white` is invisible on light bg — change to `bg-pos-X text-white` (solid bg) or `bg-pos-X/15 text-pos-X` (tinted bg + dark text)
- [x] `TransferCard.tsx`: Replace glass patterns, remove backdrop-blur
- [x] `TransferSearch.tsx`: Replace glass patterns + remove emerald rgba shadows
- [x] `TransferTabs.tsx`: Replace glass patterns
- [x] `PlayerActionsMenu.tsx`: Replace glass + `bg-[#1a2420]` → `bg-card border border-border shadow-sm`
- [x] `AISearchBar.tsx`: Replace glass + `bg-[#1a2420]` + remove purple glow shadow
- [x] `FilterPopover.tsx`: Replace border + `bg-[#1a2420]`
- [x] `MessageBubble.tsx`: `bg-white/10` → `bg-white/20` in sent messages
- [x] `TransferActions.tsx`: Remove emerald/red glow shadows
- [x] Fix `bg-surface`/`bg-surface-alt` in PlatformSidebar.tsx → `bg-background-secondary`
- [x] Fix `bg-surface-alt` in PlatformRequestsList.tsx, RequestActions.tsx → `bg-card`
- [x] Verify received chat bubbles have enough contrast (add `border border-border` if needed)
- [x] `npm run build`
- [x] Visual spot check: filters, transfers, admin actions, chat, AI search

### Session 3: Hardcoded Color Utilities (~70-80k)

**Scope:** ~48 files with hardcoded Tailwind -400 color utilities

- [x] Search and fix: `text-yellow-400` → `text-yellow-700` (7 files, 11 instances)
- [x] Search and fix: `text-green-400` → `text-green-700` (8 files, 12 instances)
- [x] Search and fix: `text-red-400` → `text-red-600` (20+ files, 35+ instances — audit each, some on colored bg may be fine)
- [x] Search and fix: `text-amber-400` → `text-amber-700` (3 instances)
- [x] Search and fix: `text-purple-400` → `text-purple-700` (5 instances)
- [x] Search and fix: `text-cyan-400` → `text-cyan-700` (2 instances)
- [x] Search and fix: `text-blue-400` → `text-blue-700` (2 instances)
- [x] Consolidate inline status badge colors (Pattern B: `bg-yellow-500/20 text-yellow-400`) to use CSS `.status-badge-*` classes (Pattern A)
- [x] Audit `text-white` instances — most are correct (on colored/navy buttons), fix any on light backgrounds
- [x] Audit `bg-green-500/10`, `bg-red-500/10` etc. — verify readability on light bg
- [x] Verify RadarChart.tsx and CompareRadarChart.tsx look correct with new `var(--accent)` and `var(--pos-def)` values
- [x] `npm run build`

### Session 4: Layout Components (~60-70k)

**Scope:** Navbar, Footer, LandingNav, LandingFooter, sidebars

- [ ] `Navbar.tsx`: Remove `backdrop-blur-md` (95% opaque = blur invisible, wastes GPU), add `border-b border-border` or `shadow-sm` instead
- [ ] `Navbar.tsx`: Verify active link indicator, notification badge, mobile menu on light bg
- [ ] `LandingNav.tsx`: Remove `backdrop-blur-md`, match Navbar visual treatment
- [ ] `Footer.tsx`: Verify light theme styling
- [ ] `LandingFooter.tsx`: Verify styling matches Footer
- [ ] `AdminSidebar.tsx`: Verify auto-adapted light styling looks good. If not, add scoped dark variables
- [ ] `DashboardNav.tsx`: Same — verify auto-adapted styling
- [ ] `PlatformSidebar.tsx`: Same — already fixed `bg-surface` bug in Session 2
- [ ] `NotificationBell.tsx`, `NotificationDropdown.tsx`, `NotificationItem.tsx`: Verify on light bg
- [ ] Navigate all route groups: `/` → `/login` → `/players` → `/dashboard` → `/admin` → `/platform`
- [ ] Check mobile at 375px for all nav patterns
- [ ] `npm run build`

### Session 5: Page-by-Page Visual Polish (~70-80k)

**Scope:** Scan all routes, fix anything that looks wrong post-migration
**Approach:** Most pages auto-update via semantic tokens. Only fix pages with remaining issues.

- [ ] Landing page: hero, stat cards, services, CTA sections
- [ ] Auth: login form, register form
- [ ] Players list: PlayerCard colors, filter chips, search bar
- [ ] Player profile: stat cards, career history, video section, compare view
- [ ] Matches: match cards, detail pages, score display
- [ ] Clubs: club cards, detail pages
- [ ] Dashboard: stat cards, watchlist, requests, notifications
- [ ] Admin: dashboard cards, player forms, announcements, scout demand, transfer pages
- [ ] Chat: sidebar, thread, input, empty state, mobile drawer
- [ ] Platform admin: all forms and lists
- [ ] Shared: about page, contact form
- [ ] `npm run build`

### Session 6: QA + Documentation (~40-50k)

**Scope:** Visual QA, CLAUDE.md, final verification

- [ ] Full Playwright walkthrough: every route, both languages (EN/KA), mobile (375px) + desktop
- [ ] WCAG contrast spot check: position badges, status badges, muted text, nav links
- [ ] Test interactive elements: dropdowns, modals, drawers, popovers, chat
- [ ] Update CLAUDE.md:
  - Styling System: remove dark/light split, document navy palette
  - Primary accent: emerald → navy
  - Position colors: updated values
  - Remove `.landing` references
  - Remove "Transfermarkt-style football pitch aesthetic" / "hrmony.com-style"
- [ ] Search for any remaining hardcoded emerald (`#10b981`, `#059669`) or dark bg (`#0a0f0d`, `#111916`)
- [ ] `npm run build` — clean pass
- [ ] `npm run lint` — clean pass
- [ ] Merge `redesign/light-navy` → `main`

---

## Acceptance Criteria

- [ ] All pages render with light background + navy accent
- [ ] No `.landing` class or dark theme variables remain
- [ ] Position badges pass WCAG AA (4.5:1) as colored bg + white text
- [ ] Status badges pass WCAG AA with dark text on tinted backgrounds
- [ ] `--foreground-muted` (`#64748b`) achieves 4.76:1 on white (AA pass)
- [ ] All text passes WCAG AA contrast (4.5:1 normal, 3:1 large)
- [ ] Sidebars (admin, dashboard, platform) look correct (auto-adapted or scoped)
- [ ] Chat sent=navy bubble, received=light gray with border
- [ ] No hardcoded emerald or dark bg colors remain
- [ ] `color-scheme: light` set on `:root`
- [ ] No `backdrop-blur` on non-modal elements
- [ ] Mobile works at 375px+ on all pages
- [ ] `npm run build` + `npm run lint` pass clean
- [ ] Georgian font rendering verified

---

## Research Insights

### Performance (from performance-oracle)
- **Net positive**: Removing `backdrop-blur` from ~6 files saves GPU composite layers (20-40MB on transfer page)
- **Remove `backdrop-blur-md` from Navbar**: 95% opaque white makes blur invisible but costs per-frame GPU computation on every scroll
- **No font migration**: Keeping Geist saves ~54KB payload and eliminates CLS risk
- **SVG pattern removal**: Eliminates 3 full-viewport paint operations on landing page
- **Card shadow change**: Lighter shadows are cheaper to render (marginal)
- **No manual font preload needed**: `next/font` auto-adds `<link rel="preload">`

### Accessibility (from best-practices-researcher)
- `--foreground-muted` (#64748b) on white: 4.76:1 — AA pass, AAA fail (acceptable for secondary text)
- `--foreground-muted` on `--background-secondary` (#f1f5f9): ~4.5:1 — borderline AA (monitor)
- Position badges as colored bg + white text all pass AA (verified ratios in palette table)
- Status badges with dark text on tinted bg all pass AAA (6.38-6.80:1)
- `#94a3b8` (slate-400) is 2.56:1 — **only** use for input placeholders, never readable content

### Framework (from framework-docs-researcher)
- `@theme inline` is correct for color bridging (resolves at compile time, auto-adapts)
- Regular `@theme` for fonts (overridable by `:lang(ka)`)
- `color-scheme: light` forces browser-rendered UI chrome to light mode (scrollbars, selects, checkboxes)
- Wrapping globals.css classes in `@layer components` makes them overridable by Tailwind utilities (recommended but optional)
- `blurDataURL`: solid-color SVG is smallest (~120 bytes base64)

### Architecture (from architecture-strategist)
- Atomic swap is correct — gradual migration not feasible with shared nav/footer components
- Sessions 1+2 must be atomic from deployment perspective (feature branch)
- `@theme inline` bridge survives unchanged (name-dependent, not value-dependent)
- `<option>` elements have limited CSS styling — test FilterPanel selects in Safari
- CSP `font-src 'self'` is fine (next/font self-hosts)

### Patterns (from pattern-recognition-specialist)
- **Never mix `bg-slate-*` with semantic tokens** — use only semantic replacements
- **Two competing status badge patterns** (CSS classes vs inline Tailwind) — consolidate to CSS classes
- **Admin sidebar already uses semantic tokens** — will auto-adapt, no dark navy needed
- **`bg-surface` never defined** — existing bug in PlatformSidebar, fix in Session 2

### Learnings Applied (from docs/solutions/)
- Glass-morphism on light: use semantic tokens, not `bg-black/[0.0x]` (from transfer-redesign solution)
- Mobile: use `100dvh` not `100vh` (from chat-polish solution)
- Accessibility: all icon buttons need `aria-label` (from chat-accessibility solution)
- Don't animate historical messages, only Realtime arrivals (from chat-accessibility solution)

---

## Follow-Up Tasks (Not in This Plan)

- **PlayerCard redesign**: Remove colored top border → left accent, star → bookmark, compact layout (separate PR)
- **Nav merge**: LandingNav + Navbar into single component with conditional features (separate PR)
- **Footer merge**: LandingFooter + Footer (separate PR, after redesign settles)
- **Email templates**: Update to light/navy palette, replace `rgba()` with solid hex for Outlook (Phase 8)
- **`@layer components` migration**: Wrap globals.css classes for better Tailwind interop (optional)
- **`font-variant-numeric: tabular-nums`**: Add to stat displays for aligned numbers (enhancement)
- **Table view toggle**: Card grid + table view for power users (feature request)

---

## Sources & References

### Origin
- **Brainstorm:** [docs/brainstorms/2026-03-12-ui-redesign-brainstorm.md](docs/brainstorms/2026-03-12-ui-redesign-brainstorm.md)
- Key decisions: light+navy palette, keep Geist font, top nav + auto-adapting sidebars, unified theme

### Internal References
- Theme system: `src/app/globals.css:1-65`
- Component classes: `src/app/globals.css:70-250`
- Position constants: `src/lib/constants.ts`
- Font setup: `src/app/layout.tsx`
- Glass-morphism heaviest: `src/components/forms/FilterPanel.tsx`

### External References
- [WCAG Color Contrast Guide](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [CSS color-scheme property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme)
- [Designing Beautiful Shadows (Josh Comeau)](https://www.joshwcomeau.com/css/designing-shadows/)
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)

### Learnings Applied
- Tailwind v4 cascade layer gotcha (MEMORY)
- `100dvh` not `100vh` for mobile (docs/solutions/chat-system-polish)
- CSP `https://` scheme for external URLs (MEMORY)
- Don't redesign UI twice — brainstorm first (docs/solutions/transfer-redesign)
