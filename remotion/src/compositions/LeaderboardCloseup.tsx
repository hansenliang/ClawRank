import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from 'remotion';
import {
  closeupLegacyToFrame,
  CLOSEUP_SCENE_FRAMES,
  REMOTION_FPS,
} from '../beat-sync';
import {
  CINEMATIC_HERO_ROW_DELAY,
  LeaderboardTable3D,
  ROW_SPRING_HERO,
  type LeaderboardCamera,
} from './LeaderboardTable3D';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import '../styles.css';

/** Phase 1 “pass-through” dolly — smooth; depth from hero Z + scale, not big tilt swings. */
const PHASE_1_PASS_THROUGH = Easing.bezier(0.26, 0.06, 0.2, 1);
/** Phase 2 pullback — stronger ease-out so the wide shot settles before hold. */
const CINEMATIC_PULLBACK = Easing.bezier(0.12, 0, 0.18, 1);

/** Phase boundaries on the beat grid (legacy 88f / 154f @ 180f → nearest beat). */
const CAMERA_TIGHT_END = closeupLegacyToFrame(88);
const CAMERA_WIDE_END = closeupLegacyToFrame(154);

/**
 * End of phase 1 = start of phase 2 (same object — avoids a jump at `CAMERA_TIGHT_END`).
 * Narrow tilt band in phase 1 keeps the move flat — depth comes from hero Z + dolly, not pitch swing.
 */
const CAMERA_AT_TIGHT_END: LeaderboardCamera = {
  scale: 3,
  panX: 94,
  panY: 120,
  tiltX: 44,
  tiltY: 0,
};

/** Same spring as hero row — drives pan/tilt “follow” during phase 1 only. */
function closeupHeroLandProgress(frame: number): number {
  return spring({
    frame,
    fps: REMOTION_FPS,
    delay: CINEMATIC_HERO_ROW_DELAY,
    config: { ...ROW_SPRING_HERO },
  });
}

const CAMERA_WIDE: LeaderboardCamera = {
  scale: 1.42,
  panX: 100,
  panY: 200,
  tiltX: 9,
  tiltY: -6,
};

function closeupCameraForFrame(frame: number): LeaderboardCamera {
  if (frame < CAMERA_TIGHT_END) {
    const h = closeupHeroLandProgress(frame);

    // Dolly back while the hero row recedes in Z — reads like type “passes through” a small lens.
    const scale = interpolate(
      frame,
      [0, CAMERA_TIGHT_END],
      [11.35, CAMERA_AT_TIGHT_END.scale],
      { extrapolateRight: 'clamp', easing: PHASE_1_PASS_THROUGH },
    );

    const panXBase = interpolate(
      frame,
      [0, CAMERA_TIGHT_END],
      [400, CAMERA_AT_TIGHT_END.panX],
      { extrapolateRight: 'clamp', easing: PHASE_1_PASS_THROUGH },
    );
    const panYBase = interpolate(
      frame,
      [0, CAMERA_TIGHT_END],
      [580, CAMERA_AT_TIGHT_END.panY],
      { extrapolateRight: 'clamp', easing: PHASE_1_PASS_THROUGH },
    );

    // Light compensation as Z collapses — small range so the path doesn’t arc up/down like a crane.
    const followPanX = interpolate(h, [0, 0.55, 1], [-12, -4, 0], {
      extrapolateRight: 'clamp',
    });
    const followPanY = interpolate(h, [0, 0.5, 1], [20, 7, 0], {
      extrapolateRight: 'clamp',
    });

    const tiltX = interpolate(
      frame,
      [0, CAMERA_TIGHT_END],
      [50, CAMERA_AT_TIGHT_END.tiltX],
      { extrapolateRight: 'clamp', easing: PHASE_1_PASS_THROUGH },
    );

    return {
      scale,
      panX: panXBase + followPanX,
      panY: panYBase + followPanY,
      tiltX,
      tiltY: 0,
    };
  }

  const scale = interpolate(
    frame,
    [CAMERA_TIGHT_END, CAMERA_WIDE_END],
    [CAMERA_AT_TIGHT_END.scale, CAMERA_WIDE.scale],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: CINEMATIC_PULLBACK,
    },
  );

  const panX = interpolate(
    frame,
    [CAMERA_TIGHT_END, CAMERA_WIDE_END],
    [CAMERA_AT_TIGHT_END.panX, CAMERA_WIDE.panX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: CINEMATIC_PULLBACK,
    },
  );

  const panY = interpolate(
    frame,
    [CAMERA_TIGHT_END, CAMERA_WIDE_END],
    [CAMERA_AT_TIGHT_END.panY, CAMERA_WIDE.panY],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: CINEMATIC_PULLBACK,
    },
  );

  const tiltX = interpolate(
    frame,
    [CAMERA_TIGHT_END, CAMERA_WIDE_END],
    [CAMERA_AT_TIGHT_END.tiltX, CAMERA_WIDE.tiltX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: CINEMATIC_PULLBACK,
    },
  );

  const tiltY = interpolate(
    frame,
    [CAMERA_TIGHT_END, CAMERA_WIDE_END],
    [CAMERA_AT_TIGHT_END.tiltY, CAMERA_WIDE.tiltY],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: CINEMATIC_PULLBACK,
    },
  );

  return { scale, panX, panY, tiltX, tiltY };
}

/**
 * Type-on when pullback starts; caption fade scaled from legacy 10f @ 180f → 210f scene.
 */
const TYPE_START = CAMERA_TIGHT_END;
const CAPTION_FADE = Math.max(
  1,
  Math.round((10 / 180) * CLOSEUP_SCENE_FRAMES),
);
const CAPTION_SHOW = TYPE_START - CAPTION_FADE;

const CAPTION_TEXT = 'Top OpenClaw agents, ranked.';
const EMPHASIS = 'ranked.';

/**
 * Scene 2 — **7s** block after 3s Hook; cinematic assembly (soundtrack @ ~0:03).
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
            perspectivePx={640}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
