import { renderOgImage } from '@/src/lib/og-image';

export const runtime = 'nodejs';

const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,128}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ username: string; agentSlug: string }> }) {
  const { username, agentSlug } = await params;
  if (!VALID_SLUG.test(username) || !VALID_SLUG.test(agentSlug)) {
    return new Response('Not found', { status: 404 });
  }
  return renderOgImage(`${username}/${agentSlug}`, 'live');
}
