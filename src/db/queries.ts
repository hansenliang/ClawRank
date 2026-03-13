/**
 * Postgres-backed query functions for ClawRank domain operations.
 * Maps between snake_case DB columns and camelCase domain types.
 */
import { getSQL } from './connection';
import type {
 AgentRecord,
 AgentState,
 AgentUpsertInput,
 ApiToken,
 AuthProvider,
 DailyAgentFact,
 DailyAgentFactInput,
 DailyFactSubmission,
 LeaderboardPeriod,
 LeaderboardResponse,
 LeaderboardRow,
 LinkedAccount,
 SourceType,
 UserRecord,
} from '@/src/contracts/clawrank-domain';

// ── Row mappers ────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function toIso(val: unknown): string {
 if (val instanceof Date) return val.toISOString();
 return String(val);
}

function toIsoOrNull(val: unknown): string | null {
 if (val == null) return null;
 return toIso(val);
}

function mapUser(row: any): UserRecord {
 return {
 id: row.id,
 displayName: row.display_name ?? null,
 avatarUrl: row.avatar_url ?? null,
 isAdmin: Boolean(row.is_admin),
 defaultAgentId: row.default_agent_id ?? null,
 createdAt: toIso(row.created_at),
 updatedAt: toIso(row.updated_at),
 };
}

function mapLinkedAccount(row: any): LinkedAccount {
 return {
 id: row.id,
 userId: row.user_id,
 provider: row.provider as AuthProvider,
 providerUserId: row.provider_user_id,
 handle: row.handle ?? null,
 displayName: row.display_name ?? null,
 avatarUrl: row.avatar_url ?? null,
 verified: Boolean(row.verified),
 verifiedAt: toIsoOrNull(row.verified_at),
 metadataJson: row.metadata_json ?? null,
 createdAt: toIso(row.created_at),
 updatedAt: toIso(row.updated_at),
 };
}

function mapApiToken(row: any): ApiToken {
 return {
 id: row.id,
 userId: row.user_id,
 label: row.label ?? null,
 lastUsedAt: toIsoOrNull(row.last_used_at),
 createdAt: toIso(row.created_at),
 revokedAt: toIsoOrNull(row.revoked_at),
 };
}

function mapAgent(row: any): AgentRecord {
 return {
 id: row.id,
 userId: row.user_id ?? null,
 slug: row.slug,
 agentName: row.agent_name,
 ownerName: row.owner_name,
 state: row.state as AgentState,
 primaryGithubUsername: row.primary_github_username ?? null,
 xHandle: row.x_handle ?? null,
 bio: row.bio ?? null,
 avatarUrl: row.avatar_url ?? null,
 sourceOfTruth: row.source_of_truth ?? null,
 createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
 updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
 lastSubmissionAt: row.last_submission_at ? (row.last_submission_at instanceof Date ? row.last_submission_at.toISOString() : String(row.last_submission_at)) : null,
 };
}

