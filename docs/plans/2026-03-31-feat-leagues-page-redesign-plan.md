---
title: Leagues Page Redesign — Editorial Showcase
type: feat
status: completed
date: 2026-03-31
origin: docs/superpowers/specs/2026-03-31-leagues-page-redesign-design.md
deepened: 2026-03-31
---

# Leagues Page Redesign — Editorial Showcase

## Enhancement Summary

**Deepened on:** 2026-03-31
**Agents used:** Frontend Design, Architecture Strategist, Performance Oracle, Data Integrity Guardian, Security Sentinel, Pattern Recognition, Code Simplicity, Best Practices Researcher, Framework Docs Researcher, Learnings Researcher

### Key Improvements
1. **Renamed "Bento" components** to domain-oriented names — codebase never names components after layout implementation
2. **Merged 3 card components into 1** — `LeagueShowcaseCard` with `variant` prop reduces files and consolidates shared markup
3. **Fixed DB migration** — added CHECK constraints, HTTPS enforcement, pair constraint on dates, photo_url length limit
4. **Fixed Zod validation** — date format regex, object-level `.refine()`, empty string → null transform
5. **Security hardening** — CSP `img-src` gap fixed, domain allowlist on photo_url, HTTPS enforcement on logo_url
6. **Performance additions** — ISR caching, per-page Noto Serif font, `content-visibility: auto`, image `sizes` patterns, AVIF format
7. **Translation strategy** — each server component calls `getServerT()` independently, never pass `t` as prop across files
8. **Photo collage technique** — CSS Grid overlap instead of absolute positioning (more robust responsive behavior)
9. **Hover pattern** — photo zoom within card instead of card scale for tall photo cards (avoids layout shift)
10. **WCAG AA fix** — use `--primary-hover` (#15703C) for green card/CTA backgrounds (4.8:1 → 6.5:1 contrast with white)

### Simplicity Considerations
The simplicity review flagged the Season Calendar as low-value (3 nearly identical Sep-May bars) and the 5-branch bento layout as YAGNI (only 3 leagues in production). **Decision:** Keep both per the approved design spec, but implement the calendar with a data-driven axis (not hardcoded Sep-May) and the bento layout as an extracted pure function for testability. If the calendar proves useless in practice, it can be removed without affecting other sections.

---

## Overview

Transform `/leagues` from a minimal 3-card grid into a premium editorial showcase with cinematic imagery, a dynamic bento layout, and supporting sections (How It Works, Season Calendar, CTA Banner). The page lives in `(shared)/` route group — accessible to everyone, with nav chrome varying by auth state.

**Design spec:** `docs/superpowers/specs/2026-03-31-leagues-page-redesign-design.md`
**Visual mockup:** `.superpowers/brainstorm/55746-1774956962/content/08-full-design.html`

## Problem Statement / Motivation

The current `/leagues` page (36 lines, flat card grid with trophy SVGs) is the primary platform entry point — `/players/*` and `/matches/*` redirect here. It needs to match the editorial quality of the redesigned landing page and convert visiting scouts into demo requesters.

## Proposed Solution

5-section editorial page built entirely with server components:

1. **Hero Intro** — Two-column: headline + description (left), overlapping photo collage with Starlive badge (right)
2. **League Showcase Grid** — Layout algorithm adapts to 1–5+ leagues with 3 card variants (Hero/Warm/Green)
3. **How It Works** — 3-step horizontal flow (Browse → Watch → Connect)
4. **Season Calendar** — Gantt-style timeline bars color-coded by age group
5. **CTA Banner** — Green banner with "Request a Demo" (swaps to role-appropriate CTA for authenticated users)

## Implementation Phases

### Phase 1: Database & Foundation

**Migration: Add 3 columns to `leagues` table**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_league_photo_and_season_dates.sql
alter table leagues add column photo_url text;
alter table leagues add column season_start date;
alter table leagues add column season_end date;

-- CHECK constraints (research insight: application validation alone is insufficient)
alter table leagues add constraint leagues_photo_url_https
  check (photo_url is null or photo_url ~ '^https://');
alter table leagues add constraint leagues_photo_url_length
  check (photo_url is null or length(photo_url) <= 2048);
alter table leagues add constraint leagues_season_dates_check
  check (
    (season_start is null and season_end is null)
    or (season_start is not null and season_end is not null and season_start < season_end)
  );

-- Also fix existing gap: logo_url lacks HTTPS constraint
alter table leagues add constraint leagues_logo_url_https
  check (logo_url is null or logo_url ~ '^https://');

-- Seed existing leagues with placeholder dates
update leagues set season_start = '2025-09-01', season_end = '2026-05-31'
  where age_group = 'U19';
update leagues set season_start = '2025-09-01', season_end = '2026-04-30'
  where age_group = 'U17';
update leagues set season_start = '2025-10-01', season_end = '2026-04-30'
  where age_group = 'U15';
```

> **Research insight (Data Integrity):** The pair constraint ensures `season_start` and `season_end` are always both NULL or both non-NULL, preventing inconsistent partial data. The `season` text column remains as a display label; `season_start`/`season_end` are the queryable date range. Document this dual-source-of-truth in code comments.

> **Research insight (Security):** Existing `logo_url` lacks HTTPS enforcement — add the CHECK in this migration opportunistically. Restrict `photo_url` domain allowlist in Zod too (see below).

**Update validation schema** (`src/lib/validations.ts`):

```typescript
// photo_url — HTTPS enforced, domain-restricted, empty → null
photo_url: z.union([
  z.string().url().refine(
    (url) => url.startsWith('https://'),
    'URL must use HTTPS'
  ),
  z.literal('')
]).optional().transform(v => v || undefined),

// season_start / season_end — date format validated
season_start: z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  z.literal('')
]).optional().transform(v => v || undefined),

