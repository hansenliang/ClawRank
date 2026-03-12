import { NextResponse } from 'next/server';
import type { DailyFactSubmission } from '@/src/contracts/clawrank-domain';
import { readStore, submitDailyFactSubmission, writeStore } from '@/src/domain/clawrank-store';

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

 try {
 const store = readStore();
 const result = submitDailyFactSubmission(store, body);
 writeStore(store);
 return NextResponse.json({
 ok: true,
 agent: {
 slug: result.agent.slug,
 state: result.agent.state,
 },
 upsertedFacts: result.upsertedFacts,
 });
 } catch (error) {
 return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
 }
}
