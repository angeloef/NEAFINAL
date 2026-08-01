import type { Copy } from "@lpb/contracts";

/** Shared utilities for section rendering. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Firm name derived from the hero titulo (first clause before a separator). */
export function extractFirmName(titulo: string): string {
  const cleaned = titulo.split(/[–—\-|,/;:]/)[0].trim();
  return cleaned.length > 60 ? cleaned.slice(0, 57) + "..." : cleaned;
}

// Generic legal words that are never a city — avoids picking "Estudio"/"Derecho".
const NON_CITY = new Set([
  "Estudio", "Jurídico", "Juridico", "Abogado", "Abogados", "Derecho",
  "Asesoramiento", "Bufete", "Legal", "Doctor", "Doctora", "Asociados",
]);

/** Best-effort city from meta description (word after "en", else first proper noun). */
export function extractCity(copy: Copy): string {
  const desc = copy.meta?.description;
  if (!desc) return "";
  const tokens = desc.split(/[\s,.;()]+/).filter(Boolean);
  // Prefer the proper noun right after " en ".
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].toLowerCase() === "en" && isProperNoun(tokens[i + 1])) {
      return tokens[i + 1];
    }
  }
  for (const t of tokens) {
    if (isProperNoun(t) && !NON_CITY.has(t)) return t;
  }
  return "";
}

function isProperNoun(word: string): boolean {
  return /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]{3,}$/.test(word) && !NON_CITY.has(word);
}
