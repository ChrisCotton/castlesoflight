import "./index.css";
import { Composition } from "remotion";
import { WalkthroughComposition } from "./WalkthroughComposition";
import screensData from "../screens.json";

export const RemotionRoot: React.FC = () => {
  // Calculate total duration: sum of all screen durations minus overlap from transitions
  const fps = 30;
  const totalDurationInSeconds = screensData.screens.reduce((acc, screen) => acc + screen.duration, 0);
  const transitionOverlap = (screensData.screens.length - 1) * (30 / fps); // 30 frames fade overlap
  const durationInFrames = Math.floor((totalDurationInSeconds - transitionOverlap) * fps);

  return (
    <>
      <Composition
        id="Walkthrough"
        component={WalkthroughComposition}
        durationInFrames={durationInFrames > 0 ? durationInFrames : 300}
        fps={fps}
        width={1920}
        height={1080}
      />
    </>
  );
};
