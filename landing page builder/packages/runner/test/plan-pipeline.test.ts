import { describe, it, expect } from "vitest";
import type { Dossier } from "@lpb/contracts";
import { runPlanPipeline } from "../src/plan-pipeline.js";

const field = (valor: string) => ({
  valor,
  clase: "VERIFICADO-OBLIG" as const,
  source: "test",
  confidence: 1,
  fecha: "2026-06-23",
});

const dossier: Dossier = {
  mission_id: "koziarski_obera",
  entidad: { nombre: field("Estudio Koziarski") },
  ubicacion: { ciudad: field("Oberá") },
  contacto: { telefono: field("+54 3755 000000") },
};

const fact = (valor: string, clase = "PLANTILLA") => ({ valor, clase });

const rawPlan = {
  mission_id: "koziarski_obera",
  meta: { title: "Estudio Koziarski — Oberá", description: "Asesoramiento jurídico en Oberá, Misiones." },
  blocks: [
    { type: "hero", variant: "image_overlay", data: { titulo: fact("Defensa legal en Oberá", "VERIFICADO-OBLIG"), subtitulo: "Asesoramiento jurídico integral.", cta_texto: "Consultar" } },
    { type: "trust_bar", variant: "chips", data: { items: [fact("Derecho Civil"), fact("Familia")] } },
    { type: "areas", variant: "cards", data: { titulo: "Áreas de Práctica", items: [fact("Derecho Civil"), fact("Derecho Laboral")] } },
    { type: "about", variant: "dark_band", data: { titulo: "El Estudio", texto: fact("Trayectoria al servicio del cliente.") } },
    { type: "process", variant: "steps", data: { titulo: "Cómo trabajamos", pasos: [{ titulo: "Consulta", descripcion: "Escuchamos su caso." }] } },
    { type: "cta_band", variant: "band", data: { titulo: "¿Necesita asesoramiento?", cta_texto: "Escríbanos" } },
    { type: "contact", variant: "channels", data: { titulo: "Contacto", telefono: fact("+54 3755 000000", "VERIFICADO-OBLIG") } },
    { type: "footer", variant: "nap", data: { nombre: fact("Estudio Koziarski", "VERIFICADO-OBLIG"), disclaimer: "Información de carácter general." } },
  ],
};

describe("runPlanPipeline", () => {
  it("produces a valid self-contained landing and passes the quality gate", async () => {
    const result = await runPlanPipeline(dossier, rawPlan);

    expect(result.plan.blocks).toHaveLength(8);
    expect(result.html).toContain("<!doctype html>");
    expect(result.html).toContain("Defensa legal en Oberá");
    expect(result.html).toContain('"@type":"LegalService"');
    expect(result.tokens.color.primary).toMatch(/^#/);

    expect(result.quality.status).toBe("pass");
    expect(result.quality.assertions_falladas).toHaveLength(0);
  });

  it("throws on a structurally invalid plan", async () => {
    await expect(runPlanPipeline(dossier, { mission_id: "x", blocks: [] })).rejects.toThrow();
  });
});
