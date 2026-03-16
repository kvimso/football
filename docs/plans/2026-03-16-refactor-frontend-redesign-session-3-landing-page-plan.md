---
title: "refactor: Frontend Redesign Session 3 — Landing Page"
type: refactor
status: completed
date: 2026-03-16
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-16
---

# Frontend Redesign Session 3 — Landing Page

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** Architecture Strategist, Code Simplicity Reviewer, Performance Oracle, Pattern Recognition Specialist, Security Sentinel, Spec Flow Analyzer, Best Practices Researcher, Repo Research Analyst, Learnings Researcher

### Key Improvements from Research

1. **CtaBanner: use `data-theme="dark"` on section** — CSS vars cascade correctly inside, allowing normal Tailwind utilities (`text-foreground-muted`, `btn-primary`). Add inline `style` for bg/color as belt-and-suspenders. Do NOT use raw hex for child text — theme tokens inside `data-theme="dark"` resolve to dark values automatically.
2. **Bleed-right hero simplified** — Use `lg:pr-0` + `overflow-hidden` on grid container. No absolute positioning (causes height/overlap issues). The visual impact comes from the enlarged card + rotation + glow, not from literally touching viewport edge.
3. **Don't rename MarketStats** — Restyle `MarketStats.tsx` in place. Renaming creates git churn, breaks import until page.tsx updates, and the filename is irrelevant to users.
4. **`<a>` not `<Link>` for same-page anchors** — Next.js `<Link>` may not trigger scroll behavior on same-page hash navigation. Since LandingNav only renders on the landing page, use `<a href="#for-scouts">` (no full path needed).
5. **`scroll-behavior: smooth` must NOT be global** — Would affect Next.js route transitions and ChatThread `scrollTo`. Scope with `@media (prefers-reduced-motion: no-preference)` AND only on landing sections via `scroll-margin-top` inline styles.
6. **Hero glow: hardcoded bright green** — `from-primary/20` is barely visible in light mode (`#1B8A4A` at 20% = invisible on white). Use `from-[#4ADE80]/20` so glow is visible in both themes.
7. **Timeline: use `<ol>` for accessibility** — Screen readers announce "list, 3 items" and count position. Connecting lines get `aria-hidden="true"`.
8. **AudiencePanels: 5-signal differentiation** — bg color, label badge color, CTA button variant (`btn-primary` vs `btn-secondary`), border (`border-l` on academy panel), content tone.
9. **Anchor links + smooth scroll: stretch scope** — Add section IDs inline (trivial). LandingNav link updates are optional/stretch — can be a 2-minute commit later.
10. **Preserve auth redirect** — `page.tsx` auth check (redirect logged-in users to `/players`) must not be removed during import rewrite.
11. **`nav.*` keys go in `core.ts`** — Match existing `nav.about`, `nav.login` etc. pattern. NOT in `landing.ts`.
12. **Intermediate build check** — Run `npm run build` after updating page.tsx imports (step 8) and BEFORE deleting old files (step 9) to catch missed references.

### Scope Adjustments from Research

| Original Plan Item | Decision | Reason |
|---|---|---|
| Rename `MarketStats.tsx` → `SocialProof.tsx` | **Keep as MarketStats** | Unnecessary git churn, breaks import ordering |
| Absolute positioning for bleed-right hero | **Use `lg:pr-0` grid approach** | Absolute positioning has height management issues |
| LandingNav anchor links | **Stretch scope** | Section IDs added (trivial), nav updates deferrable |
| `scroll-behavior: smooth` on `html` | **Scoped + `prefers-reduced-motion`** | Global smooth scroll breaks route transitions + chat |
| Raw hex in CtaBanner (`#12110F`) | **`data-theme="dark"` + inline backup** | Allows all Tailwind utilities to work correctly inside |
| Two partners (Pixellot + Starlive) | **Show 1 (Pixellot only)** | YAGNI — add Starlive when logos are available |

---

## Overview

