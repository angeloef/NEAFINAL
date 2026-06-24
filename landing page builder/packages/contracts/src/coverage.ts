import type { Assertion, ValidationContract } from "./schemas/validationContract.js";

/** Los targets de feature de una assertion ("hero|contacto" -> ["hero","contacto"]). */
const targets = (a: Assertion): string[] => a.feature.split("|").map((s) => s.trim());

/** ¿La feature `f` es objetivo de la assertion `a`? ("*" aplica a todas.) */
const matches = (a: Assertion, f: string): boolean =>
  a.feature === "*" || targets(a).includes(f);

/** ¿La assertion `a` queda cubierta por el conjunto de features presentes? */
const isCovered = (a: Assertion, features: string[]): boolean =>
  a.feature === "*" ? features.length > 0 : targets(a).some((t) => features.includes(t));

export interface CoverageResult {
  ok: boolean;
  /** Assertions bloqueantes sin cubrir por las features presentes. */
  uncovered_blocking: string[];
  /** Features presentes que no cubren ninguna assertion (ruido / typo). */
  features_without_assertion: string[];
}

/**
 * Regla del contrato (spec §6): cada feature cubre >=1 assertion y la unión de
 * features cubre el 100% de las assertions bloqueantes.
 */
export function coverageCheck(
  contract: ValidationContract,
  features: string[],
): CoverageResult {
  const uncovered_blocking = contract.assertions
    .filter((a) => a.severidad === "bloqueante" && !isCovered(a, features))
    .map((a) => a.id);

  // ponytail: una assertion "*" cuenta como objetivo de cualquier feature (es
  // spec: "*" aplica a todas). Por eso un contrato 100% "*" nunca marca features
  // como ruido — es intencional. Los contratos reales tienen assertions con
  // feature explícito, así que los typos de feature sí se detectan.
  const features_without_assertion = features.filter(
    (f) => !contract.assertions.some((a) => matches(a, f)),
  );

  return {
    ok: uncovered_blocking.length === 0 && features_without_assertion.length === 0,
    uncovered_blocking,
    features_without_assertion,
  };
}
