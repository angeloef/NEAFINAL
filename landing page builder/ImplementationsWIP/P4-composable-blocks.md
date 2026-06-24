# P4 — Rediseño a bloques componibles (calidad referencia)

> Estado: DECOMPUESTO (2026-06-24) → ejecutar como P4.1–P4.7 (briefings hijos).
> Este archivo queda como **spec madre / referencia**; el loop procesa los sub-planes:
> P4.1 react-setup · P4.2 pageplan-schema · P4.3 block-library · P4.4 image-pool ·
> P4.5 quality-gate · P4.6 pageplan-llm · P4.7 runner-e2e (cierra P4).
> Prioridad: P4 (mejora de calidad del output)
> Origen: el output actual (4 secciones, template fijo) no alcanza calidad referencia.
> Decisión de producto (2026-06-24):
> - Arquitectura: **híbrido de bloques componibles** — el LLM elige qué bloques usar y con qué contenido; los bloques son premium-diseñados una sola vez.
> - Imágenes: **stock curado + variado** (free-use, sin repetición, temático por rol).
> - Paridad: **aumentada, con datos genéricos placeholder** (veraces y marcados; nunca hechos específicos falsos).
> - **Stack: React + Tailwind**, renderizado a HTML estático (`react-dom/server` `renderToStaticMarkup`) para mantener el output `landing.html` autocontenido. Tailwind compilado a CSS estático inline (sin runtime JS salvo el necesario).
> - **Fuente de bloques premium (público): ecosistema shadcn/ui registry + Tailwind**, más registries community **Aceternity UI** y **Magic UI**. Consumibles vía la **CLI de shadcn** (`npx shadcn@latest add <registry-url>`) y/o el **conector MCP `magic` (21st.dev)** ya disponible en esta sesión (`mcp__magic__searchRegistryItems` / `getRegistryItem` con `includeSource`). Nota: Magic UI aporta efectos/animaciones; los **bloques de sección de marketing** vienen sobre todo de shadcn blocks / Aceternity. Adaptar, no copiar tal cual: portar al design system y a los datos del PagePlan.

## Problema raíz (por qué el sistema actual topa)

1. `assembly` es un **template fijo** → todos los prospectos salen iguales.
2. El schema `Copy` es **pobre** (hero+áreas+contacto+meta) → el LLM no puede aportar secciones que el contrato no contempla.
3. El LLM **no toca composición** → la calidad visual queda 100% en un template hardcodeado, con techo bajo y uniforme.
4. `validation` premia "no mentir", **no "ser bueno"** → 4 secciones planas pasan el gate.
5. Imágenes stock genéricas y repetidas.

## Cambio núcleo: etapa "PagePlan" entre Copy y Assembly

```
dossier → [LLM: PagePlan] → [Assembly: compositor de bloques] → Validation(+calidad) → Presentation
```

El LLM deja de escribir "texto para slots" y pasa a producir un **PagePlan**: lista ordenada de bloques, cada uno `{ type, variant, data }`. El assembly mapea cada bloque a su renderer. Variabilidad por prospecto + calidad consistente.

## Entregables

### 1. `@lpb/contracts` — nuevo schema `PagePlan` (Zod)
```ts
PageBlock = { type: BlockType, variant: string, data: <por tipo> }
PagePlan  = { mission_id, blocks: PageBlock[], meta: {title, description} }
```
- `BlockType` enum: `hero | trust_bar | areas | about | process | results | team | testimonials | faq | cta_band | contact | footer`.
- Cada `data` con su sub-schema. Campos de dato fáctico siguen usando `clase` (VERIFICADO/PLANTILLA) para que validation distinga hecho vs. placeholder.
- Mantener `Copy` como deprecado o como subconjunto derivable (compat con tests existentes hasta migrar).

### 2. `@lpb/worker-assembly` — biblioteca de bloques (React + Tailwind)
Cada bloque es un **componente React** (`src/blocks/<Tipo>.tsx`) tipado por su `data` del PagePlan, con 1-3 **variantes**. El assembly compone `<Page plan={plan} tokens={tokens}/>` y emite HTML con `renderToStaticMarkup`; Tailwind se compila a CSS estático inyectado en `<head>` (los design tokens mapean a CSS vars / theme de Tailwind). Sin dependencia de JS en runtime salvo micro-interacciones imprescindibles.

**Sourcing premium**: arrancar cada bloque desde shadcn/Aceternity (CLI shadcn) o desde el MCP `magic` (`getRegistryItem includeSource:true`), y **portarlo** al design system + tipos del PagePlan. No pegar crudo.