Redesign the landing page from a generic card-grid layout to a flagship-quality first impression. Implement asymmetric hero with bleed-right product preview, social proof bar, horizontal timeline "How it Works", side-by-side audience panels, and dark CTA section. Includes copy refresh for more compelling bilingual (en/ka) messaging. This is Session 3 of 10 — landing page content only.

**Branch:** Continue on `redesign/light-navy`

**Prerequisite:** Sessions 1-2 complete (A3 palette, ThemeProvider, Inter font, 48px navbar, LandingNav updated, `--navbar-height` CSS var).

## Problem Statement / Motivation

The current landing page violates Anti-Slop Rule #1 ("Asymmetry over grids") — it's 7 sections of centered card grids with no visual variation. Every section uses the same pattern: centered header + symmetric grid below. It looks competent but generic — a developer's landing page, not a premium scouting platform. The spec demands asymmetry, visual rhythm, and progressive disclosure. Scouts should feel "this is serious" within 3 seconds.

## Proposed Solution

### Section Restructuring

| Current | New | Change |
|---|---|---|
| `LandingHero` (2-col grid, mock card) | `LandingHero` (asymmetric, bleed-right product preview) | **Major rewrite** |
| `MarketStats` (3 centered stats) | `MarketStats` (compact social proof bar) | **Restyle in place** |
| `WhatWeDo` (3-col card grid) | **DELETE** — absorbed by HowItWorks | **Removed** |
| `Services` (5-card grid) | **DELETE** — content condensed into audience panels | **Removed** |
| `ForScouts` (2-col: checklist + pitch) | `AudiencePanels` (side-by-side in single section) | **Merge + redesign** |
| `ForAcademies` (2-col: formation + checklist) | *(merged into AudiencePanels)* | **Merged** |
| `Partners` (single centered card) | `Partners` (restyle with A3 tokens) | **Minor restyle** |
| *(none)* | `CtaBanner` (dark section, "Start Scouting") | **New component** |

**New page order — visual rhythm (no two consecutive sections share the same pattern):**
```
LandingHero (asymmetric 2-col, bleed-right)
  → MarketStats (horizontal stat bar, bg-surface)
    → HowItWorks (horizontal timeline, bg-background)
      → AudiencePanels (flush 2-col split, bg-surface/bg-elevated)
        → Partners (compact centered, bg-background)
          → CtaBanner (dark full-width, always #12110F)
            → LandingFooter (in layout)
```

### 1. LandingHero — Asymmetric Bleed-Right

**The bold move:** Hero right side breaks out of `max-w-7xl` padding and bleeds toward viewport edge.

