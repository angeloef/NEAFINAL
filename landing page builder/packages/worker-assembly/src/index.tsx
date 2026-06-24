import type { Copy, PagePlan, Tokens } from "@lpb/contracts";
import { buildFullPage } from "./layout.js";
import { Page } from "./blocks/Page.js";
import { renderReactPage } from "./render.js";

/**
 * Assemble a complete landing page HTML string from validated Copy and Tokens.
 *
 * Legacy string-template path. Prefer `assembleFromPlan` for new work.
 *
 * @param copy - Validated Copy object (from @lpb/contracts)
 * @param tokens - Validated Tokens object (from @lpb/contracts)
 * @returns Complete HTML5 document as a string
 */
export async function assembleLanding(
  copy: Copy,
  tokens: Tokens,
): Promise<string> {
  return buildFullPage(copy, tokens);
}

/**
 * Assemble a self-contained landing page from a composable PagePlan (P4).
 *
 * Maps each block to its React renderer, themes it with `tokens`, and emits a
 * static HTML document with inline Tailwind CSS and no client JS.
 *
 * @param plan - Validated PagePlan (ordered blocks + SEO meta)
 * @param tokens - Validated Tokens object (palette + typography)
 * @returns Complete HTML5 document as a string
 */
export async function assembleFromPlan(
  plan: PagePlan,
  tokens: Tokens,
): Promise<string> {
  return renderReactPage(<Page plan={plan} tokens={tokens} />, {
    title: plan.meta.title,
  });
}
