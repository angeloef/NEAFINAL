import { describe, it, expect } from "vitest";
import type { Dossier } from "@lpb/contracts";
import { parsePagePlan, buildPagePlanPrompt, PagePlanPolicyError } from "../src/pageplan.js";

const field = (valor: string) => ({
  valor,
  clase: "VERIFICADO-OBLIG" as const,
  source: "test",
  confidence: 1,
  fecha: "2026-06-23",
});

const dossierNoReviews: Dossier = {
  mission_id: "m1",
  entidad: { nombre: field("Estudio Test") },
  ubicacion: { ciudad: field("Oberá") },
  contacto: {},
};

const dossierWithReviews: Dossier = {
  ...dossierNoReviews,
  prueba_social: { resenas: [{ autor: "Cliente", texto: "Muy bueno", rating: 5 }] },
};

const fact = (valor: string, clase = "PLANTILLA") => ({ valor, clase });

function validPlan() {
  return {
    mission_id: "m1",
    meta: { title: "T", description: "D" },
    blocks: [
      { type: "hero", variant: "centered", data: { titulo: fact("Hero", "VERIFICADO-OBLIG"), cta_texto: "Ir" } },
      { type: "areas", variant: "cards", data: { titulo: "Áreas", items: [fact("Civil")] } },
      { type: "process", variant: "steps", data: { titulo: "Proceso", pasos: [{ titulo: "1", descripcion: "x" }] } },
      { type: "faq", variant: "accordion", data: { titulo: "FAQ", items: [{ pregunta: "p", respuesta: "r" }] } },
      { type: "contact", variant: "channels", data: { titulo: "Contacto", telefono: fact("+54 1", "VERIFICADO-OBLIG") } },
      { type: "footer", variant: "nap", data: { nombre: fact("Estudio", "VERIFICADO-OBLIG") } },
    ],
  };
}

describe("parsePagePlan", () => {
  it("accepts a valid policy-compliant plan (string or object)", () => {
    const plan = parsePagePlan(validPlan(), dossierNoReviews);
    expect(plan.blocks).toHaveLength(6);
    const fromString = parsePagePlan("```json\n" + JSON.stringify(validPlan()) + "\n```", dossierNoReviews);
    expect(fromString.mission_id).toBe("m1");
  });

  it("rejects structurally invalid output", () => {
    expect(() => parsePagePlan({ mission_id: "m1", blocks: [] }, dossierNoReviews)).toThrow(
      PagePlanPolicyError,
    );
  });

  it("rejects an invented figure presented as verified (LG-01)", () => {
    const plan = validPlan();
    plan.blocks.push({
      type: "results",
      variant: "band",
      data: { titulo: "Resultados", items: [fact("+200 casos ganados", "VERIFICADO-OBLIG")] },
    } as never);
    expect(() => parsePagePlan(plan, dossierNoReviews)).toThrow(/LG-01/);
  });

  it("allows non-numeric placeholder results", () => {
    const plan = validPlan();
    plan.blocks.push({
      type: "results",
      variant: "band",
      data: { titulo: "Cómo ayudamos", items: [fact("Atención personalizada", "PLANTILLA")] },
    } as never);
    expect(() => parsePagePlan(plan, dossierNoReviews)).not.toThrow();
  });

  it("rejects verified testimonials when the dossier has no reviews (AC-02)", () => {
    const plan = validPlan();
    plan.blocks.push({
      type: "testimonials",
      variant: "quotes",
      data: { titulo: "Reseñas", resenas: [{ autor: fact("Juan", "VERIFICADO-OBLIG"), texto: fact("Genial", "VERIFICADO-OBLIG") }] },
    } as never);
    expect(() => parsePagePlan(plan, dossierNoReviews)).toThrow(/AC-02/);
    // Same plan is fine when reviews exist.
    expect(() => parsePagePlan(plan, dossierWithReviews)).not.toThrow();
  });
});

describe("buildPagePlanPrompt", () => {
  it("signals review availability and lists the block catalog", () => {
    const noReviews = buildPagePlanPrompt(dossierNoReviews);
    expect(noReviews.user).toContain("NO incluir testimonials");
    expect(noReviews.system).toContain("BLOQUES DISPONIBLES");
    const withReviews = buildPagePlanPrompt(dossierWithReviews);
    expect(withReviews.user).toContain("testimonials permitido");
  });
});
