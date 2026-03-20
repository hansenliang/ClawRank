import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { Hook } from './Hook';
import { LeaderboardCloseup } from './LeaderboardCloseup';
import { AgentDetailScene } from './AgentDetailScene';
import { LeaderboardZoomOut } from './LeaderboardZoomOut';
import { CTA } from './CTA';

const CROSSFADE = 15;

const HOOK_START = 0;
const HOOK_DURATION = 120;

const CLOSEUP_START = HOOK_DURATION - CROSSFADE; // 105
/** 180f: 3s UI-only + CLI sidecar + type-on (beat stretch). */
const CLOSEUP_DURATION = 180;

const DETAIL_START = CLOSEUP_START + CLOSEUP_DURATION - CROSSFADE; // 270
const DETAIL_DURATION = 120;

const ZOOMOUT_START = DETAIL_START + DETAIL_DURATION - CROSSFADE; // 375
const ZOOMOUT_DURATION = 120;

const CTA_START = ZOOMOUT_START + ZOOMOUT_DURATION - CROSSFADE; // 480
const TOTAL = 900;
const CTA_DURATION = TOTAL - CTA_START; // 420 — long hold after prompt finishes

function CrossfadeScene({
  children,
  from,
  duration,
  frame,
}: {
  children: React.ReactNode;
  from: number;
  duration: number;
  frame: number;
}) {
  const fadeIn =
    from === 0
      ? 1
      : interpolate(frame, [from, from + CROSSFADE], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const end = from + duration;
  const fadeOut = interpolate(frame, [end - CROSSFADE, end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = Math.min(fadeIn, fadeOut);

  if (frame < from - 1 || frame > end + 1) return null;

  return (
    <AbsoluteFill style={{ opacity }}>
      <Sequence from={from} durationInFrames={duration}>
        {children}
      </Sequence>
    </AbsoluteFill>
  );
}

export const SizzleReel: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f0e' }}>
      <CrossfadeScene from={HOOK_START} duration={HOOK_DURATION} frame={frame}>
        <Hook />
      </CrossfadeScene>

      <CrossfadeScene from={CLOSEUP_START} duration={CLOSEUP_DURATION} frame={frame}>
        <LeaderboardCloseup />
      </CrossfadeScene>

      <CrossfadeScene from={DETAIL_START} duration={DETAIL_DURATION} frame={frame}>
        <AgentDetailScene />
      </CrossfadeScene>

      <CrossfadeScene from={ZOOMOUT_START} duration={ZOOMOUT_DURATION} frame={frame}>
        <LeaderboardZoomOut />
      </CrossfadeScene>

      <CrossfadeScene from={CTA_START} duration={CTA_DURATION} frame={frame}>
        <CTA />
      </CrossfadeScene>
    </AbsoluteFill>
  );
};
