#!/usr/bin/env node
/**
 * Bake leaderboard + detail data to static JSON files.
 * Run: pnpm bake (or node scripts/bake-data.js)
 *
 * Output goes to data/ directory so the app can serve from
 * baked JSON on Vercel without needing live OpenClaw logs.
 */
const fs = require('fs');
const path = require('path');
const { buildLeaderboardResponse, buildShareDetailResponse } = require('../src/server/clawrank-data');

const OUT_DIR = path.join(__dirname, '..', 'data');
const AGENTS_DIR = path.join(OUT_DIR, 'agents');

const options = {
 indexPath: process.env.OPENCLAW_SESSIONS_INDEX,
 repoPath: process.env.CLAWRANK_REPO_PATH || path.join(__dirname, '..'),
 baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://clawrank.vercel.app',
 defaultOwnerName: process.env.CLAWRANK_OWNER_NAME || 'Hansen',
};

console.log('Baking leaderboard data...');
const leaderboard = buildLeaderboardResponse(options);

fs.mkdirSync(AGENTS_DIR, { recursive: true });
fs.writeFileSync(
 path.join(OUT_DIR, 'leaderboard.json'),
 JSON.stringify(leaderboard, null, 2)
);
console.log(` ✅ data/leaderboard.json (${leaderboard.rows.length} rows)`);

for (const row of leaderboard.rows) {
 const slug = row.detailSlug;
 const detail = buildShareDetailResponse(slug, options);
 if (detail) {
 fs.writeFileSync(
 path.join(AGENTS_DIR, `${slug}.json`),
 JSON.stringify(detail, null, 2)
 );
 console.log(` ✅ data/agents/${slug}.json`);
 }
}

console.log('Done. Baked data is ready for static deploy.');
