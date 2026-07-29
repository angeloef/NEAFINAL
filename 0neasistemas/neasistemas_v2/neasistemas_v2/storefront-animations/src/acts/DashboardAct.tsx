import { FadeIn } from "../FadeIn";
import {
  ACCENT,
  ACCENT_DEEP,
  APPS,
  BORDER,
  BUSINESS,
  MUTED,
  TEXT_PRIMARY,
} from "../colors";
import { clampInterp } from "../timing";

const BARS = [40, 55, 50, 70, 88];
const BAR_MAX = 100;
const CHART_H = 110;
const BAR_W = 28;
const BAR_GAP = 20;
const CHART_W = BARS.length * BAR_W + (BARS.length - 1) * BAR_GAP;

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SEGMENTS = [
  { label: "Nuevos", fraction: 0.35, color: ACCENT },
  { label: "Recurrentes", fraction: 0.45, color: BUSINESS },
  { label: "VIP", fraction: 0.2, color: APPS },
];

const UpArrow = () => (
  <svg width={10} height={10} viewBox="0 0 10 10">
    <path
      d="M5 9V1M1.5 4.5L5 1l3.5 3.5"
      fill="none"
      stroke={ACCENT_DEEP}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Kpi = ({
  t,
  from,
  label,
  value,
  delta,
}: {
  t: number;
  from: number;
  label: string;
  value: string;
  delta: string;
}) => (
  <FadeIn t={t} from={from} duration={10} style={{ flex: 1 }}>
    <div
      style={{
        background: "#ffffff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: "0 2px 8px rgba(20,30,60,0.05)",
      }}
    >
      <div
        style={{
          color: TEXT_PRIMARY,
          fontSize: 24,
          fontWeight: 500,
          fontFamily: "sans-serif",
        }}
      >
        {value}
      </div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}
      >
        <UpArrow />
        <div
          style={{
            color: ACCENT_DEEP,
            fontSize: 12,
            fontFamily: "sans-serif",
            fontWeight: 500,
          }}
        >
          {delta}
        </div>
        <div style={{ color: MUTED, fontSize: 12, fontFamily: "sans-serif" }}>
          {label}
        </div>
      </div>
    </div>
  </FadeIn>
);

export const DashboardAct = ({ t }: { t: number }) => {
  const recurrencia = Math.round(clampInterp(t, [10, 45], [0, 32]));
  const ticket = clampInterp(t, [10, 45], [0, 1.2]);
  const leads = Math.round(clampInterp(t, [10, 45], [0, 128]));

  const trendReveal = clampInterp(t, [40, 58], [0, 1]);
  const trendPoints = BARS.map((h, i) => ({
    x: i * (BAR_W + BAR_GAP) + BAR_W / 2,
    y: CHART_H - (h / BAR_MAX) * CHART_H,
  }));

  let cumulative = 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <FadeIn t={t} from={0} duration={10} translateY={0}>
        <div
          style={{
            color: TEXT_PRIMARY,
            fontSize: 21,
            fontWeight: 500,
            fontFamily: "sans-serif",
          }}
        >
          Análisis completo
        </div>
      </FadeIn>

      <div style={{ display: "flex", gap: 12 }}>
        <Kpi
          t={t}
          from={14}
          label="recurrencia"
          value={`+${recurrencia}%`}
          delta="vs. mes anterior"
        />
        <Kpi
          t={t}
          from={20}
          label="ticket total"
          value={`$${ticket.toFixed(1)}M`}
          delta="acumulado"
        />
        <Kpi
          t={t}
          from={26}
          label="leads analizados"
          value={`${leads}`}
          delta="este período"
        />
      </div>

      <div style={{ display: "flex", gap: 44, alignItems: "center", flex: 1 }}>
        <div
          style={{ position: "relative", width: CHART_W, height: CHART_H + 24 }}
        >
          {[0, 0.5, 1].map((f) => (
            <div
              key={f}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: CHART_H * (1 - f),
                borderTop: `1px dashed ${BORDER}`,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              gap: BAR_GAP,
              alignItems: "flex-end",
            }}
          >
            {BARS.map((h, i) => {
              const grown = clampInterp(t, [12 + i * 6, 32 + i * 6], [0, h]);
              const px = (grown / BAR_MAX) * CHART_H;
              return (
                <div
                  key={i}
                  style={{
                    width: BAR_W,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "sans-serif",
                      color: MUTED,
                      opacity: clampInterp(t, [28 + i * 6, 36 + i * 6], [0, 1]),
                      marginBottom: 4,
                    }}
                  >
                    {Math.round(grown)}
                  </div>
                  <div
                    style={{
                      width: BAR_W,
                      height: px,
                      background: ACCENT,
                      borderRadius: "5px 5px 0 0",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              clipPath: `inset(0 ${(1 - trendReveal) * 100}% 0 0)`,
            }}
          >
            <svg
              width={CHART_W}
              height={CHART_H}
              style={{ overflow: "visible" }}
            >
              <polyline
                points={trendPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={ACCENT_DEEP}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trendPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3.5}
                  fill="#ffffff"
                  stroke={ACCENT_DEEP}
                  strokeWidth={2}
                />
              ))}
            </svg>
          </div>
        </div>

        <FadeIn
          t={t}
          from={20}
          duration={10}
          translateY={0}
          style={{ display: "flex", alignItems: "center", gap: 24 }}
        >
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
              {SEGMENTS.map((seg, i) => {
                const offset = -cumulative;
                cumulative += seg.fraction * CIRCUMFERENCE;
                const revealLen = clampInterp(
                  t,
                  [22 + i * 8, 50 + i * 8],
                  [0, seg.fraction * CIRCUMFERENCE],
                );
                return (
                  <circle
                    key={i}
                    cx={60}
                    cy={60}
                    r={RADIUS}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={15}
                    strokeDasharray={`${revealLen} ${CIRCUMFERENCE - revealLen}`}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                  />
                );
              })}
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 20,
                  fontWeight: 500,
                  fontFamily: "sans-serif",
                }}
              >
                {leads}
              </div>
              <div
                style={{ color: MUTED, fontSize: 10, fontFamily: "sans-serif" }}
              >
                clientes
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SEGMENTS.map((seg) => (
              <div
                key={seg.label}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: seg.color,
                  }}
                />
                <div
                  style={{
                    color: MUTED,
                    fontSize: 13,
                    fontFamily: "sans-serif",
                  }}
                >
                  {seg.label}
                </div>
                <div
                  style={{
                    color: TEXT_PRIMARY,
                    fontSize: 13,
                    fontFamily: "sans-serif",
                    fontWeight: 500,
                    marginLeft: "auto",
                  }}
                >
                  {Math.round(seg.fraction * 100)}%
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
