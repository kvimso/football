---
title: Landing Page — Full Editorial Rewrite
type: feat
status: completed
date: 2026-04-15
mockup: .superpowers/brainstorm/21190-1776256254/content/landing-with-variants.html
mockup_mirror: .superpowers/brainstorm/18402-1776251410/content/landing-with-variants.html
preview: http://localhost:56431/
supersedes:
  - docs/plans/2026-03-27-feat-landing-page-redesign-plan.md
  - docs/plans/2026-03-27-feat-success-stories-redesign-plan.md
  - docs/plans/2026-03-30-fix-landing-page-review-findings-plan.md
  - docs/plans/2026-04-15-feat-what-we-offer-bento-plan.md
---

# Landing Page — Full Editorial Rewrite

## Overview

Replace `src/app/(public)/page.tsx` and every component under `src/components/landing/` with a new editorial landing page: Nav → Hero → Market Pulse → Success Stories → Manifesto → What We Offer → Footer. Cream-background (`#FDFCFA`), forest-green accent (`#1B8A4A`), Noto Serif for headlines, Inter for body. English only. Light theme only.

The mockup at `.superpowers/brainstorm/21190-1776256254/content/landing-with-variants.html` is the source of truth — it's the version served at `http://localhost:56431/` and the one reviewed this session (Hero Top Bento, 37,600 youth players, "The direct line", all 7 visual fixes). The mirror at `18402-1776251410` is byte-identical and kept as a working copy.

## Enhancement Summary

**Deepened on:** 2026-04-15 (same session as drafting). Research agents: framework-docs, best-practices, performance, simplicity.

### Key decisions merged in

1. **Hero + Stories photos use `<Image fill priority />`** — not `background-image` (was costing 400–900ms LCP and ~1MB of unoptimized transfer).
2. **Auth redirect moved to `middleware.ts`** — keeps the landing fully statically rendered + Edge-cached.
3. **Noto Serif loaded at `(public)/layout.tsx`** — scoped so platform/admin never downloads it.
4. **Theme pin via re-declared `[data-theme="light"]` tokens** in `globals.css` — nested light wrapper wins by cascade order, no `:has()`.
5. **Bento animations gated by `content-visibility: auto` + `prefers-reduced-motion`** — no CPU cost off-screen, opt-out respected.
6. **Hero carousel follows W3C APG pattern** — region role, visible pause button, keyboard nav (dots + arrow keys), reduced-motion halt, `inert` on inactive slides.
7. **Simplicity pass applied** — no FeatureCard/LeagueCard/ChatCard split; no speculative Lighthouse numeric targets; Out of Scope trimmed to 5 items.

### Deferred / rejected after research

- **Partial Prerendering (PPR)** is still experimental in Next 16.1 — defer until stable.
- **`animation-timeline: view()`** — no Safari 26 support; keep scroll-triggered animations out entirely.

---

## Motivation

The current landing page reads like a dev tool. The company is raising money, courting scouts, and partnering with Starlive — the page needs to look like a premium product catalogue. Editorial layout (magazine-style serifs, asymmetric bento, real photography of Kvara/Mama) builds the trust scouts need before they sign up.

Secondary goals: drop Georgian localization (not a scout-facing need), drop dark/light toggle (complexity without payoff), lock in the cream + green theme.

### Explicit deviations from CLAUDE.md

These are deliberate scope decisions, confirmed with Andria on 2026-04-15:

1. **English-only.** Entire site is now English-only (site-wide decision, not a landing-page exception). CLAUDE.md's "All pages including landing page must be fully bilingual" rule is superseded and should be updated the next time a plan touches CLAUDE.md. For this plan: hardcode English, no `t()` calls, no Georgian strings, no language toggle.
2. **Light-theme-pinned route group.** Pin `data-theme="light"` on the `(public)` route group layout (`src/app/(public)/layout.tsx`), not just on `/`. About/Contact (`(shared)`) and platform (`(platform)`, `/admin`, `/platform`) keep their theme toggle. Future marketing pages moved into `(public)` inherit light automatically — that is the intended behavior.

## Design Principles

