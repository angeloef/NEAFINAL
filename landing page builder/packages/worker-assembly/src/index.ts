import type { Copy, Tokens } from "@lpb/contracts";
import { buildFullPage } from "./layout.js";

/**
 * Assemble a complete landing page HTML string from validated Copy and Tokens.
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
