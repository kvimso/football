---
title: "feat: Chat System Session D — Completion & Integration"
type: feat
status: completed
date: 2026-03-01
origin: Phase 6.5 chat system build (Sessions A + B + C complete)
---

# Chat System Session D — Completion & Integration

## Overview

Final session for Phase 6.5. Sessions A-C built the database, API, inbox, and conversation thread with real-time messaging. Session D integrates chat into the existing platform (player profiles, club pages), adds the block/unblock UI, deprecates old contact request pages, and adds error boundaries.

**Depends on:**
- Session A (commit `4930fbe`) — database, API routes, validation, constants, translations
- Session B (commit `5d11bdf`) — inbox UI, navigation updates, unread badges
- Session C (commit `e4916ee`) — conversation thread UI with real-time messaging

**CLAUDE.md checklist items covered:**
- [x] "Message Academy" button on player profiles and club pages
- [x] Block/unblock system for academy admins
- [x] Remove old contact request UI (keep table for historical data)
- [x] Empty states, loading states, error handling (error boundaries for thread pages)

## Problem Statement / Motivation

The chat system is fully functional but isolated — users can only access it through the inbox. There is no entry point from player profiles or club pages, which is where scouts naturally discover players and want to reach out. The old contact request form still appears on player profiles. The block/unblock UI is missing (only the database layer exists). Old request pages still exist at their original URLs.

## Proposed Solution

### Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| "Message Academy" button | **New `MessageAcademyButton` client component** | Needs `router.push()` after API call. Reusable on both player profile and club pages. |
| Button visibility | **Scout role only, active players only** | Academy admins should not message themselves. Free agents have no club to message. The player profile server component fetches the user's `role` from `profiles` table. |
| Block/unblock API | **Explicit action (`block`/`unblock`) not toggle** | Toggle endpoints are prone to race conditions with optimistic updates. Explicit action is safer. |
| Block semantics | **Neither party can send when blocked** | ChatInput already disables both sides. API block check updated to prevent blocker from sending too. |
| Old request pages | **`redirect()` in server component** | Simple, reversible, preserves files for easy rollback. The table and action files remain for historical data. |
| Error boundaries | **`error.tsx` in both `[conversationId]` directories** | Follows existing `/dashboard/error.tsx` pattern with retry button and "Back to messages" link. |
| Thread layout height | **Adjust CSS calc to account for DashboardNav/AdminSidebar** | Current `h-[calc(100vh-64px)]` only accounts for Navbar. Dashboard adds ~48px tab bar. |

### Key Design Decision: No Auto-Inserted Player Reference

When a scout clicks "Message Academy" from a player profile, they are redirected to the conversation thread but no player reference message is auto-inserted. The scout can manually reference the player using the player search modal in the chat input. This keeps the behavior simple and avoids unexpected messages.

## Technical Approach

### Phase 1: "Message Academy" Button

#### 1a. New component: `src/components/chat/MessageAcademyButton.tsx`

Client component that:
1. Shows a green "Message Academy" button (matches existing btn-primary styling)
2. On click: calls `POST /api/conversations` with `club_id`
3. Shows loading/disabled state during API call
4. On success: `router.push('/dashboard/messages/{conversationId}')`
5. On error: shows inline error message (rate limit, auth failure, etc.)

```typescript
interface MessageAcademyButtonProps {
  clubId: string
}
```

#### 1b. Modify player profile page: `src/app/(platform)/players/[slug]/page.tsx`

Changes:
1. Add `id` to the nested club select: `club:clubs!players_club_id_fkey ( id, name, name_ka, slug )`
2. Fetch user's role from `profiles` table (needed to conditionally render button)
3. Replace `ContactRequestForm` with `MessageAcademyButton` (only for scouts, only for active players)
4. Remove `hasContactRequest` check and the "Request Sent" badge (no longer relevant)
5. Remove `ContactRequestForm` import

**Before (lines 279-290):**
```tsx
{user && (
  <div className="mt-4 flex flex-wrap gap-3">
    <ShortlistButton ... />
    {!isFreeAgent && (
      !hasContactRequest ? (
        <ContactRequestForm playerId={player.id} />
      ) : (
        <span ...>{t('players.requestSent')}</span>
      )
    )}
    ...
```

