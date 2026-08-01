import type { BlockData } from "./blockData.js";
import type { PickedImage } from "./images.js";
import { Fact, overlayStyle, ui } from "./system.js";

type Props = { data: BlockData<"hero">; image?: PickedImage };

/** Variant `image_overlay`: full-bleed photo, dark overlay, centered headline. */
export function Hero({ data, image }: Props) {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 py-20 text-center text-white">
      {image && (
        <img
          src={image.url}
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 max-w-[820px]">
        <h1 className="mb-5 font-[var(--font-heading)] text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-tight text-balance">
          <Fact clase={data.titulo.clase}>{data.titulo.valor}</Fact>
        </h1>
        {data.subtitulo && (
          <p className="mx-auto mb-9 max-w-[620px] text-[clamp(1.05rem,2.2vw,1.3rem)] font-light opacity-90">
            {data.subtitulo}
          </p>
        )}
        <a href="#contact" className={ui.cta}>
          {data.cta_texto}
        </a>
      </div>
    </section>
  );
}
