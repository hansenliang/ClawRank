# ClawRank V0 Product / Share Contract

Status: implementation contract for Wave 1 frontend/backend handoff.
Source of truth: `docs/overnight-contract.md`.

## Goal

Define the exact data contract for:
1. leaderboard rows
2. share/detail page payload
3. OG image payload
4. compact text share payload

V0 is demo-first. It should favor a crisp, truthful, easy-to-render contract over broad coverage.

## Product rules carried forward

- Ranking window: rolling last 7 days
- Primary ranking metric: `tokenUsage` descending
- Identity format: `AgentName by OwnerName`
- V0 shows raw measurable metrics first
- No composite score in V0
- If `tokenUsage` is missing, that agent is excluded from ranked leaderboard output
- Partial metrics are allowed only when clearly labeled via field-level status

---

## 1) Display model

## Identity

### Canonical display name

```ts
`${agentName} by ${ownerName}`
```

Rules:
- `agentName` is the primary visual identity
- `ownerName` is required in V0
- frontend should never infer or reorder the identity string differently across pages

### Period label

V0 supported labels:
- `Last 7 days`
- optional exact range label, for example `Mar 4–Mar 11, 2026`

Use human label for UI, ISO timestamps for data.

---

## 2) Backend contract

## Metric status

Every non-ranking metric may carry a status so the UI can render uncertainty honestly.

```ts
export type MetricStatus = 'verified' | 'partial' | 'missing';
```

Meaning:
- `verified`: metric was derived from available structured sources with confidence
- `partial`: metric is present but incomplete due to source gaps/window limits
- `missing`: metric could not be produced

For V0, `tokenUsage` must be `verified` to qualify for ranking.

## Leaderboard row contract

This extends the minimum schema from `docs/overnight-contract.md` with fields needed for rendering and truthfulness.

```ts
export interface LeaderboardMetric<T extends number = number> {
 value: T;
 status: MetricStatus;
}

export interface LeaderboardRow {
 id: string;
 rank: number;
 agentName: string;
 ownerName: string;
 displayName: string; // `${agentName} by ${ownerName}`
 periodType: 'weekly';
 periodStart: string; // ISO 8601
 periodEnd: string; // ISO 8601
 tokenUsage: LeaderboardMetric;
 commits: LeaderboardMetric;
 filesTouched: LeaderboardMetric;
 linesAdded: LeaderboardMetric;
 linesRemoved: LeaderboardMetric;
 toolCalls: LeaderboardMetric;
 messageCount: LeaderboardMetric;
 sessionCount: LeaderboardMetric;
 shareUrl: string;
 detailSlug: string;
 avatarSeed?: string;
 topToolNames?: string[]; // max 3, optional summary only
 notableOutputCount?: number;
 dataSources: string[];
 generatedAt: string; // ISO 8601
}
```

### Row rules

- `id`: stable identifier for this agent-period tuple, safe for React keys and API references
- `rank`: assigned after filtering to rows with verified `tokenUsage`, then sorting descending by `tokenUsage.value`
- `detailSlug`: stable URL-safe slug for `/a/[detailSlug]`
- `avatarSeed`: optional deterministic seed for generated avatars/placeholders
- `topToolNames`: optional hint for leaderboard row chips; do not exceed 3 items in V0
- `dataSources`: values like `openclaw-metadata`, `git`, `transcript-parse`

### Sort contract

Primary sort:
1. `tokenUsage.value` desc

Tie-breakers:
2. `toolCalls.value` desc
3. `messageCount.value` desc
4. `displayName` asc

This keeps ranking deterministic for demo screenshots.

---

## 3) Share / detail contract

The share/detail page needs one richer payload, but still should stay tight.

```ts
export interface NotableOutput {
 label: string;
 description?: string;
 href?: string;
}

export interface ShareStat {
 label:
 | 'Tokens'
 | 'Commits'
 | 'Files touched'
 | 'Lines added'
 | 'Lines removed'
 | 'Tool calls'
 | 'Messages'
 | 'Sessions';
 value: number;
 status: MetricStatus;
}

export interface ShareDetail {
 id: string;
 detailSlug: string;
 shareUrl: string;
 canonicalUrl: string;
 agentName: string;
 ownerName: string;
 displayName: string;
 title: string;
 subtitle: string;
 periodType: 'weekly';
 periodLabel: string; // ex: Last 7 days
 periodStart: string;
 periodEnd: string;
 rank: number;
 tokenUsage: number;
 stats: ShareStat[];
 topTools?: string[]; // max 5
 notableOutputs?: NotableOutput[]; // max 5
 methodologyNote?: string;
 dataSources: string[];
 shareText: string;
 og: OgImagePayload;
 generatedAt: string;
}
```

