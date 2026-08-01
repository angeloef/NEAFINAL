/**
 * quality.ts — Quality gate (QL-01..04). Raises the floor beyond "don't lie":
 * a page must also be structurally complete and visually sound.
 *
 * Inputs are optional; each assertion runs only when its input is present, so
 * the gate composes with whatever artifacts a mission has produced.
 */

import type { PagePlan, Tokens } from "@lpb/contracts";
import { FieldClass } from "@lpb/contracts";
import { checkContrastAA } from "./contrast.js";
import { QABuilder, type QAResult } from "./qa.js";

export interface QualityInput {
  mission_id: string;
  plan?: PagePlan;
  html?: string;
  tokens?: Tokens;
}

const MIN_BLOCKS = 6;
const REQUIRED_BLOCKS = ["hero", "contact", "footer"] as const;
const VALID_CLASSES = new Set<string>(FieldClass.options);

/** Collect every fact-shaped field ({ valor, clase }) anywhere in the plan. */
function collectFactClasses(obj: unknown): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      const rec = node as Record<string, unknown>;
      if ("valor" in rec && "clase" in rec && typeof rec.clase === "string") {
        out.push(rec.clase);
      }
      Object.values(rec).forEach(walk);
    }
  };
  walk(obj);
  return out;
}

/** Extract Unsplash image URLs from rendered HTML. */
function imageUrls(html: string): string[] {
  return [...html.matchAll(/src="(https:\/\/images\.unsplash[^"]+)"/g)].map(
    (m) => m[1],
  );
}

/**
 * Run the quality gate. Returns a QAResult; `status: "fail"` if any QL fails.
 */
export function runQualityGate(input: QualityInput): QAResult {
  const qa = new QABuilder(input.mission_id, "scrutiny", "quality-gate");
  qa.recordCommand(`quality:gate ${input.mission_id}`, 0);

  // ── QL-01: ≥6 blocks + hero/contact/footer present ──────────────────────────
  if (input.plan) {
    const types = input.plan.blocks.map((b) => b.type);
    if (types.length < MIN_BLOCKS) {
      qa.failAssertion(
        "QL-01",
        `Only ${types.length} blocks; minimum is ${MIN_BLOCKS}`,
        "alta",
      );
    }
    for (const required of REQUIRED_BLOCKS) {
      if (!types.includes(required)) {
        qa.failAssertion("QL-01", `Missing required block: ${required}`, "alta");
      }
    }
  } else {
    qa.addIssue("No plan provided — skipping QL-01");
  }

  // ── QL-02: image variety (no duplicate URL) ─────────────────────────────────
  if (input.html) {
    const urls = imageUrls(input.html);
    const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
    if (dupes.length > 0) {
      qa.failAssertion(
        "QL-02",
        `Duplicate image URL(s): ${[...new Set(dupes)].join(", ")}`,
        "media",
      );
    }
  } else {
    qa.addIssue("No HTML provided — skipping QL-02");
  }

  // ── QL-03: placeholder data correctly classed (no unknown/masquerading) ─────
  if (input.plan) {
    const classes = collectFactClasses(input.plan);
    const invalid = classes.filter((c) => !VALID_CLASSES.has(c));
    if (invalid.length > 0) {
      qa.failAssertion(
        "QL-03",
        `Fact field(s) with invalid clase: ${[...new Set(invalid)].join(", ")}`,
        "alta",
      );
    }
  } else {
    qa.addIssue("No plan provided — skipping QL-03");
  }

  // ── QL-04: contrast AA + hierarchy (single h1, has section titles) ──────────
  if (input.html) {
    const h1Count = (input.html.match(/<h1[\s>]/g) ?? []).length;
    if (h1Count !== 1) {
      qa.failAssertion("QL-04", `Expected exactly one <h1>, found ${h1Count}`, "alta");
    }
    if (!/<h2[\s>]/.test(input.html)) {
      qa.failAssertion("QL-04", "No <h2> section titles found", "media");
    }
  } else {
    qa.addIssue("No HTML provided — skipping QL-04 hierarchy");
  }
  if (input.tokens) {
    const { text, surface } = input.tokens.color;
    const result = checkContrastAA(text, surface);
    if (result && !result.passes) {
      qa.failAssertion(
        "QL-04",
        `Body text/surface contrast ${result.ratio.toFixed(2)}:1 below AA 4.5:1`,
        "alta",
      );
    }
  } else {
    qa.addIssue("No tokens provided — skipping QL-04 contrast");
  }

  return qa.build();
}
