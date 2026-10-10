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
| `data.js` | Fuente única de los datos y del dominio: remates, definición del workflow (pasos y ramas), usuarios, responsables y semana visible. Expone `window.RematesData`. |
| `shell.js` | Barra lateral, navegación inferior y sprite de íconos SVG, compartidos por todas las pantallas. |
| `hello.html` | Tablero de inicio: métricas, lista de remates, «Requiere atención», panel de detalle y los dos modales (flujo y paso). |
| `app.js` | Tablero (render, filtros, detalle) e interfaz del workflow: avanzar tareas, ramas de resultado, suspender, cancelar y reanudar. Los pasos y sus transiciones los toma de `data.js`. |
| `workflow.js`, `workflow.css` | Vista «diagrama» del modal de flujo y modal de cada paso. Solo dibuja; los cambios de estado los delega en `app.js`. |
| `styles.css` | Estilos base, tablero, panel de detalle, modal de flujo en lista, estados, responsive y barra de scroll. |
| `semana.html`, `calendario.js`, `calendario.css` | Calendario semanal generado desde los datos. `calendario.css` es autónoma: no importa `styles.css`. |
| `documentos.html`, `reportes.html` | Contenedores de Documentos y Reportes. |
| `pages.js` | Estructura común de Documentos y Reportes (cabecera, barra de semana, toast) y el contenido de Documentos. |
| `reportes.js`, `reportes.css` | Panel de gerencia de Reportes. Depende de `pages.js`. |
| `screens.css` | Estilos de las pantallas de `pages.js`; importa `styles.css`. |
| `tareas-data.js` | Arma las tareas a partir del workflow de cada remate y expone `window.TareasData` para las dos pantallas siguientes. No guarda una lista propia. |
| `mis-tareas.html`, `mis-tareas.js`, `mis-tareas.css` | Mis tareas: las tareas del workflow que le tocan al usuario elegido. Completar una avanza el remate. |
| `gestor-usuarios.html`, `gestor-usuarios.js`, `gestor-usuarios.css` | Gestor de usuarios: los usuarios son los responsables de los remates. Alta, edición, activación y reasignación de tareas. |

`detalle.html` y `detalle.js` (un detalle móvil simplificado) se eliminaron: hoy existe un único detalle para todos los tamaños.

### Orden de carga

- `hello.html`: `data.js` → `shell.js` → `app.js` → `workflow.js`
- `semana.html`: `data.js` → `shell.js` → `calendario.js`
- `documentos.html`: `data.js` → `shell.js` → `pages.js`
- `reportes.html`: `data.js` → `shell.js` → `pages.js` → `reportes.js`
- `mis-tareas.html`: `data.js` → `shell.js` → `tareas-data.js` → `mis-tareas.js`
- `gestor-usuarios.html`: `data.js` → `shell.js` → `tareas-data.js` → `gestor-usuarios.js`

`workflow.js` usa globales de `app.js` (`TASKS`, `RESULT_BRANCHES`, `data`, `getFlowStage`, `completeStage`, `isStopped`, `isFinished`, etc.) y `app.js` llama a `mountFlowDiagram` y `openNode` de `workflow.js` en tiempo de ejecución. `reportes.js` usa `R`, `week`, `weekBar`, `bindWeek`, `toast` y `statusClass` de `pages.js`.

## Datos y estado

`data.js` define veinte remates de ejemplo:

- **6 al 10 de octubre de 2025 (ids 16–20):** ya rematados, con `resultOutcome` y `resultTasks`. Dos cerrados y tres con el cierre de su rama pendiente.
- **13 al 17 de octubre (ids 1–9):** la semana inicial. Incluye un suspendido en el paso 7 (id 8) y un cancelado en el paso 11 (id 9).
- **20 al 24 de octubre (ids 10–15):** remates en pasos tempranos del workflow.

Campos de cada remate:

