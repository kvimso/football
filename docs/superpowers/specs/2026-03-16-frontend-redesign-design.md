# Frontend Redesign — Journey-Driven, Flagship Quality

**Date:** 2026-03-16
**Author:** Andria + Claude
**Status:** Design approved, pending implementation plan
**Branch:** TBD (new branch off `redesign/light-navy`)

---

## Problem

The platform's frontend feels AI-generated — structurally generic, predictable card grids on every page, no visual personality. The previous redesign (dark + Georgian gold) improved colors but didn't change layouts or UX. Scouts need a platform that feels professional, warm, and deep — every click should reveal more value.

## Target

A flagship-quality scouting platform that sits between Eyeball (clean, modern), Wyscout (data-dense, functional), and hrmony (bold storytelling). Premium and serious, warm and physical — not cold tech.

## Target User

Scouts first. The entire UX is optimized for the scout journey: discover players, evaluate depth, compare, organize, connect with academies.

## Scout "Aha Moment"

The overall depth — profiles, career history, verified stats, video, comparison tools, all in one place for a market (Georgia) scouts couldn't access before. The platform needs to feel like an iceberg: clean surface, every click reveals more.

---

## Design Principles

### 5 Anti-Slop Rules

1. **Asymmetry over grids** — Not every section is a centered 3-column card grid. Visual rhythm comes from variation.
2. **Progressive disclosure over flat layouts** — Every page has layers. Hovering, clicking, scrolling reveals more.
3. **Data as design** — Stats are the visual centerpiece. Large type, color-coded, contextual. Numbers should *look* like something.
4. **Intentional whitespace** — Breathing room directs attention, doesn't just fill gaps.
5. **One bold move per page** — Every page has one element that breaks the pattern and makes it memorable.

---

## Color System (A3 Palette — Locked)

Light-first with dark mode toggle. All tokens defined in `globals.css`.

### Light Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FDFCFA` | Page background (warm white, NEVER pure #FFFFFF) |
| `--bg-surface` | `#F4F1EC` | Cards, panels, sidebar (warm cream) |
| `--bg-elevated` | `#EAE6DF` | Hover states, nested elements, stat chips |
| `--color-primary` | `#1B8A4A` | Primary buttons, links, active states, key stats |
| `--color-primary-hover` | `#15703C` | Hover on primary elements |
| `--color-primary-muted` | `#E3F5E9` | Subtle backgrounds behind primary elements |
| `--color-accent` | `#C8930A` | Secondary highlights, gold badges, premium indicators |
| `--color-accent-muted` | `#FDF5E0` | Subtle backgrounds behind accent elements |
| `--text-primary` | `#1A1917` | Headings, player names, key data |
| `--text-secondary` | `#4A4641` | Subheadings, descriptions |
| `--text-muted` | `#7A756F` | Labels, metadata |
| `--text-faint` | `#A39E97` | Placeholders, disabled text |
| `--border-default` | `#DDD8D2` | Card borders, dividers |
| `--border-subtle` | `#EAE6DF` | Very subtle separators |

### Dark Mode (Toggle)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#12110F` | Page background (warm black) |
| `--bg-surface` | `#1C1A17` | Cards, panels, sidebar |
| `--bg-elevated` | `#2A2623` | Hover states, nested elements |
| `--color-primary` | `#4ADE80` | Primary buttons, links, active states |
| `--color-primary-hover` | `#3CC96E` | Hover on primary elements |
| `--color-primary-muted` | `#1A2E1F` | Subtle backgrounds behind primary |
| `--color-accent` | `#FBBF24` | Secondary highlights, gold badges |
| `--color-accent-muted` | `#2D2508` | Subtle backgrounds behind accent |
| `--text-primary` | `#EEECE8` | Headings, player names, key data |
| `--text-secondary` | `#C4BFB8` | Subheadings, descriptions |
| `--text-muted` | `#9A9590` | Labels, metadata |
| `--text-faint` | `#6B6660` | Placeholders, disabled text |
| `--border-default` | `#2A2623` | Card borders, dividers |
| `--border-subtle` | `#1C1A17` | Very subtle separators |

### Semantic Colors (Both Modes)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-danger` | `#CC3333` | `#E05252` | Errors, destructive actions, red cards |
| `--color-danger-muted` | `#FDE8E8` | `#2B1717` | Danger badge backgrounds |
| `--color-warning` | `#C8930A` | `#FBBF24` | Warnings (same as accent) |
| `--color-success` | `#1B8A4A` | `#4ADE80` | Success states (same as primary) |
| `--color-info` | `#2563EB` | `#5B9CF0` | Informational, external links |
| `--color-info-muted` | `#E8F0FE` | `#172035` | Info badge backgrounds |

