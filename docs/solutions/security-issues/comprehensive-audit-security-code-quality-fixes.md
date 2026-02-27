---
title: "Comprehensive Audit: Security Headers, XSS Prevention, TOCTOU Fixes, Dead Code Cleanup"
date: "2026-02-27"
status: solved
severity: critical-to-low
category: security-issues
tags:
  - security-headers
  - xss-prevention
  - race-conditions
  - toctou-vulnerability
  - dead-code-removal
  - server-components
  - code-quality
affected_components:
  - next.config.ts
  - src/lib/email-templates.ts
  - src/app/actions/admin-transfers.ts
  - src/components/admin/AdminSidebar.tsx
  - src/components/ui/Icons.tsx
  - src/context/AuthContext.tsx
  - src/lib/translations.ts
  - src/components/landing/LandingFooter.tsx
  - src/app/(platform)/players/[slug]/page.tsx
  - src/app/admin/invite/
  - src/app/admin/layout.tsx
discovery_method: "8-agent automated code review (kieran-typescript-reviewer, security-sentinel, performance-oracle, architecture-strategist, pattern-recognition-specialist, code-simplicity-reviewer, agent-native-reviewer, project-specific code-reviewer)"
---

# Comprehensive Audit: Security & Code Quality Fixes

## Problem Summary

An exhaustive 8-agent code review of all 152 TypeScript files (12,780 LOC) identified 44 unique findings. This document covers the 13 findings resolved in **Phase A** (critical security) and **Phase F** (dead code cleanup) of the remediation plan.

### Symptoms

- No security headers on any HTTP response (clickjacking, MIME sniffing possible)
- User-controlled strings injected directly into HTML email templates (XSS vector)
- Concurrent free-agent claims or player releases could both succeed (race condition)
- Unreachable route, unused components, dead translation keys, always-false state
- Client component that didn't need client-side JavaScript
- Fire-and-forget promises without explicit `void` prefix
- Empty catch block swallowing auth initialization errors

---

## Root Cause Analysis

### Security Issues (Phase A)

**A1 — Missing Security Headers:** `next.config.ts` had no `headers()` function. Next.js doesn't add security headers by default.

**A2 — HTML Injection in Email Templates:** Template literals interpolated user input (`scoutName`, `playerName`, `message`, etc.) directly into HTML without escaping. A malicious scout name like `<script>alert(1)</script>` would execute in the email client.

**A3/A5 — TOCTOU Race Conditions:** `claimFreeAgent` and `releasePlayer` both used a check-then-act pattern: first SELECT to verify state, then UPDATE without repeating the conditions. Between the two queries, another request could change the player's status, causing both to succeed.

### Dead Code (Phase F)

**F1 — Unreachable Route:** `/admin/invite` existed inside the admin layout (which rejects non-`academy_admin` users) but the page itself checked for `platform_admin` role. No user could ever reach it — the working invite page is at `/platform/invite`.

**F2-F4 — Accumulated Dead Code:** Icon components defined but never imported, translation keys from a pre-redesign landing page, and an `isLoading` state variable whose setter was destructured away (always `false`, no consumers).

**F5 — Empty API Directories:** API routes had been migrated to server actions but the empty directories remained.

**F6 — Unnecessary Client Component:** `LandingFooter` was marked `'use client'` but only used translations (no state, effects, or event handlers).

---

## Working Solution

### A1: Security Headers

Added `async headers()` to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    },
  ];
},
```

### A2: HTML Escaping in Email Templates

Added `escapeHtml()` and applied to all user-controlled interpolations:

```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Applied to all 3 template functions + subject lines:
const safeScoutName = escapeHtml(scoutName)
const safePlayerName = escapeHtml(playerName)
// ... used in template interpolations and subject return values
```

### A3/A5: Atomic TOCTOU Fix

**Key insight:** Supabase `.update()` returns `null` for `data` by default. You **must** chain `.select('id')` to get matched rows back and verify the update matched.

```typescript
// claimFreeAgent — atomic update with conditions
const { error: updateErr, data: updated } = await admin
  .from('players')
  .update({ club_id: clubId, status: 'active' as const, updated_at: new Date().toISOString() })
  .eq('id', playerId)
  .is('club_id', null)        // Only if currently unclaimed
  .eq('status', 'free_agent') // Only if still free agent
  .select('id')               // MUST chain to get matched rows

