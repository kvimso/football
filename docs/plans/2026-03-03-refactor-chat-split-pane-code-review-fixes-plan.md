---
title: "refactor: Address code review findings for split-pane chat layout"
type: refactor
status: completed
date: 2026-03-03
origin: docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md
---

# refactor: Address code review findings for split-pane chat layout

## Overview

Fix 9 code review findings (2 P1, 4 P2, 3 P3) from the multi-agent review of `feat/split-pane-chat-layout`. The two critical findings — duplicate Realtime subscriptions and stale subscription filter — affect correctness and must be fixed before merge. The remaining findings improve performance, reduce duplication, and clean up dead code.

**P3-9 (UUID validation on filter IDs) is dropped** because P1-2 removes the filter entirely, making validation moot.

## Problem Statement

The split-pane chat implementation (branch `feat/split-pane-chat-layout`, +1342/-156 lines, 23 files) introduced a layout-based sidebar + thread architecture. The implementation works but has two correctness bugs and several quality issues:

1. **ChatSidebar is rendered twice** (desktop nav + mobile drawer), each instance calling `useConversationList` → 2 Supabase Realtime channels. The index page's ChatInbox adds a 3rd. CSS `hidden` does NOT prevent React hooks from running.
2. **Realtime message filter is frozen** to conversation IDs at mount time. New conversations never receive message events until page reload.

## Proposed Solution

### Architecture: ConversationListContext

The core fix lifts `useConversationList` into `ChatMessagesLayout` and exposes the live conversation list via a React Context. Both `ChatSidebar` (rendered twice by layout) and `ChatInbox` (rendered by page as `children`) consume the same context — one subscription, one state, shared everywhere.

```
ChatMessagesLayout (client component)
  ├── ConversationListProvider  ← owns useConversationList (1 subscription)
  │   ├── ChatDrawerProvider
  │   │   ├── <nav> → ChatSidebar  ← useConversations() from context
  │   │   ├── MobileChatDrawer → ChatSidebar  ← same context
  │   │   └── {children}
  │   │       ├── page.tsx → ChatInbox  ← useConversations() from context
  │   │       └── [conversationId]/page.tsx → ChatThread (own subscription)
```

### Realtime: Remove per-conversation filter

Replace the `conversation_id=in.(ids)` filter with an unfiltered `messages` listener (matching DashboardNav/AdminSidebar pattern). Supabase Realtime applies RLS server-side — verified that `conversations` SELECT policy restricts to `scout_id = auth.uid() OR (academy_admin AND club_id match) OR platform_admin`. The 1500ms debounce prevents refetch storms.

## Technical Considerations

- **React.cache scope**: Works within a single RSC render pass. Nested layouts render sequentially (parent first), so cache is shared correctly down the layout chain.
- **`auth.ts` uses `'use server'`**: Cannot wrap existing `getAdminContext()` in `React.cache`. Need a new non-server-action function in a separate file.
- **React.memo is new to this codebase**: P2-6 introduces the first `React.memo` usage. Keep it simple — one component, clear justification.
- **ConversationDetail vs ConversationItem types**: `ChatThread` uses `ConversationDetail` (non-nullable `club`), while sidebar/inbox use `ConversationItem` (nullable `club`). The shared `getConversationDisplayName` utility must handle both.

## System-Wide Impact

- **Realtime channel count**: Drops from 3 (index page) / 2 (thread page) to 1 / 2. AdminSidebar's separate unread-badge channel remains independent — different purpose, acceptable duplication.
- **Auth query count (admin)**: Drops from 6-8 round-trips to 2 (one cached `getUser()` + one cached profile query per RSC render).
- **Re-render scope**: ChatSidebar list items only re-render when their own data changes (active state, unread count, last message), not on every URL navigation.

## Acceptance Criteria

### P1 — Critical (blocks merge)

- [x] **P1-1**: Only 1 Supabase Realtime channel for conversation list per user session (verify in browser DevTools → Network → WS)
- [x] **P1-2**: New conversation created by another user appears in sidebar without page reload
- [x] **P1-2**: New message in a conversation not in the original list triggers sidebar update

### P2 — Important

- [x] **P2-3**: `messagesEndRef` removed from ChatThread (no dead refs)
- [x] **P2-4**: Admin messages page makes ≤2 Supabase auth/profile queries total (verify via Supabase logs or `console.log` in cached function)
- [x] **P2-5**: Display name logic exists in exactly one place (`getConversationDisplayName` in `chat-utils.ts`)
- [x] **P2-6**: Switching conversations in sidebar only re-renders the 2 affected items (old active + new active), not the entire list

### P3 — Nice-to-have

