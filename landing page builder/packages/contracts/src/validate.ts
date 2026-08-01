import { z } from "zod";
import { schemas, type ArtefactName } from "./schemas/index.js";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

/** Formatea issues de Zod a mensajes legibles "ruta: mensaje". */
const formatIssues = (error: z.ZodError): string[] =>
  error.issues.map((i) => {
    const path = i.path.length ? i.path.join(".") : "(raíz)";
    return `${path}: ${i.message}`;
  });

/** Valida un artefacto contra el schema de su tipo. */
export function validate<K extends ArtefactName>(
  artefacto: unknown,
  tipo: K,
): ValidationResult<z.infer<(typeof schemas)[K]>> {
  // El tipo está acotado por `ArtefactName`, pero los subagentes/runtime pueden
  // pasar un string arbitrario; este guard es la red de seguridad en runtime.
  const schema = schemas[tipo];
  if (!schema) {
    return { ok: false, errors: [`tipo de artefacto desconocido: ${String(tipo)}`] };
  }
  const result = schema.safeParse(artefacto);
  if (result.success) {
    return { ok: true, data: result.data as z.infer<(typeof schemas)[K]> };
  }
  return { ok: false, errors: formatIssues(result.error) };
}