**After:**
```tsx
{user && (
  <div className="mt-4 flex flex-wrap gap-3">
    <ShortlistButton ... />
    {!isFreeAgent && userRole === 'scout' && club?.id && (
      <MessageAcademyButton clubId={club.id} />
    )}
    ...
```

#### 1c. Modify club page: `src/app/(platform)/clubs/[slug]/page.tsx`

Changes:
1. Fetch authenticated user and their role from `profiles`
2. Add "Message Academy" button in the club header area (next to website link)
3. Only show for scouts

**Placement:** After the club description/city/website section, add the button:
```tsx
{user && userRole === 'scout' && (
  <div className="mt-3">
    <MessageAcademyButton clubId={club.id} />
  </div>
)}
```

### Phase 2: Block/Unblock System

#### 2a. New API: `src/app/api/conversations/[conversationId]/block/route.ts`

| Method | Description | Auth |
|--------|-------------|------|
| POST | Block or unblock a scout in a conversation | Academy admin only |

Request body:
```typescript
{ action: 'block' | 'unblock' }
```

POST logic:
1. Validate `conversationId` is UUID and `action` is valid
2. Auth check — must be `academy_admin`
3. Fetch conversation, verify user's `club_id` matches conversation's `club_id`
4. If `action === 'block'`:
   - Check if already blocked → return 400 "Already blocked"
   - Insert into `conversation_blocks` with `blocked_by = user.id`
5. If `action === 'unblock'`:
   - Delete from `conversation_blocks` where `conversation_id` and `blocked_by = user.id`
   - If no rows deleted → return 400 "Not blocked"
6. Return `{ success: true, is_blocked: boolean }`

#### 2b. Add block button to ChatThread header

Modify `src/components/chat/ChatThread.tsx`:
- Add a block/unblock button in the thread header (only visible to `academy_admin`)
- Block button: shows confirmation before calling API
- Unblock button: calls API directly (no confirmation needed)
- After API success: update local `isBlocked` state + refresh conversation data

```tsx
{/* In the thread header, after the display name */}
{userRole === 'academy_admin' && (
  <button
    onClick={handleBlockToggle}
    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs ..."
  >
    {conversation.is_blocked && conversation.blocked_by_me
      ? t('chat.unblock')
      : t('chat.block')}
  </button>
)}
```

**Confirmation for blocking:** Simple inline confirm — click "Block" → button changes to "Confirm Block?" (red) → click again to confirm, or click away to cancel. This avoids a modal for a simple action.

#### 2c. Update block check in messages API

Modify `src/app/api/messages/route.ts` POST handler:
- Current check (line 40-49): only checks if the OTHER party blocked
- Update: also check if the CURRENT user is the blocker → prevent sending when you've blocked someone

```typescript
// Existing check for "am I blocked by the other party?"
// Add: also check "did I block this conversation?"
const { data: blockedByMe } = await supabase
  .from('conversation_blocks')
  .select('id')
  .eq('conversation_id', body.conversation_id)
  .eq('blocked_by', user.id)
  .maybeSingle()

if (blockedByMe) {
  return NextResponse.json({ error: 'errors.conversationBlocked' }, { status: 403 })
}
```

### Phase 3: Deprecate Old Contact Request Pages

#### 3a. Redirect scout requests page

Modify `src/app/dashboard/requests/page.tsx` — replace the entire content with:
```typescript
import { redirect } from 'next/navigation'
export default function RequestsPage() {
  redirect('/dashboard/messages')
}
```

#### 3b. Redirect admin requests page

Modify `src/app/admin/requests/page.tsx` — same pattern:
```typescript
import { redirect } from 'next/navigation'
export default function AdminRequestsPage() {
  redirect('/admin/messages')
}
```

#### 3c. Clean up loading files

