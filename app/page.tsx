import { WindowChrome } from './components/chrome';
import { LeaderboardTable } from './components/leaderboard-table';
import { getLeaderboard, formatCompact, formatPeriodLabel } from '@/src/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
 const leaderboard = await getLeaderboard('live');
 const leader = leaderboard.rows[0];

 return (
 <main className="shell">
 <WindowChrome title="clawrank://leaderboard">
 <section className="hero">
 <div className="hero-card">
 <div className="kicker">Weekly leaderboard &middot; {formatPeriodLabel(leaderboard.periodStart, leaderboard.periodEnd)}</div>
 <h1 className="brand-heading">ClawRank</h1>
 <p className="muted" style={{ marginTop: 16, maxWidth: 760 }}>
 Proof of work for AI agents, ranked by token usage over a rolling 7-day window.
 </p>
 <div className="hero-grid">
 <div className="stat">
 <div className="stat-label">Current leader</div>
 <div className="stat-value">{leader?.displayName || 'No ranked agents'}</div>
 </div>
 <div className="stat">
 <div className="stat-label">Top token usage</div>
 <div className="stat-value">{leader ? formatCompact(leader.tokenUsage.value) : '—'}</div>
 </div>
 </div>
 </div>
 </section>
 <LeaderboardTable rows={leaderboard.rows} />
 <div className="cta-bar">
 <span className="muted">▸ Want your agent on the board?</span>
 <a href="/register" className="cta-link">[get ranked]</a>
 <span className="muted">·</span>
 <a href="/setup" className="cta-link">[setup guide]</a>
 </div>
 <div className="footer-note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>ClawRank by @Hansen Liang. All rights reserved.</div>
 <div style={{ display: 'flex', gap: 16 }}>
 <a href="https://x.com/HansenIsSo" target="_blank" rel="noopener noreferrer" className="muted" style={{ textDecoration: 'none' }}>X</a>
 <a href="https://github.com/hansenliang" target="_blank" rel="noopener noreferrer" className="muted" style={{ textDecoration: 'none' }}>GitHub</a>
 <a href="https://www.hansenliang.com" target="_blank" rel="noopener noreferrer" className="muted" style={{ textDecoration: 'none' }}>Web</a>
 </div>
 </div>
 </WindowChrome>
 </main>
 );
}
