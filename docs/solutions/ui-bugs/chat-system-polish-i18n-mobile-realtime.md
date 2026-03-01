---
title: "Chat System Polish: i18n Violations, Mobile Layout, and Realtime Unread Badges"
date: 2026-03-01
category: ui-bugs
severity: medium
component: chat-system, navigation, mobile-responsive
tags:
  - internationalization
  - hardcoded-strings
  - mobile-layout
  - viewport-height
  - unread-badges
  - realtime-updates
  - supabase-realtime
symptoms:
  - Hardcoded Georgian/English strings in chat-utils.ts (formatMessageTime, formatDateDivider)
  - Missing translation keys (common.noResults, chat.unnamedFile, chat.unnamedImage)
  - PlayerSearchModal using unnecessary fallback strings
  - Loading skeletons using 100vh instead of 100dvh, breaking mobile layout
  - No overflow containment on conversation thread pages
  - Navbar unread badge fetched once on mount, never updated in realtime
  - DashboardNav and AdminSidebar had no unread badges at all
root_cause: "Incomplete polish during rapid Phase 6.5 chat implementation across Sessions A-D"
resolution_type: code-fix
time_to_resolve: "~60 minutes"
verified: true
related:
  - docs/solutions/integration-issues/supabase-storage-signed-url-expiry-chat.md
  - docs/solutions/security-issues/comprehensive-audit-security-code-quality-fixes.md
---

# Chat System Polish: i18n, Mobile Layout, and Realtime Unread Badges

## Problem Description

Three categories of polish gaps accumulated during rapid chat system development (Sessions A-D):

### 1. i18n Violations — Hardcoded Strings

Utility functions in `src/lib/chat-utils.ts` contained inline Georgian/English strings:

```typescript
// formatMessageTime — line 26
return lang === 'ka' ? 'გუშინ' : 'Yesterday'

// formatDateDivider — lines 55-56
if (diffDays === 0) return lang === 'ka' ? 'დღეს' : 'Today'
if (diffDays === 1) return lang === 'ka' ? 'გუშინ' : 'Yesterday'
```

