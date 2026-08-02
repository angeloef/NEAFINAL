import { Easing, interpolate } from "remotion";

/**
 * The decorative layer from codrops/DecorativeLetterAnimations: one hand-drawn
 * shape per act, drawn on around the accent word.
 *
 * Three rules make this safe under Remotion:
 *
 *  - No runtime measurement. Frames render in parallel and out of order, so
 *    getTotalLength() would be a race.
 *  - No absolute coordinates. Each shape stretches to the box of the word it
 *    decorates, so it tracks the text instead of being pinned to a guess about
 *    where the line wrapped.
 *  - No stroke-dash draw-on. `pathLength` + `strokeDasharray` computes the dash
 *    pattern against the *scaled* geometry here, which tiles the path into
 *    stray segments metres away from the word. The draw is a clipPath wipe
 *    instead: pure geometry, identical result, no dash maths.
 *
 * One shape on screen at a time, always.
 */

const DRAW = Easing.bezier(0.16, 1, 0.3, 1);

const wipe = (t: number, start: number, dur = 26) =>
  interpolate(t, [start, start + dur], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DRAW,
  });

/** `h` is the accent word's line height in px, passed down from <Line>. */
type Props = { t: number; start: number; color: string; h: number };

const box = (
  pad: [number, number],
  { t, start, h }: Props,
  dur?: number,
): React.CSSProperties => ({
  position: "absolute",
  left: -pad[0],
  // width as calc, not `right`: same reason as the height below
  width: `calc(100% + ${pad[0] * 2}px)`,
  top: -pad[1],
  // an explicit height, not `bottom`: the SVG must not resolve its own box
  // against anything but the single line of type it is decorating
  height: h + pad[1] * 2,
  overflow: "visible",
  pointerEvents: "none",
  clipPath: `inset(-40% ${wipe(t, start, dur)}% -40% -40%)`,
});

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
  fill: "none",
});

/** Act 1 — an open circle, 300 degrees of arc, around the chosen objective. */
export const CircleMark = (p: Props) => (
  <svg
    style={box([22, 14], p)}
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <path d="M 92 34 A 46 44 0 1 1 66 8" {...stroke(p.color)} />
  </svg>
);

/** Act 2 — two facing bars: the word held between the things it is compared to. */
export const BracketPair = (p: Props) => (
  <svg
    style={box([18, 2], p, 20)}
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <path d="M 3 6 L 3 94" {...stroke(p.color)} />
    <path d="M 97 6 L 97 94" {...stroke(p.color)} />
  </svg>
);

/** Act 3 — a double rule: the reading underneath what the data already said. */
export const DoubleRule = (p: Props) => (
  <svg
    style={box([4, 0], p, 18)}
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <path d="M 0 90 L 100 90" {...stroke(p.color)} />
    <path d="M 0 99 L 100 99" {...stroke(p.color)} />
  </svg>
);

/** Act 4 — a corner bracket closing on the conclusion. */
export const CornerBracket = (p: Props) => (
  <svg
    style={box([14, 0], p, 22)}
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <path d="M 26 3 L 3 3 L 3 97" {...stroke(p.color)} />
    <path d="M 74 97 L 97 97 L 97 3" {...stroke(p.color)} />
  </svg>
);

export const SHAPES = [CircleMark, BracketPair, DoubleRule, CornerBracket];