- **Editorial, not product.** Serif headlines, italic green emphasis, narrow measures, generous whitespace.
- **Real faces, not stock.** Kvaratskhelia and Mamardashvili photos in Success Stories. Real club logos in Bento.
- **Show, don't tell.** What We Offer uses mock UIs (verified badges, live table, chat thread) to demonstrate the product.
- **English-only, light-only.** No `useLang()`, no `useTheme()`. All copy is hard-coded English; all colors assume `:root` light tokens.
- **Server components throughout.** No client boundaries needed — all "animation" is pure CSS (pulse, typing dots).

## Design System

### Colors (reuse existing CSS variables from `globals.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--background` | `#FDFCFA` | Page bg |
| `--surface` | `#F4F1EC` | Cream card bg (pulse, small bento cards) |
| `--elevated` | `#EAE6DF` | Table header bg |
| `--foreground` | `#1A1917` | Headlines, dark feature card bg |
| `--foreground-secondary` | `#4A4641` | Body copy |
| `--foreground-muted` | `#7A756F` | Labels, metadata |
| `--foreground-faint` | `#A39E97` | Timestamps, decorative |
| `--primary` | `#1B8A4A` | Accent, CTAs, italic emphasis |
| `--primary-hover` | `#15703C` | Button hover |
| `--primary-muted` | `#E3F5E9` | Active row bg |
| `--border` | `#DDD8D2` | Dividers, card borders |

Dark feature card uses `#4ADE80` (bright green) for accent on dark bg — not in CSS vars, hard-coded.

### Typography

- **Serif**: `'Noto Serif', Georgia, serif` — all `h1`, `h2`, `h3`, and numeric display
- **Sans**: `'Inter', -apple-system, sans-serif` — body, UI, buttons
- **Italic green emphasis**: `em` inside serif headings → `font-style: italic; color: var(--primary); font-weight: 400`
- **Load via next/font in root layout** — replace the Google Fonts `<link>` from the mockup

### Spacing

- Max content width: `1280px` (nav/hero/pulse/footer) or `1180px` (stories/bento)
- Section padding: `64–96px` vertical, `16px` horizontal gutter
- Card border-radius: `12–18px`

## Sections

### 1. Nav

Sticky top, `position: sticky; top: 0; z-index: 100`. Cream bg, 1px bottom border.

- Logo: `Binocly` — Noto Serif, 22px, bold
- Links (center): `Players`, `Leagues`, `About`, `Contact` — 13px, color `--foreground-secondary`, hover → `--primary`
- CTA (right): `Get Started` — primary green pill, 8px 18px, 13px bold

Routes: `/players`, `/leagues`, `/about`, `/contact` exist. `Get Started` → `/register`.

### 2. Hero

2-column (`1.4fr 1fr`), 64px gap, 64px top / 80px bottom padding. Bottom border 1px.

**Left column:**
- Eyebrow: `THE SCOUTING PLATFORM` — 11px, uppercase, 0.15em letter-spacing, `--primary`, with a 20px horizontal rule ::before
- Headline (h1): `Where Georgian football's <em>next chapter</em> begins.` — Noto Serif 56px, 1.05 line-height, -0.025em tracking
- Body: `A platform built for the country quietly producing some of Europe's most thrilling young talent. Verified data, real footage, direct contact with academies — all in one place.` — 17px, max-width 520px
- CTAs: primary button `Request Access →` (→ `/register`), ghost link `How it works` (→ `#what-we-offer` anchor — jumps to the Bento section in-page).

