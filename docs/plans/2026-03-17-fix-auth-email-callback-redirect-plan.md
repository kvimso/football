---
title: Fix Auth Email Callback Redirect to Localhost
type: fix
status: completed
date: 2026-03-17
---

# Fix Auth Email Callback Redirect to Localhost

## Overview

When a user registers, Supabase sends a confirmation email with a link pointing to `http://localhost:3000/?code=...` instead of the production URL. Two separate issues: (1) wrong domain (localhost vs production), and (2) wrong path (`/` vs `/callback` where code exchange happens).

## Problem Statement

**Reported:** Confirmation email links go to `http://localhost:3000/?code=...`

**Root causes:**
1. **Supabase Dashboard Site URL** is set to `http://localhost:3000` — all auth emails use this as the base URL
2. **No `emailRedirectTo`** in `RegisterForm.tsx` `signUp()` call — defaults to Dashboard Site URL
3. **`NEXT_PUBLIC_SITE_URL`** is commented out in `.env.local` and not set on Vercel — admin invite falls back to `http://localhost:3000`
4. **Wrong path:** Even with correct domain, links go to `/` (landing page) not `/callback` where `exchangeCodeForSession()` lives

**Affected flows:**
- Scout self-registration (email confirmation)
- Academy admin invite (magic link)

**Not affected:** Login (`signInWithPassword` — no email involved)

## Proposed Solution

### Part 1: Supabase Dashboard (manual, no code)

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** Change `http://localhost:3000` → `https://football-v44v.vercel.app`
- **Redirect URLs (allowlist):** Add:
  - `https://football-v44v.vercel.app/callback`
  - `http://localhost:3000/callback` (local dev)

### Part 2: Code Changes

**File: `src/components/auth/RegisterForm.tsx`** (~line 26)

Add `emailRedirectTo` to the `signUp` options:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/callback`,
    data: { full_name, organization, country },
  },
})
```

This ensures the confirmation link always points to the correct domain AND the `/callback` route where code exchange happens. Uses `window.location.origin` so it works on both localhost and production.

**File: `src/app/actions/admin-invite.ts`** (~line 74)

The admin invite already points to `/callback?next=/admin`, but `siteUrl` falls back to localhost. Fix:

```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
```

This uses Vercel's auto-provided URL as a middle fallback before localhost.

### Part 3: Vercel Environment Variable

Set on Vercel:
```
NEXT_PUBLIC_SITE_URL=https://football-v44v.vercel.app
```

## Technical Considerations

- **PKCE flow:** Supabase JS v2+ uses PKCE by default. The callback route's `exchangeCodeForSession(code)` is correct for this flow.
- **Local dev unaffected:** Local Supabase uses Inbucket for emails. `window.location.origin` resolves to `http://localhost:3000` locally. Localhost stays in the redirect allowlist.
- **Preview deploys:** Auth confirmation won't work on Vercel preview URLs unless added to the Supabase allowlist. Acceptable for now — auth testing can happen on production or locally.
- **Expired links:** Currently redirect silently to `/login` with no error message. Out of scope for this fix but noted as follow-up.

## Acceptance Criteria

- [ ] Scout registers → receives email with link to `https://football-v44v.vercel.app/callback?code=...`
- [ ] Clicking confirmation link → lands on platform authenticated (redirected to appropriate page)
- [ ] Academy admin invite → email link points to production `/callback?next=/admin`
- [ ] Local dev registration → still works via Inbucket at `localhost:3000`
- [x] `npm run build` passes

## Follow-Up Items (Out of Scope)

- "Forgot password" flow (no reset mechanism exists)
- "Resend confirmation email" UI
- Custom-branded Supabase email templates
- Expired link error messaging on `/login`
- Vercel preview deployment auth support

## Files to Modify

| File | Change |
|------|--------|
| `src/components/auth/RegisterForm.tsx` | Add `emailRedirectTo` to `signUp` options |
| `src/app/actions/admin-invite.ts` | Add `VERCEL_PROJECT_PRODUCTION_URL` fallback |
| Supabase Dashboard | Update Site URL + Redirect URLs allowlist |
| Vercel Dashboard | Set `NEXT_PUBLIC_SITE_URL` env var |
