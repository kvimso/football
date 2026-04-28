# /demo Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/demo` in Binocly's cream editorial style (headline + 3-step strip + founder pull-quote + form card), update Navbar CTAs to match the approved mockup, and wire internal email alerts on submit via Resend sandbox.

**Architecture:** Pure UI restyle of an existing route. No DB, validation, or server-action logic changes beyond adding a post-insert `sendEmail()` call. The `DemoRequestForm` component keeps its state machine, validation, honeypot, and `existingStatus` branch untouched — only styles change. Navbar update is a two-line surgical class swap on the public-mode CTAs.

**Tech Stack:** Next.js 16 App Router (server components + client forms) · Tailwind CSS v4 with CSS custom properties · Resend for email · Supabase for DB. Project has no test framework configured — verification is `npm run build` (TypeScript + lint gate) + manual check at `http://localhost:3000/demo`.

**Reference:** design spec at `docs/superpowers/specs/2026-04-22-demo-page-redesign-design.md`. Approved mockup at `.superpowers/brainstorm/1192-1776846626/content/demo-layouts-v11.html` (Base variant).

---

## File Structure

All files already exist — no new files created.

| File | Responsibility | Change type |
|------|---------------|-------------|
| `src/app/(shared)/demo/page.tsx` | Server component: auth check, existingStatus query, layout composition | Full rewrite of JSX; server-side data fetching unchanged |
| `src/components/demo/DemoRequestForm.tsx` | Client form: state, validation, submit, success/status views | Restyle only — keep all logic, classes only |
| `src/components/layout/Navbar.tsx` | Global public/auth-aware nav | Two JSX Link `className` swaps (the "Request demo" CTA + the "Log in" link, unauthenticated branch only) |
| `src/lib/email.ts` | Resend wrapper (`sendEmail` helper) | Change `from:` string from `noreply@georgianfootball.com` → `onboarding@resend.dev` |
| `src/app/actions/submit-demo-request.ts` | Server action: validate + rate-limit + insert demo request | Add `sendEmail()` call after successful insert, wrapped in try/catch — does not affect the return value |

---

## Task 1: Rewrite `/demo` page layout

**Files:**
- Modify: `src/app/(shared)/demo/page.tsx` (full body of the default export)

- [x] **Step 1.1 — Replace the entire file contents**

Replace with the editorial split layout. Server-side data fetching (`auth.getUser`, demo_requests lookup) stays identical; only the returned JSX changes.

```tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DemoRequestForm } from '@/components/demo/DemoRequestForm'
import type { DemoStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Request Demo',
  description: 'Talk to the team behind Binocly. 24-hour response, no obligation.',
}

export default async function DemoPage() {
  let userEmail: string | undefined
  let existingStatus: DemoStatus | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userEmail = user?.email ?? undefined

    if (user) {
      const admin = createAdminClient()
      const { data: existing } = await admin
        .from('demo_requests')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (existing) {
        existingStatus = existing.status as DemoStatus
      }
    }
  } catch {
    // Auth check failed — show default form
  }

  const steps = [
    {
      n: '01',
      title: 'Tell us about you',
      desc: "Role, organisation, what you're looking for.",
    },
    { n: '02', title: 'We call within 24h', desc: 'Quick intro. No pitch deck.' },
    { n: '03', title: 'Access + pricing', desc: 'Tailored to your team size and use case.' },
  ] as const

  return (
    <section
      className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12"
      style={{ minHeight: 'calc(100vh - 77px)' }}
    >
      {/* Left column — pitch */}
      <div className="flex flex-col justify-start px-8 pt-16 pb-16 lg:col-span-7 lg:px-20 lg:pt-20 lg:pb-20">
        <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          Request a demo
        </div>
        <h1
          className="mb-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-5xl"
          style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
        >
          Talk to the team behind Binocly.
        </h1>
        <p className="mb-10 max-w-md text-[15px] leading-relaxed text-foreground-secondary">
          Tell us a little about you and we'll be in touch within 24 hours.
        </p>

        {/* 3-step strip */}
        <div className="mb-10 max-w-2xl border-t border-border pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n}>
                <div
                  className="mb-2 text-3xl font-normal text-primary"
                  style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
                >
                  {s.n}
                </div>
                <div className="mb-1 text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-[12px] leading-relaxed text-foreground-secondary">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder pull-quote */}
        <div className="mt-40 max-w-xl border-l-2 border-primary py-3 pl-6">
          <p
            className="mb-4 text-xl italic leading-relaxed text-foreground"
            style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
          >
            &ldquo;We built Binocly because the Georgian pipeline was invisible. You shouldn&apos;t
            need three phone calls to find a player.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <span
              className="text-base italic text-foreground"
              style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
            >
              Levani Talakhadze
            </span>
            <span
              aria-hidden="true"
              className="inline-block h-1 w-1 rounded-full bg-primary opacity-50"
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-faint">
              Founder · Binocly
            </span>
          </div>
        </div>
      </div>

      {/* Right column — form card */}
      <div className="flex items-center bg-surface px-8 py-16 lg:col-span-5 lg:px-16 lg:py-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Request access
          </div>
          <h2
            className="mb-3 text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
          >
            Schedule a demo
          </h2>
          <p className="mb-8 text-[13px] leading-relaxed text-foreground-secondary">
            24-hour response. No obligation.
          </p>
          <DemoRequestForm defaultEmail={userEmail} existingStatus={existingStatus} />
        </div>
      </div>
    </section>
  )
}
```

