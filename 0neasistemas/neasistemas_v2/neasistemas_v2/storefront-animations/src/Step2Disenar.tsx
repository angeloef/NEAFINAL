import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Eyebrow, Line, ease } from "./analizar/kinetic";
import type { Enter } from "./analizar/letters";
import { MARKS_DISENAR } from "./analizar/notation";
import {
  Cells,
  PlanLabels,
  PropuestaLabels,
  PrototipoLabels,
  WireframeLabels,
} from "./disenar/cells";
import {
  ACTS,
  AMBER,
  BLUE,
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
 * The card says "Te mostramos el camino a seguir". The film conjugates it
 * rather than repeating it, the same way card 01 conjugates "Analizamos".
 *
 * The fourth act switches person on purpose. The first three are "nosotros";
 * the last is "vos". That shift is the argument of the stage: up to here we
 * showed you, now you click it — which is what "navegable" in the card's own
 * description actually means.
 *
 * Colour grammar, generalised from card 01 so one colour never means two
 * things: vermilion is what comes out of your objective, blue is what is not
 * yours yet (their sites there, the draft here), amber is what is already
 * settled (your data there, the agreed plan here). The payoff of act 4 is
 * literally the blue block turning vermilion.
 */
const SCRIPT: {
  eyebrow: string;
  line: string;
  effect: Enter;
  accent: string;
}[] = [
  {
    eyebrow: "PROPONEMOS",
    line: "Qué hacemos primero, y por qué ese primero.",
    effect: "crossword",
    accent: VERMILION,
  },
  {
    eyebrow: "ORDENAMOS",
    line: "En qué orden, y qué desbloquea cada paso.",
    effect: "weaver",
    accent: AMBER,
  },
  {
    eyebrow: "DIBUJAMOS",
    line: "La estructura antes que los colores.",
    effect: "trail",
    accent: BLUE,
  },
  {
    eyebrow: "NAVEGÁS",
    line: "Lo tocás antes de que exista de verdad.",
    effect: "redraw",
    accent: VERMILION,
  },
];

export const Step2Disenar = () => {
  const frame = useCurrentFrame();
  const a = ACTS.reduce((acc, act, i) => (frame >= act.start ? i : acc), 0);
  const t = frame - ACTS[a].start;
  const len = ACTS[a].end - ACTS[a].start;
  const last = a === ACTS.length - 1;
  const exitAt = last ? undefined : len - TEXT_OUT;
  const act = SCRIPT[a];
  const Mark = MARKS_DISENAR[a];

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
            size={a === 0 ? 40 : 44}
            color={INK}
            accent={act.accent}
            decoration={(dt, start, h) => (
              <Mark t={dt} start={start} h={h} color={act.accent} />
            )}
          />
        </div>

        <Cells frame={frame} />
        {a === 0 ? <PropuestaLabels t={t} len={len} /> : null}
        {a === 1 ? <PlanLabels t={t} len={len} /> : null}
        {a === 2 ? <WireframeLabels t={t} len={len} /> : null}
        {a === 3 ? <PrototipoLabels t={t} len={len} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
