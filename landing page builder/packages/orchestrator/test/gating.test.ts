import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { Handoff, MissionState } from "@lpb/contracts";
import { evaluateHandoff, advanceMilestone } from "../src/gating.js";
import { initState } from "../src/state.js";

const tmpDir = path.join(os.tmpdir(), `lpb-orch-test-${Date.now()}`);

beforeEach(() => {
  process.env.MISSION_STATE_DIR = tmpDir;
  fs.mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.MISSION_STATE_DIR;
});

function makeHandoff(overrides: Partial<Handoff> = {}): Handoff {
  return {
    mission_id: "test-mission",
    feature: "research",
    rol: "worker",
    modelo: "claude-sonnet-4-6",
    status: "completado",
    completado: ["Obtuvo dossier"],
    pendiente: [],
    comandos: [],
    issues_descubiertos: [],
    assertions_cubiertas: [],
    respeto_procedimientos: true,
    artefacto_salida: "dossier.json",
    ...overrides,
  };
}

function makeState(): MissionState {
  return initState("test-mission");
}

describe("evaluateHandoff", () => {
  it("pasa handoff limpio", () => {
    const result = evaluateHandoff(makeHandoff());
    expect(result.ok).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("bloquea si status=bloqueado", () => {
    const result = evaluateHandoff(makeHandoff({ status: "bloqueado" }));
    expect(result.ok).toBe(false);
    expect(result.blockers[0]).toMatch(/bloqueado/);
  });

  it("bloquea si hay issues sin cubrir", () => {
    const result = evaluateHandoff(
      makeHandoff({ issues_descubiertos: ["falta teléfono"], assertions_cubiertas: [] }),
    );
    expect(result.ok).toBe(false);
    expect(result.blockers[0]).toMatch(/falta teléfono/);
  });

  it("pasa si issue está cubierto en assertions_cubiertas", () => {
    const result = evaluateHandoff(
      makeHandoff({
        issues_descubiertos: ["falta teléfono"],
        assertions_cubiertas: ["falta teléfono"],
      }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("advanceMilestone", () => {
  it("avanza milestone con handoffs limpios", () => {
    const state = makeState();
    const { state: next, gate } = advanceMilestone(state, [makeHandoff()]);
    expect(gate.ok).toBe(true);
    expect(next.milestone_actual).toBe(1);
    expect(next.estado).toBe("planificando");
  });

  it("NO avanza milestone si handoff tiene issues — criterio de aceptación clave", () => {
    const state = makeState();
    const handoffConIssues = makeHandoff({
      issues_descubiertos: ["teléfono no verificado"],
    });
    const { state: next, gate } = advanceMilestone(state, [handoffConIssues]);
    expect(gate.ok).toBe(false);
    expect(next.milestone_actual).toBe(0);
    expect(next.estado).toBe("en_cola");
  });

  it("registra features de handoffs en estado.handoffs", () => {
    const state = makeState();
    const { state: next } = advanceMilestone(state, [makeHandoff()]);
    expect(next.handoffs).toContain("research");
  });
});
