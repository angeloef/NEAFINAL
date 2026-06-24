import type { Copy } from "@lpb/contracts";
import { escapeHtml, extractFirmName, extractCity } from "./shared.js";

// Generic, legally-safe value props (no guarantees, no comparative superiority — Ley 23.187).
const VALUES = [
  {
    title: "Trato directo",
    text: "Hablás directamente con el profesional a cargo, sin intermediarios.",
    icon: `<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM3 21a9 9 0 0 1 18 0"/>`,
  },
  {
    title: "Enfoque integral",
    text: "Analizamos cada situación en su contexto, con seguimiento de todo el proceso.",
    icon: `<path d="M3 7h18M3 12h18M3 17h12"/>`,
  },
  {
    title: "Cercanía regional",
    text: "Atención a clientes de la ciudad y de toda la región.",
    icon: `<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>`,
  },
];

export function aboutSection(copy: Copy): string {
  const firm = extractFirmName(copy.hero.titulo);
  const city = extractCity(copy);
  const where = city ? `en ${escapeHtml(city)} y la región` : "en la región";

  const cards = VALUES.map(
    (v) => `
        <article class="value-card">
          <span class="value-icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${v.icon}</svg></span>
          <h3 class="value-title">${v.title}</h3>
          <p class="value-text">${v.text}</p>
        </article>`,
  ).join("\n");

  return `
    <section id="sobre" class="about">
      <div class="about-bg" role="img" aria-label="Biblioteca jurídica"></div>
      <div class="about-overlay"></div>
      <div class="section-container">
        <p class="section-eyebrow light">El Estudio</p>
        <h2 class="about-title">Asesoramiento con compromiso y cercanía</h2>
        <p class="about-text">En ${escapeHtml(firm)} acompañamos a cada cliente con atención personalizada ${where}, con trato directo y seguimiento de cada caso.</p>
        <div class="about-values">
${cards}
        </div>
      </div>
    </section>`;
}
