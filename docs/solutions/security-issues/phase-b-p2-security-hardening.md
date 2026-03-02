---
title: "Phase B — P2 Validation, Indexes & Security Hardening"
date: 2026-03-02
category: security-issues
tags:
  - csp-hardening
  - database-indexes
  - file-upload-security
  - rpc-safety
  - input-validation
  - type-safety
severity: P2
components:
  - next.config.ts
  - supabase/migrations
  - src/app/api/chat-upload/route.ts
  - src/lib/validations.ts
  - src/lib/transfer-helpers.ts
status: resolved
related:
  - docs/solutions/security-issues/postgrest-rls-auth-bypass-fixes.md
  - docs/solutions/security-issues/chat-system-code-review-fixes.md
  - docs/plans/2026-03-02-refactor-consolidated-review-remediation-plan.md
---

# Phase B — P2 Validation, Indexes & Security Hardening

## Context

Phase B of the consolidated code review remediation (29 findings total). Follows Phase A (8 P1 critical security fixes). These 6 P2 items address validation gaps, missing indexes, and security hardening across the platform.

**Branch:** `refactor/code-review-remediation-29`
**Commit:** `552da46`

---

## B1: CSP unsafe-eval Removed from Production

**Problem:** `script-src` in the Content-Security-Policy header included `'unsafe-eval'` unconditionally, weakening XSS protection in production. Only needed during development for Turbopack HMR.

**Root cause:** CSP was static — no environment-aware conditional.

**Fix:** Conditional inclusion based on `NODE_ENV`:

```typescript
// next.config.ts
const isDev = process.env.NODE_ENV === 'development'

// In headers:
`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
```

**Prevention:** Never include eval directives in production CSP. Use `NODE_ENV` checks. Test with `npm run build && npm start` before deploying.

---

## B2: Missing Database Indexes

**Problem:** Player directory queries filtering on `status`, `date_of_birth`, and searching via `ILIKE` on `name`/`name_ka` had no supporting indexes — full table scans at scale.

**Root cause:** Indexes weren't created alongside the features that use them.

**Fix:** Migration `20260302000003_add_player_indexes.sql`:

```sql
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_dob ON public.players(date_of_birth);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_players_name_trgm ON public.players USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_players_name_ka_trgm ON public.players USING gin(name_ka gin_trgm_ops);
```

**Prevention:** For every filterable/searchable column, create a supporting index in the same migration. Use `EXPLAIN ANALYZE` to verify.

---

## B3: Guardian Contact RPC Missing search_path

**Problem:** `get_player_guardian_contact()` is `SECURITY DEFINER` but lacked `SET search_path = public`, making it vulnerable to schema-shadowing attacks.

**Root cause:** Missed during original migration — all other SECURITY DEFINER functions had it.

**Fix:** Migration `20260302000004_guardian_rpc_search_path.sql` — `CREATE OR REPLACE` with `SET search_path = public` added.

**Prevention:** Every `SECURITY DEFINER` function must include `SET search_path = public`. SQL linters can flag this automatically.

---

## B4: File Upload Double-Extension Defense + Filename Sanitization

**Problem:** Extension validation used `.endsWith()` which could pass on double-extensions like `evil.jpg.svg`. Filenames were unsanitized, allowing XSS via rendered filenames like `<img onerror=alert(1)>.pdf`.

**Root cause:** Extension check wasn't final-extension-only; no filename sanitization.

**Fix:** `src/app/api/chat-upload/route.ts`:

```typescript
// Sanitize filename (prevent XSS, strip null bytes)
const safeName = file.name.replace(/[<>"'&\x00]/g, '_').substring(0, 200)
const fileName = safeName.toLowerCase()

// Check ONLY the final extension
const lastDotIndex = fileName.lastIndexOf('.')
const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : ''
if (!ALLOWED_CHAT_FILE_EXTENSIONS.includes(ext as typeof ALLOWED_CHAT_FILE_EXTENSIONS[number])) {
  return NextResponse.json({ error: 'errors.fileTypeNotAllowed' }, { status: 400 })
}
```

Storage uses `${crypto.randomUUID()}${ext}` — no user-controlled path components.

**Prevention:** Always validate final extension only (`lastIndexOf`). Sanitize `<>"'&\x00` from filenames. Use UUID storage names.

---

## B5: file_url Validation Restricted to Storage Paths

**Problem:** `sendMessageSchema.file_url` accepted any string including `javascript:` URIs, external phishing URLs, or `data:` URIs.

**Root cause:** Plain `z.string().min(1)` with no origin validation.

**Fix:** `src/lib/validations.ts`:

```typescript
file_url: z.string().min(1).refine(
  val => val.startsWith('chat-attachments/') || val.includes('.supabase.co/storage/'),
  'File URL must be a valid storage path'
).optional(),
```

Only allows relative bucket paths and Supabase signed URLs.

**Prevention:** Never accept arbitrary URLs in user input. Whitelist storage origins with Zod `.refine()` at the schema level.

---

## B6: RPC Result Type Cast Replaced with Zod Validation

**Problem:** `executeTransferAccept()` used `data as { error?: string; success?: boolean }` — a compile-time-only cast with zero runtime protection.

**Root cause:** No schema validation on untrusted RPC response.

**Fix:** `src/lib/transfer-helpers.ts`:

```typescript
const transferRpcResultSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
}).nullable()

// In function:
const parsed = transferRpcResultSchema.safeParse(data)
if (!parsed.success) {
  console.error('[transfer-helpers] Invalid RPC response:', parsed.error)
  return { error: 'errors.serverError' }
}
const result = parsed.data
```

**Prevention:** Never use `as` on external data (API responses, RPC calls). Always validate with Zod `.safeParse()`.

---

## Prevention Rules Summary

| Issue | Rule | Lintable? |
|-------|------|-----------|
| CSP eval | No eval directives in production CSP | Yes (build-time check) |
| Missing indexes | Index every filterable column in same migration | Partial (query analyzer) |
| search_path | Every SECURITY DEFINER needs `SET search_path` | Yes (SQL linter) |
| Double-extension | Validate final extension only via `lastIndexOf` | Partial (SAST) |
| URL validation | Whitelist storage origins in Zod schemas | Yes (SAST, ESLint) |
| Type casts | Never `as` cast external data — use Zod | Yes (ESLint custom rule) |

---

## Files Changed

| File | Change |
|------|--------|
| `next.config.ts` | Conditional CSP unsafe-eval |
| `supabase/migrations/20260302000003_add_player_indexes.sql` | New — 4 indexes |
| `supabase/migrations/20260302000004_guardian_rpc_search_path.sql` | New — RPC fix |
| `src/app/api/chat-upload/route.ts` | Extension + sanitization |
| `src/lib/validations.ts` | file_url refinement |
| `src/lib/transfer-helpers.ts` | Zod schema for RPC |

## Verification

- `npm run build` passes with zero errors
- All 5 Phase B todo files renamed from `pending` to `complete`
- Plan document checkboxes updated
