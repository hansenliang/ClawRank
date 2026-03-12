import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WindowChrome } from '@/app/components/chrome';
import { ShareLinkButton } from '@/app/components/share-link-button';
import { StatGrid } from '@/app/components/stat-grid';
import { formatCompact, formatPeriodLabel, getShareDetail } from '@/src/lib/data';
import { getAbsoluteUrl, getDetailPath, getOgImagePath, getRequestOrigin } from '@/src/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ detailSlug: string }> }): Promise<Metadata> {
 const { detailSlug } = await params;
 const detail = await getShareDetail(detailSlug, 'baked');
 if (!detail) return {};

 const requestHeaders = await headers();
 const origin = getRequestOrigin(requestHeaders);
 const pageUrl = getAbsoluteUrl(`/mock${getDetailPath(detailSlug)}`, origin);
 const imageUrl = getAbsoluteUrl(getOgImagePath(detailSlug), origin);

 return {
 metadataBase: new URL(origin),
 title: detail.displayName,
 description: detail.shareText,
 alternates: {
 canonical: pageUrl,
 },
 openGraph: {
 title: detail.title,
 description: detail.subtitle,
 type: 'website',
 url: pageUrl,
 images: [
 {
 url: imageUrl,
 width: 1200,
 height: 630,
 alt: `${detail.displayName} share image`,
 },
 ],
 },
 twitter: {
 card: 'summary_large_image',
 title: detail.title,
 description: detail.subtitle,
 images: [imageUrl],
 },
 };
}

export default async function DetailPage({ params }: { params: Promise<{ detailSlug: string }> }) {
 const { detailSlug } = await params;
 const detail = await getShareDetail(detailSlug, 'baked');
 if (!detail) notFound();

 const origin = getRequestOrigin(await headers());
 const shareUrl = getAbsoluteUrl(`/mock${getDetailPath(detailSlug)}`, origin);
 const imageUrl = getAbsoluteUrl(getOgImagePath(detailSlug), origin);

 return (
 <main className="shell">
 <WindowChrome title={`clawrank://mock/agent/${detail.detailSlug}`}>
 <section className="hero">
 <div className="hero-card">
 <div className="kicker">#{detail.rank} on ClawRank this week</div>
 <h1>{detail.agentName} <span className="muted">by</span> @{detail.ownerName}</h1>
 <p className="muted" style={{ marginTop: 12 }}>{detail.subtitle}</p>
 <div className="hero-grid">
 <div className="stat">
 <div className="stat-label">Token usage</div>
 <div className="stat-value">{formatCompact(detail.tokenUsage)} tokens</div>
 </div>
 <div className="stat">
 <div className="stat-label">Range</div>
 <div className="stat-value" style={{ fontSize: 22 }}>{formatPeriodLabel(detail.periodStart, detail.periodEnd)}</div>
 </div>
 </div>
 </div>
 <div className="hero-card">
 <div className="eyebrow">Share payload</div>
 <div className="codeblock" style={{ marginTop: 16 }}>{detail.shareText}</div>
 <div className="actions actions-spaced">
 <a className="action" href={shareUrl}>Share URL</a>
 <a className="action" href={imageUrl}>OG image</a>
 <ShareLinkButton path={getDetailPath(detail.detailSlug)} label={detail.displayName} />
 <Link className="action" href="/mock">Back to mock leaderboard</Link>
 </div>
 </div>
 </section>

 <section className="detail-grid">
 <div className="panel">
 <div className="eyebrow">Raw metrics</div>
 <div style={{ marginTop: 16 }}>
 <StatGrid stats={detail.stats} />
 </div>
 </div>
 <div style={{ display: 'grid', gap: 20 }}>
 <div className="panel">
 <div className="eyebrow">Top tools</div>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
 {(detail.topTools || []).map((tool) => <span className="pill" key={tool}>{tool}</span>)}
 </div>
 </div>
 <div className="panel">
 <div className="eyebrow">Notable outputs</div>
 <div className="list" style={{ marginTop: 16 }}>
 {(detail.notableOutputs || []).length ? detail.notableOutputs?.map((output) => (
 <div className="list-item" key={output.label}>
 <div>{output.label}</div>
 {output.description ? <div className="muted" style={{ marginTop: 8 }}>{output.description}</div> : null}
 {output.href ? <div className="muted" style={{ marginTop: 8 }}>{output.href}</div> : null}
 </div>
 )) : <div className="list-item muted">No safe artifacts attached yet.</div>}
 </div>
 </div>
 <div className="panel">
 <div className="eyebrow">Methodology</div>
 <p className="muted" style={{ marginTop: 16, lineHeight: 1.6 }}>{detail.methodologyNote}</p>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
 {detail.dataSources.map((source) => <span className="pill" key={source}>{source}</span>)}
 </div>
 </div>
 </div>
 </section>
 </WindowChrome>
 </main>
 );
}
