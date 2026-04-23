import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ScreenSlide } from "./ScreenSlide";
import screensData from "../screens.json";

export const WalkthroughComposition: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      <TransitionSeries>
        {screensData.screens.map((screen, index) => {
          const durationInFrames = screen.duration * fps;

          return (
            <React.Fragment key={screen.id}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <ScreenSlide
                  title={screen.title}
                  description={screen.description}
                  imagePath={screen.imagePath}
                  originalWidth={screen.width}
                  originalHeight={screen.height}
                  scrollStartPercent={screen.scrollStartPercent}
                  scrollEndPercent={screen.scrollEndPercent}
                  index={index}
                  total={screensData.screens.length}
                />
              </TransitionSeries.Sequence>

              {index < screensData.screens.length - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: 30 })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
