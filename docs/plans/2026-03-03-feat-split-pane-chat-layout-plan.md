---
title: "feat: Split-Pane Chat Layout"
type: feat
status: completed
date: 2026-03-03
origin: docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md
---

# feat: Split-Pane Chat Layout

## Overview

Transform the chat system from full-page navigation (inbox → separate thread page) into a split-pane layout where the conversation list sidebar and active thread are visible simultaneously — like WhatsApp Web, Messenger, or Telegram desktop. On mobile, a slide-over drawer allows switching conversations without navigating back.

## Problem Statement / Motivation

Currently, opening a conversation takes over the entire page. Scouts/admins must navigate back to the inbox to switch conversations. This feels disconnected for a messaging experience and adds friction when handling multiple conversations — a common scout workflow.

The split-pane layout keeps the conversation list visible while chatting, enabling instant switching and better awareness of new messages across conversations.

## Proposed Solution

Use **Next.js App Router layouts** to render a sidebar alongside the thread content. The layout at `messages/layout.tsx` renders the `ChatSidebar` + `{children}`. The page at `messages/page.tsx` becomes the empty-state placeholder (desktop) / conversation list (mobile). The thread at `messages/[conversationId]/page.tsx` renders in the right panel.

(See brainstorm: `docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md` for approach selection rationale — layout-based was chosen over client-side state and search params.)

## Technical Approach

### Breakpoint

**`lg` (1024px)** for the split-pane breakpoint (both scout and admin).

- Below `lg`: Current full-page navigation (no change), plus mobile drawer
- `lg` and above: Split-pane (sidebar + thread)

Rationale: `md` (768px) was originally considered but doesn't work for admin — AdminSidebar (224px) + ChatSidebar (320px) would leave only ~188px for the thread at 768px. At `lg` (1024px), admin gets: 224 + 320 + ~448px thread. Acceptable.

### Layout Architecture

```
dashboard/messages/
  layout.tsx            → NEW: ChatDrawerProvider + flex container + ChatSidebar + MobileChatDrawer + {children}
  page.tsx              → MODIFY: mobile = heading + ChatInbox; desktop = ChatEmptyState
  [conversationId]/
    page.tsx            → EXISTING: ChatThread (unchanged server data fetching)
    layout.tsx          → MODIFY: simplify, remove -mb-8 hack
    loading.tsx         → EXISTING (unchanged)
    error.tsx           → EXISTING (unchanged)

admin/messages/
  layout.tsx            → NEW: same pattern as scout
  page.tsx              → MODIFY: same pattern as scout
  [conversationId]/
    page.tsx            → EXISTING (unchanged)
    layout.tsx          → MODIFY: same as scout
    loading.tsx         → EXISTING (unchanged)
    error.tsx           → EXISTING (unchanged)
```

### New Components

#### 1. `ChatSidebar` (`src/components/chat/ChatSidebar.tsx`)

Compact sidebar version of the conversation list. Purpose-built for the sidebar context.

```
Props:
  initialConversations: ConversationItem[]
  userId: string
  userRole: 'scout' | 'academy_admin'
  basePath: string
  error?: string | null
```

