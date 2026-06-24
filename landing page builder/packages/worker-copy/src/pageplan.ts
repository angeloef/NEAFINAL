import { createProvider } from "@lpb/contracts";
import { PagePlan } from "@lpb/contracts";
import type { Dossier, PagePlan as PagePlanT } from "@lpb/contracts";
import { isVerified, type FieldClass } from "@lpb/contracts";

/**
 * PagePlan producer (P4): the LLM chooses blocks/order/variants and writes
 * content, marking template data. Claude-only — no DeepSeek path here.
 *
 * `parsePagePlan` is the trust boundary: it validates raw LLM output against the
 * PagePlan schema and enforces data policy (AC-02, LG-01) before the plan is
 * allowed downstream.
 */

export class PagePlanPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PagePlanPolicyError";
  }
}

const BLOCK_CATALOG = `
BLOQUES DISPONIBLES (elegí 6+ en orden, cada uno {type, variant, data}):
- hero (image_overlay|split|centered): titulo{fact}, subtitulo?, cta_texto
- trust_bar (chips): items[fact]
- areas (cards|list|accordion): titulo, items[fact]
- about (split|dark_band): titulo, texto{fact}
- process (steps): titulo, pasos[{titulo, descripcion}]
- results (band): titulo, items[fact]  ← NUNCA cifras inventadas
- team (cards): titulo, miembros[{nombre{fact}, rol?, bio?}]
- testimonials (quotes): titulo, resenas[{autor{fact}, texto{fact}, rating?}]  ← SOLO si hay reseñas reales
- faq (accordion): titulo, items[{pregunta, respuesta}]
- cta_band (band): titulo, cta_texto
- contact (channels|form): titulo, telefono?{fact}, whatsapp?{fact}, email?{fact}
- footer (nap): nombre{fact}, direccion?{fact}, telefono?{fact}, disclaimer?`.trim();

const POLICY = `
POLÍTICA DE DATOS (Argentina, Ley 23.187):
- Campos {fact} = { "valor": "...", "clase": "VERIFICADO-OBLIG" | "VERIFICADO-OPC" | "PLANTILLA" }.
- VERIFICADO-* SOLO para datos reales del dossier. Todo lo genérico/plantilla = "PLANTILLA".
- PROHIBIDO: cifras de resultados, garantías, superioridad comparativa, clientes/reseñas/premios inventados.
- testimonials SOLO si el dossier trae reseñas reales; si no, omitir el bloque.
- Incluir siempre hero, contact y footer. Respondé SOLO con JSON válido (sin markdown).`.trim();

export function buildPagePlanPrompt(dossier: Dossier): { system: string; user: string } {
  const system = `Sos un diseñador de landings jurídicas argentinas. Componés una página premium eligiendo bloques.
${BLOCK_CATALOG}

${POLICY}`;

  const verified = (f?: { clase: FieldClass; valor: string }): string | undefined =>
    f && isVerified(f.clase) ? f.valor : undefined;

  const nombre = verified(dossier.entidad.nombre) ?? "el estudio";
  const ciudad = verified(dossier.ubicacion.ciudad) ?? "";
  const reviews = dossier.prueba_social?.resenas ?? [];

  const user = `Componé el PagePlan JSON para la landing.
DATOS VERIFICADOS:
- mission_id: ${dossier.mission_id}
- Nombre: ${nombre}${ciudad ? `\n- Ciudad: ${ciudad}` : ""}
- Reseñas reales: ${reviews.length > 0 ? `${reviews.length} (testimonials permitido)` : "0 (NO incluir testimonials)"}`;

  return { system, user };
}

/** True if any fact-shaped field in `data` is marked VERIFICADO. */
function hasVerifiedFact(data: unknown): boolean {
  let found = false;
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const r = n as Record<string, unknown>;
      if ("valor" in r && typeof r.clase === "string" && isVerified(r.clase as FieldClass)) {
        found = true;
      }
      Object.values(r).forEach(walk);
    }
  };
  walk(data);
  return found;
}

const FIGURE_RE = /\d/;

/**
 * Validate and policy-check raw LLM output into a PagePlan.
 *
 * @throws PagePlanPolicyError on schema or policy violations:
 *  - LG-01: a `results` item presents a figure (digit) as a VERIFICADO fact.
 *  - AC-02: a `testimonials` block claims verified reviews the dossier lacks.
 */
export function parsePagePlan(raw: unknown, dossier: Dossier): PagePlanT {
  const json =
    typeof raw === "string"
      ? JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""))
      : raw;

  const parsed = PagePlan.safeParse(json);
  if (!parsed.success) {
    throw new PagePlanPolicyError(
      `PagePlan schema validation failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  const plan = parsed.data;
  const hasRealReviews = (dossier.prueba_social?.resenas ?? []).length > 0;

  for (const block of plan.blocks) {
    if (block.type === "results") {
      for (const item of block.data.items) {
        if (isVerified(item.clase) && FIGURE_RE.test(item.valor)) {
          throw new PagePlanPolicyError(
            `LG-01: results figure presented as verified: "${item.valor}"`,
          );
        }
      }
    }
    if (block.type === "testimonials" && !hasRealReviews && hasVerifiedFact(block.data)) {
      throw new PagePlanPolicyError(
        "AC-02: testimonials marked verified but dossier has no real reviews",
      );
    }
  }

  return plan;
}

/** Generate a PagePlan from a dossier via the configured Claude provider. */
export async function generatePagePlan(dossier: Dossier): Promise<PagePlanT> {
  const provider = createProvider();
  const model = process.env.LLM_MODEL || undefined;
  const { system, user } = buildPagePlanPrompt(dossier);

  const response = await provider.chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 2048, model },
  );

  return parsePagePlan(response, dossier);
}
