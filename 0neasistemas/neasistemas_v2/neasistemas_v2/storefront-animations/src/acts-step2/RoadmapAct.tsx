import { FadeIn } from "../FadeIn";
import {
  ACCENT,
  BORDER,
  MUTED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../colors";
import { clampInterp } from "../timing";

const MILESTONES = [
  { title: "Diagnóstico", when: "Semana 1–2", from: 8 },
  { title: "Estructura", when: "Semana 3", from: 22 },
  { title: "Diseño", when: "Semana 4–5", from: 36 },
  { title: "Lanzamiento", when: "Semana 6", from: 50 },
];

const Check = ({ opacity }: { opacity: number }) => (
  <svg width={22} height={22} viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
    <circle cx={11} cy={11} r={11} fill={ACCENT} opacity={opacity} />
    <path
      d="M6.5 11.3l3 3 6-6.6"
      fill="none"
      stroke="#fff"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  </svg>
);

export const RoadmapAct = ({ t }: { t: number }) => {
  const lineProgress = clampInterp(t, [10, 58], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
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
          Plan definido
        </div>
        <div
          style={{
            color: TEXT_SECONDARY,
            fontSize: 14,
            fontFamily: "sans-serif",
            marginTop: 4,
          }}
        >
          Sabés qué pasa en cada etapa, antes de empezar
        </div>
      </FadeIn>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          paddingLeft: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 11,
            bottom: 11,
            width: 2,
            background: BORDER,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 11,
            width: 2,
            height: `${lineProgress * 100}%`,
            background: ACCENT,
          }}
        />
        {MILESTONES.map((m) => (
          <FadeIn
            key={m.title}
            t={t}
            from={m.from}
            duration={10}
            translateY={6}
            style={{ display: "flex", alignItems: "center", gap: 14 }}
          >
            <Check opacity={1} />
            <div
              style={{
                background: SURFACE_MUTED,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: 480,
              }}
            >
              <div
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "sans-serif",
                }}
              >
                {m.title}
              </div>
              <div
                style={{ color: MUTED, fontSize: 13, fontFamily: "sans-serif" }}
              >
                {m.when}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};
