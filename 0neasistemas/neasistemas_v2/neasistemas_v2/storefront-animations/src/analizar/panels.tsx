import { Counter, ease } from "./kinetic";
import { AMBER, HAIRLINE, INK, INK_SOFT, VERMILION } from "./theme";

// Every figure here is illustrative: this is a product mock, not a client
// report, so nothing is framed as something our clients actually did.

const caption: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: INK_SOFT,
  letterSpacing: "0.02em",
};

/* ── SÍNTOMA ──────────────────────────────────────────────────────────────
   Same work every month, wildly different result. One flat dashed line over
   a ragged bar chart says it faster than any sentence could.              */

const MONTHS = ["E", "F", "M", "A", "M", "J", "J", "A"];
const SALES = [52, 88, 41, 63, 35, 79, 44, 58];
const S_W = 32;
const S_GAP = 26;
const S_H = 104;
const EFFORT = 62; // the flat line: effort never changes

export const SintomaPanel = ({ t }: { t: number }) => {
  const lineIn = ease(t, [26, 56], [0, 1]);
  return (
    <div style={{ position: "relative", width: (S_W + S_GAP) * MONTHS.length }}>
      <div
        style={{
          position: "relative",
          height: S_H,
          display: "flex",
          gap: S_GAP,
          alignItems: "flex-end",
        }}
      >
        {SALES.map((v, i) => {
          const h = ease(t, [4 + i * 4, 34 + i * 4], [0, (v / 100) * S_H]);
          return (
            <div key={i} style={{ width: S_W, height: h, background: INK }} />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: (EFFORT / 100) * S_H,
            width: `${lineIn * 100}%`,
            borderTop: `2px dashed ${VERMILION}`,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: S_GAP, marginTop: 8 }}>
        {MONTHS.map((m, i) => (
          <div
            key={i}
            style={{
              ...caption,
              width: S_W,
              textAlign: "center",
              opacity: ease(t, [8 + i * 4, 20 + i * 4], [0, 1]),
            }}
          >
            {m}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
          marginTop: 16,
          opacity: ease(t, [50, 66], [0, 1]),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 7, background: INK }} />
          <span style={caption}>lo que vendiste</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, borderTop: `2px dashed ${VERMILION}` }} />
          <span style={{ ...caption, color: VERMILION }}>
            el trabajo que pusiste
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── EVIDENCIA ────────────────────────────────────────────────────────────
   What you push vs what actually sells, on a shared scale so the inversion
   is impossible to miss. The row that contradicts you gets the accent.    */

const ITEMS = [
  { name: "El combo que armaste", push: 0.88, sells: 0.31 },
  { name: "La promo del mes", push: 0.72, sells: 0.24 },
  { name: "Retirar en el local", push: 0.14, sells: 0.91, star: true },
];

const Bar = ({
  p,
  color,
  delay,
  t,
}: {
  p: number;
  color: string;
  delay: number;
  t: number;
}) => (
  <div style={{ height: 7, background: HAIRLINE, position: "relative" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: `${ease(t, [delay, delay + 34], [0, p]) * 100}%`,
        background: color,
      }}
    />
  </div>
);

export const EvidenciaPanel = ({ t, w }: { t: number; w: number }) => (
  <div style={{ width: w }}>
    <div
      style={{
        display: "flex",
        gap: 22,
        marginBottom: 15,
        opacity: ease(t, [2, 16], [0, 1]),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 16, height: 7, background: AMBER }} />
        <span style={caption}>lo que promocionás</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 16, height: 7, background: INK }} />
        <span style={caption}>lo que te compran</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      {ITEMS.map((it, i) => {
        const d = 10 + i * 8;
        return (
          <div
            key={it.name}
            style={{ display: "flex", flexDirection: "column", gap: 5 }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: it.star ? 700 : 600,
                color: it.star ? VERMILION : INK_SOFT,
                letterSpacing: "-0.01em",
                opacity: ease(t, [d, d + 12], [0, 1]),
              }}
            >
              {it.name}
            </div>
            <Bar t={t} p={it.push} color={AMBER} delay={d} />
            <Bar
              t={t}
              p={it.sells}
              color={it.star ? VERMILION : INK}
              delay={d + 6}
            />
          </div>
        );
      })}
    </div>
  </div>
);

/* ── CAUSA ────────────────────────────────────────────────────────────────
   The gap between when the question arrives and when it gets answered. The
   bracket is the whole point of the panel.                                */

const WEEK = [30, 92, 54, 44, 61, 36, 22];
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const IN_DAY = 1; // martes: the consultas land
const OUT_DAY = 3; // jueves: when they get answered
const C_W = 344;
const C_H = 106;