Components had hardcoded fallback strings:
- `MessageBubble.tsx`: `message.file_name ?? 'Image'` and `message.file_name ?? 'File'`
- `PlayerSearchModal.tsx`: `t('common.noResults') ?? 'No players found'` (key didn't exist)

These violate CLAUDE.md rules: "No hardcoded strings — use `t()` with both en/ka translations."

### 2. Mobile Layout — Broken Viewport Units

Loading skeletons used `h-[calc(100vh-64px)]`:
- `100vh` on mobile browsers includes the address bar height, causing content to extend beyond the visible viewport
- No overflow containment wrapper on conversation thread pages
- Footer pushed below viewport, causing double-scrolling

### 3. Static Unread Badges — No Realtime Updates

`Navbar.tsx` fetched unread count via `supabase.rpc('get_total_unread_count')` once on mount but never subscribed to Realtime changes. `DashboardNav.tsx` and `AdminSidebar.tsx` had no unread badges at all.

Result: user receives new message, badge stays stale until manual page refresh.

## Root Cause

Rapid development cadence across Sessions A-D prioritized functionality (inbox, thread, file upload, player refs, block/unblock). Polish items (i18n compliance, mobile viewport, realtime badges) were deferred to a dedicated polish pass.

## Solution

### Fix 1: Thread `t` Function Through Utility Calls

**Pattern:** Utility functions that produce user-facing strings accept `t` as a parameter instead of hardcoding translations.

**Before:**
```typescript
export function formatMessageTime(dateStr: string, lang: Lang): string {
  if (diffDays === 1) return lang === 'ka' ? 'გუშინ' : 'Yesterday'
}
```

**After:**
```typescript
export function formatMessageTime(dateStr: string, lang: Lang, t: (key: string) => string): string {
  if (diffDays === 1) return t('chat.yesterday')
}
```

**Call sites updated:** `ChatInbox.tsx`, `DateDivider.tsx` (accepts `t` prop), `ChatThread.tsx` (passes `t` to DateDivider).

**Component fallbacks replaced:**
```typescript
// Before
alt={message.file_name ?? 'Image'}
{message.file_name ?? 'File'}

// After
alt={message.file_name ?? t('chat.unnamedImage')}
{message.file_name ?? t('chat.unnamedFile')}
```

**New translation keys added to `translations.ts`:**
- `common.noResults` — EN: "No results found" / KA: "შედეგები ვერ მოიძებნა"
- `chat.unnamedFile` — EN: "File" / KA: "ფაილი"
- `chat.unnamedImage` — EN: "Image" / KA: "სურათი"

(`chat.today` and `chat.yesterday` already existed in translations.)

### Fix 2: Use `100dvh` + Layout Wrappers

**Loading skeletons:** Changed `h-[calc(100vh-64px)]` to `h-[calc(100dvh-11rem)]` in both `dashboard/messages/[conversationId]/loading.tsx` and `admin/messages/[conversationId]/loading.tsx`.

**Layout wrappers:** Created new `layout.tsx` files for conversation routes:
```typescript
export default function ConversationLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-hidden -mb-8">{children}</div>
}
```

| Property | Purpose |
|----------|---------|
| `100dvh` | Dynamic viewport height — excludes mobile browser UI |
| `11rem` | Subtracts navbar + padding + tabs height |
| `flex-1` | Fills available space in parent flex container |
| `overflow-hidden` | Prevents content bleeding outside container |
| `-mb-8` | Compensates for parent's `py-8` bottom padding |

### Fix 3: Supabase Realtime Subscriptions for Unread Badges

**Pattern applied to Navbar, DashboardNav, and AdminSidebar:**

```typescript
useEffect(() => {
  if (!user) return
  const supabase = createClient()

  // Initial fetch
  supabase.rpc('get_total_unread_count').then(({ data, error }) => {
    if (!error && data != null) setUnreadCount(Number(data))
  })

  // Realtime subscription
  let debounceTimer: NodeJS.Timeout
  const channel = supabase
    .channel('navbar-unread')  // unique name per component
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
    }, () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        supabase.rpc('get_total_unread_count').then(({ data, error }) => {
          if (!error && data != null) setUnreadCount(Number(data))
        })
      }, 500)
    })
    .subscribe()

  return () => {
    clearTimeout(debounceTimer)
    supabase.removeChannel(channel)
  }
}, [user])
```

**Key design decisions:**
- **500ms debounce** prevents RPC hammering when multiple messages arrive rapidly
- **`event: '*'`** catches INSERTs (new messages) and UPDATEs (read_at changes)
- **Unique channel names** (`navbar-unread`, `dashboard-nav-unread`, `admin-sidebar-unread`) prevent conflicts
- **Cleanup on unmount** via `removeChannel` prevents memory leaks

Badge also added to Navbar mobile menu for parity with desktop.

## Files Changed

| File | Changes |
|------|---------|
| `src/lib/translations.ts` | Added `common.noResults`, `chat.unnamedFile`, `chat.unnamedImage` (EN + KA) |
| `src/lib/chat-utils.ts` | Added `t` parameter to `formatMessageTime` and `formatDateDivider` |
| `src/components/chat/PlayerSearchModal.tsx` | Removed `?? 'No players found'` fallback |
| `src/components/chat/MessageBubble.tsx` | Replaced hardcoded `'Image'`/`'File'` with `t()` calls |
| `src/components/chat/DateDivider.tsx` | Added `t` prop, passes to `formatDateDivider` |
| `src/components/chat/ChatInbox.tsx` | Passes `t` to `formatMessageTime` |
| `src/components/chat/ChatThread.tsx` | Passes `t` to `DateDivider` |
| `src/components/layout/Navbar.tsx` | Realtime subscription + mobile menu badge |
| `src/components/dashboard/DashboardNav.tsx` | Realtime subscription + inline badge |
| `src/components/admin/AdminSidebar.tsx` | Realtime subscription + badge (desktop + mobile) |
| `src/app/dashboard/messages/[conversationId]/loading.tsx` | `100dvh` viewport fix |
| `src/app/admin/messages/[conversationId]/loading.tsx` | `100dvh` viewport fix |
| `src/app/dashboard/messages/[conversationId]/layout.tsx` | New — overflow wrapper |
| `src/app/admin/messages/[conversationId]/layout.tsx` | New — overflow wrapper |

## Prevention Strategies

### i18n

- **Utility functions must never hardcode user-facing strings.** If a function produces text shown to the user, it must accept `t` as a parameter or return a translation key for the caller to resolve.
- **No fallback strings.** If you write `t('key') ?? 'English fallback'`, the translation key is missing — add it to `translations.ts` instead.
- **Verify both languages.** Every `t()` key must exist in both EN and KA sections.

### Mobile Layout

- **Always use `dvh` over `vh`** for full-height containers — `vh` includes mobile browser chrome.
- **Wrap scrollable routes in overflow containers** with `overflow-hidden` to prevent content bleeding.
- **Test at 375px** (iPhone SE) as the minimum mobile viewport width.

### Realtime Data

- **Any displayed count that can change must have a Realtime subscription.** A one-time `rpc()` fetch without a subscription is a stale-data bug.
- **Debounce Realtime callbacks** (500ms) to coalesce rapid-fire events into a single RPC call.
- **Always clean up channels** in the useEffect return function.

## Review Checklist

- [ ] No hardcoded English or Georgian strings in `lib/` or component files
- [ ] All `t()` calls have matching keys in both `translations.en` and `translations.ka`
- [ ] No `vh` units — use `dvh` for mobile-safe viewport height
- [ ] Scrollable containers have explicit `overflow-y-auto` or `overflow-hidden`
- [ ] Any displayed count has a corresponding Realtime subscription
- [ ] Realtime channels cleaned up on component unmount
- [ ] Tested at 375px mobile viewport width
- [ ] Tested with two browser windows to verify realtime badge updates

## Related Documentation

- [Supabase Storage Signed URL Expiry in Chat](../integration-issues/supabase-storage-signed-url-expiry-chat.md) — Realtime dedup patterns, optimistic rendering
- [Comprehensive Security & Code Quality Audit](../security-issues/comprehensive-audit-security-code-quality-fixes.md) — Prevention strategies for code quality
- CLAUDE.md: Internationalization section (i18n rules), Chat Phase 6.5 section, Code Conventions
