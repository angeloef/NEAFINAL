import { z } from "zod";
import { FieldClass } from "./dataField.js";

/**
 * PagePlan (P4) — reemplaza el flujo "texto para slots" de `Copy` por bloques
 * componibles `{ type, variant, data }`. El LLM elige bloques/orden/variantes;
 * el assembly mapea cada bloque a su renderer.
 *
 * Los campos de dato fáctico viajan envueltos en `fact()` con su `clase`
 * (VERIFICADO/PLANTILLA) para que validation distinga hecho real vs. placeholder
 * (spec §4.3, AC-01/LG-01). El resto del contenido (procesos, FAQ genérico) es
 * texto plano sin clase porque no afirma un hecho sobre la entidad.
 */

/** Catálogo de bloques de sección disponibles. */
export const BlockType = z.enum([
  "hero",
  "trust_bar",
  "areas",
  "about",
  "process",
  "results",
  "team",
  "testimonials",
  "faq",
  "cta_band",
  "contact",
  "footer",
]);
export type BlockType = z.infer<typeof BlockType>;

/** Campo de dato fáctico: valor + procedencia (clase). Mínimo para fact-check. */
const fact = <T extends z.ZodTypeAny>(valor: T) =>
  z.object({ valor, clase: FieldClass });
const factString = fact(z.string().min(1));

/** Sub-schema de `data` por cada tipo de bloque. */
const heroData = z.object({
  titulo: factString,
  subtitulo: z.string().min(1).optional(),
  cta_texto: z.string().min(1),
});
const trustBarData = z.object({
  items: z.array(factString).min(1),
});
const areasData = z.object({
  titulo: z.string().min(1),
  items: z.array(factString).min(1),
});
const aboutData = z.object({
  titulo: z.string().min(1),
  texto: factString,
});
const processData = z.object({
  titulo: z.string().min(1),
  pasos: z
    .array(z.object({ titulo: z.string().min(1), descripcion: z.string().min(1) }))
    .min(1),
});
const resultsData = z.object({
  titulo: z.string().min(1),
  items: z.array(factString).min(1),
});
const teamData = z.object({
  titulo: z.string().min(1),
  miembros: z
    .array(
      z.object({
        nombre: factString,
        rol: z.string().min(1).optional(),
        bio: z.string().min(1).optional(),
      }),
    )
    .min(1),
});
const testimonialsData = z.object({
  titulo: z.string().min(1),
  resenas: z
    .array(
      z.object({
        autor: factString,
        texto: factString,
        rating: z.number().min(1).max(5).optional(),
      }),
    )
    .min(1),
});
const faqData = z.object({
  titulo: z.string().min(1),
  items: z
    .array(z.object({ pregunta: z.string().min(1), respuesta: z.string().min(1) }))
    .min(1),
});
const ctaBandData = z.object({
  titulo: z.string().min(1),
  cta_texto: z.string().min(1),
});
const contactData = z.object({
  titulo: z.string().min(1),
  telefono: factString.optional(),
  whatsapp: factString.optional(),
  email: fact(z.string().email()).optional(),
});
const footerData = z.object({
  nombre: factString,
  direccion: factString.optional(),
  telefono: factString.optional(),
  disclaimer: z.string().min(1).optional(),
});

/** Un bloque: `type` literal + `variant` + `data` tipado por su `type`. */
const block = <T extends z.ZodLiteral<BlockType>, D extends z.ZodTypeAny>(
  type: T,
  data: D,
) => z.object({ type, variant: z.string().min(1), data });

export const PageBlock = z.discriminatedUnion("type", [
  block(z.literal("hero"), heroData),
  block(z.literal("trust_bar"), trustBarData),
  block(z.literal("areas"), areasData),
  block(z.literal("about"), aboutData),
  block(z.literal("process"), processData),
  block(z.literal("results"), resultsData),
  block(z.literal("team"), teamData),
  block(z.literal("testimonials"), testimonialsData),
  block(z.literal("faq"), faqData),
  block(z.literal("cta_band"), ctaBandData),
  block(z.literal("contact"), contactData),
  block(z.literal("footer"), footerData),
]);
export type PageBlock = z.infer<typeof PageBlock>;

/** page_plan.json — lista ordenada de bloques + meta SEO. */
export const PagePlan = z.object({
  mission_id: z.string().min(1),
  blocks: z.array(PageBlock).min(1),
  meta: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
});
export type PagePlan = z.infer<typeof PagePlan>;
