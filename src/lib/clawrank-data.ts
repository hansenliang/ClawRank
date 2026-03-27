import * as fs from 'fs';
import * as path from 'path';
import type { LeaderboardResponse, ShareDetail } from '@/src/contracts/clawrank';
import type {
 AgentDetail,
 LeaderboardResponse as DomainLeaderboardResponse,
 LeaderboardRow as DomainLeaderboardRow,
 ShareStat as DomainShareStat,
} from '@/src/contracts/clawrank-domain';
import { hasDB } from '@/src/db/connection';
import { dbGetLeaderboard, dbGetAgentByUsernameAndSlug, dbGetAgentByLegacySlug, dbGetFactsForAgent, dbGetAllAgents } from '@/src/db/queries';
import {
 getLeaderboardResponse as jsonGetLeaderboard,
 getAgentDetail as jsonGetAgentDetail,
 readStore,
} from '@/src/domain/clawrank-store';
import { SITE_URL } from './site';

// ── Durable checkpoint + baked fallback ─────────────────────────────────────

const BAKED_DIR = path.join(process.cwd(), 'data');
const CHECKPOINT_DIR = path.join(BAKED_DIR, 'checkpoints');

function readJsonFile<T>(fp: string): T | null {
 try {
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8')) as T;
 } catch {
  return null;
 }
}

function tryBakedLeaderboard(): LeaderboardResponse | null {
 return readJsonFile<LeaderboardResponse>(path.join(BAKED_DIR, 'leaderboard.json'));
}

function tryCheckpointLeaderboard(period: import('@/src/contracts/clawrank-domain').LeaderboardPeriod): LeaderboardResponse | null {
 return readJsonFile<LeaderboardResponse>(path.join(CHECKPOINT_DIR, 'leaderboards', `${period}.json`));
}

const SINGLE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,128}$/;

function isValidSingleSlug(slug: string): boolean {
 return SINGLE_SLUG_RE.test(slug);
}

function isValidSlug(slug: string): boolean {
 if (slug.includes('/')) {
  const parts = slug.split('/');
  if (parts.length !== 2) return false;
  return SINGLE_SLUG_RE.test(parts[0]) && SINGLE_SLUG_RE.test(parts[1]);
 }
 return SINGLE_SLUG_RE.test(slug);
}

function normalizeCheckpointKey(detailSlug: string): string {
 return detailSlug.replace('/', '__');
}

function hydrateDetailPayload(payload: unknown): ShareDetail | null {
 if (!payload || typeof payload !== 'object') return null;
 const asObject = payload as { detail?: ShareDetail };
 return asObject.detail || (payload as ShareDetail);
}

function tryCheckpointDetail(detailSlug: string): ShareDetail | null {
 if (!isValidSlug(detailSlug)) return null;

 const slug = detailSlug.includes('/') ? detailSlug.split('/')[1] : detailSlug;
 const candidates = [
  path.join(CHECKPOINT_DIR, 'agents', `${normalizeCheckpointKey(detailSlug)}.json`),
  path.join(CHECKPOINT_DIR, 'agents', `${slug}.json`),
 ];

 for (const fp of candidates) {
  const payload = readJsonFile<unknown>(fp);
  const detail = hydrateDetailPayload(payload);
  if (detail) return detail;
 }

 return null;
}

function tryBakedDetail(detailSlug: string): ShareDetail | null {
 // Baked files are stored by single slug only; extract slug part if given username/slug
 const slug = detailSlug.includes('/') ? detailSlug.split('/')[1] : detailSlug;
 if (!isValidSingleSlug(slug)) return null;
 const payload = readJsonFile<unknown>(path.join(BAKED_DIR, 'agents', `${slug}.json`));
 return hydrateDetailPayload(payload);
}

// ── Type bridge: domain → UI types ─────────────────────────────────────────
// The frontend uses LeaderboardRow/ShareDetail from clawrank.ts (the UI contract).
// The domain layer uses different types from clawrank-domain.ts.
// This bridge synthesizes the UI shape from domain data.

function domainRowToUiRow(row: DomainLeaderboardRow, periodStart: string, periodEnd: string): import('@/src/contracts/clawrank').LeaderboardRow {
 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
 const hasGitMetrics = row.commitCount > 0 || row.linesAdded > 0 || row.linesRemoved > 0 || row.prCount > 0;
 return {
  id: row.id,
  rank: row.rank,
  agentName: row.agentName,
  ownerName: row.ownerName,
  displayName: row.displayName,
  avatarUrl: row.avatarUrl ?? null,
  derivedState: row.derivedState,
  periodType: 'weekly',
  periodStart,
  periodEnd,
  tokenUsage: { value: row.totalTokens, status: 'verified' },
  commits: hasGitMetrics ? { value: row.commitCount, status: 'verified' } : { value: 0, status: 'missing' },
  filesTouched: hasGitMetrics ? { value: row.filesTouched, status: 'verified' } : { value: 0, status: 'missing' },
  linesAdded: hasGitMetrics ? { value: row.linesAdded, status: 'verified' } : { value: 0, status: 'missing' },
  linesRemoved: hasGitMetrics ? { value: row.linesRemoved, status: 'verified' } : { value: 0, status: 'missing' },
  toolCalls: row.toolCallCount > 0 ? { value: row.toolCallCount, status: 'verified' } : { value: 0, status: 'missing' },
  messageCount: row.userMessageCount > 0 ? { value: row.userMessageCount, status: 'verified' } : { value: 0, status: 'missing' },
  sessionCount: { value: row.sessionCount, status: 'verified' },
  shareUrl: `${baseUrl}/a/${row.detailSlug}`,
  detailSlug: row.detailSlug,
  topToolNames: row.topToolNames.length ? row.topToolNames : undefined,
  dataSources: row.sourceAdapters.length ? row.sourceAdapters : ['openclaw'],
  generatedAt: new Date().toISOString(),
 };
}

