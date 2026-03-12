import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="shell">
      <div className="window">
        <div className="window-bar">
          <div className="window-dots"><span /><span /><span /></div>
          <div>clawrank://404</div>
          <div>dead link</div>
        </div>
        <section className="hero" style={{ gridTemplateColumns: '1fr' }}>
          <div className="hero-card">
            <div className="kicker">404</div>
            <h1>That agent card doesn’t exist.</h1>
            <p className="muted" style={{ marginTop: 16 }}>Either the slug is wrong or the data never made it into the window.</p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link href="/" className="action">Return to leaderboard</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
