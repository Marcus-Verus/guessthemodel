-- Migration 003: Email signups table for daily battle notifications
CREATE TABLE IF NOT EXISTS email_signups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (anon insert only, no reads)
CREATE POLICY "anyone can sign up"
  ON email_signups FOR INSERT TO anon
  WITH CHECK (true);
