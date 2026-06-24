import type { Dossier } from "@lpb/contracts";

export interface ResearchInput {
  missionId: string;
  /** Google Maps CID (numeric string from ?cid=NNN URLs). */
  cid?: string;
  /** ChIJ... place_id if already known. */
  placeId?: string;
  /** Full Google Maps URL (cid= or place_id= will be extracted). */
  mapsUrl?: string;
  /** Known website URL; skip resolution if provided. */
  websiteUrl?: string;
}

export interface ResearchResult {
  dossier: Dossier;
  /** apto = meets minimum dataset; cola = routed to manual queue. */
  status: "apto" | "cola";
  gapReport: string[];
  reason?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingCount?: number;
  reviews: Array<{ author: string; text: string; rating?: number; publishTime?: string }>;
  photoNames: string[];
}

export interface SoftData {
  areasPractica: string[];
  tono?: string;
  colorPrimario?: string;
  logoUrl?: string;
}
