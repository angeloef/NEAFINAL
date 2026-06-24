import type { BlockData } from "./blockData.js";
import { Fact, ui } from "./system.js";

type Props = { data: BlockData<"contact"> };

/** Variant `channels`: real contact channels as a centered list. */
export function Contact({ data }: Props) {
  const channels = [
    data.telefono && { label: "Teléfono", field: data.telefono, href: `tel:${data.telefono.valor}` },
    data.whatsapp && { label: "WhatsApp", field: data.whatsapp, href: `https://wa.me/${data.whatsapp.valor.replace(/[^\d]/g, "")}` },
    data.email && { label: "Email", field: data.email, href: `mailto:${data.email.valor}` },
  ].filter(Boolean) as { label: string; field: { valor: string; clase: Parameters<typeof Fact>[0]["clase"] }; href: string }[];

  return (
    <section id="contact" className={`${ui.section} bg-[var(--color-tint)]`}>
      <div className={`${ui.container} max-w-[640px] text-center`}>
        <h2 className={ui.title}>{data.titulo}</h2>
        <ul className="flex flex-col items-center gap-4">
          {channels.map((c, i) => (
            <li key={i} className="text-lg">
              <span className="font-semibold text-[var(--color-primary)]">{c.label}: </span>
              <a
                href={c.href}
                className="text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                <Fact clase={c.field.clase}>{c.field.valor}</Fact>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
