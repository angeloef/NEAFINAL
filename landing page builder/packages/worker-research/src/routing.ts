import type { Dossier } from "@lpb/contracts";
import type { ResearchResult } from "./types.js";

/** Minimum dataset for "apto" status (spec §5). */
function meetsMinimum(d: Dossier): boolean {
  return (
    !!d.entidad.nombre &&
    !!d.ubicacion.ciudad &&
    !!(d.contacto.telefono ?? d.contacto.whatsapp) &&
    !!d.place_id
  );
}

/** Produce routing decision + gap report for a dossier. */
export function routeDossier(
  d: Dossier,
): Pick<ResearchResult, "status" | "gapReport" | "reason"> {
  const gaps: string[] = [];

  if (!d.entidad.nombre) gaps.push("nombre canónico ausente");
  if (!d.ubicacion.ciudad) gaps.push("ciudad ausente");
  if (!d.contacto.telefono && !d.contacto.whatsapp) gaps.push("sin contacto (tel/WA)");
  if (!d.place_id) gaps.push("place_id no resuelto");
  if (!d.areas_practica) gaps.push("áreas de práctica no extraídas — usar plantilla genérica");
  if (!d.prueba_social?.resenas?.length) gaps.push("sin reseñas — omitir sección prueba social");
  if (!d.contacto.email) gaps.push("email no disponible");

  // Logo siempre fallback salvo og:image trivial (spec §5)
  if (d.estado_web === "sin_web") gaps.push("sin web — usar monograma como logo");

  if (!meetsMinimum(d)) {
    return {
      status: "cola",
      gapReport: gaps,
      reason: "Dataset mínimo no alcanzado: " + gaps.filter(Boolean).join("; "),
    };
  }

  return { status: "apto", gapReport: gaps };
}
