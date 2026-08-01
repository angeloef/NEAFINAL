import { FadeIn } from "../FadeIn";
import {
  ACCENT,
  APPS,
  BORDER,
  BUSINESS,
  MUTED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  WHATSAPP_GREEN,
} from "../colors";
import { clampInterp } from "../timing";

const HEADERS = ["Cliente", "Canal", "Ticket promedio", "Categoría"];
const FILTERS = ["Todos", "Nuevos", "Recurrentes", "VIP"];

const CHANNEL_DOT: Record<string, string> = {
  Instagram: APPS,
  WhatsApp: WHATSAPP_GREEN,
  "Google Ads": ACCENT,
  Referido: BUSINESS,
  Web: MUTED,
};

const ROWS = [
  ["Cliente #0842", "Instagram", "$18.400", "Recurrente"],
  ["Cliente #1190", "WhatsApp", "$9.200", "Nuevo"],
  ["Cliente #0355", "Google Ads", "$24.100", "VIP"],
  ["Cliente #1477", "Referido", "$12.600", "Nuevo"],
  ["Cliente #0921", "Web", "$16.800", "Recurrente"],
];

export const TableAct = ({ t }: { t: number }) => {
  const progress = clampInterp(t, [5, 45], [0, 100]);
  const synced = Math.round(clampInterp(t, [15, 55], [0, 128]));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <FadeIn
        t={t}
        from={0}
        duration={10}
        translateY={0}
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            color: TEXT_PRIMARY,
            fontSize: 21,
            fontWeight: 500,
            fontFamily: "sans-serif",
          }}
        >
          Recolección de datos
        </div>
        <div
          style={{
            color: ACCENT,
            fontSize: 13,
            fontFamily: "sans-serif",
            fontWeight: 500,
          }}
        >
          {synced} registros sincronizados
        </div>
      </FadeIn>

      <div
        style={{
          height: 4,
          background: SURFACE_MUTED,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: ACCENT,
            borderRadius: 2,
          }}
        />
      </div>

      <FadeIn
        t={t}
        from={6}
        duration={8}
        translateY={0}
        style={{ display: "flex", gap: 8 }}
      >
        {FILTERS.map((f, i) => (
          <div
            key={f}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontFamily: "sans-serif",
              background: i === 0 ? ACCENT : SURFACE_MUTED,
              color: i === 0 ? "#ffffff" : MUTED,
              border: i === 0 ? "none" : `1px solid ${BORDER}`,
            }}
          >
            {f}
          </div>
        ))}
      </FadeIn>

      <div
        style={{
          background: "#ffffff",
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          overflow: "hidden",
          fontFamily: "sans-serif",
          fontSize: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
            padding: "11px 20px",
            background: SURFACE_MUTED,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          {HEADERS.map((h) => (
            <div key={h} style={{ color: MUTED, fontWeight: 500 }}>
              {h}
            </div>
          ))}
        </div>
        {ROWS.map((row, i) => (
          <FadeIn key={i} t={t} from={15 + i * 8} duration={10} translateY={10}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
                padding: "10px 20px",
                background: i % 2 === 1 ? SURFACE_MUTED : "#ffffff",
                borderBottom:
                  i < ROWS.length - 1 ? `1px solid ${BORDER}` : "none",
                alignItems: "center",
              }}
            >
              <div style={{ color: TEXT_PRIMARY }}>{row[0]}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: MUTED,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    background: CHANNEL_DOT[row[1]],
                  }}
                />
                {row[1]}
              </div>
              <div style={{ color: MUTED }}>{row[2]}</div>
              <div style={{ color: MUTED }}>{row[3]}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};
