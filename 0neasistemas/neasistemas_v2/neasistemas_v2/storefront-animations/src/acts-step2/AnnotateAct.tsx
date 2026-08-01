import { FadeIn } from "../FadeIn";
import {
  ACCENT,
  ACCENT_DEEP,
  APPS,
  BORDER,
  BUSINESS,
  MUTED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  WHATSAPP_GREEN,
} from "../colors";
import { clampInterp } from "../timing";

const NOTES = [
  {
    x: 210,
    y: 40,
    text: "Ajustar tipografía del título",
    color: ACCENT,
    from: 10,
  },
  { x: 560, y: 132, text: "Cambiar color de fondo", color: BUSINESS, from: 24 },
];

const Pin = ({
  color,
  from,
  t,
}: {
  color: string;
  from: number;
  t: number;
}) => {
  const scale = clampInterp(t, [from, from + 8], [0, 1]);
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "12px 12px 12px 2px",
        background: color,
        scale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 12,
        fontFamily: "sans-serif",
        fontWeight: 500,
      }}
    >
      !
    </div>
  );
};

export const AnnotateAct = ({ t }: { t: number }) => {
  const approvedOpacity = clampInterp(t, [50, 60], [0, 1]);

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
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "16px 40px",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
          }}
        />
        <div style={{ color: MUTED, fontSize: 14, fontFamily: "sans-serif" }}>
          Inicio
        </div>
        <div style={{ color: MUTED, fontSize: 14, fontFamily: "sans-serif" }}>
          Productos
        </div>
        <div style={{ color: MUTED, fontSize: 14, fontFamily: "sans-serif" }}>
          Nosotros
        </div>
      </div>

      <div
        style={{
          padding: "28px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flex: 1,
          position: "relative",
        }}
      >
        <div style={{ opacity: 0.5 }}>
          <div
            style={{
              color: TEXT_PRIMARY,
              fontSize: 24,
              fontWeight: 500,
              fontFamily: "sans-serif",
            }}
          >
            Bienvenido a tu negocio
          </div>
          <div
            style={{
              color: MUTED,
              fontSize: 14,
              fontFamily: "sans-serif",
              marginTop: 6,
            }}
          >
            Una primera versión navegable de tu sitio
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
            {[ACCENT, BUSINESS, APPS].map((color, i) => (
              <div
                key={i}
                style={{
                  width: 130,
                  height: 100,
                  borderRadius: 10,
                  background: `${color}1a`,
                  border: `1px solid ${BORDER}`,
                }}
              />
            ))}
          </div>
        </div>

        {NOTES.map((n) => (
          <FadeIn
            key={n.text}
            t={t}
            from={n.from}
            duration={10}
            translateY={-10}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Pin color={n.color} from={n.from} t={t} />
            <div
              style={{
                background: "#ffffff",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: "sans-serif",
                color: TEXT_PRIMARY,
                boxShadow: "0 4px 12px rgba(20,30,60,0.1)",
                maxWidth: 200,
              }}
            >
              {n.text}
            </div>
          </FadeIn>
        ))}

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 40,
            opacity: approvedOpacity,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: SURFACE_MUTED,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: "8px 16px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: WHATSAPP_GREEN,
            }}
          />
          <div
            style={{
              color: TEXT_PRIMARY,
              fontSize: 13,
              fontFamily: "sans-serif",
              fontWeight: 500,
            }}
          >
            Aprobado para ajustar diseño
          </div>
        </div>
      </div>
    </div>
  );
};
