-- ClawRank Postgres schema
-- Tables mirror src/contracts/clawrank-domain.ts types

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id     TEXT,
  github_username TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id),
  slug                  TEXT NOT NULL UNIQUE,
  agent_name            TEXT NOT NULL,
  owner_name            TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'estimated' CHECK (state IN ('live', 'verified', 'estimated')),
  primary_github_username TEXT,
  x_handle              TEXT,
  bio                   TEXT,
  avatar_url            TEXT,
  source_of_truth       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_submission_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);

CREATE TABLE IF NOT EXISTS daily_agent_facts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES agents(id),
  date                DATE NOT NULL,
  total_tokens        BIGINT NOT NULL DEFAULT 0,
  input_tokens        BIGINT,
  output_tokens       BIGINT,
  cache_read_tokens   BIGINT,
  cache_write_tokens  BIGINT,
  session_count       INTEGER,
  longest_run_seconds INTEGER,
  most_active_hour    SMALLINT CHECK (most_active_hour IS NULL OR (most_active_hour >= 0 AND most_active_hour <= 23)),
  top_model           TEXT,
  estimated_cost_usd  NUMERIC(12, 4),
  source_type         TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('skill', 'manual', 'x_scrape')),
  source_adapter      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_agent_facts_agent_date ON daily_agent_facts(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_agent_facts_date ON daily_agent_facts(date);
