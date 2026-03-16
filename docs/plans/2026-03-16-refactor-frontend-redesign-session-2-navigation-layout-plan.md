---
title: "refactor: Frontend Redesign Session 2 — Navigation + Layout Shell"
type: refactor
status: completed
date: 2026-03-16
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-16
---

# Frontend Redesign Session 2 — Navigation + Layout Shell

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** Architecture Strategist, TypeScript Reviewer, Frontend Races Reviewer, Performance Oracle, Security Sentinel, Code Simplicity Reviewer, Pattern Recognition Specialist, Spec Flow Analyzer, Learnings Researcher, Repo Research Analyst

### Key Improvements from Research

1. **BUG: About/Contact links vanish on `/about` and `/contact` pages** — Navbar is shared across `(shared)` and `(platform)` layouts. Removing About/Contact unconditionally means they disappear from the very pages they link to. Fix: add `showInfoLinks` prop to Navbar.
2. **Extract `useClickOutside` hook** — 7 components already copy-paste the same mousedown/contains/cleanup pattern. AvatarDropdown would be the 8th. Extract to `src/hooks/useClickOutside.ts`.
3. **Dropdown mutual exclusion** — NotificationBell and AvatarDropdown can both be open simultaneously. Need a lightweight dropdown manager (module-level, 10 lines).
4. **YAGNI: Defer ScoutSidebar to Session 8** — DashboardNav (84 lines) works fine. Replacing it with a 162-line sidebar changes dashboard layout (Session 8's scope) and introduces dual unread subscriptions.
5. **YAGNI: Defer "For Scouts"/"For Academies" links to Session 3** — landing page section IDs don't exist yet. Dead anchor links with `/about` fallback create confusion.
6. **Keep LanguageToggle visible in navbar** — hiding it behind avatar dropdown is a 2-click regression for Georgian academy admins who switch languages frequently.
7. **Confirm GFT vs GFP brand name** — CLAUDE.md says "Georgian Football Talent" (GFT), Footer email is `info@gft.ge`. The spec says "GFP Logo" — this may be a spec error.
8. **Use `--navbar-height` CSS custom property** — eliminates fragile `calc(100vh-Xrem)` and `sticky top-*` values that break when navbar height changes.
9. **Dynamic ThemeToggle aria-labels** — "Switch to light mode" / "Switch to dark mode" instead of static label.
10. **ThemeToggle missing from LandingNav** — anonymous users cannot toggle theme. Spec says "User choice, persisted in cookie" for all users. Add ThemeToggle to LandingNav too.
11. **Mobile hamburger menu needs explicit structure** — after changes, 8+ items need grouping with separators (Platform links, Your Space links, Settings).
12. **Dashboard home access via logo must be explicit** — Dashboard link replaced by Messages; logo becomes primary Dashboard entry point. Add tooltip/aria-label.

### Scope Adjustments from Research

| Original Plan Item | Decision | Reason |
|---|---|---|
| ScoutSidebar replacing DashboardNav | **Defer to Session 8** | Dashboard layout redesign belongs with dashboard content redesign |
| "For Scouts"/"For Academies" anchor links | **Defer to Session 3** | Target section IDs don't exist until landing page redesign |
| Compare + Settings in sidebar | **Removed** | Compare is a platform page; Settings doesn't exist |
| LanguageToggle in AvatarDropdown | **Keep visible in navbar** | UX regression for bilingual users |
| Logo rename GFT→GFP | **Flag for Andria** | Needs brand confirmation before implementation |

---

## Overview

Redesign navigation components and layout shells to match the A3 design spec: compact 48px navbar with theme toggle + avatar dropdown, landing nav update, footer polish, and restyle About + Contact pages. This is Session 2 of 10 — navigation infrastructure only, no page content redesign.

**Branch:** Continue on `redesign/light-navy`

**Prerequisite:** Session 1 complete (A3 palette in globals.css, ThemeProvider, Inter font, `.landing` class deleted).

## Problem Statement / Motivation

The current navigation was designed for a dark-first platform with a functional-but-plain aesthetic. The spec calls for a compact, professional navbar with theme toggle and avatar dropdown. About and Contact pages need A3 typography scale and the new `--foreground-secondary` / `--foreground-faint` tokens deferred from Session 1.

## Proposed Solution

### 1. New Tokens (Deferred from Session 1)

Add to `globals.css`:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--foreground-secondary` | `#4A4641` | `#C4BFB8` | Body text, descriptions, subheadings |
| `--foreground-faint` | `#A39E97` | `#6B6660` | Placeholders, tiny metadata, disabled text |

Add to `@theme inline`:
```css
--color-foreground-secondary: var(--foreground-secondary);
--color-foreground-faint: var(--foreground-faint);
```

Also add `--navbar-height` CSS custom property:
```css
:root {
  --navbar-height: 48px;
}
```

> **Research insight (Architecture Strategist, Frontend Races):** A CSS custom property for navbar height eliminates fragile hardcoded `calc(100vh-4rem)` and `sticky top-24` values. Reference it everywhere: `top: calc(var(--navbar-height) + 2rem)`, `min-h: calc(100dvh - var(--navbar-height))`. Change it in one place if the navbar height changes again. The current `min-h-[calc(100vh-4rem)]` in dashboard layout is already wrong (4rem = 64px, but navbar is 56px). Also use `100dvh` not `100vh` per learnings — `100vh` on mobile includes address bar height.

### 2. Extract `useClickOutside` Hook

**New file:** `src/hooks/useClickOutside.ts`

```typescript
import { type RefObject, useEffect } from 'react'

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose, enabled])
}
```

> **Research insight (Pattern Recognition, TypeScript Reviewer):** 7 components already copy-paste this pattern: NotificationBell, PlayerSearchSelect, AISearchBar, PlayerActionsMenu, FilterPopover, ChatThread, plus the new AvatarDropdown. Extract now — the second consumer (AvatarDropdown) is in this very session. Refactor NotificationBell to use the hook too.

### 3. Dropdown Manager (Mutual Exclusion)

**New file:** `src/lib/dropdownManager.ts`

```typescript
let closeActiveFn: (() => void) | null = null

export function registerDropdown(closeFn: () => void) {
  if (closeActiveFn && closeActiveFn !== closeFn) {
    closeActiveFn()
  }
  closeActiveFn = closeFn
}

export function clearDropdown(closeFn: () => void) {
  if (closeActiveFn === closeFn) closeActiveFn = null
}
```

> **Research insight (Frontend Races, Architecture Strategist — CRITICAL):** Without this, both NotificationBell and AvatarDropdown can be open simultaneously. The outside-click pattern only closes on clicks *outside* — clicking the other dropdown's trigger button opens it before the first one closes. Each dropdown calls `registerDropdown(() => setOpen(false))` when opening and `clearDropdown(closeFn)` when closing. Deterministic, no event-ordering dependency.

### 4. Authenticated Navbar (Compact 48px)

**File:** `src/components/layout/Navbar.tsx`

| Aspect | Current | New |
|---|---|---|
| Height | `h-14` (56px) | `h-12` (48px) |
| Layout | 3-column grid | 3-column grid (same) |
| Logo | `GFT` green pill | Keep `GFT` (pending brand confirmation from Andria) |
| Center links | Players, Matches, Clubs, About, Contact | Conditional: platform routes show only Players/Matches/Clubs; shared routes keep About/Contact |
| Right side | LanguageToggle, NotificationBell, Dashboard link + badge, Logout button | LanguageToggle, NotificationBell, Messages link (green dot), ThemeToggle, AvatarDropdown |
| Mobile | Hamburger → slide panel | Hamburger → slide panel (same pattern, updated items) |

**Key changes:**
- **Conditional About/Contact** via `showInfoLinks` prop — `(shared)/layout.tsx` passes `true`, all other layouts pass `false` (or default)
- **Messages link** replaces Dashboard link — icon + "Messages" text + green dot if unread. Links to `/dashboard/messages` (scout), `/admin/messages` (admin)
- **Logo links to dashboard home** — the GFT logo pill already links to `dashboardHref` when authenticated. This becomes the primary way to reach Dashboard home (alongside AvatarDropdown's Dashboard link). Add `title` attribute: "Go to Dashboard"
- **Theme toggle** — `ThemeToggle` component using `useTheme()`
- **Avatar dropdown** — `AvatarDropdown` component replacing standalone logout + dashboard link
- **LanguageToggle stays visible** in navbar (not hidden in dropdown)
- **NotificationBell** stays, refactored to use `useClickOutside` hook + dropdown manager

> **Research insight (Architecture Strategist — BUG FIX):** The `(shared)` route group layout uses the same `Navbar` component for About/Contact pages. Removing About/Contact unconditionally means a user on `/about` sees a navbar with no link to their own page. The `showInfoLinks` prop keeps the decision at the layout level where it belongs.

> **Research insight (Code Simplicity):** Keep LanguageToggle in the navbar at top level, not inside AvatarDropdown. Georgian academy admins switch languages frequently — burying it behind a dropdown is a 2-click UX regression for the primary non-English audience. The toggle is small (28px) and fits alongside ThemeToggle and NotificationBell.

**Avatar dropdown component:** `src/components/layout/AvatarDropdown.tsx`
- Uses `useAuth()` for user email/role, `useLang()` for translations
- Shows first letter of email in a 28px circle, or generic user icon SVG when `email` is undefined
- Dropdown: absolute positioned, right-aligned, `bg-surface border border-border rounded-lg shadow-xl`
- Uses `useClickOutside` hook + dropdown manager for close behavior
- Role-aware links: scouts see Dashboard + Watchlist, admins see Admin Dashboard
- Logout button with loading state (disabled while logging out)
- Close on Escape key (keyboard accessibility)

> **Research insight (TypeScript Reviewer):** `AuthContext` exposes `user.email` as optional. Fall back to a generic user icon SVG when email is undefined — no need to change the AuthContext interface. The dropdown does not need `full_name` from the profiles table.

**Theme toggle component:** `src/components/layout/ThemeToggle.tsx`
- Uses `useTheme()` from ThemeContext — call `toggleTheme()` directly (not `setTheme()`)
- Sun icon (light mode) / Moon icon (dark mode)
- 28px icon button, `text-foreground-muted hover:text-foreground`
- Dynamic aria-label: `t('nav.switchToLight')` / `t('nav.switchToDark')` based on current theme

> **Research insight (TypeScript Reviewer):** Dynamic aria-labels tell screen reader users what will happen ("Switch to dark mode"), not what the button is abstractly ("Toggle theme"). Two extra i18n keys, worth it.

### 5. Landing Nav Update

**File:** `src/components/landing/LandingNav.tsx`

| Aspect | Current | New |
|---|---|---|
| Height | `h-16` (64px) | `h-12` (48px, consistent with platform navbar) |
| Logo | `GFT` text | Keep `GFT` (pending brand confirmation) |
| Center links | About, Contact | About (keep existing links for now) |
| Right side | LanguageToggle, Login, Register btn | LanguageToggle, ThemeToggle, Login text, "Get Started →" primary btn |
| Auth state | Shows "Browse Players" if logged in | Shows "Browse Players" if logged in (no change) |

**Key changes:**
- Height reduced to 48px for consistency
- **ThemeToggle added** — anonymous users need theme control too (spec: "User choice, persisted in cookie")
- "Get Started →" replaces "Register" as CTA (more action-oriented)
- Contact link removed from landing nav (lives in footer)

> **Research insight (Spec Flow Analyzer):** Anonymous users visiting the landing page cannot toggle theme without this. If a user set dark mode while logged in, then logs out, they're stuck in dark mode on the landing page. The spec says theme is a user choice for all visitors.

> **Research insight (Code Simplicity — YAGNI):** "For Scouts" / "For Academies" anchor links deferred to Session 3. The landing page section IDs (`#for-scouts`, `#for-academies`) don't exist yet — linking to `/about` as fallback creates confusion. Add the audience-specific links when the sections exist.

### 6. DashboardNav — Minimal Restyle (Keep, Don't Replace)

**File:** `src/components/dashboard/DashboardNav.tsx`

Keep DashboardNav as-is with minimal changes:
- Adjust height offset if needed for 48px navbar
- Change Messages badge from red number to green dot (match new convention)
- Keep horizontal tab bar layout

> **Research insight (Code Simplicity — YAGNI):** ScoutSidebar deferred to Session 8. The current DashboardNav (84 lines) works correctly. Replacing it with a 162-line sidebar changes the dashboard layout spatial model, narrows all dashboard content by ~200px, and introduces dual unread subscriptions — all for a session that explicitly says "no dashboard content redesign." Build the sidebar when the dashboard content is being redesigned.

### 7. Admin Sidebar Restyle

**File:** `src/components/admin/AdminSidebar.tsx`

- Adjust sticky offset: `sticky top-[calc(var(--navbar-height)+2rem)]` (uses new CSS var)
- Change Messages badge from red number to green dot (consistency)
- Active state: keep existing `bg-primary/15 text-primary border-l-2 border-primary`

> **Research insight (Pattern Recognition):** AdminSidebar's Messages badge should change to green dot to match the new convention in Navbar. Currently uses the same red pill as everything else.

### 8. Platform Sidebar Restyle

**File:** `src/components/platform/PlatformSidebar.tsx`

Same as admin — adjust sticky offset using `--navbar-height` CSS var. Add `border-l-2 border-primary` to active state for consistency with AdminSidebar.

### 9. Footer Restyle

**Files:** `src/components/layout/Footer.tsx`, `src/components/landing/LandingFooter.tsx`

Both footers already use A3 tokens from Session 1. Changes:
- Apply `text-foreground-secondary` for descriptions (currently `text-foreground-muted`)
- Apply `text-foreground-faint` for metadata/copyright
- Verify CTA strip in LandingFooter uses correct button classes

### 10. About Page Restyle

**Files:** `src/components/about/AboutContent.tsx`, `src/app/(shared)/about/page.tsx`

- Apply A3 typography scale from spec:
  - h1: `text-2xl font-semibold` (24px, 600) — currently `text-3xl font-bold`
  - h2: `text-lg font-medium` (18px, 500) — currently `text-xl font-semibold`
  - Body: `text-sm text-foreground-secondary` — currently `text-sm text-foreground-muted`
  - Labels: `text-xs text-foreground-muted`
- Cards already use `.card` class — no changes needed

### 11. Contact Page Restyle

**Files:** `src/app/(shared)/contact/page.tsx`, `src/components/contact/ContactForm.tsx`

- Typography scale adjustments (same as About)
- Per spec, inputs should use `bg-background` (page bg, not surface) with `border-border` and `focus:border-primary`
- The contact form's `bg-surface` card wrapper stays

## Technical Considerations

### Nav Link Routing (Corrected from Research)

About/Contact links are **conditionally rendered** in Navbar via `showInfoLinks` prop:
- `(shared)/layout.tsx` passes `showInfoLinks={true}` — About/Contact pages show their own links
- `(platform)/layout.tsx`, `dashboard/layout.tsx`, `admin/layout.tsx` pass `showInfoLinks={false}` (or omit — default false)
- This keeps the routing decision at the layout level, not inside the component

### Unread Messages in Navbar

The current Navbar already fetches unread count via `supabase.rpc('get_total_unread_count')` with 30s polling. The Messages link reuses this same count with a green dot indicator (not a number badge).

**Green dot vs number badge:**
- Spec says "Unread messages: green dot indicator"
- Current red number badge → change to small green dot (`h-2 w-2 rounded-full bg-primary`)
- NotificationBell keeps its red number badge (different concern)

> **Research insight (Performance Oracle, Frontend Races):** The Navbar's 30s polling and DashboardNav's Realtime subscription both call the same RPC — a pre-existing double-fetch. Extracting a shared `useUnreadCount` hook or `UnreadCountProvider` context is recommended as a follow-up (before Session 6). Not blocking for Session 2 since the pattern is already in production.

### Avatar Dropdown State

The dropdown needs:
- User's display name or email for the header
- User's role for showing role-appropriate links
- All from `useAuth()` — no additional data fetching needed

### Language Toggle in Dropdown — router.refresh() Interaction

> **Research insight (Frontend Races — IMPORTANT):** The LanguageToggle is now staying in the navbar (not moving to dropdown), so this is less critical. However, if any future design moves it into a dropdown: `router.refresh()` causes server component re-render which can unmount/remount the dropdown's ref, making the next outside-click check fail. The safe pattern is: close dropdown first, then refresh via `requestAnimationFrame`.

### i18n Keys Needed

**New keys in `core.ts`:**
```typescript
nav: {
  // ... existing keys
  messages: 'Messages',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',
  myAccount: 'My Account',
  getStarted: 'Get Started',
}
```

Plus Georgian equivalents. Note: `nav.forScouts` and `nav.forAcademies` deferred to Session 3.

### Mobile Considerations

- **Navbar mobile menu structure** (explicit grouping with separators):
  ```
  Players | Matches | Clubs        ← Platform links
  ──────────────────────────────
  Dashboard | Watchlist | Messages  ← Your Space (role-aware)
  ──────────────────────────────
  🌙 Theme toggle | EN/KA          ← Settings row
  Logout                            ← Bottom, separated
  ```
- **Landing nav mobile:** Same hamburger pattern, height matches desktop, includes ThemeToggle
- **DashboardNav mobile:** No change (keeping existing horizontal tabs)
- **Avatar dropdown:** Hidden on mobile — avatar items (dashboard, logout) go in the mobile menu instead
- **44px minimum touch targets** on all interactive elements
- **Close mobile menu on viewport resize** crossing `md` breakpoint via `matchMedia` listener

> **Research insight (Spec Flow Analyzer — HIGH PRIORITY):** After Session 2 changes, the mobile hamburger menu has 8+ items. Without explicit grouping, it's an unusable flat list. The structure above groups by function: platform navigation, personal workspace (role-aware — scouts see Watchlist, admins see Players), settings, and logout. Separators (`border-t border-border`) between groups.

> **Research insight (Frontend Races):** Add a `matchMedia('(min-width: 768px)')` listener that closes the mobile menu when the viewport crosses `md`. Without this, a user who opens the menu on mobile, resizes to desktop (menu hidden by CSS but state is still `true`), then resizes back to mobile sees a stale open menu.

> **Research insight (Learnings):** Always use `100dvh` not `100vh` for full-height containers. `100vh` on mobile includes address bar height, breaking layout.

### Sticky Offset Calculation

Use the new `--navbar-height` CSS custom property everywhere:
```css
/* Sidebar sticky offset: navbar + container padding */
sticky top-[calc(var(--navbar-height)+2rem)]

/* Layout min-height: viewport minus navbar */
min-h-[calc(100dvh-var(--navbar-height))]
```

### Accessibility

> **Research insight (Learnings, Frontend Races):**
> - All icon buttons must have `aria-label` (ThemeToggle, hamburger, avatar button)
> - Navigation containers need `role="navigation"` with descriptive `aria-label`
> - Dropdowns must close on Escape key
> - Error states in async handlers must use `try/finally` to always reset loading spinners

## Acceptance Criteria

### Navbar (Authenticated)
- [x] Height is 48px (`h-12`)
- [x] `showInfoLinks` prop controls About/Contact link visibility
- [x] `(shared)` layout passes `showInfoLinks={true}`, platform/dashboard/admin pass `false`
- [x] Center shows Players, Matches, Clubs on platform pages; adds About, Contact on shared pages
- [x] Theme toggle icon (sun/moon) toggles theme via useTheme()
- [x] Theme toggle has dynamic aria-label ("Switch to dark/light mode")
- [x] Avatar dropdown opens on click, closes on outside click AND Escape key
- [x] Avatar dropdown shows: Dashboard/Admin link, Watchlist (scout only), Logout
- [x] Only one dropdown open at a time (NotificationBell or AvatarDropdown, never both)
- [x] Messages link with green dot for unread (replaces old Dashboard + red number badge)
- [x] LanguageToggle remains visible in navbar (not inside dropdown)
- [x] NotificationBell remains functional, refactored to use `useClickOutside` hook
- [x] Mobile hamburger menu updated with grouped structure (Platform / Your Space / Settings / Logout)
- [x] Mobile menu closes on viewport resize crossing `md` breakpoint
- [x] Active link indicator (green underline) still works
- [x] Logo pill links to dashboard home with `title="Go to Dashboard"` attribute

### Landing Nav
- [x] Height is 48px (`h-12`)
- [x] Links: About (no "For Scouts"/"For Academies" until Session 3)
- [x] CTA: "Get Started →" (links to /register)
- [x] Login text link present
- [x] LanguageToggle visible
- [x] ThemeToggle visible (anonymous users can toggle theme)
- [x] Mobile menu works with updated links
- [x] If already logged in, shows "Browse Players" CTA

### Shared Hooks & Utilities
- [x] `useClickOutside` hook extracted to `src/hooks/useClickOutside.ts`
- [x] NotificationBell refactored to use `useClickOutside`
- [x] AvatarDropdown uses `useClickOutside`
- [x] Dropdown manager in `src/lib/dropdownManager.ts` — mutual exclusion works
- [x] `--navbar-height: 48px` CSS custom property defined in `:root`

### New Tokens
- [x] `--foreground-secondary` defined in `:root` and `[data-theme="dark"]`
- [x] `--foreground-faint` defined in `:root` and `[data-theme="dark"]`
- [x] Both registered in `@theme inline` block
- [x] Used in About/Contact pages and footers

### DashboardNav (Minimal Restyle)
- [x] Messages badge changed from red number to green dot
- [x] Height offset correct for 48px navbar

### AdminSidebar + PlatformSidebar
- [x] Sticky offset uses `--navbar-height` CSS var
- [x] AdminSidebar Messages badge changed to green dot
- [x] PlatformSidebar active state gets `border-l-2` for consistency

### Footer
- [x] Descriptions use `text-foreground-secondary`
- [x] Copyright/metadata uses `text-foreground-faint`
- [x] Both light and dark mode correct

### About + Contact Pages
- [x] Typography matches A3 spec scale (h1: 24px/600, h2: 18px/500, body: 14px/secondary)
- [x] Contact form inputs use `bg-background` per spec
- [x] Both pages visually clean in light and dark mode

### Quality Gates
- [x] `npm run build` passes with zero errors
- [x] Light mode verified via Playwright (landing, players list, dashboard, admin, about, contact)
- [x] Dark mode verified via Playwright (same pages)
- [x] Mobile checked at 375px (navbar, landing nav, dashboard)
- [x] Both languages (en/ka) render correctly
- [x] Theme toggle from navbar works and persists
- [x] Avatar dropdown opens/closes cleanly, no z-index issues
- [x] No regression in NotificationBell, LanguageToggle functionality
- [x] Dropdown mutual exclusion verified (open one, click the other — first closes)

## Execution Order

### Step 1: Add new tokens + CSS var to globals.css
- Add `--foreground-secondary` and `--foreground-faint` to `:root` and `[data-theme="dark"]`
- Add `--color-foreground-secondary` and `--color-foreground-faint` to `@theme inline`
- Add `--navbar-height: 48px` to `:root`

### Step 2: Add i18n keys
- Add new nav keys to `translations/core.ts` (en + ka)
- Verify no duplicate keys with existing landing translations

### Step 3: Extract `useClickOutside` hook + dropdown manager
- `src/hooks/useClickOutside.ts`
- `src/lib/dropdownManager.ts`
- Refactor NotificationBell to use both

### Step 4: Create ThemeToggle component
- `src/components/layout/ThemeToggle.tsx`
- Sun/moon icon, uses `useTheme()`, dynamic aria-label

### Step 5: Create AvatarDropdown component
- `src/components/layout/AvatarDropdown.tsx`
- Avatar circle (email initial or generic icon), dropdown with role-aware links
- Logout button with loading state
- Uses `useClickOutside` + dropdown manager
- Closes on Escape key

### Step 6: Rewrite Navbar
- Add `showInfoLinks` prop (default `false`)
- Height → 48px
- Conditional About/Contact based on prop
- Add Messages link with green dot
- Add ThemeToggle + AvatarDropdown
- Keep LanguageToggle visible
- Update mobile menu (add Messages, theme toggle, close on resize)

### Step 7: Update LandingNav
- Height → 48px
- Remove Contact from center links (keep in footer)
- CTA: "Get Started →"
- Update mobile menu

### Step 8: Update layouts that use Navbar
- `(shared)/layout.tsx` — pass `showInfoLinks={true}` to Navbar
- `dashboard/layout.tsx` — update `min-h` to use `--navbar-height`, keep DashboardNav
- `admin/layout.tsx` — update `min-h` to use `--navbar-height`
- `platform/layout.tsx` (top-level) — same

### Step 9: Minor restyles
- DashboardNav: Messages badge red→green dot
- AdminSidebar: sticky offset → `--navbar-height` var, Messages badge → green dot
- PlatformSidebar: sticky offset → `--navbar-height` var, add `border-l-2` to active state
- Footer: typography tokens (`foreground-secondary`, `foreground-faint`)
- LandingFooter: same typography tokens
- AboutContent: typography scale (h1: 2xl/semibold, h2: lg/medium, body: foreground-secondary)
- ContactForm + contact page: typography + input bg-background

### Step 10: Build and verify
- `npm run build`
- Playwright screenshots: landing, players list, dashboard, admin, about, contact
- Dark mode same pages
- Mobile 375px
- Language toggle (en/ka)
- Theme toggle persistence
- Dropdown mutual exclusion test

### Step 11: Commit

## Files Modified (Summary)

| Category | Files | Changes |
|---|---|---|
| **New files** | `useClickOutside.ts`, `dropdownManager.ts`, `ThemeToggle.tsx`, `AvatarDropdown.tsx` | New hooks, utility, components |
| **Major rewrite** | `Navbar.tsx` | Height, layout, new components, showInfoLinks prop |
| **Moderate** | `LandingNav.tsx` | Height, links, CTA |
| **Minor restyle** | `DashboardNav.tsx`, `AdminSidebar.tsx`, `PlatformSidebar.tsx`, `Footer.tsx`, `LandingFooter.tsx`, `AboutContent.tsx`, `ContactForm.tsx`, `contact/page.tsx` | Token updates, badge changes, offset adjustments |
| **Refactor** | `NotificationBell.tsx` | Use `useClickOutside` hook + dropdown manager |
| **Layout updates** | `(shared)/layout.tsx`, `dashboard/layout.tsx`, `admin/layout.tsx` | Pass props, update min-h values |
| **CSS** | `globals.css` | 2 new tokens + `--navbar-height` |
| **i18n** | `translations/core.ts` | ~6 new nav keys (en + ka) |

## Dependencies & Risks

### Risks
1. **Avatar dropdown z-index conflicts** with NotificationDropdown — mitigated by dropdown manager enforcing mutual exclusion.
2. **Removing About/Contact from platform Navbar** — mitigated by `showInfoLinks` prop keeping them on `/about` and `/contact` pages.
3. **DashboardNav badge change** (red→green dot) — minimal risk, visual-only change.
4. **`--navbar-height` adoption** — must update all `sticky top-*` and `min-h-[calc(...)]` in the same commit. Grep for `top-24`, `100vh-4rem`, `100vh-3rem` before committing.

### Non-Risks (Confirmed by Research)
- **ThemeToggle** — ThemeContext and `useTheme()` already exist from Session 1
- **Token addition** — additive, cannot break existing pages
- **Security** — zero blockers (Security Sentinel: auth defense-in-depth intact, RLS on unread RPC verified, no new data exposure)
- **Performance** — no blocking issues (Performance Oracle: all acceptable, navbar re-renders are sub-millisecond)
- **Hydration** — no layout shift from height change (CSS class swap, server-rendered correctly)

## What This Session Does NOT Include

- No ScoutSidebar (deferred to Session 8 — dashboard layout redesign)
- No "For Scouts"/"For Academies" landing nav links (deferred to Session 3)
- No landing page content redesign (Session 3)
- No PlayerCard redesign (Session 4)
- No player profile redesign (Session 6)
- No dashboard content/watchlist redesign (Session 8)
- No full-screen mobile menu overlay (Session 10)
- No settings page (future feature)
- No shared `UnreadCountProvider` context (follow-up before Session 6)
- No logo rename until brand confirmed by Andria

## Sources & References

### Origin
- **Design spec:** [docs/superpowers/specs/2026-03-16-frontend-redesign-design.md](docs/superpowers/specs/2026-03-16-frontend-redesign-design.md) — Session 2 scope, Navigation section, Typography section
- **Session 1 plan:** [docs/plans/2026-03-16-refactor-frontend-redesign-session-1-foundation-plan.md](docs/plans/2026-03-16-refactor-frontend-redesign-session-1-foundation-plan.md) — deferred tokens, ThemeProvider API

### Internal References
- Current Navbar: `src/components/layout/Navbar.tsx` (257 lines)
- Current LandingNav: `src/components/landing/LandingNav.tsx` (110 lines)
- Current DashboardNav: `src/components/dashboard/DashboardNav.tsx` (84 lines)
- AdminSidebar pattern: `src/components/admin/AdminSidebar.tsx` (162 lines)
- NotificationBell (click-outside pattern): `src/components/layout/NotificationBell.tsx` (116 lines)
- ThemeContext: `src/context/ThemeContext.tsx`
- AuthContext: `src/context/AuthContext.tsx`
- About page: `src/components/about/AboutContent.tsx` (59 lines)
- Contact form: `src/components/contact/ContactForm.tsx` (113 lines)
- Translations: `src/lib/translations/core.ts`
- globals.css: `src/app/globals.css` (355 lines after Session 1)

### Institutional Learnings Applied
- **`100dvh` not `100vh`** — mobile viewport height includes address bar (`docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`)
- **Unique Realtime channel names** — prevent conflicts across nav components
- **Navbar grid layout** — `grid grid-cols-[1fr_auto_1fr]` for true center alignment (already in use)
- **Icon buttons need aria-labels** — accessibility requirement (`docs/solutions/ui-bugs/chat-session-f-polish-reliability-accessibility.md`)
- **Escape key dismissal** — all dropdowns must close on Escape

### Review Agent Findings Applied
- **Architecture Strategist:** About/Contact bug fix (`showInfoLinks` prop), `useClickOutside` extraction, `--navbar-height` CSS var, dropdown mutual exclusion
- **TypeScript Reviewer:** `useClickOutside` hook, `useUnreadCount` hook (follow-up), dynamic aria-labels, email fallback for avatar
- **Frontend Races Reviewer:** Dropdown manager, language toggle + router.refresh() interaction, mobile menu matchMedia listener, NotificationBell error handling
- **Performance Oracle:** No blocking issues, dual unread subscription is pre-existing (follow-up), zero CLS from height change
- **Security Sentinel:** Clean — zero blockers, auth defense-in-depth verified, RLS on unread RPC confirmed
- **Code Simplicity Reviewer:** Defer ScoutSidebar, defer anchor links, keep LanguageToggle visible, confirm brand name
- **Pattern Recognition:** Sidebar active state consistency, AdminSidebar badge update, 7 click-outside duplications, logo consistency
