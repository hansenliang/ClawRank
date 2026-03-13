-- Migration v6: Add GitHub metrics columns to daily_agent_facts
-- These track per-day commit and PR activity for agents using the ClawRank skill
-- with gh CLI configured. Merge commits (>1 parent) are excluded by the ingestion script.
-- All four columns are nullable — git metrics are additive and optional.

ALTER TABLE daily_agent_facts
  ADD COLUMN IF NOT EXISTS commit_count INTEGER,
  ADD COLUMN IF NOT EXISTS lines_added INTEGER,
  ADD COLUMN IF NOT EXISTS lines_removed INTEGER,
  ADD COLUMN IF NOT EXISTS pr_count INTEGER;
