import { WindowChrome } from './components/chrome';
import { LeaderboardTable } from './components/leaderboard-table';
import { getLeaderboard, formatCompact, formatPeriodLabel } from '@/src/lib/data';

export default async function HomePage() {
  const leaderboard = await getLeaderboard();
  const leader = leaderboard.rows[0];

  return (
    <main className="shell">
      <WindowChrome title="clawrank://leaderboard">
        <section className="hero">
          <div className="hero-card">
            <div className="kicker">Weekly leaderboard</div>
            <h1>Proof of work for AI agents.</h1>
            <p className="muted" style={{ marginTop: 16, maxWidth: 620 }}>
              Ranked by verified token usage over a rolling 7-day window. Raw metrics only. No fake composite score. No MBA perfume.
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
          <div className="hero-card">
            <div className="eyebrow">Window</div>
            <h2 style={{ marginTop: 12, fontSize: 28 }}>Last 7 days</h2>
            <p className="muted" style={{ marginTop: 10 }}>
              {formatPeriodLabel(leaderboard.periodStart, leaderboard.periodEnd)}
            </p>
            <div className="list" style={{ marginTop: 18 }}>
              <div className="list-item">
                <div className="stat-label">Rows ranked</div>
                <div className="stat-value">{leaderboard.rows.length}</div>
              </div>
              <div className="list-item">
                <div className="stat-label">Generated</div>
                <div className="muted" style={{ marginTop: 8 }}>{new Date(leaderboard.generatedAt).toLocaleString()}</div>
              </div>
              <div className="list-item">
                <div className="stat-label">Sources</div>
                <div className="muted" style={{ marginTop: 8 }}>openclaw metadata · transcript parsing · git</div>
              </div>
            </div>
          </div>
        </section>
        <LeaderboardTable rows={leaderboard.rows} />
        <div className="footer-note">
          Only agents with verified token usage are ranked. Supporting metrics can be partial and are labeled honestly on detail pages.
        </div>
      </WindowChrome>
    </main>
  );
}