**Right column (slider):**
- Card: 3:4 aspect (`aspect-ratio: 3/4`), `max-width: 440px`, `border-radius: 20px`, dark `#1A1917` bg (placeholder while first image decodes)
- Slides: **all 4 images rendered as stacked `<Image fill />` from first paint**, opacity toggled via CSS transition. NOT `background-image` — this was costing 400–900ms of LCP.
  ```tsx
  <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-[#1A1917]">
    {slides.map((s, i) => (
      <Image
        key={s.src}
        src={s.src}
        alt=""
        fill
        priority={i === 0}
        fetchPriority={i === 0 ? 'high' : 'auto'}
        sizes="(max-width: 900px) 90vw, 440px"
        className={`object-cover transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}
      />
    ))}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/85" />
    {/* bottom info overlay */}
  </div>
  ```
- Bottom-left overlay: player name (Noto Serif 20px) + meta (`ATT · 19 · Torpedo Kutaisi`)
- Dots below: 4 dots, active one is a green pill (20×6 rounded)
- **A11y pattern (W3C APG carousel):** wrapper `role="region" aria-roledescription="carousel" aria-label="Featured players"`. Each slide `role="group" aria-roledescription="slide" aria-label="2 of 4: Aleko Basiladze"`. Visible pause/play toggle button + prev/next buttons (can be small/subtle — just needed for keyboard + screen-reader users). Clickable dots also advance slides. `ArrowLeft` / `ArrowRight` advance when focus is inside the carousel region. `aria-live="off"` while rotating, `"polite"` when paused. Only the active slide is keyboard-focusable; inactive slides get `inert` or `aria-hidden="true"`.
- **Rotation behavior:** auto-advance every 5s. Pause on hover, focus-within, `document.visibilityState !== 'visible'`, and when `prefers-reduced-motion: reduce` is set (stop rotation entirely; show only slide 0).
- **Perf:** `priority` + `fetchPriority="high"` only on slide 0. The other three are `priority={false}` but render in the DOM from paint 1 so the swap is instant with no network fetch. Locked aspect-ratio prevents CLS.

**Note**: The mockup shows one static player (Aleko Basiladze). For launch, hard-code a curated list of 4 featured players in `DEMO_SLIDER_PLAYERS` (same pattern as today's `src/app/(public)/page.tsx:13`). DB-driven featured players is a follow-up ticket.

### 3. Market Pulse

Cream bg (`--surface`), 48px vertical padding, 1px bottom border.

- Label (centered): `THE GEORGIAN FOOTBALL MARKET, BY NUMBERS` — 11px, 0.2em letter-spacing
- 4-column grid (`repeat(4, 1fr)`), no gap, with 1px top/bottom borders and 1px vertical dividers between cells
- Each cell: 28px 24px padding
  - Number (Noto Serif 44px, green): `37,600`, `180+`, `€100M`, `12`
  - Label-sm (11px, muted): `Registered youth players`, `Academies nationwide`, `In tracked transfer value`, `Active leagues`
  - Growth (11px, green): `↑ 12% year over year`, `↑ 8 new this year`, `Past 5 seasons`, `U-15 through U-21`

Static data — no DB query.

### 4. Success Stories

72px top / 80px bottom padding. Centered header: `Georgian Talent on the World Stage` (Noto Serif 36px) + green rule (48×3).

2×2 asymmetric grid (`1fr 1fr`, `column-gap: 0`, `row-gap: 24px`, max-width 1180). Each cell min-height 360, 1px border, border-radius only on outer corners — inner seams are clean straight lines.

**Row 1 cell 1 (top-left, text):**
- Header: `Khvicha Kvaratskhelia` / `Left Winger · Forward` · fee `€70M` (right-aligned Noto Serif green)
- Body: 2-column — Career Path timeline (4 dots: Dinamo Tbilisi 2017–18, Rubin Kazan 2019, SSC Napoli 2022–24, Paris Saint-Germain 2025–Present) + Achievements list (Serie A Champion 2022–23, Serie A MVP 2022–23, 40+ International Caps)

**Row 1 cell 2 (top-right, photo):**
- **`<Image fill alt="Khvicha Kvaratskhelia" src="/images/landing/kvaratskhelia.jpg" sizes="(max-width: 900px) 100vw, 590px" style={{ objectFit: 'cover', objectPosition: '35% 20%' }} />`** inside a relative container with `min-height: 360px`. NOT `background-image`.
- Gradient overlay as sibling absolute `<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 to-transparent to-[50%]" />`
- Guarantees WCAG AA contrast for the overlaid white "Currently at PSG" text regardless of photo brightness.

