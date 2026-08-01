import { describe, it, expect, vi, beforeEach } from "vitest";
import { koziarskiPlace, flosiPlace, drosslerPlace } from "./fixtures.js";
import type { PlaceDetails, ResearchInput } from "../src/types.js";

// Stub external I/O before importing the module
vi.mock("../src/places.js", () => ({
  fetchPlaceDetails: vi.fn(),
}));
vi.mock("../src/scraper.js", () => ({
  scrapeWebsite: vi.fn().mockResolvedValue({ html: "<html></html>" }),
}));
vi.mock("../src/llm.js", () => ({
  extractSoftData: vi
    .fn()
    .mockResolvedValue({ areasPractica: ["Civil", "Penal"], tono: "formal" }),
}));
vi.mock("../src/resolver.js", () => ({
  resolveToPlaceId: vi.fn().mockResolvedValue("ChIJmock"),
}));

import { researchProspect } from "../src/index.js";
import { fetchPlaceDetails } from "../src/places.js";

const mockFetch = vi.mocked(fetchPlaceDetails);

beforeEach(() => {
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  process.env.ANTHROPIC_API_KEY = "test-key";
  vi.clearAllMocks();
});

const baseInput = (missionId: string): ResearchInput => ({
  missionId,
  placeId: "ChIJmock",
});

describe("researchProspect — Koziarski (🔴 sin web, sin tel)", () => {
  it("routes to cola when contact is missing", async () => {
    mockFetch.mockResolvedValue(koziarskiPlace);
    const result = await researchProspect(baseInput("mission-koz"));

    expect(result.status).toBe("cola");
    expect(result.gapReport).toContain("sin contacto (tel/WA)");
    expect(result.dossier.estado_web).toBe("sin_web");
    expect(result.dossier.gapReport).toBeUndefined();
  });
});

describe("researchProspect — Flosi (🟢 web propia, reseñas)", () => {
  it("routes to apto with reviews and website", async () => {
    mockFetch.mockResolvedValue(flosiPlace);
    // Flosi has no phone in our fixture — add one so minimum is met
    const flosiWithPhone: PlaceDetails = {
      ...flosiPlace,
      phone: "+54 3755 123456",
    };
    mockFetch.mockResolvedValue(flosiWithPhone);

    const result = await researchProspect(baseInput("mission-flosi"));

    expect(result.status).toBe("apto");
    expect(result.dossier.estado_web).toBe("web_propia");
    expect(result.dossier.prueba_social?.resenas).toHaveLength(2);
    expect(result.dossier.contacto.telefono?.valor).toBe("+54 3755 123456");
  });
});

describe("researchProspect — Drössler (🔴 sin presencia)", () => {
  it("routes to cola when contact is missing", async () => {
    mockFetch.mockResolvedValue(drosslerPlace);
    const result = await researchProspect(baseInput("mission-dro"));

    expect(result.status).toBe("cola");
    expect(result.dossier.estado_web).toBe("sin_web");
    expect(result.gapReport).toContain("sin contacto (tel/WA)");
  });
});

describe("dossier schema — DataField structure", () => {
  it("nombre field carries clase + source + confidence + fecha", async () => {
    mockFetch.mockResolvedValue(flosiPlace);
    const result = await researchProspect(baseInput("mission-schema"));

    const nombre = result.dossier.entidad.nombre;
    expect(nombre.clase).toBe("VERIFICADO-OBLIG");
    expect(nombre.source).toBe("places_api_v1");
    expect(nombre.confidence).toBeGreaterThan(0);
    expect(nombre.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("resolver failure → cola", () => {
  it("returns cola when place_id cannot be resolved", async () => {
    const { resolveToPlaceId } = await import("../src/resolver.js");
    vi.mocked(resolveToPlaceId).mockRejectedValueOnce(new Error("API error"));

    const result = await researchProspect({ missionId: "mission-err", cid: "bad-cid" });
    expect(result.status).toBe("cola");
    expect(result.reason).toContain("No se pudo resolver place_id");
  });
});