Notes:
- `foreground-faint` / `foreground-secondary` / `surface` / `primary` / `border` are existing Tailwind tokens backed by CSS variables in `globals.css`. No new tokens added.
- Serif font family is referenced via the `--font-noto-serif` variable already loaded globally in `app/layout.tsx`.
- Success and error branches of the form live inside `DemoRequestForm`, so this page file no longer needs a success card.
- `mt-40` on the quote matches the approved mockup breathing room. On mobile (< `lg`), the grid collapses to a single column; `mt-40` may feel loose — we'll visually verify in step 1.2 and tighten responsively if needed.

- [x] **Step 1.2 — Run `npm run build` and visually verify**

```bash
npm run build
```

Expected: build passes with no TypeScript or lint errors. If it fails on an import, check that `DemoStatus` is still exported from `@/lib/types` (it was in the original file; should not have moved).

Then start dev server and open in a browser:

```bash
npm run dev
```

Visit `http://localhost:3000/demo`. Expected visual state:
- Cream background left column with "REQUEST A DEMO" eyebrow in forest green, serif headline "Talk to the team behind Binocly.", subtitle, 3-step band (01 / 02 / 03 with serif green numbers), pull-quote with left green rule, attribution row.
- Right column on `surface` beige tint with "REQUEST ACCESS" eyebrow, "Schedule a demo" serif heading, 24h line, and the form (still with its OLD input styling — that's fixed in Task 2).
- Mobile (DevTools → responsive 375px): layout stacks. Quote mt-40 on mobile produces a large gap — flag and fix if it looks broken.

If mobile gap is too large, replace `mt-40` with `mt-12 lg:mt-40`:

```diff
- <div className="mt-40 max-w-xl border-l-2 border-primary py-3 pl-6">
+ <div className="mt-12 max-w-xl border-l-2 border-primary py-3 pl-6 lg:mt-40">
```

- [x] **Step 1.3 — Commit**

```bash
git add src/app/(shared)/demo/page.tsx
git commit -m "$(cat <<'EOF'
feat(demo): editorial split layout with founder pull-quote

- Replace benefit-bullet + pricing-card layout with headline + 3-step
  process strip + founder quote on left, form card on right.
- Serif headline, warm tokens only (background/surface/primary/border).
- Quote attributed to Levani Talakhadze, Founder · Binocly.
- Form + existingStatus logic unchanged (Task 2 will restyle the form).

Spec: docs/superpowers/specs/2026-04-22-demo-page-redesign-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Restyle `DemoRequestForm` to match the form card

**Files:**
- Modify: `src/components/demo/DemoRequestForm.tsx` — only the JSX class strings and the `inputClasses` constant. Every `useState`, `useTransition`, `useRef`, `handleSubmit`, honeypot/time-gate, validation, and submit path stays as-is.

- [x] **Step 2.1 — Replace the `inputClasses` constant and restyle the two early-return branches**

Find `const inputClasses = '...'` around line 128 and replace with:

```tsx
const inputClasses =
  'mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/10'

const labelClasses =
  'block text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-faint'
```

(Add the `labelClasses` constant right below `inputClasses`.)

Then replace the `existingStatus` early-return block (around lines 34-70) with:

```tsx
if (existingStatus) {
  const statusKey =
    `demo.status${existingStatus.charAt(0).toUpperCase()}${existingStatus.slice(1).replace(/_(\w)/g, (_, c: string) => c.toUpperCase())}` as
      | 'demo.statusNew'
      | 'demo.statusContacted'
      | 'demo.statusDemoDone'
      | 'demo.statusDeclined'

  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <svg
          aria-hidden="true"
          className="h-7 w-7 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{t('demo.alreadySubmitted')}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-foreground-secondary">{t(statusKey)}</p>
      {existingStatus === 'declined' && (
        <p className="mt-2 text-[13px] text-foreground-secondary">
          <a href="mailto:info@gft.ge" className="font-medium text-primary hover:underline">
            info@gft.ge
          </a>
        </p>
      )}
    </div>
  )
}
```

Then replace the `sent` early-return block (the one after, around lines 72-90) with:

```tsx
if (sent) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <svg
          aria-hidden="true"
          className="h-7 w-7 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{t('demo.successTitle')}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground-secondary">
        {t('demo.successMessage')}
      </p>
    </div>
  )
}
```

- [x] **Step 2.2 — Replace every form field label/input block with the new styling**

Replace the final `return` block (the `<form>`) with:

```tsx
return (
  <form onSubmit={handleSubmit} className="space-y-5">
    {error && (
      <div className="rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-[13px] text-danger">
        {error}
      </div>
    )}

    {/* Honeypot — hidden from real users */}
    <input
      type="text"
      name="website"
      aria-hidden="true"
      tabIndex={-1}
      autoComplete="off"
      className="absolute -left-[9999px]"
    />

    <div>
      <label htmlFor="demo-name" className={labelClasses}>
        {t('demo.formName')}
      </label>
      <input
        id="demo-name"
        type="text"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className={inputClasses}
      />
    </div>

    <div>
      <label htmlFor="demo-email" className={labelClasses}>
        {t('demo.formEmail')}
      </label>
      <input
        id="demo-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClasses}
      />
    </div>

    <div>
      <label htmlFor="demo-org" className={labelClasses}>
        {t('demo.formOrganization')}
      </label>
      <input
        id="demo-org"
        type="text"
        required
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        className={inputClasses}
      />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="demo-role" className={labelClasses}>
          {t('demo.formRole')}
        </label>
        <select
          id="demo-role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`${inputClasses} appearance-none`}
        >
          <option value="">{t('demo.selectRole')}</option>
          {DEMO_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="demo-country" className={labelClasses}>
          {t('demo.formCountry')}
        </label>
        <select
          id="demo-country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={`${inputClasses} appearance-none`}
        >
          <option value="">{t('demo.selectCountry')}</option>
          {SCOUT_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div>
      <label htmlFor="demo-message" className={labelClasses}>
        {t('demo.formMessage')}
      </label>
      <textarea
        id="demo-message"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('demo.formMessagePlaceholder')}
        className={`${inputClasses} resize-none`}
      />
    </div>

    <button
      type="submit"
      disabled={isPending}
      className="w-full rounded-[10px] bg-primary px-4 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-[0_4px_14px_rgba(27,138,74,0.18)] transition-all hover:-translate-y-[1px] hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)] hover:shadow-[0_6px_20px_rgba(27,138,74,0.26)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {isPending ? t('demo.submitting') : t('demo.submit')}
    </button>
  </form>
)
```

Notes:
- Do NOT use the global `.btn-primary` class — it's unlayered in `globals.css` and would fight the Tailwind utilities. Using `bg-primary` + `text-white` explicitly avoids the specificity war (see Tailwind Cascade Layer Gotcha note in `CLAUDE.md`).
- `color-mix(in srgb, var(--primary) 88%, black)` produces the darker hover shade without needing a new token. Modern browser feature — supported on all Binocly-relevant browsers (Chrome 111+, Safari 16.2+, Firefox 113+).
- `danger-muted` and `danger` tokens already exist in `globals.css`.
- `translate-y` on the submit button: disabled state resets it so a disabled button doesn't look hover-animated.

- [x] **Step 2.3 — Build + visually verify the form card**

```bash
npm run build
```

Expected: build passes. If a type error mentions `labelClasses` unused, you forgot to use it — re-check the replacements.

```bash
npm run dev
```

Visit `http://localhost:3000/demo`. Expected:
- Labels above each input are now tiny uppercase letter-spaced faint text.
- Inputs are white, rounded-lg, with a faint border that turns green on focus + a subtle green focus ring.
- Submit button is a full-width green pill-ish rectangle with uppercase tracked "REQUEST DEMO" (or whatever `demo.submit` translates to); hover lifts by 1px and deepens the green shadow.
- Error state (trigger it by submitting empty fields): inline error banner in red/danger tokens.
- The existing-status view (log in as Levani with a pending demo) shows the restyled green check + message. Verify by logging in at `/login` with `levanitalakhadze0@gmail.com` / `Kvimsina123` (test password from memory) if a demo request already exists for that user; otherwise skip.
- Success state (submit the form successfully): shows the same restyled green check card.

- [x] **Step 2.4 — Commit**

```bash
git add src/components/demo/DemoRequestForm.tsx
git commit -m "$(cat <<'EOF'
feat(demo): restyle form to match editorial card

- New uppercase letter-spaced micro labels.
- Rounded inputs on white with green focus ring.
- Green primary submit button with hover lift + shadow, no reliance on
  the global .btn-primary class (avoids Tailwind cascade layer issues).
- Existing status + success cards restyled to match the same palette.
- State machine, validation, honeypot, and time-gate unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Update Navbar CTA styling

**Files:**
- Modify: `src/components/layout/Navbar.tsx:164-178` (the two `Link`s inside the unauthenticated branch — `Request demo` and `Log in`). Nothing else in the Navbar touched. Mobile menu stays as-is.

- [x] **Step 3.1 — Swap the two CTA Link classNames**

Find this block (currently around lines 163-178):

```tsx
) : (
  <>
    <ThemeToggle />
    <Link
      href="/demo"
      className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-btn-primary-text transition-colors hover:opacity-90"
    >
      {t('nav.requestDemo')}
    </Link>
    <Link
      href="/login"
      className="text-sm text-foreground-muted hover:text-foreground transition-colors"
    >
      {t('nav.login')}
    </Link>
  </>
)}
```

Replace with:

```tsx
) : (
  <>
    <ThemeToggle />
    <Link
      href="/login"
      className="text-[11px] font-semibold uppercase tracking-widest text-foreground-faint transition-colors hover:text-foreground"
    >
      {t('nav.login')}
    </Link>
    <Link
      href="/demo"
      className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
    >
      {t('nav.requestDemo')}
    </Link>
  </>
)}
```

Note: the two Links are reordered so "Log in" comes first (left) and the green pill CTA is rightmost — matches the mockup reading order. Also switched from `text-btn-primary-text` to explicit `text-white` for consistency with the demo page CTA, and from `hover:opacity-90` to a proper darker green hover via `color-mix`.

- [x] **Step 3.2 — Build + verify every public page still looks right**

```bash
npm run build
```

Expected: build passes.

```bash
npm run dev
```

Walk through each public route in the browser (unauthenticated):
- `http://localhost:3000/` (landing)
- `http://localhost:3000/about`
- `http://localhost:3000/contact`
- `http://localhost:3000/leagues`
- `http://localhost:3000/demo` — expect the green pill to be active/highlighted or distinguishable
- `http://localhost:3000/login`