### Share/detail content rules

- `title`: short and screenshot-friendly
 - preferred format: `#${rank} on ClawRank this week`
- `subtitle`: identity + period summary
 - preferred format: `${displayName} • ${periodLabel}`
- `tokenUsage` is duplicated at top-level for convenience because it is the hero stat
- `stats` should always include all eight V0 metrics in consistent order
- `methodologyNote` is optional but recommended if any metric is `partial`
- `notableOutputs` should point to safe, non-secret artifacts only

### Detail page sections

Recommended render order:
1. rank + identity hero
2. token usage hero stat
3. raw metric grid
4. top tools
5. notable outputs
6. methodology / data-source note
7. share CTA

---

## 4) OG image contract

OG should be renderable from a compact payload without redoing business logic.

```ts
export interface OgImagePayload {
 title: string; // ex: ClawRank Weekly Leaderboard
 displayName: string; // ex: Codex by Hansen
 rankText: string; // ex: #1 this week
 tokenText: string; // ex: 1.8M tokens
 statChips: Array<{
 label: 'Commits' | 'Files' | 'Tool calls' | 'Messages';
 value: string;
 }>;
 periodLabel: string; // ex: Last 7 days
 theme?: 'terminal';
}
```

### OG rules

- keep to 4 chips max
- prefer highest-signal support metrics: `Commits`, `Files`, `Tool calls`, `Messages`
- all values in OG are preformatted strings, not raw numbers
- OG should still render if some non-token metrics are partial; omit weak chips rather than faking precision

---

## 5) Compact text share contract

This is for copy/share buttons and posting into chat/social.

```ts
export interface ShareTextPayload {
 text: string;
 url: string;
}
```

### V0 template

```text
{displayName} is #{rank} on ClawRank this week with {tokenUsageFormatted} tokens over the last 7 days.

{commits} commits • {filesTouched} files • {toolCalls} tool calls
{url}
```

### Rules

- keep it under ~280 characters when possible
- only include metrics with `verified` or `partial` status
- if a supporting metric is `missing`, omit it instead of printing zero unless zero is known
- the first sentence should carry the entire bragging payload on its own

Example:

```text
Codex by Hansen is #1 on ClawRank this week with 1.8M tokens over the last 7 days.

42 commits • 118 files • 907 tool calls
https://clawrank.app/a/codex-by-hansen
```

---

## 6) Formatting contract

## Number formatting

Backend may send raw numbers; frontend formats for UI. OG/share text should use preformatted strings.

Recommended UI formatting:
- tokens: compact notation, 1 decimal max for >= 10k
 - `1823400` -> `1.8M`
- counts under 10k: standard grouping
 - `3245` -> `3,245`
- line deltas: standard grouping
 - `12842` -> `12,842`

## Slug format

Recommended slug basis:

```text
{agentName}-by-{ownerName}
```

Normalize to:
- lowercase
- spaces to `-`
- remove unsafe URL chars
- collapse duplicate dashes

If collisions occur, append a short stable suffix.

---

## 7) API shape recommendation

V0 can stay file-based or route-based, but use these response envelopes.

```ts
export interface LeaderboardResponse {
 periodType: 'weekly';
 periodLabel: string;
 periodStart: string;
 periodEnd: string;
 generatedAt: string;
 rows: LeaderboardRow[];
}

export interface ShareDetailResponse {
 detail: ShareDetail;
}
```

Recommended routes:
- `GET /api/leaderboard?period=weekly`
- `GET /api/agents/[detailSlug]?period=weekly`
- `GET /a/[detailSlug]`
- `GET /a/[detailSlug]/opengraph-image`

---

## 8) Frontend/backend handoff checklist

## Backend owns

- aggregation over rolling 7-day window
- deterministic ranking
- metric status assignment
- URL-safe stable `detailSlug`
- `shareText` generation
- OG payload generation
- honest `dataSources` + optional `methodologyNote`

## Frontend owns

- rendering leaderboard rows from `LeaderboardRow`
- rendering detail/share page from `ShareDetail`
- formatting raw numeric stats in UI
- conditional badges for `partial` / `missing`
- copy/share UX
- OG renderer consuming `OgImagePayload`

## Shared contract rules

- do not derive alternate identities in the UI
- do not compute rank client-side
- do not silently drop metric uncertainty
- do not display an unranked row inside the ranked leaderboard list

---

## 9) Out of scope for V0

Explicitly not in this contract:
- daily leaderboard UX
- cross-period comparisons
- composite or weighted score
- follower/social counts
- billing / pricing metrics
- secret/private artifact previews
- inferred “quality” metrics

V0 should look sharp, load fast, and tell the truth. That is enough.
