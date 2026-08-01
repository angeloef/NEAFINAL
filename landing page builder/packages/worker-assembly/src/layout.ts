import type { Copy, Tokens } from "@lpb/contracts";
import { heroSection } from "./sections/hero.js";
import { areasSection } from "./sections/areas.js";
import { socialSection } from "./sections/social.js";
import { contactSection } from "./sections/contact.js";
import { footerSection } from "./sections/footer.js";
import { aboutSection } from "./sections/about.js";
import { STOCK } from "./sections/images.js";

/**
 * Build a complete HTML5 landing page from Copy and Tokens.
 * Dark-luxury law-firm direction: serif display + sans body, navy + metallic
 * accent, alternating light/dark sections, free-use stock imagery.
 */
export function buildFullPage(copy: Copy, tokens: Tokens): string {
  const sections = [
    heroSection(copy, tokens),
    areasSection(copy),
    socialSection(copy),
    aboutSection(copy),
    contactSection(copy),
    footerSection(copy),
  ]
    .filter(Boolean)
    .join("\n");

  const cssVars = buildCssVars(tokens);
  const fontLinks = buildFontLinks(tokens);
  const css = buildStyles();
  const imageVars = buildImageVars();

  const metaTitle = copy.meta?.title ?? "Estudio Jurídico — Asesoría Legal Profesional";
  const metaDesc =
    copy.meta?.description ??
    "Servicios legales profesionales con experiencia y dedicación.";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}" />
  ${fontLinks}
  <style>
:root {
${cssVars.join("\n")}
${imageVars}
}
${css}
  </style>
</head>
<body>
${sections}
</body>
</html>`;
}

function buildCssVars(tokens: Tokens): string[] {
  const vars: string[] = [];
  const c = tokens.color;
  vars.push(`  --color-primary: ${c.primary};`);
  if (c.secondary) vars.push(`  --color-secondary: ${c.secondary};`);
  vars.push(`  --color-surface: ${c.surface};`);
  vars.push(`  --color-text: ${c.text};`);
  if (c.accent) vars.push(`  --color-accent: ${c.accent};`);
  vars.push(`  --font-heading: "${tokens.typography.headingFont}", serif;`);
  vars.push(`  --font-body: "${tokens.typography.bodyFont}", sans-serif;`);
  vars.push(`  --radius: ${tokens.radius ?? "8px"};`);
  return vars;
}

/** Free-use stock image URLs injected as CSS custom properties (from images.ts). */
function buildImageVars(): string {
  return `  --img-hero: url("${STOCK.heroBg}");
  --img-about: url("${STOCK.aboutBg}");`;
}

function buildFontLinks(tokens: Tokens): string {
  const fonts = [
    `family=${encodeURIComponent(tokens.typography.headingFont)}:wght@400;700`,
    `family=${encodeURIComponent(tokens.typography.bodyFont)}:wght@300;400;600`,
  ];
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${fonts.join("&")}&display=swap" rel="stylesheet" />`;
}