**Row 2 cell 1 (bottom-left, photo):**
- Same pattern as Row 1 cell 2 but with `/images/landing/mamardashvili.jpg` and `objectPosition: 'center 20%'`.
- Converting from `background-image` to `<Image>` alone cuts ~800KB–1.5MB off page weight via AVIF conversion.

**Row 2 cell 2 (bottom-right, text):**
- Header: `Giorgi Mamardashvili` / `Goalkeeper` · fee `€30M`
- Career Path: Dinamo Tbilisi 2016–19, Locomotive Tbilisi 2019–21, Valencia CF 2021–25, Liverpool FC 2025–Present
- Achievements: La Liga Best Goalkeeper 2023–24, Most Saves at Euro 2024 (29 saves — tournament leader), Record Georgian Transfer (€30M to Liverpool FC)

Timeline dot styling: 10×10 circle, 2px border `--foreground-faint`, bg `--background`. Current row: `--primary` border + bg, with 3px `--primary-muted` outer ring.

Achievement card: `--surface` bg, 3px left border `--primary`, 8px radius, title (13px bold) + desc (11px secondary).

### 5. Manifesto

Cream bg, 96px vertical padding, 1px top/bottom borders.

Centered, max-width 860. Structure:
- Decorative `"` — Noto Serif 80px, `--primary`, opacity 0.3
- Quote text — Noto Serif 34px, 1.35 line-height, regular weight:
  > `Georgia has produced more €10M+ transfers per capita than any other football nation since 2022. The talent is here. The infrastructure to find it, wasn't.`
  (with italic green `em` on "€10M+ transfers per capita" and "wasn't.")
- Divider: 32×1 green line, 32px margin-top
- Attribution: `WHY WE BUILT BINOCLY` — 12px, 0.18em letter-spacing

### 6. What We Offer (Hero Top Bento)

88px vertical padding. Centered header:
- Eyebrow: `WHAT WE OFFER`
- Title: `A scouting platform <em>built for professionals.</em>` — Noto Serif 40px
- Green rule (48×3)

Bento grid: `grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 20px`, max-width 1180.

**Feature card (spans row 1, both columns)** — dark bg `--foreground`, white text, 44px 48px padding, 18px radius.
- Inner grid: `1.05fr 1fr` with 48px column gap
- Left column:
  - Eyebrow `№ 01 · The foundation` — italic Noto Serif 14px, `#4ADE80`
  - Title `Verified player profiles, top to bottom.` — Noto Serif 38px, max-width 340
  - Body `37,600 youth players. Every stat camera-verified by Pixellot. No inflation, no fiction — just the truth of what happens on the pitch.` — 15px, rgba(255,255,255,0.75)
  - Link `Browse all players →` → `/players` — 11px bold uppercase, `#4ADE80`
