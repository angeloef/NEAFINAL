import { describe, it, expect } from "vitest";
import { assembleFromPlan } from "../src/index.js";
import { PagePlan as PagePlanSchema } from "@lpb/contracts";
import type { PagePlan, Tokens } from "@lpb/contracts";

const tokens: Tokens = {
  mission_id: "test-001",
  color: {
    primary: "#1B3A5C",
    secondary: "#C9A96E",
    surface: "#F8F6F2",
    text: "#2C2C2C",
    accent: "#C9A96E",
  },
  typography: { headingFont: "Playfair Display", bodyFont: "Lato" },
  logo: { tipo: "monograma", valor: "<svg></svg>" },
  radius: "10px",
};

// A ≥6-block plan exercising verified facts, placeholders, and image blocks.
const plan: PagePlan = {
  mission_id: "test-001",
  meta: { title: "Estudio Test", description: "Landing de prueba" },
  blocks: [
    {
      type: "hero",
      variant: "image_overlay",
      data: {
        titulo: { valor: "Defensa Legal en Oberá", clase: "VERIFICADO-OBLIG" },
        subtitulo: "Asesoramiento jurídico integral.",
        cta_texto: "Consultar",
      },
    },
    {
      type: "trust_bar",
      variant: "chips",
      data: { items: [{ valor: "Derecho Civil", clase: "VERIFICADO-OPC" }] },
    },
    {
      type: "areas",
      variant: "cards",
      data: {
        titulo: "Áreas de Práctica",
        items: [{ valor: "Familia", clase: "PLANTILLA" }],
      },
    },
    {
      type: "about",
      variant: "dark_band",
      data: {
        titulo: "El Estudio",
        texto: { valor: "Trayectoria al servicio del cliente.", clase: "PLANTILLA" },
      },
    },
    {
      type: "results",
      variant: "band",
      data: {
        titulo: "Cómo ayudamos",
        items: [{ valor: "Atención personalizada", clase: "PLANTILLA" }],
      },
    },
    {
      type: "cta_band",
      variant: "band",
      data: { titulo: "¿Necesita asesoramiento?", cta_texto: "Escríbanos" },
    },
    {
      type: "contact",
      variant: "channels",
      data: {
        titulo: "Contacto",
        telefono: { valor: "+54 3755 000000", clase: "VERIFICADO-OBLIG" },
      },
    },
    {
      type: "footer",
      variant: "nap",
      data: {
        nombre: { valor: "Estudio Test", clase: "VERIFICADO-OBLIG" },
        direccion: { valor: "Oberá, Misiones", clase: "VERIFICADO-OPC" },
        disclaimer: "Información de carácter general.",
      },
    },
  ],
};

describe("assembleFromPlan", () => {
  it("renders a self-contained document with all block content", async () => {
    const html = await assembleFromPlan(plan, tokens);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Defensa Legal en Oberá");
    expect(html).toContain("Áreas de Práctica");
    expect(html).toContain("Contacto");
    // Inline Tailwind CSS compiled into <head>.
    expect(html).toMatch(/<style>[\s\S]+<\/style>/);
  });

  it("emits exactly one h1", async () => {
    const html = await assembleFromPlan(plan, tokens);
    expect(html.match(/<h1/g)?.length).toBe(1);
  });

  it("tags placeholder data and not verified facts", async () => {
    const html = await assembleFromPlan(plan, tokens);
    expect(html).toContain('data-placeholder="true"');
    // Verified hero title is not tagged as placeholder.
    expect(html).not.toMatch(/Defensa Legal en Oberá<sup/);
  });

  it("includes schema.org LegalService JSON-LD in the footer", async () => {
    const html = await assembleFromPlan(plan, tokens);
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"LegalService"');
  });

  it("uses distinct images per image-backed block (no repetition)", async () => {
    const html = await assembleFromPlan(plan, tokens);
    const urls = [...html.matchAll(/src="(https:\/\/images\.unsplash[^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(urls.length).toBeGreaterThanOrEqual(3); // hero, about, cta_band
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("accepts a plan that satisfies the PagePlan schema", () => {
    expect(() => PagePlanSchema.parse(plan)).not.toThrow();
  });
});
