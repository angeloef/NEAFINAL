import { Composition } from "remotion";
import { Step1Diagnosis } from "./Step1Diagnosis";
import { Step2Roadmap } from "./Step2Roadmap";
import { Step2Disenar } from "./Step2Disenar";
import { Step3Construir } from "./Step3Construir";
import { Step1Analizar } from "./Step1Analizar";
import { DURATION } from "./analizar/theme";
import { TOTAL_DURATION } from "./timing";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="Step1Analizar"
        component={Step1Analizar}
        durationInFrames={DURATION}
        fps={30}
        width={1280}
        height={800}
      />
      <Composition
        id="Step1Diagnosis"
        component={Step1Diagnosis}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1280}
        height={800}
      />
      <Composition
        id="Step3Construir"
        component={Step3Construir}
        durationInFrames={DURATION}
        fps={30}
        width={1280}
        height={800}
      />
      <Composition
        id="Step2Disenar"
        component={Step2Disenar}
        durationInFrames={DURATION}
        fps={30}
        width={1280}
        height={800}
      />
      <Composition
        id="Step2Roadmap"
        component={Step2Roadmap}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1280}
        height={800}
      />
    </>
  );
};
