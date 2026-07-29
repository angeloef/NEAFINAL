import { FadeIn } from "../FadeIn";
import {
  ACCENT,
  ACCENT_DEEP,
  BORDER,
  MUTED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
} from "../colors";

const KPI_CHIPS = [
  { label: "recurrencia", value: "+32%" },
  { label: "ticket total", value: "$1.2M" },
  { label: "satisfacción", value: "94%" },
];

const FINDINGS = [
  { from: 26, text: "1.240 clientes analizados en 5 canales activos" },
  { from: 36, text: "Instagram y WhatsApp concentran el 60% de la demanda" },
  { from: 46, text: "12 oportunidades de venta recurrente detectadas" },
];

const Check = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <circle cx={8} cy={8} r={8} fill={ACCENT} />
    <path
      d="M4.5 8.2l2 2 5-5.2"
      fill="none"
      stroke="#fff"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ReportAct = ({ t }: { t: number }) => {
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
          padding: "28px 40px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <FadeIn
          t={t}
          from={0}
          duration={10}
          translateY={0}
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "sans-serif",
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                color: TEXT_PRIMARY,
                fontSize: 21,
                fontWeight: 500,
                fontFamily: "sans-serif",
              }}
            >
              Reporte completo
            </div>
            <div
              style={{ color: MUTED, fontSize: 13, fontFamily: "sans-serif" }}
            >
              Informe de diagnóstico — listo para revisar
            </div>
          </div>
        </FadeIn>

        <div style={{ display: "flex", gap: 12 }}>
          {KPI_CHIPS.map((chip, i) => (
            <FadeIn
              key={chip.label}
              t={t}
              from={12 + i * 6}
              duration={10}
              style={{ flex: 1 }}
            >
              <div
                style={{
                  background: SURFACE_MUTED,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "10px 16px",
                }}
              >
                <div
                  style={{
                    color: TEXT_PRIMARY,
                    fontSize: 18,
                    fontWeight: 500,
                    fontFamily: "sans-serif",
                  }}
                >
                  {chip.value}
                </div>
                <div
                  style={{
                    color: MUTED,
                    fontSize: 12,
                    fontFamily: "sans-serif",
                  }}
                >
                  {chip.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FINDINGS.map((f, i) => (
            <FadeIn key={i} t={t} from={f.from} duration={10} translateY={8}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Check />
                <div
                  style={{
                    color: TEXT_PRIMARY,
                    fontSize: 14,
                    fontFamily: "sans-serif",
                  }}
                >
                  {f.text}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn t={t} from={56} duration={12} translateY={10}>
          <div
            style={{
              background: ACCENT,
              color: "#ffffff",
              borderRadius: 10,
              padding: "12px 22px",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "sans-serif",
              width: "fit-content",
            }}
          >
            Descargar reporte
          </div>
        </FadeIn>

        <div
          style={{
            marginTop: "auto",
            color: MUTED,
            fontSize: 11,
            fontFamily: "sans-serif",
          }}
        >
          Generado automáticamente — página 1 de 1
        </div>
      </div>
    </div>
  );
};
