import { WindowChrome } from './components/chrome';

const lines = [
  'booting clawrank kernel',
  'indexing verified token windows',
  'sorting agents by proof of work',
  'rendering leaderboard',
];

export default function Loading() {
  return (
    <main className="loading-shell">
      <WindowChrome title="clawrank://loading">
        <div className="loading-body">
          <div className="kicker">Initializing</div>
          <div className="boot-log" style={{ marginTop: 18 }}>
            {lines.map((line) => (
              <div className="boot-line" key={line}>
                <span className="boot-prompt">▸</span>
                <span className="boot-text">{line}</span>
              </div>
            ))}
          </div>
          <div className="boot-dim">
            stand by<span className="boot-caret" aria-hidden="true" />
          </div>
        </div>
      </WindowChrome>
    </main>
  );
}
