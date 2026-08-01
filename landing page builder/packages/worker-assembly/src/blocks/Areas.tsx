import type { BlockData } from "./blockData.js";
import { Fact, ui } from "./system.js";

type Props = { data: BlockData<"areas"> };

/** Variant `cards`: practice areas as a responsive card grid. */
export function Areas({ data }: Props) {
  return (
    <section className={`${ui.section} bg-[var(--color-tint)]`}>
      <div className={ui.container}>
        <h2 className={ui.title}>{data.titulo}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {data.items.map((item, i) => (
            <li
              key={i}
              className={`${ui.card} border-l-[3px] border-l-[var(--color-accent)] text-lg font-medium text-[var(--color-text)]`}
            >
              <Fact clase={item.clase}>{item.valor}</Fact>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
