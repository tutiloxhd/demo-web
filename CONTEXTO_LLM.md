# Contexto del proyecto para asistentes LLM

## Objetivo

Maqueta navegable, en español, para administrar remates inmobiliarios judiciales. Permite ver los remates de cada semana, seguir el workflow de cada uno paso a paso, suspenderlo o cancelarlo por revisión legal, registrar el resultado, y consultar calendario, documentos y un panel de gerencia.

Es un prototipo de frontend estático, no un sistema de producción. No hay servidor, API, autenticación ni base de datos. Los datos son de ejemplo y los cambios solo viven en el navegador de quien los hace.

## Tecnologías y ejecución

- HTML, CSS y JavaScript vanilla, sin framework, gestor de paquetes ni build.
- El inicio es `hello.html`. Alcanza con abrirlo en un navegador o servir la carpeta como archivos estáticos.
- Los scripts son clásicos (no módulos) y comparten el ámbito global; el orden de carga importa (ver «Orden de carga»).
- Los cambios del workflow se guardan en `localStorage` bajo `remates-demo-state`. La semana visible se guarda en `sessionStorage` bajo `remates-demo-week`.
- Las fotos y avatares apuntan a Unsplash y Pravatar, por lo que necesitan conexión a Internet.

## Mapa de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `data.js` | Datos de ejemplo y API global `window.RematesData`: estado persistido y semana visible. |
| `shell.js` | Barra lateral, navegación inferior y sprite de íconos SVG, compartidos por todas las pantallas. |
| `hello.html` | Tablero de inicio: métricas, lista de remates, «Requiere atención», panel de detalle y los dos modales (flujo y paso). |
| `app.js` | Tablero (render, filtros, detalle) y toda la lógica del workflow: avanzar tareas, ramas de resultado, suspender, cancelar y reanudar. |
| `workflow.js`, `workflow.css` | Vista «diagrama» del modal de flujo y modal de cada paso. Solo dibuja; los cambios de estado los delega en `app.js`. |
| `styles.css` | Estilos base, tablero, panel de detalle, modal de flujo en lista, estados, responsive y barra de scroll. |
| `semana.html`, `calendario.js`, `calendario.css` | Calendario semanal generado desde los datos. `calendario.css` es autónoma: no importa `styles.css`. |
| `documentos.html`, `reportes.html` | Contenedores de Documentos y Reportes. |
| `pages.js` | Estructura común de Documentos y Reportes (cabecera, barra de semana, toast) y el contenido de Documentos. |
| `reportes.js`, `reportes.css` | Panel de gerencia de Reportes. Depende de `pages.js`. |
| `screens.css` | Estilos de las pantallas de `pages.js`; importa `styles.css`. |

`detalle.html` y `detalle.js` (un detalle móvil simplificado) se eliminaron: hoy existe un único detalle para todos los tamaños.

### Orden de carga

- `hello.html`: `data.js` → `shell.js` → `app.js` → `workflow.js`
- `semana.html`: `data.js` → `shell.js` → `calendario.js`
- `documentos.html`: `data.js` → `shell.js` → `pages.js`
- `reportes.html`: `data.js` → `shell.js` → `pages.js` → `reportes.js`

`workflow.js` usa globales de `app.js` (`TASKS`, `RESULT_BRANCHES`, `data`, `getFlowStage`, `completeStage`, `isStopped`, `isFinished`, etc.) y `app.js` llama a `mountFlowDiagram` y `openNode` de `workflow.js` en tiempo de ejecución. `reportes.js` usa `R`, `week`, `weekBar`, `bindWeek`, `toast` y `statusClass` de `pages.js`.

## Datos y estado

`data.js` define veinte remates de ejemplo:

- **6 al 10 de octubre de 2025 (ids 16–20):** ya rematados, con `resultOutcome` y `resultTasks`. Dos cerrados y tres con el cierre de su rama pendiente.
- **13 al 17 de octubre (ids 1–9):** la semana inicial. Incluye un suspendido en el paso 7 (id 8) y un cancelado en el paso 11 (id 9).
- **20 al 24 de octubre (ids 10–15):** remates en pasos tempranos del workflow.

