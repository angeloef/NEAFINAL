# 02 · TE MOSTRAMOS EL CAMINO A SEGUIR — plan de guion

`src/Step2Disenar.tsx`. 1280×800, 30fps, 624 frames (20,8s), loop.
Comparte con la etapa 01 el `theme.ts`, `letters.tsx`, `kinetic.tsx` y `notation.tsx`.
Lo único propio es `disenar/cells.tsx`.

Todo lo estructural — banda segura, tempo, port de anime.js, salida compartida —
está en `PLAN-01-analizar.md` y no se repite acá.

---

## 1. El guion

La card ya dice "Te mostramos el camino a seguir". El film lo **conjuga**, igual que
la 01 conjuga "Analizamos".

| acto | eyebrow | línea | acento | entrada |
|---|---|---|---|---|
| 1 | **PROPONEMOS** | Qué hacemos primero, y por qué ese primero. | VERMILION | crossword |
| 2 | **ORDENAMOS** | En qué orden, y qué desbloquea cada paso. | AMBER | weaver |
| 3 | **DIBUJAMOS** | La estructura antes que los colores. | BLUE | trail |
| 4 | **NAVEGÁS** | Lo tocás antes de que exista de verdad. | VERMILION | redraw |

**El cuarto cambia de persona a propósito.** Los tres primeros son "nosotros"; el
último es "vos". Ese giro es el argumento de la etapa: hasta acá te mostramos, ahora
lo tocás. Es lo que hace que "navegable" —la palabra de la bajada de la card— se
entienda sin tener que decirla.

---

## 2. La gramática de color, generalizada

La etapa 01 definió azul como "lo que viene de afuera". Acá el azul es el borrador, y
serían dos significados para el mismo color entre cards. Se generaliza a **"lo que
todavía no es tuyo"**: los competidores allá, el boceto acá. No contradice nada de lo
publicado, y le da al acto 4 un remate visual real.

| color | significa | etapa 01 | etapa 02 |
|---|---|---|---|
| VERMILION | lo que sale de tu objetivo | el objetivo, la decisión 01 | el frente 01, el bloque encendido |
| BLUE | lo que todavía no es tuyo | los competidores | el borrador |
| AMBER | lo que ya está fijado | tus datos | el plan acordado |

> El remate del acto 4 es literalmente **el bloque azul volviéndose bermellón**.

---

## 3. El hilo, ahora entre cards

La celda 2 es bermellón de punta a punta, igual que en la 01 — pero acá **arranca
donde terminó la card anterior**. La 01 cierra en la decisión 01, "Precios y stock a
la vista". Esa misma marca es:

```
card 01                          card 02
objetivo → fila → total → 01  ⟶  frente 01 → etapa 01 → bloque → bloque encendido
```

El string `FRENTE_01` es el mismo texto que la decisión 01 de la card 01. Si se
cambia allá hay que cambiarlo acá: es la costura entre las dos piezas.

---

## 4. Las cuatro formaciones

Las 16 celdas rinden más acá que en la 01: en el acto 3 se convierten en el wireframe,
que es exactamente la forma que una grilla de rectángulos quiere tener.

| acto | formación | celda 2 |
|---|---|---|
| 1 · la propuesta | el objetivo heredado + 3 frentes | el frente elegido, lleno |
| 2 · el plan | 3 etapas en secuencia con conectores | la etapa 01 |
| 3 · el wireframe | header, hero, grilla de producto, footer | la banda de producto, en borrador |
| 4 · el prototipo | la misma pantalla | la banda, encendida, con puntero |

Las celdas 10-15 son los seis tiles de producto y viven **dentro** de la banda de la
celda 2. En el acto 4 pasan a blanco al 22% para leerse sobre el bermellón; si se
dejan en gris se ven como rayas encima del bloque.

---

## 5. Notación (§4.4 de la etapa 01, con marcas de este oficio)

| acto | marca | elementos |
|---|---|---|
| 1 · PROPONEMOS | corchetes de alcance | `[` y `]` reales en px, entran desde afuera |
| 2 · ORDENAMOS | línea de secuencia | regla + tres nodos que aterrizan en orden |
| 3 · DIBUJAMOS | guías tipográficas | dos punteadas (altura de x y base) + tick |
| 4 · NAVEGÁS | área activa | recuadro que se asienta + puntero que llega |

Las punteadas usan `repeating-linear-gradient`, no `stroke-dasharray`: el gradiente
es determinista bajo cualquier escala.

---

## 6. Verificación

Frames de reposo: **95, 251, 407, 563** (medio de cada acto, donde la sección tiene
que estar completa y quieta). Más los mismos chequeos de banda y keep-out del tag de
`PLAN-01 §7`.

Trampas encontradas al implementar, todas de colisión:

- `BORRADOR` se apoyaba sobre el bloque de CTA del wireframe → va debajo de todo.
- Los rótulos de etapa del acto 2 se pasaban de su caja al envolver en dos líneas →
  la caja pasó de 54 a 66px de alto.
- `PRIMERA VERSIÓN NAVEGABLE` chocaba con las barras del footer → footer a `y 162`
  con 6px de alto, rótulo a `y 176`.
