import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Dossier } from "@lpb/contracts";

// Stable mock response from LLM — includes prueba_social to test guardrail stripping
const MOCK_COPY_WITH_REVIEWS = {
  mission_id: "test-001",
  hero: { titulo: "Estudio Jurídico Profesional", cta_texto: "Consultanos" },
  areas_practica: { titulo: "Áreas de Práctica", items: ["Derecho Civil", "Derecho Laboral"] },
  prueba_social: {
    titulo: "Lo que dicen nuestros clientes",
    resenas: [{ autor: "Cliente Test", texto: "Excelente atención", rating: 5 }],
  },
  contacto: { titulo: "Contactanos" },
  meta: { title: "Estudio Jurídico Test | Buenos Aires", description: "Servicios legales profesionales" },
};

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(MOCK_COPY_WITH_REVIEWS) }],
      }),
    };
  },
}));

// Import after mock is set up
const { generateCopy } = await import("../src/index.js");

const BASE_FIELD = (valor: string) => ({
  valor,
  clase: "VERIFICADO-OBLIG" as const,
  source: "test",
  confidence: 1,
  fecha: "2026-06-23",
});

const BASE_DOSSIER: Dossier = {
  mission_id: "test-001",
  entidad: { nombre: BASE_FIELD("Estudio Test") },
  ubicacion: { ciudad: BASE_FIELD("Buenos Aires") },
  contacto: {},
};

describe("generateCopy", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("strips prueba_social when dossier has no reviews (AC-02)", async () => {
    const copy = await generateCopy({ ...BASE_DOSSIER, prueba_social: undefined });
    expect(copy.prueba_social).toBeUndefined();
  });

  it("strips prueba_social when dossier has empty reviews array (AC-02)", async () => {
    const copy = await generateCopy({
      ...BASE_DOSSIER,
      prueba_social: { resenas: [] },
    });
    expect(copy.prueba_social).toBeUndefined();
  });

  it("keeps prueba_social when dossier has real reviews", async () => {
    const copy = await generateCopy({
      ...BASE_DOSSIER,
      prueba_social: {
        resenas: [{ autor: "Cliente", texto: "Muy bueno", rating: 5 }],
      },
    });
    expect(copy.prueba_social).toBeDefined();
    expect(copy.prueba_social?.resenas.length).toBeGreaterThan(0);
  });

  it("returns valid Copy with required fields", async () => {
    const copy = await generateCopy(BASE_DOSSIER);
    expect(copy.mission_id).toBe("test-001");
    expect(copy.hero.titulo).toBeTruthy();
    expect(copy.hero.cta_texto).toBeTruthy();
    expect(copy.contacto.titulo).toBeTruthy();
  });
});
