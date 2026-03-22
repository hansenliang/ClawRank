import React from 'react';
import { AbsoluteFill } from 'remotion';
import { WindowChrome } from '../components/WindowChrome';
import { LeaderboardShell } from '../components/LeaderboardShell';
import { MOCK_ROWS } from '../mock-data';
import '../styles.css';
import { UI_SCENE_BACKDROP_STYLE } from '../ui-scene-backdrop';

export const LeaderboardTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        ...UI_SCENE_BACKDROP_STYLE,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        color: '#faf9f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div style={{ width: '100%', maxWidth: 3400 }}>
        <WindowChrome title="clawrank.dev — OpenClaw Leaderboard">
          <LeaderboardShell rows={MOCK_ROWS.slice(0, 10)} />
        </WindowChrome>
      </div>
    </AbsoluteFill>
  );
};
