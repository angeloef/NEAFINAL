import type { CSSProperties } from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import { Counter, ease } from "./kinetic";
import { ACTS, AMBER, BLUE, HAIRLINE, INK, INK_SOFT, VERMILION } from "./theme";

/**
 * Sixteen cells live from frame 0 to frame 420. They are never mounted or
 * unmounted; each act is a different formation of the same sixteen. That is
 * what removes the cuts — there is nothing to cut between.
 *
 * Cell 2 is vermilion the whole way through and is the thread of the film:
 *   your objective (act 1) -> the row that measures you (act 2)
 *   -> the total (act 3) -> decision 01 (act 4)
 * Follow the red mark with your eye and you have the method.
 */

export const PANEL = { x: 700, y: 214, w: 484, h: 191 };
export const OBJETIVO = "Vender más seguido";

const N = 16;
const CLEAR = "rgba(0,0,0,0)";
const SOFT = "rgba(0,0,0,0.42)";
const FAINT = "rgba(0,0,0,0.13)";

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  /** border radius; only the act-2 dots are round, everything else is hard */
  r?: number;
};

/* ── act 2 geometry, shared by the cells and their labels ──────────────── */

export const CHECKS = ["precio", "respuesta", "envío", "reseñas"];
export const GRID = [
  { name: "Competidor A", has: [1, 1, 1, 0] },
  { name: "Competidor B", has: [1, 0, 1, 1] },
  { name: "Competidor C", has: [1, 1, 0, 1] },
  { name: "Tu sitio hoy", has: [0, 0, 1, 0], you: true },
];
export const NAME_W = 150;
export const CELL_W = 78;
export const ROW_Y = [30, 64, 98, 132];
export const ROW_H = 34;

export const dotAt = (row: number, col: number) => ({
  x: NAME_W + col * CELL_W + CELL_W / 2 - 6,
  y: ROW_Y[row] + ROW_H / 2 - 6,
});

// Which grid slot each cell flies to. Cell 2 is not a dot in act 2 — it is the
// block behind "Tu sitio hoy", so the row it belongs to is the row about you.
const SLOT: Record<number, number> = {
  0: 0,
  1: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  12: 11,
  13: 13,
  14: 14,
  15: 15,
};

/* ── act 3 geometry ───────────────────────────────────────────────────── */

export const SOURCES = [
  { name: "Ventas del último año", n: 1240 },
  { name: "Chats de WhatsApp", n: 3480 },
  { name: "Visitas al sitio", n: 9120 },
  { name: "Reseñas y comentarios", n: 86 },
];
export const BAR_Y = [14, 46, 78, 110];
const BAR_GROUP = [
  [0, 1, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15],
];

/* ── act 4 geometry ───────────────────────────────────────────────────── */

export const DECISIONS = [
  { n: "01", text: "Precios y stock a la vista", weight: 3 },
  { n: "02", text: "Respuesta automática fuera de hora", weight: 2 },
  { n: "03", text: "Recompra en dos clics", weight: 1 },
];
export const DEC_Y = [34, 88, 142];
export const DEC_H = 46;
const TILE_W = PANEL.w / 5;
const ROW1_CELLS = [0, 1, 3, 4, 5];
const ROW2_CELLS = [6, 7, 8, 9, 10];
const HEAD_CELLS = [11, 12, 13, 14, 15];

/* ── the formation table ──────────────────────────────────────────────── */

const formation1 = (i: number): Rect => {
  if (i === 0) return { x: 0, y: 36, w: 214, h: 2, fill: SOFT };
  if (i === 1) return { x: 236, y: 36, w: 214, h: 2, fill: SOFT };
  if (i === 2) return { x: 0, y: 70, w: 300, h: 32, fill: VERMILION };
  if (i === 3) return { x: 0, y: 142, w: 300, h: 2, fill: FAINT };
  if (i === 4) return { x: 0, y: 182, w: 300, h: 2, fill: FAINT };
  // the eleven that have not been called on yet: a quiet row of ticks, parked
  // where they cannot be mistaken for content
  const k = i - 5;
  return {
    x: 330 + (k % 6) * 14,
    y: 176 + Math.floor(k / 6) * 8,
    w: 6,
    h: 2,
    fill: FAINT,
  };
};

