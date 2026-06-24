---
id: presentation
title: Presentación + Mission Control
status: pending
area: presentation
related_areas: [worker/assembly, validation, orchestration]
priority: P3
depends_on: [worker-assembly, validation-harness]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#3, #8, #12]
---

# Presentación + Mission Control

## Problema
Empaquetar el mockup **aprobado** para presentárselo al prospecto: **URL única** por prospecto + **screenshot** + **PDF**. Más **Mission Control v1**: una vista que lee el `mission_state` de todas las misiones (% completado, presupuesto quemado, cola de revisión) para correr el lote de forma asíncrona.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §3 (L3), §8 (mission_state), §12.
- `packages/presentation/` — a crear.

## Criterios de aceptación
- [ ] Toma un mockup en estado `aprobado` ⇒ URL única (hosting estático) + screenshot + PDF.
- [ ] **Solo** empaqueta misiones en estado `aprobado` (no toca las en cola).
- [ ] Smoke test del link público y del CTA en producción.
- [ ] Mission Control: vista que lee los `mission_state` de todos los prospectos (% completado, presupuesto, cola).
- [ ] Test: misión no-aprobada NO se publica.

## Dirección sugerida (no vinculante)
Hosting estático (decidir proveedor). Screenshot/PDF vía Playwright. Mission Control puede ser un **cowork artifact** que lee los `mission_state` y se refresca, o una página estática simple.

## Fuera de alcance / no tocar
El **outreach** a los prospectos (envío de la propuesta) es otro flujo, no parte de esto. No re-generar mockups acá.

## Skills / MCP / workflow recomendado
- Playwright para screenshot/PDF.
- `create_artifact` (Cowork) para Mission Control si se quiere algo vivo y re-abrible.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
