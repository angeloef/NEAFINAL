import type { CSSProperties } from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import { ease } from "../analizar/kinetic";
import {
  ACTS,
  AMBER,
  BLUE,
  HAIRLINE,
  INK,
  INK_SOFT,
  VERMILION,
} from "../analizar/theme";

/**
 * Card 02 · Diseñar. Same machine as card 01: sixteen cells alive from the
 * first frame to the last, four formations, no cross-fade between them.
 *
 * Cell 2 is vermilion throughout and continues the thread *across cards*. Card
 * 01 ended on decision 01, "Precios y stock a la vista". Here that same mark is:
 *   the first front (act 1) -> stage 01 of the plan (act 2)
 *   -> the block that gets drawn (act 3) -> the block you click (act 4)
 *
 * The cells earn their keep more here than in card 01: in act 3 they become the
 * wireframe itself, which is exactly the shape a grid of rectangles wants to be.
 */

export const PANEL = { x: 700, y: 214, w: 484, h: 191 };
export const OBJETIVO = "Vender más seguido";
export const FRENTE_01 = "Precios y stock a la vista";

const N = 16;
const SOFT = "rgba(0,0,0,0.42)";
const FAINT = "rgba(0,0,0,0.13)";
const DRAFT = "rgba(36,110,185,0.22)"; // blue at wireframe weight

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  r?: number;
};

/* ── act 1 · la propuesta ─────────────────────────────────────────────────
   The objective inherited from card 01, and three fronts under it. One is
   already filled: it is the decision card 01 arrived at.                  */

export const FRENTES = [
  FRENTE_01,
  "Respuesta fuera de hora",
  "Recompra en dos clics",
];
const FRENTE_Y = [70, 110, 150];

/* ── act 2 · el plan ──────────────────────────────────────────────────────
   The three fronts stretch into a sequence, each with what it unlocks.    */

export const ETAPAS = [
  { n: "01", deja: "Catálogo navegable" },
  { n: "02", deja: "Contacto que responde" },
  { n: "03", deja: "Cuenta y recompra" },
];
export const ETAPA_X = [0, 168, 336];
export const ETAPA_W = 148;
export const ETAPA_Y = 62;

/* ── act 3 · el wireframe ─────────────────────────────────────────────────
   The sixteen cells lay out a screen: header, hero, a grid of products, CTA.
   Cell 2 is the product grid — the block that carries "precios y stock".  */

const WIRE: Record<number, [number, number, number, number]> = {
  0: [0, 8, 120, 14], // logo
  1: [300, 8, 184, 10], // nav
  3: [0, 34, 300, 40], // hero copy
  4: [0, 82, 132, 18], // hero cta
  5: [332, 34, 152, 66], // hero image
  // 2 = the product grid, set below
  6: [0, 162, 100, 6],
  7: [112, 162, 100, 6],
  8: [224, 162, 100, 6],
  9: [336, 162, 148, 6],
  10: [0, 112, 74, 44],
  11: [82, 112, 74, 44],
  12: [164, 112, 74, 44],
  13: [246, 112, 74, 44],
  14: [328, 112, 74, 44],
  15: [410, 112, 74, 44],
};

/* ── act 4 · el prototipo ─────────────────────────────────────────────────
   The same screen, with the grid block lit: it stopped being a draft.     */

const formation1 = (i: number): Rect => {
  if (i === 0) return { x: 0, y: 36, w: 300, h: 2, fill: SOFT };
  if (i === 1) return { x: 330, y: 36, w: 154, h: 2, fill: SOFT };
  if (i === 2) return { x: 0, y: FRENTE_Y[0], w: 340, h: 32, fill: VERMILION };
  if (i === 3) return { x: 0, y: FRENTE_Y[1] + 32, w: 340, h: 2, fill: FAINT };
  if (i === 4) return { x: 0, y: FRENTE_Y[2] + 32, w: 340, h: 2, fill: FAINT };
  const k = i - 5;
  return {
    x: 380 + (k % 6) * 14,
    y: 176 + Math.floor(k / 6) * 8,
    w: 6,
    h: 2,
    fill: FAINT,
  };
};

const formation2 = (i: number): Rect => {
  if (i === 2)
    return { x: ETAPA_X[0], y: ETAPA_Y, w: ETAPA_W, h: 66, fill: VERMILION };
  if (i === 3)
    return { x: ETAPA_X[1], y: ETAPA_Y + 64, w: ETAPA_W, h: 2, fill: FAINT };
  if (i === 4)
    return { x: ETAPA_X[2], y: ETAPA_Y + 64, w: ETAPA_W, h: 2, fill: FAINT };
  // the connectors between stages, and a rule the whole sequence sits on
  if (i === 0) return { x: 148, y: ETAPA_Y + 26, w: 20, h: 2, fill: AMBER };
  if (i === 1) return { x: 316, y: ETAPA_Y + 26, w: 20, h: 2, fill: AMBER };
  const k = i - 5;
  return {
    x: k * 44,
    y: 150,
    w: 30,
    h: 2,
    fill: k < 3 ? AMBER : FAINT,
  };
};

