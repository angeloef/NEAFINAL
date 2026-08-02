# 01 · ANALIZAMOS TU NEGOCIO — plan de guion y tipografía cinética

Plan de implementación para `src/Step1Analizar.tsx`. Video de card, 1280×800, 30fps,
420 frames (14s), loop.

Fuentes de las animaciones de letra:

- `codrops/DecorativeLetterAnimations` — anime.js + charming.js, formas decorativas
  acompañando letras.
- `codrops/LetterInteractions` — anime.js + charming.js, 8 demos: crossword, kidnap,
  moveout, playful, redraw, swing, trail, weaver.

---

## 0. La regla de port (leer antes que nada)

Los dos repos son **hover-driven**: anime.js dispara un timeline imperativo cuando el
mouse entra. En Remotion no hay mouse y no hay timeline imperativo — cada frame se
renderiza aislado y tiene que ser una función pura de `frame`. anime.js y charming.js
**no se instalan**.

La conversión es mecánica y siempre la misma:

| anime.js | Remotion |
|---|---|
| `charming(el)` → spans por letra | `<Split>` propio, ~15 líneas, `text.split("")` |
| `delay: (el, i) => i * 30` | `const t = frame - start - i * STAGGER` |
| `duration: 400` | `interpolate(t, [0, 12], …)` con 12 = 400ms × 30fps |
| `easing: 'easeOutBack'` | `Easing.bezier(.34,1.56,.64,1)` |
| `elasticity: 300` | `spring({ frame: t, fps, config: { damping: 12, stiffness: 120 } })` |
| `translateY, rotate, scale` | un solo string `transform` compuesto por letra |

**Conversión ms → frames: `Math.round(ms * 30 / 1000)`.** Todas las tablas de abajo ya
están en frames.

Consecuencia práctica: no hay dependencias nuevas. El costo total de la tipografía
cinética es un archivo, `src/analizar/letters.tsx`.

---

## 1. Paleta y gramática de color

Paleta declarada (coolors.co/efece7-000000-ffb400-f63e02-246eb9). El `theme.ts` actual
ya coincide salvo el papel.

| token | hex | cambio | significado en el film |
|---|---|---|---|
| `PAPER` | `#EFECE7` | **de `#F4F2EE`** | el suelo. Nada más lo usa. |
| `INK` | `#000000` | de `#0B0B0B` | hecho constatable |
| `AMBER` | `#FFB400` | igual | **lo que el negocio ya tenía**: sus propios datos |
| `VERMILION` | `#F63E02` | igual | **el hilo**: tu objetivo y todo lo que baja de él |
| `BLUE` | `#246EB9` | igual, hoy sin uso | **lo que viene de afuera**: competencia, mercado |

`INK_SOFT` y `HAIRLINE` se recalculan sobre el negro puro:
`INK_SOFT = #6A665F` (se mantiene), `HAIRLINE = rgba(0,0,0,0.13)`.

La gramática no es decorativa: es la razón por la que los cuatro actos se leen como un
argumento. Acto 1 nace el bermellón, acto 2 entra el azul, acto 3 entra el ámbar, acto 4
todo vuelve a bermellón — el objetivo se comió a la evidencia.

**Regla dura:** dos acentos como máximo en pantalla a la vez. Si hay azul y ámbar
juntos, el bermellón está apagado.

---

## 2. Zona segura (medida sobre la card real)

La página se superpone al video. Ver `index.html` `.hpg__scrim` / `.hpg__tag`.

```
                 x=0                                            x=1280
          y=0    ┌───────────────────────────────────────────────┐
                 │ ZONA MUERTA 1: tag "01 — Analizar", negro     │
                 │ sobre el video. x<470 · y<160 debe quedar     │
                 │ en luminancia ≥250 (papel liso, sin nada).    │
          y=165  ├───────────────────────────────────────────────┤
                 │                                               │
                 │      B A N D A   Ú T I L   1128 × 290         │
                 │      x 76 → 1204   ·   y 165 → 455            │
                 │                                               │
          y=455  ├───────────────────────────────────────────────┤
                 │ ZONA MUERTA 2: scrim + "Analizamos tu         │
                 │ negocio". Todo lo que entre acá desaparece.   │
          y=800  └───────────────────────────────────────────────┘
```

