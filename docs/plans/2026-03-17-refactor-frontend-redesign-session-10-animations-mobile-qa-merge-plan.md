---
title: "refactor: Frontend Redesign Session 10 — Animations + Mobile + QA + Merge"
type: refactor
status: completed
date: 2026-03-17
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
---

# Frontend Redesign Session 10 — Animations + Mobile + QA + Merge

## Enhancement Summary

**Deepened on:** 2026-03-17
**Sections enhanced:** 8
**Agents used:** architecture-strategist, code-simplicity-reviewer, performance-oracle, kieran-typescript-reviewer, julik-frontend-races-reviewer, pattern-recognition-specialist, security-sentinel, best-practices-researcher, learnings-researcher (animation + theme), nextjs-docs-researcher

### Key Improvements

1. **Fix SSR hydration flash in FadeInOnScroll** — start `visible = true` (SSR renders content visible), then detect below-fold elements in useEffect and hide + setup observer only for those. Above-fold content never flashes.
2. **Extract `useInView` hook** — eliminate IntersectionObserver boilerplate duplication across 3 components (FadeInOnScroll, LandingCountUp, CountUpStat). Pattern-recognition reviewer flagged this as high-severity.
3. **Use CSS `grid-template-rows: 0fr/1fr`** for mobile menu instead of `max-height` — performance oracle confirmed max-height causes layout thrashing; grid-rows is compositor-friendly.
4. **Fix naming violation** — `formatted_value` → `formattedValue` in LandingCountUp (TypeScript reviewer).
5. **Add `cancelled` flag to FadeInOnScroll** — match CountUpStat's defensive pattern for unmount safety (frontend-races reviewer).
6. **Remove dead `.animate-fade-up` CSS class** — FadeInOnScroll uses inline styles with delay support; the CSS class is never referenced (code-simplicity reviewer).
7. **Add `aria-expanded` to hamburger buttons** and Escape key close handler for mobile menu accessibility (learnings: animation patterns).
8. **Expand QA checklist with theme-specific checks** — from learnings: light-flash check, dark-on-dark card distinction, badge contrast on both themes.
9. **Wrap card hover scale in `@media (hover: hover)`** — prevents sticky hover on touch devices where `:hover` activates on tap and stays active (frontend-races reviewer).
10. **Fix skeleton animation conflict** — `animate-pulse` + `animate-skeleton-in` as two Tailwind classes overwrite each other's `animation` property. Use combined CSS rule instead (frontend-races reviewer, HIGH severity).
11. **Align LandingCountUp duration to 600ms** — design spec says "600ms ease-out cubic"; original plan had 800ms. Match CountUpStat's 600ms for consistency (architecture-strategist).

### Scope Adjustment

- **"Exit animations on mobile menu" moved from NOT-to-build to INCLUDED** — the `grid-template-rows` approach enables both entry AND exit animation with zero additional complexity (no restructuring needed beyond what was already planned).

---

## Overview

The final session of the 10-session frontend redesign. Session 10 adds the animation language defined in the design spec, verifies mobile responsiveness, runs a full QA walkthrough of both themes via Playwright, and merges the `redesign/light-navy` branch (26 commits) into `main`.

**Scope from design spec (line 476):**
> Animations + Mobile + QA + Merge — Fade-ins, count-up stats, hover effects, Playwright walkthrough both themes, merge to main

**Key constraint:** No animation libraries. All animations use CSS keyframes, Tailwind utilities, and vanilla JS (IntersectionObserver + requestAnimationFrame). This matches the existing codebase pattern.

**Existing animation infrastructure:**
- 3 custom keyframes in `globals.css`: `slide-in-down` (200ms), `chat-fade-in` (150ms), `transfer-card-in` (300ms)
- `CountUpStat.tsx` — IntersectionObserver + rAF count-up with above-fold detection, 600ms ease-out cubic
- `ProfileSubNav.tsx` — IntersectionObserver for scroll-spy
- Tailwind `animate-pulse` (skeletons), `animate-spin` (spinners), `transition-colors` (pervasive)
- `.card` class with bg-color + box-shadow hover transition (no transform)

---

## Animation Language (from design spec lines 449-459)