Campos de cada remate:

- `id`, `title`, `place`, `date` (texto, p. ej. «Lun 13 oct»), `iso` (fecha `AAAA-MM-DD`, la que usan los filtros de semana), `time`
- `stage` (texto del paso actual), `flowStage` (número de paso, 1 a 16), `progress` (0 a 100), `person`, `status`, `due`
- `minimum` (mínimo del remate, en millones de pesos) y `awarded` si se adjudicó
- `documents` (`[nombre, tipo, estado]`), `photo` (id de Unsplash) y `avatar` (número de Pravatar)
- Solo cuando aplican: `resultOutcome`, `resultTasks`, `resultPriorStatus`, `stopPrior`

`stage`, `flowStage` y `progress` deben ser coherentes entre sí: `stage` es el nombre de la tarea `flowStage` en `TASKS` y `progress` es el porcentaje de tareas completadas.

Estados (`status`): `ATRASADO`, `ALERTA`, `BIEN`, `SUSPENDIDO`, `CANCELADO`. Sus clases CSS son `late`, `alert`, `good`, `paused` y `cancelled` (en el calendario: `atrasado`, `alerta`, `bien`, `suspendido`, `cancelado`).

### API `window.RematesData`

- `items`: los remates con el estado guardado ya mezclado.
- `update(id, changes)`: modifica, persiste en `localStorage` y emite `remates:changed`.
- `reset()`: borra el estado guardado y recarga. No tiene botón en la interfaz; se ejecuta desde la consola.
- `weekRange(offset)`: devuelve `{from, to, label, days}` de una semana. La semana 0 es la del lunes 13 de octubre de 2025.
- `weekItems(offset)`, `getWeek()`, `setWeek(n)`: remates de una semana y semana visible (limitada de −1 a 2, es decir, del 6 al 31 de octubre).

`app.js` trabaja sobre una copia de `items` (`data`) y la sincroniza con lo que devuelve `update`.

## Tablero (`hello.html` + `app.js`)

- La lista combina tres filtros en `render`: la semana visible (`week`), la tarjeta de métrica activa (`statusFilter`) y el texto del buscador.
- Las cinco tarjetas de métricas (Remates, En alerta, Atrasado, Bien, Detenidos) son botones que filtran por estado; «Detenidos» agrupa suspendidos y cancelados. Las métricas y «Requiere atención» se calculan sobre la semana visible.
- El buscador mira título, comuna, fecha, hora, etapa, responsable y estado, solo dentro de la semana visible.
- «Requiere atención» lista los atrasados y en alerta; sus filas abren el detalle.
- Tocar un remate abre el panel de detalle. `hello.html?id=<id>` lo abre directamente; así enlazan el calendario y Reportes.
- En el detalle, «Ver flujo completo →» abre el diagrama y el botón de la flecha abre la lista de tareas.

## Workflow del remate

`app.js` es el dueño de la lógica. `TASKS` declara 15 tareas en orden, de «Crear workflow» a «Registrar resultado». `flowStage` marca la tarea actual; con 16, las 15 están completas.

Tras la tarea 15 se elige una rama de resultado (`RESULT_BRANCHES`):

- `ADJUDICADO`: gestionar pago (17A), marcar adjudicada (18A), crear proyecto (19A).
- `NO_ADJUDICADO`: recuperar garantía (17B), registrar garantía (18B).
- `REPROGRAMADO`: actualizar fecha (17C), recalcular plazos (17D), continuar workflow (17E).

El workflow está terminado (`isFinished`) cuando todas las tareas de la rama elegida están marcadas; ahí el estado pasa a `BIEN`.

### Suspender y cancelar (revisión legal)

Las revisiones legales son los pasos 7 y 11, pero el equipo legal puede suspender o cancelar un remate en cualquier paso.