Bloques (self-contained, con variantes y data-shape):
- **hero**: `image_overlay` | `split` | `centered`.
- **trust_bar**: chips de credenciales/áreas (sin cifras inventadas).
- **areas**: `cards_icon` | `list` | `accordion`.
- **about**: split imagen+texto / banda oscura.
- **process**: 3-4 pasos "cómo trabajamos" (placeholder genérico OK).
- **results**: banda de números — **placeholder genérico no-numérico o omitir** si no hay dato real (NO inventar cifras → LG-01).
- **team**: bio cards de abogados (placeholder marcado si no hay datos reales).
- **testimonials**: SOLO si hay reseñas reales (AC-02); si no, omitir.
- **faq**: Q&A legal genérico (placeholder).
- **cta_band**: franja CTA repetido.
- **contact**: `channels` | `form` + canales reales.
- **footer**: NAP + `schema.org/LegalService` JSON-LD + disclaimer.

Design system compartido (`blocks/system.css.ts`): escala tipográfica, espaciado, color, motion, estados hover/focus — para que todo bloque sea premium y consistente. Assembly = compositor puro: `plan.blocks.map(renderBlock)`.

### 3. Imágenes — pool curado por rol
`src/blocks/images.ts`: 12-15 URLs free-use verificadas (200 OK) en categorías: `courthouse, columns, library, office_interior, desk_detail, city_misiones, skyline, handshake, scales, books`. Picker que:
- asigna por rol de bloque (hero≠about≠cta),
- **garantiza no-repetición** en una misma página,
- params de tamaño/calidad + `alt` temático.

### 4. `@lpb/validation` — gate de calidad (sube el piso)
Nuevas assertions (bloqueantes/altas):
- `QL-01`: mínimo de bloques (≥6) y presencia de hero+contact+footer.
- `QL-02`: variedad de imágenes (sin URL duplicada).
- `QL-03`: datos placeholder correctamente marcados (`clase=PLANTILLA`) — nada placeholder presentado como verificado.
- `QL-04`: contraste AA (ya existe) + jerarquía (h1 único, secciones con título).
- Mantener AC-01/AC-02/LG-01/BR-01 intactos.

### 5. LLM (Claude) productor del PagePlan
Subagente Claude (sin DeepSeek): recibe dossier → elige bloques/orden/variantes y escribe contenido, marcando placeholder. Prompt nuevo en `worker-copy` (o nuevo `worker-plan`). Reutiliza el patrón "sesión Claude como provider" ya probado (`run-from-copy.ts`).

## Política de datos placeholder (paridad aumentada)
- PERMITIDO: secciones de marketing genéricas (process, faq, value props, about) con texto plantilla veraz y neutro.
- PROHIBIDO (sigue): cifras de resultados específicas, clientes nombrados, reseñas, premios, superioridad comparativa, garantías de resultado (Ley 23.187 / AC-01 / AC-02 / LG-01).
- Todo placeholder marcado `clase=PLANTILLA` y, donde aplique, redactado como genérico ("Áreas de práctica habituales", no "Ganamos 200 casos").

## Plan de ejecución (fases, TDD)
0. **Setup React/Tailwind en `@lpb/worker-assembly`**: agregar `react`, `react-dom`, `tailwindcss`; pipeline de render estático (`renderToStaticMarkup`) + compilación Tailwind a CSS inline. `shadcn init` para poder traer bloques. Smoke test: un componente trivial → HTML.
1. Schema `PagePlan` + tests (contracts).
2. Block library React + design system + 1 variante por bloque (porteados de shadcn/Aceternity/magic-MCP) + tests de render (assembly).
3. Image pool + picker + test no-repetición.
4. Gate de calidad QL-01..04 + tests (validation).
5. Prompt PagePlan + subagente Claude (sin DeepSeek).
6. Runner `run-from-plan.ts` (análogo a `run-from-copy.ts`).
7. Correr Koziarski end-to-end; screenshot; iterar hasta checklist ≥10/12 y QL gates verdes.

## Criterio de parada
Gates de contrato + QL-01..04 verdes, ≥6 bloques, imágenes variadas, y checklist visual comparado vs. `ref-armando-full.jpeg`/`ref-goldberg-full.jpeg` ≥ 10/12.

## Notas de implementación
- Mantener tests actuales de `assembly` verdes durante la migración (o portarlos a bloques).
- `worker-assembly` importa desde `dist/` en el runner → **rebuild** (`corepack pnpm --filter @lpb/worker-assembly build`) antes de cada corrida.
- `pnpm` no está en PATH: usar `corepack pnpm` o `node node_modules/.pnpm/tsx@4.22.4/.../cli.mjs`.
