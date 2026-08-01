/**
 * Curated free-use stock image pool + per-page picker.
 *
 * Source: Unsplash (Unsplash License — free, no attribution required),
 * hotlinked from the images.unsplash.com CDN. Every photo id below was
 * verified 200 OK once (2026-06-24). Re-verification is a standalone concern,
 * not a CI network test — see the plan's gates.
 *
 * Theme: sober legal / corporate to match a dark-luxury law-firm direction.
 * Images are illustrative only, never presented as real awards/clients.
 */

export type ImageCategory =
  | "courthouse"
  | "columns"
  | "library"
  | "office_interior"
  | "desk_detail"
  | "city_misiones"
  | "skyline"
  | "handshake"
  | "scales"
  | "books";

interface PoolEntry {
  id: string;
  category: ImageCategory;
  alt: string;
}

/** 15 verified, theme-tagged images spanning all 10 categories. */
const POOL: readonly PoolEntry[] = [
  { id: "photo-1589391886645-d51941baf7fb", category: "courthouse", alt: "Fachada de un palacio de justicia clásico" },
  { id: "photo-1505664194779-8beaceb93744", category: "courthouse", alt: "Edificio de tribunales con escalinata de piedra" },
  { id: "photo-1521587760476-6c12a4b040da", category: "columns", alt: "Columnas clásicas de un edificio institucional" },
  { id: "photo-1564594985645-4427056e22e2", category: "columns", alt: "Columnata de mármol vista desde abajo" },
  { id: "photo-1423592707957-3b212afa6733", category: "library", alt: "Biblioteca jurídica con estanterías de libros" },
  { id: "photo-1507842217343-583bb7270b66", category: "library", alt: "Sala de lectura con altas estanterías de libros" },
  { id: "photo-1497366216548-37526070297c", category: "office_interior", alt: "Interior de oficina profesional iluminada" },
  { id: "photo-1450101499163-c8848c66ca85", category: "desk_detail", alt: "Detalle de escritorio con documentos y lapicera" },
  { id: "photo-1518002171953-a080ee817e1f", category: "city_misiones", alt: "Vista urbana de la ciudad" },
  { id: "photo-1477959858617-67f85cf4f1df", category: "skyline", alt: "Horizonte de la ciudad al atardecer" },
  { id: "photo-1496564203457-11bb12075d90", category: "skyline", alt: "Skyline corporativo con edificios de oficinas" },
  { id: "photo-1556761175-5973dc0f32e7", category: "handshake", alt: "Apretón de manos cerrando un acuerdo profesional" },
  { id: "photo-1521791136064-7986c2920216", category: "handshake", alt: "Profesionales estrechando la mano en una reunión" },
  { id: "photo-1589994965851-a8f479c573a9", category: "scales", alt: "Balanza de la justicia sobre un escritorio" },
  { id: "photo-1481627834876-b7833e8f5570", category: "books", alt: "Pila de libros de derecho sobre una mesa" },
] as const;

const DEFAULT_WIDTH = 1600;
const DEFAULT_QUALITY = 70;

const sizedUrl = (id: string, width: number, quality = DEFAULT_QUALITY): string =>
  `https://images.unsplash.com/${id}?w=${width}&q=${quality}&auto=format&fit=crop`;

/** Preferred categories per block role, so hero ≠ about ≠ cta thematically. */
const ROLE_PREFERENCES: Record<string, ImageCategory[]> = {
  hero: ["columns", "courthouse", "skyline"],
  about: ["library", "office_interior", "books"],
  cta: ["handshake", "scales", "city_misiones"],
  areas: ["desk_detail", "office_interior", "books"],
  contact: ["city_misiones", "skyline", "courthouse"],
};

export interface PickedImage {
  url: string;
  alt: string;
  category: ImageCategory;
}

/**
 * Pick one image per block role with no repetition within a single page.
 *
 * Each role draws from its preferred categories first, falling back to any
 * still-unused image. Deterministic: same roles → same result.
 *
 * @param roles - Block roles in render order (e.g. ["hero", "about", "cta"]).
 * @param width - Target render width in px applied to every URL.
 * @throws if more roles are requested than images in the pool.
 */
export function pickImages(roles: string[], width = DEFAULT_WIDTH): PickedImage[] {
  if (roles.length > POOL.length) {
    throw new Error(
      `image pool exhausted: ${roles.length} roles requested but only ${POOL.length} images available`,
    );
  }

  const used = new Set<string>();
  return roles.map((role) => {
    const prefs = ROLE_PREFERENCES[role] ?? [];
    const candidate =
      POOL.find((p) => prefs.includes(p.category) && !used.has(p.id)) ??
      POOL.find((p) => !used.has(p.id));
    // Guarded by the length check above, so this is unreachable in practice.
    if (!candidate) throw new Error("image pool exhausted");
    used.add(candidate.id);
    return { url: sizedUrl(candidate.id, width), alt: candidate.alt, category: candidate.category };
  });
}

/** All verified photo ids, for an out-of-band 200-OK re-verification script. */
export const POOL_IDS: readonly string[] = POOL.map((p) => p.id);
