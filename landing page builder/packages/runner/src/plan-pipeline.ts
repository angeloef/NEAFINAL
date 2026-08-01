/**
 * plan-pipeline.ts — pure, in-process PagePlan pipeline (no fs, no argv).
 *
 * dossier + raw page plan → tokens (brand) → HTML (block assembly) →
 * validation (scrutiny + quality gate). Extracted from the CLI so it can be
 * unit-tested deterministically without a subprocess or LLM call.
 */
import type { Dossier, PagePlan, Tokens } from "@lpb/contracts";
import { PagePlan as PagePlanSchema } from "@lpb/contracts";
import { generateTokens } from "@lpb/worker-brand";
import { assembleFromPlan } from "@lpb/worker-assembly";
import { runQualityGate, type QAResult } from "@lpb/validation";

export interface PlanPipelineResult {
  plan: PagePlan;
  tokens: Tokens;
  html: string;
  quality: QAResult;
}

/**
 * Run the full PagePlan pipeline in process.
 * @throws if the raw plan fails PagePlan schema validation.
 */
export async function runPlanPipeline(
  dossier: Dossier,
  rawPlan: unknown,
): Promise<PlanPipelineResult> {
  const plan = PagePlanSchema.parse(rawPlan);
  const tokens = await generateTokens(dossier);
  const html = await assembleFromPlan(plan, tokens);

  const quality = runQualityGate({ mission_id: plan.mission_id, plan, html, tokens });

  return { plan, tokens, html, quality };
}
