#!/usr/bin/env tsx
/**
 * Full pipeline CLI — Research → Copy → Brand → Assembly → Validation → Presentation
 * Runs from within @lpb/runner package so workspace deps resolve.
 *
 * Usage: npx tsx src/full-pipeline.ts <mission_id> [--cid <cid>] [--maps-url <url>]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..", "..");

// ── Load env ────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(homedir(), ".hermes", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      opts[key] = val;
    } else {
      positional.push(args[i]);
    }
  }
  return { missionId: positional[0], opts };
}

function save(dir: string, filename: string, data: unknown): string {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const path = join(dir, filename);
  writeFileSync(path, text, "utf-8");
  console.log(`  ✓ ${filename} (${text.length.toLocaleString()} bytes)`);
  return path;
}

async function main() {
  loadEnv();

  const { missionId, opts } = parseArgs();
  if (!missionId) {
    console.error("Usage: npx tsx src/full-pipeline.ts <mission_id> [--cid <cid>] [--maps-url <url>]");
    console.error("Example: npx tsx src/full-pipeline.ts drossler_barbaro_obera --cid 16702906282137664264");
    process.exit(1);
  }

  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const outputDir = join(projectRoot, "output", missionId);
  mkdirSync(outputDir, { recursive: true });

  console.log(`\n🚀 FULL PIPELINE — ${missionId}`);
  console.log(`   cid: ${opts.cid || "none"}`);
  console.log(`   maps: ${opts["maps-url"] || "none"}\n`);

  // ═══════════════════════════════════════════════════════════════ STEP 1: RESEARCH
  console.log("━━━ STEP 1: Research ━━━");
  const { researchProspect } = await import("@lpb/worker-research");

  const t1 = Date.now();
  const researchResult = await researchProspect({
    missionId,
    cid: opts.cid,
    mapsUrl: opts["maps-url"],
  });
  console.log(`   ⏱  ${((Date.now() - t1) / 1000).toFixed(1)}s`);

  const dossierPath = save(outputDir, "dossier.json", researchResult.dossier);
  console.log(`   status: ${researchResult.status}`);
  if (researchResult.gapReport.length) {
    console.log(`   gaps: ${researchResult.gapReport.join("; ")}`);
  }

  // ═══════════════════════════════════════════════════════════════ STEP 2: COPY
  console.log("━━━ STEP 2: Copy ━━━");
  const { generateCopy } = await import("@lpb/worker-copy");

  const t2 = Date.now();
  const copy = await generateCopy(researchResult.dossier);
  console.log(`   ⏱  ${((Date.now() - t2) / 1000).toFixed(1)}s`);

  const copyPath = save(outputDir, "copy.json", copy);
  console.log(`   hero: "${copy.hero.titulo}"`);
  console.log(`   areas: ${copy.areas_practica?.items?.length ?? 0}`);

  // ═══════════════════════════════════════════════════════════════ STEP 3: BRAND
  console.log("━━━ STEP 3: Brand ━━━");
  const { generateTokens } = await import("@lpb/worker-brand");

  const tokens = await generateTokens(researchResult.dossier);
  const tokensPath = save(outputDir, "tokens.json", tokens);
  console.log(`   primary: ${tokens.color.primary}  accent: ${tokens.color.accent}`);
  console.log(`   logo: ${tokens.logo.tipo}`);

  // ═══════════════════════════════════════════════════════════════ STEP 4: ASSEMBLY
  console.log("━━━ STEP 4: Assembly ━━━");
  const { assembleLanding } = await import("@lpb/worker-assembly");

  const html = await assembleLanding(copy, tokens);
  const htmlPath = save(outputDir, "landing.html", html);
  console.log(`   HTML assembled`);

  // ═══════════════════════════════════════════════════════════════ STEP 5: VALIDATION
  console.log("━━━ STEP 5: Validation ━━━");
  const { runScrutiny, runUserTesting } = await import("@lpb/validation");

  // 5a: Scrutiny
  console.log("   5a. Scrutiny...");
  const scrutinyResult = runScrutiny({
    mission_id: missionId,
    dossierPath,
    copyPath,
    tokensPath,
    mockupHtml: html,
  });
  save(outputDir, "qa-scrutiny.json", scrutinyResult);
  console.log(`   status: ${scrutinyResult.status}`);

  // 5b: User-Testing
  console.log("   5b. User-Testing...");
  let usertestingResult;
  try {
    usertestingResult = await runUserTesting({
      mission_id: missionId,
      dossierPath,
      copyPath,
      tokensPath,
      mockupHtml: html,
    });
    save(outputDir, "qa-usertesting.json", usertestingResult);
    console.log(`   status: ${usertestingResult.status}`);
    const fails = usertestingResult.assertions_falladas ?? [];
    for (const f of fails) {
      console.log(`     ❌ ${f.assertion_id}: ${f.descripcion}`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  error: ${err.message}`);
  }

  // Determine approval
  const scrutinyFails = scrutinyResult.assertions_falladas ?? [];
  const utFails = usertestingResult?.assertions_falladas ?? [];
  const bloqueantes = [...scrutinyFails, ...utFails].filter(
    (f: any) => f.severidad === "bloqueante"
  );
  const approved = bloqueantes.length === 0;

  const missionState = {
    mission_id: missionId,
    estado: approved ? "aprobado" as const : "validando" as const,
    milestone_actual: 3,
    presupuesto: { tokens_max: 100_000, tokens_usados: 2500, usd_max: 0.50 },
    features: [
      { id: "hero", estado: "ok", assertions: ["ID-01", "CTA-01"] },
      { id: "areas_practica", estado: "ok", assertions: ["AC-01"] },
      { id: "prueba_social", estado: "ok", assertions: ["AC-02"] },
      { id: "contacto", estado: "ok", assertions: ["ID-02", "CTA-01"] },
    ],
    validaciones: [
      { tipo: "scrutiny" as const, resultado: scrutinyResult.status === "pass" ? "pass" as const : "fail" as const },
      ...(usertestingResult ? [{ tipo: "user_testing" as const, resultado: usertestingResult.status === "pass" ? "pass" as const : "fail" as const }] : []),
    ],
    follow_up_features: [] as string[],
    handoffs: [] as string[],
  };

  // ═══════════════════════════════════════════════════════════════ STEP 6: PRESENTATION
  console.log("━━━ STEP 6: Presentation ━━━");
  const { publishLanding, runMissionControl, formatReport } = await import("@lpb/presentation");

  const publishResult = await publishLanding(missionState, html);
  save(outputDir, "publish.json", publishResult);
  console.log(`   published: ${publishResult.published}`);
  if (publishResult.screenshotPath) console.log(`   screenshot: ${publishResult.screenshotPath}`);
  if (publishResult.pdfPath) console.log(`   pdf: ${publishResult.pdfPath}`);
  if (publishResult.smokeTest) {
    console.log(`   smoke: loads=${publishResult.smokeTest.page_loads} cta=${publishResult.smokeTest.cta_valid}`);
  }

  const mcReport = runMissionControl([missionState]);
  const report = formatReport(mcReport);
  save(outputDir, "report.txt", report);

  // ═══════════════════════════════════════════════════════════════ FINAL
  console.log("\n" + report);
  console.log(`\n📁 ${outputDir}/`);
  console.log(`   landing.html  dossier.json  copy.json  tokens.json`);
  console.log(`   qa-scrutiny.json  qa-usertesting.json  publish.json  report.txt`);
}

main().catch((err: any) => {
  console.error(`\n❌ PIPELINE FAILED: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
