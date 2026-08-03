import type { CSSProperties } from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import { Counter, ease } from "../analizar/kinetic";
import {
  ACTS,
  AMBER,
  HAIRLINE,
  INK,
  INK_SOFT,
  VERMILION,
} from "../analizar/theme";

/**
 * Card 03 · Construir. Same machine as 01 and 02: sixteen cells alive from the
 * first frame to the last, four formations, no cross-fade.
 *
 * The thread arrives here from card 02, where stage 01 of the plan was
 * "Catálogo navegable". In this card cell 2 is:
 *   the agreed KPI (act 1) -> stage 01 delivered (act 2)
 *   -> the bar that actually moved (act 3) -> stage 01 invoiced (act 4)
 *
 * Amber shows up in acts 1 and 3 on purpose. It is the same number, agreed
 * before starting and read again after — the rhyme is the argument.
 */

export const PANEL = { x: 700, y: 214, w: 484, h: 191 };
export const KPI = "Pedidos por semana";
export const ETAPA_01 = "Catálogo navegable";

const N = 16;
const SOFT = "rgba(0,0,0,0.42)";
const FAINT = "rgba(0,0,0,0.13)";

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  /** paint order; gridlines go behind the bars they sit under */
  z?: number;
};

export const HOY = 18;
export const META = 26;
export const LOGRADO = 27;

/* act 2 — what stage 01 left working */
export const ENTREGADO = [
  "Catálogo con precios",
  "Stock a la vista",
  "Buscador que encuentra",
];
const CHECK_Y = [70, 104, 138];

/* act 3 — four weekly readings of the same number */
export const SEMANAS = [18, 21, 24, LOGRADO];
const BAR_X = [0, 62, 124, 186];
const BAR_W = 42;
const BASE = 160;
const barH = (v: number) => 24 + (v - 16) * 8;

/* act 4 — the three stages, and which one is billable */
export const COBRO = [
  { n: "01", t: "Cobrada", estado: "hecho" },
  { n: "02", t: "Habilitada", estado: "listo" },
  { n: "03", t: "Todavía no", estado: "espera" },
];
const COBRO_Y = [30, 84, 138];

const formation1 = (i: number): Rect => {
  if (i === 2) return { x: 0, y: 22, w: 300, h: 34, fill: VERMILION };
  if (i === 3) return { x: 0, y: 134, w: 150, h: 2, fill: SOFT };
  if (i === 4) return { x: 180, y: 134, w: 150, h: 2, fill: AMBER };
  if (i === 0) return { x: 0, y: 176, w: 300, h: 1, fill: FAINT };
  if (i === 1) return { x: 340, y: 176, w: 40, h: 1, fill: FAINT };
  const k = i - 5;
  return {
    x: 380 + (k % 6) * 14,
    y: 150 + Math.floor(k / 6) * 8,
    w: 6,
    h: 2,
    fill: FAINT,
  };
};

const formation2 = (i: number): Rect => {
  if (i === 2) return { x: 0, y: 20, w: 484, h: 34, fill: VERMILION };
  if (i === 0) return { x: 0, y: CHECK_Y[0] + 26, w: 440, h: 1, fill: FAINT };
  if (i === 1) return { x: 0, y: CHECK_Y[1] + 26, w: 440, h: 1, fill: FAINT };
  if (i === 3) return { x: 0, y: CHECK_Y[2] + 26, w: 440, h: 1, fill: FAINT };
  if (i >= 4 && i <= 6)
    return { x: 0, y: CHECK_Y[i - 4] + 3, w: 12, h: 12, fill: VERMILION };
  const k = i - 7;
  return {
    x: 380 + (k % 5) * 14,
    y: 168 + Math.floor(k / 5) * 8,
    w: 6,
    h: 2,
    fill: FAINT,
  };
};

