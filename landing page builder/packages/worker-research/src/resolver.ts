import type { ResearchInput } from "./types.js";

/** Extract numeric CID from a maps.google.com/?cid=NNN URL. */
export function extractCid(url: string): string | null {
  const m = url.match(/[?&]cid=(\d+)/);
  return m ? m[1] : null;
}

/** Extract ChIJ place_id from a maps URL if present. */
function extractPlaceId(url: string): string | null {
  const m = url.match(/place_id=(ChIJ[^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Convert CID → ChIJ place_id via Geocoding API.
 * The Geocoding API accepts place_id=cid:NNN as input.
 */
async function cidToPlaceId(cid: string, apiKey: string): Promise<string> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?place_id=cid%3A${cid}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);
  const json = (await res.json()) as {
    status: string;
    results: Array<{ place_id: string }>;
  };
  if (json.status !== "OK" || !json.results[0])
    throw new Error(`CID ${cid} not found: ${json.status}`);
  return json.results[0].place_id;
}

/**
 * Normalize any form of input to a Google Places place_id (ChIJ...).
 * Throws if resolution fails — caller decides how to handle (route to cola).
 */
export async function resolveToPlaceId(
  input: ResearchInput,
  apiKey: string,
): Promise<string> {
  if (input.placeId) return input.placeId;

  const cid = input.cid ?? (input.mapsUrl ? extractCid(input.mapsUrl) : null);
  if (cid) return cidToPlaceId(cid, apiKey);

  const pid = input.mapsUrl ? extractPlaceId(input.mapsUrl) : null;
  if (pid) return pid;

  throw new Error("ResearchInput must include placeId, cid, or mapsUrl with cid/place_id.");
}