| Animation | Timing | Target |
|-----------|--------|--------|
| Page enter: content fades up | 200ms, staggered 50ms/element | Below-the-fold sections |
| Cards: subtle scale on hover | 1.02x | Interactive cards (links/buttons) |
| Stats: numbers count up | 600ms ease-out cubic | First view via IntersectionObserver |
| Parallax-lite on hero | Scroll-linked, desktop only | Hero mock player card |
| Smooth route transitions | 150ms fade-in | Loading skeletons |
| No bounce, no flashy entrances | — | Global constraint |

---

## Scope Decisions

### What to build

1. **`prefers-reduced-motion` global rule** — zero motion for users who request it (WCAG 2.1 SC 2.3.3)
2. **`useInView` shared hook** — one-shot IntersectionObserver with above-fold detection, consumed by FadeInOnScroll and LandingCountUp
3. **`FadeInOnScroll` client wrapper** — thin component for below-fold content, using `useInView`
4. **Card hover scale** — add `transform: scale(1.02)` to interactive `.card` elements only
5. **Landing stat count-up** — new `LandingCountUp` client component for formatted number strings, using `useInView`
6. **Hero parallax-lite** — subtle translateY on mock player card, desktop + pointer devices only
7. **Loading skeleton fade-in** — add fade-in keyframe to all `loading.tsx` files
8. **Mobile menu slide animation** — entry + exit animation using CSS grid-rows for Navbar and LandingNav
9. **Full QA walkthrough** — Playwright at 1280px + 375px, both themes, both languages
10. **Merge to main** — formatting pass, clean build, merge commit

### What NOT to build

- **View Transition API** — `experimental.viewTransitions` in Next.js 16 is unstable and docs explicitly advise against production use
- **Radar chart grow animation** — spec mentions "stats count up" which refers to numbers, not chart polygons
- **Hamburger-to-X morph** — low priority, high effort
- **Automated Playwright test suite** — session uses MCP-based ad-hoc verification, not `.spec.ts` files

---

## Files Modified

### New Files (3)

| File | Purpose |
|------|---------|
| `src/hooks/useInView.ts` | Shared one-shot IntersectionObserver hook with above-fold detection — eliminates boilerplate duplication |
| `src/components/ui/FadeInOnScroll.tsx` | Thin `'use client'` wrapper using `useInView` for scroll-triggered fade-up animations |
| `src/components/landing/LandingCountUp.tsx` | Client component for formatted number count-up (handles "37,600+" style strings) |

### Modified Files (~12 + 33 loading files)

#### globals.css — additions

| Change | Details |
|--------|---------|
| `@keyframes skeleton-in` | `opacity: 0` → `opacity: 1`, 150ms ease-out |
| `prefers-reduced-motion` media query | Global: `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important` on `*, *::before, *::after` |
| Interactive card hover scale | `a.card:hover, button.card:hover { transform: scale(1.02) }` + transition with transform |
| Hero parallax CSS | `@supports (animation-timeline: scroll())` with `hero-float` keyframe |
| Mobile menu grid transition | `.mobile-menu-grid` helper for `grid-template-rows: 0fr/1fr` animation |

```css
/* src/app/globals.css — additions */

/* ── Accessibility: respect motion preferences ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── Interactive card scale on hover (pointer devices only) ── */
a.card, button.card {
  transition: background-color 150ms, box-shadow 150ms, transform 150ms;
}
@media (hover: hover) {
  a.card:hover, button.card:hover {
    transform: scale(1.02);
  }
}
/* Also apply scale on :focus-within for keyboard navigation */
a.card:focus-within, button.card:focus-within {
  transform: scale(1.02);
}

/* ── Loading skeleton entrance (combined with pulse to avoid animation conflict) ── */
@keyframes skeleton-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-skeleton-in {
  animation: skeleton-in 150ms ease-out, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* ── Hero parallax (CSS scroll-driven, progressive enhancement) ── */
@supports (animation-timeline: scroll()) {
  .hero-parallax {
    animation: hero-float linear both;
    animation-timeline: scroll();
    animation-range: 0px 400px;
  }
  @keyframes hero-float {
    from { transform: rotate(2deg) translateY(0); }
    to { transform: rotate(2deg) translateY(-30px); }
  }
}
```

### Research Insights: globals.css

