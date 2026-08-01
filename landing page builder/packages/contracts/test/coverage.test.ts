import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { coverageCheck, validate, type ValidationContract } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const contract = (() => {
  const raw = JSON.parse(
    readFileSync(join(here, "..", "fixtures", "validation_contract.landing_legal_v2.json"), "utf8"),
  );
  const r = validate(raw, "validation_contract");
  if (!r.ok) throw new Error(r.errors.join("; "));
  return r.data as ValidationContract;
})();

describe("coverageCheck", () => {
  const fullFeatures = ["hero", "contacto", "prueba_social", "secciones_y_ensamblado"];

  it("ok cuando las features cubren todas las assertions bloqueantes", () => {
    const r = coverageCheck(contract, fullFeatures);
    expect(r.ok).toBe(true);
    expect(r.uncovered_blocking).toEqual([]);
  });

  it("detecta bloqueante sin cubrir si falta prueba_social", () => {
    const r = coverageCheck(contract, ["hero", "contacto"]);
    expect(r.ok).toBe(false);
    expect(r.uncovered_blocking).toContain("AC-02");
  });

  it("una assertion '*' requiere al menos una feature presente", () => {
    expect(coverageCheck(contract, []).uncovered_blocking).toContain("AC-01");
  });

  it("con assertions '*', cualquier feature queda cubierta (no hay ruido)", () => {
    const r = coverageCheck(contract, ["hero", "footer_inventado"]);
    expect(r.features_without_assertion).toEqual([]); // "*" matchea footer_inventado
    expect(r.ok).toBe(false); // siguen faltando bloqueantes (prueba_social)
  });

  it("marca features sin assertion en un contrato sin '*'", () => {
    const narrow: ValidationContract = {
      contract_id: "c",
      aplica_a: "x",
      regla_cobertura: "r",
      assertions: [{ id: "A", categoria: "id", texto: "t", feature: "hero", severidad: "bloqueante" }],
    };
    const r = coverageCheck(narrow, ["hero", "ruido"]);
    expect(r.features_without_assertion).toEqual(["ruido"]);
    expect(r.ok).toBe(false);
  });
});
