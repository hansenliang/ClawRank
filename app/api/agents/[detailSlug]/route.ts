import { NextResponse } from 'next/server';
import { getShareDetail } from '@/src/lib/data';

export async function GET(_request: Request, { params }: { params: Promise<{ detailSlug: string }> }) {
 const { detailSlug } = await params;
 const detail = await getShareDetail(detailSlug);
 if (!detail) {
 return NextResponse.json({ error: 'Not found' }, { status: 404 });
 }
 return NextResponse.json({ detail });
}
