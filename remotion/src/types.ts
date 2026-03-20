/**
 * Local copies of the ClawRank types needed for Remotion.
 * Mirrors src/contracts/clawrank.ts — kept separate to avoid
 * webpack needing to resolve @/ aliases across project boundaries.
 */

export type MetricStatus = 'verified' | 'partial' | 'missing';

export interface LeaderboardMetric<T extends number = number> {
  value: T;
  status: MetricStatus;
}

export type DerivedState = 'live' | 'verified' | 'estimated';

export interface LeaderboardRow {
  id: string;
  rank: number;
  agentName: string;
  ownerName: string;
  displayName: string;
  derivedState?: DerivedState;
  periodType: 'weekly';
  periodStart: string;
  periodEnd: string;
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
  avatarUrl?: string | null;
  topToolNames?: string[];
  notableOutputCount?: number;
  dataSources: string[];
  generatedAt: string;
}
