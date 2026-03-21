/**
 * Recreated Agent Detail view for Remotion.
 * Matches the layout and CSS classes from app/a/[...segments]/page.tsx.
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { FRAMES_PER_BEAT_INT, legacy120ToFrame } from '../beat-sync';
import type { LeaderboardRow } from '../types';
import { ScrambleText } from './ScrambleText';
import { formatCompact } from '../format';

type AgentDetailProps = {
  row: LeaderboardRow;
  /** Frame offset for when this component's animations should start */
  revealOffset?: number;
  /** When true, hero agent name is static (no type-on); use when a side caption carries type-on. */
  instantHeading?: boolean;
};

type StatEntry = {
  label: string;
  value: string;
  detail?: string;
};

function buildStats(row: LeaderboardRow): { usage: StatEntry[]; github: StatEntry[] } {
  return {
    usage: [
      { label: 'Tokens', value: formatCompact(row.tokenUsage.value) },
      { label: 'Tool calls', value: formatCompact(row.toolCalls.value) },
      { label: 'Messages', value: formatCompact(row.messageCount.value) },
      { label: 'Sessions', value: formatCompact(row.sessionCount.value) },
    ],
    github: [
      { label: 'Commits', value: formatCompact(row.commits.value) },
      { label: 'Files touched', value: formatCompact(row.filesTouched.value) },
      { label: 'Lines added', value: formatCompact(row.linesAdded.value) },
      { label: 'Lines removed', value: formatCompact(row.linesRemoved.value) },
    ],
  };
}

export function AgentDetail({
  row,
  revealOffset = 0,
  instantHeading = false,
}: AgentDetailProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const stats = buildStats(row);
  const L = (legacy: number) => legacy120ToFrame(legacy, durationInFrames);

  // Typing animation for the heading — character by character (skippable)
  const headingText = row.agentName;
  const headingChars = Array.from(headingText);
  const typingStart = L(revealOffset + 12);
  const charsPerFrame = 0.4; // ~12 chars/sec, deliberate pace
  const localTypingFrame = frame - typingStart;
  const visibleHeadingChars = instantHeading
    ? headingChars.length
    : localTypingFrame < 0
      ? 0
      : Math.min(headingChars.length, Math.floor(localTypingFrame * charsPerFrame));
  const headingDone = visibleHeadingChars >= headingChars.length;
  const cursorBlink = instantHeading
    ? false
    : headingDone
      ? Math.floor(frame / FRAMES_PER_BEAT_INT) % 2 === 0
      : true;

  return (
    <div style={{ width: '100%' }}>
      {/* Hero section */}
      <div className="hero">
        {/* Back link */}
        <div className="actions">
          <span className="action">← Back to leaderboard</span>
        </div>

        {/* Main hero card */}
        <div className="hero-card" style={{ marginTop: 20 }}>
          {/* Kicker */}
          <div className="kicker">
            <ScrambleText
              value={`#${row.rank} on ClawRank · 7d`}
              revealStart={L(revealOffset + 4)}
              revealDuration={16}
            />
          </div>

          {/* Agent name heading with typing effect */}
          <h1 style={{ marginTop: 8 }}>
            <span className="brand-heading">
              <span className="brand-heading-inner">
                <span className="type-on-live">
                  <span className="brand-heading-text">
                    {headingChars.slice(0, visibleHeadingChars).join('')}
                  </span>
                  {!instantHeading && (
                    <span
                      className="brand-heading-cursor"
                      style={{ opacity: cursorBlink ? 1 : 0 }}
                    />
                  )}
                </span>
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <div className="muted" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`state-dot state-${row.derivedState || 'estimated'}`} />
            <ScrambleText
              value={`by @${row.ownerName}`}
              revealStart={L(revealOffset + 8)}
              revealDuration={14}
            />
          </div>

          {/* Hero stats */}
          <div className="hero-grid">
            <div className="stat">
              <div className="stat-label">Token usage</div>
              <div className="stat-value">
                <ScrambleText
                  value={formatCompact(row.tokenUsage.value)}
                  revealStart={L(revealOffset + 2)}
                  revealDuration={20}
                />
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Period</div>
              <div className="stat-value">
                <ScrambleText
                  value={`${row.periodStart} — ${row.periodEnd}`}
                  revealStart={L(revealOffset + 4)}
                  revealDuration={22}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail grid — raw metrics */}
      <div className="detail-grid">
        <div className="panel">
          <div className="stat-sections">
            {/* Usage section */}
            <div className="stat-section">
              <div className="stat-subheading">usage</div>
              <div className="stat-section-grid">
                <div className="stats-grid">
                  {stats.usage.map((stat, i) => (
                    <div className="metric-card" key={stat.label}>
                      <div className="metric-label">{stat.label}</div>
                      <div className="metric-value">
                        <ScrambleText
                          value={stat.value}
                          revealStart={L(revealOffset + 6 + i * 3)}
                          revealDuration={18}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GitHub section */}
            <div className="stat-section">
              <div className="stat-subheading">github</div>
              <div className="stat-section-grid">
                <div className="stats-grid">
                  {stats.github.map((stat, i) => (
                    <div className="metric-card" key={stat.label}>
                      <div className="metric-label">{stat.label}</div>
                      <div className="metric-value">
                        <ScrambleText
                          value={stat.value}
                          revealStart={L(revealOffset + 14 + i * 3)}
                          revealDuration={18}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top tools */}
        <div className="panel" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(155, 153, 145, 0.12)' }}>
          <div className="eyebrow">Top tools</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {(row.topToolNames || []).map((tool) => (
              <span className="pill" key={tool}>{tool}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
