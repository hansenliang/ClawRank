const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function readJson(filePath) {
 return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeReadJsonLines(filePath) {
 const text = fs.readFileSync(filePath, 'utf8');
 return text
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

function inferOwnerName(meta, fallback = 'Unknown Owner') {
 const label = meta?.origin?.label || '';
 if (/^Hansen\b/i.test(label)) return 'Hansen';
 return fallback;
}

function messageUsage(message) {
 return Number(message?.usage?.totalTokens || 0);
}

function countToolCalls(parts = []) {
 return parts.filter((part) => part?.type === 'toolCall').length;
}

function countChatMessage(message) {
 const role = message?.role;
 return role === 'user' || role === 'assistant' ? 1 : 0;
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
 sessionFile: sessionFile || null,
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

 const events = safeReadJsonLines(sessionFile);
 for (const event of events) {
 if (event?.type === 'session' && event?.timestamp && !base.startedAt) {
 base.startedAt = event.timestamp;
 }
 if (event?.type !== 'message' || !event?.message) continue;
 const ts = new Date(event.timestamp || event.message.timestamp || 0);
 if (Number.isNaN(ts.getTime())) continue;
 if (ts < windowStart || ts > windowEnd) continue;

 base.hasWindowActivity = true;
 base.activityCount += 1;
 base.tokenUsage += messageUsage(event.message);
 base.toolCalls += countToolCalls(event.message.content || []);
 base.messageCount += countChatMessage(event.message);
 }

 return base;
}

function loadOpenClawSessions(indexPath, options = {}) {
 const index = readJson(indexPath);
 return Object.entries(index)
 .map(([sessionKey, meta]) => getSessionSummary(sessionKey, meta, options))
 .filter((row) => row.hasWindowActivity || options.includeInactive);
}

function aggregateLeaderboard(sessionRows, options = {}) {
 const windowStart = iso(options.windowStart || startOfWindow(7));
 const windowEnd = iso(options.windowEnd || new Date());
 const byAgent = new Map();

 for (const row of sessionRows) {
 const groupKey = `${row.agentId}::${row.ownerName}`;
 if (!byAgent.has(groupKey)) {
 byAgent.set(groupKey, {
 agentName: row.agentId,
 ownerName: row.ownerName,
 periodType: 'weekly',
 periodStart: windowStart,
 periodEnd: windowEnd,
 tokenUsage: 0,
 commits: 0,
 filesTouched: 0,
 linesAdded: 0,
 linesRemoved: 0,
 toolCalls: 0,
 messageCount: 0,
 sessionCount: 0,
 shareUrl: `/share/${encodeURIComponent(row.agentId)}-${encodeURIComponent(row.ownerName)}`,
 channels: new Set(),
 models: new Set(),
 });
 }
 const agg = byAgent.get(groupKey);
 agg.tokenUsage += row.tokenUsage;
 agg.toolCalls += row.toolCalls;
 agg.messageCount += row.messageCount;
 agg.sessionCount += 1;
 if (row.channel) agg.channels.add(row.channel);
 if (row.model) agg.models.add(row.model);
 }

 return [...byAgent.values()]
 .map((row) => ({
 ...row,
 channels: [...row.channels],
 models: [...row.models],
 }))
 .sort((a, b) => b.tokenUsage - a.tokenUsage);
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
 return { commits: 0, filesTouched: 0, linesAdded: 0, linesRemoved: 0 };
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
 };
}

function attachGitMetrics(leaderboardRows, gitMetricsByAgent = {}) {
 return leaderboardRows.map((row) => ({
 ...row,
 ...(gitMetricsByAgent[row.agentName] || {}),
 }));
}

function buildShareDetail(entry, extras = {}) {
 const channels = entry.channels?.length ? `Channels: ${entry.channels.join(', ')}` : null;
 const models = entry.models?.length ? `Models: ${entry.models.join(', ')}` : null;
 const subtitleBits = [channels, models].filter(Boolean);
 return {
 agentName: entry.agentName,
 ownerName: entry.ownerName,
 periodType: entry.periodType,
 periodStart: entry.periodStart,
 periodEnd: entry.periodEnd,
 title: `${entry.agentName} by ${entry.ownerName}`,
 subtitle: subtitleBits.join(' · ') || 'OpenClaw activity summary',
 tokenUsage: entry.tokenUsage,
 commits: entry.commits,
 filesTouched: entry.filesTouched,
 linesAdded: entry.linesAdded,
 linesRemoved: entry.linesRemoved,
 toolCalls: entry.toolCalls,
 messageCount: entry.messageCount,
 sessionCount: entry.sessionCount,
 topTools: extras.topTools || [],
 notableOutputs: extras.notableOutputs || [],
 shareText: `${entry.agentName} by ${entry.ownerName} used ${entry.tokenUsage.toLocaleString()} tokens in the last 7 days across ${entry.sessionCount} sessions, with ${entry.toolCalls} tool calls and ${entry.commits} commit${entry.commits === 1 ? '' : 's'}.`,
 shareUrl: entry.shareUrl,
 };
}

module.exports = {
 aggregateLeaderboard,
 attachGitMetrics,
 buildShareDetail,
 getGitMetrics,
 getSessionSummary,
 loadOpenClawSessions,
 parseSessionKey,
 startOfWindow,
};
