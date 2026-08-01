import type { BlockData } from "./blockData.js";
import { Fact, ui } from "./system.js";

type Props = { data: BlockData<"footer"> };

/**
 * Variant `nap`: name/address/phone + schema.org LegalService JSON-LD + legal
 * disclaimer. The JSON-LD is built from our own validated data (no user input),
 * so the inline script is safe.
 */
export function Footer({ data }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: data.nombre.valor,
    ...(data.direccion && { address: data.direccion.valor }),
    ...(data.telefono && { telephone: data.telefono.valor }),
  };
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-ink)] px-6 py-12 text-center text-sm text-white/75">
      <div className={ui.container}>
        <p className="text-base font-semibold text-white">
          <Fact clase={data.nombre.clase}>{data.nombre.valor}</Fact>
        </p>
        {data.direccion && (
          <p className="mt-2">
            <Fact clase={data.direccion.clase}>{data.direccion.valor}</Fact>
          </p>
        )}
        {data.telefono && (
          <p className="mt-1">
            <Fact clase={data.telefono.clase}>{data.telefono.valor}</Fact>
          </p>
        )}
        {data.disclaimer && (
          <p className="mx-auto mt-5 max-w-[640px] text-xs italic opacity-60">
            {data.disclaimer}
          </p>
        )}
        <p className="mt-5 text-xs opacity-50">
          © {year} {data.nombre.valor}
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </footer>
  );
}
