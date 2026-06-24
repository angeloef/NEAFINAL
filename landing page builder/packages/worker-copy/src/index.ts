import Anthropic from "@anthropic-ai/sdk";
import type { Dossier } from "@lpb/contracts";
import { Copy } from "@lpb/contracts";
import { buildPrompt } from "./prompt.js";

export type { Copy, Dossier };

/**
 * Generates copy.json from a dossier.
 * Guardrail: prueba_social is stripped unless dossier has real reviews (AC-02).
 * Requires env: ANTHROPIC_API_KEY.
 */
export async function generateCopy(dossier: Dossier): Promise<Copy> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic();
  const { system, user } = buildPrompt(dossier);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const json = text.replace(/^```[a-z]*\n?|\n?```$/gm, "").trim();
  const raw = Copy.parse(JSON.parse(json));

  // ponytail: hard guardrail — LLM output cannot override this; AC-02 compliance.
  const hasRealReviews = (dossier.prueba_social?.resenas ?? []).length > 0;
  if (!hasRealReviews) {
    const { prueba_social: _dropped, ...rest } = raw;
    return rest as Copy;
  }

  return raw;
}
