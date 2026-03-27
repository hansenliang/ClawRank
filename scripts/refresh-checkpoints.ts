import fs from 'node:fs';
import path from 'node:path';
import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';
import { getLeaderboardData, getShareDetail } from '@/src/lib/clawrank-data';

const ROOT = process.cwd();
const CHECKPOINT_DIR = path.join(ROOT, 'data', 'checkpoints');
const LEADERBOARD_DIR = path.join(CHECKPOINT_DIR, 'leaderboards');
const AGENTS_DIR = path.join(CHECKPOINT_DIR, 'agents');

function ensureDirs() {
 fs.mkdirSync(LEADERBOARD_DIR, { recursive: true });
 fs.mkdirSync(AGENTS_DIR, { recursive: true });
}

function writeJson(filePath: string, payload: unknown) {
 fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function slugKey(detailSlug: string) {
 return detailSlug.replace('/', '__');
}

async function main() {
 ensureDirs();

 const periods: LeaderboardPeriod[] = ['alltime', 'month', 'week', 'today'];
 const alltimeSlugs = new Set<string>();

 for (const period of periods) {
  const leaderboard = await getLeaderboardData('live', period);
  writeJson(path.join(LEADERBOARD_DIR, `${period}.json`), leaderboard);

  if (period === 'alltime') {
   for (const row of leaderboard.rows) {
    if (row.detailSlug) alltimeSlugs.add(row.detailSlug);
   }
  }
 }

 for (const detailSlug of alltimeSlugs) {
  const detail = await getShareDetail(detailSlug, 'live');
  if (!detail) continue;

  writeJson(path.join(AGENTS_DIR, `${slugKey(detail.detailSlug)}.json`), { detail });

  const single = detail.detailSlug.includes('/') ? detail.detailSlug.split('/')[1] : detail.detailSlug;
  if (single) {
   writeJson(path.join(AGENTS_DIR, `${single}.json`), { detail });
  }
 }

 console.log(`✅ Checkpoints refreshed: ${periods.length} leaderboard files, ${alltimeSlugs.size} detail candidates.`);
}

main().catch((error) => {
 console.error('❌ Failed to refresh checkpoints:', error);
 process.exit(1);
});
