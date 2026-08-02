import { Counter, ease } from "./kinetic";
import { AMBER, BLUE, HAIRLINE, INK, INK_SOFT, VERMILION } from "./theme";

const label: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: INK_SOFT,
  letterSpacing: "-0.01em",
};

/* ── MEDIR ────────────────────────────────────────────────────────────────
   Where the sales actually come from. Bars grow from a shared baseline with
   a per-row delay, and the figure counts with the bar so the eye can follow
   one object instead of two.                                              */

const CHANNELS = [
  { name: "Referidos", value: 38, color: INK },
  { name: "Instagram", value: 27, color: BLUE },
  { name: "WhatsApp", value: 21, color: AMBER },
  { name: "Google", value: 14, color: INK_SOFT },
];
const BAR_MAX = 40;

export const MedirPanel = ({ t, w }: { t: number; w: number }) => (
  <div style={{ width: w, display: "flex", flexDirection: "column", gap: 16 }}>
    {CHANNELS.map((c, i) => {
      const start = 8 + i * 7;
      const grow = ease(t, [start, start + 40], [0, c.value / BAR_MAX]);
      return (
        <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...label, opacity: ease(t, [start, start + 12], [0, 1]) }}>
              {c.name}
            </span>
            <Counter
              t={t}
              from={0}
              to={c.value}
              start={start}
              duration={40}
              suffix="%"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: INK,
                letterSpacing: "-0.03em",
                opacity: ease(t, [start, start + 12], [0, 1]),
              }}
            />
          </div>
          <div style={{ height: 6, background: HAIRLINE, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${grow * 100}%`,
                background: c.color,
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

/* ── ENTENDER ─────────────────────────────────────────────────────────────
   The repeating pattern. The line draws left to right, then one point is
   promoted with a leader line and a plain-language annotation.            */

const SERIES = [34, 41, 88, 46, 39, 72, 30];
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const PEAK = 2;
const CH_W = 290;
const CH_H = 132;
const CALLOUT_X = CH_W + 54;

export const EntenderPanel = ({ t }: { t: number }) => {
  const max = 100;
  const pts = SERIES.map((v, i) => ({
    x: (i / (SERIES.length - 1)) * CH_W,
    y: CH_H - (v / max) * CH_H,
  }));
  const draw = ease(t, [6, 48], [0, 1]);
  const peak = pts[PEAK];
  const markIn = ease(t, [44, 62], [0, 1]);
  const leader = ease(t, [52, 74], [0, 1]);

  return (
    <div style={{ position: "relative", width: CH_W + 230, height: CH_H + 60 }}>
      <svg width={CH_W + 230} height={CH_H + 40} style={{ overflow: "visible" }}>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={CH_W}
            y1={CH_H * f}
            y2={CH_H * f}
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
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === PEAK ? 5.5 : 3}
            fill={i === PEAK ? VERMILION : "#fff"}
            stroke={i === PEAK ? VERMILION : INK}
            strokeWidth={2}
            opacity={ease(t, [10 + i * 6, 22 + i * 6], [0, 1])}
          />
        ))}
        {pts.map((p, i) => (
          <text
            key={`d${i}`}
            x={p.x}
            y={CH_H + 26}
            textAnchor="middle"
            fontSize={13}
            fontWeight={600}
            fill={i === PEAK ? VERMILION : INK_SOFT}
            opacity={ease(t, [12 + i * 5, 24 + i * 5], [0, 1])}
          >
            {DAYS[i]}
          </text>
        ))}
        {/* leader runs right from the peak, above every other point */}
        <path
          d={`M ${peak.x + 10} ${peak.y} L ${peak.x + 10 + (CALLOUT_X - peak.x - 18) * leader} ${peak.y}`}
          fill="none"
          stroke={VERMILION}
          strokeWidth={1.5}
          opacity={leader}
        />
        <circle
          cx={peak.x}
          cy={peak.y}
          r={6 + 16 * markIn}
          fill="none"
          stroke={VERMILION}
          strokeWidth={1.5}
          opacity={1 - markIn}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: CALLOUT_X,
          top: peak.y - 14,
          width: 176,
          opacity: ease(t, [68, 84], [0, 1]),
          translate: `${ease(t, [68, 84], [-10, 0])}px 0`,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, color: VERMILION, letterSpacing: "-0.04em", lineHeight: 1 }}>
          <Counter t={t} from={0} to={34} start={68} duration={32} suffix="%" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: INK_SOFT, lineHeight: 1.34, marginTop: 6 }}>
          de las consultas caen siempre el mismo día
        </div>
      </div>
    </div>
  );
};

/* ── PRIORIZAR ────────────────────────────────────────────────────────────
   The output of the whole step: an ordered list. Rank 01 is the only thing
   with a fill, because the point of the step is that one thing goes first. */

const FINDINGS = [
  { n: "01", text: "Responder más rápido la primera consulta", tag: "impacto alto" },
  { n: "02", text: "Mostrar precios sin que tengan que preguntar", tag: "impacto medio" },
  { n: "03", text: "Recuperar al cliente que ya compró", tag: "a mediano plazo" },
];

export const PriorizarPanel = ({ t, w }: { t: number; w: number }) => (
  <div style={{ width: w, display: "flex", flexDirection: "column", gap: 9 }}>
    {FINDINGS.map((f, i) => {
      const start = 6 + i * 12;
      const o = ease(t, [start, start + 18], [0, 1]);
      const x = ease(t, [start, start + 26], [26, 0]);
      const lead = i === 0;
      const pulse = lead ? 1 + 0.012 * Math.sin(((t - start) / 30) * Math.PI * 2) : 1;
      return (
        <div
          key={f.n}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "10px 18px",
            background: lead ? VERMILION : "transparent",
            border: `1.5px solid ${lead ? VERMILION : HAIRLINE}`,
            opacity: o,
            translate: `${x}px 0`,
            scale: pulse,
          }}
        >
          <span
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: lead ? "#fff" : INK_SOFT,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {f.n}
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: lead ? "#fff" : INK,
                lineHeight: 1.25,
              }}
            >
              {f.text}
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                marginTop: 1,
                color: lead ? "rgba(255,255,255,0.78)" : INK_SOFT,
              }}
            >
              {f.tag}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
