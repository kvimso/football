-- Fix chat system security & performance issues from code review
-- Addresses: authorization bypass, FK constraint, RLS block check, player_views exposure,
-- N+1 queries, and unused deleted_at column

-- ============================================================
-- 1.1 mark_messages_read authorization bypass
-- Previously any authenticated user could mark messages as read
-- Now verifies the caller is a participant in the conversation
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id
    AND (
      c.scout_id = auth.uid()
      OR (
        public.get_user_role() = 'academy_admin'
        AND public.get_user_club_id() = c.club_id
      )
    )
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$;

-- ============================================================
-- 1.2 conversations.scout_id NOT NULL + ON DELETE SET NULL conflict
-- NOT NULL + ON DELETE SET NULL would fail; change to CASCADE
-- If a scout is deleted, their conversations are deleted too
-- ============================================================

ALTER TABLE public.conversations
  DROP CONSTRAINT conversations_scout_id_fkey,
  ADD CONSTRAINT conversations_scout_id_fkey
    FOREIGN KEY (scout_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 1.3 Messages INSERT RLS block check inconsistency
-- Previous policy only blocked the non-blocker party from sending.
-- Academy admin (blocker) could still send via direct Supabase client.
-- New policy blocks BOTH parties when any block exists.
-- ============================================================

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;

CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (
        c.scout_id = auth.uid()
        OR (
          public.get_user_role() = 'academy_admin'
          AND public.get_user_club_id() = c.club_id
        )
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_blocks cb
      WHERE cb.conversation_id = messages.conversation_id
    )
  );

-- ============================================================
-- 1.4 player_views blanket SELECT policy
-- Prevents any authenticated user from querying which scouts
-- viewed which players. Scoped to own views only.
-- RPC made SECURITY DEFINER so it can aggregate all views.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read player views" ON player_views;

CREATE POLICY "Users can read own player views"
  ON player_views FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());

-- Update RPC to SECURITY DEFINER and accept player_ids parameter
CREATE OR REPLACE FUNCTION public.get_player_view_counts(player_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  player_id uuid,
  total_views bigint,
  weekly_views bigint,
  prev_week_views bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.player_id,
    COUNT(*)::bigint AS total_views,
    COUNT(*) FILTER (WHERE pv.viewed_at >= NOW() - INTERVAL '7 days')::bigint AS weekly_views,
    COUNT(*) FILTER (WHERE pv.viewed_at >= NOW() - INTERVAL '14 days' AND pv.viewed_at < NOW() - INTERVAL '7 days')::bigint AS prev_week_views
  FROM player_views pv
  WHERE (player_ids IS NULL OR pv.player_id = ANY(player_ids))
  GROUP BY pv.player_id;
END;
$$;

-- ============================================================
-- 2.8 Remove unused deleted_at column from messages
-- No UPDATE policies, no RPC functions, no application code
-- sets this column. Removing dead schema per YAGNI.
-- ============================================================

ALTER TABLE public.messages DROP COLUMN IF EXISTS deleted_at;

-- ============================================================
-- 1.5 N+1 query fix — Conversation fetching RPC
-- Replaces 3 extra queries per conversation with lateral joins.
-- 20 conversations = 60 round-trips → 1 query.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_conversations_with_metadata(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  scout_id uuid,
  club_id uuid,
  last_message_at timestamptz,
  created_at timestamptz,
  club_name text,
  club_name_ka text,
  club_logo_url text,
  scout_full_name text,
  scout_email text,
  scout_organization text,
  scout_role text,
  last_message_content text,
  last_message_type text,
  last_message_sender_id uuid,
  last_message_created_at timestamptz,
  unread_count bigint,
  is_blocked boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.scout_id,
    c.club_id,
    c.last_message_at,
    c.created_at,
    cl.name AS club_name,
    cl.name_ka AS club_name_ka,
    cl.logo_url AS club_logo_url,
    p.full_name AS scout_full_name,
    p.email AS scout_email,
    p.organization AS scout_organization,
    p.role AS scout_role,
    lm.content AS last_message_content,
    lm.message_type::text AS last_message_type,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    COALESCE(uc.cnt, 0)::bigint AS unread_count,
    COALESCE(bl.blocked, false) AS is_blocked
  FROM public.conversations c
  JOIN public.clubs cl ON cl.id = c.club_id
  JOIN public.profiles p ON p.id = c.scout_id
  LEFT JOIN LATERAL (
    SELECT m.content, m.message_type, m.sender_id, m.created_at
    FROM public.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.sender_id != p_user_id
      AND m.read_at IS NULL
  ) uc ON true
  LEFT JOIN LATERAL (
    SELECT true AS blocked
    FROM public.conversation_blocks cb
    WHERE cb.conversation_id = c.id
    LIMIT 1
  ) bl ON true
  WHERE c.scout_id = p_user_id
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = p_user_id
          AND pr.role = 'academy_admin'
          AND pr.club_id = c.club_id
      )
    )
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- ============================================================
-- Update get_total_unread_count to remove deleted_at reference
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_total_unread_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT coalesce(count(*), 0)
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE m.sender_id != auth.uid()
    AND m.read_at IS NULL
    AND (
      c.scout_id = auth.uid()
      OR (
        get_user_role() = 'academy_admin'
        AND get_user_club_id() = c.club_id
      )
    );
$$;

-- ============================================================
-- 3.7 Document: no DELETE policy on storage objects
-- Users cannot delete uploaded chat files. This is intentional —
-- prevents evidence tampering in scout-academy communications.
-- Files are retained for audit/compliance purposes.
-- ============================================================