**Layout structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [max-w-7xl left content]          │  [bleed-right visual]   │
│                                   │                         │
│  The Gateway to                   │  ┌────────────────┐     │
│  *Georgian* Football              │  │  Mock Player   │     │
│  Talent                           │  │  Card Preview  │     │
│                                   │  │  (angled, lg)  │     │
│  Subtitle text...                 │  │                │     │
│                                   │  └────────────────┘     │
│  [Get Started →] [Learn More]     │                    ─────┤
└─────────────────────────────────────────────────────────────┘
```

**Implementation (simplified per Architecture + Simplicity reviews):**

```tsx
<section className="overflow-hidden">
  <div className="mx-auto max-w-7xl px-4 lg:pl-4 lg:pr-0">
    <div className="grid lg:grid-cols-2 gap-12 items-center py-20 sm:py-28 lg:py-32">
      {/* Left — headline, subtitle, CTAs */}
      <div className="text-center lg:text-left">...</div>
      {/* Right — bleeds to edge via removed right padding */}
      <div className="hidden lg:flex items-center justify-end">
        {/* Gradient glow — use HARDCODED bright green, not from-primary/20 */}
        <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-[#4ADE80]/20 via-[#4ADE80]/5 to-transparent blur-2xl" />
        {/* Mock card with rotation */}
        <div className="relative rotate-2" style={{...darkScopedVars}}>...</div>
      </div>
    </div>
  </div>
</section>
```

> **Research insight (Architecture):** `overflow-hidden` MUST be on the `<section>`, not on any parent layout element. If placed on `<main>` or wrapper `<div>`, it clips subsequent sections' overflow.

> **Research insight (Performance):** LCP is the `<h1>` text, not the card. In-flow grid layout is fine — both approaches have negligible LCP difference since LCP is text-based.

**Hero text changes (copy refresh):**
- Keep the green-highlighted word pattern (`Georgian`)
- Subtitle: shorten to 1 punchy line (see Copy Refresh section)
- CTAs: "Get Started" (primary, links to `/register`) + "Learn More" (ghost/secondary, links to `#for-scouts`)
- Remove mobile stat bar from hero (moved to MarketStats which is visible on all devices)

**Right-side product preview:**
- Keep mock player card (standard SaaS pattern — "show the product")
- Enlarge card, add `rotate-2`, stronger shadow (`shadow-2xl shadow-black/30`)
- Glow: `from-[#4ADE80]/20` (hardcoded bright green, visible in both themes)
- Card continues to use scoped dark CSS vars via inline `style` (existing pattern from `LandingHero.tsx:82-89`)

**Mobile (<lg):** Stacks vertically, smaller centered card below headline, no rotation.

**Key files:** `src/components/landing/LandingHero.tsx`

### 2. MarketStats — Compact Social Proof Bar

**Restyle in place — do NOT rename file.**

**Spec:** "37,600+ registered youth players | 200+ academies | Camera-verified stats"

**Changes from current:**
- Replace 3rd stat (€100M+ Transfer Value) with "Camera-Verified" qualitative badge
- 3rd item: checkmark icon + "Camera-Verified Stats" text (not a number — visual badge pattern)
- Compact padding: `py-8 sm:py-10` (down from `py-16 sm:py-20`)
- Full-width `bg-surface` band
- Numbers: `text-4xl font-extrabold tracking-tight text-primary` (keep existing style)
- Labels: `text-xs font-semibold uppercase tracking-widest text-foreground-muted` (keep existing `tracking-widest`)
- On mobile: keep existing stacked layout (already works)

**Translation changes:**
- Replace `landing.statsTransferValue` / `landing.statsTransferValueLabel` with camera-verified
- New keys: `landing.statsCameraVerified` ("Camera-Verified") / `landing.statsCameraVerifiedLabel` ("Player Statistics")

**Key files:** `src/components/landing/MarketStats.tsx`

### 3. HowItWorks — Horizontal Timeline

**New component. Replaces `WhatWeDo` and partially `Services`.**

**Spec:** "3 steps as horizontal timeline with connecting lines, not 3 cards."

**3 steps (process, not features):**
1. **Sign Up** — Create your free account in seconds
2. **Discover** — Search, filter, compare 37,600+ youth players
3. **Connect** — Message academies directly

**Implementation (per Best Practices research):**

```tsx
<section className="py-16 sm:py-20">
  <div className="mx-auto max-w-7xl px-4">
    <h2>...</h2>
    <ol className="relative flex flex-col lg:flex-row lg:justify-between"
        aria-label={t('landing.howItWorksTitle')}>
      {steps.map((step, i) => (
        <li key={step.num} className="relative flex items-start gap-4 pb-10 lg:pb-0 lg:flex-col lg:items-center lg:text-center lg:flex-1">
          {/* Connecting line: vertical (mobile) / horizontal (desktop) */}
          {i < steps.length - 1 && (
            <>
              <div className="absolute left-5 top-10 h-full w-0.5 bg-border lg:hidden" aria-hidden="true" />
              <div className="hidden lg:block absolute top-5 left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-0.5 bg-border" aria-hidden="true" />
            </>
          )}
          {/* Green numbered circle */}
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-btn-primary-text font-semibold text-sm">
            {step.num}
          </div>
          <div className="lg:mt-4">
            <h3 className="font-semibold text-lg">{step.title}</h3>
            <p className="mt-1 text-sm text-foreground-muted leading-relaxed max-w-xs lg:mx-auto">{step.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>
```

> **Research insight (Best Practices):** Use `<ol>` for semantic meaning — screen readers announce step count and position. Connecting lines get `aria-hidden="true"`.

**Section padding:** `py-16 sm:py-20` (matches established pattern across all landing sections).

**Translation keys:**
- `landing.howItWorksTitle` / `landing.howItWorksSubtitle`
- `landing.step1Title` / `landing.step1Desc`
- `landing.step2Title` / `landing.step2Desc`
- `landing.step3Title` / `landing.step3Desc`

**Key files:** `src/components/landing/HowItWorks.tsx` (new)

### 4. AudiencePanels — Side-by-Side Scout/Academy

**Replaces `ForScouts` + `ForAcademies`. New single component.**

**Spec:** "Side-by-side panels, one cream, one elevated."

**5-signal visual differentiation (per Best Practices research):**

| Signal | Scout Panel | Academy Panel |
|--------|-------------|---------------|
| Background | `bg-surface` (cream) | `bg-elevated` (darker cream) |
| Label badge | `text-primary` (green) | `text-foreground-muted` (gray) |
| CTA button | `.btn-primary` (filled green) | `.btn-secondary` (outlined) |
| Border | None | `border-t border-border lg:border-t-0 lg:border-l` |
| Content tone | Action ("Discover", "Browse") | Value ("Showcase", "Build") |

**Panels are flush** — full-width with no gap, no rounded corners, no card-like padding-from-viewport. Visual "split" feels architectural.

**Content — 4 benefits per panel (condensed from 5):**

Scout benefits (keep 1, 2, 3, 4; drop 5 — redundant with "Connect" messaging):
- Browse all registered Georgian youth players in one place
- Filter by position, age, club, and physical attributes
- View verified match statistics from camera systems
- Add players to your watchlist with private notes

Academy benefits (keep 1, 2, 3, 5; drop 4 — transfers are secondary):
- Register and manage your player profiles
- Receive verified statistics from camera systems
- Get notified when scouts are interested
- Build your academy's international reputation

**Section IDs:** `id="for-scouts"` and `id="for-academies"` with inline `style={{ scrollMarginTop: 'calc(var(--navbar-height) + 1rem)' }}`.

**On mobile:** Stacks vertically. Academy panel gets `border-t` for separation (desktop `border-l`).

**Key files:** `src/components/landing/AudiencePanels.tsx` (new)

### 5. Partners — Minor Restyle

Show Pixellot only (YAGNI — add Starlive when logos available). Keep existing structure. Minor changes:
- Compact section: `py-10 sm:py-12` (breathing room between AudiencePanels and CTA)
- Use `bg-background` (no tint) for visual separation
- Keep camera icon + description pattern

**Key files:** `src/components/landing/Partners.tsx`

### 6. CtaBanner — Dark CTA Section

**New component. Replaces LandingFooter CTA strip.**

**Implementation (per Best Practices + Architecture reviews):**

```tsx
<section
  data-theme="dark"
  className="relative py-16 sm:py-20"
  style={{ backgroundColor: '#12110F', color: '#EEECE8' }}
>
  <div className="mx-auto max-w-7xl px-4 text-center">
    <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
      {t('landing.ctaTitle')}
    </h2>
    <p className="mt-4 text-foreground-muted max-w-2xl mx-auto leading-relaxed">
      {t('landing.ctaSubtitle')}
    </p>
    <div className="mt-8">
      <a href="/register" className="btn-primary px-10 py-3.5 text-base font-semibold">
        {t('landing.ctaCta')}
      </a>
    </div>
  </div>
</section>
```

> **Research insight (Best Practices + Pattern Recognition):** Use `data-theme="dark"` on the section element. This makes ALL CSS custom properties inside resolve to dark values — `text-foreground-muted` becomes `#9A9590` (readable on dark bg), `btn-primary` gets bright green with dark text. The inline `style` for bg/color is a belt-and-suspenders backup. Do NOT use raw hex on child elements — the scoped `data-theme` handles everything.

> **Research insight (Architecture):** In dark mode, the CTA section's `data-theme="dark"` is redundant but harmless — it blends with the page. To make it stand out in dark mode, add a subtle green gradient: `backgroundImage: 'linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, transparent 50%)'`.

