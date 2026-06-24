#!/usr/bin/env tsx
/**
 * Pipeline from a pre-generated page_plan.json (P4) —
 * Brand → Assembly(blocks) → Validation(+quality gate) → Presentation.
 *
 * Mirrors run-from-copy.ts but consumes a composable PagePlan instead of Copy,
 * so the LLM/Claude step (worker-copy `generatePagePlan`) runs out-of-band and
 * NO external provider is called here.
 *
 * Requires output/<mission_id>/dossier.json AND output/<mission_id>/page_plan.json.
 * Usage: tsx src/run-from-plan.ts <mission_id>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runPlanPipeline } from "./plan-pipeline.js";

async function main(): Promise<void> {
  const missionId = process.argv[2];
  if (!missionId) {
    console.error("Usage: tsx src/run-from-plan.ts <mission_id>");
    process.exit(1);
  }

  const outputDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
    "output",
    missionId,
  );
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const dossierPath = join(outputDir, "dossier.json");
  const planPath = join(outputDir, "page_plan.json");
  for (const [label, p] of [
    ["dossier.json", dossierPath],
    ["page_plan.json", planPath],
  ] as const) {
    if (!existsSync(p)) {
      console.error(`❌ ${label} not found: ${p}`);
      process.exit(1);
    }
  }

  const dossier = JSON.parse(readFileSync(dossierPath, "utf-8"));
  const rawPlan = JSON.parse(readFileSync(planPath, "utf-8"));

  console.log(`\n🚀 PIPELINE FROM PLAN — ${missionId}`);
  const result = await runPlanPipeline(dossier, rawPlan);

  const tokensPath = join(outputDir, "tokens.json");
  writeFileSync(tokensPath, JSON.stringify(result.tokens, null, 2));
  writeFileSync(join(outputDir, "landing.html"), result.html);
  writeFileSync(join(outputDir, "qa-quality.json"), JSON.stringify(result.quality, null, 2));

  // Scrutiny runs on the written artifacts (it reads file paths).
  const { runScrutiny } = await import("@lpb/validation");
  const scrutiny = runScrutiny({ mission_id: result.plan.mission_id, dossierPath, tokensPath, mockupHtml: result.html });
  writeFileSync(join(outputDir, "qa-scrutiny.json"), JSON.stringify(scrutiny, null, 2));

  console.log(`   blocks: ${result.plan.blocks.length}  HTML: ${result.html.length.toLocaleString()} chars`);
  console.log(`   scrutiny: ${scrutiny.status}  quality: ${result.quality.status}`);
  for (const f of result.quality.assertions_falladas) {
    console.log(`     ❌ ${f.assertion_id}: ${f.descripcion} [${f.severidad}]`);
  }
  console.log(`\n📁 ${outputDir}`);

  if (result.quality.status !== "pass") {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n❌ PIPELINE FAILED: ${msg}`);
  process.exit(1);
});
