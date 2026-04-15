---
title: Add LeagueShowcase section header (Golden Leagues)
type: feat
status: completed
date: 2026-04-15
origin: docs/superpowers/specs/2026-04-15-leagues-showcase-header-design.md
---

# Add LeagueShowcase Section Header (Golden Leagues)

## Overview

The `LeagueShowcase` section on `/leagues` currently drops straight into the hero card with no section header — breaking the page's visual rhythm (every other section has one) and giving visitors no framing. This plan adds an editorial split-layout header that names the **Golden Leagues** brand, explains the scope (three age groups), and acts as a transition from the hero above.

Scope is narrow: one component modified (`LeagueShowcase.tsx`), one translation file updated (`core.ts`, en + ka blocks). No DB changes, no new queries, no new components, no new routes. All dynamic values already arrive via the `leagues: League[]` prop.

## Problem Statement / Motivation

- The `/leagues` page has four sections: `LeagueHero`, `LeagueShowcase`, `HowItWorks`, `SeasonCalendar`, `LeagueCTA`. All except `LeagueShowcase` open with a titled header (eyebrow + serif title with italic accent + divider, per `HowItWorks.tsx:70-79` and `SeasonCalendar.tsx:83-90`).
- Visitors arriving at the showcase have no framing for what they're looking at — the hero above sets up Georgian talent broadly, but doesn't name the **Golden Leagues** brand that unifies the three cards.
- The user confirmed the three cards will always be the Golden League U15, U17, U19 — a stable product shape, not a changing roster. The header can lean on that certainty.

## Proposed Solution

Render a header block inside the existing `<section className="py-10 sm:py-14">` container of `LeagueShowcase.tsx`, above the card grid. Editorial split layout:

- **Left:** eyebrow → serif `<h2>` with italic primary-green accent → secondary-foreground description (max ~540px).
- **Right (bottom-aligned):** dynamic count line (`{n} LEAGUES` in primary green, uppercase, bold) → season line (`{season} Season` in faint foreground).
- **Hairline rule** (`border-b border-border pb-5`) separating the header from the card grid.
- **Responsive:** `flex-col` → `sm:flex-row sm:items-end sm:justify-between` (mobile stacks title above meta; meta stays right-aligned via `items-end`).

Copy (from approved brainstorm, see [docs/superpowers/specs/2026-04-15-leagues-showcase-header-design.md](../superpowers/specs/2026-04-15-leagues-showcase-header-design.md)):

| Slot | English | Georgian |
| --- | --- | --- |
| Eyebrow | "Georgia's Official Youth Competitions" | "საქართველოს ოფიციალური ახალგაზრდული ჩემპიონატები" |
| Title | "Georgia's " | "საქართველოს " |
| Title accent | "Golden Leagues" | "ოქროს ლიგები" |
| Description | "Three age groups. Every match captured. One source of verified player data." | "სამი ასაკობრივი ჯგუფი. ყოველი მატჩი ჩაწერილი. ერთი წყარო გადამოწმებული სტატისტიკისთვის." |
| Count label | "Leagues" | "ლიგა" |
| Season suffix | "Season" | "სეზონი" |

### Refinements from research

Three refinements to the original spec, driven by repo-research and spec-flow analysis:

1. **Use `border-border` theme token, not hardcoded rgba.** CLAUDE.md forbids hardcoded hex in components, and `Footer.tsx:10` / `Navbar.tsx:110` already use `border-border` for the same purpose. `--border` resolves to `#2A2623` in dark mode (visible but restrained) — matches the design intent of `border-white/[0.06]` from the spec.
2. **Guard the season line.** Render the season line only when `leagues[0]?.season` is truthy. The DB type marks `season` as required, so this is defensive-only — but a trailing `"  Season"` with no value would look broken if data ever drifts.
3. **Document the "exactly 3 leagues" assumption.** The description copy "Three age groups" is literal. This is a stable product-level fact (Starlive covers only U15/U17/U19 Golden Leagues) — flag it in code via a short comment so a future dev doesn't accidentally scale past three without updating copy.

## Technical Considerations

- **Server component** — stays server-rendered via `await getServerT()`, matching siblings (`LeagueHero`, `HowItWorks`, `SeasonCalendar`). No `'use client'`, no hooks, no state.
- **Font-family branching** — title element uses the exact recipe established in `LeagueHero.tsx:92-95`:
  ```tsx
  className={`… ${isKa ? 'font-sans' : ''}`}
  style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
  ```
  Noto Serif has no Georgian cut — the `isKa` branch falls back to sans so Georgian glyphs render correctly.
