import type { BlockData } from "./blockData.js";
import { ui } from "./system.js";

type Props = { data: BlockData<"process"> };

/** Variant `steps`: numbered "how we work" steps. Generic template copy is OK. */
export function Process({ data }: Props) {
  return (
    <section className={`${ui.section} bg-[var(--color-surface)]`}>
      <div className={ui.container}>
        <h2 className={ui.title}>{data.titulo}</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {data.pasos.map((paso, i) => (
            <li key={i} className={ui.card}>
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] font-[var(--font-heading)] font-bold text-[var(--color-ink)]">
                {i + 1}
              </span>
              <h3 className="mb-2 font-[var(--font-heading)] text-lg font-bold text-[var(--color-primary)]">
                {paso.titulo}
              </h3>
              <p className="text-sm leading-relaxed opacity-80">
                {paso.descripcion}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
