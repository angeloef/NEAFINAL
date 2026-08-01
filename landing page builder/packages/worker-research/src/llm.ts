import Anthropic from "@anthropic-ai/sdk";
import type { SoftData } from "./types.js";

const SYSTEM = `Sos un extractor de datos de sitios web de estudios jurídicos argentinos.
Analizá el HTML y respondé SOLO con JSON válido, sin markdown, sin explicaciones.`;

const PROMPT = (html: string) =>
  `Extraé del siguiente HTML del sitio web del estudio jurídico:
- areasPractica: array de strings con las áreas de práctica que menciona (máx 10, nombres cortos)
- tono: una palabra que describe el tono comunicacional (ej: "formal", "cercano", "institucional")
- colorPrimario: color primario dominante en hex si podés inferirlo del CSS inline o clases, o null
- logoUrl: URL absoluta del logo si está como <img> en el header, o null

HTML (truncado a 8000 chars):
${html.slice(0, 8000)}

Respondé solo JSON con ese esquema. Omitir campos desconocidos.`;

/** Extract soft data from website HTML using Claude Sonnet. */
export async function extractSoftData(html: string): Promise<SoftData> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: "user", content: PROMPT(html) }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  try {
    return JSON.parse(text) as SoftData;
  } catch {
    return { areasPractica: [] };
  }
}
