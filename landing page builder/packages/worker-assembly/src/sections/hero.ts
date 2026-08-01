import type { Copy, Tokens } from "@lpb/contracts";
import { escapeHtml, extractCity } from "./shared.js";
import { STOCK } from "./images.js";

export function heroSection(copy: Copy, tokens: Tokens): string {
  const logoHtml = renderLogo(tokens);
  const city = extractCity(copy);
  const kicker = city ? `Estudio Jurídico · ${escapeHtml(city)}` : "Estudio Jurídico";

  return `
    <header id="header" class="hero">
      <div class="hero-bg" role="img" aria-label="Fachada de tribunales con columnas clásicas"></div>
      <div class="hero-overlay"></div>
      <div class="hero-container">
        ${logoHtml}
        <p class="hero-kicker">${kicker}</p>
        <h1 class="hero-title">${escapeHtml(copy.hero.titulo)}</h1>
        ${
          copy.hero.subtitulo
            ? `<p class="hero-subtitle">${escapeHtml(copy.hero.subtitulo)}</p>`
            : ""
        }
        <a href="#contacto" class="cta-button">${escapeHtml(copy.hero.cta_texto)}</a>
      </div>
    </header>`;
}

function renderLogo(tokens: Tokens): string {
  if (tokens.logo.tipo === "monograma") {
    return `<div class="logo monograma" aria-label="Monograma del estudio">${tokens.logo.valor}</div>`;
  }
  return `<div class="logo"><img src="${escapeHtml(tokens.logo.valor)}" alt="Logo del estudio" class="logo-img" /></div>`;
}

/** Hero background image URL (free-use) — consumed by layout CSS. */
export const HERO_BG_URL = STOCK.heroBg;
