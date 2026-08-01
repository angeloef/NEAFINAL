import { z } from "zod";

/** mission_state / Mission Control (spec §8). */
export const MissionState = z.object({
  mission_id: z.string().min(1),
  estado: z.enum([
    "planificando",
    "ejecutando",
    "validando",
    "en_cola",
    "aprobado",
    "presentado",
  ]),
  milestone_actual: z.number().int().min(0),
  presupuesto: z.object({
    tokens_max: z.number().min(0),
    tokens_usados: z.number().min(0),
    usd_max: z.number().min(0),
  }),
  features: z
    .array(
      z.object({
        id: z.string().min(1),
        estado: z.string().min(1),
        assertions: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  validaciones: z
    .array(
      z.object({
        tipo: z.enum(["scrutiny", "user_testing"]),
        resultado: z.enum(["pass", "fail"]),
        assertions_falladas: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  follow_up_features: z.array(z.string()).default([]),
  handoffs: z.array(z.string()).default([]),
});
export type MissionState = z.infer<typeof MissionState>;
