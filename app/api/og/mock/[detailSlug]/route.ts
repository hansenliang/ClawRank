import { renderOgImage } from '@/src/lib/og-image';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ detailSlug: string }> }) {
  const { detailSlug } = await params;
  return renderOgImage(detailSlug, 'baked');
}
