import type { BlockData } from "./blockData.js";
import { ui } from "./system.js";

type Props = { data: BlockData<"faq"> };

/**
 * Variant `accordion`: Q&A as native <details>, no client JS.
 * FAQ copy is generic template text (no fact-class) — it asserts no claim
 * about the firm, so it renders plainly.
 */
export function Faq({ data }: Props) {
  return (
    <section className={ui.section}>
      <div className={`${ui.container} max-w-[760px]`}>
        <h2 className={ui.title}>{data.titulo}</h2>
        <div className="flex flex-col gap-3">
          {data.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-[var(--radius)] border border-black/10 bg-white px-6 py-4"
            >
              <summary className="cursor-pointer list-none font-semibold text-[var(--color-primary)] marker:hidden">
                {item.pregunta}
              </summary>
              <p className="mt-3 text-[var(--color-text)] leading-relaxed opacity-85">
                {item.respuesta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
