import { NextResponse } from 'next/server';
import { hasDB } from '@/src/db/connection';
import { dbSubmitDailyFactSubmission } from '@/src/db/queries';
import { runOpenClawPilotIngestion } from '@/src/ingestion/openclaw/run';

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

  let body: { indexPath?: string; ownerName?: string; agentNames?: Record<string, string> } = {};
  try {
    if (request.headers.get('content-length') !== '0') {
      body = (await request.json()) as typeof body;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // The ingestion pipeline always parses + translates from OpenClaw transcripts.
    // If DB is available, re-submit each fact to Postgres after the JSON store write.
    const result = runOpenClawPilotIngestion(body);

    if (hasDB()) {
      // Also push the translated data into Postgres
      const { loadOpenClawUsageMessages } = await import('@/src/adapters/openclaw/parser');
      const { translateOpenClawToDailyFactSubmissions } = await import('@/src/ingestion/openclaw/translate');
      const indexPath = body.indexPath || process.env.OPENCLAW_SESSIONS_INDEX || '';
      const messages = loadOpenClawUsageMessages(indexPath);
      const submissions = translateOpenClawToDailyFactSubmissions(messages, {
        ownerName: body.ownerName,
        agentNames: body.agentNames,
      });

      for (const submission of submissions) {
        await dbSubmitDailyFactSubmission(submission);
      }
    }

    return NextResponse.json({ ok: true, store: hasDB() ? 'postgres' : 'json', ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
