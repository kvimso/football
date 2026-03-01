---
title: "feat: Chat System Session C — Conversation Thread + Chat Input"
type: feat
status: completed
date: 2026-03-01
origin: Phase 6.5 chat system build (Sessions A + B complete)
---

# Chat System Session C — Conversation Thread + Chat Input

## Overview

Build the conversation thread UI — the core messaging experience. When a scout or admin clicks a conversation in their inbox, they navigate to a thread page showing the full message history with real-time updates, auto-scroll, date dividers, read indicators, file attachments (images inline, docs as downloads), player reference embeds, and a chat input bar supporting text, file upload, and player reference selection.

**Depends on:**
- Session A (commit `4930fbe`) — database, API routes, validation, constants, translations
- Session B (commit `5d11bdf`) — inbox UI, navigation updates, unread badges

**CLAUDE.md checklist items covered:**
- [x] Conversation thread: real-time messages, auto-scroll, date dividers, read indicators
- [x] Chat input: text + file attach + player reference embed
- [x] File attachments: upload, display images inline, docs as downloads
- [x] Player reference: search modal, embedded player card in message

## Problem Statement / Motivation

Sessions A and B built the database layer and inbox. Users can see their conversations but cannot open them — clicking a conversation leads to a 404. The thread view is the core product: scouts and admins need to exchange messages, share files, and reference players in real-time. Without this, the chat system is unusable.

## Proposed Solution

### Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Thread component | **Single shared `ChatThread` component** | Scout and admin thread pages are identical except header content and block capability. One component with role-specific props avoids duplication. |
| Data fetching | **Server component fetches initial data → client `ChatThread` receives as props** | Matches Session B's inbox pattern. Fast first paint, then Realtime takes over. |
| Realtime subscription | **Supabase `postgres_changes` on `messages` table, filtered by `conversation_id`** | Subscribe to INSERT (new messages) and UPDATE (read receipt changes). First Realtime usage in the codebase. |
| Auto-scroll | **Threshold-based (150px from bottom)** | If user is within 150px of bottom, auto-scroll on new message. Otherwise show "N new messages" indicator. |
| Mark-as-read | **On mount when tab visible + visibility change listener** | Uses Page Visibility API to avoid marking messages as read in background tabs. |
| Input behavior | **Textarea: Enter sends, Shift+Enter newline, grows to 4 lines** | Standard chat convention (WhatsApp/Telegram desktop pattern). |
| Optimistic rendering | **Yes, with "sending" state and retry on failure** | Immediate visual feedback. Message appears instantly with pending indicator, rolls back on error. |
| Message timestamps | **Group within 5-minute windows** | Show timestamp on first message of each group. Exact time on hover. |
| File URL storage | **Fix: store storage path, generate signed URLs on demand** | Current `chat-upload` stores signed URLs that expire after 7 days. Must fix to store the path and generate fresh signed URLs in GET /api/messages. |
| Player search | **New minimal API endpoint** | `src/app/api/players/search/route.ts` is in CLAUDE.md structure but doesn't exist. Build a simple endpoint returning `{ id, name, position, club_name, photo_url }`. |
| Multiple admins | **Show sender's `full_name` on each message** | Messages already JOIN `sender:profiles`. Different admins are distinguishable by name. |

### Component Architecture

```
(Server) page.tsx
  └── Fetches conversation metadata + initial messages
  └── Passes to ChatThread (client component)

ChatThread (client component)
├── Props: conversation, initialMessages, userId, userRole, lang
├── State: messages[], isLoading, hasMore, newMessageCount, isBlocked
├── Realtime subscription (INSERT + UPDATE on messages)
├── Auto-scroll logic
├── Mark-as-read on mount
│
├── Thread Header
│   ├── Back button (→ /dashboard/messages or /admin/messages)
│   ├── Other party name (bilingual) + avatar/logo
│   └── Block status indicator (if blocked)
│
├── Message List (scrollable container, ref for scroll position)
│   ├── "Load older" button (if has_more)
│   ├── DateDivider (between date groups)
│   ├── MessageBubble (per message)
│   │   ├── Sent: right-aligned, accent bg, read indicator
│   │   ├── Received: left-aligned, card bg, sender name (multi-admin)
│   │   ├── System: centered, muted, no avatar
│   │   ├── File: inline image preview OR doc download link
│   │   └── PlayerRef: embedded PlayerRefCard
│   └── "N new messages ↓" indicator (when scrolled up)
│
└── ChatInput (bottom bar)
    ├── File attach button → hidden file input → upload → send file message
    ├── Player ref button → PlayerSearchModal → send player_ref message
    ├── Textarea (auto-grow, Enter send, Shift+Enter newline)
    └── Send button (disabled when empty/sending)
```

### ERD: No Schema Changes