export const CausaPanel = ({ t }: { t: number }) => {
  const pts = WEEK.map((v, i) => ({
    x: (i / (WEEK.length - 1)) * C_W,
    y: C_H - (v / 100) * C_H,
  }));
  const draw = ease(t, [4, 44], [0, 1]);
  const a = pts[IN_DAY];
  const b = pts[OUT_DAY];
  const br = ease(t, [34, 56], [0, 1]);
  const top = -30;

  return (
    <div style={{ position: "relative", width: C_W + 140, paddingTop: 40 }}>
      <svg width={C_W + 140} height={C_H + 32} style={{ overflow: "visible" }}>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={C_W}
            y1={C_H * f}
            y2={C_H * f}
            stroke={HAIRLINE}
            strokeWidth={1}
          />
        ))}
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={INK}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        {pts.map((p, i) => {
          const key = i === IN_DAY || i === OUT_DAY;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={key ? 5.5 : 3}
              fill={i === IN_DAY ? VERMILION : "#fff"}
              stroke={key ? VERMILION : INK}
              strokeWidth={2}
              opacity={ease(t, [8 + i * 5, 20 + i * 5], [0, 1])}
            />
          );
        })}
        {pts.map((p, i) => (
          <text
            key={`d${i}`}
            x={p.x}
            y={C_H + 25}
            textAnchor="middle"
            fontSize={13}
            fontWeight={i === IN_DAY || i === OUT_DAY ? 700 : 600}
            fill={i === IN_DAY || i === OUT_DAY ? VERMILION : INK_SOFT}
            opacity={ease(t, [10 + i * 5, 22 + i * 5], [0, 1])}
          >
            {DAYS[i]}
          </text>
        ))}
        {/* the wait itself, drawn as a bracket spanning the two days */}
        <path
          d={`M ${a.x} ${a.y - 14} L ${a.x} ${top} L ${a.x + (b.x - a.x) * br} ${top}`}
          fill="none"
          stroke={VERMILION}
          strokeWidth={1.5}
          opacity={br}
        />
        <path
          d={`M ${b.x} ${top} L ${b.x} ${b.y - 14}`}
          fill="none"
          stroke={VERMILION}
          strokeWidth={1.5}
          opacity={ease(t, [56, 66], [0, 1])}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: b.x + 40,
          top: 6,
          width: 150,
          opacity: ease(t, [60, 76], [0, 1]),
          translate: `${ease(t, [60, 76], [-8, 0])}px 0`,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: VERMILION,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          <Counter t={t} from={0} to={48} start={60} duration={28} suffix=" h" />
        </div>
        <div style={{ ...caption, marginTop: 5, lineHeight: 1.35 }}>
          esperando una respuesta
        </div>
      </div>
    </div>
  );
};

/* ── DECISIÓN ─────────────────────────────────────────────────────────────
   One ordered list. Only the first item is filled, because the output of a
   diagnosis is knowing what goes first, not a list of everything.         */

const FINDINGS = [
  { n: "01", text: "Contestar el martes, no el jueves", cost: 3 },
  { n: "02", text: "Poner adelante lo que ya se vende solo", cost: 2 },
  { n: "03", text: "Volver a los que ya te compraron", cost: 1 },
];

const CostMeter = ({
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
  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 16 }}>
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

export const DecisionPanel = ({ t, w }: { t: number; w: number }) => (
  <div style={{ width: w, display: "flex", flexDirection: "column", gap: 9 }}>
    <div style={{ ...caption, opacity: ease(t, [2, 16], [0, 1]) }}>
      ordenado por lo que te está costando hoy
    </div>
    {FINDINGS.map((f, i) => {
      const start = 8 + i * 12;
      const lead = i === 0;
      const pulse = lead
        ? 1 + 0.012 * Math.sin(((t - start) / 30) * Math.PI * 2)
        : 1;
      return (
        <div
          key={f.n}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "11px 18px",
            background: lead ? VERMILION : "transparent",
            border: `1.5px solid ${lead ? VERMILION : HAIRLINE}`,
            opacity: ease(t, [start, start + 18], [0, 1]),
            translate: `${ease(t, [start, start + 26], [26, 0])}px 0`,
            scale: pulse,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: lead ? "#fff" : INK_SOFT,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {f.n}
          </span>
          <div
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: lead ? "#fff" : INK,
              lineHeight: 1.25,
            }}
          >
            {f.text}
          </div>
          <CostMeter level={f.cost} lead={lead} t={t} start={start} />
        </div>
      );
    })}
  </div>
);