const formation2 = (i: number): Rect => {
  if (i === 2) return { x: 0, y: 134, w: NAME_W, h: 26, fill: VERMILION };
  const s = SLOT[i];
  const row = Math.floor(s / 4);
  const col = s % 4;
  const d = dotAt(row, col);
  const on = GRID[row].has[col] === 1;
  return {
    x: d.x,
    y: d.y,
    w: 12,
    h: 12,
    r: 8,
    fill: on ? (GRID[row].you ? VERMILION : BLUE) : CLEAR,
  };
};

const formation3 = (i: number): Rect => {
  if (i === 2) return { x: 0, y: 142, w: 196, h: 38, fill: VERMILION };
  for (let g = 0; g < BAR_GROUP.length; g++) {
    const k = BAR_GROUP[g].indexOf(i);
    if (k === -1) continue;
    const seg = PANEL.w * 0.91;
    const w = seg / BAR_GROUP[g].length;
    return { x: k * w, y: BAR_Y[g], w, h: 2, fill: AMBER };
  }
  return formation1(i);
};

const formation4 = (i: number): Rect => {
  if (i === 2)
    return { x: 0, y: DEC_Y[0], w: PANEL.w, h: DEC_H, fill: VERMILION };
  const r1 = ROW1_CELLS.indexOf(i);
  if (r1 !== -1)
    return {
      x: r1 * TILE_W,
      y: DEC_Y[1] + DEC_H - 2,
      w: TILE_W,
      h: 2,
      fill: FAINT,
    };
  const r2 = ROW2_CELLS.indexOf(i);
  if (r2 !== -1)
    return {
      x: r2 * TILE_W,
      y: DEC_Y[2] + DEC_H - 2,
      w: TILE_W,
      h: 2,
      fill: FAINT,
    };
  const h = HEAD_CELLS.indexOf(i);
  return { x: 300 + h * 20, y: 10, w: 12, h: 2, fill: FAINT };
};

const RECTS: Rect[][] = Array.from({ length: N }, (_, i) => [
  formation1(i),
  formation2(i),
  formation3(i),
  formation4(i),
]);

/* ── the interpolator ─────────────────────────────────────────────────── */

const FLOCK = Easing.bezier(0.32, 0.9, 0.24, 1);
const LEAD = 24; // cells start moving this many frames before the act flips

export const Cells = ({ frame }: { frame: number }) => {
  let a = 0;
  for (let i = 0; i < ACTS.length; i++) if (frame >= ACTS[i].start) a = i;
  const last = a === ACTS.length - 1;
  const end = ACTS[a].end;

  return (
    <>
      {RECTS.map((rects, i) => {
        // stagger reads as a flock rather than four slides moving in lockstep
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
        const radius = (from.r ?? 0) + ((to.r ?? 0) - (from.r ?? 0)) * p;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PANEL.x + m("x"),
              top: PANEL.y + m("y"),
              width: m("w"),
              height: m("h"),
              borderRadius: radius,
              background: interpolateColors(p, [0, 1], [from.fill, to.fill]),
            }}
          />
        );
      })}
    </>
  );
};

/* ── the label layer ──────────────────────────────────────────────────────
   Labels are the only thing that cross-fades. The cells underneath never do. */

const caption: CSSProperties = {
  position: "absolute",
  fontSize: 12.5,
  fontWeight: 700,
  color: INK_SOFT,
  letterSpacing: "0.14em",
  whiteSpace: "nowrap",
};