No new tables or columns needed. All required schema exists from Session A migration. The only backend changes are:
1. Fix `POST /api/chat-upload` to return `storage_path`
2. Fix `GET /api/messages` to generate signed URLs for file messages
3. New `GET /api/players/search` endpoint

## Technical Approach

### Phase 1: Backend Fixes + Player Search API

#### 1a. Fix signed URL storage in chat-upload

**File: `src/app/api/chat-upload/route.ts`** (line 100-105)

Current behavior: Returns `file_url: signedUrlData.signedUrl` (expires in 7 days).
New behavior: Return `storage_path` (e.g., `{conversationId}/{uuid}.jpg`) and optionally a signed URL for immediate display.

```typescript
// Change response to include storage_path
return NextResponse.json({
  storage_path: storagePath,         // NEW: permanent path for DB storage
  file_url: signedUrlData.signedUrl, // Keep for immediate display
  file_name: file.name,
  file_type: file.type,
  file_size_bytes: file.size,
})
```

The client will store `storage_path` as `file_url` in the message (the field name is misleading but avoids a migration). The GET /api/messages endpoint will generate fresh signed URLs.

#### 1b. Add signed URL generation to GET /api/messages

**File: `src/app/api/messages/route.ts`** (GET handler, line 91-167)

After fetching messages, loop through file-type messages and generate signed URLs:

```typescript
// After fetching messages, enrich file messages with fresh signed URLs
const enriched = await Promise.all(
  trimmed.map(async (msg) => {
    if (msg.message_type === 'file' && msg.file_url && !msg.file_url.startsWith('http')) {
      // file_url contains storage path — generate signed URL
      const { data } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(msg.file_url, 3600) // 1-hour expiry for viewing
      return { ...msg, file_url: data?.signedUrl ?? msg.file_url }
    }
    return msg
  })
)
```

The check `!msg.file_url.startsWith('http')` ensures backward compatibility with any existing messages that already have signed URLs stored.

#### 1c. Player Search API

**New file: `src/app/api/players/search/route.ts`**

Simple autocomplete endpoint. Searches players by name (English and Georgian), returns minimal data for the reference card.

```typescript
// GET /api/players/search?q=query&limit=10
// Auth required (any authenticated user)
// Returns: { players: PlayerSearchResult[] }

interface PlayerSearchResult {
  id: string
  name: string
  name_ka: string | null
  position: string | null
  date_of_birth: string | null
  photo_url: string | null
  club_name: string | null
  club_name_ka: string | null
  slug: string
  platform_id: string | null
}
```

Query: `ilike` on `name` and `name_ka` with `%query%` pattern, limited to 10 results, joined with club name. Player must be `status = 'active'` or `status = 'free_agent'`.

### Phase 2: Utility Functions

#### 2a. Extend `src/lib/chat-utils.ts`

Add these functions:

```typescript
/**
 * Format date divider label: "Today", "Yesterday", "March 1, 2026"
 */
export function formatDateDivider(dateStr: string, lang: Lang): string

/**
 * Group messages by local date for date divider insertion.
 * Returns array of { date: string, messages: Message[] }
 */
export function groupMessagesByDate<T extends { created_at: string }>(messages: T[]): { date: string; messages: T[] }[]

/**
 * Check if two timestamps are within the same N-minute window.
 * Used to collapse timestamps on consecutive messages from the same sender.
 */
export function isSameTimeGroup(a: string, b: string, windowMinutes: number = 5): boolean

/**
 * Format time for message bubble: "2:45 PM"
 */
export function formatBubbleTime(dateStr: string, lang: Lang): string

/**
 * Check if a file_url is a storage path (not a full URL).
 * Storage paths don't start with "http".
 */
export function isStoragePath(url: string): boolean
```

#### 2b. Add server-side conversation fetch for thread page

**File: `src/lib/chat-queries.ts`** — add `fetchConversationById()`

```typescript
/**
 * Fetch a single conversation with metadata for the thread header.
 * Returns conversation + other party info + block status.
 */
export async function fetchConversationById(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  role: 'scout' | 'academy_admin',
): Promise<ConversationDetail | null>

interface ConversationDetail {
  id: string
  scout_id: string
  club_id: string
  club: { id: string; name: string; name_ka: string; logo_url: string | null }
  other_party: { id: string; full_name: string; organization: string | null; role: string }
  is_blocked: boolean
  blocked_by_me: boolean  // Whether current user initiated the block
  created_at: string
}
```

### Phase 3: Chat Thread Component

#### 3a. `src/components/chat/ChatThread.tsx` (client component)

The main thread component. Key responsibilities:
- Render message list with date dividers
- Manage Realtime subscription lifecycle
- Handle auto-scroll behavior
- Mark messages as read on mount
- Pass send handlers to ChatInput