Key behaviors:
- Fixed width `w-80` (320px), full-height, scrollable
- Active conversation highlighted via `usePathname()` — left accent border + darker background
- Realtime subscription (reuse pattern from ChatInbox: deferred setTimeout, debounced refetch)
- Unique channel name: `sidebar-${userId}` (distinct from ChatInbox's `inbox-updates`)
- Compact conversation cards: avatar (40px), name (truncated), last message preview (single line), timestamp, unread badge
- No heading (h1/description) — the DashboardNav tabs already indicate "Messages"
- Clicking a conversation uses `<Link>` (standard Next.js navigation updates `{children}` in layout)
- Header area: "Conversations" label

#### 2. `MobileChatDrawer` (`src/components/chat/MobileChatDrawer.tsx`)

Slide-over drawer for mobile conversation switching.

```
Props:
  children: React.ReactNode (ChatSidebar instance)
```

Key behaviors:
- Fixed overlay (`fixed inset-0 z-50`), hidden by default
- Controlled by `ChatDrawerContext` (isOpen state)
- Drawer panel: slides in from left (`transform: translateX(-100%)` → `translateX(0)`)
- Dark backdrop (`bg-black/50`), click to dismiss
- CSS transitions (`transition-transform duration-300 ease-in-out`)
- Escape key closes drawer
- Body scroll lock when open (`overflow-hidden` on scroll container)
- Only rendered on mobile (`lg:hidden`)

#### 3. `ChatDrawerProvider` (`src/context/ChatDrawerContext.tsx`)

Minimal context for drawer open/close state. Allows ChatThread to trigger the drawer from within the page.

```
Provides:
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
```

Used by:
- `MobileChatDrawer` — reads `isDrawerOpen` to show/hide
- `ChatThread` — calls `openDrawer()` on hamburger button click

#### 4. `ChatEmptyState` (`src/components/chat/ChatEmptyState.tsx`)

Desktop placeholder when no conversation is selected.

- Centered layout with chat icon/illustration
- "Select a conversation to start messaging" text
- "Browse Players" CTA button (links to `/players`)
- Fully bilingual (t() for all strings)

### Modified Components

#### 5. `ChatThread` (`src/components/chat/ChatThread.tsx`)

Changes:
- **Height**: Change `h-[calc(100dvh-11rem)]` → `h-full` (parent container controls height)
- **Back button**: Hidden on desktop (`lg:hidden`), visible on mobile
- **Hamburger button**: New, visible only on mobile (`lg:hidden`), calls `openDrawer()` from context
- **Header layout (mobile)**: `[hamburger] [avatar] [name] [menu]`
- **Header layout (desktop)**: `[avatar] [name] [menu]` (no back or hamburger)

#### 6. `messages/layout.tsx` (scout — NEW FILE)

Server component. Fetches conversations, renders the split-pane container.

```tsx
// src/app/dashboard/messages/layout.tsx
export default async function MessagesLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { conversations, error } = await fetchConversations(supabase, user.id, 'scout')

  return (
    <ChatDrawerProvider>
      <div className="flex h-[calc(100dvh-12rem)] -mb-8 overflow-hidden rounded-lg border border-border">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-80 shrink-0 flex-col border-r border-border">
          <ChatSidebar
            initialConversations={conversations}
            userId={user.id}
            userRole="scout"
            basePath="/dashboard/messages"
            error={error}
          />
        </div>

        {/* Mobile drawer */}
        <MobileChatDrawer>
          <ChatSidebar
            initialConversations={conversations}
            userId={user.id}
            userRole="scout"
            basePath="/dashboard/messages"
            error={error}
          />
        </MobileChatDrawer>

        {/* Thread pane / empty state */}
        <div className="flex-1 min-w-0 flex flex-col">
          {children}
        </div>
      </div>
    </ChatDrawerProvider>
  )
}
```

Height calculation: `100dvh - 12rem` accounts for:
- Navbar: 4rem (64px)
- DashboardNav tabs: ~3rem (48px + border)
- `py-8` padding: 4rem (64px top + bottom, but `-mb-8` negates bottom)
- `mt-6` margin: 1.5rem (24px)
- Total: ~12rem

Note: Two `ChatSidebar` instances render (desktop + drawer), but they have unique Realtime channel names. Only one is visible at a time. Pragmatic trade-off vs. adding a shared conversation context. Both CSS-hidden instances still mount — accepted cost.

#### 7. `messages/page.tsx` (scout — MODIFY)

Currently renders heading + ChatInbox full page. Changes to:

```tsx
// Desktop (lg+): empty state placeholder (sidebar in layout handles the list)
// Mobile (<lg): heading + conversation list (sidebar in layout is hidden)
```

- Fetches conversations server-side (for mobile view)
- Renders `<ChatInbox>` inside `<div className="lg:hidden">`
- Renders `<ChatEmptyState>` inside `<div className="hidden lg:flex h-full">`

#### 8. `[conversationId]/layout.tsx` (scout — MODIFY)

Current: `<div className="flex-1 overflow-hidden -mb-8">{children}</div>`

Change to: `<div className="flex-1 flex flex-col overflow-hidden">{children}</div>`

Remove `-mb-8` since the parent messages layout now handles the negative margin.

#### 9. Admin messages — MIRROR

`admin/messages/layout.tsx`, `admin/messages/page.tsx`, and `admin/messages/[conversationId]/layout.tsx` follow the same pattern as scout, with:
- `userRole="academy_admin"` and `basePath="/admin/messages"`
- Height offset may differ slightly (admin layout uses sidebar, not tabs) — test and adjust

### Data Flow

```
messages/layout.tsx (server)
  └─ fetchConversations() → passes to ChatSidebar
  └─ {children}:
      ├─ messages/page.tsx (server)
      │   └─ fetchConversations() → passes to ChatInbox (mobile only)
      │   └─ ChatEmptyState (desktop only)
      └─ messages/[id]/page.tsx (server)
          └─ fetchConversationById() + fetchInitialMessages()
          └─ passes to ChatThread
```

Note: `fetchConversations()` is called twice when on the inbox page (layout + page). This is an accepted trade-off — the RPC is fast (~50ms), and avoiding it would require React cache() complexity or a shared context. Only one ChatInbox is visible at a time.

### Realtime Channel Map

With split-pane, these channels may be active simultaneously:

| Channel | Component | Scope | Event |
|---------|-----------|-------|-------|
| `sidebar-{userId}` | ChatSidebar (layout) | Messages in user's conversations | Debounced refetch (1500ms) |
| `inbox-updates` | ChatInbox (page, mobile) | Same scope | Debounced refetch (1500ms) |
| `thread-{conversationId}` | ChatThread | Specific conversation | Message INSERT/UPDATE |
| `dashboard-nav-unread` | DashboardNav | All messages | Debounced unread count (500ms) |

Only `sidebar-*` and `thread-*` are visible on desktop. Only `inbox-updates` and `thread-*` are visible on mobile. The `dashboard-nav-unread` is always active (in parent layout). Total: 3-4 concurrent channels — well within Supabase limits.

### Sidebar Unread Badge Optimization

When a conversation is selected and ChatThread marks messages as read (`PATCH /api/messages/{id}/read`), the sidebar's unread badge for that conversation won't update until the next Realtime refetch (up to 1500ms). This is acceptable for v1 — the user is already looking at the thread. Can add optimistic clearing later if needed.

## Implementation Phases

### Phase 1: Foundation — New Components (no routing changes)

**Files to create:**
- `src/context/ChatDrawerContext.tsx` — drawer state context
- `src/components/chat/ChatSidebar.tsx` — sidebar conversation list
- `src/components/chat/MobileChatDrawer.tsx` — slide-over drawer
- `src/components/chat/ChatEmptyState.tsx` — "no conversation selected" placeholder

**Approach:**
1. Build `ChatDrawerProvider` (simple context, ~20 lines)
2. Build `ChatSidebar` by adapting ChatInbox patterns — reuse the conversation card rendering, add `usePathname()` active highlight, use distinct Realtime channel name
3. Build `MobileChatDrawer` — fixed overlay, CSS transitions, backdrop, Escape key
4. Build `ChatEmptyState` — centered placeholder with i18n
5. Add all new i18n keys to `translations.ts` (en + ka)

**Test:** Components render in isolation, no integration yet.

### Phase 2: Scout Messages Split-Pane

**Files to create/modify:**
- `src/app/dashboard/messages/layout.tsx` — NEW: split-pane layout
- `src/app/dashboard/messages/page.tsx` — MODIFY: mobile list + desktop empty state
- `src/app/dashboard/messages/[conversationId]/layout.tsx` — MODIFY: remove -mb-8

**Approach:**
1. Create `messages/layout.tsx` — flex container with ChatSidebar + MobileChatDrawer + {children}
2. Modify `messages/page.tsx` — responsive rendering (mobile ChatInbox / desktop ChatEmptyState)
3. Modify `[conversationId]/layout.tsx` — simplify wrapper
4. Test desktop: sidebar visible, clicking conversation loads thread in right pane
5. Test mobile: drawer opens from thread, conversation list works
6. Test deep link: `/dashboard/messages/{id}` loads both sidebar + thread
7. Test browser back: from thread URL → messages URL shows empty state (desktop) / list (mobile)

### Phase 3: ChatThread Adaptations

**Files to modify:**
- `src/components/chat/ChatThread.tsx` — height, header buttons

**Approach:**
1. Change height from `h-[calc(100dvh-11rem)]` → `h-full`
2. Add hamburger button in header (mobile only, `lg:hidden`)
3. Hide back button on desktop (`lg:hidden`)
4. Wire hamburger to `openDrawer()` from `ChatDrawerContext`
5. When user selects a conversation from drawer, `MobileChatDrawer` calls `closeDrawer()` automatically (via Link navigation + usePathname change detection)
6. Test: thread fills available height in both split-pane and mobile views

### Phase 4: Admin Messages Split-Pane

**Files to create/modify:**
- `src/app/admin/messages/layout.tsx` — NEW: same pattern as scout
- `src/app/admin/messages/page.tsx` — MODIFY: same pattern as scout
- `src/app/admin/messages/[conversationId]/layout.tsx` — MODIFY: simplify

**Approach:**
1. Mirror scout implementation with admin-specific props
2. Test height calculations (admin layout has sidebar, different offsets)
3. Adjust height offset if needed (admin may need `100dvh - 10rem` due to different nav structure)
4. Test at 1024px: AdminSidebar (224px) + ChatSidebar (320px) + thread (~448px) — verify usability
5. Test block/unblock (admin-only feature) works in split-pane context

### Phase 5: Polish & Edge Cases

**Tasks:**
- Verify keyboard navigation: Tab between sidebar and thread, Escape closes drawer
- Add ARIA landmarks: sidebar gets `role="navigation" aria-label={t('chat.conversationList')}`, thread pane gets `role="region" aria-label={t('chat.messageThread')}`
- Test viewport resize across `lg` breakpoint — sidebar shows/hides smoothly
- Test loading states: conversation switch shows skeleton in right pane while sidebar persists
- Test error boundary: thread error renders in right pane, sidebar stays functional
- Mobile drawer: verify body scroll lock, backdrop dismiss, Escape dismiss
- Run `npm run build` to catch TypeScript errors
- Cross-browser test (Chrome, Firefox, Safari on both desktop and mobile)

## Acceptance Criteria

- [x] **Desktop (lg+):** Conversation list sidebar (320px) visible alongside active thread
- [x] **Desktop:** Clicking a conversation loads thread in right panel, sidebar stays
- [x] **Desktop:** Active conversation highlighted in sidebar (accent border or background)
- [x] **Desktop:** No conversation selected shows centered "Select a conversation" placeholder
- [x] **Desktop:** Back button hidden in thread header
- [x] **Mobile (<lg):** Full-page navigation preserved (inbox page, thread page)
- [x] **Mobile:** Hamburger button in thread header opens slide-over drawer with conversation list
- [x] **Mobile:** Drawer dismissible via backdrop click, Escape key
- [x] **Mobile:** Selecting conversation from drawer navigates to thread and closes drawer
- [x] **Deep linking:** `/dashboard/messages/{id}` loads split-pane with correct conversation
- [x] **Browser back/forward:** Works naturally between conversations and inbox
- [x] **Realtime:** Sidebar conversation list updates when new messages arrive
- [x] **Realtime:** Sidebar unread badges update (within ~2s)
- [x] **Both roles:** Scout and admin message views both have split-pane
- [x] **Admin:** Works with AdminSidebar (224px) present on desktop
- [x] **i18n:** All new strings bilingual (en + ka)
- [x] **Accessibility:** ARIA landmarks on sidebar and thread pane
- [x] **Build:** `npm run build` passes with no TypeScript errors
- [x] **No regressions:** Existing chat features (send message, file upload, player ref, block, read receipts) unchanged

## Success Metrics

- Scouts can switch between conversations without full page navigation (desktop)
- No increase in Supabase Realtime connection errors
- No visual regressions on existing chat features
- Mobile experience remains smooth (drawer animation, no scroll jank)

## Dependencies & Risks

**Dependencies:**
- None — all infrastructure (chat API, Realtime, storage) already exists

**Risks:**
- **Height calculation fragility:** The `calc(100dvh - Xrem)` pattern is sensitive to layout changes. If dashboard/admin layouts change padding/nav, the chat height breaks. Mitigation: document the offset calculation clearly in code comments.
- **Duplicate Realtime subscriptions:** Two ChatSidebar/ChatInbox instances mount (one CSS-hidden). Extra channels are harmless but not ideal. Mitigation: use distinct channel names, monitor in production. Can consolidate with a shared context later.
- **Admin viewport at lg breakpoint:** Thread pane is only ~448px at exactly 1024px. Functional but tight. Mitigation: test thoroughly, consider bumping admin to `xl` if feedback is negative.

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md](docs/brainstorms/2026-03-03-split-pane-chat-brainstorm.md) — Key decisions: layout-based approach, fixed-width sidebar, mobile drawer, applies to both roles.

### Internal References

- Chat inbox component: `src/components/chat/ChatInbox.tsx`
- Chat thread component: `src/components/chat/ChatThread.tsx`
- Scout dashboard layout: `src/app/dashboard/layout.tsx`
- Admin dashboard layout: `src/app/admin/layout.tsx`
- DashboardNav tabs: `src/components/dashboard/DashboardNav.tsx`
- AdminSidebar: `src/components/admin/AdminSidebar.tsx`
- Chat queries: `src/lib/chat-queries.ts`
- Chat utilities: `src/lib/chat-utils.ts`
- Chat types: `src/lib/types.ts`
- Chat UI learnings: `docs/CHAT_UI_LEARNINGS.md`
- Existing chat solutions: `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`

### Key Patterns to Follow

- Realtime subscription: deferred `setTimeout(, 0)` for React StrictMode, debounced refetch (1500ms), cleanup in useEffect return
- Height: always use `100dvh` not `100vh`
- i18n: thread `t` function through utility calls, all strings in both `translations.en` and `translations.ka`
- Active highlight: `usePathname()` to extract conversation ID from URL
- Scroll: `overflow-hidden` on parent containers to prevent bleed
