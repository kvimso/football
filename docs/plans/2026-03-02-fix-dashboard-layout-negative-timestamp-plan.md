---
title: "fix: Move role-based routing to middleware to eliminate DashboardLayout negative timestamp error"
type: fix
status: completed
date: 2026-03-02
---

# Move Role-Based Routing to Middleware

## Overview

A runtime TypeError in dev mode (`Failed to execute 'measure' on 'Performance': '​DashboardLayout' cannot have a negative time stamp`) is caused by `redirect()` calls in server component layouts aborting rendering before React 19's performance instrumentation completes. This is a known upstream bug ([vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060)), but we can eliminate it by moving role-based routing to middleware so layouts rarely (or never) need to call `redirect()`.

## Acceptance Criteria

- [x] Scout navigating to `/admin` or `/platform` is redirected to `/dashboard`
- [x] Academy admin navigating to `/dashboard` or `/platform` is redirected to `/admin`
- [x] Platform admin navigating to `/dashboard` is redirected to `/platform`
- [x] Platform admin navigating to `/admin` is redirected to `/platform` (current behavior preserved)
- [x] All subroutes work: `/dashboard/messages`, `/admin/players/new`, `/platform/clubs`
- [x] Unauthenticated users still redirected to `/login` with `?redirect=` param
- [x] Auth callback (`/callback`) still correctly routes invited academy admins
- [x] If Supabase profile query fails in middleware, user passes through (fail-open)
- [x] `npm run build` succeeds with no type errors
- [x] Production behavior unchanged (redirect() was only a dev-mode issue)