- `id`, `title`, `place`, `date` (texto, p. ej. «Lun 13 oct»), `iso` (fecha `AAAA-MM-DD`, la que usan los filtros de semana), `time`
- `stage` (texto del paso actual), `flowStage` (número de paso, 1 a 16), `progress` (0 a 100), `status`, `due` (texto del plazo, p. ej. «Vence en 18 h»)
- `dueAt`: fecha y hora del plazo de la tarea actual (`AAAA-MM-DDTHH:MM`). Debe decir lo mismo que `due` respecto del «hoy» de la maqueta. Lo usa Mis tareas; el tablero y Reportes siguen mostrando `due`. No lo tienen los remates suspendidos, cancelados ni terminados.
- `gestorId` y `postorId`: los usuarios asignados al remate en el paso 2 (más `gestorBackupId` y `postorBackupId` si se eligieron suplentes). El remate 12 parte sin ellos porque está justo en ese paso.
- `person`, `avatarUrl` y `responsibleId`: **no se escriben en los datos**. Los calcula `data.js` a partir del responsable de la tarea actual y los recalcula en cada `update` y al guardar usuarios.
- `minimum` (mínimo del remate, en millones de pesos) y `awarded` si se adjudicó
- `documents` (`[nombre, tipo, estado]`) y `photo` (id de Unsplash)
- Solo cuando aplican: `resultOutcome`, `resultTasks`, `resultPriorStatus`, `stopPrior` y `taskNotes` (ajustes por tarea: `{ [clave]: { status, assignedUserId, substituteUserId, description, valeVistaRequest } }`)

`stage`, `flowStage` y `progress` deben ser coherentes entre sí: `stage` es el nombre de la tarea `flowStage` en `TASKS` y `progress` es el porcentaje de tareas completadas.

Estados (`status`): `ATRASADO`, `ALERTA`, `BIEN`, `SUSPENDIDO`, `CANCELADO`. Sus clases CSS son `late`, `alert`, `good`, `paused` y `cancelled` (en el calendario: `atrasado`, `alerta`, `bien`, `suspendido`, `cancelado`).

### API `window.RematesData`

- `items`: los remates con el estado guardado ya mezclado.
- `update(id, changes)`: modifica, persiste en `localStorage` y emite `remates:changed`.
- `reset()`: borra remates y usuarios guardados y recarga. No tiene botón en la interfaz; se ejecuta desde la consola.
- `weekRange(offset)`: devuelve `{from, to, label, days}` de una semana. La semana 0 es la del lunes 13 de octubre de 2025.
- `weekItems(offset)`, `getWeek()`, `setWeek(n)`: remates de una semana y semana visible (limitada de −1 a 2, es decir, del 6 al 31 de octubre).

- `steps` y `branches`: definición del workflow (ver más abajo).
- `users()`, `saveUsers(lista)` y `userRoles`: usuarios y el rol de workflow de cada rol de usuario.
- `currentTask(item)` y `lastDoneTask(item)`: la tarea que toca ahora en un remate y la última completada.
- `taskUser(item, tarea)`: quién responde por una tarea.
- `stepChanges(item)` y `resultTaskChanges(item, clave, marcada)`: los cambios que produce completar un paso o una tarea de rama. Son la única implementación de esas transiciones.
- `completeCurrent(id)`: completa la tarea actual de un remate.

`app.js` trabaja sobre una copia de `items` (`data`) y la sincroniza con lo que devuelve `update`.

## Tablero (`hello.html` + `app.js`)

- La lista combina tres filtros en `render`: la semana visible (`week`), la tarjeta de métrica activa (`statusFilter`) y el texto del buscador.
- Las cinco tarjetas de métricas (Remates, En alerta, Atrasado, Bien, Detenidos) son botones que filtran por estado; «Detenidos» agrupa suspendidos y cancelados. Las métricas y «Requiere atención» se calculan sobre la semana visible.
- El buscador mira título, comuna, fecha, hora, etapa, responsable y estado, solo dentro de la semana visible.
- «Requiere atención» lista los atrasados y en alerta; sus filas abren el detalle.
- Tocar un remate abre el panel de detalle. `hello.html?id=<id>` lo abre directamente; así enlazan el calendario y Reportes.
- En el detalle, «Ver flujo completo →» abre el diagrama y el botón de la flecha abre la lista de tareas.

