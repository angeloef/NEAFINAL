import { FadeIn } from "../FadeIn";
import {
  ACCENT,
  ACCENT_DEEP,
  CHAT_BG,
  CHAT_BUBBLE,
  MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  WHATSAPP_GREEN,
} from "../colors";
import { clampInterp } from "../timing";

const MESSAGES = [
  { text: "¿Quién es tu cliente ideal?", typingFrom: 8 },
  { text: "¿Qué te diferencia hoy?", typingFrom: 26 },
  { text: "¿Qué te frena para vender más?", typingFrom: 44 },
];

const DOT_PATTERN =
  "radial-gradient(rgba(28,28,28,0.035) 1px, transparent 1px)";

const TypingDots = ({ t, from }: { t: number; from: number }) => {
  const opacity =
    clampInterp(t, [from, from + 3], [0, 1]) *
    clampInterp(t, [from + 8, from + 10], [1, 0]);
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        padding: "12px 16px",
        background: "#ffffff",
        borderRadius: "4px 16px 16px 16px",
      }}
    >
      {[0, 1, 2].map((i) => {
        const bounce = Math.sin((t - from) / 2 + i * 1.4) * 3;
        return (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: MUTED,
              opacity,
              translate: `0px ${bounce}px`,
            }}
          />
        );
      })}
    </div>
  );
};

const Waveform = ({ t }: { t: number }) => {
  const opacity = clampInterp(t, [8, 20], [0, 1]);
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "flex-end",
        height: 40,
        opacity,
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const h = 10 + Math.abs(Math.sin(t / 6 + i * 0.8)) * 26;
        return (
          <div
            key={i}
            style={{ width: 4, height: h, borderRadius: 2, background: ACCENT }}
          />
        );
      })}
    </div>
  );
};

const ReadReceipt = ({ t, from }: { t: number; from: number }) => {
  const opacity = clampInterp(t, [from, from + 6], [0, 1]);
  return (
    <svg width={16} height={10} viewBox="0 0 16 10" style={{ opacity }}>
      <path
        d="M1 5l3 3 6-7"
        fill="none"
        stroke={ACCENT_DEEP}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 5l3 3 6-7"
        fill="none"
        stroke={ACCENT_DEEP}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChatAct = ({ t }: { t: number }) => {
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
          gap: 12,
          padding: "14px 40px",
          borderBottom: "1px solid rgba(28,28,28,0.06)",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "sans-serif",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          TN
        </div>
        <div>
          <div
            style={{
              color: TEXT_PRIMARY,
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "sans-serif",
            }}
          >
            Tu negocio
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: WHATSAPP_GREEN,
              }}
            />
            <div
              style={{ color: MUTED, fontSize: 12, fontFamily: "sans-serif" }}
            >
              en línea
            </div>
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Waveform t={t} />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: CHAT_BG,
          backgroundImage: DOT_PATTERN,
          backgroundSize: "14px 14px",
          padding: "24px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <FadeIn t={t} from={0} duration={10} translateY={0}>
          <div
            style={{
              color: TEXT_SECONDARY,
              fontSize: 13,
              fontFamily: "sans-serif",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Sesión de descubrimiento
          </div>
        </FadeIn>

        {MESSAGES.map((m, i) => {
          const bubbleFrom = m.typingFrom + 10;
          const isTyping = t >= m.typingFrom && t < bubbleFrom;
          const bubbleVisible = t >= bubbleFrom - 2;
          return (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              {isTyping ? <TypingDots t={t} from={m.typingFrom} /> : null}
              {bubbleVisible ? (
                <FadeIn t={t} from={bubbleFrom} duration={10} translateY={8}>
                  <div
                    style={{
                      background: CHAT_BUBBLE,
                      borderRadius: "16px 4px 16px 16px",
                      padding: "10px 16px",
                      color: TEXT_PRIMARY,
                      fontSize: 15,
                      fontFamily: "sans-serif",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                      maxWidth: 420,
                    }}
                  >
                    <span>{m.text}</span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span style={{ fontSize: 10, color: MUTED }}>
                        10:0{i + 1}
                      </span>
                      <ReadReceipt t={t} from={bubbleFrom + 6} />
                    </div>
                  </div>
                </FadeIn>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
