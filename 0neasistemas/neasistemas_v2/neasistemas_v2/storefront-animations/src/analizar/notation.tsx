import { Easing, interpolate } from "remotion";

/**
 * Notation marks for the accent word of each act.
 *
 * These replace the first pass at a decorative layer, which was four SVG shapes
 * drawn in a 100x100 viewBox and stretched onto a ~190x47 word box with
 * `preserveAspectRatio="none"`. Nothing in that pass kept the proportion it was
 * drawn at — the "circle" was a squashed ellipse — and each mark was a single
 * element that arrived all at once. It read as a highlighter scribble.
 *
 * Three rules here:
 *
 *  1. **Pixels, not a stretched viewBox.** Every element is a CSS box sized in
 *     px against the word's own line height. Nothing distorts, ever.
 *  2. **A mark is three or four elements, not one**, and they arrive on their
 *     own schedule. The stagger is what reads as considered.
 *  3. **Each mark is borrowed from the craft of its act** — a dimension line
 *     for comparing, a data bar for measuring, selection handles for deciding —
 *     so the mark is saying the same thing as the copy.
 *
 * Every element animates on a `scaleX`/`scaleY` from a fixed origin, which is
 * compositor-friendly and, unlike stroke-dash, cannot be thrown off by scale.
 */

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const QUINT = Easing.bezier(0.22, 1, 0.36, 1);

const g = (t: number, a: number, b: number, from = 0, to = 1, easing = OUT) =>
  interpolate(t, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export type Mark = (p: MarkProps) => React.ReactNode;
export type MarkProps = {
  t: number;
  /** local frame where the mark starts drawing */
  start: number;
  color: string;
  /** the accent word's line height in px */
  h: number;
};

const RULE = 2;
const TICK = 9; // end-tick height, fixed px so it never scales with the word

/** absolutely positioned box, in px, against the word's own line box */
const el = (s: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  pointerEvents: "none",
  ...s,
});

/* ── act 1 · ESCUCHAMOS ───────────────────────────────────────────────────
   Dictation mark: an opening quote, a rule under the word, a closing tick.
   Something was said, and it got written down.                            */

export const QuoteRule: Mark = ({ t, start, color, h }) => {
  const y = h + 2;
  return (
    <>
      {/* everything sits below the baseline: above it there is a line of copy
          within a few px, and any mark up there collides with its descenders */}
      <div
        style={el({
          left: 0,
          top: y - 3,
          width: 8,
          height: 8,
          background: color,
          transform: `scale(${g(t, start, start + 9, 0, 1, QUINT)})`,
        })}
      />
      <div
        style={el({
          left: 0,
          top: y,
          width: "100%",
          height: RULE,
          background: color,
          transform: `scaleX(${g(t, start + 4, start + 24)})`,
          transformOrigin: "0% 50%",
        })}
      />
      <div
        style={el({
          right: 0,
          top: y - TICK + RULE,
          width: RULE,
          height: TICK,
          background: color,
          transform: `scaleY(${g(t, start + 22, start + 30, 0, 1, QUINT)})`,
          transformOrigin: "50% 100%",
        })}
      />
    </>
  );
};

/* ── act 2 · COMPARAMOS ───────────────────────────────────────────────────
   A dimension line. End-ticks land first, then the rule grows out of the
   centre to meet them: the word measured against something.               */

export const DimensionLine: Mark = ({ t, start, color, h }) => {
  const y = h + 2;
  const tick = (side: "left" | "right") => (
    <div
      key={side}
      style={el({
        [side]: -8,
        top: y - TICK + RULE,
        width: RULE,
        height: TICK + 4,
        background: color,
        transform: `scaleY(${g(t, start, start + 9, 0, 1, QUINT)})`,
        transformOrigin: "50% 100%",
      })}
    />
  );
  return (
    <>
      {tick("left")}
      {tick("right")}
      <div
        style={el({
          left: -8,
          right: -8,
          top: y,
          height: RULE,
          background: color,
          transform: `scaleX(${g(t, start + 6, start + 24)})`,
          transformOrigin: "50% 50%", // grows out of the centre, both ways
        })}
      />
    </>
  );
};

/* ── act 3 · MEDIMOS ──────────────────────────────────────────────────────
   A data bar that fills under the word on the same easing as the counters in
   the panel, so the word and the figures move as one reading.             */

export const DataBar: Mark = ({ t, start, color, h }) => {
  const y = h + 1;
  return (
    <>
      <div
        style={el({
          left: 0,
          top: y,
          width: "100%",
          height: 6,
          background: color,
          opacity: 0.18,
          transform: `scaleX(${g(t, start, start + 10)})`,
          transformOrigin: "0% 50%",
        })}
      />
      <div
        style={el({
          left: 0,
          top: y,
          width: "100%",
          height: 6,
          background: color,
          transform: `scaleX(${g(t, start + 4, start + 30)})`,
          transformOrigin: "0% 50%",
        })}
      />
      <div
        style={el({
          right: -7,
          top: y - 4,
          width: RULE,
          height: 14,
          background: color,
          transform: `scaleY(${g(t, start + 28, start + 36, 0, 1, QUINT)})`,
          transformOrigin: "50% 50%",
        })}
      />
    </>
  );
};

/* ── act 4 · DECIDIMOS ────────────────────────────────────────────────────
   Selection handles, the way a design tool marks the thing you picked. Fixed
   10px corners: they stay square whatever the word measures. Also the first
   hint of stage 02, which is about design.                                */

const ARM = 10;

