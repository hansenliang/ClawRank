import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
 AgentDetail,
 AgentRecord,
 AgentState,
 AgentUpsertInput,
 ClawRankStore,
 DailyAgentFact,
 DailyAgentFactInput,
 DailyFactSubmission,
 DerivedState,
 LeaderboardPeriod,
 LeaderboardResponse,
 LeaderboardRow,
 ShareStat,
 SourceType,
} from '@/src/contracts/clawrank-domain';
import { expandHomePath } from '@/src/lib/paths';

const EMPTY_STORE: ClawRankStore = {
 schemaVersion: 1,
 users: [],
 agents: [],
 dailyAgentFacts: [],
};

const STATE_PRIORITY: Record<AgentState, number> = {
 live: 3,
 verified: 2,
 estimated: 1,
};

const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,127}$/;
const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;

function strongerState(left: AgentState, right: AgentState): AgentState {
 return STATE_PRIORITY[left] >= STATE_PRIORITY[right] ? left : right;
}

export function getStorePath(): string {
 return expandHomePath(process.env.CLAWRANK_PILOT_STORE_PATH || path.join(process.cwd(), 'data', 'clawrank-pilot.json'));
}

export function readStore(storePath = getStorePath()): ClawRankStore {
 if (!fs.existsSync(storePath)) {
 return structuredClone(EMPTY_STORE);
 }

 const raw = fs.readFileSync(storePath, 'utf8');
 if (!raw.trim()) {
 return structuredClone(EMPTY_STORE);
 }

 const parsed = JSON.parse(raw) as Partial<ClawRankStore>;
 return {
 schemaVersion: 1,
 users: parsed.users || [],
 agents: parsed.agents || [],
 dailyAgentFacts: parsed.dailyAgentFacts || [],
 };
}

