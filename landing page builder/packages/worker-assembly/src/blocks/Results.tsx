import type { BlockData } from "./blockData.js";
import { Fact, allPlaceholder, PlaceholderNote, ui } from "./system.js";

type Props = { data: BlockData<"results"> };

/**
 * Variant `band`: a strip of qualitative result statements.
 *
 * LG-01: never invents figures. Items are fact-wrapped, so placeholder text is
 * tagged and the section is flagged illustrative when nothing is verified.
 */
export function Results({ data }: Props) {
  const isAllPlaceholder = allPlaceholder(data.items.map((i) => i.clase));
  return (
    <section className={`${ui.section} bg-[var(--color-ink)] text-white`}>
      <div className={ui.container}>
        <h2 className={`${ui.title} text-white`}>{data.titulo}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 text-center">
          {data.items.map((item, i) => (
            <li
              key={i}
              className="rounded-[var(--radius)] border border-white/15 px-6 py-8 text-lg font-medium"
            >
              <Fact clase={item.clase}>{item.valor}</Fact>
            </li>
          ))}
        </ul>
        {isAllPlaceholder && (
          <PlaceholderNote>
            Contenido ilustrativo de muestra, no representa resultados reales.
          </PlaceholderNote>
        )}
      </div>
    </section>
  );
}
