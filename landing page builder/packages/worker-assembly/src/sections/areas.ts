import type { Copy } from "@lpb/contracts";
import { escapeHtml } from "./shared.js";

// Simple scales-of-justice glyph reused per card (decorative).
const AREA_ICON = `<svg class="area-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M5 7h14M7 21h10M5 7l-3 6a3 3 0 0 0 6 0L5 7zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z"/></svg>`;

export function areasSection(copy: Copy): string {
  if (!copy.areas_practica) return "";

  const items = copy.areas_practica.items
    .map(
      (item) =>
        `<li class="area-item">${AREA_ICON}<span class="area-label">${escapeHtml(item)}</span></li>`,
    )
    .join("\n");

  return `
    <section id="areas" class="areas">
      <div class="section-container">
        <p class="section-eyebrow">Asesoramiento</p>
        <h2 class="section-title">${escapeHtml(copy.areas_practica.titulo)}</h2>
        <ul class="areas-grid">${items}</ul>
      </div>
    </section>`;
}
