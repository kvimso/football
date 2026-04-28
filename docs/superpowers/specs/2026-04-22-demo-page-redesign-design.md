# /demo page redesign — design spec

**Date:** 2026-04-22
**Author:** Claude (via Andria's brainstorming session)
**Status:** Ready for review
**Related:** `Haveinmind.md` (domain + email wiring deferred to pre-launch)

---

## Goal

Redesign `/demo` (Request Demo page) in Binocly's cream editorial style so it matches the vibe of landing, about, and leagues. The current page is functional but plain — benefits bullet list + basic form. Replace with a split editorial layout that sells the demo call without adding fake testimonials, fake logo walls, or made-up pricing.

No changes to form data, validation, backend, or email behavior. Visual + copy only.

## In scope (email, partial)

Resend account is registered under `kvimsina@gmail.com`; API key is already in `.env.local` and Vercel production. No verified domain yet, so we use Resend's sandbox sender `onboarding@resend.dev`, which restricts delivery to the Resend account's signup email only. That's fine for internal alerts — Andria reads them, a Gmail forward rule relays to Levani.

- **Internal alert email** on each demo request submission, sent to `kvimsina@gmail.com`. Subject: `New demo request — [Name] · [Organisation]`. Body: name, email, organisation, role, country, message, + link to `/platform/demo-requests`. (Andria sets up a Gmail filter to auto-forward these to `levanitalakhadze0@gmail.com` manually — no code side.)
- **Update `src/lib/email.ts`** `from:` to `Binocly <onboarding@resend.dev>` (old `noreply@georgianfootball.com` is not verified in the current Resend account and would bounce).

## Out of scope

- **Submitter confirmation email** ("Thanks, we'll be in touch"). Sandbox sender can't deliver to arbitrary addresses — deferred until domain is verified (tracked in `Haveinmind.md`).
- Other pages (contact, about, landing, leagues) — unchanged.
- Footer redesign — keep current Binocly footer.
- i18n — site is English-only per memory.
- Backend / DB schema / validation.

## Final layout (approved from visual companion, Base variant in `demo-layouts-v11.html`)

### Page structure

- Route: `/demo` (under `(shared)` group, already exists)
- Wrapper: `max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-77px)]`
- Column split: `lg:col-span-7` (pitch) + `lg:col-span-5` (form, on `--surface` tint)
- Left column: `px-8 lg:px-20 pt-16 pb-16 lg:pt-20 lg:pb-20 flex flex-col justify-start`
- Right column: `bg-[color:var(--surface)] px-8 lg:px-16 py-16 lg:py-24 flex items-center`

### Left column content (top → bottom)

1. **Eyebrow:** `Request a demo` — `eyebrow` class, `text-[color:var(--primary)]`, `mb-5`.
2. **Headline:** "Talk to the team behind Binocly." — `serif text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-[color:var(--foreground)] mb-6 max-w-xl`.
3. **Subtitle:** "Tell us a little about you and we'll be in touch within 24 hours." — `text-[15px] leading-relaxed text-[color:var(--foreground-secondary)] max-w-md mb-10`.
4. **3-step strip** — `pt-6 border-t border-[color:var(--border)] max-w-2xl mb-10` with a `grid grid-cols-1 sm:grid-cols-3 gap-6`. Each step:
   - Serif number `01` / `02` / `03` (`serif text-3xl text-[color:var(--primary)] mb-2`)
   - Step title (`text-sm font-semibold mb-1`)
   - Step description (`text-[12px] leading-relaxed text-[color:var(--foreground-secondary)]`)
   - Copy:
     - **01 Tell us about you** — "Role, organisation, what you're looking for."
     - **02 We call within 24h** — "Quick intro. No pitch deck."
     - **03 Access + pricing** — "Tailored to your team size and use case."
5. **Founder pull-quote** — `mt-40 max-w-xl pull-quote` (2px solid `--primary` left border, 24px left padding):
   - Quote body: `serif text-xl italic leading-relaxed text-[color:var(--foreground)] mb-4`
   - Text: *"We built Binocly because the Georgian pipeline was invisible. You shouldn't need three phone calls to find a player."*
   - Attribution row: `flex items-center gap-3`
     - `<span class="signature text-base">Levani Talakhadze</span>` (serif italic)
     - `<span class="partner-dot"></span>` (4px green dot, opacity 0.5)
     - `<span class="eyebrow text-[color:var(--foreground-faint)]">Founder · Binocly</span>`

### Right column content (the form card)

- Eyebrow `Request access` — primary green, `mb-4`.
- `h2` "Schedule a demo" — `serif text-3xl font-bold tracking-tight`, `mb-3`.
- Sub-subtitle "24-hour response. No obligation." — `text-[13px] text-[color:var(--foreground-secondary)] mb-8`.
- Form (unchanged fields):
  - Full name
  - Professional email
  - Organisation
  - Role (select: Scout / Club / Academy / Agency — from `DEMO_ROLES`)
  - Country (select: from `SCOUT_COUNTRIES`)
  - Message (textarea)
  - Submit: green primary button, full width, uppercase tracking
- Existing `existingStatus` view (for logged-in users with a pending request) must be restyled to the new token palette but keep the same logic.

### Form field styling (new)

- Labels: `text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--foreground-faint)]`, `mb-1.5`.
- Inputs: `bg-white border border-[color:var(--border)] rounded-lg px-3.5 py-3 text-[13px]`. On focus: `border-color: var(--primary)`, `box-shadow: 0 0 0 3px rgba(27,138,74,0.1)`.
- Submit button: `bg-[color:var(--primary)] text-white font-bold text-[11px] uppercase tracking-[0.22em] py-4 rounded-[10px] w-full`. Hover: darker green `--primary-hover` + `translateY(-1px)` + deeper shadow.

## Files to change

| File | Change |
|------|--------|
| `src/app/(shared)/demo/page.tsx` | Rewrite layout to the split editorial shown above. Keep existing data-fetching: `auth.getUser()` for `userEmail`, admin client for `existingStatus` query. |
| `src/components/demo/DemoRequestForm.tsx` | Restyle only — new label/input classes, new submit styling. **Do not touch** the state logic, validation, honeypot, timeDiff, `existingStatus` branch, or the success branch. Restyle both the form and the status/success views to the new token palette. |
| `src/components/layout/Navbar.tsx` | Update nav CTAs: "Log in" → subtle uppercase tracked link (`text-[11px] font-semibold tracking-widest uppercase text-[color:var(--foreground-faint)] hover:text-[color:var(--foreground)]`); "Request demo" CTA → green primary pill (`bg-[color:var(--primary)] text-white text-[11px] font-bold tracking-[0.22em] uppercase px-5 py-2.5 rounded-full hover:bg-[color:var(--primary-hover)]`). These styles apply globally. |
| `src/lib/email.ts` | Change hard-coded `from:` address from `Georgian Football Platform <noreply@georgianfootball.com>` → `Binocly <onboarding@resend.dev>`. When Binocly domain is bought and verified later, update to `Binocly <hello@binocly.com>` (tracked in `Haveinmind.md`). |
| `src/app/actions/submit-demo-request.ts` | After successful DB insert, fire `sendEmail()` with a formatted alert to `kvimsina@gmail.com`. Wrap in try/catch — email failures should NOT block or reverse the insert. If `RESEND_API_KEY` is missing, `sendEmail()` already logs and returns early, so no crash. |

## What stays exactly the same

- `submitDemoRequest` server action (no email send; DB insert only — email wiring deferred).
- `demoRequestFormSchema` validation.
- `demo_requests` table schema.
- Honeypot + 2s time gate + 3-per-hour rate limit.
- Handling of logged-in user with pending request (shows status card, not the form).
- `/platform/demo-requests` admin view.

## Risks & mitigations

- **`.btn-primary` global class** (in `globals.css`, unlayered) overrides Tailwind utilities. On the form submit we'll use full Tailwind utilities (no `btn-primary` class) to avoid specificity fights — per the Cascade Layer Gotcha note in memory.
- **Mobile** (< `lg`): the grid collapses to a single column. Quote `mt-40` must not blow out mobile height — verify at 375px and reduce to `mt-12 lg:mt-40` if needed.
- **Navbar globally**: changing "Log in" and "Request demo" styling affects every public page. Visually verify landing, about, leagues after the change.
- **Existing status card**: the current green success/status icons live on cream. Must still read cleanly after restyle.

## Open questions (resolved 2026-04-22)

1. ✅ **Navbar change scope** — OK to update `Navbar.tsx` globally.
2. ✅ **Founder quote** — approved under Levani Talakhadze's name.
3. ✅ **Email sender** — `src/lib/email.ts` updated to `Binocly <onboarding@resend.dev>` (sandbox). Internal alerts to `kvimsina@gmail.com` included in this PR; user confirmation emails deferred until domain verified.

## Deferred (tracked in `Haveinmind.md`)

- Buy Binocly domain (Cloudflare, ~$10/yr).
- Verify the domain in Resend.
- Change `src/lib/email.ts` `from:` to `Binocly <hello@binocly.com>` once domain verified.
- Add submitter confirmation email (`sendEmail()` to the user who submitted) — can't deliver under sandbox.
- Point domain at Vercel; move off `football-v44v.vercel.app`.

## Implementation plan (4 commits)

1. **Demo page layout rewrite** — `src/app/(shared)/demo/page.tsx` only.
2. **DemoRequestForm restyle** — `src/components/demo/DemoRequestForm.tsx` only.
3. **Navbar CTAs update** — `src/components/layout/Navbar.tsx` only.
4. **Internal email alert** — `src/lib/email.ts` (update sender) + `src/app/actions/submit-demo-request.ts` (call `sendEmail` post-insert).

Each commit should pass `npm run build` before moving to the next.

## Acceptance

- `/demo` renders the approved split editorial layout desktop + mobile.
- Form still submits → writes to `demo_requests` → returns success state (same as today).
- Logged-in user with pending request still sees the status card (not the form).
- Navbar "Log in" and "Request demo" match the mockup styling on every public route.
- `npm run build` passes with no TS or lint errors.
- No regression on `/contact`, `/about`, `/leagues`, `/`, `/login`, `/register`.

---

**Next step after review:** invoke `superpowers:writing-plans` to produce the execution plan, then implement in the 3 commits above.
