/**
 * Free-use stock imagery by role (Unsplash License — free, no attribution required).
 * Hotlinked from images.unsplash.com CDN. All URLs verified 200 OK.
 * Theme: sober legal / corporate (columns, law library, justice) to match a
 * dark-luxury law-firm direction. Images are illustrative, never presented as
 * real awards/clients (AC-01/AC-02).
 */
const U = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

export const STOCK = {
  /** Hero background — classical courthouse columns. */
  heroBg: U("photo-1521587760476-6c12a4b040da", 1920),
  /** "About" band background — law library / bookshelves. */
  aboutBg: U("photo-1423592707957-3b212afa6733", 1600),
} as const;
