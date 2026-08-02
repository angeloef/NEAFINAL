import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { AMBER, INK } from "./theme";

/**
 * Per-letter kinetic type, ported from codrops/LetterInteractions and
 * codrops/DecorativeLetterAnimations.
 *
 * Those demos are hover-driven anime.js timelines over charming.js spans. None
 * of that survives here: Remotion renders every frame in isolation, so a letter
 * has to be a pure function of the frame. The port is mechanical and the
 * originals' numbers are kept — anime's `duration: 400` is 12 frames at 30fps,
 * its `delay: i * n` is an index offset on the local clock, and its elasticity
 * becomes an overshooting bezier.
 *
 * Neither anime.js nor charming.js is installed.
 */

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN = Easing.bezier(0.7, 0, 0.84, 0);
const BACK_OUT = Easing.bezier(0.34, 1.56, 0.64, 1); // easeOutBack
const BACK_IN = Easing.bezier(0.36, 0, 0.66, -0.56); // easeInBack
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const QUINT_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SPRING_OUT = Easing.bezier(0.22, 1.3, 0.36, 1); // stands in for elasticity

const e = (
  t: number,
  range: [number, number],
  out: [number, number],
  easing = OUT,
) =>
  interpolate(t, range, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export type Enter = "crossword" | "weaver" | "trail" | "redraw";

type Piece = { transform: string; opacity: number; origin: string };

/* ── entrances ────────────────────────────────────────────────────────────
   One per act, chosen for what the act means rather than for how it looks. */

const entrance = (kind: Enter, t: number, i: number): Piece => {
  switch (kind) {
    // Letters lock in from two different axes, the way a crossword fills.
    // Act 1: something being assembled out of pieces you were told.
    case "crossword": {
      const s = i * 2;
      const d = e(t, [s, s + 14], [60, 0], BACK_OUT);
      const even = i % 2 === 0;
      return {
        transform: even ? `translateX(${-d}px)` : `translateY(${-d}px)`,
        opacity: e(t, [s, s + 8], [0, 1]),
        origin: "50% 50%",
      };
    }
    // Even letters rise, odd letters fall, and both settle on the baseline.
    // Act 2: the comparison performed by the text itself.
    case "weaver": {
      const s = i * 2;
      const from = i % 2 === 0 ? 34 : -34;
      return {
        transform: `translateY(${e(t, [s, s + 16], [from, 0], SPRING_OUT)}px)`,
        opacity: e(t, [s, s + 8], [0, 1]),
        origin: "50% 50%",
      };
    }
    // Act 3: accumulation resolving into a reading. The ghosts are drawn by
    // <KineticText> itself, not here.
    case "trail": {
      const s = i * 2;
      return {
        transform: `translateX(${e(t, [s, s + 18], [26, 0], EXPO_OUT)}px)`,
        opacity: e(t, [s, s + 9], [0, 1]),
        origin: "50% 50%",
      };
    }
    // Unfolds from the baseline with no overshoot at all — the only entrance in
    // the film that does not oscillate, because it is the one that decides.
    case "redraw": {
      const s = i * 1.5;
      return {
        transform: `scaleY(${e(t, [s, s + 12], [0.06, 1], QUINT_OUT)})`,
        opacity: e(t, [s, s + 6], [0, 1]),
        origin: "50% 100%",
      };
    }
  }
};

/* ── exit ─────────────────────────────────────────────────────────────────
   One shared vocabulary for all four acts, ported from LetterInteractions
   demo3 (moveout). The demo picks one of four exits per letter position; here
   it is the letter index mod 4. Sharing it is what makes the four transitions
   read as one system instead of four ideas. */

const EXIT_LEN = 30;

const exitPiece = (xt: number, i: number): Piece => {
  switch (i % 4) {
    case 0:
      return {
        transform: `translateY(${e(xt, [15, 27], [0, 400], IN)}px) rotate(${e(xt, [0, 21], [0, 38], BACK_OUT)}deg)`,
        opacity: e(xt, [21, 27], [1, 0]),
        origin: "0% 0%",
      };
    case 1:
      return {
        transform: `scale(${e(xt, [0, 9], [1, 0], BACK_IN)})`,
        opacity: e(xt, [6, 15], [1, 0]),
        origin: "50% 50%",
      };
    case 2: {
      const sy =
        xt < 6 ? e(xt, [0, 6], [1, 0.7]) : e(xt, [6, 30], [0.7, 1], SPRING_OUT);
      const sx =
        xt < 6 ? e(xt, [0, 6], [1, 1.2]) : e(xt, [6, 30], [1.2, 1], SPRING_OUT);
      return {
        transform: `translateY(${e(xt, [6, 30], [0, -400], IN)}px) scaleY(${sy}) scaleX(${sx})`,
        opacity: e(xt, [8, 18], [1, 0]),
        origin: "50% 100%",
      };
    }
    default:
      return {
        transform: `translateY(${e(xt, [21, 30], [0, 300], IN)}px) rotate(${e(xt, [0, 21], [0, -30], BACK_OUT)}deg)`,
        opacity: e(xt, [24, 30], [1, 0]),
        origin: "100% 0%",
      };
  }
};

/* ── the component ────────────────────────────────────────────────────── */

const Glyph = ({
  char,
  piece,
  style,
}: {
  char: string;
  piece: Piece;
  style: CSSProperties;
}) => (
  <span
    style={{
      display: "inline-block",
      whiteSpace: "pre",
      transform: piece.transform,
      transformOrigin: piece.origin,
      opacity: piece.opacity,
      ...style,
    }}
  >
    {char}
  </span>
);

export const KineticText = ({
  text,
  t,
  enter,
  start = 0,
  exit,
  color = INK,
  size = 15,
  weight = 700,
  tracking = "0.22em",
  style,
}: {
  text: string;
  /** frames since the start of the act */
  t: number;
  enter: Enter;
  start?: number;
  /** local frame where the shared moveout begins; undefined = never leaves */
  exit?: number;
  color?: string;
  size?: number;
  weight?: number;
  tracking?: string;
  style?: CSSProperties;
}) => {
  const chars = text.split("");
  const local = t - start;
  const leaving = exit !== undefined && t >= exit;

  return (
    <span style={{ display: "inline-flex", ...style }}>
      {chars.map((c, i) => {
        const piece = leaving
          ? exitPiece(t - (exit as number) - i, i)
          : entrance(enter, local, i);
        const base: CSSProperties = {
          fontSize: size,
          fontWeight: weight,
          letterSpacing: tracking,
          color,
        };

        // trail: three amber ghosts closing in on the letter, gone by frame 24
        const ghosts =
          enter === "trail" && !leaving && local < 24
            ? [0.18, 0.1, 0.05].map((o, g) => {
                const p = entrance("trail", local - (g + 1) * 2, i);
                return (
                  <Glyph
                    key={`g${g}`}
                    char={c}
                    piece={{ ...p, opacity: p.opacity * o }}
                    style={{
                      ...base,
                      color: AMBER,
                      position: "absolute",
                      left: 0,
                      top: 0,
                    }}
                  />
                );
              })
            : null;

        return (
          <span
            key={i}
            style={{ position: "relative", display: "inline-block" }}
          >
            {ghosts}
            <Glyph char={c} piece={piece} style={base} />
          </span>
        );
      })}
    </span>
  );
};

export { EXIT_LEN };
