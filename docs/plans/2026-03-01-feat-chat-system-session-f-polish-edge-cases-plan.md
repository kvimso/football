---
title: "feat: Chat System Session F — Polish + Edge Cases"
type: feat
status: completed
date: 2026-03-01
origin: Chat-system-build.md (Session F section)
---

# Chat System Session F — Polish + Edge Cases

## Overview

Session F is the final polish pass for Phase 6.5. The chat system is fully functional (Sessions A-E). This session adds reliability indicators, UX improvements, accessibility, and visual polish across four categories.

**Depends on:**
- Sessions A-E complete (all Phase 6.5 checklist items done)
- Current branch: `feat/chat-system`

## Problem Statement / Motivation

The chat system works but lacks polish that professional messaging apps provide: no connection status feedback when Realtime drops, URLs in messages aren't clickable, no paste-to-upload for images, inbox doesn't update in realtime, accessibility is incomplete (missing aria-labels, keyboard nav), and visual refinements like emoji enlargement and unread separators are absent.

## Proposed Solution

Implement 9 focused improvements across 4 categories, scoped to what's achievable in one session. Typing indicator, notification sounds, browser notifications, message search, and draft messages are explicitly out of scope (require significant backend changes or new infrastructure).

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Reconnecting banner scope | **ChatThread only** | Navbar silently retries. Thread is where connection matters most. |
| Input during disconnect | **Allow sending, fail individually** | Existing retry mechanism handles failures. Disabling input feels unresponsive. |
| Connection health indicator | **Banner IS the indicator** (3 states) | No separate dot. Yellow = reconnecting, red = disconnected, hidden = connected. |
| Realtime inbox updates | **Re-fetch via GET `/api/conversations`** on Realtime event | Simpler than patching state. Debounced at 1.5s. Subscribe to both `messages` and `conversations` tables. |
| URL auto-linking | **`https?://` only** | Bare domains (`www.example.com`) have false-positive risk. Only protocol-prefixed URLs. |
| URL security | **`rel="noopener noreferrer" target="_blank"`** | Standard. Reject `javascript:` protocol URLs. |
| Paste-to-upload | **Preview with cancel before upload** | Prevents accidental sends (no message deletion exists). |
| Pasted image filename | **`pasted-image-{timestamp}.png`** | Ensures the upload route's extension validation passes. |
| Emoji-only threshold | **1-6 emoji, whitespace allowed, no text** | Beyond 6 gets awkwardly large. |
| Emoji-only font size | **`text-2xl` (24px)** vs normal `text-sm` (14px) | Noticeable but not excessive. |
| Unread separator vs markRead() | **Compute `firstUnreadId` from initial data, store in ref, render separator based on ref** | `markRead()` fires on mount but the ref preserves the initial unread position. Separator is visual-only — doesn't re-compute after read. |
| Unread separator text | **"New messages" / "ახალი შეტყობინებები"** | With i18n. Thin line with centered text. |
| Error auto-dismiss | **5 seconds fixed, timer resets on new error, manual dismiss via X button** | Simple, predictable. |
| aria-live for messages | **`aria-live="polite"`**, incoming only, truncated | Only other party's messages. Format: "[name]: [first 100 chars]". Avoids overwhelming screen readers. |
| Escape key in modals | **Yes** | Standard behavior. Focus returns to trigger button. |
| Animations | **CSS transitions only** | `transition-all duration-200 ease-out` on error banners, message entrance (opacity + translateY). No JS animation libraries. |

## Technical Approach

### Phase 1: Reliability (~30 min)

#### 1a. Reconnecting Banner in ChatThread

**File:** `src/components/chat/ChatThread.tsx`

Add connection status monitoring to the existing Realtime subscription:

```typescript
// State
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected')

// In the subscription setup (existing useEffect ~line 140)
const channel = supabase
  .channel(`thread-${conversationId}`)
  .on('postgres_changes', { ... }, handleNewMessage)
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') setConnectionStatus('connected')
    else if (status === 'CHANNEL_ERROR') setConnectionStatus('reconnecting')
    else if (status === 'TIMED_OUT') setConnectionStatus('disconnected')
    else if (status === 'CLOSED') setConnectionStatus('disconnected')
  })
```

Banner UI (render above the message container, below the header):