const body: CSSProperties = {
  position: "absolute",
  fontSize: 15,
  fontWeight: 600,
  color: INK,
  letterSpacing: "-0.01em",
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
  last: boolean;
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

const FACTS = [
  { k: "RUBRO", v: "Indumentaria" },
  { k: "LE VENDE A", v: "Mujeres de 25 a 40" },
];
const GOALS = [
  "Vender más seguido",
  "Abrir un segundo local",
  "Vender más caro",
];

export const NegocioLabels = (p: { t: number; len: number }) => (
  <Layer {...p} last={false}>
    {FACTS.map((f, i) => (
      <div key={f.k}>
        <span style={{ ...caption, left: i * 236, top: 0 }}>{f.k}</span>
        <span style={{ ...body, left: i * 236, top: 16 }}>{f.v}</span>
      </div>
    ))}
    <span style={{ ...caption, left: 0, top: 50 }}>QUÉ QUIERE LOGRAR</span>
    {GOALS.map((g, i) => {
      const picked = g === OBJETIVO;
      return (
        <span
          key={g}
          style={{
            position: "absolute",
            left: 14,
            top: [70, 110, 150][i] + 8,
            fontSize: 15,
            fontWeight: picked ? 700 : 600,
            letterSpacing: "-0.01em",
            color: picked ? "#fff" : INK_SOFT,
          }}
        >
          {g}
        </span>
      );
    })}
  </Layer>
);

export const CompetenciaLabels = (p: { t: number; len: number }) => (
  <Layer {...p} last={false}>
    {CHECKS.map((c, i) => (
      <span
        key={c}
        style={{
          ...caption,
          left: NAME_W + i * CELL_W,
          top: 4,
          width: CELL_W,
          textAlign: "center",
          letterSpacing: "0.06em",
        }}
      >
        {c}
      </span>
    ))}
    {GRID.map((row, ri) => (
      <div key={row.name}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: ROW_Y[ri],
            width: NAME_W + CHECKS.length * CELL_W,
            height: 1,
            background: HAIRLINE,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: row.you ? 10 : 0,
            top: ROW_Y[ri] + 9,
            fontSize: 15,
            fontWeight: row.you ? 700 : 600,
            letterSpacing: "-0.01em",
            color: row.you ? "#fff" : INK_SOFT,
          }}
        >
          {row.name}
        </span>
        {row.has.map((h, ci) =>
          h ? null : (
            <div
              key={ci}
              style={{
                position: "absolute",
                left: dotAt(ri, ci).x,
                top: dotAt(ri, ci).y,
                width: 12,
                height: 12,
                borderRadius: 8,
                border: `2px solid ${HAIRLINE}`,
                boxSizing: "border-box",
              }}
            />
          ),
        )}
      </div>
    ))}
  </Layer>
);

export const DatosLabels = ({ t, len }: { t: number; len: number }) => (
  <Layer t={t} len={len} last={false}>
    {SOURCES.map((s, i) => {
      const start = 8 + i * 8;
      const counting = t < start + 40;
      return (
        <div key={s.name}>
          <span
            style={{ ...body, left: 0, top: BAR_Y[i] - 20, color: INK_SOFT }}
          >
            {s.name}
          </span>
          <Counter
            t={t}
            from={0}
            to={s.n}
            start={start}
            duration={40}
            grouped
            style={{
              position: "absolute",
              right: PANEL.w * 0.09,
              top: BAR_Y[i] - 21,
              fontSize: 18,
              fontWeight: 700,
              color: counting ? AMBER : INK,
              letterSpacing: "-0.02em",
            }}
          />
        </div>
      );
    })}
    <Counter
      t={t}
      from={0}
      to={13926}
      start={40}
      duration={26}
      grouped
      style={{
        position: "absolute",
        left: 14,
        top: 149,
        fontSize: 26,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.04em",
      }}
    />
    <span style={{ ...caption, left: 210, top: 160, letterSpacing: "0.08em" }}>
      SEÑALES DE UN MISMO NEGOCIO
    </span>
  </Layer>
);

const Meter = ({
  level,
  lead,
  t,
  start,
}: {
  level: number;
  lead: boolean;
  t: number;
  start: number;
}) => (
  <div
    style={{
      position: "absolute",
      right: 18,
      top: 15,
      display: "flex",
      gap: 3,
      alignItems: "flex-end",
      height: 16,
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 5,
          height: 6 + i * 5,
          background:
            i < level
              ? lead
                ? "#fff"
                : INK_SOFT
              : lead
                ? "rgba(255,255,255,.32)"
                : HAIRLINE,
          opacity: ease(t, [start + 10 + i * 4, start + 20 + i * 4], [0, 1]),
        }}
      />
    ))}
  </div>
);

export const WebLabels = ({ t, len }: { t: number; len: number }) => (
  <Layer t={t} len={len} last>
    <span style={{ ...caption, left: 0, top: 6, color: AMBER }}>OBJETIVO</span>
    <span style={{ ...body, left: 78, top: 5, fontWeight: 700 }}>
      {OBJETIVO}
    </span>
    {DECISIONS.map((d, i) => {
      const lead = i === 0;
      const start = 10 + i * 12;
      return (
        <div
          key={d.n}
          style={{
            position: "absolute",
            left: 0,
            top: DEC_Y[i],
            width: PANEL.w,
            height: DEC_H,
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
            {d.n}
          </span>
          <span
            style={{
              position: "absolute",
              left: 62,
              top: 14,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: lead ? "#fff" : INK,
            }}
          >
            {d.text}
          </span>
          <Meter level={d.weight} lead={lead} t={t} start={start} />
        </div>
      );
    })}
  </Layer>
);
