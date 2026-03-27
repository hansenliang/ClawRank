import fs from 'node:fs';
import path from 'node:path';

const baseUrl = (process.env.CHECKPOINT_SOURCE_URL || 'https://claw-rank-4b11305x2-hansenliangs-projects.vercel.app').replace(/\/$/, '');
const periods = ['alltime', 'month', 'week', 'today'] as const;

const checkpointDir = path.join(process.cwd(), 'data', 'checkpoints');
const leaderboardDir = path.join(checkpointDir, 'leaderboards');
const agentsDir = path.join(checkpointDir, 'agents');

function writeJson(filePath: string, payload: unknown) {
 fs.mkdirSync(path.dirname(filePath), { recursive: true });
 fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function safeDetailFileKeys(detailSlug: string): string[] {
 const single = detailSlug.includes('/') ? detailSlug.split('/')[1] : detailSlug;
 const keys = new Set<string>([detailSlug.replace('/', '__')]);
 if (single) keys.add(single);
 return [...keys];
}

async function fetchJson<T>(url: string): Promise<T> {
 const res = await fetch(url, { headers: { Accept: 'application/json' } });
 if (!res.ok) {
  throw new Error(`${res.status} ${res.statusText} for ${url}`);
 }
 return (await res.json()) as T;
}

async function main() {
 const detailSlugs = new Set<string>();
 let totalRows = 0;

 for (const period of periods) {
  const leaderboard = await fetchJson<{ rows?: Array<{ detailSlug?: string }> }>(`${baseUrl}/api/leaderboard?period=${period}`);
  const rows = Array.isArray(leaderboard.rows) ? leaderboard.rows : [];

  if (!rows.length) {
   console.warn(`⚠️ Skipping ${period}: no rows returned`);
   continue;
  }

  writeJson(path.join(leaderboardDir, `${period}.json`), leaderboard);

  for (const row of rows) {
    if (row.detailSlug) detailSlugs.add(row.detailSlug);
  }

  totalRows += rows.length;
  console.log(`✓ ${period}: ${rows.length} rows`);
 }

 const fetchedDetails: string[] = [];
 for (const slug of detailSlugs) {
  try {
   const payload = await fetchJson<{ detail?: unknown }>(`${baseUrl}/api/agents/${slug}`);
   if (!payload?.detail) continue;

   for (const key of safeDetailFileKeys(slug)) {
    writeJson(path.join(agentsDir, `${key}.json`), payload);
   }
   fetchedDetails.push(slug);
  } catch (error) {
   console.warn(`⚠️ Skipping detail ${slug}:`, error instanceof Error ? error.message : String(error));
  }
 }

 console.log(`✅ Checkpoints refreshed from ${baseUrl}`);
 console.log(`   - leaderboard rows written: ${totalRows}`);
 console.log(`   - agent details written: ${fetchedDetails.length}`);
}

main().catch((error) => {
 console.error('❌ Failed to refresh checkpoints:', error);
 process.exit(1);
});
