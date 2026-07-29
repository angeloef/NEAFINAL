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
} from "../colors";
import { clampInterp } from "../timing";

const NAV_LINKS = ["Inicio", "Productos", "Nosotros"];
const CARD_COLORS = [ACCENT, BUSINESS, APPS];

const Cursor = ({
  x,
  y,
  opacity,
  pressed,
}: {
  x: number;
  y: number;
  opacity: number;
  pressed: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 16,
      height: 16,
      opacity,
      scale: 1 - pressed * 0.25,
    }}
  >
    <svg width={16} height={16} viewBox="0 0 16 16">
      <path
        d="M1 1l5.5 13 2-5.5L14 6.5z"
        fill={TEXT_PRIMARY}
        stroke="#fff"
        strokeWidth={1}
      />
    </svg>
  </div>
);

export const WebsiteAct = ({ t }: { t: number }) => {
  const navX = clampInterp(t, [40, 52], [500, 96]);
  const navY = clampInterp(t, [40, 52], [70, 24]);
  const clickPulse = Math.max(
    0,
    Math.sin(clampInterp(t, [52, 58], [0, Math.PI])),
  );
  const clicked = t >= 55;
  const gridSwap = clampInterp(t, [55, 62], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FadeIn t={t} from={0} duration={10} translateY={0}>
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
          {NAV_LINKS.map((link, i) => (
            <div
              key={link}
              style={{
                color: clicked && i === 0 ? ACCENT : MUTED,
                fontSize: 14,
                fontFamily: "sans-serif",
                fontWeight: clicked && i === 0 ? 500 : 400,
              }}
            >
              {link}
            </div>
          ))}
        </div>
      </FadeIn>

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
        <FadeIn t={t} from={10} duration={12} translateY={16}>
          <div
            style={{
              color: TEXT_PRIMARY,
              fontSize: 24,
              fontWeight: 500,
              fontFamily: "sans-serif",
            }}
          >
            {clicked ? "Nuestros productos" : "Bienvenido a tu negocio"}
          </div>
          <div
            style={{
              color: MUTED,
              fontSize: 14,
              fontFamily: "sans-serif",
              marginTop: 6,
            }}
          >
            {clicked
              ? "Catálogo completo, armado y listo"
              : "Una primera versión navegable de tu sitio"}
          </div>
          {!clicked ? (
            <div
              style={{
                marginTop: 14,
                background: ACCENT,
                color: "#fff",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontFamily: "sans-serif",
                fontWeight: 500,
                width: "fit-content",
              }}
            >
              Ver más
            </div>
          ) : null}
        </FadeIn>

        <FadeIn
          t={t}
          from={26}
          duration={12}
          translateY={16}
          style={{ display: "flex", gap: 14 }}
        >
          {CARD_COLORS.map((color, i) => (
            <div
              key={i}
              style={{
                width: 130,
                height: 100,
                borderRadius: 10,
                background: gridSwap > 0.5 ? SURFACE_MUTED : `${color}1a`,
                border: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "flex-end",
                padding: 10,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: color,
                  opacity: gridSwap > 0.5 ? 0.5 : 1,
                }}
              />
            </div>
          ))}
        </FadeIn>

        <Cursor
          x={navX}
          y={navY - 24}
          opacity={
            clampInterp(t, [40, 44], [0, 1]) * clampInterp(t, [60, 66], [1, 0])
          }
          pressed={clickPulse}
        />
      </div>
    </div>
  );
};
