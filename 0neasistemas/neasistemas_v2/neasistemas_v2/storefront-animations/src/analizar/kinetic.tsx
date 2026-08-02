import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate } from "remotion";
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
  style?: CSSProperties;
}) => {
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const from = enter + i * stagger;
        const y = ease(t, [from, from + 26], [110, 0]);
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
          <span
            key={i}
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
                fontWeight: weight,
                letterSpacing: `${tracking}em`,
                color,
                opacity: o * oOut,
                translate: `${xOut}px ${y}%`,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Small uppercase monospace-ish label with a leading rule that draws itself. */
export const Eyebrow = ({
  text,
  t,
  enter = 0,
  exit,
  color = INK_SOFT,
}: {
  text: string;
  t: number;
  enter?: number;
  exit?: number;
  color?: string;
}) => {
  const rule = ease(t, [enter, enter + 30], [0, 46]);
  const o =
    ease(t, [enter, enter + 12], [0, 1]) *
    (exit === undefined ? 1 : ease(t, [exit, exit + 14], [1, 0], IN));
  const chars = text.split("");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: o }}>
      <div style={{ width: rule, height: 2, background: color }} />
      <div style={{ display: "flex" }}>
        {chars.map((c, i) => (
          <span
            key={i}
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color,
              opacity: ease(
                t,
                [enter + 8 + i * 1.6, enter + 20 + i * 1.6],
                [0, 1],
              ),
            }}
          >
            {c === " " ? " " : c}
          </span>
        ))}
      </div>
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
  style?: CSSProperties;
}) => {
  const v = ease(t, [start, start + duration], [from, to]);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {v.toFixed(decimals)}
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
