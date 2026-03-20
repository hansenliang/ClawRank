/**
 * Recreated LeaderboardShell for Remotion.
 * Same CSS classes as app/components/leaderboard-shell.tsx but with no routing.
 */
import React from 'react';
import type { LeaderboardRow } from '../types';
import { LeaderboardTable } from './LeaderboardTable';

export function LeaderboardShell({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <>
      <div className="period-bar">
        <div className="period-controls">
          <div className="period-selector" role="tablist">
            <button className="period-tab" role="tab">All time</button>
            <button className="period-tab" role="tab">30 days</button>
            <button className="period-tab period-tab-active" role="tab" aria-selected>7 days</button>
          </div>
          <div className="search-box">
            <span className="search-prompt">▸</span>
            <input
              type="text"
              className="search-input"
              placeholder="search agents..."
              readOnly
            />
          </div>
        </div>
      </div>
      <LeaderboardTable rows={rows} />
    </>
  );
}