const formation3 = (i: number): Rect => {
  // the last bar is the thread: the reading that cleared the target
  if (i === 2)
    return {
      x: BAR_X[3],
      y: BASE - barH(SEMANAS[3]),
      w: BAR_W,
      h: barH(SEMANAS[3]),
      fill: VERMILION,
    };
  if (i <= 1 || i === 3) {
    const k = i === 3 ? 2 : i;
    return {
      x: BAR_X[k],
      y: BASE - barH(SEMANAS[k]),
      w: BAR_W,
      h: barH(SEMANAS[k]),
      fill: "rgba(0,0,0,0.16)",
    };
  }
  // the target line, then gridlines behind the bars
  if (i === 4)
    return { x: 0, y: BASE - barH(META), w: 300, h: 2, fill: AMBER };
  if (i >= 5 && i <= 9)
    return { x: 0, y: BASE - (i - 4) * 24, w: 300, h: 1, fill: FAINT, z: 0 };
  const k = i - 10;
  return { x: 330 + k * 22, y: 168, w: 14, h: 2, fill: FAINT };
};

const formation4 = (i: number): Rect => {
  if (i === 2) return { x: 0, y: COBRO_Y[0], w: 484, h: 46, fill: VERMILION };
  if (i === 0)
    return { x: 0, y: COBRO_Y[1] + 44, w: 484, h: 2, fill: FAINT };
  if (i === 1)
    return { x: 0, y: COBRO_Y[2] + 44, w: 484, h: 2, fill: FAINT };
  if (i === 3) return { x: 0, y: 16, w: 200, h: 2, fill: AMBER };
  const k = i - 4;
  return {
    x: 400 + (k % 6) * 14,
    y: 8 + Math.floor(k / 6) * 8,
    w: 6,
    h: 2,
    fill: FAINT,
  };
};

const RECTS: Rect[][] = Array.from({ length: N }, (_, i) => [
  formation1(i),
  formation2(i),
  formation3(i),
  formation4(i),
]);

const FLOCK = Easing.bezier(0.32, 0.9, 0.24, 1);
const LEAD = 24;

export const Cells = ({ frame }: { frame: number }) => {
  let a = 0;
  for (let i = 0; i < ACTS.length; i++) if (frame >= ACTS[i].start) a = i;
  const last = a === ACTS.length - 1;
  const end = ACTS[a].end;

  return (
    <>
      {RECTS.map((rects, i) => {
        const s = i * 0.8;
        const p = last
          ? 0
          : interpolate(frame, [end - LEAD + s, end + 10 + s], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: FLOCK,
            });
        const from = rects[a];
        const to = rects[Math.min(a + 1, 3)];
        const m = (k: "x" | "y" | "w" | "h") => from[k] + (to[k] - from[k]) * p;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PANEL.x + m("x"),
              top: PANEL.y + m("y"),
              width: m("w"),
              height: m("h"),
              zIndex: p < 0.5 ? (from.z ?? 1) : (to.z ?? 1),
              background: interpolateColors(p, [0, 1], [from.fill, to.fill]),
            }}
          />
        );
      })}
    </>
  );
};

/* ── labels ───────────────────────────────────────────────────────────── */

const caption: CSSProperties = {
  position: "absolute",
  fontSize: 12.5,
  fontWeight: 700,
  color: INK_SOFT,
  letterSpacing: "0.14em",
  whiteSpace: "nowrap",
};

const Layer = ({
  t,
  len,
  last,
  children,
}: {
  t: number;
  len: number;
  last?: boolean;
  children: React.ReactNode;
}) => (
  <div
    style={{
      position: "absolute",
      left: PANEL.x,
      top: PANEL.y,
      width: PANEL.w,
      height: PANEL.h,
      opacity:
        ease(t, [6, 22], [0, 1]) *
        (last ? 1 : ease(t, [len - 26, len - 8], [1, 0])),
    }}
  >
    {children}
  </div>
);

const big: CSSProperties = {
  position: "absolute",
  fontSize: 40,
  fontWeight: 800,
  letterSpacing: "-0.04em",
  fontVariantNumeric: "tabular-nums",
};

/** Act 1 — the number that has to move, fixed before anything is built. */
export const AcuerdoLabels = (p: { t: number; len: number }) => (
  <Layer {...p}>
    <span style={{ ...caption, left: 0, top: 0, color: AMBER }}>
      KPI ACORDADO ANTES DE EMPEZAR
    </span>
    <span
      style={{
        position: "absolute",
        left: 14,
        top: 30,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "#fff",
      }}
    >
      {KPI}
    </span>
    <span style={{ ...caption, left: 0, top: 72 }}>HOY</span>
    <span style={{ ...big, left: 0, top: 88, color: INK }}>{HOY}</span>
    <span style={{ ...caption, left: 180, top: 72, color: AMBER }}>META</span>
    <span style={{ ...big, left: 180, top: 88, color: AMBER }}>{META}</span>
    <span style={{ ...caption, left: 0, top: 156, letterSpacing: "0.08em" }}>
      SI NO SE MUEVE, NO SIRVIÓ
    </span>
  </Layer>
);

