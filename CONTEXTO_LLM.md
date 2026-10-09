# Contexto del proyecto para asistentes LLM

## Objetivo

Este repositorio contiene una pequeña maqueta navegable, en español, para administrar remates inmobiliarios. Permite consultar propiedades, responsables y estados; avanzar un workflow de tareas; y revisar pantallas de calendario, documentos y reportes.

Es un prototipo de frontend estático, no un sistema de producción. No hay servidor, API, autenticación ni base de datos. No asumir que las acciones representan procesos reales ni que los datos se comparten entre usuarios o dispositivos.

## Tecnologías y ejecución

- HTML, CSS y JavaScript vanilla; no se observa un framework ni un gestor de paquetes.
- El inicio es `hello.html`. Alcanza con abrirlo en un navegador o servir la carpeta como archivos estáticos.
- `data.js` inicializa los datos compartidos antes de que se ejecute la lógica de cada pantalla.
- Los cambios del workflow se guardan en `localStorage` del navegador, bajo la clave `remates-demo-state`.
- Las fotos y avatares apuntan a Unsplash y Pravatar, por lo que necesitan conexión a Internet para cargarse.

## Mapa de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `hello.html` | Estructura del tablero de inicio, panel de detalle y modales del workflow. |
| `shell.js` | Barra lateral, navegación inferior (tablet/teléfono) y sprite de íconos SVG, compartidos por todas las pantallas. Cada página marca el lugar con `[data-side]` y `[data-mobile-nav]` y la sección activa con `<body data-page>`. |
| `app.js` | Render del tablero, búsqueda, métricas, detalle, navegación, workflow y sus ramas de resultado. |
| `data.js` | Datos de ejemplo y API global `window.RematesData` para actualizar o restablecer el estado local. |
| `styles.css` | Estilos del tablero, diseño responsive, panel de detalle y modal/lista del workflow. |
| `workflow.js`, `workflow.css` | Vista «diagrama» del modal de flujo: nodos clicables, ramas de resultado, zoom y el modal de cada paso (`openNode`). Solo dibuja y delega los cambios de estado en `app.js`. |
| `semana.html`, `calendario.js` | Calendario semanal: `calendario.js` dibuja los remates de la semana visible a partir de `data.js`; cada evento abre `hello.html?id=<id>`. |
| `calendario.css` | Estilos del calendario. Es autónoma: no importa `styles.css`. |
| `documentos.html`, `reportes.html` | Contenedores de las pantallas de documentos y reportes. |
| `pages.js` | Estructura común de Documentos y Reportes (cabecera, barra de semana, toast) y el contenido de Documentos. |
| `reportes.js`, `reportes.css` | Panel de gerencia de Reportes: indicadores, pendientes, gráficos, tabla de detalle, exportación a CSV e impresión/PDF. Depende de `pages.js`. |
| `screens.css` | Estilos para las pantallas generadas por `pages.js`; importa `styles.css`. |

## Datos y estado

(m,x)=>'`data.js` define veinte propiedades de ejemplo: cinco ya rematadas en la semana del 6 al 10 de octubre de 2025 (con `resultOutcome` y `resultTasks`), nueve en la del 13 al 17 (dos detenidas por legal: una suspendida en el paso 7 y otra cancelada en el paso 11) y seis en la del 20 al 24. Todas traen `flowStage`, y `stage` y `progress` coinciden con ese paso.

- `id`, `title`, `place`, `date`, `iso`, `time`
- `stage`, `person`, `status`, `due`
- `progress`, `documents`, `photo` y datos de avatar
- `minimum` (mínimo del remate, en millones de pesos) y, si se adjudicó, `awarded`. La garantía del Vale Vista se calcula como el 10 % de `minimum` en `reportes.js`.

Los estados visibles son `ATRASADO`, `ALERTA`, `BIEN`, `SUSPENDIDO` y `CANCELADO`. `window.RematesData.items` es la fuente inicial de datos. `window.RematesData.update(id, changes)` modifica el elemento, persiste los cambios localmente y emite el evento `remates:changed`. `window.RematesData.reset()` borra el estado guardado y recarga la página.

`app.js` crea una copia de los elementos para renderizar el tablero. Al actualizar un workflow, copia los cambios devueltos por `RematesData.update` a esa copia y vuelve a dibujar la interfaz.

## Workflow del remate