function domainLeaderboardToUi(domain: DomainLeaderboardResponse): LeaderboardResponse {
 const periodStart = domain.periodStart || '';
 const periodEnd = domain.periodEnd || '';
 return {
  periodType: 'weekly',
  periodLabel: domain.periodLabel,
  periodStart,
  periodEnd,
  generatedAt: domain.generatedAt,
  rows: domain.rows.map((row) => domainRowToUiRow(row, periodStart, periodEnd)),
 };
}

function domainStatToUiStat(stat: DomainShareStat): import('@/src/contracts/clawrank').ShareStat {
 // Domain labels now map 1:1 to UI labels (union expanded)
 const labelMap: Record<string, import('@/src/contracts/clawrank').ShareStat['label']> = {
  'Tokens': 'Tokens',
  'Sessions': 'Sessions',
  'Active days': 'Active days',
  'Tool calls': 'Tool calls',
  'User messages': 'Messages',
  'Assistant turns': 'Assistant turns',
  'Top model': 'Top model',
  'Commits': 'Commits',
  'PRs opened': 'PRs opened',
  'Lines added': 'Lines added',
  'Lines removed': 'Lines removed',
 };
 return {
  label: labelMap[stat.label] || 'Tokens',
  value: stat.value,
  status: stat.status === 'verified' ? 'verified' : 'missing',
  detail: stat.detail ?? null,
 };
}

