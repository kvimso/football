-- Add subject field to contact_messages for routing inquiries
ALTER TABLE contact_messages ADD COLUMN subject text NOT NULL DEFAULT 'general';