- Right column: profile stack container `height: 180px; align-self: center`
  - 3 absolute-positioned cards stacked: Nika Kobakhidze (DEF · 17 · Iberia), Aleko Basiladze (ATT · 19 · Torpedo), Luka Tabatadze (MID · 18 · Dinamo Tbilisi)
  - Each card: 16px padding, 12px radius, `rgba(255,255,255,0.05/0.05/0.10)` bg, blurred
  - Card 1 (top): `scale(0.92)`, opacity 0.72 — partially visible
  - Card 2 (middle): `scale(0.96)`, opacity 0.85
  - Card 3 (bottom): active, green border `rgba(74,222,128,0.5)`
  - All cards show 42px round avatar + name + meta + "Verified" pill (rgba(74,222,128,0.18) bg, #4ADE80 text)
- Decoration: radial green glow top-right corner (`rgba(74,222,128,0.2)`)
- Hover: deeper shadow

**Small cards (row 2)** — cream surface, 28px padding, 18px radius, 1px border. Hover: `translateY(-3px)` + shadow + green border.

**League card (row 2 col 1):**
- Eyebrow `№ 02 · The pulse`
- Title `Real-time league data.` — Noto Serif 28px
- Body `Twelve leagues. Every match. Updated the moment it happens.`
- Mini table: header `U-19 Premier · Matchday 18` + pulsing `● LIVE` dot (1.6s ease-in-out), table with 4 rows (22px round club logos + name + points). Row 1 (Dinamo 44) active; rows 2–4: Torpedo 39, Iberia 1999 36, Locomotive 31.
- Footer: `Updated 14s ago` / `↑ Dinamo 2 – 1 Iberia` (green, with ↑ prefix)
- Link `Explore leagues →` → `/leagues`

**Chat card (row 2 col 2):**
- Eyebrow `№ 03 · The direct line`
- Title `Direct academy contact.` — Noto Serif 28px
- Body `No middlemen. No gatekeepers. Just conversations.`
- Chat UI: header (TK avatar circle green + `Torpedo Kutaisi` / `● Active now` + triple-dot menu), body (Today divider, outgoing bubble `Interested in Basiladze — available for a trial this month?` with timestamp `14:02 ✓✓` + scout avatar `P` dark), incoming bubble `Yes — sending footage + availability by EOD.` timestamp `14:08` + `T` avatar green, then typing dots animated (1.4s infinite), then disabled input `Write a message…` + green send arrow circle
- Link `Start messaging →` → `/login` (auth-gated)

### 7. Footer

Cream bg, 56px top / 32px bottom padding, 1px top border.

4-column grid (`2fr 1fr 1fr 1fr`, 48px gap):

- Column 1: Logo `Binocly` + tagline `The scouting platform built for Georgian football. Verified data, direct contact, real talent — connecting the world's clubs with Georgia's next generation.`
- Column 2: `PLATFORM` — Players, Leagues, Matches, Clubs
- Column 3: `COMPANY` — About, Contact, Press
- Column 4: `ACCOUNT` — Sign In, Request Access

Bottom bar: `© 2026 Binocly · Tbilisi, Georgia` (left) · `Privacy · Terms` (right). 12px faint.

Mobile (<900px): collapse to 2 columns, 32px gap.

## Implementation Phases

### Phase 1 — Prep & teardown

- Delete all files under `src/components/landing/` that the mockup doesn't reuse. Expect to remove: `Hero.tsx`, `Services.tsx`, `ForScouts.tsx`, `ForAcademies.tsx`, `Partners.tsx`, `SuccessStories.tsx` (old), whatever exists.
- Strip `src/app/(public)/page.tsx` back to an empty server component that will compose the new sections.
- Remove translation keys under the `landing.*` namespace in `src/lib/translations/landing.ts` — the new page is English-only, so keys are hard-coded in components.
- Delete the LandingFooter and LandingNav if they exist as separate components; the new Nav and Footer are inlined in the page layout.

### Phase 2 — Layout shell & fonts

- **Load Noto Serif at `(public)/layout.tsx`, not root.** `next/font/google` can be called in any layout and Next 16 scopes the CSS emission to the subtree. This keeps Noto Serif off platform/admin pages:
  ```tsx
  // src/app/(public)/layout.tsx
  import { Noto_Serif } from 'next/font/google'
  const notoSerif = Noto_Serif({
    variable: '--font-serif',
    subsets: ['latin'],
    weight: ['400', '700'],   // 400 italic + 700 bold — that's all we use
    style: ['normal', 'italic'],
    display: 'swap',
    preload: true,
    adjustFontFallback: true, // metric-matched fallback to kill CLS
  })

  export default function PublicLayout({ children }) {
    return (
      <div data-theme="light" className={`${notoSerif.variable} min-h-screen bg-background text-foreground`}>
        {children}
      </div>
    )
  }
  ```
- Keep Inter + Noto Sans Georgian loading in the root layout — other route groups still need them. Do not touch the root font config.
- **Theme pin mechanism:** the `data-theme="light"` wrapper above + a re-declared `[data-theme="light"] { ... }` block in `globals.css` that restates the light tokens. Nested `[data-theme="light"]` wins over root `[data-theme="dark"]` by normal cascade order — no `:has()`, no JS. Cross-browser safe.
- Keep `globals.css` dark-mode overrides untouched — they're still used by About/Contact/platform. The light pin happens at the route-group wrapper level, not by deleting dark tokens.
- **Auth redirect moves out of `page.tsx`.** Add to `src/middleware.ts`: if the user has a valid Supabase session AND `request.nextUrl.pathname === '/'`, redirect to `/players`. This keeps the landing page fully static (`cookies()` is never called inside `page.tsx`), which restores Edge caching and drops anonymous-visitor LCP to ~600ms. Middleware is already dynamic — no extra cost there.

### Phase 3 — Section components

Create under `src/components/landing/`:

- `Nav.tsx` — logo, links, CTA
- `Hero.tsx` — headline + slider
- `PlayerSlider.tsx` (client component, `'use client'`) — rotates slider-1.jpg through slider-4.jpg with dot controls, auto-advance every 5s
- `MarketPulse.tsx` — 4-stat cream strip
- `SuccessStories.tsx` — 2×2 asymmetric with Kvara + Mama
- `Manifesto.tsx` — centered quote
- `WhatWeOffer.tsx` — the Bento. Single component with inline JSX for the three cards (feature + league + chat). Do **not** split into sub-components — they're one-off markup, no reuse benefit, and the simplicity reviewer flagged the split as premature abstraction.
- `Footer.tsx` — 4-column

All server components except PlayerSlider. Hard-code all copy — no `t()` calls.

### Phase 4 — Styles

Add to `globals.css` under a single `/* ============ LANDING ============ */` block. Port classes from the mockup. Suggested rename: drop the `v3-`, `v1-`, and `bento-b` prefixes — replace with semantic names (`.offer-card`, `.offer-feature`, `.offer-stack`, `.league-mini-table`, `.offer-chat-*`, etc.). Preserve measurements exactly.

**Realistic CSS budget:** ~250–400 lines (earlier "~80 lines" estimate was wrong — the editorial 2×2 stories spread + bento + hero slider + per-section responsive rules add up). Keep the block scoped to landing-only classnames so it doesn't collide with platform styles.

Key animations (copy exactly from mockup):
- `@keyframes pulse` (1.6s ease-in-out, for LIVE dot)
- `@keyframes typing` (1.4s infinite, for chat typing dots)

**Animation gating (per research):**
```css
/* Pause animations off-screen — bento is below the fold */
.offer-bento { content-visibility: auto; contain-intrinsic-size: 600px; }

/* Respect reduced-motion for all infinite decorative animations */
@media (prefers-reduced-motion: reduce) {
  .offer-live, .offer-typing span { animation: none; }
  .offer-live { opacity: 1; }          /* keep dot visible, just not pulsing */
}

/* Re-declare light tokens here so nested [data-theme="light"] wins over root [data-theme="dark"] */
[data-theme="light"] {
  --background: #FDFCFA; --surface: #F4F1EC; --elevated: #EAE6DF;
  --foreground: #1A1917; --foreground-secondary: #4A4641;
  --foreground-muted: #7A756F; --foreground-faint: #A39E97;
  --primary: #1B8A4A; --primary-hover: #15703C; --primary-muted: #E3F5E9;
  --border: #DDD8D2;
  color-scheme: light;
}
```

### Phase 5 — Assets

**Images (all already exist in `public/`):**
- `/images/landing/slider-1.jpg` … `slider-4.jpg` — Hero slider
- `/images/landing/kvaratskhelia.jpg` — Stories row 1
- `/images/landing/mamardashvili.jpg` — Stories row 2
- `/images/clubs/dinamo-tbilisi.jpg`
- `/images/clubs/torpedo-kutaisi.jpg`
- `/images/clubs/iberia-1999.jpg`

**Missing — must save locally before ship:**
- `/images/clubs/locomotive-tbilisi.png` — download from `https://api.starliveball.com/assets/LOCOMOTIVE.png`. Do not hotlink Starlive in production.

**Nice to have (follow-up):** convert JPG club logos to transparent PNG or SVG so they sit cleaner on the cream card.

All images via `next/image` with appropriate `sizes` and `priority` on hero.

### Phase 6 — Responsive

- `<900px` breakpoint: Hero collapses to single column; Pulse 4-col → 2×2; Stories 2×2 → single column; Bento 1×3 stack; Footer 4-col → 2-col.
- Feature card internal 2-col grid also collapses to single column at `<900px` (text on top, stack below).

### Phase 7 — Accessibility & polish

- Add `:focus-visible` ring (green, 2px) to all interactive elements (nav links, buttons, card links).
- Hero slider: apply full W3C APG carousel pattern (see Hero section) — region role, per-slide `aria-label`, visible pause/play button, pause on focus/hover/visibility, halt on `prefers-reduced-motion`, `inert` on inactive slides.
- `<link rel="icon">` added to layout to kill 404.
- `alt` text on all images (empty `alt=""` on decorative slider backgrounds — the player name is already in overlaid text; meaningful `alt` on Kvaratskhelia/Mamardashvili photos).
- `prefers-reduced-motion: reduce` disables pulse + typing animations (CSS, handled in Phase 4).
- `<footer>` wraps the site footer; footer nav uses `<nav aria-label="Footer">`.
- External partner links (future — none in current scope since partners section was removed): `rel="noopener"` only, no `noreferrer` (preserves referral analytics for partners).

**Note: Phases 6 (Responsive) and 7 (A11y) happen per-section as you build, not as separate passes.** Listed separately here for review visibility, but in practice write media queries and focus rings into each component the moment it lands.

## Open Questions

1. **Middleware auth-redirect verification.** Plan assumes `src/middleware.ts` already runs on `/` and adding a `getUser()` + conditional redirect is cheap. Confirm before Phase 2 by reading `src/middleware.ts` and `next.config.ts` — if the matcher excludes `/` today, add it; if `getUser()` is already called on every request for session refresh, no extra cost; if not, the redirect branch adds one Supabase round-trip per unauthenticated `/` hit (acceptable but worth knowing).
2. **`DEMO_SLIDER_PLAYERS` copy.** Existing array in `src/app/(public)/page.tsx:13` has 4 players, real photos. Reuse as-is, or curate a tighter list for the new editorial tone? (Recommendation: reuse.)
3. **Market Pulse as its own file vs. inline.** ~15 lines of static markup. Simplicity reviewer suggested inlining in `page.tsx`. Kept as its own file for now because `page.tsx` is already composing 7 sections — extraction reads better. Flag if this looks like premature abstraction when implementing.
4. **Kvara/Mama photo dimensions.** Plan says `sizes="(max-width: 900px) 100vw, 590px"` — confirm the existing `public/images/landing/kvaratskhelia.jpg` and `mamardashvili.jpg` source dimensions are ≥ 1180×1300 so AVIF conversion has headroom. If they're already tightly cropped, AVIF savings will be smaller.

## Routes / Dependencies

All routes must exist or be stubbed:
- `/players`, `/leagues`, `/about`, `/contact`, `/register`, `/login` — already exist

No new DB queries. No new API routes. No new migrations. No new translation strings. No `useAuth()` reads on the landing page — `Get Started` always shows (auth-aware CTA is out of scope).

## Files Touched

**New:**
- `src/components/landing/Nav.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/PlayerSlider.tsx`
- `src/components/landing/MarketPulse.tsx`
- `src/components/landing/SuccessStories.tsx` (full rewrite, keep filename if already exists)
- `src/components/landing/Manifesto.tsx`
- `src/components/landing/WhatWeOffer.tsx`
- `src/components/landing/Footer.tsx`
- `public/images/clubs/locomotive-tbilisi.png`

**Modified:**
- `src/app/(public)/page.tsx` — compose all sections in order; remove auth cookie check (moves to middleware).
- `src/app/(public)/layout.tsx` — load Noto Serif, wrap children in `<div data-theme="light" className={notoSerif.variable}>`, add favicon link.
- `src/app/globals.css` — add LANDING block (~250–400 lines) with re-declared `[data-theme="light"]` tokens, editorial classes, and animation/reduced-motion rules. Do NOT remove existing dark-mode overrides (still used by About/Contact/platform).
- `src/middleware.ts` — add `if (user && pathname === '/') redirect('/players')` branch.
- `src/lib/translations/landing.ts` — delete the `landing.*` namespace (landing is English-only).
- `CLAUDE.md` — document the "landing is English-only" exception to the bilingual rule.

**Deleted:**
- Any `LandingNav.tsx` / `LandingFooter.tsx` superseded by new `Nav`/`Footer`
- All legacy landing section components not listed above
- Georgian translations for landing strings

## Out of Scope

- Real live league data (the bento mini-table is a marketing mock — follow-up ticket to wire to Supabase live standings).
- Real chat wiring (the bento chat card is a visual mock — no WebSocket, no realtime).
- DB-driven featured player slider (hard-coded `DEMO_SLIDER_PLAYERS` array for launch; DB-driven is a follow-up).
- Dark mode support on the landing page (explicitly dropped).
- Full Georgian translation of the landing page (explicitly dropped; KA link in nav routes to `/register?lang=ka`).

## Acceptance

### Functional
- Visual diff against `http://localhost:56431/` is indistinguishable at 1440px and 414px widths.
- `npm run build` passes (no type errors, no lint errors).
- No `useLang`, no `useTheme`, no `t(...)` calls anywhere in the new landing components.
- All section anchors link to the right routes; `Get Started`, `Request Access`, `Browse all players`, `Explore leagues`, `Start messaging` all navigate (not just `href="#"`).
- Locomotive logo loads from local asset, not Starlive CDN.
- Authenticated visitors are redirected from `/` → `/players` by `middleware.ts` (not by page-level `cookies()` read).
- Anonymous visitors see the landing as a statically-rendered Edge-cached response.

### Performance (concrete, derived from implementation requirements)
- Hero slider uses `next/image` with `priority` + `fetchPriority="high"` on slide 0 and a locked `aspect-ratio: 3/4` container. Zero CLS from slide transitions (all 4 images rendered from first paint, opacity-toggled).
- Kvaratskhelia + Mamardashvili photos use `<Image fill />` with `objectPosition` — no `background-image` anywhere on the page.
- Total image transfer on mobile ≤ 400KB (Lighthouse Network panel) — AVIF/WebP served via Next's optimizer.
- Noto Serif does not appear in network waterfall on `/players` or `/about` (scoped to `(public)/layout.tsx`).
- Lighthouse landing page is green across the board on mobile (no red/orange in Performance/Accessibility/Best Practices/SEO). Specific numeric targets are not set — green/no-regressions is the bar.

### Accessibility
- Hero slider follows W3C APG carousel pattern: `role="region"`, `aria-roledescription="carousel"`, per-slide `aria-label="X of 4: Player Name"`, visible pause/play toggle + prev/next buttons, ArrowLeft/ArrowRight keyboard advance, `aria-hidden` / `inert` on inactive slides.
- `prefers-reduced-motion: reduce` halts hero rotation, pulse animation, and typing-dot animation (all via CSS media query).
- `:focus-visible` ring (green, 2px) on every interactive element.
- All images have meaningful `alt` text (player names, club names). Decorative slider backgrounds use `alt=""` (name shown in overlaid text).
- Bento pulse + typing animations pause when section is off-screen (`content-visibility: auto` on the bento grid container).
- `<html lang="en">` set on the landing route. No `hreflang` (single-language page).

---

## Sources

All research findings are merged into the relevant sections above. These are the references that informed the decisions:

- Next.js 16 App Router docs — layouts, `next/font`, metadata, Partial Prerendering
- W3C ARIA Authoring Practices Guide — Carousel Pattern
- Smashing Magazine — Guide to Building Accessible Carousels (2023)
- WebAIM — Contrast and Color Accessibility
- web.dev — `prefers-reduced-motion` for web animations
- Pope Tech (2025) — Designing Accessible Animation and Movement
- Chrome for Developers — Controlling Font Performance with `font-display`
- DebugBear — How Fonts Cause Layout Shift
- Graffino TIL — Safari `backdrop-filter` performance workarounds
- Can I Use — `backdrop-filter`, `animation-timeline: view()`
- Google Search Central — Managing Multi-Regional and Multilingual Sites
- LinkBuilder — `rel="noopener"` vs `rel="noreferrer"`
- Local: `CLAUDE.md` conventions, `src/app/layout.tsx`, `next.config.ts`, existing `FadeInOnScroll` + font setup
