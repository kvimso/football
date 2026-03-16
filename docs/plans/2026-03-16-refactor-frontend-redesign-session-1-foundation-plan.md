---
title: "refactor: Frontend Redesign Session 1 — Foundation (A3 Palette, Inter Font, Theme Toggle)"
type: refactor
status: active
date: 2026-03-16
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-16
---

# Frontend Redesign Session 1 — Foundation

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** Architecture Strategist, TypeScript Reviewer, Frontend Races Reviewer, Performance Oracle, Security Sentinel, Code Simplicity Reviewer, Pattern Recognition Specialist, Learnings Researcher, Tailwind CSS v4 docs, Next.js v16.1.6 docs

### Key Improvements from Research
1. **Missing `@custom-variant dark`** — Tailwind v4 requires explicit dark mode variant declaration for `[data-theme="dark"]` selector support
2. **Stale closure bug in `toggleTheme()`** — must read current theme from DOM, not React state closure
3. **Cookie `Secure` flag must be added** — browsers exempt localhost; plan's "breaks localhost" claim was incorrect
4. **YAGNI: defer 6 premature tokens** — `--foreground-secondary`, `--foreground-faint`, `--gold`, `--gold-muted`, `--warning`, `--info` not needed in Session 1
5. **`POSITION_GLOW_CLASSES` contrast failure** — `text-white` on light-mode position colors fails WCAG AA
6. **Glass-morphism patterns need manual exclusion** — `bg-white/[0.0x]` patterns in TransferCard must not be auto-replaced
7. **`filter-chip.active` must use `--btn-primary-text`** — not `--background` (which is now warm white, not dark)