season_end: z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  z.literal('')
]).optional().transform(v => v || undefined),
```

Add object-level cross-field validation:

```typescript
.refine(
  (data) => {
    if (data.season_start && data.season_end) {
      return new Date(data.season_start) < new Date(data.season_end);
    }
    return true;
  },
  { message: 'Season start must be before season end', path: ['season_end'] }
)
```

> **Research insight (Security):** Also add `.refine()` for HTTPS on `logo_url` in the existing schema — matches the new CHECK constraint.

**Update platform admin form** (`src/components/platform/LeagueForm.tsx`):
- Add `photo_url` URL text input
- Add `season_start` and `season_end` date inputs (`<input type="date">`)
- Update `createLeague` and `updateLeague` server actions in `src/app/actions/platform-leagues.ts`
- Transform empty strings to `null` before DB insertion

**Update CSP and image config** (`next.config.ts`):
- Add `https://api.starliveball.com` to CSP `img-src` directive (currently missing)
- Add pathname restriction to existing `remotePatterns`:
  ```ts
  { protocol: 'https', hostname: 'jodnjhqnoawsxigrxqgv.supabase.co', pathname: '/storage/v1/object/public/**' }
  ```
- Enable AVIF format: `images: { formats: ['image/avif', 'image/webp'] }`

**Regenerate types:** `npx supabase gen types typescript --local > src/lib/database.types.ts`

**Files:**
- `supabase/migrations/YYYYMMDDHHMMSS_add_league_photo_and_season_dates.sql` (new)
- `src/lib/validations.ts` (edit leagueFormSchema + add logo_url HTTPS refine)
- `src/components/platform/LeagueForm.tsx` (add 3 fields)
- `src/app/actions/platform-leagues.ts` (persist new fields, empty→null transform)
- `next.config.ts` (CSP img-src, remotePatterns pathname, AVIF)
- `src/lib/database.types.ts` (regenerated)

### Phase 2: Translations

Add ~22 new translation keys to `src/lib/translations/core.ts` under the `leagues` namespace (both EN and KA simultaneously):

