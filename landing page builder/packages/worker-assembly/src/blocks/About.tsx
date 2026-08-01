import type { BlockData } from "./blockData.js";
import type { PickedImage } from "./images.js";
import { Fact, overlayStyle, ui } from "./system.js";

type Props = { data: BlockData<"about">; image?: PickedImage };

/** Variant `dark_band`: dark section over a faint photo, centered copy. */
export function About({ data, image }: Props) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
      {image && (
        <img
          src={image.url}
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
      )}
      <div className="absolute inset-0" style={overlayStyle} />
      <div className={`relative z-10 ${ui.section} ${ui.container} text-center`}>
        <h2 className="mb-5 font-[var(--font-heading)] text-[clamp(1.9rem,4vw,2.75rem)] font-bold leading-tight text-balance">
          {data.titulo}
        </h2>
        <p className="mx-auto max-w-[680px] text-lg font-light opacity-90">
          <Fact clase={data.texto.clase}>{data.texto.valor}</Fact>
        </p>
      </div>
    </section>
  );
}
