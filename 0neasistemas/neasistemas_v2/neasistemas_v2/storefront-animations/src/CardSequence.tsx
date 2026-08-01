import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { BrowserChrome, FRAME } from "./BrowserChrome";
import { PAGE_BG } from "./colors";
import { ACT_LEN, ACT_STARTS, CROSSFADE, clampInterp } from "./timing";

// One distinct transition type per boundary between acts. Bookends
// (video open / loop close) always use "fade".
type TransitionType = "dash-x" | "dash-y" | "zoom" | "fade";
const BOUNDARY_TRANSITIONS: TransitionType[] = ["dash-x", "dash-y", "zoom"];

const SNAP_EASE = Easing.bezier(0.85, 0, 0.15, 1);
const POP_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);

type CardStyle = {
  translateX: number;
  translateY: number;
  scale: number;
  opacity: number;
};

const enterStyle = (
  type: TransitionType,
  frame: number,
  range: [number, number],
): CardStyle => {
  switch (type) {
    case "dash-x":
      return {
        translateX: clampInterp(frame, range, [FRAME.width, 0], SNAP_EASE),
        translateY: 0,
        scale: 1,
        opacity: clampInterp(
          frame,
          [range[0], range[0] + (range[1] - range[0]) * 0.5],
          [0, 1],
        ),
      };
    case "dash-y":
      return {
        translateX: 0,
        translateY: clampInterp(frame, range, [FRAME.height, 0], SNAP_EASE),
        scale: 1,
        opacity: clampInterp(
          frame,
          [range[0], range[0] + (range[1] - range[0]) * 0.5],
          [0, 1],
        ),
      };
    case "zoom":
      return {
        translateX: 0,
        translateY: 0,
        scale: clampInterp(frame, range, [0.82, 1], POP_EASE),
        opacity: clampInterp(frame, range, [0, 1]),
      };
    default:
      return {
        translateX: 0,
        translateY: 0,
        scale: 1,
        opacity: clampInterp(frame, range, [0, 1]),
      };
  }
};

const exitStyle = (
  type: TransitionType,
  frame: number,
  range: [number, number],
): CardStyle => {
  switch (type) {
    case "dash-x":
      return {
        translateX: clampInterp(frame, range, [0, -FRAME.width], SNAP_EASE),
        translateY: 0,
        scale: 1,
        opacity: clampInterp(
          frame,
          [range[0] + (range[1] - range[0]) * 0.5, range[1]],
          [1, 0],
        ),
      };
    case "dash-y":
      return {
        translateX: 0,
        translateY: clampInterp(frame, range, [0, -FRAME.height], SNAP_EASE),
        scale: 1,
        opacity: clampInterp(
          frame,
          [range[0] + (range[1] - range[0]) * 0.5, range[1]],
          [1, 0],
        ),
      };
    case "zoom":
      return {
        translateX: 0,
        translateY: 0,
        scale: clampInterp(frame, range, [1, 1.18]),
        opacity: clampInterp(frame, range, [1, 0]),
      };
    default:
      return {
        translateX: 0,
        translateY: 0,
        scale: 1,
        opacity: clampInterp(frame, range, [1, 0]),
      };
  }
};

const combine = (a: CardStyle, b: CardStyle): CardStyle => ({
  translateX: a.translateX + b.translateX,
  translateY: a.translateY + b.translateY,
  scale: a.scale * b.scale,
  opacity: a.opacity * b.opacity,
});

const Act = ({
  Component,
  frame,
  start,
  enterType,
  exitType,
}: {
  Component: (p: { t: number }) => JSX.Element;
  frame: number;
  start: number;
  enterType: TransitionType;
  exitType: TransitionType;
}) => {
  const end = start + ACT_LEN;
  const enterRange: [number, number] =
    start === 0 ? [0, CROSSFADE] : [start - CROSSFADE, start];
  const exitRange: [number, number] = [end - CROSSFADE, end];

  const style = combine(
    enterStyle(enterType, frame, enterRange),
    exitStyle(exitType, frame, exitRange),
  );
  const t = Math.min(Math.max(frame - start, 0), ACT_LEN);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: style.opacity,
        translate: `${style.translateX}px ${style.translateY}px`,
        scale: style.scale,
      }}
    >
      <BrowserChrome>
        <Component t={t} />
      </BrowserChrome>
    </div>
  );
};

export const CardSequence = ({
  acts,
}: {
  acts: Array<(p: { t: number }) => JSX.Element>;
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: PAGE_BG }}>
      {acts.map((Component, i) => (
        <Act
          key={i}
          Component={Component}
          frame={frame}
          start={ACT_STARTS[i]}
          enterType={i === 0 ? "fade" : BOUNDARY_TRANSITIONS[i - 1]}
          exitType={i === acts.length - 1 ? "fade" : BOUNDARY_TRANSITIONS[i]}
        />
      ))}
    </AbsoluteFill>
  );
};
