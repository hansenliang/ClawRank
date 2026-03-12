/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { execFileSync } = require('child_process');

const DEFAULT_INDEX_PATH = process.env.OPENCLAW_SESSIONS_INDEX || '';
const DEFAULT_BASE_URL = 'https://clawrank.local';
const PERIOD_LABEL = 'Last 7 days';
const STAT_LABELS = [
  ['tokenUsage', 'Tokens'],
  ['commits', 'Commits'],
  ['filesTouched', 'Files touched'],
  ['linesAdded', 'Lines added'],
  ['linesRemoved', 'Lines removed'],
  ['toolCalls', 'Tool calls'],
  ['messageCount', 'Messages'],
  ['sessionCount', 'Sessions'],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeReadJsonLines(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function iso(input) {
  return new Date(input).toISOString();
}

function startOfWindow(days = 7, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function parseSessionKey(sessionKey) {
  const parts = String(sessionKey || '').split(':');
  return {
    sessionKey,
    agentId: parts[1] || 'unknown',
    route: parts.slice(2).join(':') || 'unknown',
  };
}

function normalizeOwnerName(name, fallback = 'Unknown Owner') {
  const raw = String(name || '').trim();
  if (!raw) return fallback;
  if (/^Hansen(?:\s+Liang)?$/i.test(raw)) return 'Hansen';
  return raw;
}

function inferOwnerName(meta, fallback = 'Unknown Owner') {
  const label = String(meta?.origin?.label || '');
  const directMatch = label.match(/^([^\n]+?)\s+id:\d+/i);
  if (directMatch?.[1]) return normalizeOwnerName(directMatch[1], fallback);
  if (/^Hansen\b/i.test(label)) return 'Hansen';
  return normalizeOwnerName('', fallback);
}

function messageUsage(message) {
  return Number(message?.usage?.totalTokens || 0);
}

function countChatMessage(message) {
  const role = message?.role;
  return role === 'user' || role === 'assistant' ? 1 : 0;
}

function normalizeToolName(name) {
  const toolName = String(name || '').trim();
  return toolName || 'unknown';
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function buildDetailSlug(agentName, ownerName) {
  return slugify(`${agentName}-by-${ownerName}`);
}

function buildId(agentName, ownerName, periodStart, periodEnd) {
  return `${buildDetailSlug(agentName, ownerName)}:${periodStart}:${periodEnd}`;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPeriodRange(periodStart, periodEnd) {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const startMonth = start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const endMonth = end.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();
  if (startMonth === endMonth) return `${startMonth} ${startDay}–${endDay}, ${year}`;
  return `${startMonth} ${startDay}–${endMonth} ${endDay}, ${year}`;
}

function createMetric(value, status) {
  return { value, status };
}

function getSessionSummary(sessionKey, meta, options = {}) {
  const windowStart = new Date(options.windowStart || startOfWindow(7));
  const windowEnd = new Date(options.windowEnd || new Date());
  const ownerName = options.ownerName || inferOwnerName(meta, options.defaultOwnerName);
  const parsedKey = parseSessionKey(sessionKey);
  const sessionFile = meta?.sessionFile;
  const base = {
    sessionKey,
    sessionId: meta?.sessionId,
    agentId: parsedKey.agentId,
    ownerName,
    route: parsedKey.route,
    channel: meta?.deliveryContext?.channel || meta?.lastChannel || meta?.channel || 'unknown',
    provider: meta?.modelProvider || null,
    model: meta?.model || null,
    startedAt: null,
    endedAt: meta?.updatedAt ? iso(meta.updatedAt) : null,
    tokenUsage: 0,
    toolCalls: 0,
    messageCount: 0,
    activityCount: 0,
    hasWindowActivity: false,
    topTools: new Map(),
    sessionFile: sessionFile || null,
    dataSources: new Set(['openclaw-session-index']),
    totalsFromIndex: {
      totalTokens: Number(meta?.totalTokens || 0),
      inputTokens: Number(meta?.inputTokens || 0),
      outputTokens: Number(meta?.outputTokens || 0),
      cacheRead: Number(meta?.cacheRead || 0),
      cacheWrite: Number(meta?.cacheWrite || 0),
      updatedAt: meta?.updatedAt ? iso(meta.updatedAt) : null,
    },
  };

  if (!sessionFile || !fs.existsSync(sessionFile)) {
    return base;
  }

  base.dataSources.add('openclaw-jsonl');
  const events = safeReadJsonLines(sessionFile);
  for (const event of events) {
    if (event?.type === 'session' && event?.timestamp && !base.startedAt) {
      base.startedAt = event.timestamp;
    }
    if (event?.type !== 'message' || !event?.message) continue;
    const ts = new Date(event.timestamp || event.message.timestamp || 0);
    if (Number.isNaN(ts.getTime()) || ts < windowStart || ts > windowEnd) continue;

    base.hasWindowActivity = true;
    base.activityCount += 1;
    base.tokenUsage += messageUsage(event.message);
    base.messageCount += countChatMessage(event.message);

    if (event.message.role === 'assistant') {
      for (const part of event.message.content || []) {
        if (part?.type !== 'toolCall') continue;
        base.toolCalls += 1;
        const name = normalizeToolName(part.name);
        base.topTools.set(name, (base.topTools.get(name) || 0) + 1);
      }
    }
  }

  return base;
}

function loadOpenClawSessions(indexPath = DEFAULT_INDEX_PATH, options = {}) {
  if (!indexPath || !fs.existsSync(indexPath)) {
    return [];
  }
  const index = readJson(indexPath);
  return Object.entries(index)
    .map(([sessionKey, meta]) => getSessionSummary(sessionKey, meta, options))
    .filter((row) => row.hasWindowActivity || options.includeInactive);
}

function sortToolCounts(map, limit = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name);
}

function getGitMetrics(repoPath, options = {}) {
  const sinceIso = iso(options.windowStart || startOfWindow(7));
  const untilIso = iso(options.windowEnd || new Date());
  const authorPattern = options.authorPattern;
  const args = ['-C', repoPath, 'log', '--since', sinceIso, '--until', untilIso, '--numstat', '--date=iso-strict', '--pretty=format:__COMMIT__%n%H%x09%an%x09%ae%x09%ad'];
  if (authorPattern) args.splice(4, 0, '--author', authorPattern);

  let out = '';
  try {
    out = execFileSync('git', args, { encoding: 'utf8' });
  } catch (error) {
    const stderr = String(error.stderr || error.message || '').trim();
    if (/does not have any commits yet/i.test(stderr)) {
      return { commits: 0, filesTouched: 0, linesAdded: 0, linesRemoved: 0, hasAny: false };
    }
    throw error;
  }

  let commits = 0;
  let linesAdded = 0;
  let linesRemoved = 0;
  const files = new Set();

  for (const line of out.split('\n')) {
    if (!line) continue;
    if (line === '__COMMIT__') {
      commits += 1;
      continue;
    }
    const parts = line.split('\t');
    if (parts.length === 3 && /\S/.test(parts[2])) {
      const [added, removed, filePath] = parts;
      files.add(filePath);
      if (added !== '-') linesAdded += Number(added || 0);
      if (removed !== '-') linesRemoved += Number(removed || 0);
    }
  }

  return {
    commits,
    filesTouched: files.size,
    linesAdded,
    linesRemoved,
    hasAny: commits > 0 || files.size > 0 || linesAdded > 0 || linesRemoved > 0,
  };
}

function chooseGitMetricStatus(rowCount, gitMetrics) {
  if (!gitMetrics) return 'missing';
  if (rowCount === 1) return 'verified';
  if (gitMetrics.hasAny) return 'partial';
  return 'missing';
}

function aggregateAgentRows(sessionRows, options = {}) {
  const periodStart = iso(options.windowStart || startOfWindow(7));
  const periodEnd = iso(options.windowEnd || new Date());
  const generatedAt = iso(options.generatedAt || options.windowEnd || new Date());
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const byAgent = new Map();

  for (const row of sessionRows) {
    const groupKey = `${row.agentId}::${row.ownerName}`;
    if (!byAgent.has(groupKey)) {
      byAgent.set(groupKey, {
        agentName: row.agentId,
        ownerName: row.ownerName,
        displayName: `${row.agentId} by ${row.ownerName}`,
        periodType: 'weekly',
        periodStart,
        periodEnd,
        tokenUsageValue: 0,
        toolCallsValue: 0,
        messageCountValue: 0,
        sessionCountValue: 0,
        topTools: new Map(),
        dataSources: new Set(),
      });
    }

    const agg = byAgent.get(groupKey);
    agg.tokenUsageValue += row.tokenUsage;
    agg.toolCallsValue += row.toolCalls;
    agg.messageCountValue += row.messageCount;
    agg.sessionCountValue += 1;
    row.dataSources.forEach((source) => agg.dataSources.add(source));
    row.topTools.forEach((count, name) => {
      agg.topTools.set(name, (agg.topTools.get(name) || 0) + count);
    });
  }

  const aggregated = [...byAgent.values()];
  let gitMetrics = null;
  if (options.repoPath) {
    try {
      gitMetrics = getGitMetrics(options.repoPath, {
        windowStart: options.windowStart,
        windowEnd: options.windowEnd,
      });
    } catch (error) {
      gitMetrics = { error: String(error.message || error), hasAny: false };
    }
  }

  const gitStatus = chooseGitMetricStatus(aggregated.length, gitMetrics);

  return aggregated
    .map((row) => {
      const detailSlug = buildDetailSlug(row.agentName, row.ownerName);
      const id = buildId(row.agentName, row.ownerName, periodStart, periodEnd);
      const dataSources = new Set(row.dataSources);
      if (gitStatus !== 'missing') dataSources.add('git');
      const shareUrl = `${baseUrl.replace(/\/$/, '')}/a/${detailSlug}`;

      return {
        id,
        rank: 0,
        agentName: row.agentName,
        ownerName: row.ownerName,
        displayName: row.displayName,
        periodType: 'weekly',
        periodStart,
        periodEnd,
        tokenUsage: createMetric(row.tokenUsageValue, row.tokenUsageValue > 0 ? 'verified' : 'missing'),
        commits: createMetric(gitMetrics?.commits || 0, gitStatus),
        filesTouched: createMetric(gitMetrics?.filesTouched || 0, gitStatus),
        linesAdded: createMetric(gitMetrics?.linesAdded || 0, gitStatus),
        linesRemoved: createMetric(gitMetrics?.linesRemoved || 0, gitStatus),
        toolCalls: createMetric(row.toolCallsValue, 'verified'),
        messageCount: createMetric(row.messageCountValue, 'verified'),
        sessionCount: createMetric(row.sessionCountValue, 'verified'),
        shareUrl,
        detailSlug,
        avatarSeed: detailSlug,
        topToolNames: sortToolCounts(row.topTools, 3),
        notableOutputCount: 0,
        dataSources: [...dataSources].sort(),
        generatedAt,
      };
    })
    .filter((row) => row.tokenUsage.status === 'verified')
    .sort((a, b) => {
      return (
        b.tokenUsage.value - a.tokenUsage.value ||
        b.toolCalls.value - a.toolCalls.value ||
        b.messageCount.value - a.messageCount.value ||
        a.displayName.localeCompare(b.displayName)
      );
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildMethodologyNote(row) {
  const partialLabels = [];
  const missingLabels = [];
  for (const [key, label] of STAT_LABELS.slice(1)) {
    const metric = row[key];
    if (!metric) continue;
    if (metric.status === 'partial') partialLabels.push(label);
    if (metric.status === 'missing') missingLabels.push(label);
  }
  if (!partialLabels.length && !missingLabels.length) return undefined;

  const bits = [];
  if (partialLabels.length) bits.push(`${partialLabels.join(', ')} are partial in V0`);
  if (missingLabels.length) bits.push(`${missingLabels.join(', ')} are missing in V0`);
  if (partialLabels.some((label) => ['Commits', 'Files touched', 'Lines added', 'Lines removed'].includes(label))) {
    bits.push('git stats are repo-level unless a single ranked agent is present');
  }
  return `${bits.join('; ')}.`;
}

function buildOgPayload(row, periodLabel = PERIOD_LABEL) {
  const chips = [
    ['Commits', row.commits],
    ['Files', row.filesTouched],
    ['Tool calls', row.toolCalls],
    ['Messages', row.messageCount],
  ]
    .filter(([, metric]) => metric?.status !== 'missing')
    .slice(0, 4)
    .map(([label, metric]) => ({ label, value: formatCount(metric.value) }));

  return {
    title: 'ClawRank Weekly Leaderboard',
    displayName: row.displayName,
    rankText: `#${row.rank} this week`,
    tokenText: `${formatCompactNumber(row.tokenUsage.value)} tokens`,
    statChips: chips,
    periodLabel,
    theme: 'terminal',
  };
}

function buildShareText(row) {
  const lines = [
    `${row.displayName} is #${row.rank} on ClawRank this week with ${formatCompactNumber(row.tokenUsage.value)} tokens over the last 7 days.`,
  ];
  const supporting = [];
  for (const key of ['commits', 'filesTouched', 'toolCalls']) {
    const metric = row[key];
    if (!metric || metric.status === 'missing') continue;
    if (key === 'commits') supporting.push(`${formatCount(metric.value)} commits`);
    if (key === 'filesTouched') supporting.push(`${formatCount(metric.value)} files`);
    if (key === 'toolCalls') supporting.push(`${formatCount(metric.value)} tool calls`);
  }
  if (supporting.length) lines.push('', supporting.join(' • '));
  lines.push(row.shareUrl);
  return lines.join('\n');
}

function buildShareDetail(row, options = {}) {
  const periodLabel = options.periodLabel || PERIOD_LABEL;
  const canonicalUrl = row.shareUrl;
  const title = `#${row.rank} on ClawRank this week`;
  const subtitle = `${row.displayName} • ${periodLabel}`;
  const stats = STAT_LABELS.map(([key, label]) => ({
    label,
    value: row[key].value,
    status: row[key].status,
  }));
  return {
    id: row.id,
    detailSlug: row.detailSlug,
    shareUrl: row.shareUrl,
    canonicalUrl,
    agentName: row.agentName,
    ownerName: row.ownerName,
    displayName: row.displayName,
    title,
    subtitle,
    periodType: 'weekly',
    periodLabel,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    rank: row.rank,
    tokenUsage: row.tokenUsage.value,
    stats,
    topTools: row.topToolNames?.slice(0, 5) || [],
    notableOutputs: [],
    methodologyNote: buildMethodologyNote(row),
    dataSources: row.dataSources,
    shareText: buildShareText(row),
    og: buildOgPayload(row, periodLabel),
    generatedAt: row.generatedAt,
  };
}

function buildLeaderboardResponse(options = {}) {
  const now = new Date(options.now || Date.now());
  const windowStart = options.windowStart || startOfWindow(7, now);
  const windowEnd = options.windowEnd || now;
  const generatedAt = options.generatedAt || now;
  const sessionRows = loadOpenClawSessions(options.indexPath || DEFAULT_INDEX_PATH, {
    windowStart,
    windowEnd,
    defaultOwnerName: options.defaultOwnerName || 'Unknown Owner',
  });
  const rows = aggregateAgentRows(sessionRows, {
    windowStart,
    windowEnd,
    generatedAt,
    baseUrl: options.baseUrl || DEFAULT_BASE_URL,
    repoPath: options.repoPath,
  });

  return {
    periodType: 'weekly',
    periodLabel: PERIOD_LABEL,
    periodStart: iso(windowStart),
    periodEnd: iso(windowEnd),
    generatedAt: iso(generatedAt),
    rows,
  };
}

function buildShareDetailResponse(detailSlug, options = {}) {
  const leaderboard = buildLeaderboardResponse(options);
  const row = leaderboard.rows.find((entry) => entry.detailSlug === detailSlug);
  if (!row) return null;
  return { detail: buildShareDetail(row, { periodLabel: leaderboard.periodLabel }) };
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_INDEX_PATH,
  PERIOD_LABEL,
  aggregateAgentRows,
  buildDetailSlug,
  buildId,
  buildLeaderboardResponse,
  buildShareDetail,
  buildShareDetailResponse,
  buildShareText,
  formatCompactNumber,
  formatCount,
  formatPeriodRange,
  getGitMetrics,
  getSessionSummary,
  inferOwnerName,
  normalizeOwnerName,
  loadOpenClawSessions,
  parseSessionKey,
  safeReadJsonLines,
  slugify,
  startOfWindow,
};
