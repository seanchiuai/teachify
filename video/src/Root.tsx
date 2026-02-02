import React from "react";
import { Composition } from "remotion";
import { LessonPlayVideo } from "./LessonPlayVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LessonPlayPromo"
        component={LessonPlayVideo}
        durationInFrames={1560}
        fps={60}
        width={3840}
        height={2160}
      />
    </>
  );
};
