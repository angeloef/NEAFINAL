import { MissionState } from "@lpb/contracts";
import { initState } from "./state.js";
import { transitionEstado } from "./gating.js";
import { checkBudget } from "./budget.js";

export interface Prospect {
  place_id: string;
  /** Used as mission_id; defaults to place_id if omitted. */
  id?: string;
}

export type MissionRunner = (state: MissionState) => Promise<MissionState>;

/**
 * Fleet: 1 mission per prospect, parallel between prospects, serial within.
 * Returns final states for all missions.
 */
export async function runFleet(
  prospects: Prospect[],
  runner: MissionRunner,
  budgetUsd = 1.0,
): Promise<MissionState[]> {
  return Promise.all(
    prospects.map((p) => runMission(p.id ?? p.place_id, runner, budgetUsd)),
  );
}

async function runMission(
  missionId: string,
  runner: MissionRunner,
  budgetUsd: number,
): Promise<MissionState> {
  // initState returns persisted state if it exists, or creates fresh one.
  let state = initState(missionId, budgetUsd);
  if (state.estado === "presentado") return state;

  state = transitionEstado(state, "ejecutando");

  if (!checkBudget(state).withinBudget) {
    return transitionEstado(state, "en_cola");
  }

  try {
    return await runner(state);
  } catch {
    return transitionEstado(state, "en_cola");
  }
}
