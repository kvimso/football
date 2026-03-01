---
title: "feat: Chat System Session B — Inbox UI"
type: feat
status: completed
date: 2026-03-01
origin: Chat-system-build.md
---

# Chat System Session B — Inbox UI

## Overview

Build the inbox UI for the chat system. Scouts and academy admins each get an inbox page showing their conversations sorted by most recent message, with unread badges, last message preview, and smart timestamps. Navigation is updated to replace "Requests" with "Messages", and a global unread badge appears in the Navbar.

**Depends on:** Session A (complete — commit `4930fbe` on `feat/chat-system`). All API routes, database tables, validations, constants, and translations are already in place.

## Problem Statement / Motivation

Session A built the database and API foundation. Without a UI, the chat system is invisible to users. The inbox is the entry point — scouts and admins need to see their conversations, know which have unread messages, and navigate to individual threads (built in Session C).

## Proposed Solution

### Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Inbox data fetching | **Hybrid: server fetch + client component** | Server component fetches initial data (fast first paint, consistent with dashboard pattern). Client `ChatInbox` component receives data as prop. Realtime subscription deferred to Session C when thread is built. |
| Global unread count | **New RPC function `get_total_unread_count()`** | The existing `GET /api/conversations` does N+3 queries per conversation — too heavy for the Navbar. A single aggregate RPC is O(1). |
| Time formatting | **Smart format** | Today: "2:45 PM", Yesterday: "Yesterday", This week: "Tuesday", Older: "Mar 1". Standard messaging UX. |
| Blocked conversations | **Normal position, dimmed + lock icon** | Keep in list so admins can unblock. Don't hide them. |
| Old request pages | **Keep at existing URLs, remove from navigation** | Historical data preserved per CLAUDE.md. Pages still work via direct URL. |
| DashboardNav active state | **Fix to `startsWith` for non-root paths** | Currently uses exact match — `/dashboard/messages/[id]` won't highlight the tab. AdminSidebar already uses `startsWith`. |
| Platform admin inbox | **None** | Platform admins have SELECT access for moderation but no inbox page. Skip unread badge for them. |
| Dashboard/admin home pages | **Replace request stat cards with message stat cards** | Clean transition. "Messages" card with conversation count + unread count. |

### New Migration

```sql
-- supabase/migrations/20250101000029_add_unread_count_rpc.sql

-- Lightweight RPC for global unread count (used by Navbar badge)
create or replace function public.get_total_unread_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(count(*), 0)
  from messages m
  join conversations c on c.id = m.conversation_id
  where m.sender_id != auth.uid()
    and m.read_at is null
    and m.deleted_at is null
    and (
      c.scout_id = auth.uid()
      or (
        get_user_role() = 'academy_admin'
        and get_user_club_id() = c.club_id
      )
    );
$$;
```

### Component Architecture

```
ChatInbox (client component)
├── Props: conversations[], userRole, userId, lang
├── Renders conversation list sorted by last_message_at
├── Each item: ConversationCard-style inline rendering
│   ├── Avatar placeholder (club logo or scout initial)
│   ├── Other party name (bilingual)
│   ├── Last message preview (truncated, with "You: " prefix if sent by current user)
│   ├── Smart timestamp
│   ├── Unread count badge (if > 0)
│   └── Blocked indicator (if is_blocked)
└── Empty state with role-specific hint
```

## Files to Create

### New Files

- [x] `supabase/migrations/20250101000029_add_unread_count_rpc.sql` — RPC function for total unread count
- [x] `src/components/chat/ChatInbox.tsx` — Reusable conversation list (client component)
- [x] `src/app/dashboard/messages/page.tsx` — Scout inbox page (server component)
- [x] `src/app/dashboard/messages/loading.tsx` — Scout inbox loading skeleton
- [x] `src/app/admin/messages/page.tsx` — Admin inbox page (server component)
- [x] `src/app/admin/messages/loading.tsx` — Admin inbox loading skeleton
- [x] `src/lib/chat-utils.ts` — `formatMessageTime()` utility + `truncateMessage()` helper

### Files to Modify