### New Considerations Discovered
- `--border-subtle` and `--elevated` share identical light values (#EAE6DF) — intentional but must be documented
- `bg-card` + `bg-background-secondary` merge into `bg-surface` may flatten visual layering — verify via Playwright
- Expose `setTheme(theme: Theme)` alongside `toggleTheme()` for forward compatibility
- Add `suppressHydrationWarning` to `<html>` as safety net

---

## Overview

Replace the current dark-first theme system with the A3 design system: light-default palette, Inter font, `[data-theme="dark"]` toggle with ThemeProvider, and delete the `.landing` class-based dual-theme architecture. This is Session 1 of 10 — infrastructure only, no layout or component redesign.

**Branch:** New branch off `redesign/light-navy` (or continue on it)

**Key constraint:** The app must build and remain visually functional throughout the migration. No intermediate state where half the tokens are old and half are new.

## Problem Statement / Motivation

The current theme system uses `:root` as dark default with a `.landing` class override for light pages. This was designed for a dark-first platform, but the new A3 design spec flips to light-first with an optional dark mode toggle. The `.landing` class approach doesn't support user-controlled theme switching, and the token names/values need to match the new A3 palette (see brainstorm: `docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md` for the journey that led here, and `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` for the approved design).

## Proposed Solution

A single atomic migration that:
1. Rewrites `globals.css` with new `:root` (light) + `[data-theme="dark"]` tokens
2. Adds `@custom-variant dark` for Tailwind v4 dark mode support
3. Swaps Geist Sans → Inter in root layout
4. Creates `ThemeContext.tsx` (cookie-persisted, FOUC-safe)
5. Deletes the `.landing` class system
6. Runs targeted find-and-replace for renamed Tailwind utilities

## Technical Considerations

### Token Naming Strategy (Confirmed)

**Principle:** Keep familiar utility names where possible, rename only what semantically changed. Minimizes code churn (~400 replacements instead of ~1,193).

#### CSS Variable Mapping

| Old CSS Var | New CSS Var | Light Value | Dark Value |
|---|---|---|---|
| `--background` | `--background` | `#FDFCFA` | `#12110F` |
| `--background-secondary` | `--surface` | `#F4F1EC` | `#1C1A17` |
| `--card` | `--surface` | `#F4F1EC` | `#1C1A17` |
| `--card-hover` | `--elevated` | `#EAE6DF` | `#2A2623` |
| `--foreground` | `--foreground` | `#1A1917` | `#EEECE8` |
| `--foreground-muted` | `--foreground-muted` | `#7A756F` | `#9A9590` |
| `--accent` | `--primary` | `#1B8A4A` | `#4ADE80` |
| `--accent-hover` | `--primary-hover` | `#15703C` | `#3CC96E` |
| `--accent-muted` | `--primary-muted` | `#E3F5E9` | `#1A2E1F` |
| `--border` | `--border` | `#DDD8D2` | `#2A2623` |
| *(new)* | `--border-subtle` | `#EAE6DF` | `#1C1A17` |
| `--nav-bg` | `--nav-bg` | `rgba(253,252,250,0.92)` | `rgba(18,17,15,0.92)` |
| `--skeleton` | *(deleted — use `--elevated`)* | — | — |
| *(new)* | `--btn-primary-text` | `#FDFCFA` | `#12110F` |
| *(new)* | `--danger` | `#CC3333` | `#E05252` |
| *(new)* | `--danger-muted` | `#FDE8E8` | `#2B1717` |

> **Deferred to later sessions (YAGNI — no Session 1 consumers):**
> - `--foreground-secondary` (#4A4641 / #C4BFB8) — add in Session 2 when component redesign begins
> - `--foreground-faint` (#A39E97 / #6B6660) — add in Session 2
> - `--gold` (#C8930A / #FBBF24) — add in Session 3 when landing page uses gold badges
> - `--gold-muted` (#FDF5E0 / #2D2508) — add in Session 3
> - `--warning` — use `--danger` value or hardcode in status-badge classes (same color as gold anyway)
> - `--info`, `--info-muted` — hardcode in status-badge classes until needed as utilities
>
> *Simplicity review: These 6 tokens save ~40 lines from globals.css with zero functional loss in Session 1.*

#### Semantic Colors (Session 1 — Minimal Set)

Only `--danger` and `--danger-muted` are registered as CSS vars + @theme inline tokens. `--success` reuses `--primary` in badge classes directly. `--warning` and `--info` are hardcoded in badge class definitions until a Session 2+ component needs them as Tailwind utilities.

#### Position Colors (New light/dark values)

| Pos | Light FG | Light BG | Dark FG | Dark BG |
|---|---|---|---|---|
| GK | `#B87A08` | `#FDF5E0` | `#FBBF24` | `#2D2508` |
| DEF | `#CC3333` | `#FDE8E8` | `#F87171` | `#2B1717` |
| MID | `#1B8A4A` | `#E3F5E9` | `#4ADE80` | `#1A2E1F` |
| ATT | `#8B3FC7` | `#F3EAFC` | `#C084FC` | `#231735` |
| WNG | `#0E8585` | `#E0F5F5` | `#2DD4BF` | `#142D2D` |
| ST | `#2563EB` | `#E8F0FE` | `#5B9CF0` | `#172035` |

Position CSS vars: `--pos-gk`, `--pos-gk-bg`, `--pos-def`, `--pos-def-bg`, etc. (12 vars total, each with light/dark values). The `bg-pos-gk/20` opacity pattern is replaced by explicit `bg-pos-gk-bg` tokens.

> **Research insight (Performance Oracle):** Explicit bg tokens are better than opacity for dual-theme — `bg-pos-gk/20` applies 20% opacity to the foreground color against whatever background is behind it, producing different visual results on light vs dark surfaces. Explicit tokens give full control per theme. The cost is 6 extra CSS variable declarations per theme block — completely negligible.

#### Tailwind Utility Find-and-Replace

| Old Utility | New Utility | Est. Count |
|---|---|---|
| `bg-background-secondary` | `bg-surface` | ~40 |
| `bg-card` (standalone, not `bg-card-hover`) | `bg-surface` | ~100 |
| `bg-card-hover` | `bg-elevated` | ~80 |
| `bg-accent` | `bg-primary` | ~30 |
| `text-accent` | `text-primary` | ~40 |
| `border-accent` | `border-primary` | ~30 |
| `bg-accent-hover` | `bg-primary-hover` | ~10 |
| `bg-accent-muted` | `bg-primary-muted` | ~15 |
| `text-accent-hover` | `text-primary-hover` | ~5 |
| `bg-skeleton` | `bg-elevated` | 0 (registered but unused) |
| **Total** | | **~350** |

**Unchanged utilities** (same name, new values — no code changes needed):
`bg-background`, `text-foreground`, `text-foreground-muted`, `border-border`, `bg-nav-bg`, all `fill-foreground*`

> **Research insight (Pattern Recognition):** The `bg-card` + `bg-background-secondary` → `bg-surface` merge collapses two previously distinct visual levels into one. Components that used both for depth layering (e.g., a `bg-background-secondary` section with `bg-card` cards inside it) will now show flat same-colored surfaces. Add to the Playwright verification checklist: check any page that nests cards inside sections.

#### @theme inline Block (New)

```css
@import "tailwindcss";

/* Enable dark: prefix with data-theme attribute */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-elevated: var(--elevated);
  --color-foreground: var(--foreground);
  --color-foreground-muted: var(--foreground-muted);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-muted: var(--primary-muted);
  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-nav-bg: var(--nav-bg);
  --color-btn-primary-text: var(--btn-primary-text);
  --color-danger: var(--danger);
  --color-danger-muted: var(--danger-muted);
  --color-pos-gk: var(--pos-gk);
  --color-pos-gk-bg: var(--pos-gk-bg);
  --color-pos-def: var(--pos-def);
  --color-pos-def-bg: var(--pos-def-bg);
  --color-pos-mid: var(--pos-mid);
  --color-pos-mid-bg: var(--pos-mid-bg);
  --color-pos-att: var(--pos-att);
  --color-pos-att-bg: var(--pos-att-bg);
  --color-pos-wng: var(--pos-wng);
  --color-pos-wng-bg: var(--pos-wng-bg);
  --color-pos-st: var(--pos-st);
  --color-pos-st-bg: var(--pos-st-bg);
}
```

> **Research insight (Tailwind v4 docs):** The `@custom-variant dark` declaration is REQUIRED for `dark:` prefix utilities to work with `[data-theme="dark"]`. Without it, Tailwind v4 defaults to `@media (prefers-color-scheme: dark)`. Even though Session 1 uses CSS variable-based theming (no `dark:` prefixes needed), adding this now enables Sessions 2-9 to use `dark:bg-gray-800` etc. for one-off overrides. Source: [Tailwind CSS Dark Mode docs](https://tailwindcss.com/docs/dark-mode).

### ThemeProvider Design

Follow the existing `LanguageContext.tsx` pattern:

```typescript
// src/context/ThemeContext.tsx
'use client'

import { createContext, useState, useCallback, useMemo, useContext, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function setThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax;Secure`
}

export function ThemeProvider({
  children,
  initialTheme = 'light',
}: {
  children: ReactNode
  initialTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    setThemeCookie(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    // Read from DOM, not React state — avoids stale closure bug with rapid toggles
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
```

> **Research insight (Frontend Races Reviewer — CRITICAL):** The `toggleTheme()` function MUST read the current theme from `document.documentElement.getAttribute('data-theme')`, NOT from the React state closure. If the user clicks the toggle rapidly, the React state update may not have flushed yet, causing the toggle to "bounce" — clicking twice fast would set dark → light → dark instead of dark → light. The DOM attribute is the source of truth and is updated synchronously.

> **Research insight (TypeScript Reviewer):** Expose `setTheme(theme: Theme)` alongside `toggleTheme()`. A binary toggle works for a button, but a settings page with radio buttons or future `prefers-color-scheme` support needs direct set. `toggleTheme()` is just `setTheme(current === 'dark' ? 'light' : 'dark')`. Costs nothing, avoids future interface break.

> **Research insight (Security Sentinel):** Add `Secure` flag to the cookie. The plan originally said "No Secure flag (breaks localhost)" — this is incorrect. Browsers exempt `localhost` from the Secure flag requirement (per the Secure Cookies spec, honored by Chrome/Firefox/Safari). The existing `LanguageContext.tsx` line 21 already uses `Secure`. Match it for consistency.

**FOUC prevention:** Root `layout.tsx` reads `theme` cookie server-side and sets `data-theme` on `<html>`:
```tsx
const rawTheme = cookieStore.get('theme')?.value
const theme = rawTheme === 'dark' ? 'dark' : undefined // light = no attribute (:root default)

<html lang={lang} {...(theme ? { 'data-theme': theme } : {})} suppressHydrationWarning>
```

> **Research insight (Next.js docs + next-themes):** Add `suppressHydrationWarning` to `<html>`. Even though the plan's approach minimizes hydration mismatches (server renders correct `data-theme`, client doesn't touch it on mount), edge cases exist: if a user toggles theme and then does browser back, the cached server HTML may have the old attribute while the cookie has the new value. `suppressHydrationWarning` on `<html>` is cheap insurance. Source: [next-themes](https://github.com/pacocoursey/next-themes), [Next.js discussions](https://github.com/vercel/next.js/discussions/53063).

**First visit (no cookie):** Always light. No `prefers-color-scheme` detection — deliberate product decision (spec says "Light-first with dark mode toggle").

**Hydration safety:** Server renders `<html data-theme="dark">` (or no attribute for light). ThemeProvider reads `initialTheme` prop and does NOT set the attribute in an initial useEffect. Only `setTheme()` and `toggleTheme()` touch the DOM attribute. This prevents hydration mismatches.

**Provider nesting order in `layout.tsx`:**
```tsx
<ThemeProvider initialTheme={initialTheme}>
  <LanguageProvider initialLang={lang as 'en' | 'ka'}>
    <AuthProvider initialUser={initialUser} initialRole={initialRole}>
      {children}
    </AuthProvider>
  </LanguageProvider>
</ThemeProvider>
```

> **Research insight (Architecture Strategist):** ThemeProvider should be outermost because it controls a DOM attribute that affects all children visually. None of these providers depend on each other functionally, but the nesting order communicates intent: theme wraps everything, then language, then auth.

### Font Migration

**Root layout changes:**
- Replace `import { Geist, ... }` with `import { Inter, ... }`
- `Inter({ variable: '--font-inter', subsets: ['latin'] })`
- Update body className: `${inter.variable} ${notoGeorgian.variable}`

**globals.css changes:**
- `@theme { --font-sans: var(--font-inter), var(--font-noto-georgian), ... }`
- `html:lang(ka) { --font-sans: var(--font-noto-georgian), var(--font-inter), ... }`

**CSP:** `font-src 'self'` is already correct — `next/font/google` self-hosts fonts at build time to `/_next/static/media/`. No cross-origin requests to Google's font servers at runtime.

> **Research insight (Performance Oracle):** No performance difference between Geist and Inter — both are variable fonts, similar file sizes, same subset strategy (`latin`). The Georgian font (Noto Sans Georgian) is unchanged. No mono font to drop.

### Special Cases Requiring Manual Attention

1. **`RadarChart.tsx`** — raw `var(--background-secondary)` → `var(--surface)`, `var(--accent)` → `var(--primary)`, `var(--border)` → `var(--border)` (unchanged)
2. **`CompareRadarChart.tsx`** — Read independently, do NOT assume it mirrors RadarChart. Build complete list of raw `var()` references before applying fixes.
3. **`CompareView.tsx`** lines 321/328 — JS string `'var(--foreground-muted)'` (unchanged name, no action needed)
4. **`LandingHero.tsx`** lines 82-91 — hardcoded hex inline style for dark preview card. **Keep as-is for Session 1**, update hex values to new dark mode palette. Full redesign deferred to Session 3.
5. **`constants.ts` — POSITION_COLOR_CLASSES** — update `bg-pos-gk/20` → `bg-pos-gk-bg` pattern
6. **`constants.ts` — POSITION_GLOW_CLASSES** — `text-white` on position colors fails WCAG AA contrast in light mode (e.g., `text-white` on `#B87A08` amber is ~3.5:1, needs 4.5:1). Replace `text-white` with `text-btn-primary-text` or verify these classes are only rendered on dark backgrounds and document that constraint.
7. **`BLUR_DATA_URL`** in `constants.ts` — update `fill="#23212b"` to `fill="#F4F1EC"` (light surface). Acceptable in dark mode too (brief blur).
8. **`status-badge-*`** classes in globals.css — rewrite: use `var(--danger)` / `var(--danger-muted)` for rejected/error, `var(--primary)` / `var(--primary-muted)` for approved/active, hardcode warning/pending amber directly.
9. **`table-row-hover`** class — rewrite: even rows `rgba(0,0,0,0.02)` light / `rgba(255,255,255,0.02)` dark, hover `var(--primary-muted)` or `rgba(27,138,74,0.06)` light / `rgba(74,222,128,0.06)` dark.
10. **`filter-chip.active`** — change `color: var(--background)` to `color: var(--btn-primary-text)`. Currently works because `--background` is dark on dark theme, so white text on gold. After migration, `--background` is warm white — white text on green is invisible.

> **Research insight (Learnings):** Before running find-and-replace, separately grep for `bg-white/\[` and `bg-\[#` patterns. The TransferCard glass-morphism uses `bg-white/[0.05]`, `border-white/[0.06]` etc. — these are intentional dark-surface effects that must NOT be auto-replaced. They need `dark:` scoping or conditional class logic in a later session.

### `.landing` Deletion

1. Delete `.landing { ... }` block from `globals.css` (lines 30-45)
2. Delete `.landing .btn-primary`, `.landing .btn-secondary`, `.landing scrollbar` overrides (lines 299-321)
3. Remove `landing` class from `(public)/layout.tsx` line 6
4. Remove `landing` class from `(auth)/layout.tsx` line 6
5. New button contrast: `.btn-primary { color: var(--btn-primary-text); }` — resolves the button text contrast issue documented in `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md`

### Build Safety

Globals.css rewrite + @theme inline update + utility rename MUST happen atomically. If you rewrite globals.css but don't rename utilities, Tailwind can't resolve `bg-card` (deleted) and silently renders nothing. **Do not commit between steps 1 and 6.**

Recommended: Use a script to do all find-and-replace in one pass, then immediately `npm run build` to catch any misses.

> **Research insight (Frontend Races Reviewer):** Also grep for dynamic class construction patterns before running replacements:
> ```bash
> # Find template literals that construct Tailwind classes dynamically
> grep -rn 'bg-\${' src/ --include="*.tsx"
> grep -rn 'text-\${' src/ --include="*.tsx"
> ```
> These won't be caught by the find-and-replace AND Tailwind won't generate the classes from dynamic strings.

## Acceptance Criteria

### Infrastructure
- [x] `globals.css` has new `:root` (light) + `[data-theme="dark"]` blocks with all A3 tokens — `src/app/globals.css`
- [x] `@custom-variant dark` declared for `[data-theme=dark]` selector — `src/app/globals.css`
- [x] `.landing` class and all its overrides deleted from `globals.css`
- [x] `@theme inline` block updated with new token bridge names
- [x] Old `:root` dark palette completely removed
- [x] Inter font loaded via `next/font/google` in root layout — `src/app/layout.tsx`
- [x] Geist Sans import and `--font-geist-sans` variable removed everywhere
- [x] `html:lang(ka)` font stack updated to reference `--font-inter`
- [x] `ThemeContext.tsx` created with `useTheme()` hook + `setTheme()` — `src/context/ThemeContext.tsx`
- [x] ThemeProvider outermost in root layout (ThemeProvider > LanguageProvider > AuthProvider)
- [x] Theme cookie read server-side in root layout, `data-theme` set on `<html>`
- [x] `suppressHydrationWarning` on `<html>` element
- [x] Theme cookie includes `Secure` flag (matches LanguageContext pattern)
- [x] No FOUC — server-rendered `data-theme` matches client hydration
- [x] `toggleTheme()` reads from DOM, not React state closure

### Token Migration
- [x] All `bg-background-secondary` → `bg-surface` across src/
- [x] All `bg-card` → `bg-surface` across src/ (careful: not `bg-card-hover`)
- [x] All `bg-card-hover` → `bg-elevated` across src/
- [x] All `bg-accent*` → `bg-primary*` across src/
- [x] All `text-accent*` → `text-primary*` across src/
- [x] All `border-accent*` → `border-primary*` across src/
- [x] Raw `var(--background-secondary)` → `var(--surface)` in SVG components
- [x] Raw `var(--accent)` → `var(--primary)` in SVG components
- [x] `CompareRadarChart.tsx` raw `var()` references verified independently (not assumed same as RadarChart)
- [x] Position color classes in `constants.ts` updated (`bg-pos-X/20` → `bg-pos-X-bg`)
- [x] `POSITION_GLOW_CLASSES` — `text-white` contrast verified or replaced
- [x] `BLUR_DATA_URL` constant updated with light surface color
- [x] `status-badge-*` classes rewritten with semantic color tokens
- [x] `table-row-hover` class rewritten with theme-aware colors
- [x] `filter-chip.active` uses `var(--btn-primary-text)` not `var(--background)`
- [x] `landing` class removed from `(public)/layout.tsx` and `(auth)/layout.tsx`
- [x] Glass-morphism patterns (`bg-white/[0.0x]`) manually reviewed, NOT auto-replaced
- [x] Hardcoded hex patterns (`bg-[#...]`) manually reviewed

### Quality Gates
- [x] `npm run build` passes with zero errors
- [x] Light mode visually verified (landing, login, players list, player profile) via Playwright
- [x] Dark mode visually verified (same pages) via Playwright
- [x] Verify pages with nested cards-in-sections (potential flat layering from surface merge)
- [x] Mobile checked at 375px (at least one page)
- [ ] Both languages (en/ka) render correctly with Inter + Noto Sans Georgian
- [ ] Theme toggle persists across page navigation
- [ ] First visit (no cookie) renders light mode
- [ ] Rapid theme toggle (click 5+ times fast) settles to correct final state

## Execution Order

**This order is critical — steps 1-6 must be committed together.**

### Step 0: Pre-flight checks
```bash
# Inventory dynamic class patterns (manual review needed)
grep -rn 'bg-\${' src/ --include="*.tsx"
grep -rn 'text-\${' src/ --include="*.tsx"

# Inventory glass-morphism patterns (exclude from auto-replace)
grep -rn 'bg-white/\[' src/ --include="*.tsx"

# Inventory hardcoded hex backgrounds (manual review)
grep -rn 'bg-\[#' src/ --include="*.tsx"

# Dry-run find-and-replace order validation
grep -rn "bg-card" src/ --include="*.tsx" | grep -v "bg-card-hover" | wc -l
grep -rn "bg-card-hover" src/ --include="*.tsx" | wc -l
```

### Step 1: Rewrite `globals.css`
- `@import "tailwindcss";`
- `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`
- New `:root` with light A3 palette
- New `[data-theme="dark"]` with dark A3 palette
- New `@theme inline` block with all new utility mappings
- New `@theme` block with `--font-inter` reference
- Rewrite component classes (`.btn-primary`, `.input`, `.card`, `.filter-chip`, etc.) using new token names
- `.btn-primary` and `.filter-chip.active` use `color: var(--btn-primary-text)` NOT `var(--background)`
- Rewrite `status-badge-*` with semantic tokens (hardcode warning/info colors directly)
- Rewrite `table-row-hover` with theme-aware colors
- Rewrite scrollbar colors to use new token values
- Delete `.landing` block and all `.landing *` overrides
- Update `html:lang(ka)` font stack
- Update focus-visible ring from `--accent` → `--primary`
- Add comment: `/* --border-subtle shares value with --elevated in light mode — intentional: subtle borders and elevated surfaces are the same cream */`

### Step 2: Update `src/app/layout.tsx`
- Swap `Geist` → `Inter` import
- Rename font variable to `--font-inter`
- Read `theme` cookie and set `data-theme` on `<html>`
- Add `suppressHydrationWarning` to `<html>`
- Wrap children with `ThemeProvider` (outermost: ThemeProvider > LanguageProvider > AuthProvider)

### Step 3: Create `src/context/ThemeContext.tsx`
- Full implementation per the ThemeProvider Design section above
- `ThemeProvider` with `initialTheme: Theme` prop (typed, not string)
- `useTheme()` hook co-located in same file: `{ theme, setTheme, toggleTheme }`
- Cookie with `Secure` flag: `theme=${t};path=/;max-age=31536000;SameSite=Lax;Secure`
- `toggleTheme()` reads from `document.documentElement.getAttribute('data-theme')`, NOT state
- `setTheme()` uses `setAttribute`/`removeAttribute` (not `dataset`)
- DOM attribute update on toggle/set only (not on mount)

### Step 4: Remove `.landing` class from layouts
- `src/app/(public)/layout.tsx` — remove `landing` from className
- `src/app/(auth)/layout.tsx` — remove `landing` from className

### Step 5: Global find-and-replace (Tailwind utilities)
Run across all `src/**/*.tsx` files:
```
bg-background-secondary → bg-surface
bg-card-hover → bg-elevated          (MUST run before bg-card → bg-surface)
bg-card → bg-surface                  (run AFTER bg-card-hover)
bg-accent-hover → bg-primary-hover    (MUST run before bg-accent → bg-primary)
bg-accent-muted → bg-primary-muted    (MUST run before bg-accent → bg-primary)
bg-accent → bg-primary                (run AFTER bg-accent-hover and bg-accent-muted)
text-accent-hover → text-primary-hover
text-accent → text-primary
border-accent → border-primary
bg-skeleton → bg-elevated
```

**Order matters!** Longer strings must be replaced before shorter substrings (e.g., `bg-card-hover` before `bg-card`, `bg-accent-hover` before `bg-accent`).

**EXCLUDE from automated replacement:**
- `bg-white/[` patterns (glass-morphism — manual review)
- `bg-[#` patterns (hardcoded hex — manual review)
- Files in `node_modules/` or `.next/`

### Step 6: Manual fixes
- `RadarChart.tsx` — update raw `var()` references
- `CompareRadarChart.tsx` — read file, list ALL raw `var()` references, update each
- `LandingHero.tsx` — update hardcoded hex to new dark palette values
- `constants.ts` — update POSITION_COLOR_CLASSES (`bg-pos-X/20` → `bg-pos-X-bg`)
- `constants.ts` — update POSITION_GLOW_CLASSES (`text-white` → verify contrast or scope)
- `constants.ts` — update `BLUR_DATA_URL` fill color
- Review glass-morphism patterns found in Step 0 — add TODO comments for Session 9

### Step 7: Build and verify
- `npm run build` — fix any errors
- Start dev server, Playwright screenshot light mode (landing, login, players, profile, dashboard)
- Toggle to dark, Playwright screenshot same pages
- Check nested card-in-section pages for flat layering
- Check 375px mobile on at least the players page
- Switch language to Georgian, verify font rendering
- Rapid-toggle theme 5+ times, verify final state is correct

### Step 8: Commit
- Single commit with all changes

## Files Modified (Estimated)

| Category | Files | Changes |
|---|---|---|
| **Core (manual)** | `globals.css`, `layout.tsx`, `ThemeContext.tsx` (new), `(public)/layout.tsx`, `(auth)/layout.tsx` | Full rewrite / significant edits |
| **Manual fixes** | `RadarChart.tsx`, `CompareRadarChart.tsx`, `LandingHero.tsx`, `constants.ts` | Targeted token updates |
| **Find-and-replace** | ~100-140 `.tsx` files across `src/components/` and `src/app/` | Automated utility renames |

**Heaviest files** (most utility replacements):
- `src/components/forms/FilterPanel.tsx` (~60 usages)
- `src/app/(platform)/players/[slug]/page.tsx` (~65 usages)
- `src/components/landing/LandingHero.tsx` (~25 usages)
- `src/components/dashboard/DashboardHome.tsx` (~24 usages)
- `src/components/auth/RegisterForm.tsx` (~24 usages)

## Dependencies & Risks

### Risks
1. **Silent visual breakage** — Tailwind utilities referencing deleted tokens render as transparent/nothing. `npm run build` won't catch this. Mitigation: Playwright screenshots before commit.
2. **Regex edge cases in find-and-replace** — `bg-card` could match inside `bg-card-hover` if order is wrong. Mitigation: Replace longer strings first, use word boundary matching. Dry-run in Step 0.
3. **Hardcoded colors in component inline styles** — `LandingHero.tsx` has inline hex, TransferCard has glass-morphism `bg-white/[0.0x]`. Mitigation: Grep in Step 0, manual review.
4. **Status badge contrast in light mode** — Hardcoded rgba tints designed for dark bg become invisible on light bg. Mitigation: Rewrite with semantic tokens in Step 1.
5. **`bg-card` + `bg-background-secondary` merge** — flattens visual layering. Mitigation: Playwright verification of nested card/section pages.
6. **POSITION_GLOW_CLASSES contrast** — `text-white` on light position colors fails WCAG. Mitigation: Replace or scope in Step 6.

### Non-Risks
- **CSP** — `font-src 'self'` handles Inter (self-hosted by next/font). `style-src 'unsafe-inline'` already exists for Tailwind/Next.js.
- **Hydration** — Server-set `data-theme` matches client ThemeProvider (no mismatch on mount). `suppressHydrationWarning` as safety net.
- **Cookie** — Same pattern as working lang cookie, including `Secure` flag.
- **Performance** — 40+ CSS variables in `:root` is standard (no cascade perf issue). @theme inline size is negligible. Cookie read is synchronous on `cookieStore`.

## Success Metrics

- Zero build errors after migration
- Both themes render correctly on all major pages
- No visual regressions visible in Playwright screenshots
- Theme toggle works and persists via cookie
- Rapid toggle settles correctly
- Inter font renders for English, Noto Sans Georgian for Georgian text

## What This Session Does NOT Include

- No layout changes (nav, cards, page structure stay the same)
- No component redesign (PlayerCard, comparison, dashboard — Sessions 2-9)
- No new pages or features
- No dark mode button in the UI yet (ThemeProvider is ready, toggle button ships in Session 2 with navbar redesign)
- No landing page redesign (Session 3)
- No AI search bar (Session 5)
- No animations (Session 10)
- No `--foreground-secondary`, `--foreground-faint`, `--gold`, `--gold-muted` tokens (deferred per YAGNI)

## Sources & References

### Origin
- **Design spec:** [docs/superpowers/specs/2026-03-16-frontend-redesign-design.md](docs/superpowers/specs/2026-03-16-frontend-redesign-design.md) — Session 1 scope from "Integrated Session Plan" table + Theme Architecture section + Color System section
- **Brainstorm:** [docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md](docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md) — design journey context

### Internal References
- Current theme system: `src/app/globals.css:1-76`
- Root layout (font + providers): `src/app/layout.tsx`
- LanguageContext pattern (cookie + provider): `src/context/LanguageContext.tsx`
- `.landing` class usage: `src/app/(public)/layout.tsx:6`, `src/app/(auth)/layout.tsx:6`
- SVG raw var() usage: `src/components/player/RadarChart.tsx:46-94`, `src/components/player/CompareRadarChart.tsx:82-124`
- Position color classes: `src/lib/constants.ts:7-41`
- Button contrast trap docs: `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md`
- Glass-morphism patterns: `docs/solutions/ui-bugs/transfer-page-premium-redesign-and-rpc-fix.md`

### External References
- [Tailwind CSS v4 Dark Mode](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` with `data-theme` selector
- [Tailwind CSS v4 Theming Best Practices](https://github.com/tailwindlabs/tailwindcss/discussions/18471) — `@theme inline` with CSS variables
- [Tailwind CSS v4 @theme vs @theme inline](https://github.com/tailwindlabs/tailwindcss/discussions/18560) — when to use each
- [Next.js v16 Cookies API](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/04-functions/cookies.mdx) — server-side cookie reading
- [next-themes](https://github.com/pacocoursey/next-themes) — reference for `suppressHydrationWarning` pattern
- [FOUC prevention in React/Next.js](https://notanumber.in/blog/fixing-react-dark-mode-flickering) — inline script approach

### Institutional Learnings Applied
- **Tailwind CSS v4 cascade layer gotcha** — unlayered globals.css classes override all Tailwind utilities. Plan preserves this (no `@layer` migration in this session).
- **Button contrast trap** — `.landing .btn-primary` override existed because gold-on-ivory failed contrast. New system uses `--btn-primary-text` token, eliminating the need for route-specific overrides.
- **`BLUR_DATA_URL` must match surface color** — documented in learnings, addressed in step 6.
- **Glass-morphism `bg-white/[0.0x]` bypasses variable system** — documented in transfer page solution. Must be excluded from auto-replace.
- **Root layout must stay server component** — from security audit (F6 finding). Read theme cookie in server layout, pass as prop to client ThemeProvider.

### Review Agent Findings Applied
- **Architecture Strategist:** ThemeProvider outermost, `filter-chip.active` text fix, `table-row-hover` replacement specified
- **TypeScript Reviewer:** Explicit `Theme` typing, `setTheme()` alongside `toggleTheme()`, `useTheme()` co-located
- **Frontend Races Reviewer:** Stale closure fix in `toggleTheme()`, dry-run before replace, check dynamic class patterns
- **Performance Oracle:** No concerns; position explicit bg tokens are better than opacity
- **Security Sentinel:** Add `Secure` cookie flag, cookie validation is correct
- **Code Simplicity Reviewer:** Defer 6 premature tokens (~40 LOC saved in globals.css)
- **Pattern Recognition:** `Secure` flag inconsistency, `POSITION_GLOW_CLASSES` contrast, surface merge verification
