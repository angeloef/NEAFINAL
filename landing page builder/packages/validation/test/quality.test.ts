import { describe, it, expect } from "vitest";
import { runQualityGate } from "../src/quality.js";
import type { PagePlan, Tokens } from "@lpb/contracts";

function fact(valor: string) {
  return { valor, clase: "VERIFICADO-OBLIG" as const };
}

/** A minimal valid plan: 6 blocks incl. hero/contact/footer. */
function goodPlan(): PagePlan {
  return {
    mission_id: "m1",
    meta: { title: "T", description: "D" },
    blocks: [
      { type: "hero", variant: "v", data: { titulo: fact("Hero"), cta_texto: "Ir" } },
      { type: "areas", variant: "v", data: { titulo: "Áreas", items: [fact("Civil")] } },
      { type: "process", variant: "v", data: { titulo: "Proceso", pasos: [{ titulo: "1", descripcion: "x" }] } },
      { type: "faq", variant: "v", data: { titulo: "FAQ", items: [{ pregunta: "p", respuesta: "r" }] } },
      { type: "contact", variant: "v", data: { titulo: "Contacto", telefono: fact("+54 1") } },
      { type: "footer", variant: "v", data: { nombre: fact("Estudio") } },
    ],
  };
}

const goodTokens: Tokens = {
  mission_id: "m1",
  color: { primary: "#1B3A5C", surface: "#FFFFFF", text: "#1A1A1A" },
  typography: { headingFont: "Merriweather", bodyFont: "Open Sans" },
  logo: { tipo: "real", valor: "https://example.com/l.png" },
};

const goodHtml = `<!doctype html><html><head></head><body>
<h1>Hero</h1><h2>Áreas</h2>
<img src="https://images.unsplash.com/photo-a?w=1" />
<img src="https://images.unsplash.com/photo-b?w=1" />
</body></html>`;

describe("runQualityGate", () => {
  it("passes a complete, well-formed page", () => {
    const r = runQualityGate({ mission_id: "m1", plan: goodPlan(), html: goodHtml, tokens: goodTokens });
    expect(r.status).toBe("pass");
    expect(r.assertions_falladas).toHaveLength(0);
  });

  it("QL-01 fails when below the block minimum or missing required blocks", () => {
    const plan = goodPlan();
    plan.blocks = plan.blocks.slice(0, 3); // 3 blocks, no contact/footer
    const r = runQualityGate({ mission_id: "m1", plan });
    const ql01 = r.assertions_falladas.filter((a) => a.assertion_id === "QL-01");
    expect(ql01.length).toBeGreaterThanOrEqual(1);
    expect(r.status).toBe("fail");
  });

  it("QL-02 fails on duplicate image URLs", () => {
    const dup = `<h1>x</h1><h2>y</h2><img src="https://images.unsplash.com/photo-a?w=1" /><img src="https://images.unsplash.com/photo-a?w=1" />`;
    const r = runQualityGate({ mission_id: "m1", html: dup });
    expect(r.assertions_falladas.some((a) => a.assertion_id === "QL-02")).toBe(true);
  });

  it("QL-03 fails when a fact field carries an invalid clase", () => {
    const plan = goodPlan();
    // @ts-expect-error — intentionally corrupt the clase for the test
    plan.blocks[0].data.titulo.clase = "INVENTADO";
    const r = runQualityGate({ mission_id: "m1", plan });
    expect(r.assertions_falladas.some((a) => a.assertion_id === "QL-03")).toBe(true);
  });

  it("QL-04 fails on multiple h1s, missing h2, or failing contrast", () => {
    const badHtml = `<h1>a</h1><h1>b</h1>`; // two h1, no h2
    const r1 = runQualityGate({ mission_id: "m1", html: badHtml });
    expect(r1.assertions_falladas.some((a) => a.assertion_id === "QL-04")).toBe(true);

    const lowContrast: Tokens = { ...goodTokens, color: { primary: "#777", surface: "#FFFFFF", text: "#EEEEEE" } };
    const r2 = runQualityGate({ mission_id: "m1", html: goodHtml, tokens: lowContrast });
    expect(r2.assertions_falladas.some((a) => a.assertion_id === "QL-04")).toBe(true);
  });
});
