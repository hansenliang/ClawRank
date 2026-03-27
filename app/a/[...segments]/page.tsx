import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { WindowChrome } from '@/app/components/chrome';
import { SharePayloadButton } from '@/app/components/share-payload-button';
import { SiteFooter } from '@/app/components/site-footer';
import { StateBadge } from '@/app/components/state-badge';
import { StatGrid } from '@/app/components/stat-grid';
import { AnimatedMetricValue } from '@/app/components/animated-metric-value';
import { TextBox } from '@/app/components/text-box';
import { TypeOnText } from '@/app/components/type-on-text';
import { formatCompact, formatPeriodLabel, getShareDetail } from '@/src/lib/data';
import { getAbsoluteUrl, getDetailPath, getOgImagePath, getRequestOrigin } from '@/src/lib/site';

export const revalidate = 300;

const SLUG_SEGMENT = /^[a-z0-9][a-z0-9-]{0,128}$/;

/**
 * Resolve segments to a detailSlug:
 * - 1 segment = legacy slug → look up and redirect to canonical 2-segment URL
 * - 2 segments = canonical username/agentSlug
 * - anything else = 404
 */
function parseSegments(segments: string[]): { mode: 'canonical'; detailSlug: string } | { mode: 'legacy'; legacySlug: string } | null {
  if (segments.length === 2 && SLUG_SEGMENT.test(segments[0]) && SLUG_SEGMENT.test(segments[1])) {
    return { mode: 'canonical', detailSlug: `${segments[0]}/${segments[1]}` };
  }
  if (segments.length === 1 && SLUG_SEGMENT.test(segments[0])) {
    return { mode: 'legacy', legacySlug: segments[0] };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ segments: string[] }> }): Promise<Metadata> {
  const { segments } = await params;
  const parsed = parseSegments(segments);
  if (!parsed) return {};

  // For legacy URLs, look up the detail to get the canonical slug for OG tags
  const lookupSlug = parsed.mode === 'canonical' ? parsed.detailSlug : parsed.legacySlug;
  const detail = await getShareDetail(lookupSlug, 'live');
  if (!detail) return {};

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const pageUrl = getAbsoluteUrl(getDetailPath(detail.detailSlug), origin);
  const imageUrl = getAbsoluteUrl(getOgImagePath(detail.detailSlug), origin);

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

export default async function AgentDetailPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const parsed = parseSegments(segments);
  if (!parsed) notFound();

  if (parsed.mode === 'legacy') {
    // Look up by single slug and 301 redirect to canonical
    const detail = await getShareDetail(parsed.legacySlug, 'live');
    if (!detail) notFound();
    if (detail.detailSlug.includes('/')) {
      permanentRedirect(`/a/${detail.detailSlug}`);
    }
    // If detailSlug is still single-segment (shouldn't happen after migration), render it
  }

  const detailSlug = parsed.mode === 'canonical' ? parsed.detailSlug : parsed.legacySlug;
  const detail = await getShareDetail(detailSlug, 'live');
  if (!detail) notFound();
  const allMetricsVerified = detail.stats.length > 0 && detail.stats.every((stat) => stat.status === 'verified');

  return (
    <main className="shell">
      <WindowChrome title={`clawrank://agent/${detail.detailSlug}`}>
        <section className="hero">
<div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
<Link className="action" href="/">Back to leaderboard</Link>
</div>
          <div className="hero-card">
<Link className="kicker" href="/">#{detail.rank} on ClawRank &middot; {detail.periodLabel}</Link>
            <h1>
  <TypeOnText
    text={`${detail.agentName} by @${detail.ownerName}`}
    containerClassName="brand-heading-inner"
    textClassName="brand-heading-text"
    cursorClassName="brand-heading-cursor"
  />
            </h1>
            <p className="muted" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <StateBadge state={detail.derivedState} />
              {detail.subtitle}
            </p>
            <div className="hero-grid">
              <div className="stat">
                <div className="stat-label">Token usage</div>
<AnimatedMetricValue className="stat-value" value={`${formatCompact(detail.tokenUsage)} tokens`} />
              </div>
              <div className="stat">
                <div className="stat-label">Range</div>
<AnimatedMetricValue
  className="stat-value"
  style={{ fontSize: 22 }}
  value={formatPeriodLabel(detail.periodStart, detail.periodEnd)}
/>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="eyebrow">Share payload</div>
<TextBox className="codeblock-spaced">{detail.shareText}</TextBox>
            <div className="actions actions-spaced">
              <SharePayloadButton payload={detail.shareText} label={detail.displayName} />
            </div>
          </div>
        </section>

        <section className="detail-grid">
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="eyebrow">Raw metrics</div>
              {allMetricsVerified ? <span className="status-badge">verified</span> : null}
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid stats={detail.stats} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="panel">
              <div className="eyebrow">Top tools</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {(detail.topTools || []).length
                  ? detail.topTools?.map((tool) => <span className="pill" key={tool}>{tool}</span>)
                  : <span className="muted">—</span>}
              </div>
            </div>
            {(detail.notableOutputs || []).length > 0 && (
              <div className="panel">
                <div className="eyebrow">Notable outputs</div>
                <div className="list" style={{ marginTop: 16 }}>
                  {detail.notableOutputs?.map((output) => (
                    <div className="list-item" key={output.label}>
                      <div>{output.label}</div>
                      {output.description ? <div className="muted" style={{ marginTop: 8 }}>{output.description}</div> : null}
                      {output.href ? <div className="muted" style={{ marginTop: 8 }}>{output.href}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="panel">
              <div className="eyebrow">Methodology</div>
              <p className="muted" style={{ marginTop: 16, lineHeight: 1.6 }}>{detail.methodologyNote}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {detail.dataSources.map((source) => <span className="pill" key={source}>{source}</span>)}
              </div>
            </div>
          </div>
        </section>
        <SiteFooter />
      </WindowChrome>
    </main>
  );
}