## Workflow del remate

La definición vive en `data.js`: `steps` son las 15 tareas en orden, de «Crear workflow» a «Registrar resultado», cada una con `title`, `role`, `type` y `desc`. `app.js` deriva `TASKS` y `RESULT_BRANCHES` de ahí y maneja la interfaz. `flowStage` marca la tarea actual; con 16, las 15 están completas.

Tras la tarea 15 se elige una rama de resultado (`branches`; cada tarea es `[clave, título, detalle, rol]`):

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

Los colores de estado de los gráficos (`STATUS_INFO`) se validaron para daltonismo y siempre van acompañados de etiqueta y número.

## Usuarios, responsables y tareas

Los usuarios, los responsables de los remates y las tareas son una sola cosa conectada, no tres listas.

### Usuarios y roles

`data.js` define ocho usuarios de ejemplo y los guarda en `localStorage` bajo `remates-demo-users`. Cada usuario tiene uno de cuatro roles, y cada rol responde por ciertos pasos del workflow:

| Rol de usuario | Rol de workflow | Pasos |
| --- | --- | --- |
| Administrador | `admin` | 1 a 5 (asignador, gerente general y pasos del sistema), 18A, 19A y la rama Reprogramado |
| Gestor de remates | `gestor` | 6, 8, 9, 10, 17A, 17B y 18B |
| Responsable de participación | `postor` | 12 a 15 y elegir el resultado |
| Responsable de revisión legal | `legal` | 7 y 11 |

Quién responde por una tarea (`taskUser`), en este orden:

1. el usuario al que se reasignó esa tarea a mano (`taskNotes[clave].assignedUserId`);
2. para `gestor` y `postor`, el asignado al remate (`gestorId`, `postorId`), aunque esté inactivo, hasta que se reasigne;
3. el primer usuario activo de ese rol;
4. si no hay nadie activo en el rol, un administrador activo.

El «Responsable» del tablero, del detalle, de Documentos y de Reportes es siempre el de la tarea actual del remate. En un remate cancelado es el responsable legal; en uno terminado, su gestor.

Los pasos que el diagrama marca como «Sistema» se asignan al administrador para que toda tarea tenga dueño en la maqueta.

### Tareas

No existe una lista de tareas guardada. `TareasData.tasks()` las arma en cada render: por cada remate, su tarea actual (si sigue abierto) y la última completada.

- **Estado:** completada; bloqueada si el remate está suspendido o se marcó así; atrasada si el remate está `ATRASADO`; en curso si se marcó así; si no, pendiente.
- **Prioridad:** crítica si el remate está atrasado, urgente si está en alerta, próxima si el remate es de esta semana, normal en otro caso.
- **Plazo:** fecha y hora de `dueAt` del remate, con el tiempo relativo al «hoy» de la maqueta («Hace 4 horas», «En 2 días»). Si el remate no tiene `dueAt`, se muestra su texto `due` y se usa la fecha del remate. Con esa fecha se calculan «hoy» y «esta semana».
- **«Hoy» de la maqueta:** fijo en el 16 de octubre de 2025 a las 18:00 (`NOW` y `TODAY` en `tareas-data.js`). «Esta semana» es la de ese día, de lunes a domingo.
- **Suplente:** cada tarea puede tener uno. Es el elegido a mano en la tarea (`taskNotes[clave].substituteUserId`) o, si no, el suplente del gestor o postor del remate (`gestorBackupId`, `postorBackupId`). Una tarea es de un usuario si es su responsable o su suplente (`TareasData.isAssignedTo`): así se filtra Mis tareas y así cuenta el Gestor.
- **Tipo, prioridad y plazo no se editan** en la tarea: salen del remate. Lo propio de la tarea (en curso o bloqueada, responsable, descripción, carta Vale Vista) se guarda en `taskNotes` del remate con `TareasData.saveNote`.

