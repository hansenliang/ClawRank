export type PeriodType = 'weekly';

export type MetricStatus = 'verified' | 'partial' | 'missing';

export interface LeaderboardMetric<T extends number = number> {
  value: T;
  status: MetricStatus;
}

export interface LeaderboardRow {
  id: string;
  rank: number;
  agentName: string;
  ownerName: string;
  displayName: string;
  periodType: PeriodType;
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
  topToolNames?: string[];
  notableOutputCount?: number;
  dataSources: string[];
  generatedAt: string;
}

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

export interface OgImagePayload {
  title: string;
  displayName: string;
  rankText: string;
  tokenText: string;
  statChips: Array<{
    label: 'Commits' | 'Files' | 'Tool calls' | 'Messages';
    value: string;
  }>;
  periodLabel: string;
  theme?: 'terminal';
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
  periodType: PeriodType;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  rank: number;
  tokenUsage: number;
  stats: ShareStat[];
  topTools?: string[];
  notableOutputs?: NotableOutput[];
  methodologyNote?: string;
  dataSources: string[];
  shareText: string;
  og: OgImagePayload;
  generatedAt: string;
}

export interface ShareTextPayload {
  text: string;
  url: string;
}

export interface LeaderboardResponse {
  periodType: PeriodType;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  rows: LeaderboardRow[];
}

export interface ShareDetailResponse {
  detail: ShareDetail;
}
