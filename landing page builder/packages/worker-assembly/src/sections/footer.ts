import type { Copy } from "@lpb/contracts";
import { escapeHtml, extractFirmName, extractCity } from "./shared.js";

const DISCLAIMER =
  "La información de este sitio tiene carácter general y no constituye asesoramiento legal para un caso concreto. Consulte a un profesional matriculado.";

export function footerSection(copy: Copy): string {
  const firmName = extractFirmName(copy.hero.titulo);
  const city = extractCity(copy);
  const areas = copy.areas_practica?.items ?? [];
  const tel = copy.contacto.telefono;

  const areasList = areas.length
    ? `<ul class="footer-areas">${areas
        .slice(0, 6)
        .map((a) => `<li>${escapeHtml(a)}</li>`)
        .join("")}</ul>`
    : "";

  return `
    <footer class="site-footer">
      <div class="section-container">
        <div class="footer-grid">
          <div class="footer-brand">
            <p class="footer-name">${escapeHtml(firmName)}</p>
            ${city ? `<p class="footer-city">${escapeHtml(city)}, Misiones — Argentina</p>` : ""}
            ${tel ? `<p class="footer-tel">Tel. ${escapeHtml(tel)}</p>` : ""}
          </div>
          ${areasList ? `<div class="footer-col"><p class="footer-col-title">Áreas</p>${areasList}</div>` : ""}
        </div>
        <p class="footer-disclaimer">${DISCLAIMER}</p>
        <p class="footer-text">&copy; ${new Date().getFullYear()} ${escapeHtml(firmName)}. Todos los derechos reservados.</p>
      </div>
    </footer>`;
}
