#!/usr/bin/env node
/**
 * Parse a saved “Save page as…” HTML from clawrank.dev leaderboard and write
 * remotion/src/video-leaderboard.generated.ts (top 10 rows).
 *
 *   node remotion/scripts/import-clawrank-html-snapshot.mjs ~/Downloads/page.html
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(REMOTION_ROOT, 'src', 'video-leaderboard.generated.ts');

function parseCompactTokens(s) {
  const t = s.trim().toUpperCase().replace(/,/g, '');
  if (t.endsWith('B')) return Math.round(parseFloat(t) * 1e9);
  if (t.endsWith('M')) return Math.round(parseFloat(t) * 1e6);
  if (t.endsWith('K')) return Math.round(parseFloat(t) * 1e3);
  return parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
}

function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath || !fs.existsSync(htmlPath)) {
    console.error('Usage: node import-clawrank-html-snapshot.mjs <path-to-saved.html>');
    process.exit(1);
  }

  const h = fs.readFileSync(htmlPath, 'utf8');
  const tbodyMatch = h.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) {
    console.error('No <tbody> found — is this a ClawRank leaderboard save?');
    process.exit(1);
  }

  const trs = tbodyMatch[1].split('</tr>').filter((r) => r.includes('rank-badge'));
  const rows = trs.slice(0, 10).map((r) => {
    const rank = parseInt(r.match(/rank-badge">(\d+)/)[1], 10);
    const m = r.match(/href="https:\/\/clawrank\.dev\/a\/([^"]+)"/);
    if (!m) throw new Error(`Row ${rank}: missing clawrank /a/ link`);
    const detailSlug = m[1];
    const sr = [...r.matchAll(/<span class="sr-only">([^<]*)<\/span>/g)].map((x) =>
      x[1].trim(),
    );
    const [agentName, byOwner, tokStr, toolStr, msgStr, gitStr] = sr;
    const ownerName = byOwner.replace(/^by @/i, '').trim();
    const tokenUsage = parseCompactTokens(tokStr);
    const toolCalls = parseInt(toolStr.replace(/,/g, ''), 10);
    const messageCount = parseInt(msgStr.replace(/,/g, ''), 10);
    const gitM = gitStr.match(/([\d,]+)\s*commits\s*·\s*([\d,]+)\s*files/);
    const commits = gitM ? parseInt(gitM[1].replace(/,/g, ''), 10) : 0;
    const filesTouched = gitM ? parseInt(gitM[2].replace(/,/g, ''), 10) : 0;
    const pills = [...r.matchAll(/<span class="pill">([^<]+)<\/span>/g)].map((x) => x[1]);
    const state = (r.match(/state-dot state-([a-z]+)/) || [, 'estimated'])[1];
    const derivedState =
      state === 'live' ? 'live' : state === 'verified' ? 'verified' : 'estimated';
    const sessionCount = Math.max(1, Math.round(toolCalls / 1200));
    /* Not in saved table HTML — synthetic for detail composition only */
    const linesAdded = Math.round(commits * 42);
    const linesRemoved = Math.round(commits * 11);

    return {
      id: String(rank),
      rank,
      agentName,
      ownerName,
      displayName: detailSlug,
      derivedState,
      periodType: 'weekly',
      /* Table is all-time; detail card still expects a range string */
      periodStart: '2024-01-01',
      periodEnd: '2026-03-20',
      tokenUsage: { value: tokenUsage, status: 'verified' },
      commits: { value: commits, status: 'verified' },
      filesTouched: { value: filesTouched, status: 'verified' },
      linesAdded: { value: linesAdded, status: 'verified' },
      linesRemoved: { value: linesRemoved, status: 'verified' },
      toolCalls: { value: toolCalls, status: 'verified' },
      messageCount: { value: messageCount, status: 'verified' },
      sessionCount: { value: sessionCount, status: 'verified' },
      shareUrl: '/a/' + detailSlug,
      detailSlug,
      topToolNames: pills,
      dataSources: ['openclaw-skill'],
      generatedAt: new Date().toISOString(),
    };
  });

  const json = JSON.stringify(rows, null, '\t');
  const ts = `/* eslint-disable */
/** Top 10 from saved clawrank leaderboard HTML — regenerate: node remotion/scripts/import-clawrank-html-snapshot.mjs <file.html> */
import type { LeaderboardRow } from './types';

export const BAKED_VIDEO_ROWS: LeaderboardRow[] = ${json};
`;

  fs.writeFileSync(OUT_FILE, ts, 'utf8');
  console.log(`Wrote ${OUT_FILE} (${rows.length} rows)`);
}

main();
