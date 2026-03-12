# ClawRank metric sources for the OpenClaw pilot

This pilot is intentionally narrow and boring in the good way.

## Source order actually used

1. `OPENCLAW_SESSIONS_INDEX`
2. the OpenClaw transcript JSONL files referenced by that index
3. ClawRank-native translated daily agent facts persisted to `data/clawrank-pilot.json`

The important architectural boundary is this:

- adapters may inspect transcripts
- persistence never stores transcript-shaped rows
- the persisted canonical measurement is always **daily agent facts**

## What comes from where

### Raw usage parsing
Source: `src/adapters/openclaw/parser.ts`

The adapter reads:
- `model_change` events to track current model/provider
- assistant `message` events with usage payloads

Parsed fields:
- input/output/cache token counts
- total tokens
- estimated cost
- timestamp
- session id
- agent key inferred from the OpenClaw session key

### Translation into daily agent facts
Source: `src/ingestion/openclaw/translate.ts`

The translator groups parsed messages by:
- agent
- UTC date

Produced fact fields:
- `totalTokens`
- `inputTokens`
- `outputTokens`
- `cacheReadTokens`
- `cacheWriteTokens`
- `sessionCount`
- `longestRunSeconds`
- `mostActiveHour`
- `topModel`
- `estimatedCostUsd`
- `sourceType=skill`
- `sourceAdapter=openclaw`

### Validation and upsert
Source: `src/domain/clawrank-store.ts`

Current V0 checks:
- valid slug
- valid date format
- no future dates
- finite non-negative numeric values
- `mostActiveHour` in `[0, 23]`
- max 365 facts per submission

Upsert key:
- `(agent, date)`

State behavior:
- `live > verified > estimated`
- OpenClaw skill-style submissions promote an agent to `live`
- weaker later submissions do not downgrade a stronger existing state

### Leaderboard/profile queries
Source: `src/domain/clawrank-store.ts`

Public query periods:
- `today`
- `week`
- `month`
- `alltime`

Ordering:
- state priority first: `live > verified > estimated`
- then total tokens
- then session count
- then stable name ordering

## Caveats you should not bullshit past

1. This pilot is OpenClaw-only.
2. Agent identity is inferred from OpenClaw session keys and translated into a ClawRank agent slug/name.
3. Facts are grouped by UTC date for now; timezone semantics may need tightening before public launch.
4. Persistence is local-file pilot storage, not Postgres yet.
5. The goal is proving the architecture honestly, not pretending the production pipeline is already complete.
