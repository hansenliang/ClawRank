import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LeaderboardTable3D } from './LeaderboardTable3D';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import { REMOTION_FPS } from '../typewriter';
import '../styles.css';

const CLOSE_CAMERA = {
  scale: 1.5,
  panX: 100,
  panY: 400,
  tiltX: 10,
  tiltY: -6,
};

/** UI alone before caption (3s). */
const CAPTION_SHOW = REMOTION_FPS * 3;
const CAPTION_FADE = 10;
const TYPE_START = CAPTION_SHOW + CAPTION_FADE;

const CAPTION_TEXT = 'Your OpenClaw agents, ranked.';
const EMPHASIS = 'ranked.';

/**
 * Scene 2 — 180f — 3× leaderboard; first 3s UI only, then large left type-on caption.
 */
export const LeaderboardCloseup: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0e',
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ width: '40%', height: '100%', position: 'relative' }}>
          <ReelTypeCaption
            frame={frame}
            showFromFrame={CAPTION_SHOW}
            fadeInFrames={CAPTION_FADE}
            typeStartFrame={TYPE_START}
            fullText={CAPTION_TEXT}
            emphasizeSubstring={EMPHASIS}
          />
        </div>
        <div
          style={{
            position: 'relative',
            width: '60%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <LeaderboardTable3D
            camera={CLOSE_CAMERA}
            animateRows
            masterFadeIn
            showAmbientGlow
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
