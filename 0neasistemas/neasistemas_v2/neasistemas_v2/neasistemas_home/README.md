# NEASistemas — home sobre la estructura de Tiendanube

Home de NEASistemas construida reutilizando **exactamente** la estructura, el CSS, el JS
y los assets visuales del clon de `tiendanube.com` (`../tiendanube_clone/`).
Lo único que cambia es el texto.

## Archivos

| Archivo | Qué es |
|---|---|
| `source.html` | El clon original, sin tocar. Es la fuente de verdad estructural. |
| `content.json` | El mapa de contenido: pares `[texto_original, texto_nuevo]`. **Es el único archivo que se edita a mano.** |
| `adapt.py` | Aplica `content.json` sobre `source.html` y escribe `index.html`. |
| `index.html` | El resultado. Generado, no editar a mano. |
| `assets/` | Los mismos assets del clon + los que faltaban (videos, fondos mobile), descargados del CDN original. |

## Regenerar

```bash
python adapt.py
```

Falla con `ESTRUCTURA ROTA` si algún reemplazo cambió tags, clases o secciones,
y lista los pares de `content.json` que no encontraron su texto original.

## Ver

```bash
python -m http.server 8931
```

Y abrir `http://localhost:8931/`. Con `file://` el navegador bloquea parte del JS.

## Cómo editar el copy

Cada entrada de `content.json` es `[original, nuevo]` o `[original, nuevo, max_reemplazos]`.
Los grupos se aplican **en orden** (`meta` → `anclados` → `productos` → `footer` → `header` → …),
y dentro de cada grupo también en orden: las cadenas largas o ancladas con markup van
primero para que no se las coma un reemplazo más corto.

Si agregás un par y `adapt.py` avisa que no se aplicó, casi siempre es porque un par
anterior ya reemplazó parte de ese texto.

## Mapeo de secciones

| Sección original | Contenido NEASistemas |
|---|---|
| Hero | H1 de `copy_home.md` + CTA a mockup / WhatsApp |
| Brands (+180 mil marcas) | "Negocios donde la imagen decide la venta" |
| Features (4 tarjetas) | Los 4 pilares: Web · Tienda online · Marketing/SEO/Ads · Sistemas |
| Storefront (3 pasos) | El proceso: Analizar → Diseñar → Construir |
| Showcase | Sin texto — assets originales |
| Sticky (4 paneles) | Los 4 servicios en profundidad |
| Cards-grid | "Por qué elegirnos" + 2 contadores |
| Plans (5 planes) | Research (incluido) · Web · SEO · Ads · Sistemas a medida |
| Pre-footer | CTA de cierre |
| Footer | Servicios · Cómo trabajamos · Contenido · Atención · Empresa |

Fuente del copy: `alemai/seo/proyecto-seo/clientes/neasistemas/`
(`copy_home.md`, `encabezados_home.md`, `copy_precios.md`, `arquitectura-sitio-seo.md`,
`00-contexto-negocio.md`).

## Además del texto (necesario, no cosmético)

`adapt.py` hace tres cosas más porque dejarlas como estaban era un defecto:

1. **Assets locales**: los `srcset` seguían pidiendo el CDN de Tiendanube. Ahora
   apuntan a `assets/`. Se descargaron los que el mirror no había traído (videos
   del hero y del storefront, fondos mobile de las sticky sections).
2. **Trackers desactivados**: GTM, Google Analytics, HubSpot y VWO apuntaban a las
   cuentas de Tiendanube. Los dominios se rompen a `localhost.invalid` — ningún dato
   sale hacia ahí. En consola quedan 2 errores esperados por eso.
3. **JSON-LD propio**: el schema de Yoast declaraba la página como Tiendanube.
   Reemplazado por `Organization` + `LocalBusiness` (Oberá, Misiones) + 4 `Service`,
   según `02-onpage/schema-organization-service.md`.

Todos los `href` internos y de redes quedaron en `#`.

## Pendiente

- **Toggle Mensual/Anual −25%** en planes: sin cambios. Con Web como pago único no
  aplica; hoy los dos valores son iguales y el toggle no cambia nada visible.
- **Contadores** `+400 keywords` y `+2000 búsquedas/mes`: los números están en el
  atributo `data-count`, no en el texto. Confirmar o ajustar contra la investigación real.
- **Selector de país** en el footer (Argentina/Brasil/México/Colombia/Chile): sin tocar.
- **Logos de partners** en cards-grid (Shop the Look, Revie, ClearSale, Pinterest…):
  son assets originales, se mantienen según lo pedido.
- **URLs**: todo apunta a `#`. Cuando esté el dominio, mapear a las rutas de
  `arquitectura-sitio-seo.md` (`/diseno-web/`, `/tienda-online/`, etc.).
