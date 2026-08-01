import type { PlaceDetails } from "../src/types.js";

/** Mock Places API responses for the 3 test prospects. */

// Koziarski: 🔴 sin web, sin tel público
export const koziarskiPlace: PlaceDetails = {
  placeId: "ChIJkoziarski_mock",
  name: "Estudio Jurídico Dr. Dardo Koziarski",
  address: "Oberá, Misiones, Argentina",
  phone: undefined,
  website: undefined,
  rating: undefined,
  userRatingCount: 0,
  reviews: [],
  photoNames: [],
};

// Flosi: 🟢 con web propia, reseñas
export const flosiPlace: PlaceDetails = {
  placeId: "ChIJflosi_mock",
  name: "Flosi & Asociados — Abogados",
  address: "Rivadavia 915, Oberá, Misiones, Argentina",
  phone: undefined,
  website: "https://www.estudioflosi.com.ar/",
  rating: 4.5,
  userRatingCount: 12,
  reviews: [
    { author: "María González", text: "Excelente atención, muy profesionales.", rating: 5 },
    { author: "Carlos Pérez", text: "+40 años de experiencia lo dicen todo.", rating: 4 },
  ],
  photoNames: [],
};

// Drössler: 🔴 sin web, sin presencia online
export const drosslerPlace: PlaceDetails = {
  placeId: "ChIJdrossler_mock",
  name: "Estudio Jurídico Drössler & Bárbaro",
  address: "Oberá, Misiones, Argentina",
  phone: undefined,
  website: undefined,
  rating: undefined,
  userRatingCount: 0,
  reviews: [],
  photoNames: [],
};
