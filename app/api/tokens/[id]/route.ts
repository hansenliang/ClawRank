/**
 * DELETE /api/tokens/[id] — Revoke a token (soft delete).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/src/lib/auth';
import { dbRevokeToken } from '@/src/db/queries';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const revoked = await dbRevokeToken(id, session.userId);
  if (!revoked) {
    return NextResponse.json({ error: 'Token not found or already revoked' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
