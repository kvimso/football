-- ============================================================
-- Migration: Atomic transfer accept + self-transfer CHECK
--
-- F1: PL/pgSQL function wraps 5 sequential operations in one transaction
-- F2: CHECK constraint prevents from_club_id = to_club_id
-- ============================================================

-- F1: Atomic transfer accept function
-- Replaces 5 sequential client-side DB calls with a single transaction.
-- Uses SELECT ... FOR UPDATE to prevent race conditions.
CREATE OR REPLACE FUNCTION public.accept_transfer_request(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_player RECORD;
BEGIN
  -- 1. Fetch and lock the transfer request
  SELECT id, player_id, from_club_id, to_club_id, status
  INTO v_request
  FROM transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'errors.requestNotFound');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'errors.requestNoLongerPending');
  END IF;

  -- 2. Verify player is still at the source club
  SELECT id, club_id
  INTO v_player
  FROM players
  WHERE id = v_request.player_id
  FOR UPDATE;

  IF NOT FOUND OR v_player.club_id IS DISTINCT FROM v_request.from_club_id THEN
    RETURN jsonb_build_object('error', 'errors.playerNoLongerAtClub');
  END IF;

  -- 3. Accept this request
  UPDATE transfer_requests
  SET status = 'accepted', resolved_at = now()
  WHERE id = p_request_id;

  -- 4. Cancel other pending requests for this player
  UPDATE transfer_requests
  SET status = 'declined', resolved_at = now()
  WHERE player_id = v_request.player_id
    AND status = 'pending'
    AND id != p_request_id;

  -- 5. Transfer player to new club
  UPDATE players
  SET club_id = v_request.to_club_id, updated_at = now()
  WHERE id = v_request.player_id;

  -- 6. Close old club history record
  UPDATE player_club_history
  SET left_at = current_date
  WHERE player_id = v_request.player_id
    AND club_id = v_request.from_club_id
    AND left_at IS NULL;

  -- 7. Create new club history record
  INSERT INTO player_club_history (player_id, club_id, joined_at)
  VALUES (v_request.player_id, v_request.to_club_id, current_date);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- F2: Prevent self-transfers (a club requesting a transfer to itself)
ALTER TABLE public.transfer_requests
  ADD CONSTRAINT no_self_transfer CHECK (from_club_id != to_club_id);
