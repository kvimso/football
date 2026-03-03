---
title: "refactor: Address 14 code review findings on split-pane chat layout"
type: refactor
status: completed
date: 2026-03-03
origin: docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md
---

# Refactor: Address Code Review Findings on Split-Pane Chat Layout

## Overview

The split-pane chat layout (branch `feat/split-pane-chat-layout`, commit `b75db2f`) implements a sidebar+thread pattern for both scout and admin messaging views. A multi-agent code review identified 14 findings (0 P1, 8 P2, 6 P3). This plan addresses all findings in dependency order, grouped into 5 phases.

## Problem Statement

The current implementation works but has:
- **Performance waste**: 3 independent realtime subscriptions + 2 duplicate DB fetches per page load on mobile (up to 9 DB queries per incoming message)
- **Code duplication**: ~75% between ChatSidebar/ChatInbox, ~85% between admin/dashboard layouts+pages
- **Security leak**: Raw Supabase error messages exposed to clients in 2 API routes
- **Accessibility gaps**: MobileChatDrawer missing dialog semantics and focus trap
- **i18n violations**: Hardcoded English ARIA labels in server component layouts

## Proposed Solution

Five phases, ordered by dependency (shared hook must exist before dedup can use it):

1. **Extract shared utilities** — `useConversationList` hook + `getLastMessagePreview` to chat-utils
2. **Eliminate duplicate data fetching** — Remove page-level `fetchConversations`, render mobile list from layout
3. **Deduplicate admin/dashboard templates** — Extract `ChatMessagesLayout` + `ChatMessagesPage` shared components
4. **Fix security, accessibility, i18n** — Raw errors, dialog semantics, ARIA labels, role-aware empty state
5. **Code quality** — Type assertions, memoization, unused params, context dev warning, handleScroll pattern, aria-current

## Phases

### Phase 1: Extract Shared Hook + Utility

**Goal**: Eliminate the 75% code duplication between ChatSidebar and ChatInbox (P2-3), creating a foundation for Phase 2.

**Files to create:**
- `src/hooks/useConversationList.ts` — shared realtime subscription hook

**Files to modify:**
- `src/lib/chat-utils.ts` — add `getLastMessagePreview()`
- `src/components/chat/ChatSidebar.tsx` — consume `useConversationList` hook
- `src/components/chat/ChatInbox.tsx` — consume `useConversationList` hook

**Implementation:**

1. **Move `getLastMessagePreview` to `chat-utils.ts`** (P2-3 partial, P3-12)
   - Copy from ChatSidebar, remove unused `_lang` parameter (fixes P3-12)
   - Signature: `getLastMessagePreview(conv: ConversationWithMetadata, t: TFunction): string`
   - Both ChatSidebar and ChatInbox import from chat-utils