const formation3 = (i: number): Rect => {
  // cell 2 is the band; 10-15 are the product tiles sitting inside it
  if (i === 2)
    return { x: 0, y: 112, w: 484, h: 44, fill: "rgba(36,110,185,0.09)" };
  const w = WIRE[i];
  return { x: w[0], y: w[1], w: w[2], h: w[3], fill: DRAFT };
};

const formation4 = (i: number): Rect => {
  if (i === 2) return { x: 0, y: 112, w: 484, h: 44, fill: VERMILION };
  const w = WIRE[i];
  // the tiles are inside the lit band now, so they read as white on red
  const inBand = i >= 10;
  return {
    x: w[0],
    y: w[1],
    w: w[2],
    h: w[3],
    fill: inBand ? "rgba(255,255,255,0.22)" : FAINT,
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
              background: interpolateColors(p, [0, 1], [from.fill, to.fill]),
            }}
          />
        );
      })}
    </>
  );
};

/* ── the label layer ──────────────────────────────────────────────────── */

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

/** Act 1 — the proposal, hung off the objective card 01 landed on. */
export const PropuestaLabels = (p: { t: number; len: number }) => (
  <Layer {...p}>
    <span style={{ ...caption, left: 0, top: 0, color: AMBER }}>
      OBJETIVO ACORDADO
    </span>
    <span style={{ ...body, left: 0, top: 16, fontWeight: 700 }}>
      {OBJETIVO}
    </span>
    <span style={{ ...caption, left: 0, top: 50 }}>POR DÓNDE EMPEZAMOS</span>
    {FRENTES.map((f, i) => (
      <span
        key={f}
        style={{
          position: "absolute",
          left: 14,
          top: FRENTE_Y[i] + 8,
          fontSize: 15,
          fontWeight: i === 0 ? 700 : 600,
          letterSpacing: "-0.01em",
          color: i === 0 ? "#fff" : INK_SOFT,
        }}
      >
        {f}
      </span>
    ))}
  </Layer>
);

/** Act 2 — the plan: each stage with what it leaves working. */
export const PlanLabels = (p: { t: number; len: number }) => (
  <Layer {...p}>
    <span style={{ ...caption, left: 0, top: 8 }}>EN QUÉ ORDEN</span>
    {ETAPAS.map((e, i) => (
      <div key={e.n}>
        <span
          style={{
            position: "absolute",
            left: ETAPA_X[i] + 12,
            top: ETAPA_Y + 8,
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: i === 0 ? "#fff" : INK_SOFT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {e.n}
        </span>
        <span
          style={{
            position: "absolute",
            left: ETAPA_X[i] + 12,
            top: ETAPA_Y + 32,
            width: ETAPA_W - 20,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: i === 0 ? "#fff" : INK,
          }}
        >
          {e.deja}
        </span>
      </div>
    ))}
    <span style={{ ...caption, left: 0, top: 160, letterSpacing: "0.08em" }}>
      CADA UNA DEJA ALGO FUNCIONANDO
    </span>
  </Layer>
);

/** Act 3 — the wireframe, annotated the way a draft is annotated. */
export const WireframeLabels = (p: { t: number; len: number }) => (
  <Layer {...p}>
    {/* below the wireframe, where it cannot sit on top of a block */}
    <span style={{ ...caption, left: 0, top: 178, color: BLUE, fontSize: 11 }}>
      BORRADOR — LA ESTRUCTURA, TODAVÍA SIN PIEL
    </span>
    <span
      style={{
        position: "absolute",
        left: 4,
        top: 126,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: BLUE,
      }}
    >
      {FRENTE_01}
    </span>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 112,
        width: 484,
        height: 44,
        border: `1.5px dashed ${BLUE}`,
        boxSizing: "border-box",
        opacity: 0.55,
      }}
    />
  </Layer>
);

/** Act 4 — the same screen, now yours: the draft block goes vermilion. */
export const PrototipoLabels = ({ t, len }: { t: number; len: number }) => (
  <Layer t={t} len={len} last>
    <span
      style={{
        position: "absolute",
        left: 14,
        top: 126,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "#fff",
      }}
    >
      {FRENTE_01}
    </span>
    <span style={{ ...caption, left: 0, top: 176, color: INK_SOFT }}>
      PRIMERA VERSIÓN NAVEGABLE
    </span>
    {/* the pointer that makes it a prototype and not a picture */}
    <svg
      width="17"
      height="23"
      viewBox="0 0 15 20"
      style={{
        position: "absolute",
        left: 300,
        top: 132,
        opacity: ease(t, [26, 38], [0, 1]),
        transform: `translate(${ease(t, [26, 46], [16, 0])}px, ${ease(t, [26, 46], [14, 0])}px)`,
      }}
    >
      <path
        d="M1 1 L1 15 L4.6 11.6 L7 17.6 L9.6 16.4 L7.2 10.8 L12 10.6 Z"
        fill="#fff"
        stroke={INK}
        strokeWidth={0.8}
      />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 112,
        width: 484,
        height: 44,
        border: `1.5px solid ${HAIRLINE}`,
        boxSizing: "border-box",
      }}
    />
  </Layer>
);
