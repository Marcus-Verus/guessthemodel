-- GuessTheModel — Supabase schema
-- Run this in your Supabase SQL editor

-- ──────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS battles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt      text NOT NULL,
  category    text NOT NULL CHECK (category IN ('coding', 'career', 'writing', 'research', 'roast', 'creator')),
  -- outputs: { modelA: { text, model_id }, modelB: { text, model_id } }
  -- model names are only exposed server-side; clients receive only the text fields
  outputs     jsonb NOT NULL,
  is_daily    boolean DEFAULT false,
  battle_date date,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id          uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  choice             text NOT NULL CHECK (choice IN ('A', 'B', 'both_bad')),
  model_guess        text CHECK (model_guess IN ('chatgpt', 'claude', 'gemini', 'grok', 'perplexity')),
  crowd_prediction   text CHECK (crowd_prediction IN ('chatgpt', 'claude', 'gemini', 'grok', 'perplexity')),
  fingerprint        text NOT NULL,
  created_at         timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────

CREATE INDEX IF NOT EXISTS battles_battle_date_idx  ON battles(battle_date);
CREATE INDEX IF NOT EXISTS battles_category_idx     ON battles(category);
CREATE INDEX IF NOT EXISTS battles_created_at_idx   ON battles(created_at DESC);
CREATE INDEX IF NOT EXISTS battles_is_daily_idx     ON battles(is_daily) WHERE is_daily = true;

-- One vote per fingerprint per battle (enforced at DB level)
CREATE UNIQUE INDEX IF NOT EXISTS votes_battle_fp_idx ON votes(battle_id, fingerprint);

CREATE INDEX IF NOT EXISTS votes_battle_id_idx   ON votes(battle_id);
CREATE INDEX IF NOT EXISTS votes_fingerprint_idx ON votes(fingerprint);
CREATE INDEX IF NOT EXISTS votes_created_at_idx  ON votes(created_at DESC);

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────

ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes   ENABLE ROW LEVEL SECURITY;

-- battles: anyone can read (model_id fields are stripped server-side before reaching clients)
CREATE POLICY "battles_public_read"
  ON battles FOR SELECT USING (true);

-- votes: public read for aggregate stats, anyone can insert
CREATE POLICY "votes_public_read"
  ON votes FOR SELECT USING (true);

CREATE POLICY "votes_public_insert"
  ON votes FOR INSERT WITH CHECK (true);

-- ──────────────────────────────────────────
-- SAMPLE DATA (optional — delete before prod)
-- ──────────────────────────────────────────

-- INSERT INTO battles (prompt, category, outputs, is_daily, battle_date)
-- VALUES (
--   'Explain recursion like I''m 10 years old.',
--   'coding',
--   '{
--     "modelA": {
--       "text": "Imagine you have a set of Russian dolls...",
--       "model_id": "anthropic/claude-sonnet-4-5"
--     },
--     "modelB": {
--       "text": "Think of recursion like looking in a mirror with another mirror behind you...",
--       "model_id": "openai/gpt-4o"
--     }
--   }',
--   true,
--   CURRENT_DATE
-- );