**Props:**

```typescript
interface ChatThreadProps {
  conversation: ConversationDetail
  initialMessages: MessageWithSender[]
  hasMoreInitial: boolean
  userId: string
  userRole: 'scout' | 'academy_admin'
}
```

**State:**

```typescript
const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
const [hasMore, setHasMore] = useState(hasMoreInitial)
const [isLoadingMore, setIsLoadingMore] = useState(false)
const [newMessageCount, setNewMessageCount] = useState(0)
const messagesEndRef = useRef<HTMLDivElement>(null)
const scrollContainerRef = useRef<HTMLDivElement>(null)
const isAtBottomRef = useRef(true)
```

**Realtime subscription (useEffect):**

```typescript
useEffect(() => {
  const supabase = createClient()
  const channel = supabase
    .channel(`thread-${conversation.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversation.id}`,
    }, (payload) => {
      const newMsg = payload.new as MessageRow
      // Don't add if already in state (optimistic)
      // If at bottom, auto-scroll. Otherwise increment newMessageCount.
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversation.id}`,
    }, (payload) => {
      const updated = payload.new as MessageRow
      // Update read_at in local state for read indicators
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [conversation.id])
```

**Auto-scroll logic:**

```typescript
// Track scroll position
const handleScroll = () => {
  const el = scrollContainerRef.current
  if (!el) return
  const threshold = 150
  isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  if (isAtBottomRef.current && newMessageCount > 0) {
    setNewMessageCount(0)
  }
}

// Scroll to bottom helper
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  messagesEndRef.current?.scrollIntoView({ behavior })
  setNewMessageCount(0)
}
```

**Mark-as-read (useEffect):**

```typescript
useEffect(() => {
  const markRead = async () => {
    if (document.visibilityState !== 'visible') return
    await fetch(`/api/messages/${conversation.id}/read`, { method: 'PATCH' })
  }

  markRead()
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') markRead()
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [conversation.id])
```

**Load older messages:**

```typescript
const loadOlder = async () => {
  const oldestId = messages[0]?.id
  if (!oldestId || !hasMore || isLoadingMore) return
  setIsLoadingMore(true)

  const res = await fetch(`/api/messages?conversation_id=${conversation.id}&before=${oldestId}`)
  const data = await res.json()

  // Preserve scroll position
  const el = scrollContainerRef.current
  const prevHeight = el?.scrollHeight ?? 0

  setMessages(prev => [...data.messages.reverse(), ...prev])
  setHasMore(data.has_more)
  setIsLoadingMore(false)

  // Restore scroll position after DOM update
  requestAnimationFrame(() => {
    if (el) el.scrollTop = el.scrollHeight - prevHeight
  })
}
```

**Send message (optimistic):**

```typescript
const sendMessage = async (content: string, type: MessageType = 'text', extras?: Partial<MessageRow>) => {
  // Create optimistic message
  const optimistic: MessageWithSender = {
    id: `temp-${Date.now()}`,
    conversation_id: conversation.id,
    sender_id: userId,
    content,
    message_type: type,
    read_at: null,
    created_at: new Date().toISOString(),
    sender: { id: userId, full_name: 'You', role: userRole },
    _status: 'sending', // local-only field
    ...extras,
  }

  setMessages(prev => [...prev, optimistic])
  scrollToBottom()

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversation.id,
        content: type === 'text' ? content : undefined,
        message_type: type,
        ...extras,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      // Mark optimistic message as failed
      setMessages(prev => prev.map(m =>
        m.id === optimistic.id ? { ...m, _status: 'failed', _error: err.error } : m
      ))
      return
    }

    const { message } = await res.json()
    // Replace optimistic with real message
    setMessages(prev => prev.map(m =>
      m.id === optimistic.id ? { ...message, sender: optimistic.sender, _status: 'sent' } : m
    ))
  } catch {
    setMessages(prev => prev.map(m =>
      m.id === optimistic.id ? { ...m, _status: 'failed' } : m
    ))
  }
}
```

#### 3b. `src/components/chat/MessageBubble.tsx`

Individual message rendering. Handles four message types differently:

```typescript
interface MessageBubbleProps {
  message: MessageWithSender
  isMine: boolean
  showSenderName: boolean  // true when previous message is from different sender
  showTimestamp: boolean   // true when outside 5-min window of previous message
  lang: Lang
}
```

**Rendering by type:**

| Type | Mine (right-aligned) | Theirs (left-aligned) |
|------|---------------------|----------------------|
| `text` | `bg-accent text-white` bubble with content | `bg-background-secondary text-foreground` bubble with content + sender name |
| `file` (image) | Accent-bordered inline image thumbnail (max 300px wide) + file name | Same styling as received text but with image |
| `file` (doc) | Accent-bordered download link with file icon + file name + size | Same as received |
| `player_ref` | Embedded `PlayerRefCard` with accent border | Embedded `PlayerRefCard` |
| `system` | Centered, `text-foreground-muted`, small text, no bubble | Same (always centered) |

**Read indicators (mine only):**
- `_status === 'sending'` → spinning indicator
- `_status === 'failed'` → red exclamation + "Failed to send" + retry button
- `_status === 'sent'` and `read_at === null` → single check (delivered)
- `read_at !== null` → double check (read) with optional "Read at {time}" on hover

**Timestamp:** When `showTimestamp` is true, show small muted time above the bubble.

#### 3c. `src/components/chat/DateDivider.tsx`

Simple centered divider between date groups:

```typescript
interface DateDividerProps {
  date: string // ISO date string
  lang: Lang
}

