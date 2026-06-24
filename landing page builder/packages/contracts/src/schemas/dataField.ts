import { z } from "zod";

/**
 * Clase de campo de dato (spec §4.3 fact-check, §6 AC-01).
 * Solo los campos VERIFICADO-* pueden renderizarse como hechos.
 */
export const FieldClass = z.enum([
  "VERIFICADO-OBLIG",
  "VERIFICADO-OPC",
  "PLANTILLA",
  "INFERIDO",
]);
export type FieldClass = z.infer<typeof FieldClass>;

/** Un dato del dossier siempre viaja con su procedencia y confianza. */
export const dataField = <T extends z.ZodTypeAny>(valor: T) =>
  z.object({
    valor,
    clase: FieldClass,
    source: z.string().min(1),
    confidence: z.number().min(0).max(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fecha debe ser YYYY-MM-DD"),
  });

/** DataField de string, el caso más común. */
export const StringField = dataField(z.string().min(1));
export type StringField = z.infer<typeof StringField>;

/** DataField de lista de strings (p.ej. áreas de práctica). Nombrado para
 *  identidad de schema estable (dedup de $ref en JSON Schema). */
export const StringArrayField = dataField(z.array(z.string().min(1)));
export type StringArrayField = z.infer<typeof StringArrayField>;

/** Una clase cuenta como "verificada" para el fact-check legal. */
export const isVerified = (clase: FieldClass): boolean =>
  clase === "VERIFICADO-OBLIG" || clase === "VERIFICADO-OPC";
