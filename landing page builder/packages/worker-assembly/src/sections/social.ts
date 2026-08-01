import type { Copy } from "@lpb/contracts";
import { escapeHtml } from "./shared.js";

export function socialSection(copy: Copy): string {
  if (!copy.prueba_social) return "";
  // AC-02: only renders if there are actual reviews
  const reviews = copy.prueba_social.resenas;
  if (!reviews || reviews.length === 0) return "";

  const reviewsHtml = reviews
    .map((r) => {
      const stars = r.rating ? renderStars(r.rating) : "";
      return `
        <div class="review-card">
          <div class="review-stars">${stars}</div>
          <p class="review-text">"${escapeHtml(r.texto)}"</p>
          <p class="review-author">— ${escapeHtml(r.autor)}</p>
        </div>`;
    })
    .join("\n");

  return `
    <section id="prueba-social" class="social-proof">
      <div class="section-container">
        <h2 class="section-title">${escapeHtml(copy.prueba_social.titulo)}</h2>
        <div class="reviews-grid">${reviewsHtml}</div>
      </div>
    </section>`;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty)
  );
}
