import { z } from "zod";

export const Severidad = z.enum(["bloqueante", "alta", "media", "baja"]);
export type Severidad = z.infer<typeof Severidad>;

/** Una assertion del contrato (spec §6). `feature` admite "a|b" y "*". */
export const Assertion = z.object({
  id: z.string().min(1),
  categoria: z.string().min(1),
  texto: z.string().min(1),
  feature: z.string().min(1),
  severidad: Severidad,
});
export type Assertion = z.infer<typeof Assertion>;

/** validation_contract — escrito una vez por campaña, antes de generar (spec §6). */
export const ValidationContract = z.object({
  contract_id: z.string().min(1),
  aplica_a: z.string().min(1),
  regla_cobertura: z.string().min(1),
  assertions: z.array(Assertion).min(1),
});
export type ValidationContract = z.infer<typeof ValidationContract>;
