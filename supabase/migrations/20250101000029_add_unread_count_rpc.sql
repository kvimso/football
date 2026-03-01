-- Migration: Add get_total_unread_count() RPC
-- Used by Navbar badge to efficiently get total unread message count

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