if (updateErr) return { error: updateErr.message }
if (!updated || updated.length === 0) return { error: 'Player is no longer a free agent' }
```

```typescript
// releasePlayer — same pattern
const { error: updateErr, data: released } = await admin
  .from('players')
  .update({ club_id: null, status: 'free_agent' as const, updated_at: new Date().toISOString() })
  .eq('id', playerId)
  .eq('club_id', clubId) // Only release if still at this club
  .select('id')

if (updateErr) return { error: updateErr.message }
if (!released || released.length === 0) return { error: 'Player is no longer at your club' }
```

### Phase F: Dead Code Cleanup

| Fix | What | Lines Removed |
|-----|------|---------------|
| F1 | Delete `/admin/invite` route + sidebar links + unused `role` prop | ~65 lines |
| F2 | Remove `SearchIcon`, `ChartIcon`, `UsersIcon` from Icons.tsx | ~24 lines |
| F3 | Remove 10 dead `home.*` translation keys (kept `browsePlayers`) | ~20 lines |
| F4 | Remove always-false `isLoading` from AuthContext | ~4 lines |
| F5 | Delete empty `api/contact/`, `api/players/search/`, `api/pixellot/sync/`, `api/pixellot/webhook/` | directories |
| F6 | Convert LandingFooter: `'use client'` + `useLang()` to async server + `getServerT()` | net 0 (rewrite) |
| F7 | Add `void` prefix to `trackPageView` and `trackPlayerView` | 2 lines changed |
| F8 | Replace empty `catch {}` with `console.error(...)` | 2 lines changed |

---

## Prevention Strategies

### Supabase TOCTOU Pattern

**Always use atomic updates.** Never check-then-act with separate queries:

```typescript
// BAD: Race window between SELECT and UPDATE
const { data: player } = await supabase.from('players').select('status').eq('id', id).single()
if (player.status !== 'free_agent') return { error: '...' }
await supabase.from('players').update({ club_id: newClub }).eq('id', id)

// GOOD: Atomic — conditions in the UPDATE itself
const { data } = await supabase
  .from('players')
  .update({ club_id: newClub })
  .eq('id', id)
  .eq('status', 'free_agent')
  .select('id')
if (!data?.length) return { error: 'Concurrent modification' }
```

### Email Template Security

**Always escape user input.** Keep `escapeHtml()` in `email-templates.ts` and apply to every user-controlled field before interpolation, including subject lines.

### Security Headers

**Check `next.config.ts` headers on every deployment.** The headers function should be present and include at minimum: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security.

### Dead Code Prevention

- **Before adding `'use client'`**: verify the component actually needs state, effects, or event handlers. If it only uses translations, use `getServerT()` in an async server component.
- **Grep before deleting translation keys**: `grep -r "t('key'" src/` to confirm no references.
- **Unused state variables**: if you destructure away the setter `const [x] = useState(false)`, the state is dead.
- **Fire-and-forget promises**: always prefix with `void` to signal intent.
- **Empty catch blocks**: always log the error with context.

### Code Review Checklist

- [ ] Security headers present in `next.config.ts`
- [ ] All user input escaped in email templates
- [ ] No check-then-act patterns in Supabase mutations (use atomic WHERE)
- [ ] `.select('id')` chained after `.update()` when verifying matched rows
- [ ] No unnecessary `'use client'` directives
- [ ] No empty catch blocks
- [ ] All fire-and-forget promises prefixed with `void`
- [ ] No unused components, routes, or translation keys
- [ ] `npm run build && npm run lint` passes

---

## Related Documentation

- **Source plan:** `docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md` (full 6-phase plan, 44 findings)
- **Remaining phases:** B (type safety), C (deduplication), D (performance), E (i18n) — documented in the plan
- **Commit:** `fdfb3c4` (Phase A), `8e80103` (Phase F)
- **Branch:** `feat/advanced-player-filters`

---

## Verification

```bash
npm run build   # 0 errors, 30 routes (down from 31 — /admin/invite removed)
npm run lint    # 0 warnings
```