function mapFact(row: any): DailyAgentFact {
 return {
 id: row.id,
 agentId: row.agent_id,
 date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
 totalTokens: Number(row.total_tokens),
 inputTokens: row.input_tokens != null ? Number(row.input_tokens) : null,
 outputTokens: row.output_tokens != null ? Number(row.output_tokens) : null,
 cacheReadTokens: row.cache_read_tokens != null ? Number(row.cache_read_tokens) : null,
 cacheWriteTokens: row.cache_write_tokens != null ? Number(row.cache_write_tokens) : null,
 sessionCount: row.session_count != null ? Number(row.session_count) : null,
 longestRunSeconds: row.longest_run_seconds != null ? Number(row.longest_run_seconds) : null,
 mostActiveHour: row.most_active_hour != null ? Number(row.most_active_hour) : null,
 topModel: row.top_model ?? null,
 estimatedCostUsd: row.estimated_cost_usd != null ? Number(row.estimated_cost_usd) : null,
 userMessageCount: row.user_message_count != null ? Number(row.user_message_count) : null,
 assistantMessageCount: row.assistant_message_count != null ? Number(row.assistant_message_count) : null,
 toolCallCount: row.tool_call_count != null ? Number(row.tool_call_count) : null,
 topTools: row.top_tools ?? null,
 modelsUsed: row.models_used ?? null,
 sourceType: (row.source_type ?? 'manual') as SourceType,
 sourceAdapter: row.source_adapter ?? null,
 createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
 updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
 };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── User operations ────────────────────────────────────────────────────────

export async function dbGetUserById(id: string): Promise<UserRecord | null> {
 const sql = getSQL();
 if (!sql) return null;
 const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
 return rows.length ? mapUser(rows[0]) : null;
}

export async function dbCreateUser(displayName?: string | null, avatarUrl?: string | null): Promise<UserRecord> {
 const sql = getSQL();
 if (!sql) throw new Error('DATABASE_URL not configured');
 const now = new Date().toISOString();
 const rows = await sql`
   INSERT INTO users (display_name, avatar_url, created_at, updated_at)
   VALUES (${displayName ?? null}, ${avatarUrl ?? null}, ${now}, ${now})
   RETURNING *
 `;
 return mapUser(rows[0]);
}

// ── Linked account operations ──────────────────────────────────────────────

export async function dbFindLinkedAccount(provider: string, providerUserId: string): Promise<LinkedAccount | null> {
 const sql = getSQL();
 if (!sql) return null;
 const rows = await sql`
   SELECT * FROM linked_accounts
   WHERE provider = ${provider} AND provider_user_id = ${providerUserId}
   LIMIT 1
 `;
 return rows.length ? mapLinkedAccount(rows[0]) : null;
}

export async function dbGetLinkedAccountsForUser(userId: string): Promise<LinkedAccount[]> {
 const sql = getSQL();
 if (!sql) return [];
 const rows = await sql`
   SELECT * FROM linked_accounts WHERE user_id = ${userId} ORDER BY created_at
 `;
 return rows.map(mapLinkedAccount);
}

export async function dbUpsertLinkedAccount(input: {
 userId: string;
 provider: string;
 providerUserId: string;
 handle?: string | null;
 displayName?: string | null;
 avatarUrl?: string | null;
 verified?: boolean;
}): Promise<LinkedAccount> {
 const sql = getSQL();
 if (!sql) throw new Error('DATABASE_URL not configured');
 const now = new Date().toISOString();
 const rows = await sql`
   INSERT INTO linked_accounts (user_id, provider, provider_user_id, handle, display_name, avatar_url, verified, verified_at, created_at, updated_at)
   VALUES (${input.userId}, ${input.provider}, ${input.providerUserId}, ${input.handle ?? null}, ${input.displayName ?? null}, ${input.avatarUrl ?? null}, ${input.verified ?? false}, ${input.verified ? now : null}, ${now}, ${now})
   ON CONFLICT (provider, provider_user_id) DO UPDATE SET
     handle = COALESCE(EXCLUDED.handle, linked_accounts.handle),
     display_name = COALESCE(EXCLUDED.display_name, linked_accounts.display_name),
     avatar_url = COALESCE(EXCLUDED.avatar_url, linked_accounts.avatar_url),
     verified = EXCLUDED.verified,
     verified_at = CASE WHEN EXCLUDED.verified THEN COALESCE(linked_accounts.verified_at, ${now}) ELSE linked_accounts.verified_at END,
     updated_at = ${now}
   RETURNING *
 `;
 return mapLinkedAccount(rows[0]);
}

// ── API token operations ───────────────────────────────────────────────────

export async function dbCreateApiToken(userId: string, tokenHash: string, label?: string | null): Promise<ApiToken> {
 const sql = getSQL();
 if (!sql) throw new Error('DATABASE_URL not configured');
 const now = new Date().toISOString();
 const rows = await sql`
   INSERT INTO api_tokens (user_id, token_hash, label, created_at)
   VALUES (${userId}, ${tokenHash}, ${label ?? null}, ${now})
   RETURNING *
 `;
 return mapApiToken(rows[0]);
}

export async function dbGetTokensForUser(userId: string): Promise<ApiToken[]> {
 const sql = getSQL();
 if (!sql) return [];
 const rows = await sql`
   SELECT * FROM api_tokens
   WHERE user_id = ${userId} AND revoked_at IS NULL
   ORDER BY created_at DESC
 `;
 return rows.map(mapApiToken);
}

export async function dbRevokeToken(tokenId: string, userId: string): Promise<boolean> {
 const sql = getSQL();
 if (!sql) return false;
 const now = new Date().toISOString();
 const rows = await sql`
   UPDATE api_tokens SET revoked_at = ${now}
   WHERE id = ${tokenId} AND user_id = ${userId} AND revoked_at IS NULL
   RETURNING id
 `;
 return rows.length > 0;
}

export async function dbFindValidToken(tokenHash: string): Promise<{ token: ApiToken; user: UserRecord } | null> {
 const sql = getSQL();
 if (!sql) return null;
 const rows = await sql`
   SELECT t.*, u.id as u_id, u.display_name as u_display_name, u.avatar_url as u_avatar_url,
          u.is_admin as u_is_admin, u.default_agent_id as u_default_agent_id,
          u.created_at as u_created_at, u.updated_at as u_updated_at
   FROM api_tokens t
   JOIN users u ON t.user_id = u.id
   WHERE t.token_hash = ${tokenHash} AND t.revoked_at IS NULL
   LIMIT 1
 `;
 if (!rows.length) return null;

 const row = rows[0];
 const token = mapApiToken(row);
 const user = mapUser({
   id: row.u_id,
   display_name: row.u_display_name,
   avatar_url: row.u_avatar_url,
   is_admin: row.u_is_admin,
   default_agent_id: row.u_default_agent_id,
   created_at: row.u_created_at,
   updated_at: row.u_updated_at,
 });

 // Update last_used_at (fire-and-forget)
 const now = new Date().toISOString();
 sql`UPDATE api_tokens SET last_used_at = ${now} WHERE id = ${token.id}`.catch(() => {});

 return { token, user };
}

export async function dbGetAgentsForUser(userId: string): Promise<AgentRecord[]> {
 const sql = getSQL();
 if (!sql) return [];
 const rows = await sql`SELECT * FROM agents WHERE user_id = ${userId} ORDER BY agent_name`;
 return rows.map(mapAgent);
}

export async function dbGetUnclaimedAgents(): Promise<AgentRecord[]> {
 const sql = getSQL();
 if (!sql) return [];
 const rows = await sql`SELECT * FROM agents WHERE user_id IS NULL ORDER BY agent_name`;
 return rows.map(mapAgent);
}

/**
 * Returns unclaimed agents whose primary_github_username or owner_name
 * matches the given GitHub handle (case-insensitive).
 * This restricts claiming to agents that plausibly belong to the user.
 */
export async function dbGetClaimableAgentsForHandle(githubHandle: string): Promise<AgentRecord[]> {
 const sql = getSQL();
 if (!sql) return [];
 const handle = githubHandle.toLowerCase();
 const rows = await sql`
   SELECT * FROM agents
   WHERE user_id IS NULL
     AND (
       LOWER(primary_github_username) = ${handle}
       OR LOWER(owner_name) = ${handle}
     )
   ORDER BY agent_name
 `;
 return rows.map(mapAgent);
}

/**
 * Checks whether a specific agent is claimable by the given GitHub handle.
 * Used for server-side enforcement on POST /api/agents/claim.
 */
export async function dbIsAgentClaimableByHandle(agentId: string, githubHandle: string): Promise<boolean> {
 const sql = getSQL();
 if (!sql) return false;
 const handle = githubHandle.toLowerCase();
 const rows = await sql`
   SELECT id FROM agents
   WHERE id = ${agentId}
     AND user_id IS NULL
     AND (
       LOWER(primary_github_username) = ${handle}
       OR LOWER(owner_name) = ${handle}
     )
   LIMIT 1
 `;
 return rows.length > 0;
}

export async function dbClaimAgent(agentId: string, userId: string): Promise<boolean> {
 const sql = getSQL();
 if (!sql) return false;
 const now = new Date().toISOString();
 const rows = await sql`
   UPDATE agents SET user_id = ${userId}, updated_at = ${now}
   WHERE id = ${agentId} AND user_id IS NULL
   RETURNING id
 `;
 return rows.length > 0;
}

// ── Agent operations ───────────────────────────────────────────────────────

export async function dbGetAgentBySlug(slug: string): Promise<AgentRecord | null> {
 const sql = getSQL();
 if (!sql) return null;
 const rows = await sql`SELECT * FROM agents WHERE slug = ${slug} LIMIT 1`;
 return rows.length ? mapAgent(rows[0]) : null;
}

export async function dbGetAllAgents(): Promise<AgentRecord[]> {
 const sql = getSQL();
 if (!sql) return [];
 const rows = await sql`SELECT * FROM agents ORDER BY slug`;
 return rows.map(mapAgent);
}

const STATE_PRIORITY: Record<AgentState, number> = { live: 3, verified: 2, estimated: 1 };

function strongerState(a: AgentState, b: AgentState): AgentState {
 return STATE_PRIORITY[a] >= STATE_PRIORITY[b] ? a : b;
}

export async function dbUpsertAgent(input: AgentUpsertInput, now = new Date().toISOString()): Promise<AgentRecord> {
 const sql = getSQL();
 if (!sql) throw new Error('DATABASE_URL not configured');

 const effectiveState = input.state || 'live';

 const existing = await dbGetAgentBySlug(input.slug);
 if (existing) {
 const newState = strongerState(existing.state, effectiveState);
 const rows = await sql`
 UPDATE agents SET
 agent_name = ${input.agentName},
 owner_name = ${input.ownerName},
 state = ${newState},
 source_of_truth = COALESCE(${input.sourceOfTruth ?? null}, source_of_truth),
 primary_github_username = COALESCE(${input.primaryGithubUsername ?? null}, primary_github_username),
 x_handle = COALESCE(${input.xHandle ?? null}, x_handle),
 bio = COALESCE(${input.bio ?? null}, bio),
 avatar_url = COALESCE(${input.avatarUrl ?? null}, avatar_url),
 updated_at = ${now}
 WHERE slug = ${input.slug}
 RETURNING *
 `;
 return mapAgent(rows[0]);
 }

 const rows = await sql`
 INSERT INTO agents (slug, agent_name, owner_name, state, source_of_truth, primary_github_username, x_handle, bio, avatar_url, created_at, updated_at)
 VALUES (${input.slug}, ${input.agentName}, ${input.ownerName}, ${effectiveState}, ${input.sourceOfTruth ?? null}, ${input.primaryGithubUsername ?? null}, ${input.xHandle ?? null}, ${input.bio ?? null}, ${input.avatarUrl ?? null}, ${now}, ${now})
 RETURNING *
 `;
 return mapAgent(rows[0]);
}

// ── Fact operations ────────────────────────────────────────────────────────

export async function dbGetFactsForAgent(agentId: string, startDate?: string, endDate?: string): Promise<DailyAgentFact[]> {
 const sql = getSQL();
 if (!sql) return [];

 if (startDate && endDate) {
 const rows = await sql`
 SELECT * FROM daily_agent_facts
 WHERE agent_id = ${agentId} AND date >= ${startDate}::date AND date < ${endDate}::date
 ORDER BY date DESC
 `;
 return rows.map(mapFact);
 }

 const rows = await sql`
 SELECT * FROM daily_agent_facts
 WHERE agent_id = ${agentId}
 ORDER BY date DESC
 `;
 return rows.map(mapFact);
}

export async function dbUpsertFact(agentId: string, fact: DailyAgentFactInput, now = new Date().toISOString()): Promise<DailyAgentFact> {
 const sql = getSQL();
 if (!sql) throw new Error('DATABASE_URL not configured');

 const topToolsJson = fact.topTools ? JSON.stringify(fact.topTools) : null;
 const modelsUsedJson = fact.modelsUsed ? JSON.stringify(fact.modelsUsed) : null;

 const rows = await sql`
 INSERT INTO daily_agent_facts (
 agent_id, date, total_tokens, input_tokens, output_tokens,
 cache_read_tokens, cache_write_tokens, session_count, longest_run_seconds,
 most_active_hour, top_model, estimated_cost_usd,
 user_message_count, assistant_message_count, tool_call_count, top_tools, models_used,
 source_type, source_adapter,
 created_at, updated_at
 ) VALUES (
 ${agentId}, ${fact.date}::date, ${fact.totalTokens}, ${fact.inputTokens ?? null}, ${fact.outputTokens ?? null},
 ${fact.cacheReadTokens ?? null}, ${fact.cacheWriteTokens ?? null}, ${fact.sessionCount ?? null}, ${fact.longestRunSeconds ?? null},
 ${fact.mostActiveHour ?? null}, ${fact.topModel ?? null}, ${fact.estimatedCostUsd ?? null},
 ${fact.userMessageCount ?? null}, ${fact.assistantMessageCount ?? null}, ${fact.toolCallCount ?? null},
 ${topToolsJson}::jsonb, ${modelsUsedJson}::jsonb,
 ${fact.sourceType}, ${fact.sourceAdapter ?? null},
 ${now}, ${now}
 )
 ON CONFLICT (agent_id, date) DO UPDATE SET
 total_tokens = EXCLUDED.total_tokens,
 input_tokens = EXCLUDED.input_tokens,
 output_tokens = EXCLUDED.output_tokens,
 cache_read_tokens = EXCLUDED.cache_read_tokens,
 cache_write_tokens = EXCLUDED.cache_write_tokens,
 session_count = EXCLUDED.session_count,
 longest_run_seconds = EXCLUDED.longest_run_seconds,
 most_active_hour = EXCLUDED.most_active_hour,
 top_model = EXCLUDED.top_model,
 estimated_cost_usd = EXCLUDED.estimated_cost_usd,
 user_message_count = EXCLUDED.user_message_count,
 assistant_message_count = EXCLUDED.assistant_message_count,
 tool_call_count = EXCLUDED.tool_call_count,
 top_tools = EXCLUDED.top_tools,
 models_used = EXCLUDED.models_used,
 source_type = EXCLUDED.source_type,
 source_adapter = EXCLUDED.source_adapter,
 updated_at = ${now}
 RETURNING *
 `;
 return mapFact(rows[0]);
}

// ── Submission (upsert agent + facts in one call) ──────────────────────────

export async function dbSubmitDailyFactSubmission(
 submission: DailyFactSubmission,
 now = new Date().toISOString(),
): Promise<{ agent: AgentRecord; upsertedFacts: number }> {
 const agent = await dbUpsertAgent(submission.agent, now);
 let upsertedFacts = 0;

 for (const fact of submission.facts) {
 await dbUpsertFact(agent.id, fact, now);
 upsertedFacts += 1;
 }

 // Update agent state and last_submission_at
 const sql = getSQL()!;
 const newState = submission.facts.some((f) => f.sourceType === 'skill')
 ? strongerState(agent.state, 'live')
 : agent.state;

 const updated = await sql`
 UPDATE agents SET
 last_submission_at = ${now},
 state = ${newState},
 updated_at = ${now}
 WHERE id = ${agent.id}
 RETURNING *
 `;

 return { agent: mapAgent(updated[0]), upsertedFacts };
}

// ── Leaderboard queries ────────────────────────────────────────────────────

function periodRange(period: LeaderboardPeriod, now = new Date()): { start: string | null; endExclusive: string | null; label: string } {
 const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
 const endExclusive = new Date(dayStart.getTime() + 86400000).toISOString().slice(0, 10);

 switch (period) {
 case 'alltime':
 return { start: null, endExclusive: null, label: 'All Time' };
 case 'today':
 return { start: dayStart.toISOString().slice(0, 10), endExclusive, label: 'Today' };
 case 'week':
 return { start: new Date(dayStart.getTime() - 6 * 86400000).toISOString().slice(0, 10), endExclusive, label: 'Last 7 Days' };
 case 'month':
 return { start: new Date(dayStart.getTime() - 29 * 86400000).toISOString().slice(0, 10), endExclusive, label: 'Last 30 Days' };
 }
}

function uniq<T>(items: T[]): T[] {
 return [...new Set(items)];
}

export async function dbGetLeaderboard(period: LeaderboardPeriod = 'alltime', now = new Date()): Promise<LeaderboardResponse> {
 const sql = getSQL();
 if (!sql) throw new Error('DATABASE_URL not configured');

 const range = periodRange(period, now);

 // Fetch all facts in period with their agent data
 let factRows;
 if (range.start && range.endExclusive) {
 factRows = await sql`
 SELECT f.*, a.slug, a.agent_name, a.owner_name, a.state, a.last_submission_at
 FROM daily_agent_facts f
 JOIN agents a ON f.agent_id = a.id
 WHERE f.date >= ${range.start}::date AND f.date < ${range.endExclusive}::date
 ORDER BY a.slug, f.date
 `;
 } else {
 factRows = await sql`
 SELECT f.*, a.slug, a.agent_name, a.owner_name, a.state, a.last_submission_at
 FROM daily_agent_facts f
 JOIN agents a ON f.agent_id = a.id
 ORDER BY a.slug, f.date
 `;
 }

 // Group by agent
 const agentMap = new Map<string, { agent: AgentRecord; facts: DailyAgentFact[] }>();
 for (const row of factRows) {
 const agentId = row.agent_id as string;
 if (!agentMap.has(agentId)) {
 agentMap.set(agentId, {
 agent: {
 id: agentId,
 userId: row.user_id ?? null,
 slug: row.slug as string,
 agentName: row.agent_name as string,
 ownerName: row.owner_name as string,
 state: row.state as AgentState,
 primaryGithubUsername: null,
 xHandle: null,
 bio: null,
 avatarUrl: null,
 sourceOfTruth: null,
 createdAt: '',
 updatedAt: '',
 lastSubmissionAt: row.last_submission_at ? String(row.last_submission_at) : null,
 },
 facts: [],
 });
 }
 agentMap.get(agentId)!.facts.push(mapFact(row));
 }

 const rows: LeaderboardRow[] = [...agentMap.values()]
 .map(({ agent, facts }) => {
 const totalTokens = facts.reduce((sum, f) => sum + f.totalTokens, 0);
 const sessionCount = facts.reduce((sum, f) => sum + (f.sessionCount || 0), 0);
 const activeDays = facts.filter((f) => f.totalTokens > 0).length;
 const longestRunSeconds = facts.reduce((max, f) => Math.max(max, f.longestRunSeconds || 0), 0);

 const modelTotals = new Map<string, number>();
 const hourTotals = new Map<number, number>();
 const toolTotals = new Map<string, number>();
 let estimatedCostUsd = 0;
 let toolCallCount = 0;
 let userMessageCount = 0;

 for (const f of facts) {
 if (f.topModel) modelTotals.set(f.topModel, (modelTotals.get(f.topModel) || 0) + f.totalTokens);
 if (typeof f.mostActiveHour === 'number') hourTotals.set(f.mostActiveHour, (hourTotals.get(f.mostActiveHour) || 0) + f.totalTokens);
 estimatedCostUsd += f.estimatedCostUsd || 0;
 toolCallCount += f.toolCallCount || 0;
 userMessageCount += f.userMessageCount || 0;
 if (f.topTools && typeof f.topTools === 'object') {
 for (const [name, count] of Object.entries(f.topTools as Record<string, number>)) {
 toolTotals.set(name, (toolTotals.get(name) || 0) + count);
 }
 }
 }

 const topModel = [...modelTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
 const mostActiveHour = [...hourTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
 const topToolNames = [...toolTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

 return {
 id: agent.id,
 rank: 0,
 detailSlug: agent.slug,
 agentName: agent.agentName,
 ownerName: agent.ownerName,
 displayName: `${agent.agentName} by ${agent.ownerName}`,
 state: agent.state,
 totalTokens,
 sessionCount,
 activeDays,
 longestRunSeconds,
 mostActiveHour,
 topModel,
 estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
 toolCallCount,
 userMessageCount,
 topToolNames,
 sourceTypes: uniq(facts.map((f) => f.sourceType)),
 sourceAdapters: uniq(facts.map((f) => f.sourceAdapter || '').filter(Boolean)),
 lastSubmissionAt: agent.lastSubmissionAt,
 };
 })
 .sort((a, b) => {
 return (
 b.totalTokens - a.totalTokens ||
 b.sessionCount - a.sessionCount ||
 a.displayName.localeCompare(b.displayName)
 );
 })
 .map((row, i) => ({ ...row, rank: i + 1 }));

 const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

 return {
 period,
 periodLabel: range.label,
 periodStart: range.start,
 periodEnd: range.endExclusive ? addDays(new Date(`${range.endExclusive}T00:00:00.000Z`), -1).toISOString().slice(0, 10) : null,
 generatedAt: now.toISOString(),
 rows,
 };
}
