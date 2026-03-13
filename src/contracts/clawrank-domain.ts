export type AgentState = 'live' | 'verified' | 'estimated';
export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'alltime';
export type SourceType = 'skill' | 'manual' | 'x_scrape';
export type MetricStatus = 'verified';

export type AuthProvider = 'github' | 'x' | 'google' | 'discord';

export interface UserRecord {
 id: string;
 displayName?: string | null;
 avatarUrl?: string | null;
 isAdmin: boolean;
 defaultAgentId?: string | null;
 createdAt: string;
 updatedAt: string;
}

export interface LinkedAccount {
 id: string;
 userId: string;
 provider: AuthProvider;
 providerUserId: string;
 handle?: string | null;
 displayName?: string | null;
 avatarUrl?: string | null;
 verified: boolean;
 verifiedAt?: string | null;
 metadataJson?: Record<string, unknown> | null;
 createdAt: string;
 updatedAt: string;
}

export interface ApiToken {
 id: string;
 userId: string;
 label?: string | null;
 lastUsedAt?: string | null;
 createdAt: string;
 revokedAt?: string | null;
}

export interface ApiTokenCreateResult {
 token: ApiToken;
 rawToken: string; // shown once at creation
}

export interface AgentRecord {
 id: string;
 userId?: string | null;
 slug: string;
 agentName: string;
 ownerName: string;
 state: AgentState;
 primaryGithubUsername?: string | null;
 xHandle?: string | null;
 bio?: string | null;
 avatarUrl?: string | null;
 sourceOfTruth?: string | null;
 createdAt: string;
 updatedAt: string;
 lastSubmissionAt?: string | null;
}

export interface DailyAgentFact {
 id: string;
 agentId: string;
 date: string;
 totalTokens: number;
 inputTokens?: number | null;
 outputTokens?: number | null;
 cacheReadTokens?: number | null;
 cacheWriteTokens?: number | null;
 sessionCount?: number | null;
 longestRunSeconds?: number | null;
 mostActiveHour?: number | null;
 topModel?: string | null;
 estimatedCostUsd?: number | null;
 userMessageCount?: number | null;
 assistantMessageCount?: number | null;
 toolCallCount?: number | null;
 topTools?: Record<string, number> | null;
 modelsUsed?: Record<string, number> | null;
 sourceType: SourceType;
 sourceAdapter?: string | null;
 createdAt: string;
 updatedAt: string;
}

export interface ClawRankStore {
 schemaVersion: 1;
 users: UserRecord[];
 agents: AgentRecord[];
 dailyAgentFacts: DailyAgentFact[];
}

export interface DailyAgentFactInput {
 date: string;
 totalTokens: number;
 inputTokens?: number | null;
 outputTokens?: number | null;
 cacheReadTokens?: number | null;
 cacheWriteTokens?: number | null;
 sessionCount?: number | null;
 longestRunSeconds?: number | null;
 mostActiveHour?: number | null;
 topModel?: string | null;
 estimatedCostUsd?: number | null;
 userMessageCount?: number | null;
 assistantMessageCount?: number | null;
 toolCallCount?: number | null;
 topTools?: Record<string, number> | null;
 modelsUsed?: Record<string, number> | null;
 sourceType: SourceType;
 sourceAdapter?: string | null;
}

export interface AgentUpsertInput {
 slug: string;
 agentName: string;
 ownerName: string;
 state?: AgentState;
 sourceOfTruth?: string | null;
 primaryGithubUsername?: string | null;
 xHandle?: string | null;
 bio?: string | null;
 avatarUrl?: string | null;
}

export interface DailyFactSubmission {
 agent: AgentUpsertInput;
 facts: DailyAgentFactInput[];
}

export type DerivedState = 'live' | 'verified' | 'estimated';

export interface LeaderboardRow {
 id: string;
 rank: number;
 detailSlug: string;
 agentName: string;
 ownerName: string;
 displayName: string;
 state: AgentState;
 derivedState: DerivedState;
 totalTokens: number;
 sessionCount: number;
 activeDays: number;
 longestRunSeconds: number;
 mostActiveHour?: number | null;
 topModel?: string | null;
 estimatedCostUsd?: number | null;
 toolCallCount: number;
 userMessageCount: number;
 topToolNames: string[];
 sourceTypes: SourceType[];
 sourceAdapters: string[];
 lastSubmissionAt?: string | null;
}

export interface LeaderboardResponse {
 period: LeaderboardPeriod;
 periodLabel: string;
 periodStart: string | null;
 periodEnd: string | null;
 generatedAt: string;
 rows: LeaderboardRow[];
}

export interface ShareStat {
 label:
 | 'Tokens'
 | 'Sessions'
 | 'Active days'
 | 'Tool calls'
 | 'User messages'
 | 'Assistant turns'
 | 'Top model'
 | 'Estimated cost';
 value: number;
 status: MetricStatus;
 detail?: string | null;
}

export interface AgentPeriodRollup {
 period: LeaderboardPeriod;
 totalTokens: number;
 sessionCount: number;
 activeDays: number;
}

export interface AgentDetail {
 id: string;
 detailSlug: string;
 agentName: string;
 ownerName: string;
 displayName: string;
 state: AgentState;
 title: string;
 subtitle: string;
 rank: number;
 tokenUsage: number;
 period: LeaderboardPeriod;
 periodLabel: string;
 periodStart: string | null;
 periodEnd: string | null;
 stats: ShareStat[];
 topModel?: string | null;
 lastSubmissionAt?: string | null;
 sourceTypes: SourceType[];
 sourceAdapters: string[];
 rollups: AgentPeriodRollup[];
 dailyFacts: DailyAgentFact[];
 methodologyNote?: string;
 generatedAt: string;
}

export interface ShareDetailResponse {
 detail: AgentDetail;
}

export interface IngestOpenClawResult {
 indexPath: string;
 parsedMessages: number;
 translatedFacts: number;
 agentCount: number;
 upsertedFacts: number;
 agentSlugs: string[];
 storePath: string;
}
