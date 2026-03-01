# Chat System — Architecture & Build Plan

Read CLAUDE.md first. This chat system REPLACES the old contact request system entirely.

---

## Overview

Real-time messaging between scouts and academy admins. One conversation thread per scout-academy pair. All player discussions happen in one thread. Both sides can send text, files, and embed player references.

Access: subscription-only (no free tier). Every user on the platform is verified and paying.

---

## Database Schema

### New Tables

```sql
-- Conversations (one per scout-academy pair)
create table conversations (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references profiles(id) on delete cascade,
  academy_admin_id uuid references profiles(id) on delete cascade,
  club_id uuid references clubs(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(scout_id, club_id)             -- one thread per scout per club
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text,                          -- text content (nullable if file-only message)
  message_type text default 'text',      -- 'text' | 'file' | 'player_ref' | 'system'
  -- File attachment fields (null if text-only)
  file_url text,
  file_name text,
  file_type text,                        -- MIME type
  file_size_bytes int,
  -- Player reference fields (null if not a player embed)
  referenced_player_id uuid references players(id),
  -- Metadata
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Blocked conversations (academy can block a scout)
create table conversation_blocks (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  blocked_by uuid references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(conversation_id, blocked_by)
);

-- Indexes
create index idx_conversations_scout on conversations(scout_id);
create index idx_conversations_club on conversations(club_id);
create index idx_conversations_last_message on conversations(last_message_at desc);
create index idx_messages_conversation on messages(conversation_id, created_at);
create index idx_messages_sender on messages(sender_id);
create index idx_messages_unread on messages(conversation_id, is_read) where is_read = false;
```

### RLS Policies

```sql
-- Conversations: only participants can see their own conversations
create policy "Users see own conversations" on conversations
  for select using (
    auth.uid() = scout_id OR
    auth.uid() = academy_admin_id
  );

-- Scouts can create conversations
create policy "Scouts create conversations" on conversations
  for insert with check (
    auth.uid() = scout_id
  );

-- Messages: only conversation participants can read
create policy "Participants read messages" on messages
  for select using (
    conversation_id in (
      select id from conversations
      where scout_id = auth.uid() or academy_admin_id = auth.uid()
    )
  );

-- Participants can send messages in their conversations
create policy "Participants send messages" on messages
  for insert with check (
    sender_id = auth.uid() AND
    conversation_id in (
      select id from conversations
      where scout_id = auth.uid() or academy_admin_id = auth.uid()
    )
  );

-- Participants can mark messages as read
create policy "Participants mark read" on messages
  for update using (
    sender_id != auth.uid() AND
    conversation_id in (
      select id from conversations
      where scout_id = auth.uid() or academy_admin_id = auth.uid()
    )
  );
```

### Tables to Remove

The old contact request system is replaced:

- **DO NOT delete the `contact_requests` table yet** — keep the data but remove all UI that references it
- Remove contact request forms from player profiles
- Remove contact request pages from scout dashboard and admin panel
- Remove `/api/contact/` route
- Replace with "Message Academy" button everywhere

---

## Anti-Spam Protection

Since all users are subscribers, spam risk is low. But still protect against abuse:

### Rate Limits (enforce in API route, not RLS)

1. **New conversations:** Max 10 new conversations per scout per day
   - Check: `SELECT count(*) FROM conversations WHERE scout_id = [id] AND created_at > now() - interval '24 hours'`
   - If limit hit: show "You've reached the daily conversation limit. Try again tomorrow."

2. **Messages per conversation:** Max 30 messages per user per conversation per hour
   - Check: `SELECT count(*) FROM messages WHERE sender_id = [id] AND conversation_id = [id] AND created_at > now() - interval '1 hour'`
   - If limit hit: show "You're sending too many messages. Please wait."

3. **File uploads:** Max 5 files per user per day, max 10MB per file
   - Check count and size before upload

### Block System

- Academy admin can block a scout from a conversation
- Blocked scout cannot send messages in that conversation
- Blocked scout sees: "This conversation has been closed by the academy"
- Academy can unblock later
- Check block status before allowing message send

### File Type Restrictions

Only allow safe file types:

- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx
- Max file size: 10MB
- Store in Supabase Storage bucket: `chat-attachments`
- Files are private — only conversation participants can access (use signed URLs)

---

## Real-Time Architecture

Use Supabase Realtime subscriptions for instant messaging.

### How It Works

1. When a user opens a conversation, subscribe to the `messages` table filtered by `conversation_id`
2. When a new message is inserted, all subscribers receive it instantly
3. Update `conversations.last_message_at` on every new message (for sorting inbox)
4. Mark messages as read when the other participant opens the conversation