**Remove CTA strip from LandingFooter** (lines 11-21 of `LandingFooter.tsx`). Verify footer's `py-12` provides adequate top spacing.

**Translation keys:**
- `landing.ctaTitle` / `landing.ctaSubtitle` / `landing.ctaCta`

**Key files:** `src/components/landing/CtaBanner.tsx` (new), `src/components/landing/LandingFooter.tsx`

### 7. Copy Refresh

Update translation strings for compelling, action-oriented messaging.

**Hero:**
- Title: keep "The Gateway to Georgian Football Talent" (strong)
- Subtitle: "The scouting platform for Georgia's 37,600+ youth players — verified camera stats, direct academy access."
- Primary CTA key: `landing.heroCtaPrimary` → "Get Started" / "დაიწყე"
- Secondary CTA key: `landing.heroCtaSecondary` → "Learn More" / "გაიგე მეტი"

**How It Works:** Process-oriented copy (see section 3 for steps).

**Audience panels:** 4 benefits per panel (see section 4 for specific selections).

**CTA banner:** "Ready to Scout Georgian Talent?" / "მზად ხარ ქართული ტალანტის აღმოსაჩენად?"

**All copy bilingual.** Georgian translations for every new/changed key. Mark for Andria's review — don't block implementation on copy approval.

