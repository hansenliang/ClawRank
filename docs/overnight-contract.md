# ClawRank Overnight Contract (V0)

## Locked decisions

- Package manager: pnpm
- Stack: Next.js + Vercel
- Product mode: demo-first
- Design direction: Claude Code / CLI / terminal / hacker aesthetic
- Default period: weekly
- Weekly definition: rolling last 7 days
- Ranking metric: token usage descending
- Supporting metrics: commits, files touched, lines added, lines removed, tool calls, message count, session count
- Data philosophy: raw measurable metrics first; no compound score in V0
- Identity pattern: agent-first (`AgentName by OwnerName`)
- Required surfaces: leaderboard page, share/detail page, OG image generation, compact text share

## Privacy and data access rules

- Agents may read OpenClaw files/logs as needed
- Agents must never write to OpenClaw files, logs, configs, session transcripts, or memory files
- All writes are limited to:
 1. Google Drive folder `AI Agent Leaderboard - Overnight Build`
 2. ClawRank repo
- Prefer the most structured / least invasive source first
- Do not copy secrets, tokens, auth material, or PII into docs, commits, logs, or chat

## Source preference order

1. Structured OpenClaw metadata / status / session index
2. Git metadata / git stats
3. Raw OpenClaw JSONL transcript parsing

## Minimum leaderboard row schema

```ts
export type PeriodType = 'weekly' | 'daily';

export interface LeaderboardEntry {
 agentName: string;
 ownerName: string;
 periodType: PeriodType;
 periodStart: string;
 periodEnd: string;
 tokenUsage: number;
 commits: number;
 filesTouched: number;
 linesAdded: number;
 linesRemoved: number;
 toolCalls: number;
 messageCount: number;
 sessionCount: number;
 shareUrl: string;
}
```

## Minimum share/detail shape

```ts
export interface ShareDetail {
 agentName: string;
 ownerName: string;
 periodType: PeriodType;
 periodStart: string;
 periodEnd: string;
 title: string;
 subtitle: string;
 tokenUsage: number;
 commits: number;
 filesTouched: number;
 linesAdded: number;
 linesRemoved: number;
 toolCalls: number;
 messageCount: number;
 sessionCount: number;
 topTools?: string[];
 notableOutputs?: string[];
 shareText: string;
 shareUrl: string;
}
```

## Required V0 flow

1. Parse/aggregate OpenClaw + git-derived metrics for rolling weekly window
2. Produce leaderboard rows sorted by token usage desc
3. Produce one share/detail artifact for an agent
4. Render leaderboard page and share page
5. Generate OG preview
6. Deploy on Vercel if reasonable; otherwise preserve a clean local demo and document blocker

## Truthfulness rules

- If token usage is unavailable, do not rank the row
- If a metric is partial or uncertain, label/document the limitation rather than estimating
- Prefer honest incompleteness over fake precision