/** Act 2 — stage 01 delivered: what is actually working now. */
export const EntregaLabels = (p: { t: number; len: number }) => (
  <Layer {...p}>
    <span
      style={{
        position: "absolute",
        left: 14,
        top: 28,
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "#fff",
      }}
    >
      ETAPA 01 · {ETAPA_01}
    </span>
    {ENTREGADO.map((e, i) => (
      <span
        key={e}
        style={{
          position: "absolute",
          left: 26,
          top: CHECK_Y[i] + 2,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: INK,
        }}
      >
        {e}
      </span>
    ))}
    <span style={{ ...caption, left: 0, top: 172, letterSpacing: "0.08em" }}>
      ANDANDO, NO EN UNA DEMO
    </span>
  </Layer>
);

/** Act 3 — the same number, read again week by week. */
export const LecturaLabels = ({ t, len }: { t: number; len: number }) => (
  <Layer t={t} len={len}>
    <span style={{ ...caption, left: 0, top: 0 }}>{KPI.toUpperCase()}</span>
    <span
      style={{
        ...caption,
        left: 306,
        top: BASE - barH(META) - 7,
        color: AMBER,
        fontSize: 11,
      }}
    >
      META {META}
    </span>
    {SEMANAS.map((v, i) => (
      <div key={i}>
        <Counter
          t={t}
          from={HOY}
          to={v}
          start={10 + i * 7}
          duration={26}
          style={{
            position: "absolute",
            left: BAR_X[i],
            top: BASE - barH(v) - 22,
            width: BAR_W,
            textAlign: "center",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: i === 3 ? VERMILION : INK_SOFT,
          }}
        />
        <span
          style={{
            ...caption,
            left: BAR_X[i],
            top: BASE + 8,
            width: BAR_W,
            textAlign: "center",
            fontSize: 10,
            letterSpacing: "0.06em",
          }}
        >
          S{i + 1}
        </span>
      </div>
    ))}
    <span style={{ ...caption, left: 0, top: 182, letterSpacing: "0.08em" }}>
      DE {HOY} A {LOGRADO} EN CUATRO SEMANAS
    </span>
  </Layer>
);

/** Act 4 — the next stage is billable because the last one paid off. */
export const CobroLabels = ({ t, len }: { t: number; len: number }) => (
  <Layer t={t} len={len} last>
    <span style={{ ...caption, left: 0, top: -8, color: AMBER }}>
      FACTURACIÓN POR RESULTADO
    </span>
    {COBRO.map((c, i) => {
      const lead = i === 0;
      const start = 12 + i * 12;
      return (
        <div
          key={c.n}
          style={{
            position: "absolute",
            left: 0,
            top: COBRO_Y[i],
            width: PANEL.w,
            height: 46,
            border: lead ? "none" : `1.5px solid ${HAIRLINE}`,
            boxSizing: "border-box",
            opacity: ease(t, [start, start + 18], [0, 1]),
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 18,
              top: 12,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: lead ? "#fff" : INK_SOFT,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {c.n}
          </span>
          <span
            style={{
              position: "absolute",
              left: 62,
              top: 15,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: lead ? "#fff" : c.estado === "listo" ? INK : INK_SOFT,
            }}
          >
            {c.t}
          </span>
          {c.estado !== "espera" ? (
            <span
              style={{
                position: "absolute",
                right: 18,
                top: 16,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: lead ? "#fff" : AMBER,
              }}
            >
              {/* the row that got paid states the number it was paid on: the
                  same one act 1 agreed and act 3 read back */}
              {lead
                ? `${LOGRADO} VS ${META} ACORDADO`
                : "PORQUE LA 01 RINDIÓ"}
            </span>
          ) : null}
        </div>
      );
    })}
  </Layer>
);
