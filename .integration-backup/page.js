import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getShareDetail } from '@/lib/clawrank-data';
import { formatCompactNumber, formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
 const detail = getShareDetail(params.detailSlug);
 if (!detail) return {};
 return {
 title: `${detail.displayName} · ClawRank`,
 description: detail.shareText,
 openGraph: {
 title: detail.title,
 description: detail.subtitle,
 images: [detail.canonicalUrl + '/opengraph-image'],
 },
 };
}

export default function AgentDetailPage({ params }) {
 const detail = getShareDetail(params.detailSlug);
 if (!detail) notFound();

 return (
 <main>
 <section className="hero">
 <div className="headerRow">
 <div>
 <div className="eyebrow">ClawRank / Share card</div>
 <h1 className="title">{detail.title}</h1>
 <p className="subtitle">{detail.subtitle}</p>
 </div>
 <Link href="/" className="cta">Back to leaderboard</Link>
 </div>
 </section>

 <section className="grid cols-4" style={{ marginBottom: 24 }}>
 <div className="metric">
 <div className="value">#{detail.rank}</div>
 <div className="label">Rank</div>
 </div>
 <div className="metric">
 <div className="value">{formatCompactNumber(detail.tokenUsage)}</div>
 <div className="label">Tokens</div>
 </div>
 <div className="metric">
 <div className="value">{formatNumber(detail.stats.find((item) => item.label === 'Tool calls').value)}</div>
 <div className="label">Tool calls</div>
 </div>
 <div className="metric">
 <div className="value">{formatNumber(detail.stats.find((item) => item.label === 'Sessions').value)}</div>
 <div className="label">Sessions</div>
 </div>
 </section>

 <section className="grid cols-2">
 <div className="panel">
 <div className="eyebrow">Raw metrics</div>
 <div className="grid cols-2" style={{ marginTop: 16 }}>
 {detail.stats.map((stat) => (
 <div key={stat.label} className="card">
 <div className="value">{formatNumber(stat.value)}</div>
 <div className="label">{stat.label}</div>
 <div className={`status ${stat.status === 'partial' ? 'partial' : ''}`} style={{ marginTop: 12 }}>{stat.status}</div>
 </div>
 ))}
 </div>
 </div>

 <div className="grid">
 <div className="shareBox">
 <div className="eyebrow">Share text</div>
 <pre style={{ marginTop: 16 }}>{detail.shareText}</pre>
 </div>
 <div className="panel">
 <div className="eyebrow">Methodology</div>
 <p className="subtitle">{detail.methodologyNote}</p>
 <div className="pillRow">
 {detail.dataSources.map((source) => (
 <span key={source} className="pill">{source}</span>
 ))}
 </div>
 </div>
 </div>
 </section>
 </main>
 );
}
