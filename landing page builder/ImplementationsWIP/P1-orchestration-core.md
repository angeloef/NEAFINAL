---
id: orchestration-core
title: Orquestación y bookkeeping (fleet + misión)
status: completed
area: orchestration
related_areas: [contracts, validation]
priority: P1
depends_on: [contracts-schemas]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#0, #3, #4, #7, #8, #10]
---

# Orquestación y bookkeeping (fleet + misión)

## Problema
Falta el orquestador (nivel **fleet** y nivel **misión**) y el bookkeeping determinístico que encadena artefactos, mantiene `mission_state`, hace **gating por handoff** y controla presupuesto. La inteligencia (planeamiento, decomposición en features, decisión de follow-ups) vive en **prompts/skills de subagentes Claude Code**, no en una state machine rígida; solo el bookkeeping es código (bitter lesson).

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §3 (niveles L0–L3), §4 (roles), §7 (gating por handoff), §8 (mission_state), §10 (serial + paralelo entre prospectos).
- `packages/orchestrator/` — a crear.
- `.claude/agents/` — definiciones de subagente por rol (orquestador=Opus 4.8, workers=Sonnet 4.6, validadores=Opus 4.8).

## Criterios de aceptación
- [x] State machine fina: `planificando → ejecutando → validando → (en_cola | aprobado) → presentado`.
- [x] **Gating**: bloquea avance de milestone si un handoff reporta issues no resueltos o assertions bloqueantes sin cubrir.
- [x] **Fleet**: itera prospectos, 1 misión por prospecto, **paralelo entre prospectos** (outputs independientes), **serial dentro** de la misión.
- [x] Tracking de presupuesto (tokens/usd) por misión, persistido en `mission_state`.
- [x] Definiciones de subagente por rol con su modelo asignado.
- [x] `mission_state` persistido por prospecto en disco → **resume entre sesiones** en frío.
- [x] Mission control v0 = lectura de `mission_state` (CLI/JSON). Sin UI todavía.
- [x] Test: una misión simulada con handoff "con issues" NO avanza de milestone.

## Dirección sugerida (no vinculante)
Orquestación en texto (prompts/skills, ~cientos de líneas editables; cuatro frases pueden cambiar la estrategia). Bookkeeping en TS. Subagentes vía la herramienta Task. Estado en archivos JSON por prospecto (amigable a multi-sesión). Paralelización **solo de lectura** dentro de features/validadores.

## Fuera de alcance / no tocar
UI de mission control (eso es P3). Lógica interna de cada worker (sus propios planes). No meter lógica de negocio en la state machine.

## Skills / MCP / workflow recomendado
- Subagentes en paralelo **solo para read-only**.
- Diagramar el flujo de fallos; idempotencia de cada paso.
- Diff mínimo: un commit por criterio.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
- 2026-06-23 — Implementado: `packages/orchestrator/` (state, gating, budget, fleet, bin/mission-control). Agentes `.claude/agents/{orchestrator,worker,validator}.md`. Gates: lint ✓, 7/7 tests ✓. Ponytail aplicado (doble-load eliminado, bug tokens_max corregido).
