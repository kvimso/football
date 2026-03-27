---
title: Landing Page Redesign
type: feat
status: completed
date: 2026-03-27
origin: docs/superpowers/specs/2026-03-27-landing-page-redesign-design.md
---

# Landing Page Redesign

## Overview

Replace the current 6-section landing page (Hero, SocialProof, HowItWorks, AudiencePanels, Partners, CtaBanner) with a new 5-section layout: Hero with rotating player slider, Club Logo Slider, Georgian Talent Success Stories, For Scouts/For Academies panels, and Partners. This introduces **database-driven content** (featured players, club logos) to what is currently a fully static page, and adds two marketing success stories (Kvaratskhelia, Mamardashvili).

Navbar (`LandingNav`) and footer (`LandingFooter`) are unchanged. The existing color system (warm off-white light / warm dark toggle, green accent) is unchanged. All text via `t()` translations.

## Problem Statement / Motivation

The current landing page was built as a placeholder during Phase 6 and lacks personality, real platform data, and compelling marketing content. Key issues:

1. **No real data** — the hero shows a hardcoded mock player card; club logos are absent
2. **Missing social proof** — no showcase of Georgian football's success (Kvaratskhelia €70M, Mamardashvili €30M)
3. **Too many sections** — HowItWorks and CtaBanner add length without conversion value
4. **Static feel** — no dynamic content to reward return visits

The redesign makes the landing page a genuine showcase of the platform's value by pulling real player/club data and featuring Georgian football success stories.

## Proposed Solution

Rewrite `src/app/(public)/page.tsx` to render 5 new sections, introduce DB queries for players and clubs, create new components (HeroPlayerSlider, ClubLogoSlider, SuccessStories), rewrite AudiencePanels and Partners, delete removed components, and update translations.

### Visual Reference

HTML mockup: `.superpowers/brainstorm/19066-1774607651/content/final-layout.html`

## Technical Considerations

### Architecture

- **`page.tsx` (server)** fetches featured players + clubs from Supabase, passes data as props to section components
- **HeroPlayerSlider** is a `'use client'` component (needs timer + state for auto-rotation)
- **ClubLogoSlider** is a server component — infinite scroll is pure CSS `@keyframes`, no JS needed
- **SuccessStories, AudiencePanels, Partners** remain server components
- `FadeInOnScroll` wrapper kept on sections 2-5 for progressive disclosure

### Data Fetching

```
page.tsx (server component)
  ├── supabase.auth.getUser() → redirect if logged in (existing)
  ├── supabase.from('players').select(...).eq('is_featured', true).limit(5) → hero slider
  └── supabase.from('clubs').select('id, name, name_ka, slug, logo_url') → club slider
```

**Caching:** Wrap both queries in Next.js `unstable_cache()` with 1-hour revalidation. Featured players and clubs change rarely — no need to hit DB on every landing page visit.

### Player Selection Strategy

Use `is_featured` boolean flag on the players table (already exists). Select up to 5 featured players ordered by name. Platform admins can flag players via the `/platform/players` interface.

**Fallback chain:**
| Condition | Behavior |
|-----------|----------|
| 0 featured players | Show static mock player card (current design, no slider) |
| 1 featured player | Show static card (no rotation, no dots) |
| 2+ featured players | Show auto-rotating slider with dots |

### Club Logo Fallbacks

| Condition | Behavior |
|-----------|----------|
| 0-2 clubs | Hide club slider section entirely |
| 3+ clubs | Show infinite CSS scroll animation |
| Club missing `logo_url` | Show first letter of club name in styled circle |

### Empty State Rationale

The production DB has 12 players and 3 clubs. With 3 clubs, the slider is viable. However, if `is_featured` isn't flagged on any player, the hero falls back gracefully to the existing static card. This ensures the page never looks broken during early production.

### CTA Destinations

> **Decision needed from Andria:** The spec says "Get Started" → `/register` and audience panel CTAs → `/register`. But the platform pivot (Sessions 1-4) changed all landing CTAs to `/demo` for a demo-first funnel. Which approach should the redesign use?
>
> **Default assumption:** Keep `/register` as spec says — the demo flow may be deprecated.

### Success Story Photos

The spec says "Use real player photos. Source during implementation." These are high-profile athletes (Kvaratskhelia, Mamardashvili) with managed image rights.

**Approach:** Use gradient backgrounds with `PlayerSilhouette` initially (matching the mockup HTML pattern). Replace with licensed photos when obtained. Store photos in `public/images/stories/` since they're static marketing assets, not user-uploaded content.

### Dark Mode

All hardcoded colors from the HTML mockup must be converted to CSS custom properties. Specific attention areas:
- Story card borders: use `border-border` not hardcoded `#EAE6DF`
- Timeline dots: use `bg-foreground-faint` for inactive, `bg-primary` for current
- Card hover shadows: use `rgba(var(--primary-rgb), 0.08)` or equivalent
- Club logo circles: use `bg-background` not hardcoded `#FDFCFA`
- Photo gradient overlays: `rgba(var(--background-rgb), 0.8)` for dark-mode compatibility

