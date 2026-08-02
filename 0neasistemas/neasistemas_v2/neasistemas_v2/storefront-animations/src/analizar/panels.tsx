import { Counter, ease } from "./kinetic";
import { AMBER, HAIRLINE, INK, INK_SOFT, VERMILION } from "./theme";

// Every figure here is illustrative: this is a product mock, not a client
// report, so nothing is framed as something a real client actually did.

// The goal picked in act 1 is the same one act 4 answers. That thread is the
// whole argument of the film: the site is built for a stated objective.
export const OBJETIVO = "Vender más seguido";

const caption: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: INK_SOFT,
  letterSpacing: "0.14em",
};

const body: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: INK,
  letterSpacing: "-0.01em",
};

/* ── EMPEZAMOS POR VOS ────────────────────────────────────────────────────
   What the business is and what it wants. The objective is a choice among
   real alternatives, not a slogan, so it lands as a decision.             */

const FACTS = [
  { k: "RUBRO", v: "Indumentaria" },
  { k: "LE VENDE A", v: "Mujeres de 25 a 40" },
];

const GOALS = [
  "Vender más seguido",
  "Abrir un segundo local",
  "Vender más caro",
];

export const NegocioPanel = ({ t, w }: { t: number; w: number }) => (
  <div style={{ width: w }}>
    <div style={{ display: "flex", gap: 34 }}>
      {FACTS.map((f, i) => (
        <div
          key={f.k}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            opacity: ease(t, [2 + i * 8, 16 + i * 8], [0, 1]),
          }}
        >
          <span style={caption}>{f.k}</span>
          <span style={body}>{f.v}</span>
        </div>
      ))}
    </div>
    <div
      style={{
        height: 1,
        background: HAIRLINE,
        margin: "14px 0 12px",
        width: `${ease(t, [16, 40], [0, 100])}%`,
      }}
    />
    <div style={{ ...caption, opacity: ease(t, [22, 34], [0, 1]) }}>
      QUÉ QUIERE LOGRAR
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 9,
      }}
    >
      {GOALS.map((g, i) => {
        const start = 30 + i * 9;
        const picked = g === OBJETIVO;
        // the chosen one only fills once the alternatives are on screen
        const fill = picked ? ease(t, [62, 82], [0, 1]) : 0;
        return (
          <div
            key={g}
            style={{
              position: "relative",
              padding: "7px 14px",
              border: `1.5px solid ${picked && fill > 0.5 ? VERMILION : HAIRLINE}`,
              opacity: ease(t, [start, start + 16], [0, 1]),
              translate: `${ease(t, [start, start + 24], [18, 0])}px 0`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: VERMILION,
                width: `${fill * 100}%`,
              }}
            />
            <div
              style={{
                position: "relative",
                fontSize: 15,
                fontWeight: picked ? 700 : 600,
                letterSpacing: "-0.01em",
                color: picked && fill > 0.55 ? "#fff" : INK_SOFT,
              }}
            >
              {g}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ── MIRAMOS AFUERA ───────────────────────────────────────────────────────
   The competitor grid. Filled dot = resuelto. Your row is last and mostly
   hollow, which is the finding: the gap is visible without a sentence.    */

const CHECKS = ["precio", "respuesta", "envío", "reseñas"];
const GRID = [
  { name: "Competidor A", has: [1, 1, 1, 0] },
  { name: "Competidor B", has: [1, 0, 1, 1] },
  { name: "Competidor C", has: [1, 1, 0, 1] },
  { name: "Tu sitio hoy", has: [0, 0, 1, 0], you: true },
];
const NAME_W = 150;
const CELL_W = 78;

export const CompetenciaPanel = ({ t }: { t: number }) => (
  <div style={{ width: NAME_W + CHECKS.length * CELL_W }}>
    <div style={{ display: "flex", opacity: ease(t, [2, 16], [0, 1]) }}>
      <div style={{ width: NAME_W }} />
      {CHECKS.map((c) => (
        <div
          key={c}
          style={{
            ...caption,
            width: CELL_W,
            textAlign: "center",
            letterSpacing: "0.06em",
          }}
        >
          {c}
        </div>
      ))}
    </div>
    {GRID.map((row, ri) => {
      const start = 10 + ri * 10;
      return (
        <div
          key={row.name}
          style={{
            display: "flex",
            alignItems: "center",
            height: 34,
            borderTop: `1px solid ${HAIRLINE}`,
            opacity: ease(t, [start, start + 16], [0, 1]),
          }}
        >
          <div
            style={{
              width: NAME_W,
              fontSize: 15,
              fontWeight: row.you ? 700 : 600,
              letterSpacing: "-0.01em",
              color: row.you ? VERMILION : INK_SOFT,
            }}
          >
            {row.name}
          </div>
          {row.has.map((h, ci) => {
            const d = start + 8 + ci * 5;
            const on = ease(t, [d, d + 14], [0, 1]);
            const color = row.you ? VERMILION : INK;
            return (
              <div
                key={ci}
                style={{
                  width: CELL_W,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 8,
                    border: `2px solid ${h ? color : HAIRLINE}`,
                    background: h ? color : "transparent",
                    scale: on,
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    })}
  </div>
);

/* ── JUNTAMOS LOS DATOS ───────────────────────────────────────────────────
   Sources the business already has, converging into one number. The bracket
   on the left is what makes it read as "junto" instead of "una lista".    */

const SOURCES = [
  { name: "Ventas del último año", n: 1240 },
  { name: "Chats de WhatsApp", n: 3480 },
  { name: "Visitas al sitio", n: 9120 },
  { name: "Reseñas y comentarios", n: 86 },
];
const ROW_H = 32;

export const DatosPanel = ({ t, w }: { t: number; w: number }) => {
  const brace = ease(t, [42, 68], [0, 1]);
  const listH = SOURCES.length * ROW_H;
  return (
    <div style={{ width: w, display: "flex", gap: 18 }}>
      <div style={{ position: "relative", width: 18, height: listH }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: listH / 2 - (listH / 2) * brace,
            width: 2,
            height: listH * brace,
            background: VERMILION,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: listH / 2 - 1,
            width: 18 * ease(t, [62, 76], [0, 1]),
            height: 2,
            background: VERMILION,
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        {SOURCES.map((s, i) => {
          const start = 6 + i * 9;
          return (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: ROW_H,
                borderBottom: `1px solid ${HAIRLINE}`,
                opacity: ease(t, [start, start + 16], [0, 1]),
              }}
            >
              <span style={{ ...body, fontWeight: 600, color: INK_SOFT }}>
                {s.name}
              </span>
              <Counter
                t={t}
                from={0}
                to={s.n}
                start={start}
                duration={40}
                grouped
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: "-0.02em",
                }}
              />
            </div>
          );
        })}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            opacity: ease(t, [66, 82], [0, 1]),
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: VERMILION,
              letterSpacing: "-0.04em",
            }}
          >
            <Counter t={t} from={0} to={13926} start={66} duration={30} grouped />
          </span>
          <span style={{ ...caption, letterSpacing: "0.08em" }}>
            SEÑALES DE UN MISMO NEGOCIO
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── RECIÉN AHÍ, LA WEB ───────────────────────────────────────────────────
   Every decision hangs off the objective chosen in act 1. Only the first is
   filled: the output of the step is an order, not a list of everything.   */

const DECISIONS = [
  { n: "01", text: "Precios y stock a la vista", weight: 3 },
  { n: "02", text: "Respuesta automática fuera de hora", weight: 2 },
  { n: "03", text: "Recompra en dos clics", weight: 1 },
];

const Meter = ({
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

export const WebPanel = ({ t, w }: { t: number; w: number }) => (
  <div style={{ width: w }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        opacity: ease(t, [2, 16], [0, 1]),
      }}
    >
      <span style={{ ...caption, color: AMBER }}>OBJETIVO</span>
      <span style={{ ...body, fontWeight: 700 }}>{OBJETIVO}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {DECISIONS.map((d, i) => {
        const start = 10 + i * 12;
        const lead = i === 0;
        const pulse = lead
          ? 1 + 0.012 * Math.sin(((t - start) / 30) * Math.PI * 2)
          : 1;
        return (
          <div
            key={d.n}
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
              {d.n}
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
              {d.text}
            </div>
            <Meter level={d.weight} lead={lead} t={t} start={start} />
          </div>
        );
      })}
    </div>
  </div>
);
