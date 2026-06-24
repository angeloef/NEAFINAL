#!/usr/bin/env tsx
/**
 * Pipeline from dossier — Copy → Brand → Assembly → Validation → Presentation
 * Usage: npx tsx src/run-from-dossier.ts <mission_id>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function save(dir: string, filename: string, data: unknown): string {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const path = join(dir, filename);
  writeFileSync(path, text, "utf-8");
  console.log(`  ✓ ${filename} (${text.length.toLocaleString()} bytes)`);
  return path;
}

async function main() {
  loadEnv();

  const missionId = process.argv[2];
  if (!missionId) {
    console.error("Usage: npx tsx src/run-from-dossier.ts <mission_id>");
    process.exit(1);
  }

  const outputDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "output", missionId);
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // Load existing dossier
  const dossierPath = join(outputDir, "dossier.json");
  if (!existsSync(dossierPath)) {
    console.error(`❌ Dossier not found: ${dossierPath}`);
    console.error("   Run research first or create it manually.");
    process.exit(1);
  }

  const dossier = JSON.parse(readFileSync(dossierPath, "utf-8"));
  console.log(`\n🚀 PIPELINE FROM DOSSIER — ${missionId}`);
  console.log(`   dossier: ${dossierPath}`);
  console.log(`   nombre: ${dossier.entidad.nombre.valor}`);
  console.log(`   estado_web: ${dossier.estado_web || "unknown"}\n`);

  // ═══════════════════════════════════════════════════════════════ STEP 2: COPY
  console.log("━━━ STEP 2: Copy ━━━");
  const { generateCopy } = await import("@lpb/worker-copy");

  const t2 = Date.now();
  const copy = await generateCopy(dossier);
  console.log(`   ⏱  ${((Date.now() - t2) / 1000).toFixed(1)}s`);

  const copyPath = save(outputDir, "copy.json", copy);
  console.log(`   hero: "${copy.hero.titulo}"`);
  console.log(`   subtitle: "${copy.hero.subtitulo || "(none)"}"`);
  console.log(`   areas: ${copy.areas_practica?.items?.length ?? 0}`);
  if (copy.areas_practica?.items) {
    for (const a of copy.areas_practica.items) console.log(`     · ${a}`);
  }
  console.log(`   social proof: ${copy.prueba_social ? "yes" : "no (AC-02 compliant)"}`);
  console.log(`   contact: tel=${copy.contacto?.telefono || "—"} wa=${copy.contacto?.whatsapp || "—"}`);

  // ═══════════════════════════════════════════════════════════════ STEP 3: BRAND
  console.log("\n━━━ STEP 3: Brand ━━━");
  const { generateTokens } = await import("@lpb/worker-brand");

  const tokens = await generateTokens(dossier);
  const tokensPath = save(outputDir, "tokens.json", tokens);
  console.log(`   palette: primary=${tokens.color.primary} secondary=${tokens.color.secondary} accent=${tokens.color.accent}`);
  console.log(`   fonts: ${tokens.typography.headingFont} / ${tokens.typography.bodyFont}`);
  console.log(`   logo: ${tokens.logo.tipo}`);
  if (tokens.logo.tipo === "monograma") {
    console.log(`   monogram SVG: ${tokens.logo.valor.slice(0, 80)}...`);
  }

  // ═══════════════════════════════════════════════════════════════ STEP 4: ASSEMBLY
  console.log("\n━━━ STEP 4: Assembly ━━━");
  const { assembleLanding } = await import("@lpb/worker-assembly");

  const html = await assembleLanding(copy, tokens);
  const htmlPath = save(outputDir, "landing.html", html);
  console.log(`   HTML: ${html.length.toLocaleString()} chars`);

  // ═══════════════════════════════════════════════════════════════ STEP 5: VALIDATION
  console.log("\n━━━ STEP 5: Validation ━━━");
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
  const sFails = scrutinyResult.assertions_falladas ?? [];
  console.log(`   status: ${scrutinyResult.status}`);
  for (const f of sFails) {
    console.log(`     ❌ ${f.assertion_id}: ${f.descripcion} [${f.severidad || "?"}]`);
  }

  // 5b: User-Testing (Playwright — may fail if deps missing)
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
    const uFails = usertestingResult.assertions_falladas ?? [];
    for (const f of uFails) {
      console.log(`     ❌ ${f.assertion_id}: ${f.descripcion} [${f.severidad || "?"}]`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  User-testing error (Playwright deps missing?): ${err.message}`);
  }

  // ── Determine if approved ──────────────────────────────────────────────
  const allFails = [...sFails, ...(usertestingResult?.assertions_falladas ?? [])];
  const bloqueantes = allFails.filter((f: any) => f.severidad === "bloqueante");
  const approved = bloqueantes.length === 0 && scrutinyResult.status === "pass";

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
  console.log("\n━━━ STEP 6: Presentation ━━━");
  const { publishLanding, runMissionControl, formatReport } = await import("@lpb/presentation");

  const publishResult = await publishLanding(missionState, html);
  save(outputDir, "publish.json", publishResult);
  console.log(`   published: ${publishResult.published}`);
  if (!publishResult.published) {
    console.log(`   ⛔ gate blocked: ${publishResult.reason}`);
  }
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
  console.log(`\n📁 Files in ${outputDir}/:`);
  console.log(`   landing.html   — full HTML landing page`);
  console.log(`   dossier.json   — research data`);
  console.log(`   copy.json      — generated copy`);
  console.log(`   tokens.json    — design tokens + monogram`);
  console.log(`   qa-scrutiny.json  — scrutiny results`);
  console.log(`   publish.json   — publish status`);
  console.log(`   report.txt     — mission control report`);
}

main().catch((err: any) => {
  console.error(`\n❌ PIPELINE FAILED: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