function domainDetailToUi(detail: AgentDetail): ShareDetail {
 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
 const shareUrl = `${baseUrl}/a/${detail.detailSlug}`;
 const shareText = `${detail.agentName} is #${detail.rank} on ClawRank with ${detail.tokenUsage.toLocaleString()} tokens this period. ${shareUrl}`;

 // Extract real tool names from stats
 const toolCallStat = detail.stats.find((s) => s.label === 'Tool calls');
 const userMsgStat = detail.stats.find((s) => s.label === 'User messages');
 const commitsStat = detail.stats.find((s) => s.label === 'Commits');

 // Build top tools list from daily facts aggregation
 const toolTotals = new Map<string, number>();
 for (const fact of detail.dailyFacts) {
  if (fact.topTools && typeof fact.topTools === 'object') {
   for (const [name, count] of Object.entries(fact.topTools)) {
    toolTotals.set(name, (toolTotals.get(name) || 0) + (count as number));
   }
  }
 }
 const topToolNames = [...toolTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

 // Filter out notable outputs panel data — empty means panel is hidden
 const notableOutputs = (detail as unknown as { notableOutputs?: ShareDetail['notableOutputs'] }).notableOutputs || [];

 return {
  id: detail.id,
  detailSlug: detail.detailSlug,
  shareUrl,
  canonicalUrl: shareUrl,
  agentName: detail.agentName,
  ownerName: detail.ownerName,
  displayName: detail.displayName,
  derivedState: detail.derivedState,
  title: detail.title,
  subtitle: detail.subtitle,
  periodType: 'weekly',
  periodLabel: detail.periodLabel,
  periodStart: detail.periodStart || '',
  periodEnd: detail.periodEnd || '',
  rank: detail.rank,
  tokenUsage: detail.tokenUsage,
  stats: detail.stats.map(domainStatToUiStat),
  topTools: topToolNames,
  notableOutputs,
  methodologyNote: detail.methodologyNote || 'Data sourced from OpenClaw agent transcripts.',
  dataSources: detail.sourceAdapters.length ? detail.sourceAdapters : ['openclaw'],
  shareText,
  og: {
   title: detail.title,
   displayName: detail.displayName,
   rankText: `#${detail.rank}`,
   tokenText: `${detail.tokenUsage.toLocaleString()} tokens`,
   statChips: [
    ...((commitsStat?.value || 0) > 0 ? [{ label: 'Commits' as const, value: String(commitsStat!.value) }] : []),
    { label: 'Tool calls' as const, value: String(toolCallStat?.value || 0) },
    { label: 'Messages' as const, value: String(userMsgStat?.value || 0) },
   ],
   periodLabel: detail.periodLabel,
   theme: 'terminal',
  },
  generatedAt: detail.generatedAt,
 };
}

// ── DB-backed queries ──────────────────────────────────────────────────────

async function dbLeaderboard(period: import('@/src/contracts/clawrank-domain').LeaderboardPeriod = 'alltime'): Promise<LeaderboardResponse | null> {
 try {
  const domain = await dbGetLeaderboard(period);
  return domainLeaderboardToUi(domain);
 } catch (err) {
  console.error('ClawRank DB leaderboard query failed:', err);
  return null;
 }
}

async function dbDetail(slug: string): Promise<ShareDetail | null> {
 if (!isValidSlug(slug)) return null;
 try {
  let agentSlug: string;
  let username: string | null = null;

  if (slug.includes('/')) {
   // New format: username/agentSlug
   const [un, as] = slug.split('/');
   const result = await dbGetAgentByUsernameAndSlug(un, as);
   if (!result) return null;
   agentSlug = result.agent.slug;
   username = result.username;
  } else {
   // Legacy format: single slug
   const result = await dbGetAgentByLegacySlug(slug);
   if (!result) return null;
   agentSlug = result.agent.slug;
   username = result.username;
  }

  // Build AgentDetail from DB queries, reusing the domain store's logic
  const allAgents = await dbGetAllAgents();
  const allFacts = [];
  for (const a of allAgents) {
   const facts = await dbGetFactsForAgent(a.id);
   allFacts.push(...facts);
  }

  // Reconstruct a store-like shape and use the existing pure function
  const store = { schemaVersion: 1 as const, users: [], agents: allAgents, dailyAgentFacts: allFacts };
  const detail = jsonGetAgentDetail(store, agentSlug);
  if (!detail) return null;

  // Override detailSlug to canonical format (username/slug) if we have username
  const canonicalSlug = username ? `${username}/${agentSlug}` : agentSlug;
  return domainDetailToUi({ ...detail, detailSlug: canonicalSlug });
 } catch (err) {
  console.error('ClawRank DB detail query failed:', err);
  return null;
 }
}

// ── JSON-file domain queries (for local dev without DB) ────────────────────

function jsonLeaderboard(): LeaderboardResponse | null {
 try {
  const store = readStore();
  if (!store.agents.length) return null;
  const domain = jsonGetLeaderboard(store);
  return domainLeaderboardToUi(domain);
 } catch {
  return null;
 }
}

function jsonDetail(slug: string): ShareDetail | null {
 // JSON store only knows single-segment slugs
 const agentSlug = slug.includes('/') ? slug.split('/')[1] : slug;
 if (!isValidSingleSlug(agentSlug)) return null;
 try {
  const store = readStore();
  const detail = jsonGetAgentDetail(store, agentSlug);
  if (!detail) return null;
  return domainDetailToUi(detail);
 } catch {
  return null;
 }
}

// ── Public API (unchanged signatures) ──────────────────────────────────────

const EMPTY_LEADERBOARD: LeaderboardResponse = {
 periodType: 'weekly',
 periodLabel: 'Last 7 days',
 periodStart: '',
 periodEnd: '',
 generatedAt: '',
 rows: [],
};

const allowLegacyFallback = process.env.NODE_ENV !== 'production' || process.env.ALLOW_LEGACY_FALLBACK === '1';

export async function getLeaderboardData(forceMode?: 'baked' | 'live', period?: import('@/src/contracts/clawrank-domain').LeaderboardPeriod): Promise<LeaderboardResponse> {
 const resolvedPeriod = period || 'alltime';

 // Baked mode: use durable checkpoint first, then baked fallback
 if (forceMode === 'baked') {
  return tryCheckpointLeaderboard(resolvedPeriod) || tryBakedLeaderboard() || EMPTY_LEADERBOARD;
 }

 // Live mode or default: try DB first
 if (hasDB()) {
  const result = await dbLeaderboard(resolvedPeriod);
  if (result && result.rows.length) return result;
 }

 // Durable checkpoint fallback (safe on free Vercel cold starts)
 const checkpoint = tryCheckpointLeaderboard(resolvedPeriod);
 if (checkpoint && checkpoint.rows.length) return checkpoint;

 // Local/dev-only fallback to pilot/baked fixtures (disabled in production by default)
 if (allowLegacyFallback) {
  const fromJson = jsonLeaderboard();
  if (fromJson && fromJson.rows.length) return fromJson;
  return tryBakedLeaderboard() || EMPTY_LEADERBOARD;
 }

 return EMPTY_LEADERBOARD;
}

export async function getShareDetail(detailSlug: string, forceMode?: 'baked' | 'live'): Promise<ShareDetail | null> {
 if (forceMode === 'baked') {
  return tryCheckpointDetail(detailSlug) || tryBakedDetail(detailSlug);
 }

 // Live mode or default: try DB first
 if (hasDB()) {
  const result = await dbDetail(detailSlug);
  if (result) return result;
 }

 // Durable checkpoint fallback (safe on free Vercel cold starts)
 const checkpoint = tryCheckpointDetail(detailSlug);
 if (checkpoint) return checkpoint;

 // Local/dev-only fallback to pilot/baked fixtures (disabled in production by default)
 if (allowLegacyFallback) {
  return jsonDetail(detailSlug) || tryBakedDetail(detailSlug);
 }

 return null;
}
