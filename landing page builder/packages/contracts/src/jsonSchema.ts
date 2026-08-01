import { zodToJsonSchema } from "zod-to-json-schema";
import { schemas, type ArtefactName } from "./schemas/index.js";

/** JSON Schema de un artefacto, para inyectar en prompts de subagentes. */
export const toJsonSchema = (tipo: ArtefactName) =>
  zodToJsonSchema(schemas[tipo], tipo);

/** JSON Schema de los 6 artefactos. */
export const allJsonSchemas = (): Record<string, unknown> =>
  Object.fromEntries(
    (Object.keys(schemas) as ArtefactName[]).map((k) => [k, toJsonSchema(k)]),
  );
