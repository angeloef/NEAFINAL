---
id: validation-harness
title: Validadores adversariales (scrutiny + user-testing)
status: pending
area: validation
related_areas: [contracts, worker/assembly]
priority: P2
depends_on: [contracts-schemas]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#4.3, #6, #11]
---

# Validadores adversariales (scrutiny + user-testing)

## Problema
Construir los **dos validadores** (contexto fresco, nunca vieron el código): **scrutiny** (schema, lint, build, fact-check contra el dossier, code-review por sección) y **user-testing** (render real del mockup en **Docker** con Playwright / Chrome DevTools MCP: CTA, responsive, a11y, screenshots). Salida `qa-*.json` con assertions falladas que alimenta el loop de follow-up.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §4.3 (roles validadores), §6 (assertions UX-01, UX-02, CTA-01, AC-*, PR-01), §11 (loop M3).
- `packages/validation/` — a crear. Modelo: Opus 4.8, **contexto fresco**.
- `Dockerfile` reproducible (el Chrome MCP nativo de Windows a veces falla → contenedor).

## Criterios de aceptación
- [ ] **Scrutiny**: valida artefactos vs schema, corre build, **fact-check** (cada dato renderizado ↔ campo `VERIFICADO` del dossier), spawnea **code-review por sección** (paralelo, read-only). Output `qa-scrutiny.json`.
- [ ] **User-testing**: levanta el mockup headless en Docker, clickea CTA WhatsApp/tel (resuelve al número real), verifica render de todas las secciones, **responsive** mobile/desktop, **contraste AA**, toma screenshots. Output `qa-usertesting.json`.
- [ ] Ambos reportan assertions falladas por `id`.
- [ ] Corren con modelo distinto al worker (Opus 4.8) y contexto fresco.
- [ ] Test: mockup roto a propósito (CTA muerto, contraste malo, sección faltante) ⇒ detectado.

## Dirección sugerida (no vinculante)
Empezar por **scrutiny** (rápido, sin navegador). Después user-testing en contenedor. Las assertions del `validation_contract` se vuelven un checklist ejecutable. Code-review vía subagentes paralelos de solo lectura. Es el tramo más lento en wall-clock (render real).

## Fuera de alcance / no tocar
Arreglar el mockup (eso lo hace `worker-assembly` vía follow-up). No tocar los artefactos de entrada.

## Skills / MCP / workflow recomendado
- Playwright en Docker; **Chrome DevTools MCP** como alternativa.
- `design:accessibility-review` (a11y / WCAG AA) y `design:design-critique` (revisión UI/UX).
- Validación **adversarial**: asumir que el mockup está mal hasta probar lo contrario.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
