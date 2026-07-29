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

const SECTIONS = [
  {
    title: "Objetivos",
    text: "Aumentar recurrencia y ticket promedio en 90 días",
    color: ACCENT,
    from: 14,
  },
  {
    title: "Cronograma",
    text: "6 semanas, 4 hitos con entregables claros",
    color: BUSINESS,
    from: 26,
  },
  {
    title: "Inversión",
    text: "Pago por etapa, facturado sobre resultado",
    color: APPS,
    from: 38,
  },
];

export const ProposalAct = ({ t }: { t: number }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DEEP})`,
        }}
      />
      <div
        style={{
          padding: "30px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flex: 1,
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
            Propuesta — Tu negocio
          </div>
          <div
            style={{
              color: MUTED,
              fontSize: 14,
              fontFamily: "sans-serif",
              marginTop: 4,
            }}
          >
            Plan de acción, versión final
          </div>
        </FadeIn>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 6,
          }}
        >
          {SECTIONS.map((s, i) => (
            <FadeIn
              key={s.title}
              t={t}
              from={s.from}
              duration={12}
              translateY={26 - i * 6}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "16px 20px",
                  boxShadow: "0 2px 10px rgba(20,30,60,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      background: s.color,
                    }}
                  />
                  <div
                    style={{
                      color: TEXT_PRIMARY,
                      fontSize: 16,
                      fontWeight: 500,
                      fontFamily: "sans-serif",
                    }}
                  >
                    {s.title}
                  </div>
                </div>
                <div
                  style={{
                    color: MUTED,
                    fontSize: 13,
                    fontFamily: "sans-serif",
                    marginTop: 6,
                  }}
                >
                  {s.text}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
};