**Performance (from performance-oracle):**
- `opacity` + `transform` animations are compositor-only — **zero CLS risk**. Never animate `height`, `margin`, `padding`, or use `display`/`visibility` toggling.
- No need for `will-change: transform` on cards — browser auto-promotes on hover. Permanent `will-change` on 24 grid cards wastes GPU memory on mobile.
- The `prefers-reduced-motion` media query with `!important` on `*` has negligible performance impact — CSS selectors are read right-to-left, universal selectors inside media queries only apply when the media matches.

**Touch devices (from frontend-races-reviewer + best-practices-researcher):**
- Card hover `scale(1.02)` is wrapped in `@media (hover: hover)` to prevent sticky hover on touch devices. On mobile, `:hover` activates on tap and stays active until the user taps elsewhere — causing cards to stay scaled up. The media query restricts scale to devices with true hover capability (mouse/trackpad).
- `:focus-within` still applies on all devices for keyboard accessibility.

**Accessibility (from learnings: animation patterns):**
- `prefers-reduced-motion: reduce` must disable parallax entirely, not just slow it down — the global rule handles this automatically.

---

#### useInView.ts — new shared hook

```tsx
// src/hooks/useInView.ts
'use client'

import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  /** IntersectionObserver threshold (0-1). Default: 0.1 */
  threshold?: number
  /** If true, skip animation when element is above the fold on mount. Default: true */
  skipAboveFold?: boolean
}

/**
 * One-shot IntersectionObserver hook with above-fold detection.
 * Returns { ref, isInView } — isInView becomes true once when element enters viewport.
 * Above-fold elements start as isInView = true (no flash).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const { threshold = 0.1, skipAboveFold = true } = options
  const ref = useRef<T>(null)
  // SSR: start visible to avoid hydration flash
  const [isInView, setIsInView] = useState(true)
  const hasTriggered = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasTriggered.current) return

    // Above the fold → keep visible, skip animation
    if (skipAboveFold) {
      const rect = el.getBoundingClientRect()
      if (rect.top >= 0 && rect.top < window.innerHeight) {
        hasTriggered.current = true
        return // already visible from SSR
      }
    }

    // Below the fold → hide, then reveal on scroll
    let cancelled = false
    setIsInView(false)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cancelled) {
          hasTriggered.current = true
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => { cancelled = true; observer.disconnect() }
  }, [threshold, skipAboveFold])

  return { ref, isInView }
}
```

### Research Insights: useInView

**From pattern-recognition-specialist (HIGH severity):**
The original plan had 3 components duplicating the same IntersectionObserver + above-fold detection boilerplate. The hooks directory already follows this extraction pattern (`useDebounce.ts`, `useClickOutside.ts`). `useInView` fits perfectly and eliminates ~40 lines of duplicated code.

**From kieran-typescript-reviewer — SSR hydration fix:**
The original `FadeInOnScroll` started with `visible = false` (opacity 0 on server render), then useEffect set it to `true` for above-fold content — causing a visible flash of invisible content. The fix: **start `isInView = true`** (SSR renders everything visible), then in useEffect, detect below-fold elements and set `isInView = false` before setting up the observer. Above-fold content never flickers.

**From julik-frontend-races-reviewer:**
The `cancelled` flag (line 40) prevents `setIsInView(true)` from firing on unmounted components. While React 18+ silently discards such updates, the flag makes the contract explicit and prevents issues if future developers add side effects after the state update. This matches the `cancelToken` pattern already used in `CountUpStat.tsx:29`.

**React Strict Mode behavior:**
In dev, React mounts → unmounts → remounts. First mount: creates observer. Unmount: cleanup disconnects. Second mount: re-creates observer. Works correctly. The `hasTriggered` ref survives across strict mode remounts (refs persist), preventing double-animation.

---

#### FadeInOnScroll.tsx — new component (simplified)

```tsx
// src/components/ui/FadeInOnScroll.tsx
'use client'

import { type ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

interface Props {
  children: ReactNode
  className?: string
  /** Stagger delay in ms (e.g., 0, 50, 100 for sequential sections) */
  delay?: number
}

export function FadeInOnScroll({ children, className = '', delay = 0 }: Props) {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 200ms ease-out ${delay}ms, transform 200ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
```

### Research Insights: FadeInOnScroll

