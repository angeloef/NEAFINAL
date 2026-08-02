import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate } from "remotion";
import { KineticText, type Enter } from "./letters";
import { INK, INK_SOFT } from "./theme";

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN = Easing.bezier(0.7, 0, 0.84, 0);

export const ease = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing = OUT,
) =>
  interpolate(frame, range, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/**
 * Words rise out of a mask on enter and sink back in on exit. Per-word stagger
 * gives the line a direction instead of a single flat fade.
 */
export const Line = ({
  text,
  t,
  enter = 0,
  exit,
  size,
  weight = 700,
  color = INK,
  tracking = -0.03,
  leading = 1.06,
  stagger = 4,
  accent,
  decoration,
  style,
}: {
  text: string;
  t: number;
  enter?: number;
  exit?: number;
  size: number;
  weight?: number;
  color?: string;
  tracking?: number;
  leading?: number;
  stagger?: number;
  /** colour for the closing word — the act's meaning, landed on one word */
  accent?: string;
  /** drawn inside the accent word's box, so it tracks the text after wrapping */
  decoration?: (t: number, start: number, h: number) => ReactNode;
  style?: CSSProperties;
}) => {
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        // without this the word boxes stretch to the flex line, and any
        // decoration anchored to one of them escapes far below the text
        alignItems: "flex-start",
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((w, i) => {
        // the closing word lands late and slow, so the eye ends on the meaning
        const isAccent = accent !== undefined && i === words.length - 1;
        const from = enter + i * stagger + (isAccent ? 4 : 0);
        const dur = isAccent ? 20 : 26;
        const y = ease(t, [from, from + dur], [110, 0]);
        const o = ease(t, [from, from + 14], [0, 1]);
        const xOut =
          exit === undefined
            ? 0
            : ease(t, [exit + i * 2, exit + 22], [0, -60], IN);
        const oOut =
          exit === undefined
            ? 1
            : ease(t, [exit + i * 2, exit + 20], [1, 0], IN);
        return (
          // the mask has to clip the word but not the shape drawn around it,
          // so the decoration is a sibling of the mask, not a child
          <span
            key={i}
            style={{ position: "relative", display: "inline-block" }}
          >
            <span
              style={{
                display: "block",
                overflow: "hidden",
                paddingBottom: size * 0.1,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: size,
                  lineHeight: leading,
                  fontWeight: isAccent ? Math.min(weight + 50, 800) : weight,
                  letterSpacing: `${tracking}em`,
                  color: isAccent && accent ? accent : color,
                  opacity: o * oOut,
                  translate: `${xOut}px ${y}%`,
                }}
              >
                {w}
              </span>
            </span>
            {isAccent && decoration ? (
              // an explicit one-line box: the shape must not inherit whatever
              // height the flex item ends up with
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: size * leading,
                  opacity: o * oOut,
                }}
              >
                {/* anchored to the line, not to the word: hung off `from` the
                    shape barely finished drawing before the copy left */}
                {decoration(t, enter + 8, size * leading)}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

/**
 * The act's verb. Carries the per-letter kinetic treatment: a different
 * entrance per act, one shared exit for all four. See letters.tsx.
 */
export const Eyebrow = ({
  text,
  t,
  effect,
  enter = 0,
  exit,
  color = INK_SOFT,
}: {
  text: string;
  t: number;
  effect: Enter;
  enter?: number;
  exit?: number;
  color?: string;
}) => {
  const rule = ease(t, [enter, enter + 30], [0, 46]);
  const ruleOut =
    exit === undefined ? 1 : ease(t, [exit, exit + 12], [1, 0], IN);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: rule * ruleOut, height: 2, background: color }} />
      <KineticText
        text={text}
        t={t}
        start={enter}
        enter={effect}
        exit={exit}
        color={color}
      />
    </div>
  );
};

/** Digits that count up and land, with tabular figures so nothing jitters. */
export const Counter = ({
  t,
  from,
  to,
  start,
  duration = 34,
  prefix = "",
  suffix = "",
  decimals = 0,
  grouped = false,
  style,
}: {
  t: number;
  from: number;
  to: number;
  start: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  grouped?: boolean;
  style?: CSSProperties;
}) => {
  const v = ease(t, [start, start + duration], [from, to]);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {grouped
        ? v.toLocaleString("es-AR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : v.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const Reveal = ({
  t,
  start,
  duration = 26,
  from = "inset(0 100% 0 0)",
  children,
  style,
}: {
  t: number;
  start: number;
  duration?: number;
  from?: string;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const p = ease(t, [start, start + duration], [0, 1]);
  const pct = (1 - p) * 100;
  return (
    <div
      style={{
        clipPath: from.includes("100% 0 0")
          ? `inset(0 ${pct}% 0 0)`
          : `inset(${pct}% 0 0 0)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
