import type { BlockData } from "./blockData.js";
import { Fact } from "./system.js";

type Props = { data: BlockData<"trust_bar"> };

/** Variant `chips`: a row of credential/area chips. No invented figures. */
export function TrustBar({ data }: Props) {
  return (
    <section className="border-y border-black/10 bg-[var(--color-tint)] px-6 py-7">
      <ul className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-center gap-3">
        {data.items.map((item, i) => (
          <li
            key={i}
            className="rounded-full border border-[var(--color-accent)]/40 px-4 py-1.5 text-sm font-medium text-[var(--color-primary)]"
          >
            <Fact clase={item.clase}>{item.valor}</Fact>
          </li>
        ))}
      </ul>
    </section>
  );
}