function buildStyles(): string {
  return `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; font-size: 16px; }

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-surface);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --color-ink: color-mix(in srgb, var(--color-primary) 78%, #000);
  --color-tint: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
}

.section-container { max-width: 1140px; margin: 0 auto; padding: clamp(3.5rem, 6vw, 6.5rem) 1.5rem; }

.section-eyebrow {
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-accent);
  text-align: center;
  margin-bottom: 0.75rem;
}
.section-eyebrow.light { color: var(--color-accent); }

.section-title {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  line-height: 1.1;
  margin-bottom: 2.75rem;
}
.section-title::after {
  content: "";
  display: block;
  width: 56px;
  height: 2px;
  background: var(--color-accent);
  margin: 1rem auto 0;
}

/* ===== HERO ===== */
.hero {
  position: relative;
  overflow: hidden;
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  padding: 5rem 1.5rem;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: var(--img-hero) center/cover no-repeat;
  transform: scale(1.05);
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--color-ink) 88%, transparent) 0%,
    color-mix(in srgb, var(--color-ink) 78%, transparent) 55%,
    color-mix(in srgb, var(--color-ink) 92%, transparent) 100%);
}
.hero-container { position: relative; z-index: 1; max-width: 880px; }
.logo { margin-bottom: 1.75rem; }
.logo.monograma svg { width: 76px; height: 76px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35)); }
.logo-img { max-height: 76px; width: auto; }
.hero-kicker {
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-accent);
  margin-bottom: 1.25rem;
}
.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(2.25rem, 5.5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1.25rem;
  text-wrap: balance;
}
.hero-subtitle {
  font-size: clamp(1.05rem, 2.2vw, 1.3rem);
  font-weight: 300;
  opacity: 0.92;
  max-width: 620px;
  margin: 0 auto 2.25rem;
}
.cta-button {
  display: inline-block;
  background: var(--color-accent);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 1rem 2.75rem;
  border-radius: var(--radius);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.28);
}
.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.35);
  background: color-mix(in srgb, var(--color-accent) 88%, #fff);
}

/* ===== AREAS ===== */
.areas { background: var(--color-tint); }
.areas-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}
.area-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius);
  padding: 1.4rem 1.6rem;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--color-text);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.area-item:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
  box-shadow: 0 10px 26px rgba(0,0,0,0.08);
}
.area-icon { color: var(--color-accent); flex-shrink: 0; }
.area-label { font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; color: var(--color-primary); }

/* ===== SOCIAL PROOF ===== */
.social-proof { background: var(--color-surface); }
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 1.5rem;
}
.review-card {
  background: var(--color-tint);
  border-radius: var(--radius);
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.review-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.1); }
.review-stars { color: var(--color-accent); font-size: 1.2rem; margin-bottom: 0.75rem; letter-spacing: 2px; }
.review-text { font-style: italic; line-height: 1.7; margin-bottom: 0.85rem; }
.review-author { font-weight: 600; font-size: 0.95rem; color: var(--color-primary); }

/* ===== ABOUT ===== */
.about {
  position: relative;
  overflow: hidden;
  color: #fff;
  background: var(--color-ink);
}
.about-bg {
  position: absolute;
  inset: 0;
  background: var(--img-about) center/cover no-repeat;
  opacity: 0.22;
}
.about-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--color-ink) 80%, transparent),
    color-mix(in srgb, var(--color-ink) 94%, transparent));
}
.about .section-container { position: relative; z-index: 1; text-align: center; }
.about-title {
  font-family: var(--font-heading);
  font-size: clamp(1.9rem, 4vw, 2.75rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1.25rem;
  text-wrap: balance;
}
.about-text {
  max-width: 680px;
  margin: 0 auto 3rem;
  font-size: 1.1rem;
  font-weight: 300;
  opacity: 0.92;
}
.about-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  max-width: 920px;
  margin: 0 auto;
}
.value-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius);
  padding: 1.75rem 1.5rem;
  text-align: left;
}
.value-icon { color: var(--color-accent); margin-bottom: 0.9rem; }
.value-title { font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; }
.value-text { font-size: 0.97rem; font-weight: 300; opacity: 0.85; line-height: 1.6; }

/* ===== CONTACT ===== */
.contact { background: var(--color-primary); color: #fff; }
.contact .section-title { color: #fff; }
.contact .section-title::after { background: var(--color-accent); }
.contact-channels {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem;
  justify-content: center;
  max-width: 640px;
  margin: 0 auto;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.05rem 1.75rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--radius);
  text-decoration: none;
  color: #fff;
  font-weight: 500;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  min-width: 210px;
}
.contact-item:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent);
  background: rgba(255,255,255,0.1);
}
.contact-icon { display: inline-flex; align-items: center; color: var(--color-accent); flex-shrink: 0; }
.contact-whatsapp:hover { border-color: #25d366; }
.contact-whatsapp:hover .contact-icon { color: #25d366; }

/* ===== FOOTER ===== */
.site-footer { background: var(--color-ink); color: #fff; }
.site-footer .section-container { padding: 3.5rem 1.5rem 2.25rem; }
.footer-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.14);
}
.footer-name { font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700; margin-bottom: 0.4rem; }
.footer-city, .footer-tel { font-size: 0.95rem; opacity: 0.78; margin-bottom: 0.2rem; }
.footer-col-title {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.75rem;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
}
.footer-areas { list-style: none; columns: 2; column-gap: 2rem; }
.footer-areas li { font-size: 0.92rem; opacity: 0.8; margin-bottom: 0.35rem; }
.footer-disclaimer { font-size: 0.8rem; opacity: 0.55; max-width: 760px; margin: 1.75rem 0 1rem; line-height: 1.55; }
.footer-text { font-size: 0.85rem; opacity: 0.7; }

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .section-container { padding: 3rem 1.15rem; }
  .hero { min-height: 78vh; padding: 3.5rem 1.15rem; }
  .areas-grid, .reviews-grid, .about-values { grid-template-columns: 1fr; }
  .contact-channels { flex-direction: column; align-items: stretch; }
  .contact-item { justify-content: center; }
  .footer-grid { flex-direction: column; gap: 1.5rem; }
  .footer-areas { columns: 1; }
}

@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto; }
  .cta-button:hover, .area-item:hover, .review-card:hover, .contact-item:hover { transform: none; }
}
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
