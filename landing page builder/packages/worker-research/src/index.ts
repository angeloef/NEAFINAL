import type { Dossier } from "@lpb/contracts";
import type { ResearchInput, ResearchResult } from "./types.js";
import { resolveToPlaceId } from "./resolver.js";
import { fetchPlaceDetails } from "./places.js";
import { scrapeWebsite } from "./scraper.js";
import { extractSoftData } from "./llm.js";
import { routeDossier } from "./routing.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function strField(
  valor: string,
  source: string,
  confidence: number,
): Dossier["entidad"]["nombre"] {
  return { valor, clase: "VERIFICADO-OBLIG", source, confidence, fecha: today() };
}

function strFieldOpt(
  valor: string,
  source: string,
  confidence: number,
): Dossier["entidad"]["nombre"] {
  return { valor, clase: "VERIFICADO-OPC", source, confidence, fecha: today() };
}

function strArrField(
  valor: string[],
  source: string,
  confidence: number,
): NonNullable<Dossier["areas_practica"]> {
  return { valor, clase: "INFERIDO", source, confidence, fecha: today() };
}

/** Detect estado_web from place details. */
function detectEstadoWeb(
  website?: string,
): NonNullable<Dossier["estado_web"]> {
  if (!website) return "sin_web";
  if (website.includes("sites.google.com")) return "web_basica";
  return "web_propia";
}

/**
 * Main research pipeline.
 * Requires env: GOOGLE_PLACES_API_KEY, ANTHROPIC_API_KEY.
 */
export async function researchProspect(
  input: ResearchInput,
): Promise<ResearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not set");

  // 1. Resolve place_id
  let placeId: string;
  try {
    placeId = await resolveToPlaceId(input, apiKey);
  } catch (err) {
    const reason = `No se pudo resolver place_id: ${err instanceof Error ? err.message : String(err)}`;
    const emptyDossier: Dossier = {
      mission_id: input.missionId,
      entidad: { nombre: strField("?", "resolver_error", 0) },
      ubicacion: { ciudad: strField("?", "resolver_error", 0) },
      contacto: {},
    };
    return {
      dossier: emptyDossier,
      status: "cola",
      gapReport: [reason],
      reason,
    };
  }

  // 2. Fetch Places API
  const place = await fetchPlaceDetails(placeId, apiKey);

  // 3. Scrape website + extract soft data (if website exists)
  const websiteUrl = input.websiteUrl ?? place.website;
  let softData = { areasPractica: [] as string[] };

  if (websiteUrl) {
    try {
      const scraped = await scrapeWebsite(websiteUrl);
      if (process.env.ANTHROPIC_API_KEY) {
        softData = await extractSoftData(scraped.html);
      }
    } catch {
      // Non-fatal: soft data stays empty
    }
  }

  // 4. Build dossier
  const estadoWeb = detectEstadoWeb(websiteUrl);

  const dossier: Dossier = {
    mission_id: input.missionId,

    entidad: {
      nombre: strField(place.name, "places_api_v1", 0.98),
      tipo: strFieldOpt("Estudio Jurídico", "inferido", 0.7),
    },

    ubicacion: {
      ciudad: strField(
        extractCity(place.address),
        "places_api_v1",
        0.9,
      ),
      direccion: place.address
        ? strFieldOpt(place.address, "places_api_v1", 0.98)
        : undefined,
    },

    contacto: {
      telefono: place.phone
        ? strFieldOpt(place.phone, "places_api_v1", 0.95)
        : undefined,
    },

    place_id: strFieldOpt(placeId, "places_api_v1", 1),

    areas_practica:
      softData.areasPractica.length > 0
        ? strArrField(softData.areasPractica, "llm_extraction", 0.75)
        : undefined,

    prueba_social:
      place.reviews.length > 0
        ? {
            resenas: place.reviews.slice(0, 5).map((r) => ({
              autor: r.author,
              texto: r.text,
              rating: r.rating,
              fecha: r.publishTime?.slice(0, 10),
            })),
          }
        : undefined,

    estado_web: estadoWeb,
  };

  // 5. Route
  const routing = routeDossier(dossier);
  return { dossier, ...routing };
}

function extractCity(address?: string): string {
  if (!address) return "?";
  // Argentine address format: "Street NNN, City, Province, Argentina"
  const parts = address.split(",").map((s) => s.trim());
  // Typically city is at index 1 or 2
  return parts[1] ?? parts[0] ?? "?";
}
