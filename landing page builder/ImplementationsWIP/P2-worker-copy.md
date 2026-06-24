---
id: worker-copy
title: Worker Copy → copy.json
status: pending
area: worker/copy
related_areas: [contracts, worker/research]
priority: P2
depends_on: [contracts-schemas, worker-research]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#5, #6]
---

# Worker Copy → copy.json

## Problema
Worker que toma `dossier.json` y genera `copy.json` (hero, áreas de práctica, sobre el estudio, CTA, prueba social) respetando estrictamente las clases de campo: **cero claims falsos**, copy plantilla-segura donde falte dato, y **sin testimonios salvo reseñas reales** del dossier. Es el guardián de la veracidad legal en texto.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §5, §6 (contrato: ID-01, AC-01, AC-02, LG-01).
- `packages/worker-copy/` — a crear. Modelo: Sonnet 4.6.

## Criterios de aceptación
- [ ] `copy.json` válido contra schema; cada bloque mapea las assertions que cubre.
- [ ] Cubre **ID-01, AC-01, AC-02, LG-01**.
- [ ] Ningún dato fáctico que no mapee a un campo `VERIFICADO` del dossier.
- [ ] Sin claims legales prohibidos (resultados garantizados / superioridad comparativa).
- [ ] Áreas de práctica genéricas (plantilla-segura) si no hay reales en el dossier.
- [ ] Prueba social en el copy **solo si** hay reseñas reales.
- [ ] Test: dossier sin reseñas ⇒ `copy.json` sin sección de testimonios.

## Dirección sugerida (no vinculante)
LLM (Sonnet) con el `dossier` + el `validation_contract` inyectado como guardrail en el prompt. Salida estructurada por sección con `assertions_cubiertas`. Tono según `dossier.tono`.

## Fuera de alcance / no tocar
Diseño visual, tokens, render. No inventar datos para "rellenar".

## Skills / MCP / workflow recomendado
- `design:ux-copy` para microcopy y CTA.
- Contrato como checklist; auto-verificar assertions cubiertas antes de cerrar.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
