import type { Dossier } from "@lpb/contracts";
import { isVerified, type FieldClass } from "@lpb/contracts";

function verified(f?: { clase: FieldClass; valor: string }): string | undefined {
  return f && isVerified(f.clase) ? f.valor : undefined;
}

const LEGAL_RULES = `
REGLAS LEGALES OBLIGATORIAS (Argentina — Ley 23.187):
- PROHIBIDO: claims de resultados garantizados ("ganamos", "aseguramos el éxito", "100% de éxito").
- PROHIBIDO: superioridad comparativa ("el mejor estudio", "líderes en").
- PERMITIDO: áreas de práctica, trayectoria, datos de contacto verificados.
- Tono legal-argentino, claro y profesional. Sin promesas de resultado.`.trim();

const SCHEMA_INSTRUCTIONS = `
Respondé SOLO con JSON válido (sin markdown, sin explicaciones), con esta estructura:
{
  "mission_id": "<string>",
  "hero": { "titulo": "<string>", "subtitulo": "<string>", "cta_texto": "<string>" },
  "areas_practica": { "titulo": "Áreas de Práctica", "items": ["<string>", ...] },
  "prueba_social": { "titulo": "Lo que dicen nuestros clientes", "resenas": [{ "autor": "<string>", "texto": "<string>", "rating": <number> }] },
  "contacto": { "titulo": "Contactanos", "telefono": "<string>", "whatsapp": "<string>", "email": "<string>" },
  "meta": { "title": "<string>", "description": "<string>" }
}
Omitir campos opcionales (subtitulo, prueba_social, telefono, whatsapp, email) si no aplican.`.trim();

const GENERIC_AREAS = [
  "Derecho Civil",
  "Derecho Comercial",
  "Derecho de Familia",
  "Derecho Laboral",
];

export function buildPrompt(dossier: Dossier): { system: string; user: string } {
  const system = `Sos un redactor de landings jurídicas argentinas. Generás copy profesional, veraz y legalmente seguro.\n\n${LEGAL_RULES}\n\n${SCHEMA_INSTRUCTIONS}`;

  const nombre = verified(dossier.entidad.nombre) ?? "el estudio";
  const ciudad = verified(dossier.ubicacion.ciudad) ?? "";
  const telefono = verified(dossier.contacto.telefono);
  const whatsapp = verified(dossier.contacto.whatsapp);
  const email = verified(dossier.contacto.email);

  const hasAreas = (dossier.areas_practica?.valor.length ?? 0) > 0;
  const areas = hasAreas ? dossier.areas_practica!.valor : GENERIC_AREAS;

  const resenas = dossier.prueba_social?.resenas ?? [];
  const hasReviews = resenas.length > 0;

  const contactLines = [
    telefono && `- Teléfono: ${telefono}`,
    whatsapp && `- WhatsApp: ${whatsapp}`,
    email && `- Email: ${email}`,
  ].filter(Boolean).join("\n");

  const resenasBlock = hasReviews
    ? resenas
        .slice(0, 3)
        .map(
          (r) =>
            `- "${r.texto}" — ${r.autor}${r.rating !== undefined ? ` (${r.rating}/5)` : ""}`,
        )
        .join("\n")
    : "NINGUNA — NO incluir la sección prueba_social en el JSON.";

  const user = `Generá el copy JSON para la landing del estudio jurídico.

DATOS VERIFICADOS:
- Nombre: ${nombre}${ciudad ? `\n- Ciudad: ${ciudad}` : ""}
${contactLines || "- (sin datos de contacto verificados)"}
- mission_id: ${dossier.mission_id}

ÁREAS DE PRÁCTICA (${hasAreas ? "del sitio web" : "no detectadas — usar genéricas"}):
${areas.map((a) => `- ${a}`).join("\n")}

RESEÑAS REALES (${hasReviews ? `${resenas.length} disponibles` : "ninguna"}):
${resenasBlock}`;

  return { system, user };
}