### Position Colors

| Position | Light | Light BG | Dark | Dark BG |
|---|---|---|---|---|
| GK | `#B87A08` | `#FDF5E0` | `#FBBF24` | `#2D2508` |
| DEF | `#2563EB` | `#E8F0FE` | `#5B9CF0` | `#172035` |
| MID | `#0E8585` | `#E0F5F5` | `#2DD4BF` | `#142D2D` |
| ATT | `#8B3FC7` | `#F3EAFC` | `#C084FC` | `#231735` |
| WNG | `#1B8A4A` | `#E3F5E9` | `#4ADE80` | `#1A2E1F` |
| ST | `#CC3333` | `#FDE8E8` | `#F87171` | `#2B1717` |

> **Note:** All 6 positions have distinct colors. MID = teal (not green like WNG), ST = red (not gold like GK).

---

## Typography

**Primary font:** Inter (via `next/font`, replaces Geist Sans)
**Georgian font:** Noto Sans Georgian (via `next/font`)

| Element | Size | Weight | Color |
|---|---|---|---|
| Page title / h1 | 24px | 600 | `--text-primary` |
| Section heading / h2 | 18px | 500 | `--text-primary` |
| Card heading / h3 | 14px | 500 | `--text-primary` |
| Body text | 14px | 400 | `--text-secondary` |
| Small label | 12px | 400 | `--text-muted` |
| Tiny metadata | 11px | 400 | `--text-faint` |
| Stat number (large) | 22px | 500 | `--text-primary` |
| Stat number (card) | 15px | 500 | `--text-primary` |

---

## Component Patterns

### Cards
```css
background: var(--bg-surface);
border: 1px solid var(--border-default);
border-radius: 8px;
padding: 14px;
```

### Primary Button
```css
background: var(--color-primary);
color: var(--btn-primary-text); /* light mode: #FDFCFA, dark mode: #12110F */
font-size: 12px;
font-weight: 500;
padding: 6px 16px;
border-radius: 6px;
```

> Add `--btn-primary-text: #FDFCFA` to `:root` and `--btn-primary-text: #12110F` to `[data-theme="dark"]`.

### Secondary / Ghost Button
```css
background: transparent;
color: var(--text-secondary);
border: 1px solid var(--border-default);
font-size: 12px;
padding: 6px 16px;
border-radius: 6px;
```

### Input Fields
```css
background: var(--bg-primary);
border: 1px solid var(--border-default);
border-radius: 8px;
padding: 10px 14px;
color: var(--text-primary);
font-size: 13px;
/* Focus: border-color: var(--color-primary) */
```

### Badges
```css
/* Primary badge */
background: var(--color-primary-muted);
color: var(--color-primary);
font-size: 10px;
padding: 2px 8px;
border-radius: 4px;

/* Accent badge */
background: var(--color-accent-muted);
color: var(--color-accent);
```

### Stat Chips
```css
background: var(--bg-elevated);
border-radius: 4px;
padding: 5px 2px;
text-align: center;
/* Number: 14px weight 500 --text-primary */
/* Label: 9px --text-faint */
```

### Player Avatars
Rounded squares: `border-radius: 6px;` — NOT circles.

---

## Spacing Scale

4px (tight) | 6px (small gap) | 8px (default) | 10px (card sections) | 12px (card grid gap) | 14px (card padding) | 16px (section gaps) | 20px (major sections) | 24px (page sections) | 32px (major page sections)

## Border Radius Scale

3px (tiny badges) | 4px (stat chips) | 5px (filter chips) | 6px (buttons, avatars) | 8px (cards, inputs) | 12px (large containers, modals)

---

## Theme Architecture

### Current → New

| Aspect | Current | New |
|--------|---------|-----|
| Default | Dark (`:root`) | Light (`:root`) |
| Alt theme | `.landing` class on route groups | `[data-theme="dark"]` on `<html>` |
| Scoping | Route-based (public = light, platform = dark) | User choice, persisted in cookie |
| Toggle | None | Sun/moon icon in navbar |
| Font | Geist Sans | Inter |

### Implementation

