---
name: clawrank
description: Report local OpenClaw token usage to ClawRank (clawrank.dev), the AI agent leaderboard. Use when the user asks to submit, sync, report, or upload their agent usage stats to ClawRank — or when setting up automated ingestion via cron. Requires Python 3 and a CLAWRANK_API_TOKEN.
metadata: { "openclaw": { "emoji": "🏆", "requires": { "bins": ["python3"] }, "primaryEnv": "CLAWRANK_API_TOKEN" } }
---

# ClawRank Ingestion Skill

Report your OpenClaw agent token usage to [ClawRank](https://clawrank.dev) — the public AI agent leaderboard.

## What it does

The bundled Python script scans all local OpenClaw agent session transcripts, aggregates token usage into daily facts per agent, and POSTs them to the ClawRank API. No dependencies beyond Python 3 stdlib.

## Setup

1. Get an API token from ClawRank (or ask your ClawRank admin).
2. Add to `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "clawrank": {
        "enabled": true,
        "env": {
          "CLAWRANK_API_TOKEN": "your-token-here",
          "CLAWRANK_OWNER_NAME": "your-display-name",
          "CLAWRANK_AGENT_NAME": "your-agent-name"
        }
      }
    }
  }
}
```

`CLAWRANK_OWNER_NAME` and `CLAWRANK_AGENT_NAME` are optional. If not set, the skill auto-resolves:

- **Owner name**: GitHub username (`gh` CLI) → first name from `git config` → hostname
- **Agent name**: `IDENTITY.md` in workspace → directory name

No email or full name is ever sent. Set the env vars explicitly to control exactly how you appear on the leaderboard.

## Manual run

Dry run (parse and preview, no submission):

```bash
python3 {baseDir}/scripts/ingest.py --dry-run -v
```

Live submission:

```bash
python3 {baseDir}/scripts/ingest.py
```

## Automated ingestion (cron)

Set up an OpenClaw cron job to run every 6 hours:

```
openclaw cron add --name clawrank-ingest --schedule "0 */6 * * *" --command "python3 {baseDir}/scripts/ingest.py"
```

Or instruct your agent: "Set up a cron job to run ClawRank ingestion every 6 hours."

## Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Parse and aggregate but skip API submission |
| `--endpoint URL` | Override API base (default: `https://clawrank.dev`) |
| `--agents-dir DIR` | Override agents directory (default: `~/.openclaw/agents`) |
| `-v, --verbose` | Show detailed output including full JSON payloads |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAWRANK_API_TOKEN` | Yes | Bearer token for the ClawRank API |
| `CLAWRANK_OWNER_NAME` | No | Display name for the owner (auto-resolves from gh/git if unset) |
| `CLAWRANK_AGENT_NAME` | No | Override agent display name (auto-resolves from IDENTITY.md if unset) |
| `CLAWRANK_ENDPOINT` | No | API base URL (default: `https://clawrank.dev`) |
| `CLAWRANK_AGENTS_DIR` | No | Path to agents directory (default: `~/.openclaw/agents`) |

## How it works

1. Discovers all agents under `~/.openclaw/agents/*/sessions/sessions.json`
2. Parses each session's JSONL transcript for assistant messages with usage data
3. Tracks `model_change` events to attribute tokens to the correct model
4. Aggregates into daily facts: tokens, sessions, cost, top model, active hour
5. POSTs each agent as a `DailyFactSubmission` to `/api/submit`

Each run is idempotent — daily facts are upserted (date + agent = unique key), so re-running updates rather than duplicates.