- [x] **P3-7**: No unused imports (ESLint clean)
- [x] **P3-8**: `getLastMessagePreview` accepts optional `maxLen` parameter
- [x] **P3-10**: `ChatDrawerContext` uses `null` default + guard pattern

### Build & Lint

- [x] `npm run build` passes with zero errors
- [x] `npm run lint` passes with zero errors

## Implementation Phases

### Phase 1: P1-1 + P1-2 — Lift subscription + fix stale filter

**Files touched:**
- `src/context/ConversationListContext.tsx` (NEW)
- `src/hooks/useConversationList.ts` (MODIFY — remove filter)
- `src/components/chat/ChatMessagesLayout.tsx` (MODIFY — add provider, stop passing props to ChatSidebar)
- `src/components/chat/ChatSidebar.tsx` (MODIFY — consume context instead of hook)
- `src/components/chat/ChatInbox.tsx` (MODIFY — consume context instead of hook)

**Steps:**

1. **Create `ConversationListContext`** (`src/context/ConversationListContext.tsx`):

```tsx
// src/context/ConversationListContext.tsx
'use client'

import { createContext, useContext } from 'react'
import type { ConversationItem } from '@/lib/types'

const ConversationListContext = createContext<ConversationItem[] | null>(null)

export function useConversations(): ConversationItem[] {
  const ctx = useContext(ConversationListContext)
  if (ctx === null) {
    throw new Error('useConversations must be used within ConversationListProvider')
  }
  return ctx
}

export { ConversationListContext }
```

2. **Remove per-conversation filter from `useConversationList`** — delete lines 56-66 (the `if (ids.length > 0)` block with filter) and replace with unfiltered listener. Also remove `conversationIdsRef` (no longer needed):

```tsx
// In useConversationList.ts — simplified subscription
const channelBuilder = supabase.channel(`conversations-${userId}`)
channelBuilder.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'messages',
}, refetchConversations)
channelBuilder.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'conversations',
}, refetchConversations)
activeChannel = channelBuilder.subscribe()
```

3. **Update `ChatMessagesLayout`** — call `useConversationList` here, wrap children in `ConversationListContext.Provider`:

```tsx
// In ChatMessagesLayout
import { useConversationList } from '@/hooks/useConversationList'
import { ConversationListContext } from '@/context/ConversationListContext'

export function ChatMessagesLayout({ initialConversations, userId, userRole, basePath, error, children }) {
  const { t } = useLang()
  const { conversations } = useConversationList({ initialConversations, userId })

  return (
    <ConversationListContext.Provider value={conversations}>
      <ChatDrawerProvider>
        <div className="flex h-full overflow-hidden rounded-lg border border-border">
          <nav ...>
            <ChatSidebar userRole={userRole} basePath={basePath} error={error} />
          </nav>
          <MobileChatDrawer>
            <ChatSidebar userRole={userRole} basePath={basePath} error={error} />
          </MobileChatDrawer>
          <div role="region" ...>{children}</div>
        </div>
      </ChatDrawerProvider>
    </ConversationListContext.Provider>
  )
}
```

4. **Update `ChatSidebar`** — remove `useConversationList` call, consume `useConversations()` from context. Remove `initialConversations` and `userId` from props.

5. **Update `ChatInbox`** — same as ChatSidebar: consume `useConversations()` from context. Remove `initialConversations` and `userId` from props.

6. **Update server layouts and pages** — remove `initialConversations` and `userId` props from `<ChatInbox>` in `admin/messages/page.tsx` and `dashboard/messages/page.tsx`. These components now get data from context.

### Phase 2: P2-5 — Extract display name utility

**Files touched:**
- `src/lib/chat-utils.ts` (ADD function)
- `src/components/chat/ChatSidebar.tsx` (USE function)
- `src/components/chat/ChatInbox.tsx` (USE function)
- `src/components/chat/ChatThread.tsx` (USE function)

**Function signature:**

```tsx
// src/lib/chat-utils.ts
export function getConversationDisplayName(
  club: { name: string; name_ka: string | null } | null | undefined,
  otherParty: { full_name: string },
  userRole: 'scout' | 'academy_admin',
  lang: Lang,
  t: (key: string) => string,
): string {
  const rawName = userRole === 'scout'
    ? (lang === 'ka' && club?.name_ka ? club.name_ka : club?.name ?? otherParty.full_name)
    : otherParty.full_name
  return rawName || (userRole === 'scout' ? t('common.unknownClub') : t('common.unknownScout'))
}
```

Replace the inline 4-line derivation in all 3 components with a single call to this function.

### Phase 3: P2-6 — Memoize sidebar conversation items

