/**
 * GET  /api/tokens — List user's active tokens (no raw values).
 * POST /api/tokens — Create a new API token (raw value returned once).
 */
import { NextResponse } from 'next/server';
import { getSession, generateRawToken, hashToken } from '@/src/lib/auth';
import { dbGetTokensForUser, dbCreateApiToken } from '@/src/db/queries';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await dbGetTokensForUser(session.userId);
  return NextResponse.json({
    tokens: tokens.map(t => ({
      id: t.id,
      label: t.label,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let label: string | null = null;
  try {
    const body = await request.json() as { label?: string };
    label = body.label?.trim() || null;
  } catch {
    // No body is fine — label is optional
  }

  const rawToken = generateRawToken();
  const tokenHash = await hashToken(rawToken);

  // Limit active tokens per user (prevent abuse)
  const existing = await dbGetTokensForUser(session.userId);
  if (existing.length >= 10) {
    return NextResponse.json({ error: 'Maximum 10 active tokens. Revoke one first.' }, { status: 400 });
  }

  const token = await dbCreateApiToken(session.userId, tokenHash, label);

  return NextResponse.json({
    token: rawToken,
    tokenId: token.id,
    label: token.label,
    createdAt: token.createdAt,
  }, { status: 201 });
}
