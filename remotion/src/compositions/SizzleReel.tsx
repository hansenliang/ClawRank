import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
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
import { UI_SCENE_BACKDROP_STYLE } from '../ui-scene-backdrop';

/**
 * Soundtrack length from **`beat-sync`** — hard cuts; close-up may cut before the **3s** grid anchor
 * (see **`LEADERBOARD_CLOSEUP_START_FRAMES`** / **`MASTER_HOOK_GRID_FRAMES`**).
 * @see `../beat-sync.ts`
 *
 * Scenes are plain **`Sequence`** slices only — no extra `null` gating. That avoids redundant
 * mount/unmount patterns and matches Remotion’s timeline model (important for stable screenshots
 * on heavy 3D / GPU-composited shots).
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

export const SizzleReel: React.FC = () => {
  return (
    <AbsoluteFill style={UI_SCENE_BACKDROP_STYLE}>
      <Audio src={staticFile(SIZZLE_AUDIO_PUBLIC_FILE)} />
      <Sequence from={HOOK_START} durationInFrames={HOOK_DURATION}>
        <Hook />
      </Sequence>
      <Sequence from={CLOSEUP_START} durationInFrames={CLOSEUP_DURATION}>
        <LeaderboardCloseup />
      </Sequence>
      <Sequence from={DETAIL_START} durationInFrames={DETAIL_DURATION}>
        <AgentDetailScene />
      </Sequence>
      <Sequence from={ZOOMOUT_START} durationInFrames={ZOOMOUT_DURATION}>
        <LeaderboardZoomOut />
      </Sequence>
      <Sequence from={CTA_START} durationInFrames={CTA_DURATION}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