Lo que cada acción produce:

- **Completar una tarea** (casilla o estado «Completada») llama a `completeCurrent`: el remate avanza al paso siguiente y la tarea nueva le aparece a quien corresponda. Las completadas quedan de solo lectura.
- **Avanzar el remate desde el tablero** cambia las tareas de la misma forma, porque usa las mismas transiciones.
- **«Asignar gestor y postor»** (paso 2) guarda `gestorId` y `postorId` en el remate; desde ahí se reparten sus tareas. Solo ofrece usuarios del rol correspondiente y avisa si el postor ya tiene otro remate a la misma hora.
- **Reasignar** una tarea, desde su modal, su menú o el Gestor, cambia también el responsable que muestra el tablero. En el Gestor, si el usuario figura como suplente, lo que se reasigna es la suplencia.
- **Elegir el resultado** del remate no se hace en Mis tareas: al abrir la tarea «Elegir resultado del remate» se muestra un aviso con el enlace «Abrir remate en Workflow».
- **Desactivar un usuario** pide confirmación en un modal propio. Las tareas de los remates donde es gestor o postor quedan a su nombre hasta reasignarlas; las que dependen solo del rol pasan a otro usuario activo.

Pantalla de Mis tareas (rediseñada según una imagen de referencia del cliente):

- **Métricas:** activas, atrasadas, vencen hoy y esta semana; filtran al tocarlas. Una tarea atrasada no cuenta como «vence hoy».
- **Grupos:** atrasadas, críticas, próximas / hoy, de esta semana, posteriores, sin vencimiento y completadas. Cada uno con su color e ícono, ordenado por plazo, y se contraen (`state.collapsed`; «completadas» parte contraído).
- **Fila:** el nombre del remate enlaza a su detalle; plazo con texto relativo, responsable (o su suplente), tipo con ícono y una sola etiqueta (`taskPill`): el estado cuando informa algo (atrasada, bloqueada, en curso, completada) y, si no, la prioridad.
- **Menú «⋯»** (`openTaskMenu`): Reasignar, Marcar en curso o pendiente, Bloquear o desbloquear y Ver remate. Si el bloqueo viene de un remate suspendido, no se ofrece cambiarlo desde la tarea.
- **Próximos vencimientos:** línea de tiempo con las cinco tareas abiertas que todavía no vencen; «Ver todas» y «Restablecer» limpian todos los filtros.
- **Mi carga de trabajo:** dona por urgencia, con cada tarea en una sola categoría (atrasadas, vencen hoy, resto de la semana, próximas, completadas) y selector «Todas / Esta semana». Debajo, el desglose «Por estado».
- **Tipos de tareas:** barras por tipo. Los tipos son los del workflow (Gestión, Vale Vista, Documentación, Legal, Participación, Cierre), no los de la referencia.

Otros puntos:

- En Mis tareas cada tarea aparece una sola vez, en el primer grupo que le corresponde (atrasadas, críticas, de hoy, de esta semana, próximas, completadas).
- Un usuario inactivo con tareas abiertas sigue en el selector de Mis tareas, marcado «(inactivo)».
- La garantía de la carta Vale Vista se precarga con el 10 % del `minimum`, en millones de pesos, igual que en Reportes.
- El texto ingresado por el usuario se inserta siempre con `escapeHtml`.
- El usuario elegido en Mis tareas se guarda en `sessionStorage` (`inmoremates-active-user`).

Límites conocidos:

