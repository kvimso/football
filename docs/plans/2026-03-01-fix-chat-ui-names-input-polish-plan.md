---
title: Fix Chat UI - Missing Names, Input Arrows, Messenger-Style Polish
type: fix
status: completed
date: 2026-03-01
---

# Fix Chat UI - Missing Names, Input Arrows, Messenger-Style Polish

## Overview

The chat system (Phase 6.5) has three categories of issues:
1. **Bug**: No name displayed in conversation thread header (who is texting who?)
2. **Bug**: Weird up/down arrows visible at the right edge of the message input bar
3. **Polish**: Overall chat UI needs messenger-style refinement to match apps like WhatsApp/Telegram

## Problem Statement

Screenshot analysis reveals:
- **Header**: Green circle avatar visible but NO name next to it. User cannot tell who they're chatting with.
- **Input bar**: Native Windows scrollbar arrows (up/down triangles) leak through at the right edge of the textarea inside the `.input` class.
- **General**: Chat works functionally but feels like a dev prototype, not a polished messenger experience.

## Proposed Solution

### Fix 1: Missing Display Name in Thread Header

**Root cause**: `ChatThread.tsx:50-52` computes `displayName` using `conversation.other_party.full_name`. For academy_admin view, this comes from the scout's `profiles.full_name` field. The scout's `full_name` is likely null/empty in the database.

**Two-part fix:**
1. **Data fix**: Check and populate the scout profile's `full_name` in the database
2. **Code fix**: Add fallback display name logic so the UI never shows blank — use email prefix or role label as fallback

**Files:**
- `src/components/chat/ChatThread.tsx:50-52` — Add fallback for empty `displayName`
- `src/lib/chat-queries.ts:108-110` — Include email or add fallback when constructing `otherParty`
- `src/components/chat/ChatInbox.tsx:119-121` — Same fallback in inbox list

### Fix 2: Weird Arrows on Message Input

**Root cause**: The `<textarea>` in `ChatInput.tsx:278-288` uses the `.input` CSS class with auto-grow height logic. When content height approaches `max-h-[96px]`, native Windows scrollbar controls (up/down arrows) appear because the browser shows a scrollbar on overflow.

**Fix:**
- Add `overflow-hidden` to the textarea (auto-grow handles height, no need for scroll)
- Add CSS to hide native scrollbar artifacts on the textarea specifically
- Remove the native resize handle (already done with `resize-none`, but reinforce with CSS)

**Files:**
- `src/components/chat/ChatInput.tsx:287` — Add `overflow-hidden` to textarea className
- `src/app/globals.css` — Add scrollbar-hiding utility for chat textarea if needed

### Fix 3: Messenger-Style UI Polish

Make the chat feel like WhatsApp/Telegram/Messenger. Key improvements:

#### 3a. Thread Header
- Larger avatar (10-11 instead of 9)
- Name more prominent (text-base instead of text-sm, bolder)
- Add role label underneath name (e.g., "Scout" or club name as subtitle)
- Better spacing and visual weight

#### 3b. Message Bubbles
- Add bubble tails/pointers (CSS triangles) for visual direction
- Slightly increase bubble padding for breathing room
- Better border-radius pattern (fully rounded except the corner near the sender)
- Add subtle shadow to give depth
- Improve spacing between consecutive messages from same sender (tighter) vs different senders (looser)

#### 3c. Input Bar
- Make input feel more like Messenger: rounded pill shape, slightly taller
- Group action buttons (attach, player ref) more intuitively
- Make send button slightly larger and more prominent
- Add subtle border/shadow to input area for visual separation
- Better focus ring on the textarea

#### 3d. Inbox List
- Better avatar styling (larger, with online status dot placeholder for future)
- Bolder unread conversation styling
- Cleaner timestamp alignment
- Slight hover elevation effect

**Files:**
- `src/components/chat/ChatThread.tsx` — Header improvements
- `src/components/chat/ChatInput.tsx` — Input bar redesign
- `src/components/chat/MessageBubble.tsx` — Bubble styling
- `src/components/chat/ChatInbox.tsx` — Inbox list polish
- `src/app/globals.css` — Any new CSS classes needed (bubble tails, scrollbar fixes)

## Acceptance Criteria

- [x] Name always displays in thread header (never blank) — fallback to email prefix or role label
- [x] No native scrollbar arrows visible on the message input textarea
- [x] Message bubbles have visual direction (tails or asymmetric rounding) showing who sent what
- [x] Input bar looks and feels like a modern messenger (rounded, clean, proper button sizing)
- [x] Thread header clearly identifies who you're chatting with (name + role/subtitle)
- [x] Inbox list items have proper visual hierarchy (unread vs read distinction)
- [x] All changes work on mobile (375px+) and desktop
- [x] All text remains bilingual (en/ka) — no hardcoded strings
- [x] `npm run build` passes with no errors

## Implementation Order

1. **Fix name bug** (5 min) — highest impact, simple fix
2. **Fix input arrows** (2 min) — simple CSS fix
3. **Polish message bubbles** — visual improvement
4. **Polish input bar** — modern messenger feel
5. **Polish thread header** — better identity display
6. **Polish inbox list** — better visual hierarchy
7. **Test build + mobile** — verify everything works

## Technical Considerations

- All changes are CSS/component-level — no database schema changes
- No new dependencies needed
- The `.input` class in `globals.css` is shared across the app — changes to it must not break other forms. Chat-specific overrides should use additional classes, not modify the global `.input`.
- Bubble tails can be done with CSS `::before`/`::after` pseudo-elements or with asymmetric border-radius (simpler, preferred)
- The auto-grow textarea logic in `ChatInput.tsx:88-97` should be preserved — only change overflow behavior

## Sources

### Internal References
- `src/components/chat/ChatThread.tsx:50-52` — displayName computation
- `src/components/chat/ChatInput.tsx:278-288` — textarea with `.input` class
- `src/components/chat/MessageBubble.tsx:74-79` — bubble styling
- `src/lib/chat-queries.ts:108-110` — otherParty construction
- `src/app/globals.css:128-144` — `.input` CSS class