**Key files:** `src/lib/translations/landing.ts`, `src/lib/translations/core.ts` (for `nav.*` keys if anchor links added)

### 8. Page Assembly Update

**`src/app/(public)/page.tsx` changes:**

```tsx
// PRESERVE the auth check at top — do NOT remove during import rewrite
import { LandingHero } from '@/components/landing/LandingHero'
import { MarketStats } from '@/components/landing/MarketStats'  // NOT renamed
import { HowItWorks } from '@/components/landing/HowItWorks'
import { AudiencePanels } from '@/components/landing/AudiencePanels'
import { Partners } from '@/components/landing/Partners'
import { CtaBanner } from '@/components/landing/CtaBanner'
```

**Delete files (AFTER confirming build passes with new imports):**
- `src/components/landing/WhatWeDo.tsx`
- `src/components/landing/Services.tsx`
- `src/components/landing/ForScouts.tsx`
- `src/components/landing/ForAcademies.tsx`

### 9. LandingNav Anchor Links — STRETCH SCOPE

**Deferred from Session 2. Optional for Session 3 — the core landing page works without them.**

If time permits:
- Add `<a href="#for-scouts">` and `<a href="#for-academies">` (use `<a>`, NOT `<Link>`) to LandingNav desktop links
- Add to mobile hamburger menu
- Nav translation keys: `nav.forScouts` / `nav.forAcademies` in `core.ts` (NOT `landing.ts`)

**Do NOT add `scroll-behavior: smooth` to `globals.css` globally.** The inline `scrollMarginTop` on target sections is sufficient.

## Technical Considerations

### Server Components
All landing components are async server components using `getServerT()`. **Keep them as server components** — zero interactivity, faster LCP, no hydration cost. Only `LandingNav` is `'use client'`.

### Theme Awareness
All new components must work in both light and dark mode. Use CSS custom properties (`bg-surface`, `text-foreground`, etc.) — never hardcode hex in components.

**Two "always-dark" elements:**
1. **CtaBanner** — uses `data-theme="dark"` on section + inline `style` backup. All child elements use normal Tailwind utilities (they resolve to dark values via `data-theme`).
2. **Hero mock card** — continues using scoped CSS var overrides via inline `style` (existing pattern from `LandingHero.tsx:82-89`).

