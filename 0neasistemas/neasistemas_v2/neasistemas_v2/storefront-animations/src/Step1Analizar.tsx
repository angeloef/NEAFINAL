import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Eyebrow, Line, ease } from "./analizar/kinetic";
import {
  CompetenciaPanel,
  DatosPanel,
  NegocioPanel,
  WebPanel,
} from "./analizar/panels";
import {
  ACTS,
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

const TEXT_OUT = 30; // frames before an act ends that its copy starts leaving

// The four acts are the method, in order: learn the business, study the
// competition, gather the data, and only then design against the objective.
const SCRIPT = [
  {
    eyebrow: "EMPEZAMOS POR VOS",
    line: "Qué vendés, a quién y qué querés lograr.",
  },
  {
    eyebrow: "MIRAMOS AFUERA",
    line: "Contra quién competís de verdad.",
  },
  {
    eyebrow: "JUNTAMOS LOS DATOS",
    line: "Lo que tu negocio ya sabe, junto.",
  },
  { eyebrow: "RECIÉN AHÍ, LA WEB", line: "Cada decisión apunta a ese objetivo." },
];

// The footage window is one object that travels; it is never cut and re-cut.
const RECTS = [
  { x: COL.rightX, y: 42, w: COL.rightW, h: 132 },
  { x: 916, y: 42, w: 292, h: 132 },
  { x: COL.rightX, y: 42, w: 292, h: 132 }, // slides across so no two acts frame alike
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
  // slow drift so the frame never feels like a still
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
      {/* duotone: paper in the highlights, a touch of vermilion in the shadows */}
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
  const exitAt = a === ACTS.length - 1 ? undefined : len - TEXT_OUT;

  // bookend dissolve so the <video loop> seam is invisible
  const fade = Math.min(
    ease(frame, [0, FADE], [0, 1]),
    ease(frame, [DURATION - FADE, DURATION], [1, 0]),
  );

  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily }}>
      <AbsoluteFill>
        {/* structure: the rule under the page's own "01 Analizar" tag, and the
            two column edges everything else aligns to */}
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
            text={SCRIPT[a].eyebrow}
            t={t}
            enter={6}
            exit={exitAt}
            color={a === 3 ? VERMILION : INK_SOFT}
          />
          <div style={{ height: 22 }} />
          <Line
            key={`l${a}`}
            text={SCRIPT[a].line}
            t={t}
            enter={14}
            exit={exitAt}
            size={44}
            color={INK}
          />
        </div>

        <div
          style={{ position: "absolute", left: COL.rightX + 24, top: COL.top }}
        >
          {a === 0 ? <NegocioPanel t={t} w={COL.rightW - 48} /> : null}
        </div>
        <div
          style={{ position: "absolute", left: COL.rightX + 24, top: COL.top }}
        >
          {a === 1 ? <CompetenciaPanel t={t} /> : null}
        </div>
        <div
          style={{ position: "absolute", left: COL.rightX + 24, top: COL.top }}
        >
          {a === 2 ? <DatosPanel t={t} w={COL.rightW - 48} /> : null}
        </div>
        <div
          style={{ position: "absolute", left: COL.rightX + 24, top: COL.top }}
        >
          {a === 3 ? <WebPanel t={t} w={COL.rightW - 48} /> : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
