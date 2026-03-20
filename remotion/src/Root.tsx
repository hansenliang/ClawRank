import { Composition } from "remotion";
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
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />

      <Composition
        id="Hook"
        component={Hook}
        durationInFrames={120}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="LeaderboardCloseup"
        component={LeaderboardCloseup}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="AgentDetailScene"
        component={AgentDetailScene}
        durationInFrames={120}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="LeaderboardZoomOut"
        component={LeaderboardZoomOut}
        durationInFrames={120}
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
        durationInFrames={480}
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
