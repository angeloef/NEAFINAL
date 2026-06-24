import type { BlockData } from "./blockData.js";
import { Fact, allPlaceholder, PlaceholderNote, ui } from "./system.js";

type Props = { data: BlockData<"testimonials"> };

/**
 * Variant `quotes`: client review cards.
 *
 * AC-02: reviews must be real to render as verified. Placeholder reviews stay
 * fact-tagged and the section is flagged illustrative when none are verified.
 */
export function Testimonials({ data }: Props) {
  const isAllPlaceholder = allPlaceholder(data.resenas.map((r) => r.autor.clase));
  return (
    <section className={`${ui.section} bg-[var(--color-tint)]`}>
      <div className={ui.container}>
        <h2 className={ui.title}>{data.titulo}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {data.resenas.map((r, i) => (
            <li key={i} className={`${ui.card} flex flex-col gap-4`}>
              <blockquote className="text-base italic leading-relaxed text-[var(--color-text)]">
                <Fact clase={r.texto.clase}>“{r.texto.valor}”</Fact>
              </blockquote>
              <cite className="text-sm font-semibold not-italic text-[var(--color-primary)]">
                <Fact clase={r.autor.clase}>{r.autor.valor}</Fact>
              </cite>
            </li>
          ))}
        </ul>
        {isAllPlaceholder && (
          <PlaceholderNote>
            Reseñas de muestra, no representan opiniones reales de clientes.
          </PlaceholderNote>
        )}
      </div>
    </section>
  );
}