export function writeStore(store: ClawRankStore, storePath = getStorePath()): void {
 fs.mkdirSync(path.dirname(storePath), { recursive: true });
 fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function assertSlug(slug: string): void {
 if (!VALID_SLUG.test(slug)) {
 throw new Error(`Invalid agent slug: ${slug}`);
 }
}

function assertDate(date: string): void {
 if (!VALID_DATE.test(date)) {
 throw new Error(`Invalid fact date: ${date}`);
 }
}

export function validateDailyFactSubmission(submission: DailyFactSubmission): string[] {
 const errors: string[] = [];
 const today = new Date().toISOString().slice(0, 10);

 if (!submission?.agent?.slug) {
 errors.push('agent.slug is required');
 } else if (!VALID_SLUG.test(submission.agent.slug)) {
 errors.push(`agent.slug is invalid: ${submission.agent.slug}`);
 }

 if (!submission?.agent?.agentName?.trim()) {
 errors.push('agent.agentName is required');
 }

 if (!submission?.agent?.ownerName?.trim()) {
 errors.push('agent.ownerName is required');
 }

 if (!submission?.facts?.length) {
 errors.push('facts must contain at least one daily fact');
 return errors;
 }

 if (submission.facts.length > 365) {
 errors.push(`facts exceeds max batch size of 365: ${submission.facts.length}`);
 }

 submission.facts.forEach((fact, index) => {
 if (!VALID_DATE.test(fact.date)) {
 errors.push(`facts[${index}].date must be YYYY-MM-DD`);
 } else if (fact.date > today) {
 errors.push(`facts[${index}].date cannot be in the future: ${fact.date}`);
 }

 const numericFields: Array<[keyof DailyAgentFactInput, number | null | undefined]> = [
 ['totalTokens', fact.totalTokens],
 ['inputTokens', fact.inputTokens],
 ['outputTokens', fact.outputTokens],
 ['cacheReadTokens', fact.cacheReadTokens],
 ['cacheWriteTokens', fact.cacheWriteTokens],
 ['sessionCount', fact.sessionCount],
 ['longestRunSeconds', fact.longestRunSeconds],
 ['mostActiveHour', fact.mostActiveHour],
 ['estimatedCostUsd', fact.estimatedCostUsd],
 ['commitCount', fact.commitCount],
 ['filesTouched', fact.filesTouched],
 ['linesAdded', fact.linesAdded],
 ['linesRemoved', fact.linesRemoved],
 ['prCount', fact.prCount],
 ];

 for (const [field, value] of numericFields) {
 if (value == null) continue;
 if (!Number.isFinite(value) || value < 0) {
 errors.push(`facts[${index}].${field} must be a finite non-negative number`);
 }
 }

 if (fact.mostActiveHour != null && (fact.mostActiveHour < 0 || fact.mostActiveHour > 23)) {
 errors.push(`facts[${index}].mostActiveHour must be between 0 and 23`);
 }
 });

 return errors;
}

export function upsertAgent(store: ClawRankStore, input: AgentUpsertInput, now = new Date().toISOString()): AgentRecord {
 assertSlug(input.slug);

 const existing = store.agents.find((agent) => agent.slug === input.slug);
 if (existing) {
 existing.agentName = input.agentName;
 existing.ownerName = input.ownerName;
 existing.state = strongerState(existing.state, input.state);
 existing.sourceOfTruth = input.sourceOfTruth ?? existing.sourceOfTruth ?? null;
 existing.primaryGithubUsername = input.primaryGithubUsername ?? existing.primaryGithubUsername ?? null;
 existing.xHandle = input.xHandle ?? existing.xHandle ?? null;
 existing.bio = input.bio ?? existing.bio ?? null;
 existing.avatarUrl = input.avatarUrl ?? existing.avatarUrl ?? null;
 existing.updatedAt = now;
 return existing;
 }

 const created: AgentRecord = {
 id: randomUUID(),
 userId: null,
 slug: input.slug,
 agentName: input.agentName,
 ownerName: input.ownerName,
 state: input.state,
 primaryGithubUsername: input.primaryGithubUsername ?? null,
 xHandle: input.xHandle ?? null,
 bio: input.bio ?? null,
 avatarUrl: input.avatarUrl ?? null,
 sourceOfTruth: input.sourceOfTruth ?? null,
 createdAt: now,
 updatedAt: now,
 lastSubmissionAt: null,
 };

 store.agents.push(created);
 return created;
}

export function submitDailyFactSubmission(
 store: ClawRankStore,
 submission: DailyFactSubmission,
 now = new Date().toISOString(),
): { agent: AgentRecord; upsertedFacts: number } {
 const errors = validateDailyFactSubmission(submission);
 if (errors.length) {
 throw new Error(`Invalid daily fact submission: ${errors.join('; ')}`);
 }

 const agent = upsertAgent(store, submission.agent, now);
 let upsertedFacts = 0;

 for (const fact of submission.facts) {
 assertDate(fact.date);

 const existing = store.dailyAgentFacts.find((row) => row.agentId === agent.id && row.date === fact.date);
 if (existing) {
 existing.totalTokens = fact.totalTokens;
 existing.inputTokens = fact.inputTokens ?? null;
 existing.outputTokens = fact.outputTokens ?? null;
 existing.cacheReadTokens = fact.cacheReadTokens ?? null;
 existing.cacheWriteTokens = fact.cacheWriteTokens ?? null;
 existing.sessionCount = fact.sessionCount ?? null;
 existing.longestRunSeconds = fact.longestRunSeconds ?? null;
 existing.mostActiveHour = fact.mostActiveHour ?? null;
 existing.topModel = fact.topModel ?? null;
 existing.estimatedCostUsd = fact.estimatedCostUsd ?? null;
 existing.commitCount = fact.commitCount ?? existing.commitCount ?? null;
 existing.filesTouched = fact.filesTouched ?? existing.filesTouched ?? null;
 existing.linesAdded = fact.linesAdded ?? existing.linesAdded ?? null;
 existing.linesRemoved = fact.linesRemoved ?? existing.linesRemoved ?? null;
 existing.prCount = fact.prCount ?? existing.prCount ?? null;
 existing.sourceType = fact.sourceType;
 existing.sourceAdapter = fact.sourceAdapter ?? null;
 existing.datePrecision = fact.datePrecision ?? 'day';
 existing.updatedAt = now;
 } else {
 const created: DailyAgentFact = {
 id: randomUUID(),
 agentId: agent.id,
 date: fact.date,
 totalTokens: fact.totalTokens,
 inputTokens: fact.inputTokens ?? null,
 outputTokens: fact.outputTokens ?? null,
 cacheReadTokens: fact.cacheReadTokens ?? null,
 cacheWriteTokens: fact.cacheWriteTokens ?? null,
 sessionCount: fact.sessionCount ?? null,
 longestRunSeconds: fact.longestRunSeconds ?? null,
 mostActiveHour: fact.mostActiveHour ?? null,
 topModel: fact.topModel ?? null,
 estimatedCostUsd: fact.estimatedCostUsd ?? null,
 commitCount: fact.commitCount ?? null,
 filesTouched: fact.filesTouched ?? null,
 linesAdded: fact.linesAdded ?? null,
 linesRemoved: fact.linesRemoved ?? null,
 prCount: fact.prCount ?? null,
 sourceType: fact.sourceType,
 sourceAdapter: fact.sourceAdapter ?? null,
 datePrecision: fact.datePrecision ?? 'day',
 createdAt: now,
 updatedAt: now,
 };
 store.dailyAgentFacts.push(created);
 }
 upsertedFacts += 1;
 }

 agent.lastSubmissionAt = now;
 agent.updatedAt = now;
 if (submission.facts.some((fact) => fact.sourceType === 'skill')) {
 agent.state = strongerState(agent.state, 'live');
 }

 return { agent, upsertedFacts };
}

function startOfUtcDay(input: Date): Date {
 return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

function addUtcDays(input: Date, days: number): Date {
 return new Date(input.getTime() + days * 24 * 60 * 60 * 1000);
}

function periodRange(period: LeaderboardPeriod, now = new Date()): { start: string | null; endExclusive: string | null; label: string } {
 const dayStart = startOfUtcDay(now);
 const endExclusive = addUtcDays(dayStart, 1).toISOString().slice(0, 10);

 if (period === 'alltime') {
 return { start: null, endExclusive: null, label: 'All Time' };
 }

 if (period === 'today') {
 return { start: dayStart.toISOString().slice(0, 10), endExclusive, label: 'Today' };
 }

 if (period === 'week') {
 return { start: addUtcDays(dayStart, -6).toISOString().slice(0, 10), endExclusive, label: 'Last 7 Days' };
 }

 return { start: addUtcDays(dayStart, -29).toISOString().slice(0, 10), endExclusive, label: 'Last 30 Days' };
}

function withinPeriod(date: string, period: LeaderboardPeriod, now = new Date()): boolean {
 const range = periodRange(period, now);
 if (!range.start || !range.endExclusive) return true;
 return date >= range.start && date < range.endExclusive;
}

function uniq<T>(items: T[]): T[] {
 return [...new Set(items)];
}

function deriveStateFromFacts(
 agent: { userId?: string | null },
 allFacts: DailyAgentFact[],
 now: Date,
): DerivedState {
 const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
 const hasRecentSkillFact = allFacts.some((f) => f.sourceType === 'skill' && f.date >= sevenDaysAgo);
 if (hasRecentSkillFact) return 'live';
 const hasAnySkillFact = allFacts.some((f) => f.sourceType === 'skill');
 if (agent.userId && hasAnySkillFact) return 'verified';
 return 'estimated';
}

function aggregateLeaderboardRow(agent: AgentRecord, facts: DailyAgentFact[], allFacts: DailyAgentFact[], now: Date): LeaderboardRow {
 const totalTokens = facts.reduce((sum, fact) => sum + fact.totalTokens, 0);
 const sessionCount = facts.reduce((sum, fact) => sum + (fact.sessionCount || 0), 0);
 const activeDays = facts.filter((fact) => fact.totalTokens > 0).length;
 const longestRunSeconds = facts.reduce((max, fact) => Math.max(max, fact.longestRunSeconds || 0), 0);

 const modelTotals = new Map<string, number>();
 const hourTotals = new Map<number, number>();
 const toolTotals = new Map<string, number>();
 const sourceTypes = uniq(facts.map((fact) => fact.sourceType));
 const sourceAdapters = uniq(facts.map((fact) => fact.sourceAdapter || '').filter(Boolean));

 let estimatedCostUsd = 0;
 let toolCallCount = 0;
 let userMessageCount = 0;
 let commitCount = 0;
 let filesTouched = 0;
 let linesAdded = 0;
 let linesRemoved = 0;
 let prCount = 0;
 for (const fact of facts) {
 if (fact.topModel) {
 modelTotals.set(fact.topModel, (modelTotals.get(fact.topModel) || 0) + fact.totalTokens);
 }
 if (typeof fact.mostActiveHour === 'number') {
 hourTotals.set(fact.mostActiveHour, (hourTotals.get(fact.mostActiveHour) || 0) + fact.totalTokens);
 }
 estimatedCostUsd += fact.estimatedCostUsd || 0;
 toolCallCount += fact.toolCallCount || 0;
 userMessageCount += fact.userMessageCount || 0;
 commitCount += fact.commitCount || 0;
 filesTouched += fact.filesTouched || 0;
 linesAdded += fact.linesAdded || 0;
 linesRemoved += fact.linesRemoved || 0;
 prCount += fact.prCount || 0;
 if (fact.topTools && typeof fact.topTools === 'object') {
 for (const [name, count] of Object.entries(fact.topTools)) {
 toolTotals.set(name, (toolTotals.get(name) || 0) + (count as number));
 }
 }
 }

 const topModel = [...modelTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
 const mostActiveHour = [...hourTotals.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
 const topToolNames = [...toolTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

 // Derive state from ALL facts (not just period-filtered)
 const derivedState = deriveStateFromFacts({ userId: agent.userId }, allFacts, now);

 return {
 id: agent.id,
 rank: 0,
 detailSlug: agent.slug,
 agentName: agent.agentName,
 ownerName: agent.ownerName,
 displayName: `${agent.agentName} by ${agent.ownerName}`,
 avatarUrl: agent.avatarUrl ?? null,
 state: agent.state,
 derivedState,
 totalTokens,
 sessionCount,
 activeDays,
 longestRunSeconds,
 mostActiveHour,
 topModel,
 estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
 toolCallCount,
 userMessageCount,
 commitCount,
 filesTouched,
 linesAdded,
 linesRemoved,
 prCount,
 topToolNames,
 sourceTypes,
 sourceAdapters,
 lastSubmissionAt: agent.lastSubmissionAt || null,
 };
}

export function getLeaderboardResponse(store: ClawRankStore, period: LeaderboardPeriod = 'alltime', now = new Date()): LeaderboardResponse {
 const isPeriodFiltered = period !== 'alltime';
 const filteredFacts = store.dailyAgentFacts.filter((fact) => {
 if (!withinPeriod(fact.date, period, now)) return false;
 // Exclude cumulative facts from period-filtered views
 if (isPeriodFiltered && fact.datePrecision === 'cumulative') return false;
 return true;
 });
 const factsByAgent = new Map<string, DailyAgentFact[]>();

 for (const fact of filteredFacts) {
 const bucket = factsByAgent.get(fact.agentId) || [];
 bucket.push(fact);
 factsByAgent.set(fact.agentId, bucket);
 }

 // Build map of ALL facts per agent for state derivation
 const allFactsByAgent = new Map<string, DailyAgentFact[]>();
 for (const fact of store.dailyAgentFacts) {
 const bucket = allFactsByAgent.get(fact.agentId) || [];
 bucket.push(fact);
 allFactsByAgent.set(fact.agentId, bucket);
 }

 const rows = store.agents
 .map((agent) => ({ agent, facts: factsByAgent.get(agent.id) || [], allFacts: allFactsByAgent.get(agent.id) || [] }))
 .filter(({ facts }) => facts.length > 0)
 .map(({ agent, facts, allFacts }) => aggregateLeaderboardRow(agent, facts, allFacts, now))
 .sort((a, b) => {
 return (
 b.totalTokens - a.totalTokens ||
 b.sessionCount - a.sessionCount ||
 a.displayName.localeCompare(b.displayName)
 );
 })
 .map((row, index) => ({ ...row, rank: index + 1 }));

 const range = periodRange(period, now);

 return {
 period,
 periodLabel: range.label,
 periodStart: range.start,
 periodEnd: range.endExclusive ? addUtcDays(new Date(`${range.endExclusive}T00:00:00.000Z`), -1).toISOString().slice(0, 10) : null,
 generatedAt: now.toISOString(),
 rows,
 };
}

function stat(label: ShareStat['label'], value: number, detail?: string | null): ShareStat {
 return { label, value, status: 'verified', detail: detail ?? null };
}

function getRollup(store: ClawRankStore, agentId: string, period: LeaderboardPeriod, now = new Date()) {
 const facts = store.dailyAgentFacts.filter((fact) => fact.agentId === agentId && withinPeriod(fact.date, period, now));
 return {
 period,
 totalTokens: facts.reduce((sum, fact) => sum + fact.totalTokens, 0),
 sessionCount: facts.reduce((sum, fact) => sum + (fact.sessionCount || 0), 0),
 activeDays: facts.filter((fact) => fact.totalTokens > 0).length,
 };
}

export function getAgentDetail(store: ClawRankStore, slug: string, period: LeaderboardPeriod = 'alltime', now = new Date()): AgentDetail | null {
 assertSlug(slug);
 const agent = store.agents.find((row) => row.slug === slug);
 if (!agent) return null;

 const leaderboard = getLeaderboardResponse(store, period, now);
 const row = leaderboard.rows.find((entry) => entry.detailSlug === slug);
 const facts = store.dailyAgentFacts
 .filter((fact) => fact.agentId === agent.id)
 .sort((a, b) => b.date.localeCompare(a.date));

 const periodFacts = facts.filter((fact) => withinPeriod(fact.date, period, now));
 const totalToolCalls = periodFacts.reduce((sum, fact) => sum + (fact.toolCallCount || 0), 0);
 const totalUserMessages = periodFacts.reduce((sum, fact) => sum + (fact.userMessageCount || 0), 0);
 const totalAssistantMessages = periodFacts.reduce((sum, fact) => sum + (fact.assistantMessageCount || 0), 0);
 const totalCommits = periodFacts.reduce((sum, fact) => sum + (fact.commitCount || 0), 0);
 const totalLinesAdded = periodFacts.reduce((sum, fact) => sum + (fact.linesAdded || 0), 0);
 const totalLinesRemoved = periodFacts.reduce((sum, fact) => sum + (fact.linesRemoved || 0), 0);
 const totalPRs = periodFacts.reduce((sum, fact) => sum + (fact.prCount || 0), 0);

 // Aggregate top tools across all period facts
 const toolTotals = new Map<string, number>();
 for (const fact of periodFacts) {
 if (fact.topTools && typeof fact.topTools === 'object') {
 for (const [name, count] of Object.entries(fact.topTools)) {
 toolTotals.set(name, (toolTotals.get(name) || 0) + (count as number));
 }
 }
 }
 const topToolName = [...toolTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

 return {
 id: agent.id,
 detailSlug: agent.slug,
 agentName: agent.agentName,
 ownerName: agent.ownerName,
 displayName: `${agent.agentName} by ${agent.ownerName}`,
 state: agent.state,
 derivedState: deriveStateFromFacts({ userId: agent.userId }, facts, now),
 title: `${agent.agentName} on ClawRank`,
 subtitle: `${leaderboard.periodLabel} • ${agent.state}`,
 rank: row?.rank || 0,
 tokenUsage: row?.totalTokens || 0,
 period,
 periodLabel: leaderboard.periodLabel,
 periodStart: leaderboard.periodStart,
 periodEnd: leaderboard.periodEnd,
 stats: [
 stat('Tokens', row?.totalTokens || 0),
 stat('Sessions', row?.sessionCount || 0),
 stat('Active days', row?.activeDays || 0),
 stat('Tool calls', totalToolCalls, topToolName ? `Top: ${topToolName}` : null),
 stat('User messages', totalUserMessages),
 stat('Assistant turns', totalAssistantMessages),
 stat('Top model', 0, row?.topModel || null),
 stat('Commits', totalCommits),
 stat('PRs opened', totalPRs),
 stat('Lines added', totalLinesAdded),
 stat('Lines removed', totalLinesRemoved),
 ],
 topModel: row?.topModel || null,
 lastSubmissionAt: agent.lastSubmissionAt || null,
 sourceTypes: row?.sourceTypes || ([] as SourceType[]),
 sourceAdapters: row?.sourceAdapters || [],
 rollups: [
 getRollup(store, agent.id, 'today', now),
 getRollup(store, agent.id, 'week', now),
 getRollup(store, agent.id, 'month', now),
 getRollup(store, agent.id, 'alltime', now),
 ],
 dailyFacts: facts.slice(0, 30),
 methodologyNote:
 'OpenClaw transcript data is translated into ClawRank-native daily agent facts, then queried from persisted ClawRank records.',
 generatedAt: now.toISOString(),
 };
}
