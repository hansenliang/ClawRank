import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { LeaderboardTable3D } from './LeaderboardTable3D';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import '../styles.css';

const CINEMATIC = Easing.bezier(0.25, 0.1, 0.25, 1.0);

const CAPTION_SHOW = 8;
const CAPTION_FADE = 12;
const TYPE_START = CAPTION_SHOW + CAPTION_FADE;
const CAPTION_TEXT = 'See how your agents stack up.';
const EMPHASIS = 'stack up.';

/**
 * Scene 4 — 120f — Pull back 3× → 1× with cinematic easing; full table beauty shot.
 */
export const LeaderboardZoomOut: React.FC = () => {
  const frame = useCurrentFrame();

  const camera = {
    scale: interpolate(frame, [0, 105], [3, 1], {
      extrapolateRight: 'clamp',
      easing: CINEMATIC,
    }),
    panX: interpolate(frame, [0, 105], [400, 0], {
      extrapolateRight: 'clamp',
      easing: CINEMATIC,
    }),
    panY: interpolate(frame, [0, 105], [200, 100], {
      extrapolateRight: 'clamp',
      easing: CINEMATIC,
    }),
    tiltX: interpolate(frame, [0, 105], [18, 4], {
      extrapolateRight: 'clamp',
      easing: CINEMATIC,
    }),
    tiltY: interpolate(frame, [0, 105], [-6, 2], {
      extrapolateRight: 'clamp',
      easing: CINEMATIC,
    }),
  };

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
            camera={camera}
            animateRows={false}
            masterFadeIn={false}
            showAmbientGlow
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
