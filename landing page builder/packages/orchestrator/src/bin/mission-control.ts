#!/usr/bin/env node
import { listStates, loadState } from "../state.js";

const [, , cmd, missionId] = process.argv;

switch (cmd) {
  case "list": {
    const states = listStates();
    if (states.length === 0) {
      process.stdout.write("No missions found.\n");
      break;
    }
    for (const s of states) {
      process.stdout.write(
        `${s.mission_id}  estado=${s.estado}  milestone=${s.milestone_actual}  tokens=${s.presupuesto.tokens_usados}/${s.presupuesto.tokens_max}\n`,
      );
    }
    break;
  }
  case "show": {
    if (!missionId) {
      process.stderr.write("Usage: mission-control show <mission_id>\n");
      process.exit(1);
    }
    const state = loadState(missionId);
    if (!state) {
      process.stderr.write(`Mission not found: ${missionId}\n`);
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(state, null, 2) + "\n");
    break;
  }
  default:
    process.stdout.write("Usage: mission-control [list | show <id>]\n");
}
