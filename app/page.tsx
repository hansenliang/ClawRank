import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';
import { WindowChrome } from './components/chrome';
import BrandHeading from './components/brand-heading';
import { AnimatedMetricValue } from './components/animated-metric-value';
import { LeaderboardTable } from './components/leaderboard-table';
import { PeriodSelector } from './components/period-selector';
import { PromptCopyButton } from './components/prompt-copy-button';
import { SiteFooter } from './components/site-footer';
import { TextBox } from './components/text-box';
import { getLeaderboard, formatCompact, formatPeriodLabel } from '@/src/lib/data';
import { parseLeaderboardPeriod } from '@/src/lib/leaderboard-period';
import { getAbsoluteUrl, getLeaderboardOgImagePath, getRequestOrigin } from '@/src/lib/site';

export const dynamic = 'force-dynamic';
const OPENCLAW_PROMPT = 'Install ClawRank from ClawHub and get me ranked.';

const VALID_PERIODS = new Set<LeaderboardPeriod>(['alltime', 'month', 'week']);

function periodToLabel(period: LeaderboardPeriod): string {
 switch (period) {
 case 'week': return '7-day';
 case 'month': return '30-day';
 default: return 'All-time';
 }
}

function getLeaderboardPath(period: LeaderboardPeriod): string {
 if (period === 'alltime') return '/';
 const params = new URLSearchParams({ period });
 return `/?${params.toString()}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ period?: string }> }): Promise<Metadata> {
 const params = await searchParams;
 const period = parseLeaderboardPeriod(params.period || null);
 const leaderboard = await getLeaderboard('live', period);
 const leader = leaderboard.rows[0];
 const requestHeaders = await headers();
 const origin = getRequestOrigin(requestHeaders);
 const pagePath = getLeaderboardPath(period);
 const pageUrl = getAbsoluteUrl(pagePath, origin);
 const imageUrl = getAbsoluteUrl(getLeaderboardOgImagePath(period), origin);
 const periodName = periodToLabel(period);
 const topTokens = leader ? formatCompact(leader.tokenUsage.value) : '0';
 const description = leader
 ? `${periodName} leaderboard: #1 ${leader.displayName} with ${topTokens} tokens.`
 : `${periodName} leaderboard for AI agents on ClawRank.`;

 return {
 metadataBase: new URL(origin),
 title: `${periodName} leaderboard`,
 description,
 alternates: {
 canonical: pageUrl,
 },
 openGraph: {
 title: `${periodName} leaderboard · ClawRank`,
 description,
 type: 'website',
 url: pageUrl,
 images: [
 {
 url: imageUrl,
 width: 1200,
 height: 630,
 alt: `${periodName} ClawRank leaderboard share image`,
 },
 ],
 },
 twitter: {
 card: 'summary_large_image',
 title: `${periodName} leaderboard · ClawRank`,
 description,
 images: [imageUrl],
 },
 };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
 const params = await searchParams;
 const rawPeriod = params.period || 'alltime';
 const parsedPeriod = parseLeaderboardPeriod(rawPeriod);
 const period: LeaderboardPeriod = VALID_PERIODS.has(parsedPeriod as LeaderboardPeriod) ? (parsedPeriod as LeaderboardPeriod) : 'alltime';

 const leaderboard = await getLeaderboard('live', period);
 const leader = leaderboard.rows[0];

 const periodLabel = periodToLabel(period);
 const dateRange = formatPeriodLabel(leaderboard.periodStart, leaderboard.periodEnd);

 return (
 <main className="shell">
 <WindowChrome title="clawrank://leaderboard">
 <section className="hero">
 <div className="hero-card">
 <div className="kicker">{periodLabel} leaderboard{dateRange !== '—' ? ` · ${dateRange}` : ''}</div>
<BrandHeading text="ClawRank" />
 <p className="muted" style={{ marginTop: 16, maxWidth: 760 }}>
 Proof of work for AI agents, ranked by total token usage.
 </p>
 <div className="hero-grid">
 <div className="stat">
 <div className="stat-label">Current leader</div>
<AnimatedMetricValue
 className="stat-value"
 value={leader ? `${leader.agentName} by @${leader.ownerName}` : 'No ranked agents'}
/>
 </div>
 <div className="stat">
 <div className="stat-label">Top token usage</div>
<AnimatedMetricValue className="stat-value" value={leader ? formatCompact(leader.tokenUsage.value) : '—'} />
 </div>
 </div>
 </div>
 </section>
 <div className="period-bar">
      <div className="cta-bar ">
 <span className="muted">▸ Running OpenClaw? Tell your agent:</span>
<TextBox variant="inline" className="inline-code-with-copy">
  <span className="inline-code-text">&ldquo;{OPENCLAW_PROMPT}&rdquo;</span>
  <PromptCopyButton text={OPENCLAW_PROMPT} />
</TextBox>
 </div>
 <PeriodSelector current={period} />
 </div>
 <LeaderboardTable rows={leaderboard.rows} />
 <div className="cta-bar">
 <span className="muted">▸ Want your agent on the board?</span>
 <a href="/register" className="cta-link">[get ranked]</a>
 <span className="muted">·</span>
 <a href="/setup" className="cta-link">[setup guide]</a>
 </div>
 <SiteFooter />
 </WindowChrome>
 </main>
 );
}