Check:
- Top right shows: `LOGIN` (faint uppercase) + green pill `REQUEST DEMO`. Login text darkens on hover. Pill darkens on hover.
- Logged-in routes (dashboard / admin / platform) are UNCHANGED — still show AvatarDropdown.
- Mobile menu still works (collapse drawer opens the existing mobile links).

If any page looks broken (text wrap, overflow), screenshot the issue and pause.

- [x] **Step 3.3 — Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "$(cat <<'EOF'
feat(nav): editorial CTAs for public navbar

- Log in: subtle uppercase tracked link in foreground-faint.
- Request demo: green pill with uppercase tracked label.
- Reorder so login sits left of the pill (matches mockup).
- Authenticated and mobile menu paths unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wire internal email alert on demo submit

**Files:**
- Modify: `src/lib/email.ts:30` (sender string)
- Modify: `src/app/actions/submit-demo-request.ts` (add `sendEmail` call + import)

- [x] **Step 4.1 — Update the Resend sender to the sandbox address**

Open `src/lib/email.ts` and change line 30:

```diff
-      from: 'Georgian Football Platform <noreply@georgianfootball.com>',
+      from: 'Binocly <onboarding@resend.dev>',
```

Nothing else in the file changes. `onboarding@resend.dev` is Resend's sandbox sender — delivers only to the Resend account owner's signup email (confirmed to be `kvimsina@gmail.com`). This unblocks internal alerts without a verified domain. When Binocly's real domain is verified later, this string switches to e.g. `Binocly <hello@binocly.com>` (tracked in `Haveinmind.md`).

