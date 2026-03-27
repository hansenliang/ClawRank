import { NextResponse } from 'next/server';
import { getShareDetail } from '@/src/lib/data';

const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,128}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;

  let detailSlug: string;
  if (segments.length === 2 && VALID_SLUG.test(segments[0]) && VALID_SLUG.test(segments[1])) {
    detailSlug = `${segments[0]}/${segments[1]}`;
  } else if (segments.length === 1 && VALID_SLUG.test(segments[0])) {
    detailSlug = segments[0];
  } else {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const detail = await getShareDetail(detailSlug);
  if (!detail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(
    { detail },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400',
      },
    },
  );
}