Excepción única: la **ventana de footage** puede vivir en `y 42→174` siempre que empiece
en `x ≥ 676` (mitad derecha), porque ahí no está el tag. Es la regla que ya sigue el
render actual.

En `theme.ts`:

```ts
export const SAFE = { x: 76, y: 165, w: 1128, h: 290, tagRight: 470, tagBottom: 160 };
```

---

## 3. El guion

El encabezado de la card ya dice "Analizamos tu negocio". El video no lo repite: lo
**conjuga**. Los cuatro eyebrows son los cuatro verbos que componen ese "analizamos" y
se leen como una sola frase corrida.

| acto | frames | eyebrow | línea | acento |
|---|---|---|---|---|
| 1 | 0–104 | **ESCUCHAMOS** | Qué vendés, a quién, y qué querés lograr. | VERMILION |
| 2 | 104–206 | **COMPARAMOS** | Contra qué te compara tu cliente. | BLUE |
| 3 | 206–312 | **MEDIMOS** | Lo que tu negocio ya venía diciendo. | AMBER |
| 4 | 312–420 | **DECIDIMOS** | La web es la conclusión, no el punto de partida. | VERMILION |

Notas de guion:

- El acto 2 dice "te compara **tu cliente**", no "competís vos". Es lo que la grilla
  realmente muestra y desplaza el sujeto al comprador, que es lo que justifica mirar
  afuera.
- El acto 3 usa "ya venía diciendo": el dato no es nuevo, estaba y nadie lo leyó. Ese es
  el argumento de por qué hace falta la etapa.
- El acto 4 es la tesis del método completo y es la única línea larga del film. Se
  compensa bajando el tamaño a 40px y dándole dos líneas.

**Última palabra acentuada.** En cada línea, la palabra final lleva el color del acto y
+50 de peso. `lograr` · `cliente` · `diciendo` · `partida`.

---

## 4. Asignación de efectos por texto

### 4.1 Vocabulario de salida — uno solo, compartido

Portado de `LetterInteractions/js/demo3.js` (moveout). El demo elige una de 4 salidas
según `this.pos` de la letra; acá el índice de letra módulo 4. Es lo que hace que las
cuatro transiciones se sientan un sistema y no cuatro ideas.

| variante | origin | transform | frames | easing |
|---|---|---|---|---|
| 0 | `0% 0%` | `translateY(400px) rotate(38deg)` | 12, delay 15 | easeInSine |
| 1 | `50% 50%` | `scale(0)` | 9 | easeInBack |
| 2 | `50% 100%` | `translateY(-400px) scaleY(1) scaleX(1)` | 24, delay 6 | spring damping 9 |
| 3 | `100% 0%` | `translateY(300px) rotate(-30deg)` | 9, delay 21 | easeInSine |

Opacidad: cada variante llega a 0 en sus últimos 6 frames.
Stagger de salida: `i * 1` frame. Total ≈ 30 frames — coincide con el `TEXT_OUT = 30`
que ya existe.

### 4.2 Entradas — una por acto, elegida por lo que el acto significa

**Acto 1 · ESCUCHAMOS → `crossword`**
Las letras entran alternando eje: las pares desde la izquierda (`translateX(-60px)`),
las impares desde arriba (`translateY(-60px)`), encajando en una cuadrícula invisible.
Lee como algo que se **arma escuchando pedazos**.
`dur 14 · stagger 2 · easeOutBack(.34,1.56,.64,1)` · `opacity 0→1 en los primeros 8`.

**Acto 2 · COMPARAMOS → `weaver`**
Letras pares bajan, impares suben, y convergen a la línea base. Dos hileras que se
entrelazan: es la comparación, hecha con el propio texto.
`translateY ±34px → 0 · dur 16 · stagger 2 · spring damping 14 stiffness 140`.

**Acto 3 · MEDIMOS → `trail`**
Cada letra arrastra 3 fantasmas a `opacity .18/.10/.05` desfasados 2, 4 y 6 frames,
en AMBER. Los fantasmas se cierran contra la letra: acumulación que se resuelve en dato.
`translateX 26px → 0 · dur 18 · stagger 2 · easeOutExpo`.
Los fantasmas se destruyen al frame 24; después la letra es negra plana.