`app.js` es el dueño de la lógica del workflow. `TASKS` declara 15 tareas ordenadas, desde «Crear workflow» hasta «Registrar resultado». El campo opcional `flowStage` marca la tarea actual; si no existe, se toma la primera. El modal permite alternar entre lista y diagrama.

Al completar las tareas iniciales, el usuario puede seleccionar una rama de resultado:

- `ADJUDICADO`: gestionar pago, marcar adjudicación y crear proyecto.
- `NO_ADJUDICADO`: recuperar y registrar la garantía.
- `REPROGRAMADO`: actualizar fecha, recalcular plazos y continuar el workflow.

La selección y el avance de tareas se guardan en `localStorage`, incluidos `resultOutcome` y `resultTasks`. ### Suspender y cancelar (revisión legal)

El equipo legal puede suspender o cancelar un remate en cualquier paso. `stopWorkflow(id, 'SUSPENDIDO' | 'CANCELADO')` y `resumeWorkflow(id)` viven en `app.js`: cambian `status`, guardan el estado previo en `stopPrior` y dejan `flowStage` intacto (el paso donde se detuvo). Mientras el remate está detenido no se pueden completar tareas ni elegir resultado. Suspendido se puede reanudar; cancelado cierra el workflow y no tiene vuelta atrás en la interfaz (`RematesData.reset()` restaura la maqueta). Los botones están en la lista del flujo, en la columna «Estados excepcionales» del diagrama y en el modal de los pasos legales 7 y 11. «Desierto u otro» sigue siendo solo informativo.

## Navegación actual

- Desde `hello.html`, Calendario abre `semana.html`; Documentos y Reportes abren sus HTML respectivos.
- Seleccionar un remate abre el mismo panel de detalle en todos los tamaños (lateral en escritorio y tablet, a pantalla completa en teléfono). `hello.html?id=<id>` lo abre directamente.
- La semana visible es común a Inicio, Calendario, Documentos y Reportes: se guarda en `sessionStorage` (`remates-demo-week`) y se maneja con `RematesData.getWeek()`, `setWeek()`, `weekRange()` y `weekItems()`. Va de la semana del 6 a la del 27 de octubre de 2025.
- Documentos y reportes se generan con `pages.js` a partir de los datos de `data.js`.

## Diseño responsive

La app debe funcionar completa en escritorio, tablet y teléfono; no hay pantallas ni flujos exclusivos de un tamaño.

- Hasta 1100 px se oculta la barra lateral y aparece la navegación inferior.
- Hasta 760 px la tabla del tablero pasa a tarjetas, el detalle y el modal de flujo ocupan toda la pantalla y el modal de cada paso sube como hoja inferior.
- El diagrama es horizontal desde 1001 px (se abre con el zoom ajustado al ancho si no cabe) y pasa a línea de tiempo vertical hasta 1000 px, con el mismo marcado y los mismos modales.
- En pantallas táctiles (`pointer:coarse`) los controles miden al menos 44 px.
- Los ids de los símbolos del sprite son globales: no deben coincidir con ids de elementos que los scripts usan como variables (`list`, `search`, `detail`, etc.).

## Límites y discrepancias conocidas

- En el tablero se combinan tres filtros (`render` en `app.js`): la semana visible (`week`, se compara contra el campo `iso`), la tarjeta de métrica activa (`statusFilter`) y el texto del buscador. Las métricas y «Requiere atención» se calculan sobre la semana visible.
- Algunas secciones y botones están deshabilitados o muestran mensajes de maqueta. Evitar presentarlos como funcionalidades completas.
- Las fechas son datos fijos de octubre de 2025; la semana inicial no se calcula respecto a la fecha actual.

## Guía para futuros cambios

- Mantener el idioma de la interfaz en español y respetar los nombres de estados y campos existentes, salvo que el cambio pida migrarlos.
- Para cambios del workflow principal, modificar y validar `app.js`; `workflow.js` solo dibuja y delega en esas funciones.
- Para cambios en datos o persistencia, revisar conjuntamente `data.js` y sus consumidores (`app.js`, `workflow.js` y `pages.js`).
- Antes de conectar una pantalla estática, comprobar el comportamiento en escritorio y móvil y definir si debe reflejar las actualizaciones de `localStorage`.
- No introducir dependencias o infraestructura de backend sin un requisito explícito: la estructura actual es una maqueta local sin build.