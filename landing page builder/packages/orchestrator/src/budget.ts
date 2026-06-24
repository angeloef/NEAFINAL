import { MissionState } from "@lpb/contracts";
import { saveState } from "./state.js";

const USD_PER_TOKEN = 0.000015; // ponytail: rough average; adjust per model

export interface BudgetCheck {
  withinBudget: boolean;
  tokensRemaining: number;
  usdUsed: number;
}

export function checkBudget(state: MissionState): BudgetCheck {
  const usdUsed = state.presupuesto.tokens_usados * USD_PER_TOKEN;
  const tokensRemaining = state.presupuesto.tokens_max - state.presupuesto.tokens_usados;
  return {
    withinBudget: tokensRemaining > 0 && usdUsed <= state.presupuesto.usd_max,
    tokensRemaining,
    usdUsed,
  };
}

export function recordUsage(state: MissionState, tokensUsed: number): MissionState {
  const updated: MissionState = {
    ...state,
    presupuesto: {
      ...state.presupuesto,
      tokens_usados: state.presupuesto.tokens_usados + tokensUsed,
    },
  };
  saveState(updated);
  return updated;
}
