import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import type { LeaderboardResponse, ShareDetail } from '@/src/contracts/clawrank';
import { SITE_URL } from './site';

const require = createRequire(import.meta.url);

type CommonOptions = {
  indexPath?: string;
  repoPath?: string;
  baseUrl?: string;
  defaultOwnerName?: string;
  now?: string;
};

type ShareDetailPayload = { detail: ShareDetail } | null;

type ServerModule = {
  buildLeaderboardResponse: (options?: CommonOptions) => LeaderboardResponse;
  buildShareDetailResponse: (detailSlug: string, options?: CommonOptions) => ShareDetailPayload;
};

let serverModule: ServerModule | null = null;
if (process.env.CLAWRANK_LIVE_DATA === 'true') {
  try {
    serverModule = require('../server/clawrank-data') as ServerModule;
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

function commonOptions(): CommonOptions {
  return {
    indexPath: process.env.OPENCLAW_SESSIONS_INDEX,
    repoPath: process.env.CLAWRANK_REPO_PATH || process.cwd(),
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || SITE_URL,
    defaultOwnerName: process.env.CLAWRANK_OWNER_NAME || 'Hansen',
    now: process.env.CLAWRANK_NOW,
  };
}

export function getLeaderboardData(forceMode?: 'baked' | 'live'): LeaderboardResponse {
  if (forceMode === 'baked') {
    const baked = tryBakedLeaderboard();
    if (baked) return baked;
    // Fallback to empty if explicitly asked for baked but none exists
    return { periodType: 'weekly', periodLabel: 'Last 7 days', periodStart: '', periodEnd: '', generatedAt: '', rows: [] } as LeaderboardResponse;
  }

  // Live or default
  if (!serverModule) {
    return { periodType: 'weekly', periodLabel: 'Last 7 days', periodStart: '', periodEnd: '', generatedAt: '', rows: [] } as LeaderboardResponse;
  }
  return serverModule.buildLeaderboardResponse(commonOptions());
}

export function getShareDetail(detailSlug: string, forceMode?: 'baked' | 'live'): ShareDetail | null {
  if (forceMode === 'baked') {
    return tryBakedDetail(detailSlug);
  }

  // Live or default
  if (!serverModule) {
    return null;
  }
  const payload = serverModule.buildShareDetailResponse(detailSlug, commonOptions());
  return payload?.detail || null;
}
