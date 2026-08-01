---
id: worker-assembly
title: Worker Secciones + Ensamblado → mockup
status: pending
area: worker/assembly
related_areas: [worker/copy, worker/brand, validation]
priority: P3
depends_on: [worker-copy, worker-brand]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#5, #6, #12]
---

# Worker Secciones + Ensamblado → mockup

## Problema
Worker que toma `copy.json` + `tokens.json` y **ensambla el mockup** (secciones → página completa). Build determinístico, con **degradación elegante** (las secciones opcionales aparecen solo si hay dato; su ausencia no rompe el layout). Maneja los **follow-up features** que devuelve el loop de QA.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §5, §6 (CP-01, PR-01, CTA-01), §12.
- `packages/worker-assembly/` y `templates/` — a crear. Modelo: Sonnet 4.6.

## Criterios de aceptación
- [ ] Toma `copy.json` + `tokens.json` ⇒ `mockup/` (HTML; Astro opcional).
- [ ] Cubre **CP-01** (opcionales solo si hay dato) y **PR-01** (resultado pulido).
- [ ] Build sin errores; el mockup renderiza standalone.
- [ ] Secciones: hero, áreas de práctica, sobre el estudio, prueba social, contacto/mapa, footer.
- [ ] CTA WhatsApp/tel con el número real (**CTA-01**).
- [ ] Acepta follow-up features del validador y **re-ensambla** sin romper lo bueno.
- [ ] Test con artefactos golden ⇒ mockup válido y completo/degradado.

## Dirección sugerida (no vinculante)
Plantilla(s) en `templates/` parametrizadas por tokens; un componente por sección con lógica de degradación. **HTML estático / Astro** recomendado para demo liviano y screenshot rápido. Los tokens nombrados (`--color-primary`, etc.) vienen de `worker-brand`.

## Fuera de alcance / no tocar
Research, copy y tokens (ya resueltos). Empaquetado/hosting (eso es `presentation`).

## Skills / MCP / workflow recomendado
- `design:design-system` (consistencia con tokens), `design:design-critique` (auto-revisión antes de pasar a validación).
- Diff mínimo; un componente de sección por commit.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
