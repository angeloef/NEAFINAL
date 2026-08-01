import * as fs from "node:fs";
import * as path from "node:path";
import { MissionState } from "@lpb/contracts";

const USD_PER_TOKEN = 0.000015; // ponytail: rough average; adjust per model

const DEFAULT_STATE_DIR = path.join(process.cwd(), ".mission-states");

function stateDir(): string {
  return process.env.MISSION_STATE_DIR ?? DEFAULT_STATE_DIR;
}

function stateFile(missionId: string): string {
  return path.join(stateDir(), `${missionId}.json`);
}

export function loadState(missionId: string): MissionState | null {
  const file = stateFile(missionId);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  return MissionState.parse(raw);
}

export function saveState(state: MissionState): void {
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(stateFile(state.mission_id), JSON.stringify(state, null, 2));
}

export function listStates(): MissionState[] {
  const dir = stateDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as unknown;
      return MissionState.parse(raw);
    });
}

export function initState(missionId: string, budgetUsd = 1.0): MissionState {
  const existing = loadState(missionId);
  if (existing) return existing;
  const fresh: MissionState = {
    mission_id: missionId,
    estado: "planificando",
    milestone_actual: 0,
    presupuesto: {
      tokens_max: Math.round(budgetUsd / USD_PER_TOKEN),
      tokens_usados: 0,
      usd_max: budgetUsd,
    },
    features: [],
    validaciones: [],
    follow_up_features: [],
    handoffs: [],
  };
  saveState(fresh);
  return fresh;
}
