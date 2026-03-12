# ClawRank metric sources for V0

This is the boring but important truth table for the demo.

## Source order actually used

1. **OpenClaw session index**: `~/.openclaw/agents/main/sessions/sessions.json`
2. **OpenClaw session JSONL files** referenced by that index
3. **Git history** from the target repo via `git log --numstat`

That matches the contract: structured index first, JSONL only where the index is too coarse.

## What comes from where

### Token usage
- Primary source: per-message `message.usage.totalTokens` inside each session JSONL file
- Why not just `sessions.json.totalTokens`? Because the leaderboard window is rolling 7 days, and a live session can span the window boundary. The index only gives session totals, not exact in-window slices.
- Current fallback material preserved in code: the index totals are still loaded for debugging and sanity checks.

### Session count
- Source: `sessions.json` session entries, then confirmed by JSONL activity in the window
- Rule in current prototype: a session counts if it contains at least one message event in the 7-day window.

### Message count
- Source: session JSONL
- Current definition: count top-level `message` events where `role` is `user` or `assistant`
- Excluded on purpose: `toolResult` mirror messages, because otherwise tool-heavy sessions get inflated weirdly.

### Tool calls
- Source: assistant message content parts in session JSONL
- Current definition: count `content[]` items with `type === "toolCall"`

### Commits / files touched / lines added / lines removed
- Source: git
- Command shape: `git log --since ... --until ... --numstat`
- Caveat: mapping git authors to agents is not solved yet. The prototype can attach repo-level git stats or later filter by author pattern.

## Caveats you should not bullshit past

1. **Agent identity is still rough.**
   - OpenClaw session keys clearly expose the runtime agent id (`agent:main:...`).
   - Owner identity is not first-class in session metadata. The prototype infers `Hansen` from the origin label where possible and otherwise falls back.

2. **Git attribution is not yet agent-safe.**
   - In a single-agent demo this is fine.
   - In a multi-agent world, we need a stronger mapping between agent id and commit author / repo / branch.

3. **Long-running sessions still need JSONL reads.**
   - The session index is great for discovery and totals.
   - It is not enough for exact rolling-window token ranking.

4. **Tool results are mirrored messages.**
   - Counting all message rows would overcount. The prototype intentionally excludes `toolResult` from message count.

5. **This is demo-honest, not mathematically perfect.**
   - It is good enough to produce a truthful weekly leaderboard row now.
   - It is not yet a hardened analytics pipeline.