// Renders: ——— Today ———  or  ——— March 1 ———
// Uses formatDateDivider from chat-utils.ts
// Styling: flex items-center, text-foreground-muted text-xs, border lines on sides
```

#### 3d. `src/components/chat/PlayerRefCard.tsx`

Embedded player card displayed inline in messages with `message_type === 'player_ref'`.

```typescript
interface PlayerRefCardProps {
  playerId: string | null
  lang: Lang
}
```

**Behavior:**
- Fetches player data from `GET /api/players/search?id={playerId}` (or a dedicated endpoint)
- Shows: player name, position badge, club name, photo thumbnail
- Links to `/players/{slug}` on click
- If `playerId` is null (deleted player): shows "Player no longer available" placeholder
- Caches fetched player data in a React context or local state to avoid re-fetching for duplicates

**Alternative simpler approach:** Instead of fetching per-card, extend `GET /api/messages` to JOIN player data for `player_ref` messages:

```sql
-- In messages query, add:
referenced_player:players!messages_referenced_player_id_fkey (
  id, name, name_ka, position, photo_url, slug,
  club:clubs!players_club_id_fkey ( name, name_ka )
)
```

This avoids N+1 queries. The JOIN already exists as a foreign key. **Recommended approach.**

### Phase 4: Chat Input Component

#### 4a. `src/components/chat/ChatInput.tsx`

```typescript
interface ChatInputProps {
  onSendText: (content: string) => Promise<void>
  onSendFile: (file: File) => Promise<void>
  onSendPlayerRef: (playerId: string) => Promise<void>
  isBlocked: boolean
  lang: Lang
}
```

**Layout:** Fixed at bottom of thread container. Three sections in a row:
1. **Attach button** (paperclip icon) — opens hidden file input
2. **Textarea** — auto-growing (1–4 lines), placeholder "Type a message..."
3. **Player ref button** (user icon) — opens search modal
4. **Send button** (arrow icon) — disabled when textarea empty or sending

**Keyboard behavior:**
- `Enter` → send message (if not empty)
- `Shift+Enter` → insert newline
- Textarea grows to max 4 lines, then scrolls internally

**Blocked state:** All inputs disabled, show banner: "This conversation has been closed by the academy" (for scouts) or "You blocked this scout. Unblock to continue." (for admins who blocked)

**File upload flow:**
1. User clicks attach → hidden `<input type="file">` opens
2. Validate file type and size client-side (using constants)
3. Show upload progress (use XHR or fetch with a loading state)
4. On success: call `onSendFile` which creates a file message
5. On error: show toast/inline error

```typescript
const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Client-side validation
  if (file.size > CHAT_LIMITS.MAX_FILE_SIZE_BYTES) {
    setError(t('errors.fileTooLarge'))
    return
  }
  if (!ALLOWED_CHAT_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
    setError(t('errors.fileTypeNotAllowed'))
    return
  }

  setIsUploading(true)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('conversation_id', conversationId)

  const res = await fetch('/api/chat-upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json()
    setError(t(err.error))
    setIsUploading(false)
    return
  }

  const { storage_path, file_name, file_type, file_size_bytes } = await res.json()
  await onSendFile({ storage_path, file_name, file_type, file_size_bytes })
  setIsUploading(false)
}
```

#### 4b. `src/components/chat/PlayerSearchModal.tsx`

Modal for searching and selecting a player to reference.

```typescript
interface PlayerSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (player: PlayerSearchResult) => void
  lang: Lang
}
```

**Behavior:**
- Text input with debounced search (300ms)
- Calls `GET /api/players/search?q={query}&limit=10`
- Shows results as mini cards: photo, name (bilingual), position, club
- Click selects player → calls `onSelect` → closes modal
- Empty state: "Search for a player to share"
- Uses existing `useDebounce` hook from `src/hooks/useDebounce.ts`

### Phase 5: Thread Page Routes

#### 5a. Scout thread page

**File: `src/app/dashboard/messages/[conversationId]/page.tsx`** (server component)

```typescript
export default async function ScoutConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch conversation metadata
  const conversation = await fetchConversationById(supabase, conversationId, user.id, 'scout')
  if (!conversation) notFound()

  // Fetch initial messages
  const { messages, has_more } = await fetchInitialMessages(supabase, conversationId)

  return <ChatThread
    conversation={conversation}
    initialMessages={messages}
    hasMoreInitial={has_more}
    userId={user.id}
    userRole="scout"
  />
}
```

#### 5b. Admin thread page

**File: `src/app/admin/messages/[conversationId]/page.tsx`** (server component)

Same pattern as scout, but uses `getAdminContext()` for auth and passes `userRole="academy_admin"`.

#### 5c. Loading skeletons

Both `[conversationId]/loading.tsx` files:
- Thread header skeleton (back button + name placeholder)
- Message list skeleton (alternating left/right bubbles with `animate-pulse`)
- Input bar skeleton (fixed bottom bar placeholder)

### Phase 6: Translations

**New translation keys needed (both en + ka):**

```typescript
// Thread UI
'chat.loadOlder': { en: 'Load older messages', ka: 'ძველი შეტყობინებების ჩატვირთვა' },
'chat.newMessages': { en: '{count} new messages', ka: '{count} ახალი შეტყობინება' },
'chat.scrollToBottom': { en: 'Scroll to bottom', ka: 'ბოლოში გადასვლა' },
'chat.today': { en: 'Today', ka: 'დღეს' },
'chat.sending': { en: 'Sending...', ka: 'იგზავნება...' },
'chat.failedToSend': { en: 'Failed to send', ka: 'გაგზავნა ვერ მოხერხდა' },
'chat.retry': { en: 'Retry', ka: 'თავიდან ცდა' },
'chat.read': { en: 'Read', ka: 'წაკითხული' },
'chat.delivered': { en: 'Delivered', ka: 'მიწოდებული' },
'chat.conversationNotFound': { en: 'Conversation not found', ka: 'საუბარი ვერ მოიძებნა' },
'chat.blockedByYou': { en: 'You blocked this scout. Unblock to continue.', ka: 'თქვენ დაბლოკეთ ეს სკაუტი. განბლოკეთ გასაგრძელებლად.' },
'chat.searchPlayers': { en: 'Search players...', ka: 'მოთამაშეების ძიება...' },
'chat.searchPlayersHint': { en: 'Search for a player to share', ka: 'მოძებნეთ მოთამაშე გასაზიარებლად' },
'chat.playerNotAvailable': { en: 'Player no longer available', ka: 'მოთამაშე აღარ არის ხელმისაწვდომი' },
'chat.uploadingFile': { en: 'Uploading file...', ka: 'ფაილი იტვირთება...' },
'chat.downloadFile': { en: 'Download', ka: 'ჩამოტვირთვა' },
'chat.fileSize': { en: '{size}', ka: '{size}' },