- **Accessibility** — `<h2>` for the title (page `<h1>` lives in `LeagueHero`). Eyebrow stays a `<span>` above the heading, not inside it, so screen readers announce "Georgia's Golden Leagues" cleanly. Count/season are `<div>`s — decorative metadata.
- **No DB, no queries** — count from `leagues.length`, season from `leagues[0]?.season`. Both already arrive via props.
- **No translation-key enforcement** — the `t()` signature is `(key: string) => string` with a silent path-echo on miss (`src/lib/translations/index.ts:31-40`). Spelling errors will render the literal path string. Verified by visual inspection during testing.

## System-Wide Impact

- **Interaction graph**: None. Pure render change on a server component. No callbacks, no effects, no subscriptions.
- **Error propagation**: None. The component has no error-raising paths; `leagues.length === 0` is handled by an existing early return that we leave untouched.
- **State lifecycle risks**: None.
- **API surface parity**: None. `LeagueShowcase` is consumed only by `src/app/(shared)/leagues/page.tsx`.
- **Integration test scenarios**: Visual verification only — see Acceptance Criteria.

## Acceptance Criteria

### Functional

- [x] Header renders at `/leagues` above the U15 hero card, inside the existing `max-w-7xl` wrapper.
- [x] `leagues.length === 0` path still renders the existing empty-state text and does **not** render the header (early return unchanged).
- [x] English mode: title renders in Noto Serif with `"Golden Leagues"` in `text-primary italic`.
- [x] Georgian mode: title renders in sans-fallback with `"ოქროს ლიგები"` in `text-primary italic`.
- [x] All user-facing copy reads from `leagues.showcase.header.*` keys. Grepping `LeagueShowcase.tsx` for any of the English or Georgian strings returns zero hits.
- [x] Count line reads `{leagues.length} Leagues` (en) / `{leagues.length} ლიგა` (ka).
- [x] Season line renders `{leagues[0].season} Season` / `{leagues[0].season} სეზონი` when `leagues[0]?.season` is truthy, and is omitted entirely when falsy.

### Responsive

- [x] At 375px (mobile): title block on top, meta block below it right-aligned, border rule spans full width below meta.
- [x] At 640px (`sm` breakpoint): layout switches to horizontal split with `items-end justify-between`.
- [x] At 768px (tablet): horizontal split remains stable; no horizontal overflow in either language.
- [x] At 1280px+ (desktop): title and meta are both visible without wrapping; description stays within 540px.

### Accessibility

- [x] Page heading hierarchy remains valid: exactly one `<h1>` (in `LeagueHero`), and the new title is an `<h2>` — consistent with the other `<h2>`s in `HowItWorks`, `SeasonCalendar`, `LeagueCTA`.
- [x] Eyebrow is outside the heading element (`<span>` before `<h2>`) so screen readers announce only the headline.
- [x] Primary green on the warm near-black background passes WCAG AA contrast at `text-xs` for the eyebrow and count label (already verified system-wide by existing sections using the same tokens).

### Quality gates

- [x] `npm run build` completes with no new TypeScript errors and no new warnings mentioning `LeagueShowcase` or `core.ts`.
- [x] `LeagueShowcase.tsx` still exports `computeLeagueLayout` unchanged (pure function; no behavioral change to layout math).
- [x] Border color uses the `border-border` theme token — not a hardcoded rgba or hex.
- [x] No changes to `page.tsx`, `LeagueHero.tsx`, `LeagueShowcaseCard.tsx`, `HowItWorks.tsx`, `SeasonCalendar.tsx`, or `LeagueCTA.tsx`.

## Success Metrics

- Visual: the `/leagues` page feels visually unified — `LeagueShowcase` now matches the section-header rhythm of the rest of the page.
- Zero regressions in the existing card layout (hero + 5/7 row rendering for three leagues).
- No new i18n gaps introduced — both locales render without any literal `leagues.showcase.header.*` strings leaking through.

## Dependencies & Risks

**Dependencies:** None. No new packages, no DB migrations, no env vars.

**Risks:**