**From architecture-strategist:**
Wrapping server components with a client wrapper is the canonical Next.js App Router pattern. Server components (HowItWorks, AudiencePanels, etc.) still execute on the server — `FadeInOnScroll` merely wraps the pre-rendered output in a `<div>` with IntersectionObserver behavior. No architectural concerns.

**From code-simplicity-reviewer:**
The original plan defined both `.animate-fade-up` CSS class in globals.css AND inline styles in FadeInOnScroll — the CSS class was dead code. The simplified version uses only inline styles (required for the `delay` prop). The dead `.animate-fade-up` class has been removed from the globals.css additions.

**CLS safety (from performance-oracle):**
`opacity` + `transform: translateY()` operate in compositor space — they do NOT change layout. The element's layout box stays in place at all times. **Zero CLS.** Never substitute with `height`, `margin`, `visibility`, or `display` toggling.

---

#### LandingCountUp.tsx — new component (refined)

```tsx
// src/components/landing/LandingCountUp.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from '@/hooks/useInView'

interface Props {
  /** Raw numeric target (e.g., 37600) */
  target: number
  /** Suffix to append after count completes (e.g., "+") */
  suffix?: string
  /** Use locale-aware formatting (e.g., 37,600). Default: true */
  formatted?: boolean
  className?: string
}

export function LandingCountUp({ target, suffix = '', formatted = true, className }: Props) {
  const [display, setDisplay] = useState(target) // SSR: show final value
  const { ref, isInView } = useInView<HTMLSpanElement>({ threshold: 0.5, skipAboveFold: true })
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    // Start count from 0
    const cancelToken = { canceled: false }
    setDisplay(0)
    const duration = 600 // Match CountUpStat + design spec
    const start = performance.now()

    function animate(now: number) {
      if (cancelToken.canceled) return
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    return () => { cancelToken.canceled = true }
  }, [isInView, target])

  const formattedValue = formatted ? display.toLocaleString() : String(display)

  return (
    <span ref={ref} className={className}>
      {formattedValue}{suffix}
    </span>
  )
}
```

### Research Insights: LandingCountUp

**From kieran-typescript-reviewer:**
- Fixed `formatted_value` → `formattedValue` (snake_case violation in TypeScript codebase)
- Simplified by using `useInView` hook instead of duplicating IntersectionObserver boilerplate

**From julik-frontend-races-reviewer:**
- `cancelToken.canceled` is the established cleanup pattern in this codebase (from `CountUpStat.tsx:29`)
- React Strict Mode: `hasAnimatedRef` persists across remounts, preventing double-animation. But in dev the first mount's animation will be canceled (cleanup runs), then second mount re-triggers it. This is expected behavior — the animation runs once in production.

**From learnings (animation patterns):**
- Count-up only fires when `isInView` becomes true — inherently avoids animating static/pre-existing content
- `toLocaleString()` handles locale-appropriate formatting (commas vs periods) — no security concern

---

#### Landing page integration

**`src/app/(public)/page.tsx`** — wrap below-fold sections with `FadeInOnScroll`:

```tsx
// Staggered fade-in for below-the-fold sections
<LandingHero />           {/* Above the fold — no wrapper, renders instantly */}
<SocialProof />           {/* Likely above fold on desktop — useInView handles detection */}
<FadeInOnScroll>
  <HowItWorks />
</FadeInOnScroll>
<FadeInOnScroll delay={50}>
  <AudiencePanels />
</FadeInOnScroll>
<FadeInOnScroll delay={100}>
  <Partners />
</FadeInOnScroll>
<FadeInOnScroll delay={150}>
  <CtaBanner />
</FadeInOnScroll>
```

**`src/components/landing/SocialProof.tsx`** — integrate `LandingCountUp` for numeric stats:

The server component renders `LandingCountUp` (client) for numeric values, keeps qualitative text as-is:

```tsx
// Replace static text with count-up for numeric stats
{stat.isQualitative ? (
  <span>{stat.value}</span>
) : (
  <LandingCountUp target={stat.numericValue} suffix="+" className={...} />
)}
```

Requires adding `numericValue: number` to the stats array (37600, 15 respectively).

---

#### Hero parallax-lite

**`src/components/landing/LandingHero.tsx`** — add `hero-parallax` class to the mock card wrapper div (line 48):

