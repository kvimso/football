---
title: React 19 Dev-Mode Performance Instrumentation Bug with Server Component Redirects
date: 2026-03-03
category: runtime-errors
severity: P3
component:
  - src/middleware.ts
  - src/app/dashboard/layout.tsx
  - src/app/admin/layout.tsx
  - src/app/platform/layout.tsx
tags:
  - react-19
  - next-js-16
  - turbopack
  - performance-api
  - server-components
  - redirect
  - role-based-routing
  - dev-mode-only
framework: Next.js 16.1.6 with Turbopack
status: resolved
upstream_issue: https://github.com/vercel/next.js/issues/86060
---

# React 19 Turbopack `redirect()` Performance Measure TypeError

## Problem

Runtime TypeError in dev mode (Turbopack only, no production impact):

```
Failed to execute 'measure' on 'Performance': '​DashboardLayout' cannot have a negative time stamp.
```

The zero-width character (U+200B) before "DashboardLayout" is **not** in source code — it is injected by React 19's `react-dom-client.development.js` (lines 4155, 4230, 4273, 4277) and Turbopack's RSC client for Performance DevTools tracking.

The error fires when navigating to role-protected routes (`/dashboard`, `/admin`, `/platform`) where the layout calls `redirect()` to route users to their correct panel.

## Root Cause

React 19 dev-mode prepends `\u200b` to component names when calling `performance.measure()`. When server component layouts call `redirect()`, rendering aborts before timing data is recorded. The Turbopack RSC client's `flushComponentPerformance` (line 3596) then invokes `performance.measure()` with uninitialized `childrenEndTime` (defaulting to `-Infinity`). The browser's Performance API rejects negative timestamps, throwing the TypeError.

**Upstream bug:** [vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060) — open, no fix merged.

**Trigger:** Three role-scoped layouts used `redirect()` for role-based routing:

| Layout | Redirects |
|--------|-----------|
| `dashboard/layout.tsx` | `academy_admin` -> `/admin`, `platform_admin` -> `/platform` |
| `admin/layout.tsx` | non-admin -> `/dashboard`, `platform_admin` -> `/platform` |
| `platform/layout.tsx` | non-platform_admin -> `/dashboard` |

## Solution

### Step 1: Move role routing to middleware

Added role-based routing inside the existing `if (hasAuthCookie)` block in `src/middleware.ts`, after `getUser()`:

```typescript
// Role-based routing for authenticated users on role-scoped paths
if (user) {
  const { pathname } = request.nextUrl
  const roleScopedPath = ['/dashboard', '/admin', '/platform'].find(
    p => pathname === p || pathname.startsWith(p + '/')
  )

  if (roleScopedPath) {
    const ROLE_HOME: Record<string, string> = {
      scout: '/dashboard',
      academy_admin: '/admin',
      platform_admin: '/platform',
    }
    const PATH_ALLOWED_ROLES: Record<string, string[]> = {
      '/dashboard': ['scout'],
      '/admin': ['academy_admin'],
      '/platform': ['platform_admin'],
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'scout'
    const allowedRoles = PATH_ALLOWED_ROLES[roleScopedPath]

    if (allowedRoles && !allowedRoles.includes(role)) {
      const destination = ROLE_HOME[role] ?? '/dashboard'
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = destination
      const redirectResponse = NextResponse.redirect(redirectUrl)
      // Preserve refreshed auth cookies on the redirect response
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectResponse.cookies.set(cookie)
      }
      return redirectResponse
    }
  }
}
```

### Step 2: Replace layout `redirect()` with `notFound()`

All three layouts now use `notFound()` as defense-in-depth guards (middleware handles the primary routing):

```typescript
// dashboard/layout.tsx
if (profile?.role && profile.role !== 'scout') notFound()

// admin/layout.tsx
if (!profile || !['academy_admin', 'platform_admin'].includes(profile.role)) notFound()

// platform/layout.tsx
if (!profile || profile.role !== 'platform_admin') notFound()
```

`notFound()` uses a different code path than `redirect()` and does not trigger the Turbopack performance instrumentation bug.

## Key Decisions

- **Middleware-first routing** — Role checks happen before server component rendering, eliminating the abort-before-timing scenario
- **`notFound()` over `redirect()`** — Safe code path that doesn't interfere with React 19 performance instrumentation
- **Fail-open on errors** — If profile query fails in middleware, pass through and let the layout handle it (prevents total lockout during Supabase outages)
- **Auth cookie preservation** — Explicitly copy refreshed session cookies from `supabaseResponse` to redirect responses
- **No role caching** — Per-request profile query ensures role changes take effect immediately

## Prevention

### Rules

**Auth redirects happen in middleware. Layouts render only, use `notFound()` for permission failures.**

### When adding new role-protected routes

1. Add route to middleware access matrix (`PATH_ALLOWED_ROLES`)
2. Middleware calls `redirect()` if user lacks permission
3. Layout checks permission again (defense-in-depth) with `notFound()`

### Detection — grep for regressions

```bash
# Find redirect() calls in layout files (potential bug trigger)
grep -rn "redirect(" src/app/*/layout.tsx src/app/*/*/layout.tsx

# Find role checks in layouts using redirect (should use notFound)
grep -rn "redirect(" src/app/ --include="layout.tsx"
```

## Related Documentation

- [Security Headers & CSP Configuration](../security-issues/comprehensive-audit-security-code-quality-fixes.md) — CSP `unsafe-eval` required for Turbopack HMR in dev mode
- [Chat System Code Review Fixes](../security-issues/chat-system-code-review-fixes.md) — RLS policy patterns, authorization gates
- [Phase B P2 Security Hardening](../security-issues/phase-b-p2-security-hardening.md) — CSP + Turbopack dev-mode learnings
