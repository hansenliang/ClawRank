import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  CLOSEUP_MASTER_DURATION_FRAMES,
  CTA_DURATION_FRAMES,
  DETAIL_SCENE_FRAMES,
  HOOK_DURATION_FRAMES,
  LEADERBOARD_CLOSEUP_START_FRAMES,
  SIZZLE_AUDIO_PUBLIC_FILE,
  ZOOM_SCENE_FRAMES,
} from '../beat-sync';
import { Hook } from './Hook';
import { LeaderboardCloseup } from './LeaderboardCloseup';
import { AgentDetailScene } from './AgentDetailScene';
import { LeaderboardZoomOut } from './LeaderboardZoomOut';
import { CTA } from './CTA';

/**
 * Soundtrack length from **`beat-sync`** — hard cuts; close-up may cut before the **3s** grid anchor
 * (see **`LEADERBOARD_CLOSEUP_START_FRAMES`** / **`MASTER_HOOK_GRID_FRAMES`**).
 * @see `../beat-sync.ts`
 */
const HOOK_START = 0;
const HOOK_DURATION = HOOK_DURATION_FRAMES;

const CLOSEUP_START = LEADERBOARD_CLOSEUP_START_FRAMES;
const CLOSEUP_DURATION = CLOSEUP_MASTER_DURATION_FRAMES;

const DETAIL_START = CLOSEUP_START + CLOSEUP_DURATION;
const DETAIL_DURATION = DETAIL_SCENE_FRAMES;

const ZOOMOUT_START = DETAIL_START + DETAIL_DURATION;
const ZOOMOUT_DURATION = ZOOM_SCENE_FRAMES;

const CTA_START = ZOOMOUT_START + ZOOMOUT_DURATION;
const CTA_DURATION = CTA_DURATION_FRAMES;

/** Hard cut: full opacity for `[from, from + duration)`. */
function TimedScene({
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
  if (frame < from || frame >= from + duration) return null;

  return (
    <AbsoluteFill style={{ opacity: 1 }}>
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
      <Audio src={staticFile(SIZZLE_AUDIO_PUBLIC_FILE)} />
      <TimedScene from={HOOK_START} duration={HOOK_DURATION} frame={frame}>
        <Hook />
      </TimedScene>

      <TimedScene from={CLOSEUP_START} duration={CLOSEUP_DURATION} frame={frame}>
        <LeaderboardCloseup />
      </TimedScene>

      <TimedScene from={DETAIL_START} duration={DETAIL_DURATION} frame={frame}>
        <AgentDetailScene />
      </TimedScene>

      <TimedScene from={ZOOMOUT_START} duration={ZOOMOUT_DURATION} frame={frame}>
        <LeaderboardZoomOut />
      </TimedScene>

      <TimedScene from={CTA_START} duration={CTA_DURATION} frame={frame}>
        <CTA />
      </TimedScene>
    </AbsoluteFill>
  );
};
