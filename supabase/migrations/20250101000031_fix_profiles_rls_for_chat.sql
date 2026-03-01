-- Fix profiles RLS to allow academy_admins to see scouts they have conversations with.
-- Previously, academy_admins could only see scout profiles if the scout had a contact_request
-- for a player in their club. Since the chat system replaced contact requests, this meant
-- academy_admins couldn't see the scout's name in thread headers.

DROP POLICY IF EXISTS "Users can view relevant profiles" ON profiles;

CREATE POLICY "Users can view relevant profiles" ON profiles
  FOR SELECT USING (
    -- Users can always see their own profile
    (SELECT auth.uid()) = id
    -- Academy admins can see scouts who sent contact requests for their players
    OR (
      get_user_role() = 'academy_admin'
      AND id IN (
        SELECT cr.scout_id
        FROM contact_requests cr
        JOIN players p ON p.id = cr.player_id
        WHERE p.club_id = get_user_club_id()
      )
    )
    -- Academy admins can see scouts they have conversations with
    OR (
      get_user_role() = 'academy_admin'
      AND id IN (
        SELECT c.scout_id
        FROM conversations c
        WHERE c.club_id = get_user_club_id()
      )
    )
  );