- La carta Vale Vista es simulada: no genera PDF ni envía correo.
- «Completadas» muestra solo la última tarea completada de cada remate; no hay historial ni fechas de cierre.
- Completar un paso deja el remate en `ALERTA` salvo que estuviera `ATRASADO`, y no recalcula el plazo. Es el comportamiento que ya tenía el tablero.
- Mis tareas no sigue la semana visible compartida; trabaja sobre el «hoy» fijo.
- La cabecera muestra siempre a María González como usuaria; no hay sesión ni permisos por rol.

## Navegación y diseño responsive

La app debe funcionar completa en escritorio, tablet y teléfono; no hay pantallas ni flujos exclusivos de un tamaño.

- `shell.js` inserta la barra lateral donde encuentre `[data-side]` y la navegación inferior donde encuentre `[data-mobile-nav]`. La sección activa sale de `<body data-page>` (`inicio`, `mis-tareas`, `semana`, `documentos`, `reportes`, `usuarios`).
- Remates, Equipos y Configuración aparecen deshabilitados en la barra lateral: no tienen pantalla.
- **Marca:** GrupoHouse. El logo es `logohouse.png` (PNG transparente, «Grupo» en gris y «House» en negro) y va en la barra lateral y, en tablet y teléfono, en la cabecera del tablero. El nombre no se escribe como texto en la interfaz; los títulos de pestaña dicen «· GrupoHouse».
- **Paleta:** neutra, tomada del logo (`styles.css`, sección «Marca GrupoHouse»). Negro para texto, botones principales y elemento activo; grises neutros para bordes, fondos y texto secundario. Los únicos colores con tono son los de estado: rojo, ámbar, verde y violeta. Las variables conservan sus nombres antiguos (`--blue`, `--navy`, `--task-blue`) aunque ya no son azules. No introducir azul ni otros acentos.
- **Tipografía:** los titulares (`h1`, `h2`, `h3`) usan una sans geométrica cercana a la del logo (Century Gothic y equivalentes); el resto sigue en Inter/system-ui.
- La barra lateral es blanca, con el ítem activo en negro. La navegación inferior de tablet y teléfono también es clara.
- Hasta 1100 px se oculta la barra lateral y aparece la navegación inferior. Toda pantalla con grilla propia para la barra lateral debe soltar esa columna en el mismo punto.
- Hasta 760 px la tabla del tablero pasa a tarjetas, el detalle y el modal de flujo ocupan toda la pantalla y el modal de cada paso sube como hoja inferior.
- El diagrama es horizontal desde 1001 px (si no cabe, se abre con el zoom ajustado al ancho) y pasa a línea de tiempo vertical hasta 1000 px, con el mismo marcado.
- En pantallas táctiles (`pointer:coarse`) los controles miden al menos 44 px.
- La barra de scroll está personalizada en `styles.css` y `calendario.css`.

## Trampas conocidas

- **Ids globales.** Los scripts usan elementos como variables globales por su `id` (`list`, `search`, `detail`, `toast`, `attention`, `weekLabel`, `listCount`, `pageContent`…). Un segundo elemento con el mismo `id`, incluido un `<symbol>` del sprite, rompe esa referencia sin dar error. Por eso existen `icon-list` e `icon-search`.
- **Nombres reservados del navegador.** `screen` no sirve como referencia a un elemento (es `window.screen`). Tampoco conviene que una función se llame igual que el `id` de un elemento que usa.
- **`calendario.css` no hereda de `styles.css`.** Lo que el calendario necesite de la base (navegación inferior, íconos, scroll) hay que repetirlo ahí.
- **Estado guardado.** `localStorage` se mezcla sobre los datos base, así que un navegador con estado antiguo puede no reflejar un cambio en `data.js` hasta ejecutar `RematesData.reset()`. Las claves antiguas `inmoremates-demo-users` e `inmoremates-demo-tasks` ya no se leen; `reset()` las borra.
- **Fechas fijas.** Todo ocurre en octubre de 2025; la semana inicial no se calcula respecto a la fecha actual.
- **Controles de maqueta.** La campana, el menú de usuario, «Ver historial», el botón del teléfono y los botones de documentos no tienen funcionalidad.