Delete or simplify `src/app/dashboard/requests/loading.tsx` and `src/app/admin/requests/loading.tsx` (they'll never render since the page immediately redirects).

#### 3d. Files to keep (historical data)

Do NOT delete:
- `src/app/actions/contact.ts` — server action for contact requests
- `src/components/forms/ContactRequestForm.tsx` — component (may be used by platform admin)
- `src/components/dashboard/RequestsList.tsx` — component (may be used by platform admin)
- `src/app/platform/requests/page.tsx` — platform admin view of all requests (shows historical data)
- `contact_requests` table — preserved per CLAUDE.md

### Phase 4: Error Boundaries for Thread Pages

#### 4a. `src/app/dashboard/messages/[conversationId]/error.tsx`

```typescript
'use client'
// Pattern from src/app/dashboard/error.tsx
// Shows: error message, "Try again" button, "Back to messages" link
```

#### 4b. `src/app/admin/messages/[conversationId]/error.tsx`

Same pattern, but "Back to messages" links to `/admin/messages`.

### Phase 5: Thread Layout Height Fix

Adjust `ChatThread.tsx` to account for the parent layout chrome:
- Dashboard: Navbar (64px) + DashboardNav (48px) = 112px
- Admin: Navbar (64px) + AdminSidebar padding varies

**Solution:** Instead of hard-coding heights, use `h-[calc(100dvh-var(--chat-offset))]` with the offset set by the parent layout, or more practically, use `flex-1 min-h-0` within the existing flex container.

Since the dashboard and admin layouts already use flex containers, the ChatThread can use `flex-1 min-h-0 overflow-hidden` on its root and let CSS handle the remaining height. The current `h-[calc(100vh-64px)]` is replaced with a flex-based approach.

### Phase 6: Translations

New translation keys needed (both en + ka):

```typescript
// Block/unblock UI
'chat.block': { en: 'Block', ka: 'დაბლოკვა' },
'chat.unblock': { en: 'Unblock', ka: 'განბლოკვა' },
'chat.confirmBlock': { en: 'Confirm block?', ka: 'დაბლოკვის დადასტურება?' },
'chat.blockSuccess': { en: 'Scout blocked', ka: 'სკაუტი დაიბლოკა' },
'chat.unblockSuccess': { en: 'Scout unblocked', ka: 'სკაუტი განიბლოკა' },

// Message Academy button
'chat.messageAcademyLoading': { en: 'Opening conversation...', ka: 'საუბრის გახსნა...' },

// Error boundary
'chat.threadError': { en: 'Could not load conversation', ka: 'საუბრის ჩატვირთვა ვერ მოხერხდა' },
'chat.backToMessages': { en: 'Back to messages', ka: 'შეტყობინებებზე დაბრუნება' },

// Block API errors
'errors.alreadyBlocked': { en: 'This scout is already blocked', ka: 'ეს სკაუტი უკვე დაბლოკილია' },
'errors.notBlocked': { en: 'This scout is not blocked', ka: 'ეს სკაუტი არ არის დაბლოკილი' },
```

Note: `chat.messageAcademy` already exists in translations from Session B.

## System-Wide Impact

### Interaction Graph

- Scout clicks "Message Academy" on player profile → `POST /api/conversations` with `club_id` → creates or returns existing conversation → `router.push` to thread → Realtime subscription starts → scout can send messages
- Admin clicks "Block" in thread header → confirmation → `POST /api/conversations/{id}/block` with `{ action: 'block' }` → inserts `conversation_blocks` row → local state updates → ChatInput disabled for both parties → RLS prevents message INSERT for both parties
- User visits old `/dashboard/requests` → `redirect()` → `/dashboard/messages`
- Thread page throws error → `error.tsx` catches → shows retry + back to inbox

### Error Propagation

- `POST /api/conversations` rate limit (10/day) → 429 → button shows translated error message
- `POST /api/conversations/[id]/block` auth failure → 403 → button shows error
- Block API double-click → second request returns 400 "Already blocked" → UI already shows blocked state (harmless)
- Thread page error → caught by `error.tsx` → retry button + "Back to messages" link

### State Lifecycle Risks

- **Stale block state after toggle:** If admin blocks in the thread, the inbox `is_blocked` field is stale until next refresh. Acceptable — inbox data refreshes on navigation.
- **Orphaned ContactRequestForm state:** If a scout previously sent a contact request and now sees "Message Academy" instead, the old request status is invisible. Acceptable — old requests are preserved in the database and accessible via platform admin.

### API Surface Parity

- New endpoint: `POST /api/conversations/[conversationId]/block` — block/unblock toggle
- Modified endpoint: `POST /api/messages` — updated block check to prevent blocker from sending
- No other endpoints changed

## Acceptance Criteria

### Functional Requirements

- [ ] `MessageAcademyButton` component exists and is reusable
- [ ] Player profile page shows "Message Academy" button for scouts viewing active players
- [ ] Player profile page does NOT show "Message Academy" for free agents
- [ ] Player profile page does NOT show "Message Academy" for non-scout roles (academy_admin, platform_admin)
- [ ] Player profile page no longer shows `ContactRequestForm` or "Request Sent" badge
- [ ] Club page shows "Message Academy" button for scouts
- [ ] Clicking "Message Academy" creates/gets conversation and redirects to thread
- [ ] "Message Academy" button shows loading state during API call
- [ ] Rate limit error (10 convos/day) shown to user in translated text
- [ ] Block API endpoint exists at `POST /api/conversations/[conversationId]/block`
- [ ] Block API accepts explicit `{ action: 'block' | 'unblock' }` body
- [ ] Block API validates: academy_admin role, club_id match, existing block state
- [ ] Block button visible in thread header only for academy_admin
- [ ] Block requires confirmation (inline confirm, not modal)
- [ ] Unblock does not require confirmation
- [ ] After blocking: both parties see disabled input with appropriate message
- [ ] After unblocking: both parties can send again
- [ ] Messages API rejects sends from the blocker (not just the blocked party)
- [ ] `/dashboard/requests` redirects to `/dashboard/messages`
- [ ] `/admin/requests` redirects to `/admin/messages`
- [ ] `contact_requests` table preserved, `ContactRequestForm.tsx` kept in codebase
- [ ] Error boundary exists at `/dashboard/messages/[conversationId]/error.tsx`
- [ ] Error boundary exists at `/admin/messages/[conversationId]/error.tsx`
- [ ] Error boundaries show "Try again" + "Back to messages" link
- [ ] Chat thread layout height accounts for DashboardNav/AdminSidebar
- [ ] All new strings bilingual (English + Georgian)
- [ ] `npm run build` passes with zero errors

### Non-Functional Requirements

- [ ] No `any` types
- [ ] All Supabase `.error` checked before using `.data`
- [ ] "Message Academy" button has proper disabled/loading state
- [ ] Block button has proper disabled/loading state
- [ ] Mobile responsive: buttons don't overflow on 375px

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/chat/MessageAcademyButton.tsx` | Client component | "Message Academy" button with API call + redirect |
| `src/app/api/conversations/[conversationId]/block/route.ts` | API route | Block/unblock endpoint for academy admins |
| `src/app/dashboard/messages/[conversationId]/error.tsx` | Error boundary | Thread error UI for scout |
| `src/app/admin/messages/[conversationId]/error.tsx` | Error boundary | Thread error UI for admin |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(platform)/players/[slug]/page.tsx` | Add `id` to club select, fetch user role, replace ContactRequestForm with MessageAcademyButton, remove hasContactRequest check |
| `src/app/(platform)/clubs/[slug]/page.tsx` | Fetch user + role, add MessageAcademyButton in club header |
| `src/components/chat/ChatThread.tsx` | Add block/unblock button in header for academy_admin, fix layout height |
| `src/app/api/messages/route.ts` | Add blocker-side block check to POST handler |
| `src/app/dashboard/requests/page.tsx` | Replace with redirect to `/dashboard/messages` |
| `src/app/admin/requests/page.tsx` | Replace with redirect to `/admin/messages` |
| `src/lib/translations.ts` | Add ~10 new translation keys (block, error boundary, etc.) |

## Build Order (Step-by-Step)

### Phase 1: Translations + Types (~5 min)
1. **Add new translation keys** to `src/lib/translations.ts` — block/unblock, error boundary, loading states

### Phase 2: "Message Academy" Button (~25 min)
2. **Create `MessageAcademyButton`** — `src/components/chat/MessageAcademyButton.tsx`
3. **Modify player profile page** — add `id` to club join, fetch user role, replace ContactRequestForm with MessageAcademyButton
4. **Modify club page** — fetch user + role, add MessageAcademyButton in club header

### Phase 3: Block/Unblock System (~25 min)
5. **Create block API** — `src/app/api/conversations/[conversationId]/block/route.ts`
6. **Update messages API** — add blocker-side block check to POST handler
7. **Add block button to ChatThread header** — inline confirm pattern, role-conditional rendering

### Phase 4: Deprecate Old Pages + Error Boundaries (~10 min)
8. **Redirect request pages** — replace content of both `/dashboard/requests/page.tsx` and `/admin/requests/page.tsx`
9. **Create error boundaries** — both `[conversationId]/error.tsx` files

### Phase 5: Layout Fix (~10 min)
10. **Fix ChatThread layout height** — replace `h-[calc(100vh-64px)]` with flex-based approach

### Phase 6: Verify (~10 min)
11. **`npm run build`** — fix any TypeScript errors
12. **Verify on mobile** — 375px viewport
13. **Update CLAUDE.md checklist** — mark completed items
14. **Commit**

## Dependencies & Prerequisites

- Sessions A-C complete (commits `4930fbe`, `5d11bdf`, `e4916ee`)
- `POST /api/conversations` exists and handles create-or-get-existing
- `conversation_blocks` table with RLS policies (insert/delete for academy admins)
- ChatInput already handles `isBlocked` and `blockedByMe` props
- ChatThread already displays blocked state text
- DashboardNav and AdminSidebar already show "Messages" (not "Requests")

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Club `id` not in player profile query | Button can't function | Add `id` to the club sub-select (minimal query change) |
| User role not available in server component | Can't conditionally render button | Add single `profiles.select('role')` query (lightweight) |
| Block API double-click | Could toggle state back | Explicit `block`/`unblock` action prevents accidental toggle |
| Stale block state in inbox after toggle | Inbox shows wrong indicator | Acceptable — refreshes on next navigation |
| ContactRequestForm still imported elsewhere | Build errors on removal | Only remove import from player profile; keep component file |
| Thread height overflow with DashboardNav | Scrollbar or clipped content | Fix layout to use flex-based height |

## Edge Cases to Handle

1. **Scout messaging a club they already have a conversation with** — API returns existing conversation, button redirects to it (no duplicate)
2. **Academy admin viewing their own club's player** — no "Message Academy" button shown (role !== 'scout')
3. **Platform admin viewing any player** — no "Message Academy" button (role !== 'scout')
4. **Unauthenticated user** — no action buttons shown at all (existing behavior, line 279)
5. **Admin blocks, then another admin tries to unblock** — RLS prevents it (blocked_by must match). Acceptable limitation.
6. **Scout hits 10 conversation/day rate limit from button** — shows translated error, button re-enables
7. **Old request page bookmarked** — redirect preserves the user experience
8. **Empty conversation after redirect** — scout sees the thread with only a "Conversation started" system message and can type

## Sources & References

### Origin

- **Phase 6.5 checklist in CLAUDE.md** — "Message Academy" button, block/unblock, remove old contact request UI
- **Session A plan:** `docs/plans/2026-03-01-feat-chat-system-session-a-database-api-foundation-plan.md` — database, API
- **Session B plan:** `docs/plans/2026-03-01-feat-chat-system-session-b-inbox-ui-plan.md` — inbox, navigation
- **Session C plan:** `docs/plans/2026-03-01-feat-chat-system-session-c-conversation-thread-plan.md` — thread, input, realtime

### Internal References (Patterns to Follow)

| File | Pattern |
|------|---------|
| `src/components/forms/ContactRequestForm.tsx` | Client component with API call + loading state (replacing this) |
| `src/app/api/conversations/route.ts:26` | Scout role check pattern |
| `src/app/api/messages/route.ts:40-49` | Block check pattern (extend this) |
| `src/components/chat/ChatThread.tsx:367-403` | Thread header where block button goes |
| `src/components/chat/ChatInput.tsx` | Blocked state display (already implemented) |
| `src/app/dashboard/error.tsx` | Error boundary pattern |
| `src/app/(platform)/players/[slug]/page.tsx:279-301` | Action buttons section (modify this) |
| `src/app/(platform)/clubs/[slug]/page.tsx:87-113` | Club header section (add button here) |
| `src/lib/chat-queries.ts:47-86` | `fetchConversationById()` — blocked_by_me pattern |