- `stopWorkflow(id, 'SUSPENDIDO' | 'CANCELADO')` cambia `status`, guarda el estado y plazo previos en `stopPrior` y deja `flowStage` intacto (el paso donde se detuvo).
- `resumeWorkflow(id)` reanuda un suspendido y restaura `stopPrior`.
- Mientras está detenido (`isStopped`) no se pueden completar tareas ni elegir resultado.
- Un suspendido se puede cancelar. Un cancelado cierra el workflow y no se reanuda desde la interfaz.
- Los botones están en la lista del flujo, en la columna «Estados excepcionales» del diagrama y en el modal de los pasos 7 y 11. Siempre pasan por un modal de confirmación.
- «Desierto u otro» sigue siendo un estado informativo sin lógica.

### Modal de flujo

Tiene dos vistas que se alternan con el botón de la esquina:

- **Lista** (`renderFlow` en `app.js`): las 15 tareas, la casilla para completar la actual y la fila «Revisión legal».
- **Diagrama** (`workflow.js`): 16 nodos (los 15 pasos más «Alertas pre-remate», que es automático), las tres ramas de resultado y los estados excepcionales.
  - Cada nodo abre un modal (`openNode`) con descripción, responsable, estado y la acción disponible.
  - El paso actual late, los conectores recorridos se pintan y los nodos entran en cascada al abrir.
  - Las claves de `openNode` son `n<número>`, `b:<rama>:<tarea>`, `fin:<rama>` y `x:<índice>`.
  - Elegir un resultado desde el diagrama completa la tarea 15 y abre la rama en un solo paso (`chooseOutcome`).

Las descripciones de `FLOW_NODES` y el responsable «Equipo legal» de los pasos 7 y 11 se redactaron a partir de las etiquetas existentes; no están validados por el negocio.

## Calendario

`calendario.js` dibuja los cinco días hábiles de la semana visible con los remates de `RematesData`. Cada evento abre el detalle; los días sin remates muestran «Sin remates». En escritorio la página no tiene barra lateral, solo un botón para volver.

## Documentos

`pages.js` lista los documentos de los remates de la semana visible, con buscador. Los botones «Ver» y «Revisar» solo muestran un aviso de maqueta.

## Reportes: panel de gerencia

Pensado para el gerente general o el dueño. Se puede ver por semana o con todas las semanas juntas (`scope` en `reportes.js`).

- **Indicadores:** remates del período, en riesgo, tasa de adjudicación, garantías en juego y avance promedio.
- **Requiere tu atención:** atrasados, suspendidos y en alerta, con motivo y responsable.
- **Gráficos:** estado de la cartera, remates abiertos por fase del workflow, resultados y carga por semana (sus columnas cambian de semana al tocarlas).
- **Detalle de remates:** la tabla completa; es lo que se exporta.
- **Exportación:** CSV (con BOM y punto y coma, para Excel en español) e impresión/PDF con estilos propios.

Supuestos de cálculo, todos en `reportes.js` y sin validar con el negocio:

- La garantía del Vale Vista es el 10 % de `minimum`.
- «Garantías en juego» suma los remates abiertos con el Vale Vista ya retirado (`flowStage` ≥ 9) que no se adjudicaron.
- «Por recuperar» cuenta solo los no adjudicados sin la tarea 17B. Un cancelado después de retirar el Vale Vista no entra.
- `BRANCH_TASKS` repite las claves de `RESULT_BRANCHES` de `app.js`; si cambia una, hay que cambiar la otra.

Los colores de estado de los gráficos (`STATUS_INFO`) se validaron para daltonismo y siempre van acompañados de etiqueta y número.

## Navegación y diseño responsive

La app debe funcionar completa en escritorio, tablet y teléfono; no hay pantallas ni flujos exclusivos de un tamaño.

- `shell.js` inserta la barra lateral donde encuentre `[data-side]` y la navegación inferior donde encuentre `[data-mobile-nav]`. La sección activa sale de `<body data-page>` (`inicio`, `semana`, `documentos`, `reportes`).
- Remates, Equipos y Configuración aparecen deshabilitados en la barra lateral: no tienen pantalla.
- Hasta 1100 px se oculta la barra lateral y aparece la navegación inferior.
- Hasta 760 px la tabla del tablero pasa a tarjetas, el detalle y el modal de flujo ocupan toda la pantalla y el modal de cada paso sube como hoja inferior.
- El diagrama es horizontal desde 1001 px (si no cabe, se abre con el zoom ajustado al ancho) y pasa a línea de tiempo vertical hasta 1000 px, con el mismo marcado.
- En pantallas táctiles (`pointer:coarse`) los controles miden al menos 44 px.
- La barra de scroll está personalizada en `styles.css` y `calendario.css`.

