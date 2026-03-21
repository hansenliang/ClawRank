import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { LeaderboardTable3D, type LeaderboardCamera } from './LeaderboardTable3D';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import { REMOTION_FPS } from '../typewriter';
import '../styles.css';

/** Ease-out-heavy curve — slow settle like product-film camera moves. */
const CINEMATIC = Easing.bezier(0.22, 0.09, 0.2, 1);

/** First phase: extreme macro on rank #1 identity; second: pull back to show full stack. */
const CAMERA_TIGHT_END = 88;
const CAMERA_WIDE_END = 154;

/** End of phase 1 = start of phase 2 (same object — avoids a jump at `CAMERA_TIGHT_END`). */
const CAMERA_AT_TIGHT_END: LeaderboardCamera = {
  scale: 3,
  panX: 94,
  panY: 200,
  tiltX: 50,
  tiltY: 0,
};

const CAMERA_WIDE: LeaderboardCamera = {
  scale: 1.42,
  panX: 100,
  panY: 252,
  tiltX: 9,
  tiltY: -6,
};

function closeupCameraForFrame(frame: number): LeaderboardCamera {
  const scale =
    frame < CAMERA_TIGHT_END
      ? interpolate(frame, [0, CAMERA_TIGHT_END], [10, CAMERA_AT_TIGHT_END.scale], {
          extrapolateRight: 'clamp',
          easing: CINEMATIC,
        })
      : interpolate(
          frame,
          [CAMERA_TIGHT_END, CAMERA_WIDE_END],
          [CAMERA_AT_TIGHT_END.scale, CAMERA_WIDE.scale],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: CINEMATIC,
          },
        );

  const panX =
    frame < CAMERA_TIGHT_END
      ? interpolate(frame, [0, CAMERA_TIGHT_END], [200, CAMERA_AT_TIGHT_END.panX], {
          extrapolateRight: 'clamp',
          easing: CINEMATIC,
        })
      : interpolate(
          frame,
          [CAMERA_TIGHT_END, CAMERA_WIDE_END],
          [CAMERA_AT_TIGHT_END.panX, CAMERA_WIDE.panX],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: CINEMATIC,
          },
        );

  const panY =
    frame < CAMERA_TIGHT_END
      ? interpolate(frame, [0, CAMERA_TIGHT_END], [500, CAMERA_AT_TIGHT_END.panY], {
          extrapolateRight: 'clamp',
          easing: CINEMATIC,
        })
      : interpolate(
          frame,
          [CAMERA_TIGHT_END, CAMERA_WIDE_END],
          [CAMERA_AT_TIGHT_END.panY, CAMERA_WIDE.panY],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: CINEMATIC,
          },
        );

  const tiltX =
    frame < CAMERA_TIGHT_END
      ? interpolate(frame, [0, CAMERA_TIGHT_END], [80, CAMERA_AT_TIGHT_END.tiltX], {
          extrapolateRight: 'clamp',
          easing: CINEMATIC,
        })
      : interpolate(
          frame,
          [CAMERA_TIGHT_END, CAMERA_WIDE_END],
          [CAMERA_AT_TIGHT_END.tiltX, CAMERA_WIDE.tiltX],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: CINEMATIC,
          },
        );

  const tiltY =
    frame < CAMERA_TIGHT_END
      ? interpolate(frame, [0, CAMERA_TIGHT_END], [0, CAMERA_AT_TIGHT_END.tiltY], {
          extrapolateRight: 'clamp',
          easing: CINEMATIC,
        })
      : interpolate(
          frame,
          [CAMERA_TIGHT_END, CAMERA_WIDE_END],
          [CAMERA_AT_TIGHT_END.tiltY, CAMERA_WIDE.tiltY],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: CINEMATIC,
          },
        );

  return { scale, panX, panY, tiltX, tiltY };
}

/** UI alone before caption (3s). */
const CAPTION_SHOW = REMOTION_FPS * 1;
const CAPTION_FADE = 10;
const TYPE_START = CAPTION_SHOW + CAPTION_FADE;

const CAPTION_TEXT = 'Your OpenClaw agents, ranked.';
const EMPHASIS = 'ranked.';

/**
 * Scene 2 — 180f — Cinematic assembly: macro on #1 row landing, camera pulls back, remaining rows stack in.
 */
export const LeaderboardCloseup: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = closeupCameraForFrame(frame);

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
            animateRows
            masterFadeIn
            showAmbientGlow
            cinematicAssembly
            perspectivePx={720}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
