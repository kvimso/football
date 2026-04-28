---
title: Fix Landing Page Review Findings
type: fix
status: completed
date: 2026-03-30
---

# Fix Landing Page Review Findings

## Overview

Address 25 findings from the comprehensive landing page code review (13 P2, 12 P3). All findings are on `feat/landing-page-redesign` branch. No critical blockers, but the P2 items should be resolved before merging.

## Phase 1: Branding, i18n & Dead Code (Quick Wins)

**Estimated: ~20 min | Files: 7 | Impact: High**

### 1.1 Fix branding: "GFT" → "Binocly"

CLAUDE.md says: "The startup name is Binocly — use this in all user-facing branding and copy."

- [ ] `src/components/landing/LandingNav.tsx:49` — Change logo text from `GFT` to `Binocly`
- [ ] `src/components/landing/LandingFooter.tsx:14` — Same change

### 1.2 Fix hardcoded strings bypassing i18n

- [ ] `src/components/landing/LandingHero.tsx:89` — Replace `lang === 'ka' ? 'დამოწმებული' : 'Verified'` with `t('landing.statsVerified')` (key already exists in translations)
- [ ] `src/components/landing/HeroPlayerSlider.tsx:71` — Replace `aria-label="Featured players"` with translated string
- [ ] `src/components/landing/HeroPlayerSlider.tsx:113,121` — Replace `"Slides"` and `"Slide ${i+1}"` with translated strings
- [ ] `src/components/landing/LandingNav.tsx:103` — Replace `'Close menu'`/`'Open menu'` with translated strings
- [ ] `src/components/landing/SuccessStories.tsx:29,49` — Add translation keys for position labels (`'Left Winger'`, `'Goalkeeper'`)
- [ ] `src/lib/translations/landing.ts` — Add missing i18n keys for all above (both en and ka)

**Note:** Player names (Kvaratskhelia, Mamardashvili) and club names in timeline are proper nouns — leave untranslated. Partner brand names (FREE FOOTBALL AGENCY, STARLIVE) are also intentional.

### 1.3 Remove dead code: MockPlayerCard

`DEMO_SLIDER_PLAYERS` always has 4 items, so `showStaticCard` is always false.

- [ ] `src/components/landing/LandingHero.tsx` — Remove:
  - Lines 3: `PlayerSilhouette` import (only used by MockPlayerCard)
  - Lines 19-20: `showSlider`/`showStaticCard` variables
  - Lines 100-107: Three-way ternary → replace with direct `<HeroPlayerSlider players={players} />`
  - Lines 115-192: Entire `MockPlayerCard` function (~77 lines)
- [ ] `src/lib/translations/landing.ts` — Remove 8 dead mock-card translation keys from both en and ka:
  `mockPlayerName`, `mockPosition`, `mockAge`, `mockClub`, `verifiedStats`, `mockGoals`, `mockAssists`, `mockMatches`

### 1.4 Remove other dead code

- [ ] `src/components/landing/SuccessStories.tsx:109-112` — Remove unreachable photo fallback (both stories have hardcoded photos)
- [ ] `src/components/landing/SuccessStories.tsx:136` — Remove redundant `style={{ alignItems: 'stretch' }}` (CSS grid default)

### 1.5 Clean up orphaned translation keys

- [ ] `src/lib/translations/landing.ts` — Remove 7 unused footer keys from both en and ka:
  `footerBrowsePlayers`, `footerMatchLibrary`, `footerClubDirectory`, `footerCreateAccount`, `footerMyDashboard`, `footerShortlist`, `footerManagePlayers`

### 1.6 Fix hardcoded hex color

- [ ] `src/components/landing/SuccessStories.tsx:131` — Replace `text-[#4ADE80]` with `text-primary` (or a white/bright text appropriate for dark overlay context)

## Phase 2: Type Safety & Code Quality

**Estimated: ~15 min | Files: 5 | Impact: Medium**

### 2.1 Move types out of page.tsx

Components should not import upward from route files.

- [ ] Create `src/components/landing/types.ts` with `FeaturedPlayer` and `FeaturedClub` interfaces
- [ ] Update imports in `LandingHero.tsx`, `HeroPlayerSlider.tsx`, `ClubLogoSlider.tsx`
- [ ] Update `page.tsx` to import from the new types file instead of defining locally