**ThemeProvider (`src/context/ThemeContext.tsx`):**
- `ThemeProvider` wraps the app inside root `layout.tsx` (alongside `AuthProvider` and `LanguageProvider`)
- Reads `theme` cookie server-side in root layout → passes as `initialTheme` prop to provider
- Provider exposes `useTheme()` hook: `{ theme, toggleTheme }`
- `toggleTheme()` sets `data-theme` attribute on `<html>`, updates cookie
- Root layout reads cookie and sets `data-theme` on `<html>` server-side (prevents FOUC)
- Both `:root` and `[data-theme="dark"]` set `color-scheme` property (light/dark) for native form controls and scrollbars

**CSS structure in `globals.css`:**
```css
:root {
  color-scheme: light;
  --bg-primary: #FDFCFA;
  /* ... all light tokens ... */
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg-primary: #12110F;
  /* ... all dark tokens ... */
}
```

**Font migration:**
- Replace `--font-geist-sans` variable with `--font-inter` everywhere
- Update `next/font` import in root layout: `import { Inter } from 'next/font/google'`
- Keep Noto Sans Georgian for `html:lang(ka)` override
- Update `@theme inline` block to reference new variable names

**Tailwind bridge (`@theme inline`):**
- All current Tailwind utility references (`bg-background`, `text-foreground`, etc.) must be remapped to new tokens (`bg-primary`, `text-primary`, etc.)
- This is a global find-and-replace across all components in Session 1

### Route Group Plan

Route groups persist but theme scoping is removed:

| Route Group | Current | After Redesign |
|---|---|---|
| `(public)/` | `LandingNav` + `LandingFooter` + `.landing` class | `LandingNav` + `LandingFooter` (no `.landing` class — unified theme) |
| `(auth)/` | `LandingNav` + `.landing` class | `LandingNav` (no `.landing` class) |
| `(shared)/` | `Navbar` + `Footer` | `Navbar` + `Footer` (unchanged structure) |
| `(platform)/` | `Navbar` + `Footer` + auth guard | `Navbar` + `Footer` + auth guard (unchanged structure) |
| `dashboard/` | Top-level, `DashboardNav` | Top-level, new scout sidebar layout |
| `admin/` | Top-level, `AdminSidebar` | Top-level, restyled sidebar |
| `platform/` | Top-level, platform admin layout | Top-level, restyled |

**Key:** Route groups do NOT change. Only the `.landing` class removal and component restyling within each group.

### What Gets Deleted
- Current `:root` dark palette in `globals.css`
- `.landing` class and all its overrides
- Different `color-scheme` per route group
- Geist Sans font import
- Old PlayerCard design
- Old shortlist UI (replaced by Watchlist)
- Contact request pages (deprecated by chat)
- Current dashboard layout
- Old stat presentation (flat tables)

---

## Navigation

### Authenticated (Platform)

Compact 48px top bar:
```
[GFP Logo]    Players  Matches  Clubs    [Messages (●)] [Theme toggle] [Avatar dropdown]
```

- Theme toggle: sun/moon icon, persists in cookie
- Unread messages: green dot indicator
- Avatar dropdown: profile, watchlist, settings, logout
- Dashboard is default post-login landing page

### Scout Sidebar (Dashboard/Watchlist/Messages)

Slim 200px left sidebar:
```
Dashboard
Watchlist (12)
Messages  ●
───────────
Compare
Settings
```

### Landing Page (Unauthenticated)

Minimal nav:
```
[GFP Logo]    For Scouts   For Academies   About    [Login]  [Get Started →]
```

---

## The Scout Journey — 6 Key Moments

### Moment 1: First Impression (Landing Page)

**Goal:** "This is serious, professional, and gives me access to a market I can't reach elsewhere."

- **Hero:** Full-width split — bold headline with green-highlighted word left, large angled photo/video right. Asymmetric. Right side bleeds edge-to-edge (the bold move).
- **Social proof bar:** "37,600+ registered youth players | 200+ academies | Camera-verified stats" — large numbers, small labels.
- **How it works:** 3 steps as horizontal timeline with connecting lines, not 3 cards.
- **For Scouts / For Academies:** Side-by-side panels, one cream, one elevated.
- **Partners:** Pixellot/Starlive logos with one-liner.
- **CTA footer:** Dark section with bold "Start Scouting" — visual contrast anchors the page.

### Moment 2: Discovery (Player Browse + AI Search)

**Goal:** "I can find exactly who I need — by name, by description, or by browsing."

- **AI Search bar:** Natural language input at top — "left-footed midfielder under 19 from Tbilisi." Parses to filter tags below. Search history dropdown (last 4).
- **Filter bar:** Sticky top, horizontal chip-style filters (position, age, club, region). Active filters show as green pills.
- **View toggle:** Grid (cards) and List (compact table rows, 40px height, sortable columns).
- **Grid cards:** Compact — rounded square photo, name, position badge, age, club, 3 stat chips. No excess whitespace.
- **Featured player banner:** One player highlighted at top — "Trending this week." Rotates. (The bold move.)