```tsx
{connectionStatus !== 'connected' && (
  <div className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium ${
    connectionStatus === 'reconnecting'
      ? 'bg-yellow-500/10 text-yellow-400'
      : 'bg-red-500/10 text-red-400'
  }`}>
    <span className="h-2 w-2 rounded-full animate-pulse bg-current" />
    {connectionStatus === 'reconnecting' ? t('chat.reconnecting') : t('chat.connectionLost')}
  </div>
)}
```

#### 1b. Error Auto-Dismiss in ChatInput

**File:** `src/components/chat/ChatInput.tsx`

Add auto-dismiss timer + dismiss button:

```typescript
// After setError(message):
useEffect(() => {
  if (!error) return
  const timer = setTimeout(() => setError(null), 5000)
  return () => clearTimeout(timer)
}, [error])
```

Add X button to error banner (existing ~line 150):

```tsx
{error && (
  <div className="flex items-center justify-between gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
    <span>{t(error) || error}</span>
    <button onClick={() => setError(null)} className="shrink-0 hover:text-red-300" aria-label={t('common.dismiss')}>
      <XIcon className="h-3.5 w-3.5" />
    </button>
  </div>
)}
```

### Phase 2: UX Improvements (~45 min)

#### 2a. Auto-Link URLs in Messages

**New utility:** `src/lib/chat-utils.ts` — add `linkifyMessage()` function

```typescript
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi

export function linkifyMessage(content: string): (string | { type: 'link'; url: string })[] {
  const parts: (string | { type: 'link'; url: string })[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = URL_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    // Strip trailing punctuation that's likely not part of the URL
    let url = match[0]
    while (/[.,;:!?)}\]>]$/.test(url)) url = url.slice(0, -1)
    parts.push({ type: 'link', url })
    lastIndex = match.index + url.length
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex))
  URL_REGEX.lastIndex = 0
  return parts
}
```

**File:** `src/components/chat/MessageBubble.tsx` — replace plain text rendering

```tsx
// Before (line ~72):
<p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>

