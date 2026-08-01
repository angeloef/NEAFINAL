import type { PlaceDetails } from "./types.js";

const PLACES_V1 = "https://places.googleapis.com/v1/places";

const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "reviews",
  "photos",
].join(",");

interface PlacesV1Response {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    authorAttribution?: { displayName?: string };
    text?: { text?: string };
    rating?: number;
    publishTime?: string;
  }>;
  photos?: Array<{ name: string }>;
}

/** Fetch place details from Google Places API v1 (new). */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<PlaceDetails> {
  const res = await fetch(`${PLACES_V1}/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body}`);
  }
  const p = (await res.json()) as PlacesV1Response;
  return {
    placeId: p.id ?? placeId,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress,
    phone: p.nationalPhoneNumber,
    website: p.websiteUri,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    reviews: (p.reviews ?? []).map((r) => ({
      author: r.authorAttribution?.displayName ?? "Anónimo",
      text: r.text?.text ?? "",
      rating: r.rating,
      publishTime: r.publishTime,
    })),
    photoNames: (p.photos ?? []).map((ph) => ph.name),
  };
}
