import { Composition } from "remotion";
import {
  CLOSEUP_SCENE_FRAMES,
  CTA_DURATION_FRAMES,
  DETAIL_SCENE_FRAMES,
  HOOK_DURATION_FRAMES,
  SIZZLE_TOTAL_FRAMES,
  ZOOM_SCENE_FRAMES,
} from "./beat-sync";
import { Hook } from "./compositions/Hook";
import { LeaderboardCloseup } from "./compositions/LeaderboardCloseup";
import { AgentDetailScene } from "./compositions/AgentDetailScene";
import { LeaderboardZoomOut } from "./compositions/LeaderboardZoomOut";
import { MetaNarrative } from "./compositions/MetaNarrative";
import { CTA } from "./compositions/CTA";
import { SizzleReel } from "./compositions/SizzleReel";
import { LeaderboardTest } from "./compositions/LeaderboardTest";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SizzleReel"
        component={SizzleReel}
        durationInFrames={SIZZLE_TOTAL_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />

      <Composition
        id="Hook"
        component={Hook}
        durationInFrames={HOOK_DURATION_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="LeaderboardCloseup"
        component={LeaderboardCloseup}
        durationInFrames={CLOSEUP_SCENE_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="AgentDetailScene"
        component={AgentDetailScene}
        durationInFrames={DETAIL_SCENE_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="LeaderboardZoomOut"
        component={LeaderboardZoomOut}
        durationInFrames={ZOOM_SCENE_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="MetaNarrative"
        component={MetaNarrative}
        durationInFrames={240}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="CTA"
        component={CTA}
        durationInFrames={CTA_DURATION_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />

      <Composition
        id="LeaderboardTest"
        component={LeaderboardTest}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
