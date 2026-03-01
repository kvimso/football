---
title: "Supabase Signed URL Expiry Breaks Chat File Attachments"
date: "2026-03-01"
category: "integration-issues"
tags:
  - supabase-storage
  - signed-urls
  - file-handling
  - chat-system
  - realtime
  - optimistic-ui
severity: high
component: "Chat System (Phase 6.5) - File Attachments & Thread UI"
symptoms: |
  Chat file attachments (images, PDFs, documents) would become inaccessible after signed URL expiry.
  Broken image links, failed downloads in old messages.
  Secondary: duplicate messages from optimistic + Realtime overlap, scroll jumps on "load older".
resolution_time: "~2 hours (part of Session C thread implementation)"
slug: "supabase-storage-signed-url-expiry-chat"
---

# Supabase Signed URL Expiry Breaks Chat File Attachments

## Problem

The `POST /api/chat-upload` endpoint uploaded files to Supabase Storage, generated a signed URL (7-day expiry via `CHAT_LIMITS.SIGNED_URL_EXPIRY_SECONDS`), and returned it as `file_url`. This URL was stored directly in the `messages` table. After 7 days, all file messages became broken — images wouldn't load, downloads would fail. There was no way to regenerate the URL without re-uploading the file.

### Why This Happens

Supabase Storage signed URLs are time-limited access tokens. They embed an expiry timestamp in the URL itself. Once expired, the URL returns 400/403. Storing them as permanent data violates the contract — the URL's lifetime is shorter than the message's lifetime.

## Root Cause

```typescript
// BEFORE (broken pattern)
return NextResponse.json({
  file_url: signedUrlData.signedUrl, // Expires in 7 days!
  file_name: file.name,
  file_type: file.type,
  file_size_bytes: file.size,
})
// Client stores this URL in messages.file_url → breaks after 7 days
```

## Solution

### 1. Store permanent storage paths, generate signed URLs on demand

**File: `src/app/api/chat-upload/route.ts`**

```typescript
// AFTER (fixed)
return NextResponse.json({
  storage_path: storagePath,         // permanent path: {conversationId}/{uuid}.jpg
  file_url: signedUrlData.signedUrl, // for immediate display (backward compat)
  file_name: file.name,
  file_type: file.type,
  file_size_bytes: file.size,
})
```

The client stores `storage_path` in the `file_url` column. The field name is misleading but avoids a database migration.

**File: `src/app/api/messages/route.ts`** (GET handler)

```typescript
// After fetching messages, enrich file messages with fresh signed URLs
const enriched = await Promise.all(
  trimmed.map(async (msg) => {
    if (msg.message_type === 'file' && msg.file_url && !msg.file_url.startsWith('http')) {
      // file_url contains storage path — generate fresh signed URL (1-hour expiry)
      const { data } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(msg.file_url, 3600)
      return { ...msg, file_url: data?.signedUrl ?? msg.file_url }
    }
    return msg
  })
)
```

The `!msg.file_url.startsWith('http')` check ensures backward compatibility — existing messages with full URLs pass through unchanged.

### 2. Update validation schema

**File: `src/lib/validations.ts`**

```typescript
// BEFORE: required URL format
file_url: z.string().url().optional(),

// AFTER: accepts any non-empty string (storage paths aren't URLs)
file_url: z.string().min(1).optional(),
```

## Related Patterns Solved in Same Session

### Optimistic Rendering + Realtime Dedup

When combining optimistic rendering with Supabase Realtime `postgres_changes`, messages can appear twice (once optimistic, once from Realtime INSERT).

**Solution:** Optimistic messages use temp IDs (`temp-{Date.now()}`). When Realtime INSERT arrives for the same sender, match by `sender_id` + `created_at` proximity (within 5 seconds) and replace the temp ID with the real one.

### Scroll Position Preservation

Prepending older messages to a scrollable list shifts the scroll position, disorienting users.

**Solution:** Measure `scrollHeight` before prepending, then after DOM update, set `scrollTop = scrollHeight - prevHeight` via `requestAnimationFrame`.

### N+1 Query Prevention for Player References

Messages with `message_type: 'player_ref'` need player data for embedded cards. Fetching per-card creates N+1 queries.

**Solution:** JOIN player data directly in the messages SELECT query:

```sql
referenced_player:players!messages_referenced_player_id_fkey (
  id, name, name_ka, position, photo_url, slug,
  club:clubs!players_club_id_fkey ( name, name_ka )
)
```

## Prevention Rules

| Rule | Why |
|------|-----|
| **Never store signed URLs in the database** | They expire independently of the record's lifetime |
| **Store storage paths, generate URLs on read** | Adds minimal latency, guarantees working links |
| **Use temp IDs for optimistic messages** | Enables dedup when Realtime delivers the same insert |
| **Measure scrollHeight before prepending** | Only way to preserve user's reading position |
| **Use Supabase embedded selects for JOINs** | Eliminates N+1 queries in a single round-trip |

## Key Files

| File | Change |
|------|--------|
| `src/app/api/chat-upload/route.ts` | Returns `storage_path` alongside signed URL |
| `src/app/api/messages/route.ts` | Generates fresh signed URLs for storage paths; JOINs player data |
| `src/app/api/players/search/route.ts` | New endpoint for player autocomplete |
| `src/lib/validations.ts` | `file_url` accepts non-URL strings |
| `src/lib/chat-queries.ts` | `fetchConversationById()`, `fetchInitialMessages()` with signed URL enrichment |
| `src/components/chat/ChatThread.tsx` | Realtime subscription, optimistic send, scroll management |

## Related Documentation

- [Session A Plan](../../plans/2026-03-01-feat-chat-system-session-a-database-api-foundation-plan.md) — Database schema, API routes
- [Session B Plan](../../plans/2026-03-01-feat-chat-system-session-b-inbox-ui-plan.md) — Inbox UI, navigation
- [Session C Plan](../../plans/2026-03-01-feat-chat-system-session-c-conversation-thread-plan.md) — Thread UI (this fix)
- [Security Audit](../security-issues/comprehensive-audit-security-code-quality-fixes.md) — Prior codebase security fixes
