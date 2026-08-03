# 03 · CONSTRUIMOS Y MEDIMOS — plan de guion

`src/Step3Construir.tsx` + `construir/cells.tsx`. Cierra la serie.
Lo estructural está en `PLAN-01-analizar.md`; las marcas de notación, en su §4.4.

---

## 1. El guion

La bajada de la card carga lo que de verdad diferencia la oferta: *"Con KPIs
acordados antes de empezar. Facturamos la siguiente etapa cuando la anterior ya
mostró resultado."* El film lo conjuga y **no se hace el tímido con el último
verbo**: COBRAMOS es el argumento entero, así que se lleva el acto de cierre.

| acto | eyebrow | línea | acento |
|---|---|---|---|
| 1 | **ACORDAMOS** | Qué número tiene que moverse, y cuánto. | AMBER |
| 2 | **LANZAMOS** | La etapa 01 entera, funcionando. | VERMILION |
| 3 | **LEEMOS** | El mismo número, cuatro semanas después. | AMBER |
| 4 | **COBRAMOS** | La etapa que sigue, recién cuando esta rindió. | VERMILION |

**El ámbar cae en los actos 1 y 3 a propósito.** Es el mismo número, fijado antes
de construir y releído después. La rima es el argumento, no un descuido.

---

## 2. La aritmética tiene que cerrar

El acto 4 cobra porque el 3 rindió, así que los números **no pueden ser
decorativos**. Primera versión: meta 26, llegada 24 — el acto 4 facturaba sobre un
objetivo incumplido. Corregido a 27 sobre 26, y la barra roja cruza la línea ámbar
de la meta: el argumento se ve, no se afirma.

```
HOY 18  →  META 26  →  S1 18 · S2 21 · S3 24 · S4 27  →  "27 VS 26 ACORDADO"
```

Los tres se leen del mismo `const`. Si se toca uno, los otros siguen.

---

## 3. Las cuatro formaciones

| acto | formación | celda 2 (el hilo) |
|---|---|---|
| 1 · el acuerdo | KPI + hoy contra meta | el KPI, en bermellón |
| 2 · la entrega | tres checks de lo que quedó andando | la banda "Etapa 01" |
| 3 · la lectura | cuatro barras semanales + línea de meta | la barra que cruzó |
| 4 · el cobro | tres etapas: cobrada, habilitada, todavía no | la fila cobrada |

El hilo llega desde la card 02, donde la etapa 01 del plan era "Catálogo
navegable": acá es el KPI atado a esa etapa, la etapa entregada, la barra que se
movió y la etapa cobrada.

**Orden de pintado.** Las guías del gráfico del acto 3 son celdas de índice alto, o
sea que se pintaban *encima* de las barras. Se agregó `z` al `Rect` para mandarlas
atrás; sin eso se leen como un error de render.

---

## 4. Verificación

Frames de reposo **95, 251, 407, 563**, más los chequeos de banda y keep-out de
`PLAN-01 §7`.

Colisiones encontradas y corregidas: las reglas del acto 1 cruzaban los números de
40px (bajaron a `y 134`), y la regla ámbar del acto 4 tachaba
"FACTURACIÓN POR RESULTADO" (bajó a `y 16`).
