import { NextResponse } from 'next/server';
import type { DailyFactSubmission, UserRecord } from '@/src/contracts/clawrank-domain';
import { hasDB } from '@/src/db/connection';
import { dbSubmitDailyFactSubmission, dbGetAgentShareInfo, dbFindValidToken } from '@/src/db/queries';
import { hashToken } from '@/src/lib/auth';
import {
  readStore,
  submitDailyFactSubmission,
  writeStore,
  validateDailyFactSubmission,
} from '@/src/domain/clawrank-store';

/**
 * Authenticate the request. Returns:
 * - { admin: true } for admin ingest token
 * - { admin: false, user: UserRecord } for per-user API token
 * - null if unauthorized
 */
async function authenticate(request: Request): Promise<{ admin: true } | { admin: false; user: UserRecord } | null> {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const bearer = authHeader.slice(7);
  if (!bearer) return null;

  // Check admin ingest token first
  const adminToken = process.env.CLAWRANK_INGEST_TOKEN;
  if (adminToken && bearer === adminToken) {
    return { admin: true };
  }

  // Check per-user API token
  const tokenHash = await hashToken(bearer);
  const result = await dbFindValidToken(tokenHash);
  if (result) {
    return { admin: false, user: result.user };
  }

  return null;
}

export async function POST(request: Request) {
  const auth = await authenticate(request);

  // If no auth configured at all (dev mode), allow through
  if (!auth && process.env.CLAWRANK_INGEST_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: DailyFactSubmission;
  try {
    body = (await request.json()) as DailyFactSubmission;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate before touching any store
  const errors = validateDailyFactSubmission(body);
  if (errors.length) {
    return NextResponse.json({ error: `Validation failed: ${errors.join('; ')}` }, { status: 400 });
  }

  // Resolve per-user token owner (if any)
  const authUser = auth && auth.admin === false ? auth.user : null;

  try {
    if (hasDB()) {
      // Production path: write to Postgres
      // For per-user token: agent is owned by that user
      // For admin token: dbSubmitDailyFactSubmission creates/finds phantom user from ownerName
      const result = await dbSubmitDailyFactSubmission(
        body,
        authUser ? { userId: authUser.id } : undefined,
      );

      // Fetch share info (rank + total tokens) for the response
      const shareInfo = await dbGetAgentShareInfo(result.agent.id);
      const username = shareInfo.username || result.username;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clawrank.dev';
      const shareUrl = `${siteUrl}/a/${username}/${result.agent.slug}`;
      const formattedTokens = shareInfo.totalTokens.toLocaleString('en-US');
      const agentName = body.agent.agentName || result.agent.slug;
      const shareText = `${agentName} is #${shareInfo.rank} on ClawRank with ${formattedTokens} tokens. ${shareUrl}`;

      return NextResponse.json({
        ok: true,
        store: 'postgres',
        agent: { slug: result.agent.slug, state: result.agent.state },
        upsertedFacts: result.upsertedFacts,
        share: {
          rank: shareInfo.rank,
          totalTokens: shareInfo.totalTokens,
          shareUrl,
          shareText,
        },
      });
    }

    // Fallback: write to local JSON (dev only, read-only on Vercel)
    const store = readStore();
    const result = submitDailyFactSubmission(store, body);
    writeStore(store);
    return NextResponse.json({
      ok: true,
      store: 'json',
      agent: { slug: result.agent.slug, state: result.agent.state },
      upsertedFacts: result.upsertedFacts,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
