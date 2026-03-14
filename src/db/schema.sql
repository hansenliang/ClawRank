-- ClawRank Postgres schema (v7)
-- Tables mirror src/contracts/clawrank-domain.ts types
-- Provider-agnostic auth: external identities in linked_accounts, not users

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  default_agent_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  handle TEXT,
  display_name TEXT,
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id);

CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  slug TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'estimated' CHECK (state IN ('live', 'verified', 'estimated')),
  primary_github_username TEXT,
  x_handle TEXT,
  bio TEXT,
  avatar_url TEXT,
  source_of_truth TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_submission_at TIMESTAMPTZ,
  UNIQUE(user_id, slug)
);

-- Keep slug index for legacy single-slug lookups / ORDER BY
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_user_slug ON agents(user_id, slug);

CREATE TABLE IF NOT EXISTS daily_agent_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  date DATE NOT NULL,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  input_tokens BIGINT,
  output_tokens BIGINT,
  cache_read_tokens BIGINT,
  cache_write_tokens BIGINT,
  session_count INTEGER,
  longest_run_seconds INTEGER,
  most_active_hour SMALLINT CHECK (most_active_hour IS NULL OR (most_active_hour >= 0 AND most_active_hour <= 23)),
  top_model TEXT,
  estimated_cost_usd NUMERIC(12, 4),
  user_message_count INTEGER,
  assistant_message_count INTEGER,
  tool_call_count INTEGER,
  top_tools JSONB,
  models_used JSONB,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('skill', 'manual', 'x_scrape')),
  source_adapter TEXT,
  date_precision TEXT NOT NULL DEFAULT 'day' CHECK (date_precision IN ('day', 'cumulative')),
  commit_count INTEGER,
  lines_added INTEGER,
  lines_removed INTEGER,
  pr_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_agent_facts_agent_date ON daily_agent_facts(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_agent_facts_date ON daily_agent_facts(date);
