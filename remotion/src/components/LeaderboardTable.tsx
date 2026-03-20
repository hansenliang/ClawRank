/**
 * Recreated LeaderboardTable for Remotion with scramble-reveal animations.
 * Uses the EXACT same CSS classes as the original app/components/leaderboard-table.tsx.
 */
import React from 'react';
import type { LeaderboardRow } from '../types';
import { formatCompact, formatStandard } from '../format';
import { ScrambleText } from './ScrambleText';

type DerivedState = 'live' | 'verified' | 'estimated';

const STATE_CONFIG: Record<DerivedState, { className: string }> = {
  live: { className: 'state-dot state-live' },
  verified: { className: 'state-dot state-verified' },
  estimated: { className: 'state-dot state-estimated' },
};

function StateBadge({ state }: { state?: DerivedState }) {
  const config = STATE_CONFIG[state || 'estimated'];
  return <span className={config.className} />;
}

function Avatar({ name }: { name: string }) {
  return <div className="avatar">{name.slice(0, 2).toUpperCase()}</div>;
}

function metricDisplay(metric: { value: number; status: string }, compact = false): string {
  if (metric.status === 'missing') return '—';
  return compact ? formatCompact(metric.value) : formatStandard(metric.value);
}

function gitDisplay(row: LeaderboardRow): string {
  if (row.commits.status === 'missing') return '—';
  const parts = [`${formatStandard(row.commits.value)} commits`];
  if (row.filesTouched.value) parts.push(`${formatStandard(row.filesTouched.value)} files`);
  return parts.join(' · ');
}

/** Stagger: each row's reveal starts a few frames after the previous */
const ROW_STAGGER = 3;
const BASE_REVEAL_FRAME = 8;

export function LeaderboardTable({
  rows,
  revealOffset = 0,
}: {
  rows: LeaderboardRow[];
  /** Additional frame offset before reveal animations start */
  revealOffset?: number;
}) {
  return (
    <div className="table-wrap">
      <div className="desktop-only">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Agent</th>
              <th>Tokens</th>
              <th>Tool calls</th>
              <th>Messages</th>
              <th>Git</th>
              <th>Top tools</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rowRevealStart = revealOffset + BASE_REVEAL_FRAME + index * ROW_STAGGER;
              return (
                <tr key={row.id} data-rank={row.rank}>
                  <td>
                    <span className="rank-badge">{row.rank}</span>
                  </td>
                  <td>
                    <div className="identity-row">
                      <span className="identity">
                        <Avatar name={row.agentName} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StateBadge state={row.derivedState} />
                            <ScrambleText
                              value={row.agentName}
                              revealStart={rowRevealStart}
                              revealDuration={18}
                            />
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            <ScrambleText
                              value={`by @${row.ownerName}`}
                              revealStart={rowRevealStart + 4}
                              revealDuration={14}
                            />
                          </div>
                        </div>
                      </span>
                      <span className="action action-button">Share</span>
                    </div>
                  </td>
                  <td>
                    <ScrambleText
                      value={formatCompact(row.tokenUsage.value)}
                      revealStart={rowRevealStart + 2}
                      revealDuration={16}
                    />
                  </td>
                  <td>
                    <ScrambleText
                      value={metricDisplay(row.toolCalls)}
                      revealStart={rowRevealStart + 3}
                      revealDuration={14}
                    />
                  </td>
                  <td>
                    <ScrambleText
                      value={metricDisplay(row.messageCount)}
                      revealStart={rowRevealStart + 4}
                      revealDuration={14}
                    />
                  </td>
                  <td className="muted">
                    <ScrambleText
                      value={gitDisplay(row)}
                      revealStart={rowRevealStart + 5}
                      revealDuration={18}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(row.topToolNames || []).map((tool) => (
                        <span className="pill" key={tool}>{tool}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
