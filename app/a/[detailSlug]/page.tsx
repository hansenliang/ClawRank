import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WindowChrome } from '@/app/components/chrome';
import { StatGrid } from '@/app/components/stat-grid';
import { formatCompact, formatPeriodLabel, getShareDetail } from '@/src/lib/data';

export async function generateMetadata({ params }: { params: Promise<{ detailSlug: string }> }): Promise<Metadata> {
  const { detailSlug } = await params;
  const detail = await getShareDetail(detailSlug);
  if (!detail) return {};

  return {
    title: detail.displayName,
    description: detail.shareText,
    openGraph: {
      title: detail.title,
      description: detail.subtitle,
      images: [`/api/og/${detailSlug}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: detail.title,
      description: detail.subtitle,
      images: [`/api/og/${detailSlug}`],
    },
  };
}

export default async function DetailPage({ params }: { params: Promise<{ detailSlug: string }> }) {
  const { detailSlug } = await params;
  const detail = await getShareDetail(detailSlug);
  if (!detail) notFound();

  return (
    <main className="shell">
      <WindowChrome title={`clawrank://agent/${detail.detailSlug}`}>
        <section className="hero">
          <div className="hero-card">
            <div className="kicker">Agent detail</div>
            <h1>{detail.title}</h1>
            <p className="muted" style={{ marginTop: 12 }}>{detail.subtitle}</p>
            <div className="hero-grid">
              <div className="stat">
                <div className="stat-label">Hero stat</div>
                <div className="stat-value">{formatCompact(detail.tokenUsage)} tokens</div>
              </div>
              <div className="stat">
                <div className="stat-label">Exact range</div>
                <div className="stat-value" style={{ fontSize: 22 }}>{formatPeriodLabel(detail.periodStart, detail.periodEnd)}</div>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="eyebrow">Share payload</div>
            <div className="codeblock" style={{ marginTop: 16 }}>{detail.shareText}</div>
            <div className="actions" style={{ marginTop: 16 }}>
              <a className="action" href={detail.canonicalUrl}>Canonical URL</a>
              <a className="action" href={`/api/og/${detail.detailSlug}`}>OG image</a>
              <a className="action" href="/">Back to leaderboard</a>
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
