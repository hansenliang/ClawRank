import { NextResponse } from 'next/server';
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
    const result = runOpenClawPilotIngestion(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