- [x] `src/components/dashboard/DashboardNav.tsx` — Replace "Requests" tab with "Messages", fix active state to use `startsWith`
- [x] `src/components/admin/AdminSidebar.tsx` — Replace "Requests" link with "Messages" (with chat icon)
- [x] `src/components/layout/Navbar.tsx` — Add global unread badge via `useUnreadCount()` hook
- [x] `src/components/dashboard/DashboardHome.tsx` — Replace "Requests" stat card with "Messages" stat card
- [x] `src/app/dashboard/page.tsx` — Fetch conversation/unread count instead of request count
- [x] `src/app/admin/page.tsx` — Replace "Pending Requests" stat + "Recent Requests" section with messages equivalent
- [x] `src/lib/translations.ts` — Add missing chat inbox translation keys (en + ka)
- [x] `src/lib/database.types.ts` — Regenerate after new migration

## Technical Considerations

### Smart Timestamp Utility (`formatMessageTime`)

```typescript
// src/lib/chat-utils.ts
export function formatMessageTime(dateStr: string, lang: 'en' | 'ka'): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Today: show time "2:45 PM"
    return date.toLocaleTimeString(lang === 'ka' ? 'ka-GE' : 'en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return lang === 'ka' ? 'გუშინ' : 'Yesterday'
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'long' })
  }
  return date.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US', { month: 'short', day: 'numeric' })
}
```

### ChatInbox Component Shape

```typescript
// src/components/chat/ChatInbox.tsx
'use client'

interface Conversation {
  id: string
  club: { id: string; name: string; name_ka: string; logo_url: string | null } | null
  other_party: { id: string; full_name: string; organization: string | null; role: string }
  last_message: { content: string | null; message_type: string; created_at: string; sender_id: string } | null
  unread_count: number
  is_blocked: boolean
  created_at: string
}

interface ChatInboxProps {
  conversations: Conversation[]
  userId: string
  userRole: 'scout' | 'academy_admin'
}
```

### Unread Badge in Navbar

```typescript
// Pattern: useEffect fetch on mount, called from Navbar
// Skip for platform_admin and unauthenticated users
// Call supabase.rpc('get_total_unread_count') directly from client
// Returns number, renders as small badge circle if > 0
```

### Empty States

| Role | Title | Hint | CTA |
|------|-------|------|-----|
| Scout (0 conversations) | `chat.noConversations` | `chat.noConversationsHint` (existing) | Link to `/players` |
| Admin (0 conversations) | `chat.noConversations` | `chat.noConversationsHintAdmin` (new) | None — scouts initiate |
| API error | `common.somethingWentWrong` | Error description | "Try Again" button |

### New Translation Keys Needed

```typescript
// In en section:
'dashboard.messages': 'Messages',
'dashboard.messagesDesc': 'Active conversations',
'admin.nav.messages': 'Messages',
'chat.noConversationsHintAdmin': 'When scouts message your academy, conversations will appear here.',
'chat.you': 'You',
'chat.yesterday': 'Yesterday',
'chat.messagePreviewFile': 'Sent a file',
'chat.messagePreviewPlayerRef': 'Shared a player',
'chat.messagePreviewSystem': 'System message',

// In ka section:
'dashboard.messages': 'შეტყობინებები',
'dashboard.messagesDesc': 'აქტიური საუბრები',
'admin.nav.messages': 'შეტყობინებები',
'chat.noConversationsHintAdmin': 'როცა სკაუტები თქვენს აკადემიას მისწერენ, საუბრები აქ გამოჩნდება.',
'chat.you': 'თქვენ',
'chat.yesterday': 'გუშინ',
'chat.messagePreviewFile': 'ფაილი გაგზავნა',
'chat.messagePreviewPlayerRef': 'მოთამაშე გააზიარა',
'chat.messagePreviewSystem': 'სისტემური შეტყობინება',
```

## System-Wide Impact