**Acto 4 · DECIDIMOS → `redraw` (aplanado)**
La letra aparece con `scaleY(0.06)` desde la línea base y se despliega a `1` sin rebote,
con un barrido bermellón de 2px que la recorre por debajo. Sin elasticidad: es la única
entrada del film que no oscila, porque es la que decide.
`dur 12 · stagger 1.5 · easeOutQuint`.

### 4.3 Las líneas grandes (44px / 40px en el acto 4)

No llevan efecto por letra — competirían con el eyebrow. Llevan revelado **por palabra**
con máscara, del vocabulario decorativo:

- cada palabra en un `<span>` con `overflow: hidden`
- dentro, `translateY(1.05em → 0)` + `rotate(2.5deg → 0)`, origen `0% 100%`
- `dur 16 · stagger 3 por palabra · easeOutExpo`
- la palabra acentuada entra 4 frames después que el resto y con `dur 20`

### 4.4 Capa decorativa (de `DecorativeLetterAnimations`)

Una sola forma por acto, trazada con `stroke-dasharray` animado, `strokeWidth: 2`,
`dur 26`, arrancando 20 frames después del eyebrow. Nunca más de una en pantalla.

| acto | forma | color | dónde |
|---|---|---|---|
| 1 | círculo abierto (300° de arco) | VERMILION | rodea `lograr` |
| 2 | dos barras verticales enfrentadas | BLUE | flanquean `cliente` |
| 3 | subrayado de doble trazo | AMBER | bajo `diciendo` |
| 4 | corchete `⌐` en esquina | VERMILION | abraza `partida` |

Se dibujan con `strokeDashoffset` interpolado de `L → 0` donde `L = getTotalLength()`
precomputado a mano (constante en el código, no medido en runtime — Remotion renderiza
frames sueltos y no hay garantía de layout estable).

### 4.5 Números (el panel de datos, acto 3)

El `<Counter>` actual se mantiene, con dos cambios:
`fontVariantNumeric: "tabular-nums"` (hoy no lo tiene y los dígitos bailan) y el dígito
que cambia recibe `color: AMBER` por 3 frames antes de volver a INK. Es el efecto
`trail` reducido a su mínima expresión, aplicado a la cifra.

---

## 5. Coreografía visual: las 16 celdas

Los paneles no se montan y desmontan. Hay **16 celdas** presentes del frame 0 al 420,
que solo cambian `x, y, w, h, color`. Cada acto es una formación distinta de las mismas
16. La transición **es** el contenido: no hay corte porque no hay nada que cortar.

Una celda es **bermellón de principio a fin** y es el hilo del film:

> tu objetivo (acto 1) → la fila que te mide (acto 2) → el total (acto 3) → la decisión 01 (acto 4)

Si el espectador solo sigue la mancha roja con el ojo, ya entendió el método.

| acto | formación | alto | qué hace la celda bermellón |
|---|---|---|---|
| 1 | 2 filas de ficha + 3 chips de objetivo | 160 | es el chip elegido, se llena |
| 2 | grilla 4×4 de competencia | 158 | queda última: "Tu sitio hoy" |
| 3 | 4 barras que convergen a un corchete | 170 | crece hasta ser el total |
| 4 | 3 filas de decisión | 180 | es la fila 01 |

Reglas de movimiento:

1. **Las celdas empiezan a moverse 24 frames antes** de que entre el texto del acto
   siguiente. El movimiento anuncia el cambio; el texto llega a una formación ya en
   marcha.
2. Las celdas **nunca hacen fade**. Solo los rótulos cruzan opacidad.
3. `spring({ damping: 18, stiffness: 90 })` con stagger `i * 0.8` frames, para que lea
   como bandada y no como cuatro slides deslizándose juntas.
4. Máximo 180px de alto contra 290 disponibles → el arco de movimiento no puede pasar de
   50px. La reorganización es corta y elegante, no espectacular.
5. La trayectoria de la celda bermellón se define primero; las otras 15 se acomodan.