- **Georgian italic accent readability.** Georgian script rarely uses italics. The design uses `italic` for "ოქროს ლიგები" the same way it's used for the accent in `LeagueHero` titleAccent — if the existing hero doesn't have a readability issue there, this won't either. If it does, drop `italic` on the ka branch as a follow-up.
- **Eyebrow copy length on narrow screens.** English is 35 chars, Georgian is ~45 chars; with `tracking-widest uppercase` it can wrap awkwardly at 375px. Mitigation: allow wrap (no `whitespace-nowrap`), verify visually during Task 4. If problematic, shorten the Georgian eyebrow to something like "ოფიციალური ჩემპიონატები".
- **Spec "three age groups" hardcoded in copy.** If Starlive ever expands to a fourth age group (U21?), the description becomes inaccurate. Low probability near-term; flagged in code via a short comment.

## Implementation Tasks

This plan has a companion superpowers-format implementation plan at [docs/superpowers/plans/2026-04-15-leagues-showcase-header.md](../superpowers/plans/2026-04-15-leagues-showcase-header.md) with bite-sized TDD-style tasks and exact code blocks. Follow that for execution. Summary:

1. **Task 1** — Add English `leagues.showcase.header.*` keys to `src/lib/translations/core.ts`.
2. **Task 2** — Add Georgian `leagues.showcase.header.*` keys to the same file. Commit both translation additions.
3. **Task 3** — Update `src/components/league/LeagueShowcase.tsx`:
   - Destructure `lang` from `getServerT()`, derive `isKa`.
   - Compute `const season = leagues[0]?.season ?? ''`.
   - Render the header block above the existing card grid, using `border-border` (not hardcoded rgba).
   - Conditionally render the season line when `season` is truthy.
   - Add a one-line comment noting that description copy assumes exactly three active Golden Leagues.
4. **Task 4** — Visual verification at 375px / 640px / 768px / 1280px in both en and ka. Empty-state sanity check. `npm run build` clean.

Pre-commit: run `npm run build` (project convention per CLAUDE.md).

## Sources & References

### Origin

- **Design spec (brainstorm output):** [docs/superpowers/specs/2026-04-15-leagues-showcase-header-design.md](../superpowers/specs/2026-04-15-leagues-showcase-header-design.md) — approved by user on 2026-04-15 after iterating through four header layouts (A/B/C/D) in the visual companion, settling on the editorial split (B) with a Frankenstein of copy pieces from A, B, and C. Key decisions carried forward: editorial split layout, dynamic count + season meta, `<h2>` heading hierarchy, `isKa` font-family branching, empty-state early return preserved.
- **Superpowers implementation plan:** [docs/superpowers/plans/2026-04-15-leagues-showcase-header.md](../superpowers/plans/2026-04-15-leagues-showcase-header.md) — bite-sized tasks with exact code.

### Internal References

- Section-header recipe: `src/components/league/LeagueHero.tsx:87-103`, `src/components/league/HowItWorks.tsx:70-79`, `src/components/league/SeasonCalendar.tsx:83-90`.
- Responsive split precedent: `src/components/league/LeagueCTA.tsx:17` (same route, same pattern).
- Border token usage: `src/components/layout/Footer.tsx:10`, `src/components/layout/Navbar.tsx:110`.
- Translation barrel and resolver: `src/lib/translations/index.ts:14-40`.
- Server-side `t` helper: `src/lib/server-translations.ts:5-12`.
- Existing `leagues.showcase` namespace to extend: `src/lib/translations/core.ts:145-149` (en) and `src/lib/translations/core.ts:406-410` (ka).
- `leagues` table schema (`season: string` required): `src/lib/database.types.ts:334-390`.
- CLAUDE.md rules touching this change: i18n (en + ka required, no hardcoded strings), TypeScript (no `any`, no `.js/.jsx`), styling (CSS custom properties / Tailwind tokens — no hardcoded hex), build-before-commit (`npm run build`).

### Related Learnings

- `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md` — precedent for extracting user-facing strings to translation keys rather than inlining.
- Memory: "Tailwind CSS v4 Cascade Layer Gotcha" (in `/home/kvims/.claude/projects/-home-kvims-projects-georgian-football-platform/memory/`) — prefer Tailwind utilities over global class overrides to avoid cascade conflicts. Applied: we use utilities throughout the header, no global shorthand classes.

### Research Artifacts (this session)

- Repo research brief (parallel agent, 2026-04-15) — inventory of existing section-header patterns, i18n conventions, responsive split precedents, and CLAUDE.md constraints.
- Learnings research brief (parallel agent, 2026-04-15) — past solutions on i18n extraction, font-family branching, Tailwind cascade.
- SpecFlow analysis (parallel agent, 2026-04-15) — surfaced the border-token token gap, season-falsy guard, and "exactly 3 leagues" assumption now folded into this plan.
