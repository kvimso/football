# Unify Unauthenticated Nav — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every unauthenticated page render the same nav CTAs — "Login" (subtle uppercase tracked link) + "Request Demo" (green pill) — matching the pattern already shipped in `Navbar.tsx`.

**Architecture:** A single shared `Nav` component at `src/components/landing/Nav.tsx` is used by both the `(public)` and `(auth)` layouts. Update that one component. The `(shared)` / `(platform)` routes use a different `Navbar.tsx` (already updated in the previous plan). No new component, no route-level changes.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 with CSS custom properties. No tests configured — verify via `npm run build` + manual browser check across `/`, `/login`, `/register`.

**Reference:** previous plan `docs/superpowers/plans/2026-04-22-demo-page-redesign.md` Task 3 (Navbar pattern to replicate).

---

## Current state vs. target

**Where `Nav` renders:**
- `src/app/(public)/page.tsx:1,49` — landing page mounts `<Nav />` directly (no layout).
- `src/app/(auth)/layout.tsx:1,7` — login/register wrapped by this layout.

**Current CTA (`src/components/landing/Nav.tsx:15-17`):** one black pill `Get Started` → `/register`.

**Target CTA:** two controls side-by-side:
1. `Login` link — uppercase tracked, `text-foreground-faint` default / `text-foreground` hover → `/login`.
2. `Request Demo` pill — green `bg-primary`, rounded-full, uppercase tracked → `/demo`.

This matches `Navbar.tsx:167-177` verbatim, so the two navs render visually identical top-right blocks across every unauth page.

---

## File Structure

No new files. One file changes.

| File | Responsibility | Change |
|------|---------------|--------|
| `src/components/landing/Nav.tsx` | Unauth nav — wordmark + center links + CTA block | Replace the single `Get Started` Link with two Links (Login + Request Demo) using Tailwind utilities that match `Navbar.tsx` exactly. Keep wordmark, center links, and the wrapper CSS (`landing-nav`, `landing-nav-inner`, `landing-nav-links`) untouched. |

**Unused cleanup (out of scope):** the `.landing-nav-cta` CSS class in `globals.css` will become dead code after this change. Leaving it — removing unused CSS is a separate cleanup task and not worth the scope creep here.

---

## Task 1: Replace `Get Started` pill with Login + Request Demo CTAs

**Files:**
- Modify: `src/components/landing/Nav.tsx`

- [x] **Step 1.1 — Swap the CTA block**

Open `src/components/landing/Nav.tsx`. Replace the entire file contents with:

```tsx
import Link from 'next/link'

export function Nav() {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-logo">
          Binocly
        </Link>
        <div className="landing-nav-links">
          <Link href="/leagues">Leagues</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[11px] font-semibold uppercase tracking-widest text-foreground-faint transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
          >
            Request Demo
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

Notes:
- The two CTAs are grouped in a `flex items-center gap-4` wrapper so they sit side-by-side regardless of what `.landing-nav` does to its children.
- Copy (`Login`, `Request Demo`) is hard-coded — landing is English-only per memory.
- The hover darker-green uses the same `color-mix` pattern from `Navbar.tsx` for consistency. No new tokens.
- Deliberately NOT touching `.landing-nav-links` styling or the `Binocly` wordmark — only the CTA block on the right.

- [x] **Step 1.2 — Build + visually verify on all unauth pages**

```bash
npm run build
```

Expected: passes with no TypeScript or lint errors.

Start / keep the dev server running:

```bash
npm run dev
```

Walk these three routes in an incognito window (to guarantee logged-out state) and check that the nav CTA block is **identical** on each:

- `http://localhost:3000/` — landing hero.
- `http://localhost:3000/login` — login form.
- `http://localhost:3000/register` — register form.

Checklist:
- Top right of each page shows: faint uppercase `LOGIN` + green pill `REQUEST DEMO`.
- Hovering `Login` darkens the text to `text-foreground`.
- Hovering the `Request Demo` pill darkens the green background.
- Center nav links `Leagues / About / Contact` still appear only on `/` (they've always been scoped to landing — no change).
- Wordmark `Binocly` still serif, top-left, links to `/`.

Also cross-check against the pages that use `Navbar.tsx` — they should look the same top-right:

- `http://localhost:3000/demo`
- `http://localhost:3000/about`
- `http://localhost:3000/contact`
- `http://localhost:3000/leagues`

Expected: the top-right CTA block on any of these matches the landing/login/register top-right exactly (pixel-level parity).

If spacing or alignment looks off between the two nav implementations (one might be `py-5` vs. the other inherits from `.landing-nav`), note it and tighten — acceptable diff is any gap caused by `.landing-nav` height vs `.sticky` Navbar height, not by the CTA block itself.

- [x] **Step 1.3 — Commit**

```bash
git add src/components/landing/Nav.tsx
git commit -m "$(cat <<'EOF'
feat(nav): unify unauth nav CTAs across landing and auth pages

Replace the single Get Started pill on LandingNav with two controls
that mirror the public Navbar exactly:

- Login: subtle uppercase tracked link → /login.
- Request Demo: green pill → /demo.

Landing, /login, and /register now share identical top-right CTAs
with the rest of the public site (demo, about, contact, leagues).

The .landing-nav-cta class in globals.css is now dead — leaving for
a future CSS cleanup pass.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## After the Task

- [ ] **Push when ready** (not automatic):

```bash
git push origin main
```

- [ ] **Haveinmind.md** — no new deferrals. The dead `.landing-nav-cta` CSS class is cosmetic cruft, not a launch blocker.

---

## Rollback

```bash
git revert HEAD
```

Single-commit change, clean revert.

---

## Spec Coverage Check

| Requirement | Task |
|-----|-----|
| All unauthenticated pages show the same nav CTAs | Task 1 (updates the single shared `Nav` component used by both `(public)` and `(auth)`) |
| CTAs are "Login" + "Request Demo" side-by-side | Task 1 Step 1.1 |
| Visual match to existing `Navbar.tsx` pattern | Task 1 Step 1.1 (utilities copied verbatim) |
| Authenticated pages unchanged | — (out of scope; this file only renders on unauth layouts) |
| Center nav links preserved on landing | — (only the CTA block touched) |
