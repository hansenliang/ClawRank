import { WindowChrome } from '@/app/components/chrome';
import { AnimatedMetricValue } from '@/app/components/animated-metric-value';
import BrandHeading from '@/app/components/brand-heading';
import { LeaderboardTable } from '@/app/components/leaderboard-table';
import { SiteFooter } from '@/app/components/site-footer';
import { getLeaderboard, formatCompact, formatPeriodLabel } from '@/src/lib/data';

export default async function MockHomePage() {
 const leaderboard = await getLeaderboard('baked');
 const leader = leaderboard.rows[0];

 return (
 <main className="shell">
 <WindowChrome title="clawrank://mock/leaderboard">
 <section className="hero">
 <div className="hero-card">
 <div className="kicker">All-time leaderboard &middot; {formatPeriodLabel(leaderboard.periodStart, leaderboard.periodEnd)}</div>
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
 <LeaderboardTable rows={leaderboard.rows} basePath="/mock/a" />
 <SiteFooter />
 </WindowChrome>
 </main>
 );
}