CSS `animation-timeline: scroll()` approach (defined in globals.css above). Falls back to no-parallax on unsupported browsers. Disabled automatically by `prefers-reduced-motion` global rule.

### Research Insights: Parallax

**From Next.js docs researcher:**
CSS scroll-driven animations (`animation-timeline: scroll()`) are supported in Chrome 115+, Edge 115+, and Firefox 110+. Safari support landed in Safari 18 (Sep 2024). This covers ~92% of browser usage as of 2026. The `@supports` wrapper provides graceful fallback.

**From performance-oracle:**
CSS scroll-driven animations run on the compositor thread — no JS scroll listener, no main-thread jank. This is strictly superior to a `requestAnimationFrame` + scroll listener approach. The `@supports` guard makes this a pure progressive enhancement.

**Alternative:** If visual testing reveals issues, skip parallax entirely — the mock card already has `rotate-2` for visual character.

---

#### Mobile menu slide animation (IMPROVED)

**`src/components/layout/Navbar.tsx`** and **`src/components/landing/LandingNav.tsx`**:

### Research Insights: Mobile Menu

**From performance-oracle (CRITICAL):**
The original plan used `max-height` transition (`max-h-0 → max-h-96`). This is problematic because:
1. `max-height` triggers layout recalculation on every animation frame
2. The transition timing is wrong — CSS transitions `max-height` linearly from 0 to 384px, but the actual content is ~200px. The last 184px of animation time is invisible (content already at full height), making the transition feel sluggish closing and too fast opening.

**Better approach: CSS `grid-template-rows: 0fr → 1fr`**

```tsx
{/* Mobile menu — always rendered, animated via CSS grid */}
<div
  className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${
    menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
  }`}
  aria-hidden={!menuOpen}
>
  <div className="overflow-hidden">
    <div className="border-t border-border bg-surface px-4 py-3">
      {/* ... menu links ... */}
    </div>
  </div>
</div>
```

**Why `grid-rows` is better:**
- `grid-template-rows` transitions to EXACT content height (not an arbitrary max)
- Smooth entry AND exit animation (the original plan said exit was excluded — this approach includes it for free)
- No layout thrashing — grid reflow is batched
- Browser support: CSS `grid-template-rows: 0fr` is supported in all modern browsers since 2023

**Also add to the hamburger `<button>`:**
- `aria-expanded={menuOpen}` for screen readers
- `aria-controls="mobile-menu"` pointing to the menu div
- Escape key handler: `onKeyDown={(e) => e.key === 'Escape' && setMenuOpen(false)}`

---

#### Loading skeletons

**All 31 `loading.tsx` files with skeletons** — replace `animate-pulse` with `animate-skeleton-in` on the root wrapper:

```tsx
// Before
<div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">

