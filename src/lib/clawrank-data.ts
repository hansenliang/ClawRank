import { SITE_URL } from './site';
import type { LeaderboardResponse, ShareDetail } from '@/src/contracts/clawrank';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
let serverModule: { buildLeaderboardResponse: Function; buildShareDetailResponse: Function } | null = null;
if (process.env.CLAWRANK_LIVE_DATA === 'true') {
 try {
 serverModule = require('../server/clawrank-data');
 } catch (err) {
 console.error('ClawRank: CLAWRANK_LIVE_DATA=true but server module failed to load:', err);
 }
}

const BAKED_DIR = path.join(process.cwd(), 'data');

function tryBakedLeaderboard(): LeaderboardResponse | null {
 try {
 const fp = path.join(BAKED_DIR, 'leaderboard.json');
 if (fs.existsSync(fp)) {
 return JSON.parse(fs.readFileSync(fp, 'utf-8'));
 }
 } catch { /* ignore */ }
 return null;
}

function isValidSlug(slug: string): boolean {
 return /^[a-z0-9][a-z0-9-]{0,128}$/.test(slug);
}

function tryBakedDetail(detailSlug: string): ShareDetail | null {
 if (!isValidSlug(detailSlug)) return null;
 try {
 const fp = path.join(BAKED_DIR, 'agents', `${detailSlug}.json`);
 if (fs.existsSync(fp)) {
 const payload = JSON.parse(fs.readFileSync(fp, 'utf-8'));
 return payload?.detail || null;
 }
 } catch { /* ignore */ }
 return null;
}

function commonOptions() {
 return {
 indexPath: process.env.OPENCLAW_SESSIONS_INDEX,
 repoPath: process.env.CLAWRANK_REPO_PATH || process.cwd(),
 baseUrl: process.env.NEXT_PUBLIC_SITE_URL || SITE_URL,
 defaultOwnerName: process.env.CLAWRANK_OWNER_NAME || 'Hansen',
 now: process.env.CLAWRANK_NOW,
 };
}

export function getLeaderboardData(): LeaderboardResponse {
 // Try baked data first (for Vercel / environments without live logs)
 const baked = tryBakedLeaderboard();
 if (baked) return baked;

 if (!serverModule) {
 return { periodType: 'weekly', periodLabel: 'Last 7 days', periodStart: '', periodEnd: '', generatedAt: '', rows: [] } as LeaderboardResponse;
 }
 return serverModule.buildLeaderboardResponse(commonOptions()) as LeaderboardResponse;
}

export function getShareDetail(detailSlug: string): ShareDetail | null {
 // Try baked data first
 const baked = tryBakedDetail(detailSlug);
 if (baked) return baked;

 if (!serverModule) return null;
 const payload = serverModule.buildShareDetailResponse(detailSlug, commonOptions()) as { detail: ShareDetail } | null;
 return payload?.detail || null;
}