- [x] **Step 4.2 — Add the email alert to `submitDemoRequest`**

Open `src/app/actions/submit-demo-request.ts`. Add an import near the top:

```tsx
import { sendEmail } from '@/lib/email'
```

Then find the final success return and add the alert email just before it. The modified bottom half of the function looks like:

```tsx
  // Insert (normalize email to lowercase for consistent matching)
  const { error } = await admin.from('demo_requests').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email.toLowerCase(),
    organization: parsed.data.organization,
    role: parsed.data.role,
    country: parsed.data.country,
    message: parsed.data.message || null,
    user_id: user?.id ?? null,
  })

  if (error) {
    console.error('[submit-demo-request] Insert error:', error.message)
    return { error: 'errors.serverError' }
  }

  // Fire internal alert email — non-blocking.
  // Sandbox sender restricts delivery to the Resend account signup
  // (kvimsina@gmail.com). Forwarding to Levani is handled via a Gmail
  // filter until Binocly's domain is verified. See Haveinmind.md.
  try {
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const html = `
<h2 style="font-family:Georgia,serif;margin:0 0 16px;color:#1A1917">New demo request</h2>
<table style="font-family:system-ui,sans-serif;font-size:14px;color:#1A1917;border-collapse:collapse">
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Name</td><td style="padding:4px 0">${escapeHtml(parsed.data.full_name)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Email</td><td style="padding:4px 0">${escapeHtml(parsed.data.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Organisation</td><td style="padding:4px 0">${escapeHtml(parsed.data.organization)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Role</td><td style="padding:4px 0">${escapeHtml(parsed.data.role)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Country</td><td style="padding:4px 0">${escapeHtml(parsed.data.country)}</td></tr>
</table>
${
  parsed.data.message
    ? `<p style="margin:16px 0 0;padding:12px 16px;background:#F4F1EC;border-left:2px solid #1B8A4A;font-family:system-ui,sans-serif;font-size:14px;color:#1A1917;white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>`
    : ''
}
<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:13px">
  <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://football-v44v.vercel.app'}/platform/demo-requests" style="color:#1B8A4A;font-weight:600">Review in admin →</a>
</p>`

    await sendEmail({
      to: 'kvimsina@gmail.com',
      subject: `New demo request — ${parsed.data.full_name} · ${parsed.data.organization}`,
      html,
    })
  } catch (err) {
    // Email is fire-and-forget; log but do not fail the request.
    console.error('[submit-demo-request] Email alert failed:', err)
  }

  return { success: true as const }
}
```

Notes:
- `sendEmail()` already swallows errors internally and returns early if `RESEND_API_KEY` is missing (see `email.ts`) — the outer try/catch is defense-in-depth.
- HTML is inline-styled because email clients strip classes. Uses Binocly's token hex values directly.
- `NEXT_PUBLIC_SITE_URL` fallback: in prod the Vercel deploy URL works; when a custom domain is wired later, set `NEXT_PUBLIC_SITE_URL` in Vercel and this picks it up automatically.
- The `escapeHtml` helper prevents HTML injection via the free-text `organization` / `full_name` / `message` fields. Required because we're interpolating user input into HTML.

- [x] **Step 4.3 — Build + verify email send locally**

```bash
npm run build
```

Expected: build passes. If `sendEmail` import fails, confirm `@/lib/email` is correct — no rename occurred.

```bash
npm run dev
```

Open `http://localhost:3000/demo`, fill the form with:
- Full name: `Test Demo`
- Email: a throwaway address (not `kvimsina@gmail.com` — that's the recipient, not the submitter)
- Organisation: `Test Academy`
- Role: any
- Country: any
- Message: `Testing the alert pipeline`

Submit. Expected:
- Success state appears in the browser (green check card).
- Within ~30 seconds, `kvimsina@gmail.com` receives an email:
  - From: `Binocly <onboarding@resend.dev>`
  - Subject: `New demo request — Test Demo · Test Academy`
  - Body: name, email, organisation, role, country, the test message, and a "Review in admin →" link.

If the email doesn't arrive:
- Check `https://resend.com/emails` for the send log — if it shows a bounce/error, note it.
- Confirm `.env.local` has `RESEND_API_KEY=...`.
- Check terminal logs for `[submit-demo-request] Email alert failed:` — if present, the error message tells you what failed.
- If Resend says "recipient not in account," confirm the Resend account is actually registered to `kvimsina@gmail.com` (https://resend.com/settings/account).

Cleanup: delete the test row from `demo_requests` if it clutters the admin list.

- [x] **Step 4.4 — Commit**

```bash
git add src/lib/email.ts src/app/actions/submit-demo-request.ts
git commit -m "$(cat <<'EOF'
feat(demo): send internal alert email on submit

- Swap sender in lib/email.ts to Resend sandbox onboarding@resend.dev
  (old georgianfootball.com was not verified; bounces).
- After a successful demo_requests insert, fire a non-blocking sendEmail
  with the submission details to kvimsina@gmail.com.
- Safely escape user input into the HTML template.
- Gmail filter forwards to Levani; submitter confirmation emails still
  deferred until Binocly domain is verified (see Haveinmind.md).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## After All Tasks

- [ ] **Final verification** — run the public nav walk once more with all four commits applied:
  - `/` renders without visual regression.
  - `/demo` shows the new layout + restyled form + updated nav CTAs.
  - A real submission triggers an email to `kvimsina@gmail.com`.
  - `npm run build` passes end-to-end.

- [ ] **Push to origin** (when Andria gives the go-ahead — not automatic):

```bash
git push origin main
```

- [ ] **Update `Haveinmind.md`** only if any new deferral was discovered during implementation that wasn't already tracked.

---

## Rollback

If any commit misbehaves after push:

```bash
git revert <commit-sha>
```

Each task's commit is self-contained — reverting one doesn't require reverting the others.

---

## Spec Coverage Check

| Spec requirement | Task |
|-----|-----|
| Split 7/5 editorial layout with headline + steps + founder quote | Task 1 |
| Exact copy ("Talk to the team behind Binocly." etc.) | Task 1 |
| 3-step strip with serif 01/02/03 green | Task 1 |
| Founder pull-quote with `mt-40`, left green rule, attribution | Task 1 |
| Form card on `--surface`, uppercase labels, white inputs, green focus | Task 2 |
| Green primary submit, hover lift, no `.btn-primary` collision | Task 2 |
| `existingStatus` + `sent` branches restyled | Task 2 |
| State/validation/honeypot logic untouched | Task 2 |
| Navbar "Log in" → subtle uppercase tracked | Task 3 |
| Navbar "Request demo" → green pill | Task 3 |
| Email sender updated to sandbox | Task 4 |
| Internal alert email on submit to `kvimsina@gmail.com` | Task 4 |
| User confirmation email (deferred) | — (tracked in `Haveinmind.md`) |
| Footer unchanged | — (no task; explicitly out of scope) |
| English-only copy | Task 1 (hard-coded); Tasks 2-3 reuse existing `t()` calls whose English values match the mockup |
