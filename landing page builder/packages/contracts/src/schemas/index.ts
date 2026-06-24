import { Dossier } from "./dossier.js";
import { Copy } from "./copy.js";
import { Tokens } from "./tokens.js";
import { Handoff } from "./handoff.js";
import { ValidationContract } from "./validationContract.js";
import { MissionState } from "./missionState.js";
import { PagePlan } from "./pagePlan.js";

export * from "./dataField.js";
export * from "./dossier.js";
export * from "./copy.js";
export * from "./tokens.js";
export * from "./handoff.js";
export * from "./validationContract.js";
export * from "./missionState.js";
export * from "./pagePlan.js";

/** Registro de artefactos por nombre, fuente única para validate/genSchemas. */
export const schemas = {
  dossier: Dossier,
  copy: Copy,
  tokens: Tokens,
  handoff: Handoff,
  validation_contract: ValidationContract,
  mission_state: MissionState,
  page_plan: PagePlan,
} as const;

export type ArtefactName = keyof typeof schemas;
