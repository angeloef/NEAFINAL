---
id: contracts-schemas
title: Contratos y schemas (connective tissue)
status: completed
area: contracts
related_areas: [orchestration, worker/research, worker/copy, worker/brand, validation]
priority: P0
depends_on: []
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#6, #7, #8, #12]
---

# Contratos y schemas (connective tissue)

## Problema
No existe la capa de contratos que conecta todos los bloques. Hay que definir los 6 artefactos JSON que viajan entre workers/validadores —`dossier`, `copy`, `tokens`, `handoff`, `validation_contract`, `mission_state`— como schemas con validación runtime y export a JSON Schema (para que los subagentes los consuman), una librería de validación reutilizable, y **fixtures golden** derivados de prospectos reales. Sin esta capa ningún bloque se puede construir ni testear aislado.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §6 (validation_contract con assertions), §7 (handoff), §8 (mission_state), §12 (tabla de artefactos), y la definición de clases de campo del Research.
- `../clientes_prospectos.md` — fuente de fixtures reales (Koziarski 🔴, Flosi 🟢, Drössler 🔴, con sus place_ids/CIDs).
- `packages/contracts/` — paquete a crear (`@lpb/contracts`).

## Criterios de aceptación
- [ ] Schemas (Zod) para `dossier`, `copy`, `tokens`, `handoff`, `validation_contract`, `mission_state`.
- [ ] Cada campo de dato del `dossier` tiene forma `{ valor, clase, source, confidence, fecha }` con `clase ∈ {VERIFICADO-OBLIG, VERIFICADO-OPC, PLANTILLA, INFERIDO}`.
- [ ] Export de cada schema a **JSON Schema** (p.ej. `zod-to-json-schema`) para los prompts de subagentes.
- [ ] `validate(artefacto, tipo)` con mensajes de error legibles.
- [ ] `coverageCheck(contract, features)` que verifica la regla "cada feature cubre ≥1 assertion y la unión cubre el 100% de las bloqueantes".
- [ ] ≥3 fixtures de `dossier`: uno apto rico, uno apto mínimo (nombre+ciudad+tel+place_id), uno que rutea a cola.
- [ ] `validation_contract` `landing_legal_v2` cargado y parseable.
- [ ] Tests: cada schema acepta su fixture válido y rechaza una variante inválida.

## Dirección sugerida (no vinculante)
Zod como **única fuente** (tipos estáticos + runtime + JSON Schema). Un paquete `@lpb/contracts` con `schemas/`, `fixtures/`, `validate.ts`. Mantener los ejemplos JSON del spec (§6–§8) como base de los fixtures.

## Fuera de alcance / no tocar
Lógica de negocio de los workers, scraping, render. Acá solo viven definiciones de datos y su validación.

## Skills / MCP / workflow recomendado
- **Contrato-primero**: escribir el test del schema antes del schema.
- Diff mínimo: un commit por schema.
- Sin MCP externo.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
- 2026-06-23 — **Implementado.** Paquete `@lpb/contracts` (pnpm workspace nuevo en la raíz del proyecto). Zod = fuente única: 6 schemas (`dossier`, `copy`, `tokens`, `handoff`, `validation_contract`, `mission_state`) con `DataField {valor,clase,source,confidence,fecha}` y `clase ∈ {VERIFICADO-OBLIG,VERIFICADO-OPC,PLANTILLA,INFERIDO}`. `validate(artefacto,tipo)` con errores legibles; `coverageCheck(contract,features)` (cada feature ≥1 assertion + 100% bloqueantes); export a JSON Schema vía `zod-to-json-schema` (`pnpm gen:schemas` → `json-schema/*.json`, 6 archivos). Fixtures golden: `dossier.flosi` (apto rico), `dossier.koziarski` (apto mínimo nombre+ciudad+tel+place_id), `dossier.drossler` (rutea a cola), `validation_contract.landing_legal_v2`. **Gates:** tsc strict ✓, vitest 17/17 ✓, build ✓, gen:schemas ✓. Review typescript-reviewer: aplicado `StringArrayField` nombrado (dedup $ref); guard de runtime y semántica `"*"` documentados como intencionales. Docker/Chrome UX gates N/A (sin UI). Commit local (sin push: monorepo personal compartido, sin Render).
