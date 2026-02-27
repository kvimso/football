-- Add expiry and response message to contact requests
ALTER TABLE contact_requests
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN response_message text;

-- Backfill: set expires_at for existing pending requests (14 days from created_at)
UPDATE contact_requests
  SET expires_at = created_at + interval '14 days'
  WHERE status = 'pending' AND expires_at IS NULL;

-- Default for new rows
ALTER TABLE contact_requests
  ALTER COLUMN expires_at SET DEFAULT now() + interval '14 days';
