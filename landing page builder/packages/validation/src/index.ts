/**
 * validation — Adversarial validators (scrutiny + user-testing).
 *
 * Exports:
 *   - runScrutiny()   — fast, no-browser schema/semantic validation
 *   - runUserTesting() — Playwright-based UI/UX validation
 *   - Contrast helpers for WCAG AA checks
 *   - QAResult builder types
 */

export { runScrutiny } from "./scrutiny.js";
export type { ValidationInput } from "./scrutiny.js";

export { runUserTesting } from "./usertesting.js";

export { checkContrastAA, contrastRatioFromHex, relativeLuminance } from "./contrast.js";

export { runQualityGate } from "./quality.js";
export type { QualityInput } from "./quality.js";

export {
  QABuilder,
  pass,
  type QAResult,
  type AssertionFallada,
} from "./qa.js";
