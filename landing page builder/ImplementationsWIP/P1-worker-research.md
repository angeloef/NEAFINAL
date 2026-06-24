---
id: worker-research
title: Worker Research → dossier.json
status: in_progress
area: worker/research
related_areas: [contracts]
priority: P1
depends_on: [contracts-schemas]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#5, #6, #12, bloque Research Rev1]
---

# Worker Research → dossier.json

## Problema
Construir el worker **Research**: toma un `place_id` (o link → resolver) y produce `dossier.json` con estado `apto | cola` según el contrato. Modo **híbrido**: Google Places REST API (key disponible) para datos duros + scraping/LLM (Sonnet) para datos blandos. Desambiguación por `place_id`. Routing a cola cuando no alcanza el dataset mínimo.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §5 (feature research), §6 (clases de campo), §12 (artefactos).
- `../clientes_prospectos.md` — los 14 estudios jurídicos con sus CIDs/place_ids; usar como fixtures.
- `packages/worker-research/` — a crear. Env: `GOOGLE_PLACES_API_KEY`.

## Criterios de aceptación
- [ ] Input `place_id` (o link→resolver) → `dossier.json` válido contra schema.
- [ ] Places API: nombre canónico, place_id, dirección, tel, sitio, rating, n_reviews, quotes reales, fotos.
- [ ] Datos blandos vía scraping (Playwright) + LLM: áreas de práctica, tono, colores/logo si hay sitio.
- [ ] Cada campo etiquetado con `clase + source + confidence + fecha`.
- [ ] Desambiguación: exactamente 1 candidato por place_id; conflicto contacto API vs sitio → se marca y rutea.
- [ ] **Routing a cola** si: no desambigua / falta nombre|ciudad|contacto.
- [ ] **Dataset mínimo para apto**: nombre + ciudad + (tel|whatsapp) + place_id único.
- [ ] `gap_report` poblado (matrícula omitida, logo→monograma, etc.).
- [ ] Test contra ≥3 prospectos reales: Koziarski (🔴 sin web), Flosi (🟢 con web), Drössler (🔴 sin presencia).

## Dirección sugerida (no vinculante)
Places **Details** + **Photos** API para lo duro; Playwright para scrapear el sitio cuando existe; LLM (Sonnet) extrae áreas/tono del HTML. **No** verificar matrícula (descartado por decisión previa). Logo siempre fallback salvo `og:image` trivial. Devolver clases de campo según §6.

## Fuera de alcance / no tocar
Matrícula / CADEMIS. Copy y tokens (otros workers). Render.

## Skills / MCP / workflow recomendado
- Google Places REST API (key en env).
- Playwright para scraping; respetar robots/ToS, timeouts y presupuesto de fetch.
- Workflow data/ETL: validar esquema de entrada; pipeline reproducible; fixtures golden.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