### Image Strategy
Keep mock player card as product preview (standard SaaS landing pattern). When real photography is available, replace with `<Image>` using:
- `priority` prop (preload for LCP)
- `sizes="(max-width: 1024px) 0px, 50vw"` (don't load on mobile where card is hidden)
- Explicit `width`/`height` to prevent CLS

### Deleted Components — Icon Imports
After deleting WhatWeDo, Services, ForScouts, ForAcademies: `DatabaseIcon`, `FilmIcon`, `ShieldIcon` become dead exports. `CheckCircleIcon` will be re-imported by `AudiencePanels`. `CameraIcon` survives in `Partners`. Dead icon definitions in `Icons.tsx` are harmless (tree-shaking eliminates them).

### Scroll-Linked Animations
Spec mentions "content fades up (200ms, staggered 50ms per element)" — that's **Session 10**. Do not add animations in Session 3.

## Acceptance Criteria

- [x] Page order: Hero → MarketStats → HowItWorks → AudiencePanels → Partners → CtaBanner → Footer
- [x] `WhatWeDo.tsx`, `Services.tsx`, `ForScouts.tsx`, `ForAcademies.tsx` deleted
- [x] `HowItWorks.tsx` created — `<ol>` timeline with connecting lines, accessible
- [x] `AudiencePanels.tsx` created — flush side-by-side, 5-signal differentiation, section IDs
- [x] `CtaBanner.tsx` created — `data-theme="dark"`, inline style backup, CTA strip removed from LandingFooter
- [x] `LandingHero.tsx` rewritten — bleed-right via `lg:pr-0`, enlarged rotated card, hardcoded glow
- [x] `MarketStats.tsx` restyled — compact bar, camera-verified 3rd item
- [x] Auth redirect preserved in `page.tsx`
- [x] All new/changed strings in both `en` and `ka`
- [x] All sections work in light mode AND dark mode
- [x] All sections work at 375px mobile
- [x] `npm run build` passes

## Execution Order

1. **Translations** — Update `landing.ts` with all new/changed keys (en + ka)
2. **New components** — Create `HowItWorks.tsx`, `AudiencePanels.tsx`, `CtaBanner.tsx`
3. **Rewrite hero** — `LandingHero.tsx` with bleed-right, enlarged card, glow
4. **Restyle existing** — `MarketStats.tsx` (compact bar), `Partners.tsx` (minor), `LandingFooter.tsx` (remove CTA strip)
5. **Update page.tsx** — New imports, section order, preserve auth check
6. **Build check** — `npm run build` to verify all imports resolve
7. **Delete old files** — `WhatWeDo.tsx`, `Services.tsx`, `ForScouts.tsx`, `ForAcademies.tsx`
8. **Final verify** — `npm run build`, Playwright both themes + mobile + both languages
9. **(Stretch) Anchor links** — LandingNav `<a>` links + `core.ts` nav keys

## Dependencies & Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Bleed-right causes horizontal scroll | Page-breaking | `overflow-hidden` on hero `<section>`; test 375px-1920px |
| Deleted components still imported | Build failure | Build check (step 6) before deletion (step 7) |
| Georgian copy quality | Poor i18n | Mark for Andria's review, don't block on it |
| Auth redirect removed accidentally | Users see landing when logged in | Explicitly preserve in page.tsx rewrite |
| CtaBanner unreadable in light mode | UX failure | `data-theme="dark"` scopes ALL tokens to dark values |
| Dark CTA blends with dark mode page | Low contrast | Subtle green gradient on CTA background |

## Sources & References

- **Design spec:** `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` (lines 319-331, 30-36)
- **Session 1 plan:** `docs/plans/2026-03-16-refactor-frontend-redesign-session-1-foundation-plan.md`
- **Session 2 plan:** `docs/plans/2026-03-16-refactor-frontend-redesign-session-2-navigation-layout-plan.md` (deferred anchor links)
- **Current components:** `src/components/landing/` (7 files)
- **Translations:** `src/lib/translations/landing.ts`
- **CSS patterns:** Josh Comeau (full-bleed layout), Ahmad Shadeed (stepper component), Ryan Mulligan (layout breakouts)
- **Institutional learnings:** `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` (contrast gotchas), `docs/solutions/ui-bugs/transfer-page-premium-redesign-and-rpc-fix.md` (glass-morphism pattern)
