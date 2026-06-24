import type { BlockData } from "./blockData.js";
import type { PickedImage } from "./images.js";
import { overlayStyle, ui } from "./system.js";

type Props = { data: BlockData<"cta_band">; image?: PickedImage };

/** Variant `band`: full-width CTA strip over an optional photo. */
export function CtaBand({ data, image }: Props) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-primary)] text-center text-white">
      {image && (
        <img
          src={image.url}
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}
      <div className="absolute inset-0" style={overlayStyle} />
      <div className={`relative z-10 ${ui.section} ${ui.container}`}>
        <h2 className="mb-7 font-[var(--font-heading)] text-[clamp(1.7rem,3.5vw,2.5rem)] font-bold leading-tight text-balance">
          {data.titulo}
        </h2>
        <a href="#contact" className={ui.cta}>
          {data.cta_texto}
        </a>
      </div>
    </section>
  );
}
