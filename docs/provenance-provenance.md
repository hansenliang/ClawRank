# provenance for the OpenClaw pilot

This pilot intentionally reuses **ideas only in plumbing layers**.

## Allowed reuse in this repo

### OpenClaw adapter compatibility patterns
File: `src/adapters/openclaw/parser.ts`

Adapted concepts:
- resolving session transcript paths from the OpenClaw session index
- tracking `model_change` events while parsing transcripts
- extracting assistant usage rows only

Reference implementation reviewed:
- repo: `crates/core/src/sessions/openclaw.rs`
- Commit inspected during this pilot: `d438a7d9514a3af4ff2a4e1ae20ce6b370720e5b`

How ClawRank differs:
- rewritten in TypeScript
- no unified-message model copied over
- output is ClawRank adapter messages, then ClawRank daily agent facts

## Explicit non-reuse

The following are **not** reused from and should stay ClawRank-native:

- ranked entity ontology
- owner/agent relationship model
- state model (`live | verified | estimated`)
- persistence schema
- leaderboard semantics
- profile/query API contracts
- frontend/UI

## Design rule

If code starts to import assumptions above the adapter/plumbing layer, it is outside the approved reuse boundary and should be rejected.