### Accessibility (WCAG 2.2.2 Compliance)

**Player slider:**
- `role="region"` with `aria-label="Featured players"` and `aria-roledescription="carousel"`
- Dot indicators as `role="tablist"` with individual `role="tab"` buttons
- Auto-rotation pauses on hover, focus, and `prefers-reduced-motion: reduce`
- Left/Right arrow keys navigate between slides
- Visible pause/play toggle (subtle, in corner)

**Club slider:**
- Pauses on hover (spec says this)
- Add `aria-hidden="true"` on the duplicate set (for seamless scroll)
- Respects `prefers-reduced-motion: reduce` — shows static row instead

### Performance

- First slide image: `priority` prop on `next/image` (LCP optimization)
- Remaining slide images: `loading="lazy"`
- Club logos: `next/image` with fixed `width={48} height={48}` to prevent CLS
- CSS scroll animation: use `transform: translateX()` (GPU-composited, not layout-triggering)
- `will-change: transform` on the scroll container

### i18n

Approximately 35-40 new translation keys needed in `src/lib/translations/landing.ts`. Key considerations:
- Georgian text is 20-40% longer — hero headline must accommodate wrapping
- `text-transform: uppercase` is a no-op for Georgian script — use `font-weight: 700` as alternative visual emphasis
- Success story club names and player names are proper nouns (not translated)
- Timeline year labels ("2017-2018") are not translated, but category words if any need both EN/KA

## Acceptance Criteria

### Section 1: Hero
- [x] Two-column grid (60/40) on desktop, stacked on mobile
- [x] Green pill badge "Elite Georgian Talent"
- [x] Headline with "Georgian Football" in green accent color
- [x] Subtitle paragraph
- [x] Two CTA buttons: primary "Get Started" + outline "Learn More"
- [x] Stats row below CTAs: 37,600+ Youth Players | €100M+ In Transfers | ✓ Verified By Starlive
- [x] Auto-rotating player slider pulling from database (`is_featured` players)
- [x] Slider shows player photo/silhouette, name, position, age, club
- [x] Dot indicators, auto-cycles every 5 seconds
- [x] Gradient overlay on player info at bottom of slider
- [x] Fallback to static mock card when 0-1 featured players exist
- [x] Pause on hover/focus, respects `prefers-reduced-motion`
- [x] Keyboard navigable (arrow keys, tab to dots)

### Section 2: Club Logo Slider
- [x] Full-width band on `bg-surface` background
- [x] "Featured Clubs" label centered, uppercase, small
- [x] Auto-scrolling infinite CSS loop of club logos from database
- [x] Circular logo containers with club logo or name initial fallback
- [x] Pauses on hover
- [x] Hidden entirely when fewer than 3 clubs exist
- [x] `aria-hidden="true"` on duplicate scroll set

### Section 3: Success Stories
- [x] Section heading "Georgian Talent on the World Stage" with green underline bar
- [x] Two-column grid of story cards (Kvaratskhelia + Mamardashvili)
- [x] Photo area with gradient overlay, name, position, Georgian flag, transfer fee in green
- [x] Vertical timeline with career path (4 stops each)
- [x] Current club highlighted with green dot + green text
- [x] Flag emoji has text alternative for accessibility
- [x] All hardcoded content via `t()` translations (except proper nouns)

### Section 4: Audience Panels
- [x] Two-column grid on `bg-surface` background
- [x] Each card: icon, title, description, 3-item checklist with green checks, CTA button
- [x] For Scouts: messaging, verified stats, shortlists — CTA links to register
- [x] For Academies: global visibility, inquiry management, verified profiles — CTA links to register
- [x] Cards stack on mobile

### Section 5: Partners
- [x] "Our Partners" label centered, uppercase, small
- [x] Free Football Agency + Starlive displayed
- [x] Reduced opacity, full opacity on hover (CSS only)
- [x] On page background (not surface)

### Cross-cutting
- [x] Dark mode works correctly on all 5 sections using CSS custom properties
- [x] All text uses `t()` with both EN and KA translations
- [x] Mobile responsive at 375px+ (all grids stack to single column)
- [x] Old components deleted: HowItWorks, SocialProof, CtaBanner, LandingCountUp (if orphaned)
- [x] Orphaned translation keys cleaned up
- [x] `npm run build` passes with zero errors
- [x] Page metadata (title, description) maintained

## Implementation Phases

### Phase 1: Foundation — Translations + Data Layer (~30 min)

**Files:** `src/lib/translations/landing.ts`, `src/app/(public)/page.tsx`

