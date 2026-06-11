-- GuessTheModel — Supabase schema
-- Run this in your Supabase SQL editor for a fresh setup

-- ──────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS battles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt      text NOT NULL,
  category    text NOT NULL CHECK (category IN ('coding', 'career', 'writing', 'research', 'roast', 'creator', 'meta', 'opinion')),
  -- outputs: { modelA: { text, model_id }, modelB: { text, model_id }, modelC: { text, model_id } }
  -- Always Claude (A), ChatGPT (B), Gemini (C). model names are only exposed server-side.
  outputs     jsonb NOT NULL,
  is_daily    boolean DEFAULT false,
  battle_date date,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id          uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  -- favorite response, canonical slot (A..E)
  choice             text NOT NULL CHECK (choice IN ('A', 'B', 'C', 'D', 'E', 'all_bad')),
  model_guess        text CHECK (model_guess IN ('chatgpt', 'claude', 'gemini', 'grok', 'perplexity')),
  crowd_prediction   text CHECK (crowd_prediction IN ('chatgpt', 'claude', 'gemini', 'grok', 'perplexity')),
  -- full guess map keyed by canonical slot: { "A": "claude", "B": "grok", ... }
  guesses            jsonb,
  -- number of correct tags (0..5); NULL for legacy votes
  score              int,
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