Implementación: una tabla `CELLS[16][4]` de rects y un componente que interpola entre
`CELLS[i][acto]` y `CELLS[i][acto+1]`. Reemplaza los 4 componentes de `panels.tsx`
(426 líneas) por ~150.

---

## 6. Archivos

| archivo | acción |
|---|---|
| `src/analizar/theme.ts` | `PAPER` → `#EFECE7`, `INK` → `#000000`, `SAFE` nuevo, `HAIRLINE` sobre negro |
| `src/analizar/letters.tsx` | **nuevo** — `<Split>`, `<KineticText>`, tabla de efectos, salidas moveout |
| `src/analizar/shapes.tsx` | **nuevo** — las 4 formas decorativas SVG con dash animado |
| `src/analizar/cells.tsx` | **nuevo** — `CELLS[16][4]` + interpolador |
| `src/analizar/panels.tsx` | **se borra** — su contenido pasa a rótulos sobre las celdas |
| `src/analizar/kinetic.tsx` | `Eyebrow`/`Line` pasan a envolver `<KineticText>`; `Counter` gana tabular-nums |
| `src/Step1Analizar.tsx` | pierde el montaje condicional de paneles; queda script + composición |

API objetivo:

```tsx
<KineticText
  text="ESCUCHAMOS"
  t={t}                      // frames desde el inicio del acto
  enter="crossword"          // crossword | weaver | trail | redraw
  exit={exitAt}              // frame local donde arranca moveout; undefined = no sale
  color={VERMILION}
  size={13}
  tracking="0.18em"
/>
```

---

## 7. Verificación

1. `npx remotion still src/index.ts Step1Analizar out/chk_<f>.png --frame=<f>` en los
   frames **60, 100, 165, 205, 265, 310, 380, 418** (medio y borde de cada acto: los
   bordes son donde las salidas y las celdas se pisan).
2. **Keep-out del tag:** muestrear el rect `x 0→470 · y 0→160` y confirmar luminancia
   mínima ≥ 248. Es la condición que deja el "01 — Analizar" negro en 19:1.
3. **Banda:** ningún píxel no-papel debajo de `y = 455`.
4. Frames 0 y 419 idénticos a papel liso — el bookend de 12 frames tiene que cerrar el
   loop sin costura.
5. Re-render final: `analizar.webm` en **VP8** (VP9 ya falló en producción una vez) +
   `analizar.mp4` + poster.

---

## 7b. Lo que cambió al implementarlo

- **El draw-on no usa `stroke-dasharray`.** `pathLength="1"` + dasharray calcula el
  patrón contra la geometría **ya escalada**, así que con `preserveAspectRatio="none"`
  el trazo se tejía en segmentos sueltos a 150px de la palabra. Reemplazado por un
  barrido con `clipPath: inset()`: pura geometría, mismo resultado, cero matemática de
  guiones.
- **El SVG lleva `width`/`height` explícitos, no `left/right/top/bottom`.** Resolvía su
  caja contra un ancestro más alto que la línea y se estiraba. `<Line>` le pasa la
  altura de línea en px.
- **La forma arranca en `enter + 8`, no en la palabra acentuada.** Colgada de la palabra
  terminaba de dibujarse 4 frames antes de que el texto empezara a salir.
- **Los chequeos 2 y 3 de §7 no corren automatizados acá:** el ffmpeg que trae Remotion
  está compilado sin `crop` ni `signalstats`, y `pngjs` no es dependencia del proyecto.
  Verificado sobre los stills. El contraste del tag es aritmético: negro sobre
  `#EFECE7` da 17.4:1 (antes 19:1 sobre `#F4F2EE`), muy por encima de AA.

## 8. Fuera de alcance deliberado

- **anime.js y charming.js no se instalan.** Ver §0.
- **Sin medición de layout en runtime** (`getBBox`, `getTotalLength`): Remotion puede
  renderizar frames en paralelo y en distinto orden. Todo largo de trazo va como
  constante.
- **Las cifras siguen siendo ilustrativas.** Los competidores se llaman "Competidor A/B/C".
  Poner nombres reales convierte la maqueta en una afirmación sobre terceros.
- **Sin efecto por letra en las líneas grandes.** Revelado por palabra. Dos capas de
  cinética simultánea se anulan.
