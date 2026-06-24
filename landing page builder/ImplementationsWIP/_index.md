# ImplementationsWIP — Mapa de planes (memoria entre sesiones)

> Construcción de la arquitectura **Rev 2 (Missions)** para generación de landings de prospectos.
> Spec de referencia: `../arquitectura_rev2_missions.md`. Fixtures: `../clientes_prospectos.md`.
> Cada plan es un **briefing autónomo**: una sesión futura debe poder ejecutarlo en frío leyendo solo ese archivo + el spec.

## Cómo usar esto entre sesiones
1. Elegí un plan según prioridad y `depends_on` (no arranques uno cuyo dependiente no esté `done`).
2. Leé el plan + las secciones del spec que referencia.
3. Ejecutá; al terminar, marcá `status: done` en su frontmatter y agregá hallazgos a su **Bitácora**.
4. Actualizá la tabla de abajo.

## Stack acordado
- **TypeScript/Node**, monorepo **pnpm**. **Zod** = fuente única de contratos (tipos + runtime + JSON Schema).
- **Playwright** (en Docker) para validación UI/UX; Chrome DevTools MCP como alternativa.
- **HTML/Astro** para mockups (demo liviano, screenshot rápido).
- **Google Places REST API** (key disponible) para datos duros del Research.

## Modelos por rol (droid whispering)
- **Orquestador (planeamiento):** Opus 4.8
- **Workers (implementación):** Sonnet 4.6
- **Validadores (verificación, contexto fresco):** Opus 4.8 (tier distinto al worker, para reducir sesgo compartido)

## Estructura de repo objetivo
```
landing page builder/
  packages/
    contracts/        # Zod schemas + JSON Schema + fixtures
    orchestrator/     # bookkeeping, state, gating, budget, CLI
    worker-research/  worker-copy/  worker-brand/  worker-assembly/
    validation/       # scrutiny + user-testing (Playwright/Docker)
    presentation/     # packaging + mission control
  .claude/agents/     # defs de subagentes por rol (modelo asignado)
  templates/          # plantillas de landing
  ImplementationsWIP/ # estos planes
```

## Tabla de planes

| id | área | prioridad | status | depends_on |
|---|---|---|---|---|
| contracts-schemas | contracts | P0 | completed | — |
| orchestration-core | orchestration | P1 | completed | contracts-schemas |
| worker-research | worker/research | P1 | pending | contracts-schemas |
| worker-copy | worker/copy | P2 | pending | contracts-schemas, worker-research |
| worker-brand | worker/brand | P2 | pending | contracts-schemas, worker-research |
| validation-harness | validation | P2 | pending | contracts-schemas |
| worker-assembly | worker/assembly | P3 | pending | worker-copy, worker-brand |
| presentation | presentation | P3 | pending | worker-assembly, validation-harness |

## Orden sugerido de ejecución
1. `contracts-schemas` (todo depende de esto)
2. `worker-research` + `orchestration-core` (en paralelo, ambos sobre contratos)
3. `worker-copy` + `worker-brand` (sobre research)
4. `validation-harness` (puede empezar scrutiny temprano)
5. `worker-assembly`
6. `presentation`

## Bitácora global
- 2026-06-23 — Planes creados desde la arquitectura Rev 2. Stack y modelos acordados con el usuario.
