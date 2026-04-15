# LeagueShowcase Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an editorial split-layout section header to the `LeagueShowcase` component on `/leagues`, introducing the "Golden Leagues" brand with a dynamic league count and season meta.

**Architecture:** Single-component change in `src/components/league/LeagueShowcase.tsx`, plus new i18n keys under `leagues.showcase.header.*` in both English and Georgian blocks of `src/lib/translations/core.ts`. No DB changes, no new files, no new queries — all display values derive from the `leagues: League[]` prop the component already receives. The header slots inside the existing `<section>` container above the existing card grid, preserving the empty-state early return unchanged.

**Tech Stack:** Next.js 16 App Router, React Server Components, Tailwind CSS v4, Supabase types from `src/lib/database.types.ts`, `getServerT()` for server-side i18n.

**Spec:** `docs/superpowers/specs/2026-04-15-leagues-showcase-header-design.md`

---

## File Structure

| File | Change | Responsibility |
| --- | --- | --- |
| `src/lib/translations/core.ts` | Modify | Add `leagues.showcase.header` namespace with 6 keys in both `en` and `ka` trees |
| `src/components/league/LeagueShowcase.tsx` | Modify | Render the new header block above the hero card when `leagues.length > 0` |

No new files. No other components or routes are touched.

---

## Task 1: Add English translation keys

**Files:**
- Modify: `src/lib/translations/core.ts:145-149` (extend the `en.leagues.showcase` block)

- [x] **Step 1: Open `src/lib/translations/core.ts` and locate the English `leagues.showcase` block**

It currently looks like this (lines 145-149):

```ts
    showcase: {
      pixellotTracked: 'Pixellot Tracked',
      clubsCount: 'clubs',
      matchesCount: 'matches',
    },
```

- [x] **Step 2: Add the `header` sub-object with six keys**

Replace the block with:

```ts
    showcase: {
      pixellotTracked: 'Pixellot Tracked',
      clubsCount: 'clubs',
      matchesCount: 'matches',
      header: {
        eyebrow: "Georgia's Official Youth Competitions",
        title: "Georgia's ",
        titleAccent: 'Golden Leagues',
        description:
          'Three age groups. Every match captured. One source of verified player data.',
        leaguesLabel: 'Leagues',
        seasonSuffix: 'Season',
      },
    },
```

Notes:
- The trailing space inside `title` (`"Georgia's "`) is intentional — the component renders `{title}{titleAccent}` so the space prevents them from running together.
- `leaguesLabel` and `seasonSuffix` are suffix tokens, rendered after dynamic values (`{count} Leagues`, `{season} Season`).

- [x] **Step 3: Verify the file still parses**

Run: `npx tsc --noEmit --project tsconfig.json 2>&1 | head -30`
Expected: No errors pointing to `core.ts`. (Pre-existing errors elsewhere in the project are out of scope.)

---

## Task 2: Add Georgian translation keys

**Files:**
- Modify: `src/lib/translations/core.ts:406-410` (extend the `ka.leagues.showcase` block)

- [x] **Step 1: Locate the Georgian `leagues.showcase` block**

It currently looks like this (lines 406-410):

```ts
    showcase: {
      pixellotTracked: 'Pixellot-ით ფიქსირებული',
      clubsCount: 'კლუბი',
      matchesCount: 'მატჩი',
    },
```

- [x] **Step 2: Add the mirrored `header` sub-object**

Replace the block with:

```ts
    showcase: {
      pixellotTracked: 'Pixellot-ით ფიქსირებული',
      clubsCount: 'კლუბი',
      matchesCount: 'მატჩი',
      header: {
        eyebrow: 'საქართველოს ოფიციალური ახალგაზრდული ჩემპიონატები',
        title: 'საქართველოს ',
        titleAccent: 'ოქროს ლიგები',
        description:
          'სამი ასაკობრივი ჯგუფი. ყოველი მატჩი ჩაწერილი. ერთი წყარო გადამოწმებული სტატისტიკისთვის.',
        leaguesLabel: 'ლიგა',
        seasonSuffix: 'სეზონი',
      },
    },
```

Note: the trailing space inside the Georgian `title` (`'საქართველოს '`) is also intentional for the same reason as English.

- [x] **Step 3: Commit both translation additions**

```bash
git add src/lib/translations/core.ts
git commit -m "feat(leagues): add showcase header i18n keys (en/ka)

New leagues.showcase.header namespace with eyebrow, title, titleAccent,
description, leaguesLabel, and seasonSuffix for both locales. Prepares
i18n surface for the LeagueShowcase section header."
```

---

## Task 3: Render the header in `LeagueShowcase`

**Files:**
- Modify: `src/components/league/LeagueShowcase.tsx:53-99` (the main `return` branch)

- [x] **Step 1: Read the current component**

Open `src/components/league/LeagueShowcase.tsx`. Confirm the current shape:

