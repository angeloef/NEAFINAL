import { Handoff, MissionState } from "@lpb/contracts";
import { saveState } from "./state.js";

export interface GateResult {
  ok: boolean;
  blockers: string[];
}

/**
 * Un handoff bloquea avance si:
 *  - status === "bloqueado"
 *  - tiene issues_descubiertos que no están cubiertos en assertions_cubiertas
 */
export function evaluateHandoff(handoff: Handoff): GateResult {
  const blockers: string[] = [];

  if (handoff.status === "bloqueado") {
    blockers.push(`handoff ${handoff.feature}: status=bloqueado`);
  }

  const uncovered = handoff.issues_descubiertos.filter(
    (issue) => !handoff.assertions_cubiertas.includes(issue),
  );
  for (const issue of uncovered) {
    blockers.push(`handoff ${handoff.feature}: issue sin cubrir → "${issue}"`);
  }

  return { ok: blockers.length === 0, blockers };
}

export function advanceMilestone(
  state: MissionState,
  handoffs: Handoff[],
): { state: MissionState; gate: GateResult } {
  const allBlockers: string[] = [];
  for (const h of handoffs) {
    const result = evaluateHandoff(h);
    allBlockers.push(...result.blockers);
  }

  if (allBlockers.length > 0) {
    const blocked: MissionState = { ...state, estado: "en_cola" };
    saveState(blocked);
    return { state: blocked, gate: { ok: false, blockers: allBlockers } };
  }

  const next: MissionState = {
    ...state,
    milestone_actual: state.milestone_actual + 1,
    handoffs: [...state.handoffs, ...handoffs.map((h) => h.feature)],
  };
  saveState(next);
  return { state: next, gate: { ok: true, blockers: [] } };
}

export function transitionEstado(
  state: MissionState,
  next: MissionState["estado"],
): MissionState {
  const updated: MissionState = { ...state, estado: next };
  saveState(updated);
  return updated;
}