```
leagues.hero.eyebrow
leagues.hero.title
leagues.hero.titleAccent
leagues.hero.description
leagues.hero.badgeMain
leagues.hero.badgeSub
leagues.howItWorks.title
leagues.howItWorks.step1Title
leagues.howItWorks.step1Desc
leagues.howItWorks.step2Title
leagues.howItWorks.step2Desc
leagues.howItWorks.step3Title
leagues.howItWorks.step3Desc
leagues.calendar.title
leagues.calendar.subtitle
leagues.cta.title
leagues.cta.subtitle
leagues.cta.button
leagues.cta.buttonAuth
leagues.bento.viewOnStarlive
leagues.bento.pixellotTracked
leagues.bento.clubsCount
leagues.bento.matchesCount
```

> **Research insight (Learnings):** Never use fallback strings (`t('key') ?? 'English fallback'`). If you write a fallback, the key is missing — add it to translations.ts instead. Add EN + KA simultaneously before using any key. Utility functions producing display text must accept `t` as a parameter.

**Files:**
- `src/lib/translations/core.ts` (add ~22 keys in both en and ka objects)

### Phase 3: CSS & Styling

Add new CSS classes to `globals.css`. Use **semantic, domain-agnostic names** (not "bento" — the codebase names classes by function, not layout implementation).

> **Research insight (Pattern Recognition):** The codebase uses `.card`, `.card-enhanced`, `.filter-chip`, `.section-header` — all semantic names. Renamed from `.bento-hero-card` → `.league-showcase`, `.bento-card-warm/green` → variants via CSS custom properties.

**New CSS classes (wrapped in `@layer components` to allow Tailwind overrides):**

```css
@layer components {
  /* Photo-driven league card with gradient overlay */
  .league-showcase {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .league-showcase:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
  /* Photo zoom on hover — not card scale (avoids layout shift on tall cards) */
  @media (hover: hover) {
    .league-showcase .league-photo {
      transition: transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .league-showcase:hover .league-photo {
      transform: scale(1.04);
    }
  }

  /* Season calendar bar */
  .calendar-bar {
    border-radius: 9999px;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--btn-primary-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Dot-grid texture overlay (radial-gradient, theme-aware) */
  .dot-texture {
    background-image: radial-gradient(
      circle,
      var(--foreground-faint) 0.75px,
      transparent 0.75px
    );
    background-size: 20px 20px;
    opacity: 0.15;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .league-showcase, .league-showcase .league-photo {
    transition: none !important;
  }
}
```

> **Research insight (Frontend Design):** Use photo zoom within the card on hover instead of `scale(1.005)` on the entire card. For 360px+ tall photo cards, full-card scale causes noticeable layout shift and looks cheap. Photo-zoom-within is the correct editorial pattern.

> **Research insight (Best Practices):** For dot-grid texture, use CSS `radial-gradient` with `var(--foreground-faint)` — automatically theme-aware, no SVG, no extra files. Use sparingly (CTA banner only, not every card).

> **Research insight (Performance):** Add `content-visibility: auto` on below-fold sections to skip rendering until near viewport:
> ```css
> .section-below-fold {
>   content-visibility: auto;
>   contain-intrinsic-size: auto 600px;
> }
> ```

**Photo collage — use CSS Grid overlap, not absolute positioning:**

```css
/* CSS Grid overlap is more robust for responsive behavior than absolute positioning */
.photo-collage {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: 1fr 1fr;
}
```

> **Research insight (Best Practices):** CSS Grid overlap keeps images in document flow. Both images sit in the same grid area with overlapping column ranges; `z-index` controls stacking. On mobile, collapse to single column — the collage does not work below 768px.

**Files:**
- `src/app/globals.css` (add ~40 lines of new component styles in `@layer components`)

### Phase 4: Font Loading & Components — Static Sections

**Load Noto Serif per-page** (not globally — only used on /leagues):

```tsx
// In src/app/(shared)/leagues/page.tsx
import { Noto_Serif } from 'next/font/google'

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-serif',
})
```

> **Research insight (Performance):** Loading Noto Serif globally wastes ~25KB on every non-leagues page. Per-page loading with `display: 'swap'` prevents FOIT. Do NOT apply serif to Georgian text — Georgian script needs Noto Sans Georgian which is already loaded globally.