- Imports `getServerT` and `LeagueShowcaseCard`.
- Exports `computeLeagueLayout` (pure function, **do not modify**).
- Exports `async function LeagueShowcase({ leagues })` that:
  - Destructures `const { t } = await getServerT()`.
  - Early-returns an empty-state section when `leagues.length === 0` (**do not modify**).
  - Renders `<section className="py-10 sm:py-14">` → `<div className="mx-auto max-w-7xl px-4 space-y-6">` → hero card → optional second row grid → rest cards.

- [x] **Step 2: Add `lang` to the `getServerT()` destructure**

Change line 54 from:

```ts
  const { t } = await getServerT()
```

to:

```ts
  const { t, lang } = await getServerT()
```

Then add, immediately below that line:

```ts
  const isKa = lang === 'ka'
```

This mirrors the pattern in `src/components/league/LeagueHero.tsx:78` and `src/components/league/HowItWorks.tsx` — Noto Serif has no Georgian cut, so the title falls back to sans when `lang === 'ka'`.

- [x] **Step 3: Derive the season string**

Immediately below `const slots = computeLeagueLayout(leagues)` (currently line 66), add:

```ts
  const season = leagues[0]?.season ?? ''
```

This is only read when `leagues.length > 0` (the early return above protects us), so the fallback `''` is defensive. We **conditionally render** the season line in Step 4 so a falsy value produces no markup at all (avoids a stray leading space like `" Season"` if data ever drifts).

- [x] **Step 4: Replace the existing `return` block's inner markup to include the header**

The current return body (lines 73-99) is:

```tsx
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        {/* Hero card — full width */}
        <LeagueShowcaseCard league={heroSlot.league} variant={heroSlot.variant} />

        {/* Second row — 5:7 split or single card */}
        {secondRow.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {secondRow.map((slot) => (
              <div
                key={slot.league.id}
                className={slot.span === 'narrow' ? 'md:col-span-5' : 'md:col-span-7'}
              >
                <LeagueShowcaseCard league={slot.league} variant={slot.variant} />
              </div>
            ))}
          </div>
        )}

        {/* Additional full-width cards */}
        {restSlots.map((slot) => (
          <LeagueShowcaseCard key={slot.league.id} league={slot.league} variant={slot.variant} />
        ))}
      </div>
    </section>
  )
```

Replace with:

```tsx
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section header — editorial split.
            Description copy assumes exactly three active Golden Leagues (U15/U17/U19).
            If Starlive expands coverage beyond three age groups, update the copy. */}
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          {/* Left: title stack */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
              {t('leagues.showcase.header.eyebrow')}
            </span>
            <h2
              className={`mt-2 text-[26px] font-extrabold tracking-tight leading-[1.1] sm:text-3xl ${
                isKa ? 'font-sans' : ''
              }`}
              style={
                !isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined
              }
            >
              {t('leagues.showcase.header.title')}
              <span className="text-primary italic">
                {t('leagues.showcase.header.titleAccent')}
              </span>
            </h2>
            <p className="mt-3 max-w-[540px] text-sm leading-relaxed text-foreground-secondary sm:text-base">
              {t('leagues.showcase.header.description')}
            </p>
          </div>

          {/* Right: meta stack */}
          <div className="flex flex-col items-end gap-1.5 sm:pb-1">
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              {leagues.length} {t('leagues.showcase.header.leaguesLabel')}
            </div>
            {season && (
              <div className="text-xs text-foreground-faint">
                {season} {t('leagues.showcase.header.seasonSuffix')}
              </div>
            )}
          </div>
        </div>

        {/* Card grid */}
        <div className="space-y-6">
          {/* Hero card — full width */}
          <LeagueShowcaseCard league={heroSlot.league} variant={heroSlot.variant} />

          {/* Second row — 5:7 split or single card */}
          {secondRow.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {secondRow.map((slot) => (
                <div
                  key={slot.league.id}
                  className={slot.span === 'narrow' ? 'md:col-span-5' : 'md:col-span-7'}
                >
                  <LeagueShowcaseCard league={slot.league} variant={slot.variant} />
                </div>
              ))}
            </div>
          )}

          {/* Additional full-width cards */}
          {restSlots.map((slot) => (
            <LeagueShowcaseCard key={slot.league.id} league={slot.league} variant={slot.variant} />
          ))}
        </div>
      </div>
    </section>
  )
```

Key structural notes:
- The outer `max-w-7xl px-4` wrapper is retained but no longer has `space-y-6` — spacing is now split between `mb-8` on the header and `space-y-6` on an inner wrapper around the cards.
- Header uses `flex-col` by default (mobile stacks title above meta), switches to `flex-row items-end justify-between` at `sm:` and up. Meta is `items-end` on mobile too, so it stays right-aligned per the spec.
- Title font-family branches on `isKa` — exact pattern copied from `LeagueHero.tsx:93-95` and `HowItWorks.tsx:72-75`.
- Border rule: `border-b border-border pb-5` separates the header from the grid. Uses the `--border` theme token (resolves to `#2A2623` in dark mode) — matches `Footer.tsx:10` and `Navbar.tsx:110`. CLAUDE.md forbids hardcoded hex in components.
- Season line is conditionally rendered (`{season && (...)}`) so a falsy value produces no markup — no stray `" Season"` orphan.
- Comment above the header block documents the "exactly three age groups" business assumption so the hardcoded description copy isn't accidentally contradicted by a future league addition.

