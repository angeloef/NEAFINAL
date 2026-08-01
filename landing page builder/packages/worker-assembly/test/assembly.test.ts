import { describe, it, expect } from "vitest";
import { assembleLanding } from "../src/index.js";
import type { Copy, Tokens } from "@lpb/contracts";

// ── Fixtures ──────────────────────────────────────────────────────────────

const fullCopy: Copy = {
  mission_id: "test-001",
  hero: {
    titulo: "Estudio Jurídico Hernández & Asociados",
    subtitulo: "Más de 20 años defendiendo sus derechos con excelencia y compromiso.",
    cta_texto: "Solicite una consulta gratuita",
  },
  areas_practica: {
    titulo: "Áreas de Práctica",
    items: [
      "Derecho Corporativo",
      "Derecho Civil",
      "Derecho Laboral",
      "Derecho Penal",
      "Derecho de Familia",
      "Propiedad Intelectual",
    ],
  },
  prueba_social: {
    titulo: "Lo que dicen nuestros clientes",
    resenas: [
      {
        autor: "María García",
        texto: "Excelente atención, resolvieron mi caso rápidamente.",
        rating: 5,
      },
      {
        autor: "Juan Pérez",
        texto: "Profesionales de primer nivel. Muy recomendados.",
        rating: 4,
      },
    ],
  },
  contacto: {
    titulo: "Contáctenos",
    telefono: "+52 55 1234 5678",
    whatsapp: "+52 55 1234 5678",
    email: "contacto@hernandez-asociados.com",
  },
  meta: {
    title: "Estudio Jurídico Hernández & Asociados — Abogados en Ciudad de México",
    description:
      "Abogados expertos en Ciudad de México. Derecho corporativo, civil, laboral y más.",
  },
};

const minimalCopy: Copy = {
  mission_id: "test-002",
  hero: {
    titulo: "Bufete Jurídico Profesional",
    cta_texto: "Contáctenos",
  },
  contacto: {
    titulo: "Contacto",
  },
};

const noSocialCopy: Copy = {
  mission_id: "test-003",
  hero: {
    titulo: "Estudio Legal",
    cta_texto: "Llámenos",
  },
  contacto: {
    titulo: "Contacto",
    whatsapp: "525512345678",
  },
};

const emptySocialCopy: Copy = {
  mission_id: "test-004",
  hero: {
    titulo: "Estudio Legal",
    cta_texto: "Llámenos",
  },
  areas_practica: {
    titulo: "Áreas",
    items: ["Derecho Civil"],
  },
  prueba_social: {
    titulo: "Testimonios",
    resenas: [],
  },
  contacto: {
    titulo: "Contacto",
  },
};

const monogramaTokens: Tokens = {
  mission_id: "test-001",
  color: {
    primary: "#1B3A5C",
    secondary: "#C9A96E",
    surface: "#F8F6F2",
    text: "#2C2C2C",
    accent: "#C9A96E",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Lato",
  },
  logo: {
    tipo: "monograma",
    valor: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="10" fill="currentColor"/><text x="50" y="68" font-size="50" font-weight="bold" text-anchor="middle" fill="#fff">H</text></svg>',
  },
  radius: "10px",
};

const realLogoTokens: Tokens = {
  mission_id: "test-002",
  color: {
    primary: "#2C5F2D",
    surface: "#FFFFFF",
    text: "#1A1A1A",
  },
  typography: {
    headingFont: "Merriweather",
    bodyFont: "Open Sans",
  },
  logo: {
    tipo: "real",
    valor: "https://example.com/logo.png",
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe("assembleLanding", () => {
  it("Test 1: Full assembly with all sections produces valid HTML", async () => {
    const html = await assembleLanding(fullCopy, monogramaTokens);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=");
    expect(html).toContain("</html>");

    // All sections present
    expect(html).toContain('id="header"');
    expect(html).toContain('id="areas"');
    expect(html).toContain('id="prueba-social"');
    expect(html).toContain('id="contacto"');
    expect(html).toContain("site-footer");

    // Content
    expect(html).toContain("Estudio Jurídico Hernández &amp; Asociados");
    expect(html).toContain("Solicite una consulta gratuita");
    expect(html).toContain("Derecho Corporativo");
    expect(html).toContain("María García");
  });

  it("Test 2: Missing areas_practica omits the section", async () => {
    const html = await assembleLanding(noSocialCopy, realLogoTokens);
    expect(html).not.toContain('id="areas"');
  });

  it("Test 3: Missing prueba_social omits the section (AC-02)", async () => {
    const html = await assembleLanding(noSocialCopy, realLogoTokens);
    expect(html).not.toContain('id="prueba-social"');
  });

  it("Test 4: Empty reviews array omits social proof (AC-02)", async () => {
    const html = await assembleLanding(emptySocialCopy, monogramaTokens);
    expect(html).not.toContain('id="prueba-social"');
    // But areas should still be present
    expect(html).toContain('id="areas"');
  });

  it("Test 5: CTA-01: WhatsApp and phone links use clean number format", async () => {
    const html = await assembleLanding(fullCopy, monogramaTokens);
    // +52 55 1234 5678 cleaned → 525512345678 (no +, no spaces)
    expect(html).toContain('href="https://wa.me/525512345678"');
    // Phone link uses tel: with cleaned number
    expect(html).toContain('href="tel:525512345678"');
  });

  it("Test 6: CSS custom properties set from tokens", async () => {
    const html = await assembleLanding(fullCopy, monogramaTokens);
    expect(html).toContain("--color-primary: #1B3A5C");
    expect(html).toContain('--color-secondary: #C9A96E');
    expect(html).toContain("--color-surface: #F8F6F2");
    expect(html).toContain("--color-text: #2C2C2C");
    expect(html).toContain('--font-heading: "Playfair Display"');
    expect(html).toContain('--font-body: "Lato"');
    expect(html).toContain("--radius: 10px");
  });

  it("Test 7: CP-01: Minimal copy with only hero+contacto works without errors", async () => {
    const html = await assembleLanding(minimalCopy, realLogoTokens);
    expect(html).toContain("Bufete Jurídico Profesional");
    expect(html).toContain("Contáctenos");
    expect(html).not.toContain('id="areas"');
    expect(html).not.toContain('id="prueba-social"');
    expect(html).toContain("site-footer");
  });

  it("Test 8: Monogram renders SVG inline; real logo renders img tag", async () => {
    const monoHtml = await assembleLanding(fullCopy, monogramaTokens);
    expect(monoHtml).toContain("monograma");
    expect(monoHtml).toContain("<svg");

    const realHtml = await assembleLanding(noSocialCopy, realLogoTokens);
    expect(realHtml).toContain('<img src="https://example.com/logo.png"');
    expect(realHtml).toContain('alt="Logo del estudio"');
  });

  it("Test 9: Google Fonts links present for both heading and body fonts", async () => {
    const html = await assembleLanding(fullCopy, monogramaTokens);
    expect(html).toContain("fonts.googleapis.com");
    // encodeURIComponent turns space into %20
    expect(html).toContain("Playfair%20Display");
    expect(html).toContain("Lato");
  });

  it("Test 10: Meta title and description are rendered", async () => {
    const html = await assembleLanding(fullCopy, monogramaTokens);
    expect(html).toContain(
      "<title>Estudio Jurídico Hernández &amp; Asociados — Abogados en Ciudad de México</title>",
    );
    expect(html).toContain('name="description"');
  });
});
