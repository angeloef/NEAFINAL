import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Eyebrow, Line, ease } from "./analizar/kinetic";
import type { Enter } from "./analizar/letters";
import {
  Cells,
  CompetenciaLabels,
  DatosLabels,
  NegocioLabels,
  WebLabels,
} from "./analizar/cells";
import { MARKS_ANALIZAR } from "./analizar/notation";
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

const TEXT_OUT = 30; // matches the shared moveout exit in letters.tsx

/**
 * The card's own heading already says "Analizamos tu negocio". The film does not
 * repeat it — it conjugates it. The four eyebrows are the four verbs that make
 * up that "analizamos", and read as one sentence in a row.
 *
 * Each act's accent colour is the grammar from theme.ts: vermilion is your
 * objective, blue is what comes from outside, amber is your own data.
 */
const SCRIPT: {
  eyebrow: string;
  line: string;
  effect: Enter;
  accent: string;
}[] = [
  {
    eyebrow: "ESCUCHAMOS",
    line: "Qué vendés, a quién, y qué querés lograr.",
    effect: "crossword",
    accent: VERMILION,
  },
  {
    eyebrow: "COMPARAMOS",
    line: "Contra qué te compara tu cliente.",
    effect: "weaver",
    accent: BLUE,
  },
  {
    eyebrow: "MEDIMOS",
    line: "Lo que tu negocio ya venía diciendo.",
    effect: "trail",
    accent: AMBER,
  },
  {
    eyebrow: "DECIDIMOS",
    line: "La web es la conclusión, no el punto de partida.",
    effect: "redraw",
    accent: VERMILION,
  },
];

// The footage window is one object that travels; it is never cut and re-cut.
// It may sit above the safe band only on the right half, where the page's
// black "01 — Analizar" tag is not.
const RECTS = [
  { x: COL.rightX, y: 42, w: COL.rightW, h: 132 },
  { x: 916, y: 42, w: 292, h: 132 },
  { x: COL.rightX, y: 42, w: 292, h: 132 },
  { x: COL.rightX, y: 42, w: COL.rightW, h: 132 },
];

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const windowRect = (frame: number) => {
  let a = 0;
  for (let i = 0; i < ACTS.length; i++) if (frame >= ACTS[i].start) a = i;
  const next = RECTS[Math.min(a + 1, RECTS.length - 1)];
  const cur = RECTS[a];
  const end = ACTS[a].end;
  const p = ease(frame, [end - 34, end + 6], [0, 1]);
  return {
    x: lerp(cur.x, next.x, p),
    y: lerp(cur.y, next.y, p),
    w: lerp(cur.w, next.w, p),
    h: lerp(cur.h, next.h, p),
  };
};

const FootageWindow = ({ frame }: { frame: number }) => {
  const r = windowRect(frame);
  const open = ease(frame, [4, 40], [0, 1]);
  const drift = Math.sin((frame / DURATION) * Math.PI * 2) * 10;

  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        overflow: "hidden",
        background: "#DEDAD4",
        clipPath: `inset(${(1 - open) * 50}% 0 ${(1 - open) * 50}% 0)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 620,
          height: 500,
          translate: `-50% -50%`,
          scale: 1 + 0.06 * (frame / DURATION),
        }}
      >
        <OffthreadVideo
          src={staticFile("footage/analyst.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "grayscale(1) contrast(1.12) brightness(1.05)",
            translate: `${drift}px 0`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: PAPER,
          opacity: 0.14,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: VERMILION,
          opacity: 0.07,
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `1px solid ${HAIRLINE}`,
        }}
      />
    </div>
  );
};

export const Step1Analizar = () => {
  const frame = useCurrentFrame();
  const a = ACTS.reduce((acc, act, i) => (frame >= act.start ? i : acc), 0);
  const t = frame - ACTS[a].start;
  const len = ACTS[a].end - ACTS[a].start;
  const last = a === ACTS.length - 1;
  const exitAt = last ? undefined : len - TEXT_OUT;
  const act = SCRIPT[a];
  const Mark = MARKS_ANALIZAR[a];

  // bookend dissolve so the <video loop> seam is invisible
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
        <FootageWindow frame={frame} />

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

        {/* Sixteen cells, never unmounted. Only the labels cross-fade. */}
        <Cells frame={frame} />
        {a === 0 ? <NegocioLabels t={t} len={len} /> : null}
        {a === 1 ? <CompetenciaLabels t={t} len={len} /> : null}
        {a === 2 ? <DatosLabels t={t} len={len} /> : null}
        {a === 3 ? <WebLabels t={t} len={len} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
