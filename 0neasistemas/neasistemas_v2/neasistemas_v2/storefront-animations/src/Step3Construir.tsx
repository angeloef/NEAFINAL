import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Eyebrow, Line, ease } from "./analizar/kinetic";
import type { Enter } from "./analizar/letters";
import { MARKS_CONSTRUIR } from "./analizar/notation";
import {
  AcuerdoLabels,
  Cells,
  CobroLabels,
  EntregaLabels,
  LecturaLabels,
} from "./construir/cells";
import {
  ACTS,
  AMBER,
  COL,
  DURATION,
  FADE,
  HAIRLINE,
  INK,
  INK_SOFT,
  PAPER,
  VERMILION,
  W,
} from "./analizar/theme";

const { fontFamily } = loadFont();

const TEXT_OUT = 30;

/**
 * The card says "Construimos y medimos", and its description carries the part
 * that actually differentiates the offer: KPIs agreed before starting, and the
 * next stage invoiced only once the previous one showed a result. The film
 * conjugates that, and is not shy about the last verb — COBRAMOS is the whole
 * argument, so it gets the closing act.
 *
 * Amber lands on acts 1 and 3 deliberately. It is the same number, fixed before
 * building and read again after; the repeat is the point, not an oversight.
 */
const SCRIPT: {
  eyebrow: string;
  line: string;
  effect: Enter;
  accent: string;
}[] = [
  {
    eyebrow: "ACORDAMOS",
    line: "Qué número tiene que moverse, y cuánto.",
    effect: "crossword",
    accent: AMBER,
  },
  {
    eyebrow: "LANZAMOS",
    line: "La etapa 01 entera, funcionando.",
    effect: "weaver",
    accent: VERMILION,
  },
  {
    eyebrow: "LEEMOS",
    line: "El mismo número, cuatro semanas después.",
    effect: "trail",
    accent: AMBER,
  },
  {
    eyebrow: "COBRAMOS",
    line: "La etapa que sigue, recién cuando esta rindió.",
    effect: "redraw",
    accent: VERMILION,
  },
];

export const Step3Construir = () => {
  const frame = useCurrentFrame();
  const a = ACTS.reduce((acc, act, i) => (frame >= act.start ? i : acc), 0);
  const t = frame - ACTS[a].start;
  const len = ACTS[a].end - ACTS[a].start;
  const last = a === ACTS.length - 1;
  const exitAt = last ? undefined : len - TEXT_OUT;
  const act = SCRIPT[a];
  const Mark = MARKS_CONSTRUIR[a];

  const fade = Math.min(
    ease(frame, [0, FADE], [0, 1]),
    ease(frame, [DURATION - FADE, DURATION], [1, 0]),
  );

  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily }}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 200,
            width: W,
            height: 1,
            background: HAIRLINE,
          }}
        />
        {[
          COL.leftX,
          COL.leftX + COL.leftW,
          COL.rightX,
          COL.rightX + COL.rightW,
        ].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: x,
              top: 200,
              width: 1,
              height: 205,
              background: HAIRLINE,
            }}
          />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{ opacity: fade }}>
        <div
          style={{
            position: "absolute",
            left: COL.leftX + 24,
            top: COL.top,
            width: COL.leftW - 40,
          }}
        >
          <Eyebrow
            key={`e${a}`}
            text={act.eyebrow}
            t={t}
            effect={act.effect}
            enter={6}
            exit={exitAt}
            color={a === 3 ? VERMILION : INK_SOFT}
          />
          <div style={{ height: 22 }} />
          <Line
            key={`l${a}`}
            text={act.line}
            t={t}
            enter={14}
            exit={exitAt}
            size={a === 3 ? 40 : 44}
            color={INK}
            accent={act.accent}
            decoration={(dt, start, h) => (
              <Mark t={dt} start={start} h={h} color={act.accent} />
            )}
          />
        </div>

        <Cells frame={frame} />
        {a === 0 ? <AcuerdoLabels t={t} len={len} /> : null}
        {a === 1 ? <EntregaLabels t={t} len={len} /> : null}
        {a === 2 ? <LecturaLabels t={t} len={len} /> : null}
        {a === 3 ? <CobroLabels t={t} len={len} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