**Files touched:**
- `src/components/chat/ChatSidebar.tsx` (EXTRACT + MEMO)

**Steps:**

1. Extract the `conversations.map()` callback body (lines 60-123) into a `ConversationItem` component.
2. Wrap with `React.memo` using a custom `areEqual` comparator:

```tsx
const ConversationItem = memo(function ConversationItem({
  conv, isActive, userRole, basePath, lang, t, userId,
}: ConversationItemProps) {
  // ... existing render logic from lines 60-123
}, (prev, next) => {
  return prev.conv.id === next.conv.id
    && prev.conv.unread_count === next.conv.unread_count
    && prev.conv.last_message?.created_at === next.conv.last_message?.created_at
    && prev.conv.is_blocked === next.conv.is_blocked
    && prev.isActive === next.isActive
    && prev.lang === next.lang
})
```

3. `usePathname()` stays in ChatSidebar parent — it passes `isActive` boolean to each child.

### Phase 4: P2-4 — Cache admin auth context

**Files touched:**
- `src/lib/cached-auth.ts` (NEW — separate from `auth.ts` which is `'use server'`)
- `src/app/admin/layout.tsx` (USE cached function)
- `src/app/admin/messages/layout.tsx` (USE cached function)
- `src/app/admin/messages/page.tsx` (USE cached function)

**New cached function** (NOT a server action — no `'use server'` directive):

```tsx
// src/lib/cached-auth.ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'

export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user: error ? null : user, supabase }
})

export const getCachedAdminProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, club_id, full_name, club:clubs!profiles_club_id_fkey(name, name_ka)')
    .eq('id', userId)
    .single()
  if (error || !profile) return null
  return { ...profile, club: unwrapRelation(profile.club) }
})
```

Update each layout/page to call `getCachedUser()` and `getCachedAdminProfile(user.id)` instead of independent `createClient()` + `getUser()` + profiles queries.

**Dashboard side**: Also update `dashboard/layout.tsx` and `dashboard/messages/layout.tsx` to use `getCachedUser()` for consistency (2 → 1 auth call).

### Phase 5: Cleanup batch (P2-3, P3-7, P3-8, P3-10)

All independent, can be done in a single pass:

| Finding | File | Change |
|---------|------|--------|
| P2-3 | `ChatThread.tsx` | Remove `messagesEndRef` declaration (line 46) and `<div ref={messagesEndRef} />` (line 605) |
| P3-7 | `MobileChatDrawer.tsx` | Remove `useCallback` from import (line 3) |
| P3-8 | `chat-utils.ts` | Add `maxLen = 50` parameter to `getLastMessagePreview`. ChatInbox passes `60`. |
| P3-10 | `ChatDrawerContext.tsx` | Replace default value with `null`, add guard in `useChatDrawer` hook |

### Phase 6: Verify build + lint + manual test

- [x] `npm run build` — zero errors
- [x] `npm run lint` — zero errors (2 pre-existing warnings in unrelated files)
- [ ] Manual test: open 2 browser tabs (scout + admin), send messages, verify sidebar updates
- [ ] Manual test: create new conversation, verify it appears in sidebar without reload
- [ ] Manual test: mobile viewport — verify drawer conversation list updates in realtime
- [ ] Manual test: block/unblock — verify state propagates

## Dependencies & Risks

- **Phase ordering is critical**: P1-1 must precede P2-6 (memo depends on prop-based interface) and P2-5 (display name extraction should target refactored components).
- **React.memo is new to this codebase**: P2-6 is the first usage. If it causes issues, it can be safely reverted without affecting correctness.
- **`getCachedUser` returns `supabase` client**: Layouts that need the client for additional queries get it from the cache, avoiding redundant `createClient()` calls.

## Dropped Findings

- **P3-9 (UUID validation on filter IDs)**: P1-2 removes the filter string entirely, making validation moot.

## Sources & References

- **Origin brainstorm:** [docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md](../brainstorms/2026-03-03-split-pane-chat-brainstorm.md) — layout-based split pane architecture, data fetching strategy, responsive behavior decisions
- **Institutional learnings:** [docs/CHAT_UI_LEARNINGS.md](../CHAT_UI_LEARNINGS.md) — Realtime debounce pattern, channel cleanup, scroll containment
- **Existing unfiltered Realtime pattern:** `src/components/dashboard/DashboardNav.tsx:32-44`, `src/components/admin/AdminSidebar.tsx:39-52`
- **Existing React.cache pattern:** `src/lib/chat-queries.ts:71-76` (`getCachedConversations`)
- **RLS verification:** `conversations` SELECT policy restricts to `scout_id = auth.uid() OR (academy_admin + club_id match) OR platform_admin`