### Moment 3: Deep Dive (Player Profile + Video Embeds)

**Goal:** "Every scroll reveals another layer. I don't want to leave this page."

The flagship page.

- **Hero:** Large player photo (left-aligned, bleeds to edge), name/position/age/club. 4 key stats as oversized numerals (32-40px) with count-up animation on first view. (The bold move.)
- **Sticky sub-nav:** Overview | Stats | Matches | History | Videos. Green highlight on current section.
- **Stats section:** Radar chart + stat groups (Attacking, Defending, Physical, Passing). Color-coded progress bars (green above avg, gold avg, muted below). "Verified by Pixellot" badge.
- **Season stats:** Horizontal scrollable cards per season showing progression.
- **Match appearances:** Compact list with date, opponent, rating, event icons. Click expands.
- **Career history:** Vertical timeline with club badges.
- **Videos:** Embedded video section — full match link + individual player clips (goal, assist, tackle) from Starlive URLs.
- **Similar players:** 3-4 cards at bottom for cross-discovery.

### Moment 4: Evaluation (Comparison Tool)

**Goal:** "I can see exactly how two players differ in 10 seconds."

- **Split screen:** Two player columns, stats in center.
- **Center-growing bars:** Grow from center outward. Green for leader, muted for other.
- **Radar overlay:** Both players on one chart, green + gold fills with transparency.
- **Quick verdict:** "Player A leads in 7/12 stats" at top.
- **Stat diffs:** "+3.2" in green or "-1.4" in muted beside each bar. (The bold move.)
- **Shareable URLs:** `/compare/player-a-vs-player-b` with social meta tags.

### Moment 5: Workspace (Dashboard + Watchlist)

**Goal:** "This feels like MY space."

- **Welcome header:** "Welcome back, [name]" with last login.
- **Activity feed (60%):** Recent profile views, watchlist player updates, new messages. Compact cards with timestamps. (The bold move — makes platform feel alive.)
- **Watchlist panel (40%):** Folders, tags, notes per player. Each entry: photo, name, note, position badge. Quick compare button.
- **Stat summary:** "12 players watched | 3 messages pending | 47 profiles viewed this week."

#### Watchlist UI Detail

**Folder navigation:** Horizontal tab bar above the watchlist — "All (12) | Midfielders (5) | U-17 Targets (3) | + New Folder". Active folder has green underline. Folders are user-created, named freely.

**Player entries:** Compact rows (not cards). Photo (32px rounded square) | Name + Position badge | Age | Private note (truncated, 1 line) | Actions (compare, remove). No drag-to-reorder (avoids library dependency) — use "Move to folder" action in dropdown instead.

**Tags:** Small colored pills below player name. User creates tags freely (e.g. "Left foot", "Fast", "Watch again"). Tags rendered inline. Managed via a simple text input + Enter to create.

**Add to watchlist:** "Add to Watchlist" button on player cards and profile pages opens a small popover: select folder (or "No folder") + optional note + optional tags. Not a full modal.

#### Activity Feed Data Model

Activity feed is **assembled from existing tables at query time** — no separate activity/events table needed:

| Activity Type | Data Source | Display |
|---|---|---|
| Profile views | `player_views` table (scout's own views) | "You viewed [Player Name]" + timestamp |
| Watchlist additions | `watchlist` table (`created_at`) | "You added [Player] to [Folder]" |
| New messages | `messages` table (unread) | "[Academy Name] sent a message" |
| Player updates | `players` table (`updated_at` for watched players) | "[Player] profile updated" |

**Query:** Single server component queries these 4 tables, merges by timestamp, takes latest 20. No real-time subscription needed — refreshes on page load.

This avoids creating a new table and keeps the feed simple. If it needs to scale later, a materialized `activity_feed` table can be added.

### Moment 6: Connection (Messages)

**Goal:** "Professional, fast, get the deal moving."

- Keep split-pane layout (already well-built from Phase 6.5)
- Upgrade to A3 palette — green-tinted sent bubbles, cream received bubbles
- Player reference cards use new compact style
- Unread indicator: green dot
- Minimal changes — polish, don't redesign

---

## Secondary Pages (Adopt A3, No Custom Design)

These pages get the new palette and component styles but no layout redesign:

- **About (`/about`):** Restyle with A3 tokens. Keep existing layout. Session 2 (alongside nav/layout shell).
- **Contact (`/contact`):** Restyle form inputs and buttons to A3. Session 2.
- **Matches listing (`/matches`):** Restyle match cards with A3 surface/border tokens. Session 9.
- **Match detail (`/matches/[slug]`):** Restyle stat tables, add video embed section for Starlive links. Session 9.
- **Clubs listing (`/clubs`):** Restyle club cards. Session 9.
- **Club detail (`/clubs/[slug]`):** Restyle squad list and club info. Session 9.

---

## Admin Pages

Inherit A3 patterns, no custom design work:

- **Academy Admin:** Same sidebar pattern as scout. Player forms use A3 input styles. Video URL input fields for match management.
- **Platform Admin:** Full-width data tables, sortable columns, green action buttons.
- Functional and consistent, not flashy.

---

## Mobile Strategy

Built into every session, not a separate pass:

- **Nav:** Hamburger → full-screen overlay (dark background regardless of theme)
- **Player cards:** Single column, 44px minimum touch targets
- **Player profile:** Stacks vertically — photo on top, stats below. Sub-nav becomes horizontal scroll.
- **Comparison:** Stacks vertically below 768px — Player A then Player B with diff indicators
- **Dashboard:** Sidebar collapses to bottom tab bar (Home | Watchlist | Messages)

---

## Animation Language

Minimal and intentional — Eyeball-level restraint:

- **Page enter:** Content fades up (200ms, staggered 50ms per element)
- **Cards:** Subtle scale on hover (1.02x)
- **Stats:** Numbers count up on first view (intersection observer)
- **Scroll:** Parallax-lite on hero sections only (no scroll hijack)
- **Navigation:** Smooth route transitions

No bounce animations. No flashy entrances.

---

## Integrated Session Plan (10 Sessions)

| Session | Focus | Ships |
|---------|-------|-------|
| **1** | Foundation | `globals.css` A3 palette, Inter font, `[data-theme="dark"]` toggle, theme provider, delete old theme system |
| **2** | Navigation + Layout Shell | Compact 48px navbar, landing nav, scout sidebar, footer in A3. Restyle About + Contact pages. |
| **3** | Landing Page | Asymmetric hero, social proof bar, timeline how-it-works, scout/academy panels, copy refresh, dark CTA footer |
| **4** | Player Browse | Card redesign (compact, stat chips, rounded square photos), list view with sortable columns, horizontal filter chips, grid/list toggle, featured player banner |
| **5** | Player Browse + AI Search Restyle | Restyle existing `AISearchBar` + `AIFilterTags` to A3 palette, integrate with new browse layout, search history dropdown styling, loading/error states |
| **6** | Player Profile + Video Embeds | Hero stats, sticky sub-nav, color-coded bars, radar, career timeline, video sections, similar players |
| **7** | Comparison + Data Viz | Center-growing bars, radar overlay, stat diffs, shareable URLs |
| **8** | Dashboard + Watchlist | Activity feed, watchlist with folders/tags, notifications foundation |
| **9** | Messages + Admin + Secondary Pages | Chat in A3, admin video URL inputs, academy/platform admin pages, Matches/Clubs pages restyled |
| **10** | Animations + Mobile + QA + Merge | Fade-ins, count-up stats, hover effects, Playwright walkthrough both themes, merge to main |

### Per-Session Rules
- Every session ends with `npm run build` passing
- Both light and dark mode tested before commit
- Mobile checked at 375px
- Both languages (en/ka) verified
- Both themes visually verified via Playwright

### Post-Redesign Feature Sessions
After merge, remaining features ship as separate sessions:
- Unified Watchlist enhancements (Sessions 11-12)
- Notification system (Session 13)
- Scouting Report Builder (Sessions 14-15)
- Scout Demand Signals (Session 16)
- Academy Announcements (Session 17)
- Watchlist match calendar (Session 18)

---

## CLAUDE.md Updates Required

Before starting Session 1, update CLAUDE.md:

1. Replace styling section with A3 design system reference
2. Add `@anthropic-ai/sdk` to key libraries
3. Add `ANTHROPIC_API_KEY` to environment variables
4. Add new tables: `ai_search_history`, `watchlist`, `watchlist_folders`, `watchlist_folder_players`, `watchlist_tags`, `notifications`
5. Add API routes: `/api/players/ai-search`, `/api/players/ai-search/history`
6. Remove "Do not build AI-powered scouting recommendations" from critical rules
7. Add camera note: "Video links manual from admin, stats automated via API"
8. Rename Shortlist references to Watchlist throughout