// After:
<p className="whitespace-pre-wrap break-words text-sm">
  {linkifyMessage(message.content).map((part, i) =>
    typeof part === 'string' ? part : (
      <a
        key={i}
        href={part.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80"
      >
        {part.url}
      </a>
    )
  )}
</p>
```

Security: The regex only matches `https?://` — `javascript:` is never matched. Links use `rel="noopener noreferrer"`.

#### 2b. Paste-to-Upload Images

**File:** `src/components/chat/ChatInput.tsx`

Add paste event handler to the textarea:

```typescript
// New state
const [pastedPreview, setPastedPreview] = useState<{ file: File; previewUrl: string } | null>(null)

const handlePaste = (e: React.ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) return

      // Check size client-side
      if (file.size > CHAT_LIMITS.MAX_FILE_SIZE_BYTES) {
        setError(t('errors.fileTooLarge'))
        return
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      // Generate proper filename for validation
      const ext = file.type.split('/')[1] || 'png'
      const namedFile = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type })
      setPastedPreview({ file: namedFile, previewUrl })
      return
    }
  }
  // If no image items, let normal text paste proceed
}
```

Preview UI (render above the input bar):

```tsx
{pastedPreview && (
  <div className="flex items-center gap-3 border-b border-border bg-background-secondary px-3 py-2">
    <img
      src={pastedPreview.previewUrl}
      alt={t('chat.pastedImage')}
      className="h-16 w-16 rounded-lg object-cover"
    />
    <div className="flex-1 text-xs text-muted">{t('chat.pastedImageReady')}</div>
    <button
      onClick={() => {
        URL.revokeObjectURL(pastedPreview.previewUrl)
        setPastedPreview(null)
      }}
      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
    >
      {t('common.cancel')}
    </button>
    <button
      onClick={() => handleSendPastedImage()}
      className="rounded bg-accent px-3 py-1 text-xs text-white hover:bg-accent/90"
    >
      {t('common.send')}
    </button>
  </div>
)}
```

`handleSendPastedImage()` reuses existing file upload logic: calls `POST /api/chat-upload` with the file, then sends a file message.

Cleanup: Revoke object URL when component unmounts or preview is dismissed.

#### 2c. Realtime Inbox Updates

**File:** `src/components/chat/ChatInbox.tsx`

Add Realtime subscription that triggers a re-fetch:

```typescript
// New state for client-side conversation data
const [liveConversations, setLiveConversations] = useState(conversations)

useEffect(() => {
  setLiveConversations(conversations) // Sync with server-side props
}, [conversations])

useEffect(() => {
  const supabase = createClient()
  let debounceTimer: NodeJS.Timeout

  const refetchConversations = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setLiveConversations(data.conversations)
      }
    }, 1500)
  }

  const channel = supabase
    .channel('inbox-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
    }, refetchConversations)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'conversations',
    }, refetchConversations)
    .subscribe()

  return () => {
    clearTimeout(debounceTimer)
    supabase.removeChannel(channel)
  }
}, [])
```

Then render `liveConversations` instead of `conversations` in the JSX.

**Note:** This subscribes to all `messages` events (not filtered by conversation_id) because the inbox shows all conversations. The 1.5s debounce prevents hammering the API.

### Phase 3: Accessibility (~30 min)

#### 3a. aria-labels on Icon Buttons

**Files:** `ChatInput.tsx`, `ChatThread.tsx`, `MessageBubble.tsx`, `PlayerSearchModal.tsx`

Add `aria-label={t('aria.xxx')}` to every icon-only button:

| Component | Button | aria-label key |
|-----------|--------|---------------|
| ChatInput | Attach file | `aria.attachFile` |
| ChatInput | Player reference | `aria.addPlayerRef` |
| ChatInput | Send message | `aria.sendMessage` |
| ChatThread | Back button | `aria.goBack` |
| ChatThread | Block scout | `aria.blockScout` / `aria.unblockScout` |
| ChatThread | Load older | `aria.loadOlder` |
| ChatThread | New messages (scroll) | `aria.scrollToLatest` |
| MessageBubble | Retry send | `aria.retrySend` |
| MessageBubble | Close fullscreen image | `aria.closeImage` |
| MessageBubble | Download file | `aria.downloadFile` |
| PlayerSearchModal | Close modal | `aria.closeModal` |
| ChatInput | Dismiss error | `common.dismiss` |

#### 3b. Role Attributes

| Component | Element | Role |
|-----------|---------|------|
| ChatInbox | Conversation list container | `role="list"` |
| ChatInbox | Each conversation card | `role="listitem"` |
| ChatThread | Message container | `role="log"` + `aria-live="polite"` |
| PlayerSearchModal | Modal backdrop | `role="dialog"` + `aria-modal="true"` + `aria-label` |

#### 3c. aria-live Region for New Messages

**File:** `src/components/chat/ChatThread.tsx`

Add a visually hidden live region:

```tsx
<div className="sr-only" aria-live="polite" aria-atomic="false">
  {lastAnnouncedMessage && lastAnnouncedMessage}
</div>
```

When a new message arrives from the other party, set:
```typescript
setLastAnnouncedMessage(`${senderName}: ${content.slice(0, 100)}`)
```

Only announce incoming messages, not the user's own.

#### 3d. Keyboard Navigation

- **PlayerSearchModal:** Add `onKeyDown` handler for Escape → close modal, return focus to trigger
- **Fullscreen image overlay (MessageBubble):** Add Escape handler → close overlay
- **Focus management:** When conversation opens, auto-focus the textarea input

### Phase 4: Visual Polish (~25 min)

#### 4a. Emoji-Only Message Enlargement

**New utility:** `src/lib/chat-utils.ts` — add `isEmojiOnly()` function

```typescript
// Matches emoji characters (including compound emoji, skin tones, flags, ZWJ sequences)
const EMOJI_REGEX = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\s]+$/u

export function isEmojiOnly(text: string): boolean {
  if (!text || text.length > 30) return false // Quick exit for long messages
  const trimmed = text.trim()
  if (!trimmed) return false
  // Count actual emoji (not whitespace)
  const emojiMatches = trimmed.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu)
  if (!emojiMatches || emojiMatches.length > 6) return false
  return EMOJI_REGEX.test(trimmed)
}
```

**File:** `src/components/chat/MessageBubble.tsx`

```tsx
// In the text content section:
const emojiOnly = message.message_type === 'text' && message.content && isEmojiOnly(message.content)

<p className={`whitespace-pre-wrap break-words ${emojiOnly ? 'text-2xl leading-relaxed' : 'text-sm'}`}>
  {emojiOnly ? message.content : linkifyMessage(message.content).map(...)}
</p>
```

Emoji-only messages skip linkification (no URLs in pure emoji).

#### 4b. Unread Separator Line

**File:** `src/components/chat/ChatThread.tsx`

Compute first unread message ID on mount:

```typescript
const firstUnreadIdRef = useRef<string | null>(null)

// In the initial data load (before markRead()):
useEffect(() => {
  if (initialMessages.length > 0 && firstUnreadIdRef.current === null) {
    const firstUnread = initialMessages.find(
      m => m.sender_id !== userId && !m.read_at
    )
    firstUnreadIdRef.current = firstUnread?.id ?? null
  }
}, [initialMessages, userId])
```

Render separator in the message list:

```tsx
{messages.map((msg, i) => (
  <React.Fragment key={msg.id}>
    {msg.id === firstUnreadIdRef.current && (
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="h-px flex-1 bg-accent/50" />
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-accent">
          {t('chat.newMessages')}
        </span>
        <div className="h-px flex-1 bg-accent/50" />
      </div>
    )}
    {/* Date divider + MessageBubble rendering (existing) */}
  </React.Fragment>
))}
```

#### 4c. Animations

**Error banner (ChatInput):** Add `animate-in fade-in slide-in-from-top-1` via Tailwind. Alternatively, a simple CSS transition:

```css
/* In globals.css */
@keyframes slide-in-down {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-in-down {
  animation: slide-in-down 200ms ease-out;
}
```

Apply to: error banner, reconnecting banner, paste preview, unread separator.

**Message entrance:** New messages fade in with a subtle slide:

```tsx
// In MessageBubble, add className on the outer div:
className="animate-fade-in"

// In globals.css:
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 150ms ease-out;
}
```

Only apply to messages added after initial load (not historical messages). Use a flag like `isNew` passed from ChatThread.

### Phase 5: Translations (~10 min)

**File:** `src/lib/translations.ts`

New keys (both en + ka):

```typescript
// Reliability
'chat.reconnecting': { en: 'Reconnecting...', ka: 'ხელახლა დაკავშირება...' },
'chat.connectionLost': { en: 'Connection lost', ka: 'კავშირი გაწყდა' },
'common.dismiss': { en: 'Dismiss', ka: 'დახურვა' },

// UX
'chat.pastedImage': { en: 'Pasted image', ka: 'ჩასმული სურათი' },
'chat.pastedImageReady': { en: 'Image ready to send', ka: 'სურათი გასაგზავნად მზადაა' },

// Accessibility (aria-labels)
'aria.attachFile': { en: 'Attach file', ka: 'ფაილის მიმაგრება' },
'aria.sendMessage': { en: 'Send message', ka: 'შეტყობინების გაგზავნა' },
'aria.addPlayerRef': { en: 'Reference a player', ka: 'მოთამაშის მითითება' },
'aria.goBack': { en: 'Go back', ka: 'უკან დაბრუნება' },
'aria.blockScout': { en: 'Block scout', ka: 'სკაუტის დაბლოკვა' },
'aria.unblockScout': { en: 'Unblock scout', ka: 'სკაუტის განბლოკვა' },
'aria.loadOlder': { en: 'Load older messages', ka: 'ძველი შეტყობინებების ჩატვირთვა' },
'aria.scrollToLatest': { en: 'Scroll to latest messages', ka: 'ბოლო შეტყობინებებზე გადასვლა' },
'aria.retrySend': { en: 'Retry sending', ka: 'ხელახლა გაგზავნა' },
'aria.closeImage': { en: 'Close image', ka: 'სურათის დახურვა' },
'aria.downloadFile': { en: 'Download file', ka: 'ფაილის ჩამოტვირთვა' },
'aria.closeModal': { en: 'Close', ka: 'დახურვა' },

// Visual polish
'chat.newMessages': { en: 'New messages', ka: 'ახალი შეტყობინებები' },
```

### Phase 6: Verify (~10 min)

1. `npm run build` — fix any TypeScript errors
2. Verify at 375px mobile viewport
3. Test Realtime inbox by opening two browser tabs
4. Test paste-to-upload with a screenshot
5. Test URL auto-linking with `https://example.com` in a message
6. Test emoji-only detection with "heart fire" and "Hello world"
7. Update CLAUDE.md — no new checklist items (Session F is polish, not new features)
8. Commit

## System-Wide Impact

### Interaction Graph

- Realtime connection drops → ChatThread subscription status callback fires → `setConnectionStatus('reconnecting')` → yellow banner renders → Supabase auto-reconnects → status callback fires `SUBSCRIBED` → banner hides
- User pastes image → `handlePaste` intercepts → preview renders above input → user clicks Send → existing upload flow → file message sent → preview dismissed
- New message arrives while viewing inbox → `inbox-updates` channel fires → debounced fetch → `setLiveConversations()` → inbox re-renders with updated order + unread counts
- Screen reader user enters thread → `role="log"` announces container → new message arrives → `aria-live="polite"` region announces "[name]: [content]"

### Error Propagation

- Paste-to-upload size error → caught client-side before upload → `setError()` → auto-dismiss after 5s
- Realtime channel error → `CHANNEL_ERROR` status → banner shows → Supabase client auto-retries → `SUBSCRIBED` → banner hides
- Inbox re-fetch fails → `res.ok` check → silently fails (no error shown, stale data persists until next event triggers retry)

### State Lifecycle Risks

- **firstUnreadIdRef diverges from actual read state:** Acceptable by design. The ref captures initial state for visual separator only. After markRead(), messages are read but separator stays until user navigates away.
- **liveConversations diverges from server props:** On mount, synced via `useEffect`. After that, client state is authoritative. If user navigates away and back, server props overwrite client state (clean reset).
- **pastedPreview object URL leak:** Mitigated by revoking URL on dismiss and on component unmount.

## Acceptance Criteria

### Functional

- [x] Reconnecting banner appears when Realtime subscription enters `CHANNEL_ERROR` or `TIMED_OUT` state
- [x] Reconnecting banner disappears when subscription re-enters `SUBSCRIBED` state
- [x] Yellow banner for reconnecting, red for disconnected
- [x] Error messages in ChatInput auto-dismiss after 5 seconds
- [x] Error messages have manual dismiss (X) button
- [x] New error resets the auto-dismiss timer
- [x] URLs in messages are clickable with `target="_blank"` and `rel="noopener noreferrer"`
- [x] Only `https://` and `http://` URLs are linked (not bare domains)
- [x] `javascript:` URLs are never linked
- [x] Trailing punctuation stripped from URLs (period, comma, etc.)
- [x] Pasting an image into ChatInput shows a preview with Cancel and Send buttons
- [x] Pasted image uploads via existing chat-upload flow
- [x] Pasting text still works normally (no interference)
- [x] Pasted images >10MB show size error
- [x] Inbox updates in realtime when new messages arrive (without page reload)
- [x] Inbox re-sorts conversations by `last_message_at` on update
- [x] New conversations appear in inbox via Realtime
- [x] All icon buttons have `aria-label` attributes
- [x] Conversation list has `role="list"`, items have `role="listitem"`
- [x] Message container has `role="log"`
- [x] New incoming messages are announced via `aria-live="polite"` region
- [x] Escape closes PlayerSearchModal and fullscreen image overlay
- [x] Emoji-only messages (1-6 emoji, no text) render at `text-2xl`
- [x] Messages with text + emoji render at normal `text-sm`
- [x] Unread separator line appears between last read and first unread message
- [x] Separator shows "New messages" text (bilingual)
- [x] Separator is computed from initial message state (before markRead)
- [x] Error banners animate in with slide-down
- [x] New messages animate in with fade + slide-up
- [x] All new strings bilingual (English + Georgian)
- [x] `npm run build` passes with zero errors

### Non-Functional

- [x] No `any` types
- [x] All Supabase `.error` checked before using `.data`
- [x] No XSS vectors from URL auto-linking
- [x] Realtime inbox debounced at 1.5s (no API hammering)
- [x] Object URLs from clipboard properly revoked (no memory leaks)
- [x] Mobile responsive at 375px

## Files to Create

None — all changes go into existing files.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chat/ChatThread.tsx` | Reconnecting banner, unread separator, aria-live region, animation classes, role="log", Escape handler for image overlay, focus management |
| `src/components/chat/ChatInput.tsx` | Error auto-dismiss + dismiss button, paste-to-upload handler + preview UI, aria-labels on buttons |
| `src/components/chat/ChatInbox.tsx` | Realtime subscription for inbox updates, role="list" + role="listitem" |
| `src/components/chat/MessageBubble.tsx` | URL auto-linking via `linkifyMessage()`, emoji-only enlargement, aria-labels on retry/download/image buttons, message entrance animation |
| `src/components/chat/PlayerSearchModal.tsx` | Escape key handler, role="dialog", aria-modal, aria-label |
| `src/lib/chat-utils.ts` | New functions: `linkifyMessage()`, `isEmojiOnly()` |
| `src/lib/translations.ts` | ~18 new translation keys (reliability, UX, aria, visual) |
| `src/app/globals.css` | New keyframe animations: `slide-in-down`, `fade-in` |

## Build Order (Step-by-Step)

### Phase 1: Translations + Utilities (~10 min)
1. **Add all new translation keys** to `src/lib/translations.ts`
2. **Add `linkifyMessage()` and `isEmojiOnly()`** to `src/lib/chat-utils.ts`
3. **Add CSS animations** to `src/app/globals.css`

### Phase 2: Reliability (~15 min)
4. **Add reconnecting banner** to `ChatThread.tsx` — subscribe status callback + banner UI
5. **Add error auto-dismiss** to `ChatInput.tsx` — useEffect timer + X button

### Phase 3: UX Improvements (~30 min)
6. **Add URL auto-linking** to `MessageBubble.tsx` — replace plain text with `linkifyMessage()`
7. **Add paste-to-upload** to `ChatInput.tsx` — paste handler + preview + send
8. **Add realtime inbox updates** to `ChatInbox.tsx` — Realtime subscription + re-fetch

### Phase 4: Accessibility (~20 min)
9. **Add aria-labels** to all icon buttons across `ChatInput.tsx`, `ChatThread.tsx`, `MessageBubble.tsx`, `PlayerSearchModal.tsx`
10. **Add role attributes** — `role="list"/"listitem"` on inbox, `role="log"` on thread, `role="dialog"` on modal
11. **Add aria-live region** to `ChatThread.tsx` for incoming messages
12. **Add Escape key handlers** to `PlayerSearchModal.tsx` and fullscreen image overlay

### Phase 5: Visual Polish (~15 min)
13. **Add emoji-only enlargement** to `MessageBubble.tsx`
14. **Add unread separator line** to `ChatThread.tsx`
15. **Apply animation classes** to error banner, reconnecting banner, paste preview, new messages

### Phase 6: Verify (~10 min)
16. **`npm run build`** — fix TypeScript errors
17. **Test at 375px** mobile viewport
18. **Test realtime** with two browser tabs
19. **Test paste-to-upload** with a screenshot
20. **Commit**

## Out of Scope

These items are intentionally deferred:

| Item | Reason |
|------|--------|
| Typing indicator | Requires Supabase Presence channels (new infrastructure) |
| Notification sounds | Requires audio files + user preferences system |
| Browser push notifications | Requires service worker + permission API |
| Message search within conversation | Requires backend search API |
| Draft message persistence | Requires localStorage + sync logic |
| Message deletion/editing | Requires backend changes + RLS policy updates |
| Conversation search in inbox | Requires search API |
| Copy message action | Low priority, can add later |
| Consolidated Realtime provider | Optimization — current approach works, can refactor later |
| Signed URL refresh for long sessions | Edge case — would require periodic re-fetching |
| Drag-and-drop file upload | Nice-to-have, paste-to-upload covers main use case |

## Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase Realtime status callback API may differ across versions | Banner may not trigger | Test with actual connection drop (disable network in DevTools) |
| `isEmojiOnly()` regex may miss edge cases with compound emoji | Some emoji messages stay small | Conservative regex + 30-char length limit prevents false positives |
| Inbox re-fetch on every message event could be expensive | API load | 1.5s debounce + single fetch per debounce window |
| `firstUnreadIdRef` computed before markRead() may race | Separator in wrong position | `useRef` is synchronous — no race condition with async markRead() |
| Pasted images from clipboard may lack proper MIME type | Upload rejected | Fallback to `image/png` if type is empty |
| URL regex may capture too much or too little | Broken links or missed links | Conservative regex (protocol-only), strip trailing punctuation |

## Sources & References

### Origin

- **Chat-system-build.md** — Session F section (lines 438-461)
- **Session A-D plans** in `docs/plans/`
- **Polish session docs** in `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`

### Internal References (Patterns to Follow)

| File | Pattern |
|------|---------|
| `src/components/layout/Navbar.tsx:54-87` | Realtime subscription with debounce (reuse for inbox) |
| `src/components/chat/ChatThread.tsx:140-216` | Existing Realtime subscription (extend with status callback) |
| `src/components/chat/ChatInput.tsx:84-122` | File validation pattern (reuse for paste-to-upload) |
| `src/components/chat/ChatInput.tsx:150-154` | Error banner rendering (extend with dismiss + animation) |
| `src/app/dashboard/error.tsx` | Error boundary pattern |
| `src/lib/chat-utils.ts` | Existing utilities (add linkify + emoji detection) |
