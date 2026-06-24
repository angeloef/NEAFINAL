---
id: worker-brand
title: Worker Marca/Tokens → tokens.json
status: pending
area: worker/brand
related_areas: [contracts, worker/research]
priority: P2
depends_on: [contracts-schemas, worker-research]
created: 2026-06-23
source_items: [arquitectura_rev2_missions.md#5, #6]
---

# Worker Marca/Tokens → tokens.json

## Problema
Worker que toma `dossier.json` y produce `tokens.json` (paleta, monograma, imágenes) = los **design tokens** del mockup. Espejo de marca real si existe; **fallback** (paleta legal por defecto + monograma con iniciales reales) si no. Nunca un logo inventado presentado como propio del estudio.

## Anclas de contexto
- `../arquitectura_rev2_missions.md` §5, §6 (BR-01), y la regla de fallback de marca.
- `../clientes_prospectos.md` — Flosi/Riegel (🟢 con web → colores reales) vs Drössler (🔴 → fallback).
- `packages/worker-brand/` — a crear. Modelo: Sonnet 4.6.

## Criterios de aceptación
- [ ] `tokens.json` válido contra schema; cubre **BR-01**.
- [ ] Si hay sitio: extrae colores (CSS) y logo (`og:image`) reales.
- [ ] Si no hay: **paleta legal por defecto + monograma** (SVG) con iniciales reales; `marca.fallback = true`.
- [ ] Imagen: foto real de GBP o stock legal neutra **marcada como genérica**.
- [ ] Test: prospecto con web (Flosi) ⇒ colores reales; sin web (Drössler) ⇒ fallback.

## Dirección sugerida (no vinculante)
Extracción de color desde CSS / Playwright (computed styles del sitio). Generador de monograma SVG. Mapear todo a design tokens consumibles por el ensamblado (nombres estables: `--color-primary`, etc.).

## Fuera de alcance / no tocar
Copy, render, ensamblado. No descargar/usar logos de terceros como si fueran del estudio.

## Skills / MCP / workflow recomendado
- Playwright para leer estilos computados.
- `design:design-system` para nombrar tokens de forma consistente.

## Bitácora (append-only)
- 2026-06-23 — Plan creado.
