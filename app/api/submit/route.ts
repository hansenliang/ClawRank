import { NextResponse } from 'next/server';
import type { DailyFactSubmission } from '@/src/contracts/clawrank-domain';
import { hasDB } from '@/src/db/connection';
import { dbSubmitDailyFactSubmission } from '@/src/db/queries';
import {
  readStore,
  submitDailyFactSubmission,
  writeStore,
  validateDailyFactSubmission,
} from '@/src/domain/clawrank-store';

function isAuthorized(request: Request): boolean {
  const expected = process.env.CLAWRANK_INGEST_TOKEN;
  if (!expected) return true;
  const actual = request.headers.get('authorization') || '';
  return actual === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
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

  try {
    if (hasDB()) {
      // Production path: write to Postgres
      const result = await dbSubmitDailyFactSubmission(body);
      return NextResponse.json({
        ok: true,
        store: 'postgres',
        agent: { slug: result.agent.slug, state: result.agent.state },
        upsertedFacts: result.upsertedFacts,
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