### Client-Side Pattern

```typescript
// Subscribe to new messages in a conversation
const channel = supabase
  .channel(`conversation:${conversationId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Add new message to the UI
      setMessages((prev) => [...prev, payload.new]);
    },
  )
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

### Enable Realtime

In Supabase dashboard: enable Realtime on the `messages` table.
Or via migration:

```sql
alter publication supabase_realtime add table messages;
```

---

## UI Flow

### Scout Side

**"Message Academy" button** appears on:

- Every player profile page (opens/creates conversation with that player's club)
- Every club page (opens/creates conversation with that club)

**Inbox** (`/dashboard/messages`):

- List of all conversations, sorted by last message
- Each row shows: club name, club logo, last message preview, timestamp, unread count badge
- Click opens the conversation thread

**Conversation thread** (`/dashboard/messages/[conversationId]`):

- Messages displayed chronologically (oldest at top, newest at bottom)
- Auto-scroll to bottom on new messages
- Input bar at bottom: text field + file attach button + player reference button
- Player reference: opens a mini-search, scout picks a player → embedded player card appears in the message
- File upload: drag-and-drop or click to upload
- Show "typing..." indicator (optional, nice-to-have)

### Academy Admin Side

**Inbox** (`/admin/messages`):

- Same layout as scout inbox
- Each row shows: scout name, organization, last message preview, timestamp, unread count
- "Block" option accessible from conversation settings

**Conversation thread** (`/admin/messages/[conversationId]`):

- Same as scout thread
- Additional: "Block Scout" button in conversation header
- File upload for sharing documents (medical reports, training records, etc.)

### Player Reference in Messages

When a user clicks the "player reference" button:

1. Opens a mini search modal (search by name or platform_id)
2. User selects a player
3. Message is sent with `message_type: 'player_ref'` and `referenced_player_id` set
4. In the chat, this renders as an embedded player card: photo, name, position, age, club, key stats
5. Clicking the card opens the full player profile in a new tab

---

## File Structure

```
src/
  app/
    (platform)/
      dashboard/
        messages/
          page.tsx              # Scout inbox
          [id]/
            page.tsx            # Scout conversation thread
      admin/
        messages/
          page.tsx              # Admin inbox
          [id]/
            page.tsx            # Admin conversation thread
    api/
      messages/
        route.ts                # POST: send message, GET: load messages
        [conversationId]/
          read/
            route.ts            # PATCH: mark messages as read
      conversations/
        route.ts                # POST: create conversation, GET: list conversations
      chat-upload/
        route.ts                # POST: upload file attachment
  components/
    chat/
      ChatInbox.tsx             # Conversation list component
      ChatThread.tsx            # Message thread component
      ChatInput.tsx             # Message input bar (text + file + player ref)
      ChatMessage.tsx           # Single message bubble
      ChatPlayerEmbed.tsx       # Embedded player card in a message
      ChatFileAttachment.tsx    # File attachment display
      PlayerSearchModal.tsx     # Mini search for player references
```

---

## Migration Plan (Remove Contact Requests)

The old contact request system is being replaced. Handle carefully:

### Step 1: Build chat system alongside existing contact requests

- Add all chat tables, UI, routes
- Keep old contact request UI working
- Don't delete anything yet

### Step 2: Replace UI touchpoints

- Player profile: replace "Send Contact Request" button with "Message Academy"
- Scout dashboard: replace "Requests" nav item with "Messages"
- Admin panel: replace "Contact Requests" nav item with "Messages"
- Remove contact request status tracking from scout dashboard

### Step 3: After chat is confirmed working

- Remove `/api/contact/` route
- Remove contact request form components
- Remove contact request pages
- Keep `contact_requests` table in database (historical data) but stop writing to it
- Remove contact request expiry logic

---

## Navigation Updates

### Scout Dashboard Sidebar

Before: Home | Shortlist | Requests
After: Home | Shortlist | Messages

### Admin Panel Sidebar

Before: Overview | Players | Contact Requests | Transfers
After: Overview | Players | Messages | Transfers

---

## Build Order for Andria

### SESSION A: Database + API Foundation

1. Create migration: conversations, messages, conversation_blocks tables
2. Set up RLS policies
3. Enable Realtime on messages table
4. Create Supabase Storage bucket: `chat-attachments` (private)
5. Create API routes:
   - `POST /api/conversations` — create or get existing conversation (scout_id + club_id)
   - `GET /api/conversations` — list user's conversations with last message and unread count
   - `POST /api/messages` — send message (with rate limit checks and block checks)
   - `GET /api/messages?conversation_id=X` — load messages for a conversation (paginated, 50 at a time)
   - `PATCH /api/messages/[conversationId]/read` — mark all unread messages as read
   - `POST /api/chat-upload` — upload file, return signed URL
6. Regenerate types
7. `npm run build` + commit

### SESSION B: Chat UI — Inbox

1. Create `ChatInbox.tsx` component:
   - List of conversations sorted by last_message_at
   - Show: other party's name, organization/club, last message preview (truncated), time ago, unread badge
   - Click navigates to conversation thread
2. Create scout inbox page: `/dashboard/messages/page.tsx`
3. Create admin inbox page: `/admin/messages/page.tsx`
4. Add "Messages" to both sidebar navigations (replace "Requests"/"Contact Requests")
5. Show unread total count badge in the sidebar nav item
6. `npm run build` + commit

### SESSION C: Chat UI — Conversation Thread

1. Create `ChatThread.tsx`:
   - Load messages on mount (GET /api/messages)
   - Subscribe to Supabase Realtime for new messages
   - Auto-scroll to bottom on new messages
   - Group messages by date (show date dividers)
   - Mark messages as read when conversation is opened
2. Create `ChatMessage.tsx`:
   - Render differently based on message_type: text, file, player_ref, system
   - Show sender name, timestamp, read indicator
   - Sent messages on right (green/blue), received on left (gray)
3. Create `ChatInput.tsx`:
   - Text input with send button
   - Enter to send, Shift+Enter for new line
   - Disable send button while sending (prevent double-send)
   - Show character count if approaching limit (optional)
4. Create scout thread page: `/dashboard/messages/[id]/page.tsx`
5. Create admin thread page: `/admin/messages/[id]/page.tsx`
6. `npm run build` + commit

### SESSION D: File Attachments + Player References

1. Create `ChatFileAttachment.tsx`:
   - Display images inline (with lightbox on click)
   - Display documents as downloadable links with file icon, name, and size
2. Add file upload to `ChatInput.tsx`:
   - Paperclip icon button
   - File picker with type restrictions (images + PDFs + docs)
   - Upload to Supabase Storage, get signed URL
   - Send message with file_url, file_name, file_type, file_size_bytes
   - Show upload progress indicator
3. Create `PlayerSearchModal.tsx`:
   - Search players by name or platform_id
   - Show results as compact player cards
   - On select: send message with message_type 'player_ref' and referenced_player_id
4. Create `ChatPlayerEmbed.tsx`:
   - Render an embedded player card in the message thread
   - Show: photo, name, position, age, club, key stats
   - Clickable — opens full player profile
5. `npm run build` + commit

### SESSION E: "Message Academy" Buttons + Block System + Cleanup

1. Add "Message Academy" button to:
   - Every player profile page (creates/opens conversation with player's club)
   - Every club page (creates/opens conversation with that club)
   - Button logic: POST /api/conversations with scout_id + club_id, then redirect to thread
2. Build block system:
   - Admin can click "Block Scout" in conversation header
   - Inserts row into conversation_blocks
   - Blocked scout sees "This conversation has been closed by the academy"
   - Blocked scout cannot send new messages
   - Admin can unblock from the same menu
3. Remove old contact request UI:
   - Remove "Send Contact Request" button from player profiles
   - Remove contact request form components
   - Remove `/dashboard/requests` page (replace redirect to `/dashboard/messages`)
   - Remove `/admin/requests` page (replace redirect to `/admin/messages`)
   - Remove `/api/contact/` route
   - DO NOT delete the contact_requests table — keep historical data
4. Update navigation sidebars
5. Add i18n translations for all new chat strings (English + Georgian)
6. `npm run build` + commit

### SESSION F: Polish + Edge Cases

1. Empty states:
   - No conversations yet: "Start a conversation by messaging an academy from any player profile"
   - No messages in thread: "Send the first message to start the conversation"
   - Conversation blocked: clear blocked state message
2. Loading states:
   - Skeleton loaders for inbox
   - Message sending indicator (spinner on send button)
   - File upload progress bar
3. Error handling:
   - Rate limit exceeded: clear user-facing message
   - File too large: validation before upload
   - Network disconnect: show "Reconnecting..." banner, auto-reconnect Realtime subscription
4. Unread count:
   - Global unread badge in main navigation (visible across all platform pages)
   - Per-conversation unread count in inbox
   - Clear unread when conversation is opened
5. Mobile responsive:
   - Inbox works on mobile
   - Thread works on mobile (input bar fixed at bottom)
   - File upload works on mobile
6. `npm run build` + commit