## Trampas conocidas

- **Ids globales.** Los scripts usan elementos como variables globales por su `id` (`list`, `search`, `detail`, `toast`, `attention`, `weekLabel`, `listCount`, `pageContent`…). Un segundo elemento con el mismo `id`, incluido un `<symbol>` del sprite, rompe esa referencia sin dar error. Por eso existen `icon-list` e `icon-search`.
- **Nombres reservados del navegador.** `screen` no sirve como referencia a un elemento (es `window.screen`). Tampoco conviene que una función se llame igual que el `id` de un elemento que usa.
- **`calendario.css` no hereda de `styles.css`.** Lo que el calendario necesite de la base (navegación inferior, íconos, scroll) hay que repetirlo ahí.
- **Estado guardado.** `localStorage` se mezcla sobre los datos base, así que un navegador con estado antiguo puede no reflejar un cambio en `data.js` hasta ejecutar `RematesData.reset()`.
- **Fechas fijas.** Todo ocurre en octubre de 2025; la semana inicial no se calcula respecto a la fecha actual.
- **Controles de maqueta.** La campana, el menú de usuario, «Ver historial», el botón del teléfono y los botones de documentos no tienen funcionalidad.

## Guía para futuros cambios

- Mantener la interfaz en español y respetar los nombres de estados y campos existentes, salvo que el cambio pida migrarlos.
- La lógica del workflow va en `app.js`; `workflow.js` solo dibuja y llama a esas funciones.
- Lo que tenga que ver con semanas pasa por `RematesData`, para que las cuatro pantallas sigan alineadas.
- Al agregar remates de ejemplo, completar todos los campos, incluidos `iso`, `flowStage` y `minimum`, y mantener coherentes `stage` y `progress`.
- Todo cambio visual se revisa en teléfono, tablet y escritorio.
- No introducir dependencias, build ni backend sin un requisito explícito.

## Historial de la sesión de trabajo (octubre de 2026)

Lo que se construyó, en orden, partiendo de un tablero con siete remates y un diagrama básico:

1. Corrección de bugs básicos: botones de Documentos y Reportes deshabilitados, enlace roto en el calendario, «Requiere atención» sin filtrar, buscador que comparaba contra URLs y un porcentaje fijo en Reportes.
2. Rediseño del diagrama del proceso como mapa interactivo, con un modal por nodo y animaciones.
3. Corrección de dos choques de `id` (la lista quedaba vacía y el buscador nunca había filtrado) y de las pantallas de Documentos y Reportes, que salían en blanco.
4. Estados suspendido y cancelado por revisión legal, con dos remates de ejemplo y botones en cada flujo.
5. Compatibilidad completa con tablet y teléfono: detalle y workflow únicos, diagrama vertical, navegación compartida y eliminación del detalle móvil simplificado.
6. Seis remates para la semana siguiente y filtros en el tablero por semana, tarjeta de estado y buscador.
7. Semana visible compartida por las cuatro pantallas y calendario generado desde los datos.
8. Intercambio de los dos botones de flujo del detalle y barra de scroll personalizada.
9. Panel de gerencia en Reportes, con montos de ejemplo, una semana anterior ya rematada y exportación a CSV y PDF.

Pendientes conversados y no hechos:

- Un botón «Restablecer maqueta» visible, en vez de `RematesData.reset()` por consola.
- Que el buscador del tablero busque en todas las semanas.
- Carga por responsable en Reportes (hoy cada remate tiene una persona distinta).
- Validar con el negocio las descripciones de los pasos, el 10 % de garantía y los criterios de «garantías en juego» y «por recuperar».
- Barra lateral en el calendario de escritorio.
- Probar en dispositivos reales: la verificación se hizo con capturas de Chrome headless desde 500 px de ancho, y la impresión a PDF no se probó.
