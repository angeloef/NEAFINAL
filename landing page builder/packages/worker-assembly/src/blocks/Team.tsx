import type { BlockData } from "./blockData.js";
import { Fact, allPlaceholder, PlaceholderNote, ui } from "./system.js";

type Props = { data: BlockData<"team"> };

/** Variant `cards`: lawyer bio cards. Placeholder members are tagged (AC-02). */
export function Team({ data }: Props) {
  const isAllPlaceholder = allPlaceholder(data.miembros.map((m) => m.nombre.clase));
  return (
    <section className={ui.section}>
      <div className={ui.container}>
        <h2 className={ui.title}>{data.titulo}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {data.miembros.map((m, i) => (
            <li key={i} className={`${ui.card} text-center`}>
              <p className="text-lg font-semibold text-[var(--color-primary)]">
                <Fact clase={m.nombre.clase}>{m.nombre.valor}</Fact>
              </p>
              {m.rol && (
                <p className="mt-1 text-sm font-medium uppercase tracking-wide text-[var(--color-accent)]">
                  {m.rol}
                </p>
              )}
              {m.bio && (
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)] opacity-80">
                  {m.bio}
                </p>
              )}
            </li>
          ))}
        </ul>
        {isAllPlaceholder && (
          <PlaceholderNote>
            Perfiles de muestra, no representan integrantes reales del estudio.
          </PlaceholderNote>
        )}
      </div>
    </section>
  );
}