1. Add all new translation keys to `landing.ts` (EN + KA)
   - Hero: badge, headline, subtitle, CTA labels, stat values/labels
   - Club slider: section label
   - Success stories: section heading, player names/positions (proper nouns stay as-is), timeline text, transfer fees
   - Audience panels: titles, descriptions, feature items, CTA labels
   - Partners: section label, partner names
2. Add Supabase queries to `page.tsx` for featured players and clubs
3. Wrap queries in `unstable_cache()` with 1-hour revalidation
4. Define TypeScript types for the fetched data (or reuse existing `PlayerBrowseData`)

### Phase 2: Hero Section — Static + Slider (~45 min)

**Files:** `src/components/landing/LandingHero.tsx` (rewrite), new `src/components/landing/HeroPlayerSlider.tsx`

1. Rewrite `LandingHero` as server component accepting `players` prop
2. Build left column: badge, headline, subtitle, CTAs, stats row
3. Create `HeroPlayerSlider` as `'use client'` component:
   - Accepts `players` array as prop
   - State: `currentIndex`, auto-rotation via `useEffect` + `setInterval`
   - Crossfade or slide transition between players
   - Dot indicators as clickable navigation
   - Pause on hover/focus, respect `prefers-reduced-motion`
   - ARIA: `role="region"`, `aria-roledescription="carousel"`, keyboard nav
4. Fallback: render static mock card when players array is 0-1

### Phase 3: Club Slider + Success Stories (~45 min)

**Files:** new `src/components/landing/ClubLogoSlider.tsx`, new `src/components/landing/SuccessStories.tsx`

1. `ClubLogoSlider` (server component):
   - Accepts `clubs` array as prop
   - Returns null if fewer than 3 clubs
   - CSS `@keyframes scroll` animation with duplicated items
   - Circular containers: `next/image` for `logo_url`, styled initial for fallback
   - `hover:animation-play-state: paused`
   - `prefers-reduced-motion: reduce` → static row
2. `SuccessStories` (server component):
   - Hardcoded content via translations
   - Two-column grid of story cards
   - Photo area with gradient background + PlayerSilhouette (or real photo later)
   - Vertical timeline with CSS `::before` pseudo-elements for dots

### Phase 4: Audience Panels + Partners + Assembly (~30 min)

**Files:** `src/components/landing/AudiencePanels.tsx` (rewrite), `src/components/landing/Partners.tsx` (rewrite), `src/app/(public)/page.tsx`

1. Rewrite `AudiencePanels`:
   - Two cards with icon, title, description, 3-item checklist, CTA
   - All text from translations
   - CTAs link to `/register`
2. Rewrite `Partners`:
   - Simple centered layout with two partner names
   - Reduced opacity, CSS `:hover` for full opacity
3. Update `page.tsx`:
   - Import new components, pass data props
   - Remove old component imports
   - Wrap sections 2-5 in `FadeInOnScroll`
4. Delete old components:
   - `src/components/landing/HowItWorks.tsx`
   - `src/components/landing/SocialProof.tsx`
   - `src/components/landing/CtaBanner.tsx`
   - Check if `LandingCountUp.tsx` and `useInView.ts` are orphaned → delete if so

### Phase 5: Dark Mode + Responsive + Polish (~30 min)

1. Verify all 5 sections in dark mode — toggle theme and check every element
2. Test at 375px, 768px, 1024px, 1440px viewports
3. Check Georgian language mode — verify text fits, no overflow
4. Clean up orphaned translation keys from deleted sections
5. Run `npm run build` — fix any TypeScript errors
6. Visual verification via Playwright MCP screenshots

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No featured players flagged in DB | Medium | Hero shows static card (graceful) | Flag 3-5 players as featured after deploy |
| Only 3 clubs in DB (minimum for slider) | Low | Slider works but sparse | Looks fine with 3+, hidden below 3 |
| Success story photos unavailable | High | Silhouettes instead of real photos | Gradient backgrounds make silhouettes look intentional |
| Georgian headline overflows | Medium | Layout push on mobile | Test with KA text, use `max-w` and responsive font sizes |
| CTA destination conflict (demo vs register) | High | Wrong user funnel | Flagged for Andria's decision above |

## Sources & References

- **Design spec:** [docs/superpowers/specs/2026-03-27-landing-page-redesign-design.md](../superpowers/specs/2026-03-27-landing-page-redesign-design.md)
- **HTML mockup:** `.superpowers/brainstorm/19066-1774607651/content/final-layout.html`
- **Current hero:** `src/components/landing/LandingHero.tsx`
- **Current landing page:** `src/app/(public)/page.tsx`
- **Landing translations:** `src/lib/translations/landing.ts`
- **Theme tokens:** `src/app/globals.css` (`:root` and `[data-theme="dark"]`)
- **Player types:** `src/lib/types.ts` (`PlayerBrowseData`)
- **Constants:** `src/lib/constants.ts` (`POSITION_COLOR_CLASSES`)
- **Learnings:** `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` (dual-theme scoping)
- **Learnings:** `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md` (i18n violations, mobile viewport)
