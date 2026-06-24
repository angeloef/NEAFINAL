import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validate, type Copy, type Tokens, type Handoff, type MissionState } from "../src/index.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");
const load = (name: string) => JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));

describe("dossier", () => {
  it.each(["dossier.flosi.json", "dossier.koziarski.json", "dossier.drossler.json"])(
    "acepta fixture válido %s",
    (file) => {
      expect(validate(load(file), "dossier").ok).toBe(true);
    },
  );

  it("flosi (rico) trae prueba_social y áreas", () => {
    const r = validate(load("dossier.flosi.json"), "dossier");
    expect(r.ok && r.data.prueba_social?.resenas.length).toBeGreaterThan(0);
  });

  it("rechaza dossier sin nombre con mensaje legible", () => {
    const bad = load("dossier.koziarski.json");
    delete bad.entidad.nombre;
    const r = validate(bad, "dossier");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.join(" ")).toContain("entidad.nombre");
  });

  it("rechaza clase de campo inválida", () => {
    const bad = load("dossier.koziarski.json");
    bad.entidad.nombre.clase = "NO-EXISTE";
    expect(validate(bad, "dossier").ok).toBe(false);
  });
});

describe("validation_contract", () => {
  it("carga y parsea landing_legal_v2", () => {
    const r = validate(load("validation_contract.landing_legal_v2.json"), "validation_contract");
    expect(r.ok && r.data.assertions.length).toBe(11);
  });

  it("rechaza severidad inválida", () => {
    const bad = load("validation_contract.landing_legal_v2.json");
    bad.assertions[0].severidad = "critico";
    expect(validate(bad, "validation_contract").ok).toBe(false);
  });
});

describe("copy / tokens / handoff / mission_state", () => {
  const copy: Copy = {
    mission_id: "koziarski_obera",
    hero: { titulo: "Estudio Koziarski", cta_texto: "Consultá por WhatsApp" },
    contacto: { titulo: "Contacto", whatsapp: "+5493755111111" },
  };
  const tokens: Tokens = {
    mission_id: "koziarski_obera",
    color: { primary: "#1a2b3c", surface: "#ffffff", text: "#111111" },
    typography: { headingFont: "Fraunces", bodyFont: "Inter" },
    logo: { tipo: "monograma", valor: "DK" },
  };
  const handoff: Handoff = {
    mission_id: "koziarski_obera",
    feature: "copy",
    rol: "worker",
    modelo: "sonnet-4-6",
    status: "completado",
    respeto_procedimientos: true,
    artefacto_salida: "copy.json",
  };
  const mission: MissionState = {
    mission_id: "koziarski_obera",
    estado: "ejecutando",
    milestone_actual: 2,
    presupuesto: { tokens_max: 100000, tokens_usados: 12000, usd_max: 5 },
  };

  it("acepta fixtures válidos", () => {
    expect(validate(copy, "copy").ok).toBe(true);
    expect(validate(tokens, "tokens").ok).toBe(true);
    expect(validate(handoff, "handoff").ok).toBe(true);
    expect(validate(mission, "mission_state").ok).toBe(true);
  });

  it("rechaza color hex inválido en tokens", () => {
    expect(validate({ ...tokens, color: { ...tokens.color, primary: "rojo" } }, "tokens").ok).toBe(false);
  });

  it("rechaza estado de misión inválido", () => {
    expect(validate({ ...mission, estado: "volando" }, "mission_state").ok).toBe(false);
  });

  it("rechaza tipo de artefacto desconocido", () => {
    // @ts-expect-error tipo inválido a propósito
    expect(validate(copy, "inexistente").ok).toBe(false);
  });
});