export const SelectionHandles: Mark = ({ t, start, color, h }) => {
  const pad = 7; // horizontal only; vertically the line above is 6px away
  const corners: [string, string, number, number][] = [
    ["top", "left", -1, -1],
    ["top", "right", -1, 1],
    ["bottom", "left", 1, -1],
    ["bottom", "right", 1, 1],
  ];
  return (
    <>
      {corners.map(([v, hz, dy, dx], i) => {
        // each handle snaps in diagonally from outside the box
        const p = g(t, start + i * 3, start + i * 3 + 12, 1, 0, QUINT);
        const off = 14 * p;
        return (
          <div
            key={`${v}${hz}`}
            style={el({
              [v]: v === "top" ? 1 : -4,
              [hz]: -pad,
              width: ARM,
              height: ARM,
              [`border${v === "top" ? "Top" : "Bottom"}`]: `${RULE}px solid ${color}`,
              [`border${hz === "left" ? "Left" : "Right"}`]: `${RULE}px solid ${color}`,
              opacity: 1 - p,
              transform: `translate(${dx * off}px, ${dy * off}px)`,
              boxSizing: "border-box",
            })}
          />
        );
      })}
      <div
        style={el({
          left: -pad,
          right: -pad,
          top: h + 8,
          height: 1,
          background: color,
          opacity: 0.35,
          transform: `scaleX(${g(t, start + 14, start + 30)})`,
          transformOrigin: "50% 50%",
        })}
      />
    </>
  );
};

/* ── stage 02 · Diseñar ───────────────────────────────────────────────────
   The same rules, but the marks are borrowed from planning and drawing
   instead of from analysis.                                              */

/** PROPONEMOS — square brackets: this is the scope of what we propose. */
export const ScopeBrackets: Mark = ({ t, start, color, h }) => {
  const arm = 9;
  const side = (s: "left" | "right", i: number) => (
    <div
      key={s}
      style={el({
        [s]: -13,
        top: -3,
        width: arm,
        height: h + 4,
        borderTop: `${RULE}px solid ${color}`,
        borderBottom: `${RULE}px solid ${color}`,
        [s === "left" ? "borderLeft" : "borderRight"]:
          `${RULE}px solid ${color}`,
        boxSizing: "border-box",
        opacity: g(t, start + i * 4, start + i * 4 + 8),
        transform: `translateX(${g(t, start + i * 4, start + i * 4 + 14, s === "left" ? -10 : 10, 0, QUINT)}px)`,
      })}
    />
  );
  return (
    <>
      {side("left", 0)}
      {side("right", 1)}
    </>
  );
};

/** ORDENAMOS — a sequence line: three nodes that land in order. */
export const SequenceLine: Mark = ({ t, start, color, h }) => {
  const y = h + 3;
  return (
    <>
      <div
        style={el({
          left: 0,
          right: -6,
          top: y,
          height: RULE,
          background: color,
          transform: `scaleX(${g(t, start, start + 20)})`,
          transformOrigin: "0% 50%",
        })}
      />
      {[0, 0.5, 1].map((f, i) => (
        <div
          key={i}
          style={el({
            left: `calc(${f * 100}% - 4px)`,
            top: y - 3,
            width: 8,
            height: 8,
            borderRadius: 8,
            background: i === 0 ? color : "#EFECE7",
            border: `${RULE}px solid ${color}`,
            boxSizing: "border-box",
            transform: `scale(${g(t, start + 8 + i * 6, start + 18 + i * 6, 0, 1, QUINT)})`,
          })}
        />
      ))}
    </>
  );
};

/** DIBUJAMOS — typographic guides: baseline and x-height, dashed, as drawn. */
export const TypeGuides: Mark = ({ t, start, color, h }) => {
  const dash = `repeating-linear-gradient(to right, ${color} 0 6px, transparent 6px 12px)`;
  const line = (top: number, from: number) => (
    <div
      key={top}
      style={el({
        left: -10,
        right: -10,
        top,
        height: 1.5,
        backgroundImage: dash,
        transform: `scaleX(${g(t, from, from + 22)})`,
        transformOrigin: "0% 50%",
      })}
    />
  );
  return (
    <>
      {line(h * 0.3, start)}
      {line(h + 1, start + 6)}
      <div
        style={el({
          left: -10,
          top: h * 0.3,
          width: RULE,
          height: h * 0.7,
          background: color,
          transform: `scaleY(${g(t, start + 18, start + 28, 0, 1, QUINT)})`,
          transformOrigin: "50% 0%",
        })}
      />
    </>
  );
};

/** NAVEGÁS — the word as a hit area, with a pointer arriving on it. */
export const HitArea: Mark = ({ t, start, color, h }) => (
  <>
    <div
      style={el({
        left: -10,
        right: -10,
        top: -5,
        height: h + 12,
        border: `1.5px solid ${color}`,
        boxSizing: "border-box",
        opacity: g(t, start, start + 10) * 0.55,
        transform: `scale(${g(t, start, start + 16, 1.06, 1, QUINT)})`,
      })}
    />
    <svg
      width="15"
      height="20"
      viewBox="0 0 15 20"
      style={el({
        right: -16,
        top: h - 6,
        opacity: g(t, start + 12, start + 20),
        transform: `translate(${g(t, start + 12, start + 30, 10, 0, QUINT)}px, ${g(t, start + 12, start + 30, 10, 0, QUINT)}px)`,
      })}
    >
      <path
        d="M1 1 L1 15 L4.6 11.6 L7 17.6 L9.6 16.4 L7.2 10.8 L12 10.6 Z"
        fill={color}
      />
    </svg>
  </>
);

/** Act order for each card. */
export const MARKS_ANALIZAR: Mark[] = [
  QuoteRule,
  DimensionLine,
  DataBar,
  SelectionHandles,
];
export const MARKS_DISENAR: Mark[] = [
  ScopeBrackets,
  SequenceLine,
  TypeGuides,
  HitArea,
];