## Guía para futuros cambios

- Mantener la interfaz en español y respetar los nombres de estados y campos existentes, salvo que el cambio pida migrarlos.
- La definición del workflow, sus transiciones y quién responde por cada tarea van en `data.js`. `app.js` maneja la interfaz del tablero, `workflow.js` solo dibuja y `tareas-data.js` solo arma las tareas.
- No guardar el responsable ni las tareas como datos: se derivan. Para cambiar quién hace algo, cambiar `gestorId`, `postorId` o `taskNotes`.
- Lo que tenga que ver con semanas pasa por `RematesData`, para que las cuatro pantallas sigan alineadas.
- Al agregar remates de ejemplo, completar todos los campos, incluidos `iso`, `flowStage`, `minimum`, `gestorId` y `postorId`, y mantener coherentes `stage` y `progress`.
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
10. Revisión y corrección de Mis tareas y Gestor de usuarios (solo arreglos, sin funcionalidad nueva):
    - datos de ejemplo unificados en `tareas-data.js`; antes el Gestor mostraba cero tareas y reasignar no guardaba;
    - un solo criterio de estado y de fechas; grupos sin tareas repetidas y con las tareas futuras, que antes no aparecían;
    - en tablet y teléfono las tareas vuelven a mostrar vencimiento, estado y el botón para abrirlas, y el Gestor pasa a tarjetas;
    - textos en español, texto escapado, monto de garantía corregido y datos de ejemplo corregidos.
11. Conexión de usuarios, responsables y tareas:
    - los pasos del workflow, sus transiciones y los usuarios pasaron a `data.js` como fuente única;
    - las tareas de Mis tareas se generan desde el workflow y completarlas avanza el remate;
    - el responsable de cada remate es el usuario al que le toca su tarea actual, y los remates tienen gestor y postor asignados;
    - desactivar un usuario usa un modal propio.
12. Rediseño de Mis tareas según la referencia del cliente (grupos de color contraíbles, fila con plazo relativo y una etiqueta, menú «⋯», línea de tiempo, dona y tipos) y campo `dueAt` en los remates.
13. Fusión con la rama de Cat-1114 (commit «agregue algunas cosas»), que había seguido trabajando sobre la lista de tareas guardada. Se mantuvo la versión conectada con el workflow y se trajeron sus aportes: suplentes por tarea, enlace al remate en cada fila, «Restablecer» sobre todos los filtros, búsqueda por etapa y prioridad, grupos «posteriores» y «sin vencimiento» ordenados por plazo, próximos vencimientos solo con tareas vigentes, desglose por estado y el aviso para tareas que se gestionan desde el flujo. No se conservó `mis-tareas-data.js` (la lista fija de tareas), porque las tareas ahora se generan desde los remates.
14. Identidad GrupoHouse: se quitó el nombre InmoRemates, se incorporó el logo `logohouse.png` y toda la app pasó de la paleta azul a una neutra en negro y gris, manteniendo los colores de estado.

Pendientes conversados y no hechos:

- Un botón «Restablecer maqueta» visible, en vez de `RematesData.reset()` por consola.
- Que el buscador del tablero busque en todas las semanas.
- Carga por responsable en Reportes (ahora posible: los responsables son ocho usuarios que se repiten).
- Validar con el negocio las descripciones de los pasos, el 10 % de garantía y los criterios de «garantías en juego» y «por recuperar».
- Barra lateral en el calendario de escritorio.
- Historial de tareas completadas con fecha, y sesión real de usuario con permisos por rol.
- De la referencia de Mis tareas quedó fuera: varias tareas abiertas a la vez por remate, plazo propio por cada paso (hoy `dueAt` es uno por remate y no se recalcula al avanzar) y las pantallas «Alertas» y «Workflow» del menú.
- Probar en dispositivos reales: la verificación se hizo con capturas de Chrome headless desde 500 px de ancho, y la impresión a PDF no se probó.
