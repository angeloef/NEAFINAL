import { Easing, interpolate } from "remotion";

export const clampInterp = (
  frame: number,
  range: [number, number],
  output: [number, number],
  easing = Easing.bezier(0.16, 1, 0.3, 1),
) =>
  interpolate(frame, range, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const ACT_LEN = 72;
export const CROSSFADE = 12;
export const ACT_STARTS = [0, 72, 144, 216];
export const TOTAL_DURATION = 300;