- **Interaction graph**: Inbox page → `GET /api/conversations` → N+3 Supabase queries per conversation. Navbar → `supabase.rpc('get_total_unread_count')` → single aggregate query. Both are read-only.
- **Error propagation**: API errors return JSON `{ error }` — inbox shows error state with retry. RPC errors in Navbar silently show 0 (don't break navigation).
- **State lifecycle risks**: None — all reads, no writes. Stale data from server fetch is acceptable; real-time updates come in Session C.
- **API surface parity**: New `get_total_unread_count()` RPC is the only new backend addition. Everything else consumes existing APIs.

## Acceptance Criteria

### Functional Requirements

- [ ] `get_total_unread_count()` RPC function exists and returns correct count
- [ ] Scout inbox page at `/dashboard/messages` shows conversations sorted by last message time
- [ ] Admin inbox page at `/admin/messages` shows conversations sorted by last message time
- [ ] Each conversation item shows: other party name, last message preview, smart timestamp, unread badge
- [ ] Scout sees club name/logo as other party; admin sees scout name/organization
- [ ] Last message preview shows "You: " prefix when sent by current user
- [ ] Last message preview shows type-specific text for file/player_ref/system messages
- [ ] Unread badge shows count when > 0, hidden when 0
- [ ] Blocked conversations show with dimmed styling and lock icon
- [ ] Empty state with role-specific hint (scout vs admin)
- [ ] DashboardNav shows "Messages" instead of "Requests"
- [ ] AdminSidebar shows "Messages" with chat icon instead of "Requests"
- [ ] DashboardNav "Messages" tab highlights when on `/dashboard/messages` or `/dashboard/messages/[id]`
- [ ] Navbar shows global unread badge (small dot/number) when unread > 0
- [ ] Navbar unread badge hidden for platform_admin and unauthenticated users
- [ ] Dashboard home "Requests" stat card replaced with "Messages" stat card
- [ ] Admin home "Pending Requests" section replaced with messages equivalent
- [ ] Loading skeletons for both inbox pages
- [ ] Error state with retry for API failures
- [ ] All new strings bilingual (English + Georgian)
- [ ] `npm run build` passes with zero errors

### Non-Functional Requirements

- [ ] Navbar unread badge loads via single RPC call (not full conversation fetch)
- [ ] No `any` types
- [ ] Follows existing component patterns (`.card` class, `useLang()`, `usePathname()`)
- [ ] Mobile responsive (single column, horizontal tabs for admin)

## Build Order

1. **Migration**: Create `get_total_unread_count()` RPC, push to remote, regenerate types
2. **Translations**: Add all missing chat inbox keys (en + ka)
3. **Utility**: Create `src/lib/chat-utils.ts` with `formatMessageTime()` and `truncateMessage()`
4. **ChatInbox component**: Build `src/components/chat/ChatInbox.tsx`
5. **Scout inbox page**: `src/app/dashboard/messages/page.tsx` + `loading.tsx`
6. **Admin inbox page**: `src/app/admin/messages/page.tsx` + `loading.tsx`
7. **Navigation updates**: DashboardNav (replace Requests → Messages, fix active state), AdminSidebar (replace Requests → Messages with icon)
8. **Navbar unread badge**: Add `useUnreadCount()` pattern to Navbar
9. **Dashboard home updates**: Replace request stat cards in both scout and admin home pages
10. **Build + commit**: `npm run build`, verify zero errors

## Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| N+1 query in `GET /api/conversations` | Slow inbox with many conversations | Acceptable at current scale (< 50 conversations). Optimize with RPC in Phase 8. |
| No Realtime on inbox | Inbox doesn't update live when messages arrive | Acceptable for Session B. Real-time subscriptions added in Session C. |
| `get_total_unread_count()` RPC performance | Could slow Navbar rendering | Single indexed query on `messages.read_at IS NULL` — fast even at scale. |
| Admin with no club_id | RPC returns 0, inbox returns 0 conversations | Already handled by existing admin layout guard. |

## Sources & References

### Origin

- **Spec document:** [Chat-system-build.md](../../Chat-system-build.md) — Session B definition (lines 362-372)
- **Session A plan:** [docs/plans/2026-03-01-feat-chat-system-session-a-database-api-foundation-plan.md](./2026-03-01-feat-chat-system-session-a-database-api-foundation-plan.md) — completed foundation

### Internal References (Patterns to Follow)

- Scout dashboard nav: `src/components/dashboard/DashboardNav.tsx` — data-driven link array
- Admin sidebar: `src/components/admin/AdminSidebar.tsx` — sidebar + mobile tabs
- Scout dashboard home: `src/components/dashboard/DashboardHome.tsx` — stat cards pattern
- Admin dashboard home: `src/app/admin/page.tsx` — stat cards + recent activity sections
- Scout requests page: `src/app/dashboard/requests/page.tsx` — server component fetch pattern
- Admin requests page: `src/app/admin/requests/page.tsx` — server component with status filters
- Navbar: `src/components/layout/Navbar.tsx` — where unread badge goes
- Loading skeleton pattern: `src/app/dashboard/requests/loading.tsx`
- Error boundary pattern: `src/app/dashboard/requests/error.tsx`
- Card CSS class: `src/app/globals.css` — `.card` class definition
- Conversations API: `src/app/api/conversations/route.ts` — response shape for inbox data