// Errors (some exist from Session A, these are new)
'errors.conversationNotFound': { en: 'Conversation not found', ka: 'საუბარი ვერ მოიძებნა' },
'errors.messageTooLong': { en: 'Message is too long (max 5000 characters)', ka: 'შეტყობინება ძალიან გრძელია (მაქს. 5000 სიმბოლო)' },
```

## System-Wide Impact

### Interaction Graph

- User opens thread page → server component fetches conversation + messages → passes to client `ChatThread`
- `ChatThread` mounts → subscribes to Supabase Realtime `postgres_changes` on `messages` table → calls `PATCH /api/messages/{id}/read` to mark unread messages as read
- User sends message → optimistic add to local state → `POST /api/messages` → DB insert → trigger `on_message_insert_update_conversation` updates `conversations.last_message_at` → Realtime broadcasts INSERT to all subscribers → other user's ChatThread receives and renders new message
- Other user opens thread → calls `PATCH /api/messages/{id}/read` → `mark_messages_read()` SECURITY DEFINER function updates `read_at` → Realtime broadcasts UPDATE → first user's ChatThread updates read indicators
- File upload: `POST /api/chat-upload` → upload to storage → return `storage_path` → `POST /api/messages` with `message_type: 'file'` → same INSERT broadcast chain
- Player reference: `GET /api/players/search` → user selects player → `POST /api/messages` with `message_type: 'player_ref'` → same INSERT broadcast chain

### Error Propagation

- `GET /api/messages` errors → ChatThread shows error state with retry button
- `POST /api/messages` errors → optimistic message marked as "failed" with retry
- `POST /api/chat-upload` errors → inline error in ChatInput, file not sent
- Rate limit (429) → user-friendly message: "You're sending too many messages"
- Block (403) → input disabled, banner shown
- Conversation not found (404 from server) → `notFound()` → Next.js 404 page
- Realtime subscription failure → messages still work via optimistic rendering, just no live updates from other party. Could add a polling fallback but not in scope.

### State Lifecycle Risks

- **Optimistic message dedup**: When the user sends a message optimistically and Realtime also delivers the INSERT, the message could appear twice. Mitigation: check if message ID already exists before adding from Realtime. Optimistic messages use temp IDs (`temp-{timestamp}`), real messages have UUIDs. When the API response comes back, replace the temp ID with the real one. If Realtime arrives before the API response, match by `content + sender_id + created_at` proximity (within 5 seconds).
- **Stale inbox after thread interaction**: After marking messages as read in the thread, navigating back to the inbox will show stale unread counts (the server component data is cached). Mitigation: Use `router.refresh()` on the inbox page, or better — Session B deferred Realtime subscriptions for the inbox to Session C. For now, `router.refresh()` on back navigation is sufficient.
- **Scroll position on "Load older"**: Prepending messages to the top of the list shifts the scroll position. Must measure `scrollHeight` before and after DOM update, then adjust `scrollTop`. Use `requestAnimationFrame` for timing.

### API Surface Parity

- New endpoint: `GET /api/players/search` — new API, no existing equivalent
- Modified endpoint: `GET /api/messages` — adds signed URL generation for file messages (backward compatible)
- Modified endpoint: `POST /api/chat-upload` — adds `storage_path` to response (backward compatible, existing `file_url` field still returned)

## Acceptance Criteria

### Functional Requirements

- [ ] Scout thread page exists at `/dashboard/messages/[conversationId]` and renders message history
- [ ] Admin thread page exists at `/admin/messages/[conversationId]` and renders message history
- [ ] Invalid/unauthorized conversation IDs show appropriate error (404 or redirect)
- [ ] Thread header shows other party name (bilingual: club name for scouts, scout name for admins)
- [ ] Thread header has back button that navigates to the inbox
- [ ] Messages display in chronological order (oldest at top, newest at bottom)
- [ ] Date dividers appear between messages on different days ("Today", "Yesterday", "March 1")
- [ ] Message timestamps shown on first message of each 5-minute group
- [ ] Sent messages (mine) are right-aligned with accent background
- [ ] Received messages are left-aligned with secondary background
- [ ] System messages are centered with muted styling
- [ ] Sender name shown on received messages (supports multiple admins per club)
- [ ] New messages from the other party appear in real-time via Supabase Realtime (no refresh needed)
- [ ] Auto-scroll to new messages when user is at/near bottom (150px threshold)
- [ ] "N new messages" indicator shown when scrolled up and new messages arrive; clicking scrolls to bottom
- [ ] Unread messages marked as read when thread opens (only when tab is visible)
- [ ] Read indicators on sent messages: "Sending..." → delivered (single check) → read (double check)
- [ ] Read indicator updates in real-time when the other party reads the message
- [ ] "Load older messages" button at top when more messages exist; scroll position preserved after loading
- [ ] Text input: Enter sends, Shift+Enter inserts newline, textarea grows to 4 lines max
- [ ] Send button disabled when input is empty or message is sending
- [ ] Message character limit enforced (5000 chars, counter shown at 4500+)
- [ ] Optimistic rendering: sent message appears instantly with "sending" state
- [ ] Failed messages show error state with retry button
- [ ] File attach button: opens file picker, validates type/size client-side
- [ ] File upload: uploads via `/api/chat-upload`, stores storage path (not signed URL)
- [ ] Image files display inline in message (max-width 300px, clickable for full size)
- [ ] Document files display as download link with file name and size
- [ ] `GET /api/messages` generates fresh signed URLs for file messages (no 7-day expiry issue)
- [ ] Player reference button: opens search modal
- [ ] Player search modal: debounced search, shows player mini cards
- [ ] Player reference messages display embedded player card with name, position, club, photo
- [ ] Player reference card links to player profile page
- [ ] Deleted players (`referenced_player_id = null`) show "Player no longer available"
- [ ] `GET /api/players/search` endpoint exists and returns player results
- [ ] Blocked conversations: input disabled, banner shown with appropriate message
- [ ] Loading skeleton for thread page (header, message bubbles, input bar)
- [ ] Error state with retry for message loading failures
- [ ] All new strings bilingual (English + Georgian)
- [ ] `npm run build` passes with zero errors

### Non-Functional Requirements

- [ ] No `any` types — proper TypeScript throughout
- [ ] All Supabase `.error` checked before using `.data`
- [ ] Realtime subscription cleaned up on component unmount (no memory leaks)
- [ ] Mobile responsive: full-screen thread at 375px+, input fixed at bottom with safe area
- [ ] Message list scrollable with overflow, input bar stays fixed
- [ ] Image thumbnails lazy-loaded
- [ ] Follows existing component patterns: `useLang()` for i18n, `useAuth()` for user context

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/dashboard/messages/[conversationId]/page.tsx` | Server component | Scout thread page |
| `src/app/dashboard/messages/[conversationId]/loading.tsx` | Component | Loading skeleton |
| `src/app/admin/messages/[conversationId]/page.tsx` | Server component | Admin thread page |
| `src/app/admin/messages/[conversationId]/loading.tsx` | Component | Loading skeleton |
| `src/components/chat/ChatThread.tsx` | Client component | Main thread UI with Realtime |
| `src/components/chat/MessageBubble.tsx` | Client component | Individual message rendering |
| `src/components/chat/ChatInput.tsx` | Client component | Input bar with text/file/player ref |
| `src/components/chat/DateDivider.tsx` | Component | Date separator between message groups |
| `src/components/chat/PlayerRefCard.tsx` | Component | Embedded player card in messages |
| `src/components/chat/PlayerSearchModal.tsx` | Client component | Player search + select modal |
| `src/app/api/players/search/route.ts` | API route | Player search endpoint for autocomplete |
| `src/hooks/useMessages.ts` | Hook | *(Optional)* Extract Realtime + message state from ChatThread |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/api/chat-upload/route.ts` | Return `storage_path` in response |
| `src/app/api/messages/route.ts` | Generate signed URLs for file messages in GET; JOIN player data for player_ref messages |
| `src/lib/chat-utils.ts` | Add `formatDateDivider()`, `groupMessagesByDate()`, `isSameTimeGroup()`, `formatBubbleTime()`, `isStoragePath()` |
| `src/lib/chat-queries.ts` | Add `fetchConversationById()` for thread page server fetch |
| `src/lib/translations.ts` | Add ~20 thread-specific translation keys (en + ka) |
| `src/lib/types.ts` | Add `MessageWithSender`, `ConversationDetail`, `PlayerSearchResult` types |

## Build Order (Step-by-Step)

### Phase 1: Backend (~30 min)
1. **Fix `chat-upload` API** — add `storage_path` to response
2. **Fix `messages` GET API** — generate signed URLs for file messages, JOIN referenced player data
3. **Create player search API** — `src/app/api/players/search/route.ts`
4. **Add `fetchConversationById()`** to `src/lib/chat-queries.ts`
5. **Add types** to `src/lib/types.ts` — `MessageWithSender`, `ConversationDetail`, `PlayerSearchResult`

### Phase 2: Utilities + Translations (~15 min)
6. **Extend `chat-utils.ts`** — date divider, time group, bubble time functions
7. **Add translations** — all new keys in both en + ka

### Phase 3: Core Thread Components (~60 min)
8. **`DateDivider`** component
9. **`MessageBubble`** component (all 4 message types + read indicators + retry)
10. **`PlayerRefCard`** component (embedded player card)
11. **`ChatThread`** component (message list, Realtime subscription, auto-scroll, mark-read, load older)

### Phase 4: Input Components (~45 min)
12. **`ChatInput`** component (textarea, send button, blocked state)
13. **File upload flow** in ChatInput (attach button, upload progress, error handling)
14. **`PlayerSearchModal`** component (debounced search, result list, selection)
15. **Wire player ref button** in ChatInput to PlayerSearchModal

### Phase 5: Page Routes (~20 min)
16. **Scout thread page** — `src/app/dashboard/messages/[conversationId]/page.tsx`
17. **Admin thread page** — `src/app/admin/messages/[conversationId]/page.tsx`
18. **Loading skeletons** for both routes

### Phase 6: Verify (~15 min)
19. **`npm run build`** — fix any TypeScript errors
20. **Manual test** — open conversation from inbox, send messages, verify Realtime
21. **Check mobile responsive** — 375px viewport
22. **Commit**

## Dependencies & Prerequisites

- Session A complete (commit `4930fbe`) — database tables, API routes, Realtime enabled
- Session B complete (commit `5d11bdf`) — inbox UI, navigation, unread badges
- `useDebounce` hook exists at `src/hooks/useDebounce.ts`
- `createClient()` browser client at `src/lib/supabase/client.ts`
- Supabase Realtime publication includes `messages` and `conversations` tables
- `mark_messages_read()` RPC function exists
- `chat-attachments` Storage bucket exists with RLS

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Realtime message dedup (optimistic + Realtime both add) | Double messages | Check if message ID exists before adding from Realtime; use temp IDs for optimistic |
| Scroll position jump on "Load older" | Disorienting UX | Measure scrollHeight before/after, adjust scrollTop with requestAnimationFrame |
| File signed URL expiry (existing messages) | Broken images | Backward-compatible check: if `file_url` starts with "http", keep as-is (legacy). New messages store path. |
| N+1 for player ref cards | Slow thread with many refs | JOIN player data in messages GET query (single query) |
| Large message history (500+ messages) | Slow initial load | Cursor-based pagination already implemented. Initial load is 50 messages. |
| Realtime subscription failure | No live updates | Optimistic rendering for sent messages still works. Other party's messages require reload. No polling fallback in Session C. |
| Multiple admins reading same thread | Confusing read receipts | `mark_messages_read` marks by `sender_id != auth.uid()`. Any admin marking read clears all scout messages. Acceptable — admins share the conversation. |

## Edge Cases to Handle

1. **Empty conversation** (only system message) — show system message + hint text in ChatInput
2. **Conversation not found** (invalid UUID or unauthorized) — `notFound()` in server component
3. **Non-UUID in URL** — validate format before querying, show 404
4. **Deleted sender** (`sender_id = null` due to `ON DELETE SET NULL`) — show "Deleted user" in bubble
5. **Deleted referenced player** (`referenced_player_id = null`) — show "Player no longer available"
6. **File message with legacy signed URL** (already expired) — show "File unavailable" placeholder
7. **Rate limit hit while sending** — show specific 429 error, don't remove optimistic message
8. **Block while typing** — if admin blocks mid-conversation, scout's next send attempt returns 403 → show blocked state
9. **Character limit** — show counter at 4500+, disable send at 5000
10. **Concurrent messages** — two messages from different parties at the same millisecond — ordered by `id` (UUID) as tiebreaker

## Future Considerations

- **Typing indicators** — not in Session C scope, could use Realtime presence
- **Message reactions** — not planned, would require schema change
- **Message editing** — `deleted_at` soft-delete exists, editing would need an `edited_at` field
- **Push notifications** — Phase 8 (email notifications)
- **Inbox Realtime** — inbox page doesn't have Realtime subscriptions yet; navigating back shows stale data until refresh. Could add in a future session.
- **Block/unblock UI** — block status is displayed in Session C, but the block/unblock toggle buttons are a separate CLAUDE.md item
- **"Message Academy" button** — separate CLAUDE.md item, will link to `POST /api/conversations` then navigate to thread

## Sources & References

### Origin

- **Phase 6.5 checklist in CLAUDE.md** — conversation thread, chat input, file attachments, player reference items
- **Session A plan:** `docs/plans/2026-03-01-feat-chat-system-session-a-database-api-foundation-plan.md` — database, API, Realtime foundation
- **Session B plan:** `docs/plans/2026-03-01-feat-chat-system-session-b-inbox-ui-plan.md` — inbox UI, navigation, unread badges

### Internal References (Patterns to Follow)

| File | Lines | Pattern |
|------|-------|---------|
| `src/components/chat/ChatInbox.tsx` | 1-193 | Client component with server data props, CSS classes, error/empty states |
| `src/app/api/messages/route.ts` | 91-167 | Messages GET: cursor pagination, sender JOIN, response shape |
| `src/app/api/messages/route.ts` | 7-89 | Messages POST: validation, rate limit, block check |
| `src/app/api/messages/[conversationId]/read/route.ts` | 5-47 | Mark-read: UUID validation, RPC call |
| `src/app/api/chat-upload/route.ts` | 1-106 | File upload: multipart, validation, storage upload, signed URL |
| `src/lib/chat-queries.ts` | 1-86 | Server-side conversation fetch pattern |
| `src/lib/chat-utils.ts` | 1-43 | `formatMessageTime`, `truncateMessage` |
| `src/lib/supabase/client.ts` | 1-13 | Browser Supabase client for Realtime |
| `src/hooks/useDebounce.ts` | — | Debounce hook for player search |
| `src/lib/constants.ts` | 43-61 | `CHAT_LIMITS`, `ALLOWED_CHAT_FILE_*` |
| `src/lib/validations.ts` | 56-73 | `sendMessageSchema` shape |
| `src/lib/types.ts` | 6 | `MessageType` enum |
| `src/app/globals.css` | 4-24 | Color variables (`--accent`, `--background-secondary`, `--foreground-muted`) |
| `src/app/globals.css` | 72-91 | `.btn-primary` class |
| `src/app/globals.css` | 128-144 | `.input` class |
| `src/app/dashboard/messages/loading.tsx` | 1-22 | Loading skeleton pattern |
| `src/app/dashboard/error.tsx` | 1-46 | Error boundary pattern |
| `src/context/AuthContext.tsx` | 7-26 | `useAuth()` hook shape |
| `supabase/migrations/20250101000027_create_chat_system.sql` | 229-230 | Realtime publication setup |
| `supabase/migrations/20250101000027_create_chat_system.sql` | 181-194 | `mark_messages_read` RPC |