// After — replace animate-pulse with animate-skeleton-in (which includes pulse)
<div className="mx-auto max-w-7xl px-4 py-8 animate-skeleton-in">
```

**IMPORTANT: `animate-pulse` and `animate-skeleton-in` CANNOT coexist as separate classes** — the second overwrites the first's `animation` shorthand. The `.animate-skeleton-in` class in globals.css is defined with a combined animation value (`skeleton-in 150ms ease-out, pulse 2s ...`) so it replaces `animate-pulse` entirely. Use `animate-skeleton-in` INSTEAD OF `animate-pulse`, not alongside it.

### Research Insights: Loading Skeletons

**From frontend-races-reviewer (HIGH severity):**
Two Tailwind animation classes on one element conflict — only the last-declared `animation` property wins. The combined CSS rule in globals.css (`animation: skeleton-in 150ms ease-out, pulse 2s ...`) is the correct fix.

**From learnings (animation patterns):**
Loading skeletons appear dynamically during route transitions (they replace content that's being fetched), so the fade-in is appropriate — it's animating a dynamically-appearing element, not static content.

**From best-practices-researcher:**
Nielsen Norman Group research shows skeleton screens reduce bounce rates 9-20% vs spinners. The pulse animation (already present) signals "alive, loading." The 150ms fade-in prevents skeleton flash on fast loads. Both combined in a single animation declaration is optimal.

**From Next.js docs researcher:**
`loading.tsx` files are automatically wrapped in a React `<Suspense>` boundary by Next.js. They render instantly on navigation while the page component streams. The 150ms fade-in adds perceived smoothness without delaying content visibility.

**Loading files to update (31 with skeletons — 2 excluded: `admin/requests` and `dashboard/requests` return `null`):**

<details>
<summary>Full list</summary>

- `src/app/(platform)/clubs/[slug]/loading.tsx`
- `src/app/(platform)/clubs/loading.tsx`
- `src/app/(platform)/matches/[slug]/loading.tsx`
- `src/app/(platform)/matches/loading.tsx`
- `src/app/(platform)/players/[slug]/loading.tsx`
- `src/app/(platform)/players/compare/loading.tsx`
- `src/app/(platform)/players/loading.tsx`
- `src/app/admin/loading.tsx`
- `src/app/admin/messages/[conversationId]/loading.tsx`
- `src/app/admin/messages/loading.tsx`
- `src/app/admin/players/[id]/edit/loading.tsx`
- `src/app/admin/players/loading.tsx`
- `src/app/admin/players/new/loading.tsx`
- `src/app/admin/transfers/loading.tsx`
- `src/app/dashboard/loading.tsx`
- `src/app/dashboard/messages/[conversationId]/loading.tsx`
- `src/app/dashboard/messages/loading.tsx`
- `src/app/dashboard/notifications/loading.tsx`
- `src/app/dashboard/watchlist/loading.tsx`
- `src/app/platform/clubs/[id]/edit/loading.tsx`
- `src/app/platform/clubs/loading.tsx`
- `src/app/platform/clubs/new/loading.tsx`
- `src/app/platform/invite/loading.tsx`
- `src/app/platform/loading.tsx`
- `src/app/platform/players/[id]/edit/loading.tsx`
- `src/app/platform/players/loading.tsx`
- `src/app/platform/players/new/loading.tsx`
- `src/app/platform/requests/loading.tsx`
- `src/app/platform/scouts/[id]/loading.tsx`
- `src/app/platform/scouts/loading.tsx`
- `src/app/platform/transfers/loading.tsx`

**Excluded (return `null`, no skeleton):**
- ~~`src/app/admin/requests/loading.tsx`~~
- ~~`src/app/dashboard/requests/loading.tsx`~~

</details>

---

#### CountUpStat.tsx — accessibility fix

Add `aria-label` with final value so screen readers announce the correct number, not intermediate animation values:

```tsx
// src/components/player/CountUpStat.tsx
<div ref={ref} aria-label={`${value}${suffix} ${label}`}>
```

### Research Insights: Accessibility

**From julik-frontend-races-reviewer:**
Displaying different values in the visible text (animating numbers) and the `aria-label` (final value) is the correct approach. Screen readers read the `aria-label`, not the visible text when both are present. This ensures consistent output regardless of animation timing.

---

## Execution Order

### Step 1: globals.css — Animation foundations

Add to `src/app/globals.css`:
1. `prefers-reduced-motion` global media query
2. `@keyframes skeleton-in` + `.animate-skeleton-in` class
3. Interactive card hover scale (`a.card:hover, button.card:hover`) + `:focus-within` variant
4. Hero parallax CSS (`@supports (animation-timeline: scroll())`)

**Verify:** `npm run build` passes.

### Step 2: useInView hook + FadeInOnScroll component

1. Create `src/hooks/useInView.ts` — shared IntersectionObserver hook
2. Create `src/components/ui/FadeInOnScroll.tsx` — consuming `useInView`

**Verify:** Import works, no type errors.

### Step 3: Landing page animations

1. Create `src/components/landing/LandingCountUp.tsx` — consuming `useInView`
2. Update `src/components/landing/SocialProof.tsx` — integrate `LandingCountUp` for numeric stats
3. Update `src/app/(public)/page.tsx` — wrap below-fold sections with `FadeInOnScroll`
4. Update `src/components/landing/LandingHero.tsx` — add `hero-parallax` class to mock card wrapper

**Verify:** `npm run build` passes. Playwright: landing page at 1280px, scroll through sections, verify fade-in triggers and count-up.

### Step 4: Card hover + CountUpStat accessibility

1. The `.card` hover changes are in Step 1 (globals.css)
2. Update `src/components/player/CountUpStat.tsx` — add `aria-label`
3. **Optional:** Refactor CountUpStat to use `useInView` hook (reduces ~20 lines of boilerplate). Only if time permits — existing implementation works correctly.

**Verify:** Hover over PlayerCards on `/players` — should scale 1.02x with smooth transition. Non-link cards (dashboard stat containers) should NOT scale. Tab through card grid — focus-within should also trigger scale.

### Step 5: Mobile menu animation

1. Update `src/components/layout/Navbar.tsx` — replace conditional render with CSS grid-rows animation + `aria-expanded`
2. Update `src/components/landing/LandingNav.tsx` — same pattern
3. Add Escape key close handler to both hamburger buttons

**Verify:** Playwright at 375px — tap hamburger, menu slides down smoothly. Tap again, slides up. Press Escape — menu closes.

### Step 6: Loading skeleton fade-in

Update all 31 `loading.tsx` files (those with skeletons) — replace `animate-pulse` with `animate-skeleton-in` on root wrapper.

**Verify:** Navigate between pages — skeletons fade in instead of popping.

### Step 7: Full QA walkthrough (Playwright MCP)

Systematic verification matrix:

**Desktop (1280px):**
- [ ] Landing page — light theme, English: fade-ins, count-up, parallax, card hover
- [ ] Landing page — dark theme, Georgian: same animations work, count-up formatting correct
- [ ] `/players` — card grid hover scale, list view, filter panel
- [ ] `/players/[slug]` — CountUpStat, RadarChart, ProfileSubNav sticky
- [ ] `/players/compare` — stat diffs, radar overlay
- [ ] `/clubs` — card hover, both themes
- [ ] `/matches` — card hover, both themes
- [ ] Dashboard — activity feed, watchlist, stat cards (stat cards should NOT scale on hover)
- [ ] Admin panel — overview, players, transfers
- [ ] Messages — chat thread, sidebar, mobile drawer
- [ ] Auth pages — login/register forms
- [ ] About/Contact pages

**Mobile (375px):**
- [ ] Landing page — menu slide (entry + exit), stacked layout, count-up
- [ ] `/players` — single column cards, filter panel
- [ ] `/players/[slug]` — stacked layout, stats below photo
- [ ] Dashboard — bottom tab bar navigation
- [ ] Admin — horizontal scrollable tab bar
- [ ] Messages — mobile drawer pattern
- [ ] Auth pages — form layout

**Theme-specific checks (from learnings: theme redesign):**
- [ ] Cards visually distinct from page surface on both themes (border + hover shadow)
- [ ] No light-flash: fade-in animations don't briefly expose underlying surface colors
- [ ] Position badges: tinted backgrounds + colored text correct on both themes
- [ ] Status badges: color contrast ≥ 4.5:1 on both themes
- [ ] Loading skeletons: `bg-elevated` visible on both light and dark backgrounds

**Accessibility:**
- [ ] Set `prefers-reduced-motion: reduce` — verify ALL animations disabled (fade-ins, count-ups, parallax, skeleton fade, card hover scale)
- [ ] Keyboard navigation through card grid — focus-visible ring + scale on focus-within
- [ ] Screen reader: CountUpStat `aria-label` announces final value
- [ ] Mobile menu: `aria-expanded` toggles correctly, Escape key closes menu

**Touch/mobile-specific:**
- [ ] Cards do NOT scale on tap (touch devices) — `@media (hover: hover)` guard active
- [ ] Cards DO scale on keyboard focus — `:focus-within` works without hover
- [ ] Card scale does NOT cause horizontal overflow at 375px

**Cross-cutting:**
- [ ] Theme toggle mid-page — animations do not replay
- [ ] Language toggle — Georgian text fits in all containers (Georgian ~30% wider)
- [ ] Back button — fade-ins do not replay (IntersectionObserver already triggered)
- [ ] 404 page — both themes
- [ ] Verify no remaining `100vh` — should all be `100dvh` (from learnings: mobile viewport)

### Step 8: Pre-merge preparation

1. **Prettier formatting pass:**
   ```bash
   npx prettier --write 'src/**/*.{ts,tsx}'
   ```
   Main branch added Prettier + Husky pre-commit hooks (commit `02180d5`). The 26 commits on `redesign/light-navy` were written WITHOUT Prettier. Running Prettier now prevents formatting conflicts during merge.

2. **Commit formatting changes** separately (clean diff).

3. **`npm run build`** — must pass clean.

4. **`npm run lint`** — must pass (main added lint-staged).

5. **Check stash:** `git stash list` — there are 4 stashes from old feature branches (`fix/chat-duplicate-key-race-condition`, `feat/split-pane-chat-layout`, `refactor/code-review-remediation-29`, `refactor/security-fixes`). All are from pre-redesign work and can be dropped: `git stash clear`.

### Step 9: Merge to main

**Strategy:** Merge commit (NOT rebase). With 26+ commits and 176 files, rebasing replays each commit individually — conflicts would need resolution 25 times. A merge commit resolves all conflicts once.

```bash
git checkout main
git pull origin main
git merge redesign/light-navy --no-ff
# Resolve any conflicts (likely in globals.css, package.json, CLAUDE.md)
npm run build    # Final verification
npm run lint     # Final lint check
git push origin main
```

**Known merge conflict areas:**
- `package.json` / `package-lock.json` — main may have updated dependencies
- `.eslintrc` or ESLint config — main added lint-staged rules
- `CLAUDE.md` — both branches have modifications
- `globals.css` — main's Prettier may have reformatted; branch has extensive changes

**Post-merge:**
- Delete `redesign/light-navy` branch: `git branch -d redesign/light-navy`
- Verify Vercel deployment succeeds
- Spot-check production URL in both themes

---

## Acceptance Criteria

- [x] `prefers-reduced-motion: reduce` disables ALL animations (global CSS rule)
- [x] Below-fold landing sections fade up on scroll (200ms, staggered)
- [x] Above-fold content renders instantly (no animation, no CLS, no SSR flash)
- [x] SocialProof stats count up from 0 when scrolled into view
- [x] Interactive cards (PlayerCard, ClubCard, MatchCard) scale 1.02x on hover AND focus-within
- [x] Non-interactive cards (stat containers) do NOT scale on hover
- [x] Hero mock player card has subtle parallax on desktop (or graceful fallback)
- [x] Mobile menu (both navs) slides down/up smoothly via CSS grid-rows
- [x] Mobile menu has `aria-expanded`, closes on Escape key
- [x] Loading skeletons fade in (150ms) instead of popping
- [x] CountUpStat has `aria-label` with final value
- [x] Both themes visually verified at 1280px and 375px via Playwright
- [x] Both languages verified (Georgian text fits)
- [x] `useInView` hook shared by FadeInOnScroll and LandingCountUp
- [x] `npm run build` passes clean
- [x] `npm run lint` passes clean (pre-existing warnings only)
- [x] `redesign/light-navy` merged to `main` successfully
- [ ] Vercel deployment succeeds

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Prettier reformats every file, creating noise | High | Low | Commit formatting separately before merge |
| CSS `animation-timeline: scroll()` not supported | Low | Low | `@supports` guard — graceful fallback to no parallax |
| Merge conflicts on `globals.css` | Medium | Medium | Manual resolution — we know the file structure |
| Vercel CI fails due to new lint rules from main | Medium | Medium | Run `npm run lint` locally before push |
| IntersectionObserver fires incorrectly on fast scroll | Low | Low | Threshold 0.1 is generous; one-shot disconnect; cancelled flag |
| `useInView` initial `true` → `false` flash on below-fold | Low | Low | Transition duration handles the switch — 200ms ease-out masks the state change |
| CSS grid-rows not supported on very old browsers | Very Low | Low | Fallback: menu appears instantly (no animation, still functional) |

---

## Sources & References

- **Design spec:** `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` (lines 449-459, 476)
- **Session 9 plan (predecessor):** `docs/plans/2026-03-17-refactor-frontend-redesign-session-9-messages-admin-secondary-plan.md`
- **CountUpStat pattern:** `src/components/player/CountUpStat.tsx`
- **Existing keyframes:** `src/app/globals.css:305-329`
- **Card class:** `src/app/globals.css:190-200`
- **Hooks directory pattern:** `src/hooks/useDebounce.ts`, `src/hooks/useClickOutside.ts`
- **Learnings — `100dvh` vs `100vh`:** `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`
- **Learnings — animation on historical vs new messages:** `docs/solutions/ui-bugs/chat-session-f-polish-reliability-accessibility.md`
- **Learnings — theme QA checklist:** `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md`
