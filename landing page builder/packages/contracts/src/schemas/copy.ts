import { z } from "zod";

/** copy.json — salida del worker Copy (spec §12). Secciones de la landing. */
export const Copy = z.object({
  mission_id: z.string().min(1),
  hero: z.object({
    titulo: z.string().min(1),
    subtitulo: z.string().optional(),
    cta_texto: z.string().min(1),
  }),
  areas_practica: z
    .object({
      titulo: z.string().min(1),
      items: z.array(z.string().min(1)).min(1),
    })
    .optional(),
  prueba_social: z
    .object({
      titulo: z.string().min(1),
      resenas: z
        .array(
          z.object({
            autor: z.string().min(1),
            texto: z.string().min(1),
            rating: z.number().min(1).max(5).optional(),
          }),
        )
        .min(1),
    })
    .optional(),
  contacto: z.object({
    titulo: z.string().min(1),
    telefono: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
  }),
  meta: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
    })
    .optional(),
});
export type Copy = z.infer<typeof Copy>;