- [x] **Step 5: Run the type check**

Run: `npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "LeagueShowcase|core\.ts"`
Expected: No output (no errors in the two files you touched).

- [x] **Step 6: Run a production build**

Run: `npm run build 2>&1 | tail -40`
Expected: Build completes, `/leagues` compiles as a static route, no new warnings referencing `LeagueShowcase` or `core.ts`.

- [x] **Step 7: Commit**

```bash
git add src/components/league/LeagueShowcase.tsx
git commit -m "feat(leagues): add editorial split header to showcase section

Section header sits above the card grid on /leagues: eyebrow + serif
title with italic primary accent + description on the left, dynamic
league count + season on the right, with a hairline rule separating
the header from the cards. Stacks vertically on mobile with meta pinned
right-aligned. Uses leagues.showcase.header.* i18n keys; reads count
from leagues.length and season from leagues[0].season — no new queries."
```

---

## Task 4: Visual verification

**Files:**
- No changes (verification only)

- [x] **Step 1: Start the dev server in the background**

Run: `npm run dev`
Wait for `Ready in Xms` output, then confirm `http://localhost:3000` is reachable.

- [x] **Step 2: Open `/leagues` at desktop width (1280×800)**

Verify:
- Eyebrow "GEORGIA'S OFFICIAL YOUTH COMPETITIONS" in primary green, uppercase, above the title.
- Title "Georgia's" in body text color, "Golden Leagues" in primary green italic, serif font.
- Description reads "Three age groups. Every match captured. One source of verified player data."
- Right side: "3 LEAGUES" in primary green above "2025–26 Season" in faint foreground (actual season string comes from the DB — confirm it reads whatever value `leagues[0].season` holds).
- Hairline rule below both blocks, above the hero card.

- [x] **Step 3: Open `/leagues` at tablet width (768×1024)**

Verify: layout remains a horizontal split (the `sm:` breakpoint is 640px), border rule is full-width.

- [x] **Step 4: Open `/leagues` at mobile width (375×812)**

Verify:
- Title block renders first, meta block below it.
- Meta block is right-aligned (count above season, both flush right).
- Border rule still spans full width below the meta block.
- Card grid begins below the rule with `mb-8` of breathing room.

- [x] **Step 5: Toggle to Georgian**

In the UI, switch language to KA. Reload `/leagues`.

Verify:
- Eyebrow reads "საქართველოს ოფიციალური ახალგაზრდული ჩემპიონატები".
- Title reads "საქართველოს" + "ოქროს ლიგები" (italic green).
- Description: "სამი ასაკობრივი ჯგუფი. ყოველი მატჩი ჩაწერილი. ერთი წყარო გადამოწმებული სტატისტიკისთვის."
- Count meta: `3 ლიგა`.
- Season meta: `{season} სეზონი`.
- Title renders in sans-serif (Noto Sans Georgian), not serif — Noto Serif has no Georgian glyphs, so the fallback must kick in. If you see boxes/tofu characters, the `isKa` branch is broken.

- [x] **Step 6: Empty-state sanity check (optional but recommended)**

Either (a) temporarily set `.eq('is_active', true)` to `.eq('is_active', false)` in `src/app/(shared)/leagues/page.tsx:47` to force zero leagues, reload, confirm the existing "No leagues available yet." text renders with **no** header, then revert; or (b) verify by code review that the early return at `LeagueShowcase.tsx:56-64` is unchanged and still runs before any header code.

- [x] **Step 7: Stop the dev server**

Ctrl-C the `npm run dev` process.

- [x] **Step 8: No commit needed** — this task is verification only. If any visual issue was found, return to Task 3 Step 4 with a fix, re-run the build, amend or add a follow-up commit.

---

## Self-Review Notes

**Spec coverage:**
- Layout (editorial split) → Task 3 Step 4
- Responsive stack at < sm → Task 3 Step 4 (flex-col / sm:flex-row), Task 4 Step 4 verification
- Empty state unchanged → Task 3 Step 1 (explicit "do not modify" instruction), Task 4 Step 6 verification
- Typography tokens → Task 3 Step 4 (classes match the spec table line-by-line)
- Font-family branching on lang → Task 3 Steps 2 & 4
- i18n keys (en + ka, 6 keys each) → Tasks 1 and 2
- Count from `leagues.length` → Task 3 Step 4
- Season from `leagues[0]?.season` → Task 3 Step 3
- Accessibility: `<h2>` (page `<h1>` lives in hero) → Task 3 Step 4 uses `<h2>`
- Build clean → Task 3 Step 6
- Visual verification at 3 breakpoints + lang toggle → Task 4 Steps 2-5

**Placeholder scan:** No TBDs, no "similar to above" references, every code block is complete.

**Type consistency:** `getServerT()` returns `{ t, lang }` — confirmed against existing usage in `LeagueHero.tsx:77`. `leagues: Database['public']['Tables']['leagues']['Row'][]` has `season: string` (required) — confirmed against `database.types.ts:347`.
