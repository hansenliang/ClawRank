import fs from 'node:fs';
import { getAppUrl, getOwnerName, getRepoPath, getSessionsIndexPath } from '@/lib/config';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildLeaderboardResponse, buildShareDetailResponse } = require('../src/server/clawrank-data');

function commonOptions() {
 return {
 indexPath: getSessionsIndexPath(),
 repoPath: getRepoPath(),
 baseUrl: getAppUrl(),
 defaultOwnerName: getOwnerName(),
 now: process.env.CLAWRANK_NOW,
 };
}

function emptyResponse(error) {
 const now = new Date();
 const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
 const periodEnd = now.toISOString();
 return {
 periodType: 'weekly',
 periodLabel: 'Last 7 days',
 periodStart,
 periodEnd,
 generatedAt: periodEnd,
 rows: [],
 error,
 };
}

export function getLeaderboardData() {
 const indexPath = getSessionsIndexPath();
 if (!fs.existsSync(indexPath)) {
 return emptyResponse(`OpenClaw sessions index not found at ${indexPath}`);
 }

 try {
 return buildLeaderboardResponse(commonOptions());
 } catch (error) {
 return emptyResponse(String(error?.message || error));
 }
}

export function getShareDetail(detailSlug) {
 const indexPath = getSessionsIndexPath();
 if (!fs.existsSync(indexPath)) return null;

 try {
 const payload = buildShareDetailResponse(detailSlug, commonOptions());
 return payload?.detail || null;
 } catch {
 return null;
 }
}
