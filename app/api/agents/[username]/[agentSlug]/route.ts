import { NextResponse } from 'next/server';
import { getShareDetail } from '@/src/lib/data';

const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,128}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ username: string; agentSlug: string }> }) {
  const { username, agentSlug } = await params;
  if (!VALID_SLUG.test(username) || !VALID_SLUG.test(agentSlug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const detail = await getShareDetail(`${username}/${agentSlug}`);
  if (!detail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ detail });
}
