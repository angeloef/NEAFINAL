import { z } from "zod";
import { StringField, StringArrayField } from "./dataField.js";

/** Una reseña real (única fuente válida de prueba social — AC-02). */
export const Resena = z.object({
  autor: z.string().min(1),
  texto: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * dossier.json — salida del worker Research (spec §12).
 * Cada dato fáctico es un DataField con clase/source/confidence.
 */
export const Dossier = z.object({
  mission_id: z.string().min(1),
  entidad: z.object({
    nombre: StringField,
    tipo: StringField.optional(),
  }),
  ubicacion: z.object({
    ciudad: StringField,
    zona: StringField.optional(),
    direccion: StringField.optional(),
  }),
  contacto: z
    .object({
      telefono: StringField.optional(),
      whatsapp: StringField.optional(),
      email: StringField.optional(),
    })
    .default({}),
  place_id: StringField.optional(),
  areas_practica: StringArrayField.optional(),
  prueba_social: z
    .object({
      resenas: z.array(Resena).default([]),
    })
    .optional(),
  estado_web: z.enum(["sin_web", "web_basica", "web_propia", "referencia"]).optional(),
});
export type Dossier = z.infer<typeof Dossier>;
