#!/usr/bin/env tsx
/**
 * Pipeline from a pre-generated copy.json — Brand → Assembly → Validation → Presentation.
 * Use when the Copy step is produced by the Claude session / a subagent instead of an LLM API,
 * so NO external LLM provider (DeepSeek/OpenAI/Anthropic) is called at all.
 *
 * Requires output/<mission_id>/dossier.json AND output/<mission_id>/copy.json to exist.
 * Usage: tsx src/run-from-copy.ts <mission_id>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const missionId = process.argv[2];
  if (!missionId) {
    console.error("Usage: tsx src/run-from-copy.ts <mission_id>");
    process.exit(1);
  }

  const outputDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "output", missionId);
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const dossierPath = join(outputDir, "dossier.json");
  const copyPath = join(outputDir, "copy.json");
  for (const [label, p] of [["dossier.json", dossierPath], ["copy.json", copyPath]] as const) {
    if (!existsSync(p)) {
      console.error(`❌ ${label} not found: ${p}`);
      process.exit(1);
    }
  }

  const { Copy } = await import("@lpb/contracts");
  const dossier = JSON.parse(readFileSync(dossierPath, "utf-8"));
  // Validate the session-generated copy against the contract before assembling.
  const copy = Copy.parse(JSON.parse(readFileSync(copyPath, "utf-8")));

  console.log(`\n🚀 PIPELINE FROM COPY — ${missionId}`);
  console.log(`   nombre: ${dossier.entidad.nombre.valor}`);
  console.log(`   hero: "${copy.hero.titulo}"`);

  // ── Brand ──
  console.log("\n━━━ Brand ━━━");
  const { generateTokens } = await import("@lpb/worker-brand");
  const tokens = await generateTokens(dossier);
  const tokensPath = join(outputDir, "tokens.json");
  writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
  console.log(`   palette: ${tokens.color.primary} / ${tokens.color.accent}  logo: ${tokens.logo.tipo}`);

  // ── Assembly ──
  console.log("\n━━━ Assembly ━━━");
  const { assembleLanding } = await import("@lpb/worker-assembly");
  const html = await assembleLanding(copy, tokens);
  const htmlPath = join(outputDir, "landing.html");
  writeFileSync(htmlPath, html);
  console.log(`   HTML: ${html.length.toLocaleString()} chars`);

  // ── Validation ──
  console.log("\n━━━ Validation ━━━");
  const { runScrutiny, runUserTesting } = await import("@lpb/validation");
  const scrutinyResult = runScrutiny({ mission_id: missionId, dossierPath, copyPath, tokensPath, mockupHtml: html });
  writeFileSync(join(outputDir, "qa-scrutiny.json"), JSON.stringify(scrutinyResult, null, 2));
  console.log(`   scrutiny: ${scrutinyResult.status}`);
  for (const f of scrutinyResult.assertions_falladas ?? []) {
    console.log(`     ❌ ${f.assertion_id}: ${f.descripcion} [${f.severidad}]`);
  }

  let usertestingResult: any;
  try {
    usertestingResult = await runUserTesting({ mission_id: missionId, dossierPath, copyPath, tokensPath, mockupHtml: html });
    writeFileSync(join(outputDir, "qa-usertesting.json"), JSON.stringify(usertestingResult, null, 2));
    console.log(`   user-testing: ${usertestingResult.status}`);
    for (const f of usertestingResult.assertions_falladas ?? []) {
      console.log(`     ❌ ${f.assertion_id}: ${f.descripcion} [${f.severidad}]`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  user-testing error: ${err.message}`);
  }

  const allFails = [...(scrutinyResult.assertions_falladas ?? []), ...(usertestingResult?.assertions_falladas ?? [])];
  const approved = allFails.filter((f: any) => f.severidad === "bloqueante").length === 0 && scrutinyResult.status === "pass";

  const missionState = {
    mission_id: missionId,
    estado: approved ? ("aprobado" as const) : ("validando" as const),
    milestone_actual: 3,
    presupuesto: { tokens_max: 100_000, tokens_usados: 0, usd_max: 0.5 },
    features: [
      { id: "hero", estado: "ok", assertions: ["ID-01", "CTA-01"] },
      { id: "areas_practica", estado: "ok", assertions: ["AC-01"] },
      { id: "prueba_social", estado: "ok", assertions: ["AC-02"] },
      { id: "contacto", estado: "ok", assertions: ["ID-02", "CTA-01"] },
    ],
    validaciones: [
      { tipo: "scrutiny" as const, resultado: scrutinyResult.status === "pass" ? ("pass" as const) : ("fail" as const) },
      ...(usertestingResult ? [{ tipo: "user_testing" as const, resultado: usertestingResult.status === "pass" ? ("pass" as const) : ("fail" as const) }] : []),
    ],
    follow_up_features: [] as string[],
    handoffs: [] as string[],
  };

  // ── Presentation ──
  console.log("\n━━━ Presentation ━━━");
  const { publishLanding, runMissionControl, formatReport } = await import("@lpb/presentation");
  const publishResult = await publishLanding(missionState, html);
  writeFileSync(join(outputDir, "publish.json"), JSON.stringify(publishResult, null, 2));
  console.log(`   published: ${publishResult.published}${publishResult.published ? "" : ` (${publishResult.reason})`}`);
  if (publishResult.smokeTest) console.log(`   smoke: loads=${publishResult.smokeTest.page_loads} cta=${publishResult.smokeTest.cta_valid}`);

  const report = formatReport(runMissionControl([missionState]));
  writeFileSync(join(outputDir, "report.txt"), report);
  console.log("\n" + report);
  console.log(`\n📁 ${outputDir}`);
}

main().catch((err: any) => {
  console.error(`\n❌ PIPELINE FAILED: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
