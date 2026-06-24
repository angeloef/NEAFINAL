import { z } from "zod";

/** handoff estructurado (spec §7) — anti-pérdida de contexto entre milestones. */
export const Handoff = z.object({
  mission_id: z.string().min(1),
  feature: z.string().min(1),
  rol: z.enum(["worker", "validador", "orquestador"]),
  modelo: z.string().min(1),
  status: z.enum(["completado", "parcial", "bloqueado"]),
  completado: z.array(z.string()).default([]),
  pendiente: z.array(z.string()).default([]),
  comandos: z
    .array(z.object({ cmd: z.string().min(1), exit: z.number().int() }))
    .default([]),
  issues_descubiertos: z.array(z.string()).default([]),
  assertions_cubiertas: z.array(z.string()).default([]),
  respeto_procedimientos: z.boolean(),
  artefacto_salida: z.string().min(1),
  commit: z.string().optional(),
});
export type Handoff = z.infer<typeof Handoff>;
