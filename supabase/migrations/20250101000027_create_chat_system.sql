-- Chat system: conversations, messages, conversation_blocks
-- Phase 6.5 — Real-time messaging between scouts and academy admins

-- Enum for message types
create type public.message_type as enum ('text', 'file', 'player_ref', 'system');

-- Conversations: one thread per scout-club pair
-- No academy_admin_id — admin access derived from profiles.club_id
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid not null references public.profiles(id) on delete set null,
  club_id uuid not null references public.clubs(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(scout_id, club_id)
);

create index idx_conversations_scout on public.conversations(scout_id);
create index idx_conversations_club on public.conversations(club_id);
create index idx_conversations_last_message on public.conversations(last_message_at desc);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text,
  message_type public.message_type not null default 'text',
  file_url text,
  file_name text,
  file_type text,
  file_size_bytes int,
  referenced_player_id uuid references public.players(id) on delete set null,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_unread on public.messages(conversation_id, sender_id, read_at)
  where read_at is null;

-- Conversation blocks (academy admin blocks a scout)
create table public.conversation_blocks (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  blocked_by uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(conversation_id, blocked_by)
);

create index idx_conversation_blocks_conversation on public.conversation_blocks(conversation_id);

-- ============================================================
-- RLS
-- ============================================================

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_blocks enable row level security;

-- Conversations: participants + platform admin can view
create policy "Participants view own conversations"
  on public.conversations for select
  using (
    auth.uid() = scout_id
    or (
      public.get_user_role() = 'academy_admin'
      and public.get_user_club_id() = club_id
    )
    or public.get_user_role() = 'platform_admin'
  );

-- Only scouts can create conversations
create policy "Scouts create conversations"
  on public.conversations for insert
  to authenticated
  with check (
    auth.uid() = scout_id
    and public.get_user_role() = 'scout'
  );

-- Messages: conversation participants + platform admin can read
create policy "Participants read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (
        c.scout_id = auth.uid()
        or (
          public.get_user_role() = 'academy_admin'
          and public.get_user_club_id() = c.club_id
        )
        or public.get_user_role() = 'platform_admin'
      )
    )
  );

-- Messages: participants can send (with block check in RLS for defense in depth)
create policy "Participants send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (
        c.scout_id = auth.uid()
        or (
          public.get_user_role() = 'academy_admin'
          and public.get_user_club_id() = c.club_id
        )
      )
    )
    and not exists (
      select 1 from public.conversation_blocks cb
      where cb.conversation_id = messages.conversation_id
      and cb.blocked_by != auth.uid()
    )
  );

-- Conversation blocks: participants can view
create policy "Participants view blocks"
  on public.conversation_blocks for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (
        c.scout_id = auth.uid()
        or (
          public.get_user_role() = 'academy_admin'
          and public.get_user_club_id() = c.club_id
        )
        or public.get_user_role() = 'platform_admin'
      )
    )
  );

-- Academy admins can create blocks for their club's conversations
create policy "Academy admins create blocks"
  on public.conversation_blocks for insert
  to authenticated
  with check (
    blocked_by = auth.uid()
    and public.get_user_role() = 'academy_admin'
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and public.get_user_club_id() = c.club_id
    )
  );

-- Academy admins can remove their own blocks
create policy "Academy admins remove blocks"
  on public.conversation_blocks for delete
  using (
    blocked_by = auth.uid()
    and public.get_user_role() = 'academy_admin'
  );

-- Platform admin can remove any block
create policy "Platform admin remove blocks"
  on public.conversation_blocks for delete
  using (
    public.get_user_role() = 'platform_admin'
  );

-- ============================================================
-- Functions
-- ============================================================

-- SECURITY DEFINER function to mark messages as read
-- Prevents UPDATE policy abuse (can't tamper with message content)
create or replace function public.mark_messages_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id != auth.uid()
    and read_at is null;
end;
$$;

-- Trigger: update conversations.last_message_at on new message
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = NEW.created_at
  where id = NEW.conversation_id;
  return NEW;
end;
$$;

-- ============================================================
-- Triggers
-- ============================================================

-- conversations.updated_at auto-update (reuses existing trigger function)
create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at_column();

-- Update last_message_at when message is inserted
create trigger on_message_insert_update_conversation
  after insert on public.messages
  for each row execute function public.update_conversation_last_message();

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