2. **Create `useConversationList` hook** extracting:
   - `liveConversations` state synced from `initialConversations` prop
   - Realtime subscription (debounced 1.5s refetch via `/api/conversations`)
   - `conversationIdsRef` pattern for subscription filter
   - `cancelled` flag + deferred `setTimeout(…, 0)` for StrictMode safety
   - Channel name: `conversations-${userId}` (user-scoped, fixes ChatInbox's unscoped `'inbox-updates'`)
   - Returns: `{ conversations, isLoading }`

3. **Refactor ChatSidebar** to use `useConversationList` + imported `getLastMessagePreview`
   - Remove the ~55 lines of inline realtime logic
   - Remove the ~25 lines of inline `getLastMessagePreview`

4. **Refactor ChatInbox** to use `useConversationList` + imported `getLastMessagePreview`
   - Same removals as ChatSidebar

**Verification**: Both components render identical conversation lists with realtime updates. Total realtime channels per user reduced from 2+ to 1 shared pattern (but still separate instances per component — Phase 2 addresses the triple-subscription issue).

---

### Phase 2: Eliminate Duplicate Data Fetching

**Goal**: Fix triple realtime subscriptions on mobile (P2-1) and double `fetchConversations()` on every page load (P2-2).

**Files to modify:**
- `src/app/dashboard/messages/layout.tsx`
- `src/app/dashboard/messages/page.tsx`
- `src/app/admin/messages/layout.tsx`
- `src/app/admin/messages/page.tsx`

**Implementation:**

1. **Remove `fetchConversations` from page files** (P2-2)
   - Delete the server-side `fetchConversations()` call from both `page.tsx` files
   - Page files no longer pass `conversations` prop to ChatInbox

2. **Move mobile conversation list into layout** (P2-1)
   - In each `layout.tsx`, render `ChatInbox` (hidden on desktop via `lg:hidden`) alongside `ChatSidebar` (hidden on mobile via `hidden lg:block`), both receiving the same `initialConversations` from the single layout fetch
   - The `page.tsx` files now only render the empty state (desktop: `ChatEmptyState`, mobile: nothing — because ChatInbox is in the layout)
   - This means on mobile `/messages` index: ChatInbox shows in layout, page is minimal
   - On mobile `/messages/[id]`: ChatInbox is hidden (layout uses responsive classes), ChatThread fills the screen, MobileChatDrawer provides the sidebar

3. **Single subscription per component instance**
   - With the `useConversationList` hook from Phase 1, each component instance (ChatSidebar on desktop, ChatInbox on mobile) creates its own subscription — but they're never both visible simultaneously due to responsive hiding (`hidden lg:block` / `lg:hidden`)
   - CSS `display:none` components still mount in React, but the realtime cost is acceptable (2 subscriptions, not 3) and the UX benefit of instant switching is worth it
   - **Alternative considered**: A shared `ConversationsRealtimeProvider` context would be architecturally purer but adds complexity for minimal gain given responsive hide/show. Defer unless performance profiling shows issues.

**Verification**: Network tab shows 1 `fetchConversations` RPC per page load (not 2). Supabase Realtime inspector shows max 2 conversation channels (sidebar + inbox instances) regardless of viewport.

---

### Phase 3: Deduplicate Admin/Dashboard Templates

**Goal**: Fix the ~85% duplication between admin and dashboard messages layouts+pages (P2-4).

**Files to create:**
- `src/components/chat/ChatMessagesLayout.tsx` — shared layout shell (client component)

**Files to modify:**
- `src/app/dashboard/messages/layout.tsx` — thin wrapper calling shared shell
- `src/app/dashboard/messages/page.tsx` — thin wrapper
- `src/app/admin/messages/layout.tsx` — thin wrapper calling shared shell
- `src/app/admin/messages/page.tsx` — thin wrapper

**Implementation:**

1. **Extract `ChatMessagesLayout` component**
   - Props: `initialConversations`, `userId`, `userRole`, `basePath`, `error`, `children`
   - Contains: `ChatDrawerProvider` → flex container → `ChatSidebar` (desktop) + `ChatInbox` (mobile, from Phase 2) + `MobileChatDrawer` + `{children}`
   - Handles the ARIA landmark labels using `t()` (fixes P2-7)

2. **Simplify layout files to thin server-component wrappers**
   - Each layout: auth check → `fetchConversations` → `<ChatMessagesLayout {...props}>{children}</ChatMessagesLayout>`
   - Admin layout keeps the extra `club_id` check
   - Dashboard layout is minimal

3. **Simplify page files**
   - Each page becomes just: auth check (if needed) → `<ChatEmptyState role={role} />` (role-aware, see Phase 4)
   - Remove all conversation fetching from pages (already done in Phase 2)

**Verification**: Both `/dashboard/messages` and `/admin/messages` render identically to current state. Diff shows net reduction of ~100 lines.

---

### Phase 4: Security, Accessibility, i18n Fixes

**Goal**: Fix raw DB error leaks (P2-5), MobileChatDrawer accessibility (P2-6), i18n ARIA labels (P2-7), and role-aware empty state (P2-8).

**Files to modify:**
- `src/app/api/conversations/[conversationId]/block/route.ts` — sanitize error responses
- `src/app/api/messages/[conversationId]/read/route.ts` — sanitize error responses
- `src/components/chat/MobileChatDrawer.tsx` — add dialog semantics + focus trap
- `src/components/chat/ChatEmptyState.tsx` — role-aware content
- `src/components/chat/ChatMessagesLayout.tsx` — i18n ARIA labels (from Phase 3)
- `src/lib/translations/chat.ts` — add new translation keys

**Implementation:**

1. **Sanitize API error responses** (P2-5)
   - `block/route.ts` lines ~96, ~111: Replace `{ error: insertError.message }` and `{ error: deleteError.message }` with `{ error: 'errors.serverError' }`
   - `read/route.ts` line ~43: Replace `{ error: rpcError.message }` with `{ error: 'errors.serverError' }`
   - Keep `console.error` with the raw message for server-side debugging

2. **MobileChatDrawer accessibility** (P2-6)
   - Add `role="dialog"` and `aria-modal="true"` to the drawer panel
   - Add `aria-label={t('aria.conversationList')}` (or `aria-labelledby` pointing to a heading)
   - **Focus trap**: When drawer opens, focus the first focusable element inside; when drawer closes, restore focus to the trigger (hamburger button). Use a simple manual trap: on Tab at last element → focus first; on Shift+Tab at first → focus last. No external library needed — matches project convention of no extra dependencies.
   - Add `inert` attribute to the content behind the drawer when open (prevents tabbing to thread). This is natively supported in all modern browsers.

3. **i18n ARIA labels** (P2-7)
   - In `ChatMessagesLayout` (from Phase 3), replace hardcoded `"Conversation list"` and `"Message thread"` with `t('aria.conversationList')` and `t('aria.messageThread')`
   - Since `ChatMessagesLayout` is a client component, use `useLang()` — no need for `getServerT()`
   - Add keys to `src/lib/translations/chat.ts`:
     ```
     'aria.conversationList': 'Conversation list' / 'საუბრების სია'
     'aria.messageThread': 'Message thread' / 'შეტყობინებების თრედი'
     ```

4. **Role-aware ChatEmptyState** (P2-8)
   - Add `role` prop: `'scout' | 'academy_admin'`
   - Scout: "Browse Players" link → `/players` (current behavior)
   - Admin: "Your Inbox" message — "Scouts will message you when interested in your players" with no action link (admins receive, they don't initiate)
   - Add translation keys: `chat.emptyStateAdmin`, `chat.emptyStateAdminDescription`

**Verification**:
- API routes return generic error on 500 (test with invalid data)
- MobileChatDrawer: Tab key cycles within drawer when open, Escape closes it
- Screen reader announces drawer as dialog
- ARIA labels rendered in current language
- Admin sees appropriate empty state text

---

### Phase 5: Code Quality (P3 Fixes)

**Goal**: Address all 6 P3 (nice-to-have) findings.

**Files to modify:**
- `src/components/chat/ChatSidebar.tsx` — type assertion, aria-current
- `src/components/chat/ChatThread.tsx` — handleScroll pattern, groupMessagesByDate memoization
- `src/context/ChatDrawerContext.tsx` — dev warning

**Implementation:**

1. **Type the fetch response** (P3-9)
   - In `useConversationList` hook (from Phase 1), add type assertion on the `/api/conversations` response:
     ```typescript
     const data = (await res.json()) as { conversations: ConversationWithMetadata[] }
     ```

2. **Fix handleScroll pattern** (P3-10)
   - Wrap `handleScroll` in `requestAnimationFrame` throttle
   - Remove `newMessageCount` from deps array → use `[]` (stable callback)
   - Access `newMessageCount` via ref to avoid stale closure

3. **Memoize groupMessagesByDate** (P3-11)
   - Wrap `groupMessagesByDate(messages)` call in `useMemo(() => groupMessagesByDate(messages), [messages])`

4. **Remove unused `_lang` parameter** (P3-12)
   - Already handled in Phase 1 when moving `getLastMessagePreview` to chat-utils

5. **Add `aria-current="page"` to active conversation** (P3-13)
   - In ChatSidebar, add `aria-current={isActive ? 'page' : undefined}` to the conversation `<Link>` element

6. **ChatDrawerContext dev warning** (P3-14)
   - Replace the no-op default with a function that throws in development:
     ```typescript
     const defaultValue = {
       isDrawerOpen: false,
       openDrawer: () => { if (process.env.NODE_ENV === 'development') throw new Error('useChatDrawer must be used within ChatDrawerProvider') },
       closeDrawer: () => { if (process.env.NODE_ENV === 'development') throw new Error('useChatDrawer must be used within ChatDrawerProvider') },
     }
     ```

**Verification**: TypeScript compiles with no `any` types in chat components. Scroll performance is smooth (no layout thrashing). Active conversation announced by screen reader.

---

## Acceptance Criteria

### Functional
- [x] Single `fetchConversations` RPC per page load (not 2)
- [x] Max 2 realtime conversation channels per user (not 3)
- [x] ChatSidebar and ChatInbox share `useConversationList` hook
- [x] Admin and dashboard layouts share `ChatMessagesLayout` component
- [x] API 500 responses never expose raw DB error strings
- [x] MobileChatDrawer has `role="dialog"`, `aria-modal`, focus trap
- [x] All ARIA labels use `t()` with en+ka translations
- [x] ChatEmptyState shows role-appropriate content
- [x] Active conversation has `aria-current="page"`
- [x] `groupMessagesByDate` is memoized
- [x] `handleScroll` is rAF-throttled with stable deps

### Non-Functional
- [x] Net code reduction of ~100+ lines despite new shared components
- [x] `npm run build` passes with no errors or warnings
- [x] No new `any` types introduced
- [x] All new translation keys have both en and ka values

## Dependencies & Risks

- **Phase ordering matters**: Phase 1 creates the shared hook → Phase 2 uses it to restructure data flow → Phase 3 uses Phase 2's layout changes → Phases 4-5 are independent of each other but depend on Phase 3's `ChatMessagesLayout`
- **Risk: Breaking mobile layout** — The responsive hide/show (`hidden lg:block` / `lg:hidden`) approach means both ChatSidebar and ChatInbox mount on all viewports. If the responsive breakpoints are wrong, users could see both or neither. Mitigate by visual testing at 375px, 768px, and 1024px.
- **Risk: MobileChatDrawer focus trap edge cases** — Manual focus trap implementation can miss edge cases (e.g., dynamically added focusable elements). Keep the trap simple: query focusable elements on open, not continuously.

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md](docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md) — Key decisions: App Router layout-based split pane, ChatSidebar as new component, responsive drawer pattern, both roles get same treatment.

### Internal References
- Chat utilities: `src/lib/chat-utils.ts`
- Chat queries: `src/lib/chat-queries.ts`
- Accessibility pattern (PlayerSearchModal): `src/components/chat/PlayerSearchModal.tsx`
- Error handling pattern: `src/app/api/conversations/route.ts` (uses `'errors.serverError'`)
- Translations: `src/lib/translations/chat.ts`

### Institutional Learnings Applied
- `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md` — Realtime debounce pattern, i18n compliance rules
- `docs/solutions/ui-bugs/chat-session-f-polish-reliability-accessibility.md` — Accessibility patterns, reconnecting banner, keyboard navigation
- `docs/solutions/security-issues/chat-system-code-review-fixes.md` — Code dedup patterns, Zod validation, stale closure fixes

### Code Review
- All 14 findings from the multi-agent review of branch `feat/split-pane-chat-layout` (commit `b75db2f`)