### 2.2 Remove unsafe `as` cast

- [ ] `src/app/(public)/page.tsx:94` — Remove `(clubs as FeaturedClub[])` cast. Let Supabase return type flow through, or map explicitly. The `.select('id, name, name_ka, slug, logo_url')` return type should match `FeaturedClub`.

### 2.3 Replace duplicated getAge utility

- [ ] `src/components/landing/HeroPlayerSlider.tsx:8-14` — Delete local `getAge` function, import `calculateAge` from `@/lib/utils` instead (11 other files already use it)

## Phase 3: Image Optimization

**Estimated: ~15 min | Files: 3 | Impact: High (LCP)**

### 3.1 Lazy-load non-active slider images

- [ ] `src/components/landing/HeroPlayerSlider.tsx:80-97` — Only render `<Image>` for current slide and adjacent slides (or add `loading="lazy"` to non-first slides). Currently all 4 images load eagerly (~2-3MB wasted bandwidth).

### 3.2 Convert oversized PNGs to JPEG

- [ ] `public/images/landing/slider-1.png` (1.1MB) → Convert to JPEG quality 85
- [ ] `public/images/landing/slider-2.png` (947KB) → Convert to JPEG quality 85
- [ ] Update references in `DEMO_SLIDER_PLAYERS` to use `.jpg` extension

### 3.3 Add lazy loading to below-fold images

- [ ] `src/components/landing/SuccessStories.tsx:101-108` — Add `loading="lazy"` to both success story images (~1.2MB combined, below fold)

### 3.4 Add sizes attribute to club logos

- [ ] `src/components/landing/ClubLogoSlider.tsx:35-41` — Add `sizes="48px"` to club logo `<Image>` tags

## Phase 4: Performance

**Estimated: ~10 min | Files: 2 | Impact: Medium (TTFB)**

### 4.1 Skip auth check for anonymous visitors

- [ ] `src/app/(public)/page.tsx:69-82` — Check for `sb-` auth cookie before calling `supabase.auth.getUser()`. If no cookie → user is not logged in, skip the API call. Saves ~50-150ms TTFB for every anonymous visitor.

### 4.2 Cache club query (optional)

- [ ] `src/app/(public)/page.tsx:85-88` — Wrap in `unstable_cache` with 60s revalidation. Club data changes rarely. Saves ~30-80ms per request.

## Phase 5: Security Hardening

**Estimated: ~5 min | Files: 1 | Impact: Low (defense-in-depth)**

### 5.1 Tighten CSP

- [ ] `next.config.ts` — Add `"object-src 'none'"` to CSP directives
- [ ] `next.config.ts` — Restrict `remotePatterns` hostname from `*.supabase.co` to `jodnjhqnoawsxigrxqgv.supabase.co` (project-specific)

## Phase 6: Accessibility (P3)

**Estimated: ~5 min | Files: 1 | Impact: Low**

### 6.1 Add aria-live for slider

- [ ] `src/components/landing/HeroPlayerSlider.tsx` — Add `aria-live="polite"` region to announce slide changes to screen readers

## Acceptance Criteria

- [ ] `npm run build` passes cleanly
- [ ] No hardcoded English/Georgian strings outside `t()` (excluding proper nouns)
- [ ] Logo displays "Binocly" everywhere
- [ ] No `as` type casts on Supabase query results
- [ ] No dead code (MockPlayerCard removed, orphaned translations cleaned)
- [ ] Slider images lazy-loaded (only active slide loads eagerly)
- [ ] Types live in `src/components/landing/types.ts`, not `page.tsx`
- [ ] Both light and dark themes render correctly
- [ ] Georgian translations complete for all new keys

## Execution Notes

- Phases 1-2 are pure code cleanup — no visual changes, fast to verify
- Phase 3 has visual impact — verify slider still crossfades smoothly after lazy-load changes
- Phase 4 auth cookie check should be tested with both logged-in and anonymous users
- Phase 5 CSP changes should be tested on Vercel preview deployment
- Run `npm run build` after each phase