> **Research insight (Frontend Design):** Conditional font class: `className={lang === 'ka' ? 'font-sans' : 'font-serif'}` for headlines.

**Build the static sections:**

**`src/components/league/LeagueHero.tsx`** (server component):
- Calls `getServerT()` independently (not receiving `t` as prop)
- Two-column layout: headline + description (left), photo collage (right)
- Eyebrow: green, uppercase, letter-spaced
- Headline: Noto Serif for English, Noto Sans Georgian for KA, 44px, "Georgian Talent" in green italic
- Photo collage: CSS Grid overlap technique (large photo cols 4-12, accent photo cols 1-7 overlapping)
- `border-4 border-background` on overlapping photo creates cut-out effect
- Floating green badge: "Powered by Starlive / Pixellot Camera Systems"
- Photos: static assets in `/public/images/leagues/` initially (placeholder gradient until Andria provides)
- Mobile (<768px): single centered photo, no overlap

**`src/components/league/HowItWorks.tsx`** (server component):
- Calls `getServerT()` independently
- 3 steps horizontal row (stack on mobile)
- Editorial oversized serif numerals bleeding behind content (not generic green circles)
- Steps connected by thin horizontal lines between circles
- All text via `t()` translations

**`src/components/league/LeagueCTA.tsx`** (server component):
- Calls `getServerT()` independently
- **Use `bg-primary-hover` (#15703C)** for the green background — WCAG AA safe (6.5:1 contrast with white vs 4.8:1 for `bg-primary`)
- Rounded banner with dot-grid texture overlay (sparingly — only here)
- Button: "Request a Demo" (white bg, green text) → `/demo`
- **Auth-aware:** Accept `isLoggedIn` prop — swap CTA text/link for authenticated users
- All text via `t()`

> **Research insight (Architecture):** Each server component must call `getServerT()` independently — the `t` function is a closure and NOT serializable across async server component boundaries. This matches the established pattern in `SuccessStories.tsx`, `Partners.tsx`, `LeagueCard.tsx`.

**Files:**
- `src/components/league/LeagueHero.tsx` (new)
- `src/components/league/HowItWorks.tsx` (new)
- `src/components/league/LeagueCTA.tsx` (new)

### Phase 5: Components — Dynamic Sections

**`src/components/league/LeagueShowcase.tsx`** (server component):

> **Research insight (Pattern Recognition):** Renamed from `BentoLeagueGrid` — codebase names components by domain, not layout. "Bento" is an implementation detail.

- Calls `getServerT()` independently
- Accepts `leagues` array
- **Layout via extracted pure function** for testability:

```typescript
type CardSlot = {
  league: League
  variant: 'hero' | 'warm' | 'green'
  span: 'full' | 'narrow' | 'wide'
}

function computeLeagueLayout(leagues: League[]): CardSlot[]
```

- Layout algorithm based on league count:
  - 0 leagues: empty state message
  - 1: full-width hero card
  - 2: hero (full-width) + 1 card below
  - 3: hero (full-width) + row of 2 (5:7 ratio)
  - 4: hero + row of 2 + 1 full-width
  - 5+: hero + row of 2 + additional rows (alternating ratios)
- First league → Hero variant; remaining alternate Warm/Green
- Renders `LeagueShowcaseCard` sub-components

> **Research insight (Best Practices):** CSS `:has()` + `:nth-last-child()` can auto-detect child count for pure-CSS bento grids. Browser support is universal since Dec 2023. However, the extracted pure function approach gives more control over variant assignment.

**`src/components/league/LeagueShowcaseCard.tsx`** (server component):

> **Research insight (Simplicity):** Merged `BentoHeroCard` + `BentoLeagueCard` into a single component with `variant: 'hero' | 'warm' | 'green'` prop. All three share: age-group badge, league name, meta line, "View on Starlive" link. The hero variant adds photo background + gradient; warm/green differ only in bg/text color.

- Accepts `variant: 'hero' | 'warm' | 'green'` and `league` props
- Calls `getServerT()` independently
- **Hero variant:** min-height 380px, league photo background via `fill` + `object-cover`, dark gradient overlay (`from-black/90 via-black/40 to-transparent`), white text, hover: photo zoom within card
- **Warm variant:** `bg-surface`, dark text, no texture
- **Green variant:** `bg-primary-hover` (#15703C for WCAG AA), white text
- Age group badge (existing `AGE_GROUP_COLOR_CLASSES`)
- Entire card is `<a href={starlive_url} target="_blank" rel="noopener noreferrer">`
- Fallback if no `photo_url` on hero: dark gradient with age-group accent color

> **Research insight (Frontend Design):** On hero cards, text hierarchy: `text-white` for headings, `text-white/70` minimum for body text. Never go below `text-white/60` on dark gradients.

**`src/components/league/SeasonCalendar.tsx`** (server component):
- Calls `getServerT()` independently
- Title: "Season Calendar" (Noto Serif, centered)
- **Data-driven axis** — derive range from `Math.min(...starts)` to `Math.max(...ends)` with month granularity, not hardcoded Sep-May

> **Research insight (Architecture):** Hardcoded Sep-May breaks silently if any league runs outside that window. Data-driven axis costs a few extra lines and prevents this.

- CSS Grid: `grid-template-columns: 140px repeat(N, 1fr)` where N = months in range
- Bar positioning via `grid-column: start / end` calculated server-side
- Bar color: age group color from `AGE_GROUP_COLOR_CLASSES`
- If no leagues have season dates: hide entire section
- Mobile: `overflow-x-auto` with `min-w-[600px]` inner container (horizontal scroll)

> **Research insight (Best Practices):** CSS Grid Gantt approach — bars use `gridColumn: "start / end"` for percentage-based positioning without JS. Rounded ends (`rounded-full`) make bars feel intentional.

**Files:**
- `src/components/league/LeagueShowcase.tsx` (new — renamed from BentoLeagueGrid)
- `src/components/league/LeagueShowcaseCard.tsx` (new — merged from BentoHeroCard + BentoLeagueCard)
- `src/components/league/SeasonCalendar.tsx` (new)

### Phase 6: Page Assembly & Polish

**Rewrite `src/app/(shared)/leagues/page.tsx`:**
- Server component, fetch active leagues ordered by `display_order`
- **Own auth check** (can't inherit from layout — layout check is not shared with page children):
  ```tsx
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
  ```
- **ISR caching** for performance:
  ```tsx
  export const revalidate = 300 // 5 minutes — leagues change infrequently
  ```
- Load Noto Serif per-page with `variable` CSS prop
- Compose sections wrapped in `FadeInOnScroll` with staggered delays (0, 50, 100, 150, 200):
  `LeagueHero` → `LeagueShowcase` → `HowItWorks` → `SeasonCalendar` → `LeagueCTA`
- **Consistent section spacing:** `py-16 sm:py-24` on all sections
- **Alternating backgrounds:** default → `bg-surface` → default → `bg-surface` → `bg-primary-hover` (CTA)
- **Below-fold sections** get `content-visibility: auto` for paint optimization
- Update `Metadata` export with proper title, description, OG tags:
  ```tsx
  export const metadata: Metadata = {
    title: 'Leagues',
    description: 'Discover Georgian youth football leagues tracked by Pixellot cameras.',
    openGraph: {
      title: 'Georgian Youth Leagues | Binocly',
      description: 'Browse U15, U17, and U19 leagues with verified camera statistics.',
    },
  }
  ```

> **Research insight (Performance):** ISR with `revalidate = 300` eliminates Supabase round-trip for cached requests. TTFB drops from ~100-200ms to ~5-10ms on Vercel edge. The existing `revalidatePath('/leagues')` in admin actions already handles on-demand invalidation.

**Add `error.tsx`** (must be `'use client'`):
- Graceful error boundary with retry option

**Skip `loading.tsx`:**
> **Research insight (Simplicity):** The page makes a single indexed query against ~3-5 rows — completes in single-digit ms. A skeleton adds maintenance burden (must update when layout changes) and will never be visible to users.

**Keep existing `LeagueCard.tsx`** — still used by the scout dashboard.

**Files:**
- `src/app/(shared)/leagues/page.tsx` (complete rewrite)
- `src/app/(shared)/leagues/error.tsx` (new — `'use client'`)

## Technical Considerations

### Architecture
- All new components are **server components** — no `'use client'` needed
- Each component calls `getServerT()` independently — no `t` prop passing across file boundaries
- Layout algorithm extracted as a pure function (`computeLeagueLayout`) — independently testable
- Photo collage uses CSS Grid overlap (not absolute positioning)
- Season Calendar bar positioning calculated server-side with `gridColumn` — pure CSS Grid, no JS

### Performance
- **ISR caching:** `revalidate = 300` on the page — 5-minute cache for near-instant TTFB
- **Image priority:** `priority` on 2-3 above-fold images (collage main + hero card), `loading="lazy"` for rest
- **Image sizes:** Breakpoint-aware `sizes` prop on every `next/image`:
  - Collage main: `sizes="(max-width: 768px) 100vw, 400px"`
  - Collage accent: `sizes="160px"`
  - Hero card (full-width): `sizes="(max-width: 768px) 100vw, 50vw"`
  - Row cards: `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`
- **AVIF format:** Enable in `next.config.ts` for 20% smaller images
- **`content-visibility: auto`** on How It Works, Calendar, CTA sections — browser skips rendering until near viewport
- **Font loading:** Noto Serif per-page with `display: 'swap'`, not globally
- **Hover animations:** Photo zoom uses compositor-friendly `transform` only, `@media (hover: hover)` guard
- **`prefers-reduced-motion: reduce`** disables all transitions
- Use `BLUR_DATA_URL` from constants for image placeholders
- Only 1 DB query needed — all sections derive from same data

### Image Strategy
- Hero collage photos: static assets in `/public/images/leagues/` (Andria provides)
- League card photos: `photo_url` column (URL — consistent with existing `logo_url` pattern)
- **Prefer Supabase Storage** over external hotlinks for permanence and CSP compliance
- Fallback if no `photo_url`: dark gradient with age-group accent color
- If external host needed, add to both `remotePatterns` AND CSP `img-src` (with explicit `https://`)
- Use `next/image` with `fill` mode for card backgrounds, explicit `width`/`height` for collage

### Security
- **CSP `img-src`:** Add `https://api.starliveball.com` (currently missing)
- **photo_url HTTPS enforcement:** DB CHECK + Zod `.refine()`
- **logo_url HTTPS enforcement:** DB CHECK + Zod `.refine()` (fixing existing gap)
- **photo_url length limit:** 2048 chars at DB level
- **Domain restriction:** Validate photo_url hostname in Zod against allowlist (Supabase, Starlive)
- **External links:** `rel="noopener noreferrer"` on all `target="_blank"` links
- **No `dangerouslySetInnerHTML`:** All content rendered through React JSX (auto-escaped)
- **Auth state:** Only `isLoggedIn` boolean passed to CTA — no sensitive data leaked

### Data Edge Cases
- 0 leagues: show empty state in showcase section, hide calendar
- Missing `photo_url`: Hero card uses gradient fallback; row cards unaffected
- Missing `season_start`/`season_end`: league excluded from calendar (pair constraint ensures both or neither)
- Missing `description`: card renders without description text
- `season` text vs `season_start`/`season_end`: `season` is display label, dates are for calendar positioning

## Acceptance Criteria

### Functional
- [x] Hero Intro section renders with headline, description, photo collage, Starlive badge
- [x] League showcase displays correct layout for 1, 2, 3, 4, and 5+ leagues
- [x] Hero card variant shows photo background with gradient overlay and photo-zoom hover
- [x] Warm and Green card variants render correctly with proper styling
- [x] All cards link to `starlive_url` (external, new tab, `rel="noopener noreferrer"`)
- [x] How It Works section shows 3 connected steps with editorial numbering
- [x] Season Calendar renders Gantt bars for leagues with dates (data-driven axis)
- [x] Calendar hides when no leagues have season dates
- [x] CTA banner shows "Request a Demo" for anonymous visitors
- [x] CTA banner shows role-appropriate action for authenticated users
- [x] CTA uses `--primary-hover` background (WCAG AA compliant)
- [x] All text bilingual (EN/KA) via `t()` translations — no hardcoded strings
- [x] Platform admin can set `photo_url`, `season_start`, `season_end` in league form
- [x] Empty state displays gracefully when 0 leagues exist
- [x] DB CHECK constraints enforce: HTTPS on photo_url/logo_url, season date pair + order

### Non-Functional
- [x] All colors use CSS custom properties — no hardcoded hex in components
- [x] Responsive: works at 375px, 768px, 1024px+
- [x] `next/image` used for all photos with proper `sizes` and `priority`
- [x] CSP `img-src` includes all image source domains with `https://`
- [x] Noto Serif loaded per-page, not globally; Georgian text uses sans-serif
- [x] `content-visibility: auto` on below-fold sections
- [x] `prefers-reduced-motion: reduce` respected
- [x] Error boundary with retry (`error.tsx`)
- [x] OG metadata (title, description) for social sharing
- [x] `npm run build` passes clean
- [x] ISR caching active (`revalidate = 300`)

## Component Architecture (Final)

```
src/components/league/
  LeagueCard.tsx            (existing — keep for dashboard, NOT modified)
  LeagueHero.tsx            (new — hero intro section)
  LeagueShowcase.tsx        (new — grid layout + computeLeagueLayout())
  LeagueShowcaseCard.tsx    (new — unified card with variant prop)
  HowItWorks.tsx            (new — 3-step section)
  SeasonCalendar.tsx        (new — Gantt-style timeline)
  LeagueCTA.tsx             (new — auth-aware CTA banner)
```

**Total: 6 new files** (reduced from 7 by merging card variants)

## Dependencies & Risks

- **Photos from Andria:** Hero collage photos need to be sourced. Use placeholder gradients until provided.
- **Georgian translations:** KA translations for ~22 keys need review.
- **`remotePatterns` in `next.config.ts`:** If league photos are external, domain must be in both `remotePatterns` AND CSP `img-src`.
- **Existing `LeagueCard.tsx`:** Must NOT be removed — used by scout dashboard.
- **Redirects:** `/players/*` and `/matches/*` redirect to `/leagues` — this page is a high-traffic landing point.
- **Noto Serif Georgian:** If Georgian headlines need serif, requires separate `Noto_Serif_Georgian` font (additional ~25KB). Start with sans-serif for Georgian.

## Sources & References

- **Design spec:** [docs/superpowers/specs/2026-03-31-leagues-page-redesign-design.md](docs/superpowers/specs/2026-03-31-leagues-page-redesign-design.md)
- **Visual mockup:** `.superpowers/brainstorm/55746-1774956962/content/08-full-design.html`
- **Current leagues page:** `src/app/(shared)/leagues/page.tsx` (36 lines)
- **Current league card:** `src/components/league/LeagueCard.tsx` (91 lines)
- **Leagues DB schema:** `supabase/migrations/20250101000045_create_leagues_table.sql`
- **Age group colors:** `src/lib/constants.ts:7-11` (`AGE_GROUP_COLOR_CLASSES`)
- **Landing page patterns:** `src/app/(public)/page.tsx` (section composition reference)
- **Platform admin league form:** `src/components/platform/LeagueForm.tsx`
- **Server actions:** `src/app/actions/platform-leagues.ts`
- **Past learnings:** `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md`, `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`
- **CSS Grid bento:** [Neue Bento Layouts - Adam Argyle](https://nerdy.dev/neue-bento-layouts-with-grid-has-and-container-queries/)
- **CSS Grid Gantt:** [freeCodeCamp Gantt Guide](https://www.freecodecamp.org/news/create-gantt-chart-using-css-grid/)
- **Photo collage technique:** [Bri Camp Gomez - CSS Grid overlap](https://bricampgomez.com/blog/how-to-overlap-images-in-css/)
