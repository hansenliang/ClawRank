const fs = require('fs');
const path = require('path');
const {
 buildLeaderboardResponse,
 buildShareDetailResponse,
} = require('../src/server/clawrank-data');

const root = path.resolve(__dirname, '..');
const openClawIndexPath = process.env.OPENCLAW_SESSIONS_INDEX || '~/.openclaw/agents/main/sessions/sessions.json';
const gitRepoPath = process.env.CLAWRANK_GIT_REPO || root;
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clawrank.local';
const now = new Date(process.env.CLAWRANK_NOW || Date.now());

const leaderboard = buildLeaderboardResponse({
 indexPath: openClawIndexPath,
 repoPath: gitRepoPath,
 baseUrl,
 defaultOwnerName: process.env.CLAWRANK_DEFAULT_OWNER || 'Hansen',
 now,
});

const topSlug = leaderboard.rows[0]?.detailSlug;
const shareDetail = topSlug
 ? buildShareDetailResponse(topSlug, {
 indexPath: openClawIndexPath,
 repoPath: gitRepoPath,
 baseUrl,
 defaultOwnerName: process.env.CLAWRANK_DEFAULT_OWNER || 'Hansen',
 now,
 })
 : null;

const payload = {
 generatedAt: leaderboard.generatedAt,
 periodType: leaderboard.periodType,
 periodLabel: leaderboard.periodLabel,
 periodStart: leaderboard.periodStart,
 periodEnd: leaderboard.periodEnd,
 leaderboard: leaderboard.rows,
 shareDetail: shareDetail?.detail || null,
};

const outPath = path.join(root, 'examples', 'weekly-sample.json');
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
console.log(outPath);
