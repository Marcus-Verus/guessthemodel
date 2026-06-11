-- Migration 007: Survival Mode
--
-- Endless sudden-death Human-or-AI. Cards come from a server-side pool
-- (verified human texts + pre-generated AI impostors). Runs are tracked
-- server-side so the answer never reaches the browser before the guess.
--
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS pool_items (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  theme       text NOT NULL,
  text        text NOT NULL UNIQUE,
  source      text NOT NULL CHECK (source IN ('human', 'ai')),
  -- attribution shown on reveal: "Mark Twain" or "GPT-5.5"
  label       text NOT NULL,
  model_id    text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survival_runs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint   text NOT NULL,
  streak        int DEFAULT 0,
  alive         boolean DEFAULT true,
  -- the unanswered item currently served to this run
  current_item  uuid,
  -- [{ id, guess, correct }, ...] — also our per-item detectability data
  seen          jsonb NOT NULL DEFAULT '[]'::jsonb,
  run_date      date DEFAULT (now()::date),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pool_items_active_idx   ON pool_items(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS survival_runs_date_idx  ON survival_runs(run_date);
CREATE INDEX IF NOT EXISTS survival_runs_fp_idx    ON survival_runs(fingerprint);

-- server-only tables: RLS on, no public policies (service role bypasses)
ALTER TABLE pool_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_runs ENABLE ROW LEVEL SECURITY;
