// Diagrama interactivo del workflow: vista «diagrama» del modal de flujo y modal de cada paso.
// Usa los globales de app.js (TASKS, RESULT_BRANCHES, data, getFlowStage, completeStage, etc.).
const FLOW_NODES = [
    { n: 1, task: 1, type: 'system', icon: 'home', title: 'Propiedad aceptada', who: 'Sistema', note: 'Crea el workflow', desc: 'Al aceptar la propiedad, el sistema crea el workflow del remate.' },
    { n: 2, task: 2, type: 'person', icon: 'users', title: 'Asignar gestor y postor', who: 'Asignador', note: 'Rol por definir', desc: 'Se define quién gestiona el remate y quién participa como postor.' },
    { n: 3, task: 3, type: 'person', icon: 'file', title: 'Generar carta Vale Vista', who: 'Asignador o sistema', note: '', desc: 'Se genera la carta para solicitar el Vale Vista.' },
    { n: 4, task: 4, type: 'system', icon: 'send', title: 'Enviar carta al GG', who: 'Sistema', note: 'Email con adjunto', desc: 'El sistema envía la carta por email, con el adjunto, al gerente general.' },
    { n: 5, task: 5, type: 'person', icon: 'bank', title: 'GG envía carta al banco', who: 'Gerente general', note: 'Desde su buzón', desc: 'El gerente general envía la carta al banco desde su buzón.' },
    { n: 6, task: 6, type: 'person', icon: 'icon-list', title: 'Generar formulario', who: 'Gestor', note: '', desc: 'El gestor genera el formulario que se entrega junto al Vale Vista.' },
    { n: 7, task: 7, type: 'person', icon: 'shield', title: 'Legal pre-entrega', who: 'Equipo legal', note: 'Hasta 1 h antes del paso 9', parallel: true, desc: 'Revisión legal previa a la entrega. Corre en paralelo y no bloquea el avance.' },
    { n: 8, task: 8, type: 'person', icon: 'card', title: 'Retirar Vale Vista', who: 'Gestor', note: 'En el banco', desc: 'El gestor retira el Vale Vista en el banco.' },
    { n: 9, task: 9, type: 'person', icon: 'file', title: 'Entregar VV y formulario', who: 'Gestor', note: 'En el juzgado', desc: 'El gestor entrega el Vale Vista y el formulario en el juzgado.' },
    { n: 10, task: 10, type: 'person', icon: 'image', title: 'Registrar evidencia', who: 'Gestor', note: 'Fotos timbradas', desc: 'El gestor registra las fotos timbradas como evidencia de la entrega.' },
    { n: 11, task: 11, type: 'person', icon: 'shield', title: 'Legal final', who: 'Equipo legal', note: 'Hasta 1 h antes del remate', parallel: true, desc: 'Revisión legal final antes del remate. Corre en paralelo y no bloquea el avance.' },
    { n: 12, task: 12, type: 'person', icon: 'settings', title: 'Preparar participación', who: 'Postor', note: 'Link y monto', desc: 'El postor deja listos el link de la sala y el monto para participar.' },
    { n: 13, task: null, type: 'system', icon: 'bell', title: 'Alertas pre-remate', who: 'Sistema', note: 'De 24 h a 15 min antes', desc: 'El sistema envía alertas desde 24 h hasta 15 min antes del remate.' },
    { n: 14, task: 13, type: 'person', icon: 'monitor', title: 'Ingresar a sala virtual', who: 'Postor', note: 'Máx. 15 min antes', desc: 'El postor ingresa a la sala virtual, como máximo 15 min antes.' },
    { n: 15, task: 14, type: 'person', icon: 'hammer', title: 'Participar en remate', who: 'Postor', note: '', desc: 'El postor participa en el remate.' },
    { n: 16, task: 15, type: 'person', icon: 'chart', title: 'Registrar resultado', who: 'Postor o usuario autorizado', note: '', desc: 'Se registra el resultado del remate y se abre la rama correspondiente.' }
];
const BRANCH_TONE = { ADJUDICADO: 'green', NO_ADJUDICADO: 'amber', REPROGRAMADO: 'blue' };
const STEP_ICON = { '17A': 'card', '18A': 'home', '19A': 'folder', '17B': 'refresh', '18B': 'file', '17C': 'calendar', '17D': 'clock', '17E': 'refresh' };
const FLOW_EXCEPTIONS = [
    { key: 'SUSPENDIDO', title: 'Suspender remate', active: 'Suspendido', text: 'Por legal, se puede reanudar.', icon: 'pause', tone: 'violet' },
    { key: 'CANCELADO', title: 'Cancelar remate', active: 'Cancelado', text: 'Por legal, cierra el workflow.', icon: 'xcircle', tone: 'red' },
    { title: 'Desierto u otro', text: 'Rama por definir.', icon: 'ban', tone: 'muted' }
];
const STATE_LABEL = { done: 'Completada', current: 'En proceso', late: 'Atrasada', pending: 'Pendiente', paused: 'Suspendido', cancelled: 'Cancelado' };
const STATE_CLASS = { done: 'good', current: 'alert', late: 'late', pending: 'idle', paused: 'paused', cancelled: 'cancelled' };
const STOP_ICON = { paused: 'pause', cancelled: 'xcircle' };
const nodeModal = document.querySelector('#nodeModal');
const nodeContent = document.querySelector('#nodeContent');
const nodeClose = document.querySelector('#nodeClose');
let flowZoom = 1, justDone = '';

const sentence = text => text[0] + text.slice(1).toLowerCase();
const svg = name => `<svg class="icon"><use href="#${name}"/></svg>`;

function flowState(item) {
    const stage = getFlowStage(item);
    const outcome = item.resultOutcome || '';
    const branch = RESULT_BRANCHES[outcome];
    const tasks = item.resultTasks || {};
    return {
        id: item.id, stage, completed: stage - 1, outcome, branch, tasks,
        branchDone: Boolean(branch) && branch.tasks.every(([key]) => tasks[key]),
        late: item.status === 'ATRASADO',
        stop: item.status === 'SUSPENDIDO' ? 'paused' : item.status === 'CANCELADO' ? 'cancelled' : '',
        finished: isFinished(item),
        canSelect: stage >= 15 && !isStopped(item)
    };
}

function nodeState(node, s) {
    const isResult = node.n === 16, auto = node.task === null;
    const done = isResult ? s.branchDone : auto ? s.completed >= 12 : s.completed >= node.task;
    const current = !done && (isResult ? s.stage >= 15 : !auto && s.stage === node.task);
    return done ? 'done' : current ? s.stop || (s.late ? 'late' : 'current') : 'pending';
}

const currentNode = s => FLOW_NODES.find(node => node.task === Math.min(s.stage, 15));

function flowNode(node, s, extra = '') {
    const state = nodeState(node, s);
    const next = FLOW_NODES[node.n];
    const flowing = !s.stop && state === 'done' && next && nodeState(next, s) !== 'done';
    const tag = state !== 'done' && state !== 'pending' ? STATE_LABEL[state] : node.task === null ? 'Automática' : node.parallel ? 'En paralelo' : '';
    const classes = ['wf-node', `is-${state}`, node.parallel ? 'parallel' : '', flowing ? 'flowing' : '', justDone === `n${node.n}` ? 'just-done' : '', extra].filter(Boolean).join(' ');
    return `<button class="${classes}" type="button" style="--i:${node.n}" onclick="openNode(${s.id}, 'n${node.n}')" aria-label="Paso ${node.n}: ${node.title}, ${STATE_LABEL[state]}">
        <span class="wf-ico">${svg(state === 'done' ? 'tick' : STOP_ICON[state] || node.icon)}</span>
        <span class="wf-txt"><em>${node.n}</em><strong>${node.title}</strong><small>${node.who}</small></span>
        ${tag ? `<span class="wf-tag">${tag}</span>` : ''}
    </button>`;
}

function flowTurn(node, s) {
    const lit = nodeState(node, s) === 'done';
    const flowing = !s.stop && lit && nodeState(FLOW_NODES[node.n], s) !== 'done';
    return `<div class="wf-turn ${lit ? 'lit' : ''} ${flowing ? 'flowing' : ''}" aria-hidden="true"><i></i></div>`;
}

function flowBranch(key, branch, s, row) {
    const selected = s.outcome === key;
    const steps = branch.tasks.map(([taskId, title], index) => {
        const done = selected && Boolean(s.tasks[taskId]);
        const reached = selected && branch.tasks.slice(0, index).every(([previous]) => s.tasks[previous]);
        const state = done ? 'done' : reached ? s.stop || (s.late ? 'late' : 'current') : 'pending';
        return `<span class="wf-arr ${reached ? 'lit' : ''}"></span>
            <button class="wf-step is-${state} ${justDone === `b:${taskId}` ? 'just-done' : ''}" type="button" onclick="openNode(${s.id}, 'b:${key}:${taskId}')" aria-label="${taskId}: ${title}, ${STATE_LABEL[state]}">
                <span class="wf-ico">${svg(done ? 'tick' : STEP_ICON[taskId])}</span><strong>${title}</strong>
            </button>`;
    }).join('');
    const finished = selected && s.branchDone;
    return `<div class="wf-branch tone-${BRANCH_TONE[key]} ${selected ? 'selected' : ''} ${s.outcome && !selected ? 'dimmed' : ''}" style="--i:${17 + row}">
        <button class="wf-chip" type="button" aria-pressed="${selected}" ${s.canSelect ? '' : 'disabled title="Disponible al registrar el resultado"'} onclick="chooseOutcome(${s.id}, '${key}')">${sentence(branch.title)}</button>
        ${steps}
        <span class="wf-arr ${finished ? 'lit' : ''}"></span>
        <button class="wf-step fin is-${finished ? 'done' : 'pending'}" type="button" onclick="openNode(${s.id}, 'fin:${key}')">
            <span class="wf-ico">${svg(finished ? 'tick' : 'flag')}</span><strong>Fin</strong>
        </button>
    </div>`;
}

function renderFlowDiagram(item, entering) {
    const s = flowState(item);
    const node = (n, extra) => flowNode(FLOW_NODES[n - 1], s, extra);
    const completed = Math.min(s.completed, TASKS.length);
    const current = currentNode(s);
    const summary = s.branchDone ? 'Workflow completado'
        : s.stop ? `${STATE_LABEL[s.stop]} por legal en el paso ${current.n}: ${current.title}`
        : `Paso actual: ${current.title}`;
    const branchKeys = Object.keys(RESULT_BRANCHES);
    return `
        <header class="wf-head">
            <div>
                <h2 id="flowTitle">Diagrama del proceso</h2>
                <p><b>${item.title}</b> · ${completed} de ${TASKS.length} tareas · ${summary}</p>
            </div>
            <div class="wf-tools">
                <div class="wf-legend" aria-label="Leyenda">
                    <span style="--dot:#16a559"><i></i>Completada</span>
                    <span style="--dot:#f5a400"><i></i>En proceso</span>
                    <span style="--dot:#ef1d2d"><i></i>Atrasada</span>
                    <span style="--dot:#c9c9c8"><i></i>Pendiente</span>
                    <span style="--dot:#6a4be0"><i></i>Suspendido</span>
                    <span style="--dot:#494948"><i></i>Cancelado</span>
                    <span class="dashed"><i></i>En paralelo</span>
                </div>
                <div class="wf-zoom">
                    <button type="button" aria-label="Alejar" onclick="zoomFlow(-.1)">−</button>
                    <span id="wfZoomLabel">${Math.round(flowZoom * 100)}%</span>
                    <button type="button" aria-label="Acercar" onclick="zoomFlow(.1)">+</button>
                </div>
            </div>
        </header>
        <div class="flow-progress wf-progress ${s.stop ? 'stopped' : ''}" role="progressbar" aria-label="Progreso del flujo" aria-valuemin="0" aria-valuemax="${TASKS.length}" aria-valuenow="${completed}">
            <span style="width:${s.branchDone ? 100 : Math.round(completed / TASKS.length * 100)}%"></span>
        </div>
        <div class="wf-scroll">
            <div class="wf-map ${entering ? 'wf-enter' : ''} ${s.stop ? `stop-${s.stop}` : ''}" style="zoom:${flowZoom}">
                <div class="wf-row">${[1, 2, 3, 4, 5, 6, 7].map(n => node(n, n === 7 ? 'no-arrow' : '')).join('')}</div>
                ${flowTurn(FLOW_NODES[6], s)}
                <div class="wf-row">${[8, 9, 10, 11, 12, 13, 14].map(n => node(n, n === 14 ? 'no-arrow' : '')).join('')}</div>
                ${flowTurn(FLOW_NODES[13], s)}
                <div class="wf-row wf-row-final">
                    ${node(15)}
                    ${node(16, `fork ${s.outcome ? 'lit-out' : ''}`)}
                    <div class="wf-branches ${s.outcome ? 'has-sel' : ''}" style="--sel:${Math.max(0, branchKeys.indexOf(s.outcome))}">
                        ${branchKeys.map((key, row) => flowBranch(key, RESULT_BRANCHES[key], s, row)).join('')}
                    </div>
                    <aside class="wf-exceptions">
                        <h3>Estados excepcionales<small>Revisión legal, en cualquier paso</small></h3>
                        ${FLOW_EXCEPTIONS.map((x, index) => `<button class="wf-exc ${x.tone} ${x.key && item.status === x.key ? 'active' : ''}" type="button" style="--i:${20 + index}" onclick="openNode(${s.id}, 'x:${index}')">
                            <span class="wf-ico">${svg(x.icon)}</span><span><strong>${x.key && item.status === x.key ? x.active : x.title}</strong><small>${x.text}</small></span>
                        </button>`).join('')}
                    </aside>
                </div>
            </div>
        </div>
    `;
}

// Vuelve a dibujar el diagrama conservando el scroll; solo anima la entrada al abrirlo.
function mountFlowDiagram(item) {
    const previous = flowModal.classList.contains('open') && flowContent.querySelector('.wf-scroll');
    const scroll = previous ? [previous.scrollLeft, previous.scrollTop] : null;
    flowContent.innerHTML = renderFlowDiagram(item, !scroll);
    justDone = '';
    const area = flowContent.querySelector('.wf-scroll');
    if (scroll) [area.scrollLeft, area.scrollTop] = scroll;
    else {
        fitFlowDiagram(area);
        centerFlowNode(area);
    }
}

const flowIsVertical = () => matchMedia('(max-width:1000px)').matches;

// En pantallas donde el mapa horizontal no cabe (tablet horizontal) se abre ya ajustado al ancho.
function fitFlowDiagram(area) {
    if (flowIsVertical()) return;
    const map = area.querySelector('.wf-map');
    flowZoom = Math.min(1, Math.max(.6, Math.floor((area.clientWidth - 20) / 1180 * 20) / 20));
    map.style.zoom = flowZoom;
    flowContent.querySelector('#wfZoomLabel').textContent = `${Math.round(flowZoom * 100)}%`;
}

// Centra el paso actual sin usar scrollIntoView, que también movería la página de fondo.
function centerFlowNode(area) {
    const node = area.querySelector('.is-current, .is-late, .is-paused, .is-cancelled');
    if (!node) return;
    const a = area.getBoundingClientRect(), n = node.getBoundingClientRect();
    area.scrollLeft += n.left - a.left - (a.width - n.width) / 2;
    area.scrollTop += n.top - a.top - (a.height - n.height) / 2;
}

function zoomFlow(step) {
    flowZoom = Math.min(1.4, Math.max(.6, Math.round((flowZoom + step) * 10) / 10));
    const map = flowContent.querySelector('.wf-map');
    if (!map) return;
    map.style.zoom = flowZoom;
    flowContent.querySelector('#wfZoomLabel').textContent = `${Math.round(flowZoom * 100)}%`;
}

const nodeHint = (text, good = false) => `<p class="node-hint ${good ? 'good' : ''}">${text}</p>`;

function nodeSheet({ icon, eyebrow, title, state, label, context, desc, facts = [], actions = '', nav = '' }) {
    return `
        <header class="node-head st-${STATE_CLASS[state]}">
            <span class="wf-ico">${svg(icon)}</span>
            <div><p class="node-eyebrow">${eyebrow}</p><h3 id="nodeTitle">${title}</h3></div>
        </header>
        <div class="node-state"><span class="status ${STATE_CLASS[state]}">${(label || STATE_LABEL[state]).toUpperCase()}</span><span>${context}</span></div>
        ${desc ? `<p class="node-desc">${desc}</p>` : ''}
        <dl class="node-facts">${facts.filter(([, value]) => value).map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join('')}</dl>
        <div class="node-actions">${actions}</div>
        ${nav}
    `;
}

function outcomePicker(item, s) {
    const options = Object.entries(RESULT_BRANCHES).map(([key, branch]) => `<button class="node-outcome tone-${BRANCH_TONE[key]} ${s.outcome === key ? 'selected' : ''}" type="button" aria-pressed="${s.outcome === key}" onclick="chooseOutcome(${item.id}, '${key}')">
        <strong>${sentence(branch.title)}</strong><span>${branch.description}</span>
    </button>`).join('');
    const status = s.branchDone
        ? nodeHint('✓ Workflow completado', true)
        : s.outcome ? nodeHint(`Completa las tareas de la rama «${sentence(s.branch.title)}» en el diagrama.`) : '';
    return `${options}${status}`;
}

function pendingActions(item, s) {
    if (s.stop) return stoppedActions(item, s);
    const current = currentNode(s);
    return `${nodeHint(`Se habilita al completar «${current.title}».`)}
        <button class="node-secondary" type="button" onclick="openNode(${item.id}, 'n${current.n}')">Ir al paso actual</button>`;
}

function stoppedActions(item, s) {
    return s.stop === 'paused'
        ? `${nodeHint('Remate suspendido por legal. Reanúdalo para continuar.')}<button class="primary" type="button" onclick="closeNode();resumeWorkflow(${item.id})">Reanudar remate</button>`
        : nodeHint('Remate cancelado por legal. El workflow está cerrado.');
}

// En las revisiones legales (pasos 7 y 11) se ofrece suspender o cancelar desde el propio paso.
function legalActions(item, s) {
    if (s.stop || s.finished) return '';
    return `<div class="node-legal"><button class="node-secondary violet" type="button" onclick="openNode(${item.id}, 'x:0')">Suspender remate</button><button class="node-secondary danger" type="button" onclick="openNode(${item.id}, 'x:1')">Cancelar remate</button></div>`;
}

function mainNodeSheet(item, s, n) {
    const node = FLOW_NODES[n - 1];
    const state = nodeState(node, s);
    const auto = node.task === null;
    const active = state === 'current' || state === 'late';
    const kind = `${auto ? 'Automático' : node.type === 'system' ? 'Sistema' : 'Persona'}${node.parallel ? ' · en paralelo, no bloquea' : ''}`;
    const actions = n === 16
        ? s.canSelect ? outcomePicker(item, s) : pendingActions(item, s)
        : auto ? nodeHint('Paso automático del sistema, no requiere acción manual.')
        : state === 'done' ? nodeHint('✓ Paso completado', true)
        : s.stop ? stoppedActions(item, s)
        : active ? `<button class="primary" type="button" onclick="completeNode(${item.id}, ${n})">Marcar como completada</button>`
        : pendingActions(item, s);
    const link = (target, text) => `<button type="button" ${target ? `onclick="openNode(${item.id}, 'n${target.n}')"` : 'disabled'}>${target ? text(target) : ''}</button>`;
    return nodeSheet({
        icon: node.icon, title: node.title, state, context: item.title, desc: node.desc,
        eyebrow: `Paso ${n} de ${FLOW_NODES.length}`,
        facts: [['Responsable', node.who], ['Detalle', node.note], ['Tipo', kind], ['Asignado a', active ? item.person : ''], ['Plazo', active ? item.due : '']],
        actions: `${actions}${node.parallel ? legalActions(item, s) : ''}`,
        nav: `<footer class="node-nav">${link(FLOW_NODES[n - 2], x => `← ${x.n}. ${x.title}`)}${link(FLOW_NODES[n], x => `${x.n}. ${x.title} →`)}</footer>`
    });
}

function branchStepSheet(item, s, key, taskId) {
    const branch = RESULT_BRANCHES[key];
    const index = branch.tasks.findIndex(([id]) => id === taskId);
    const [, title, subtitle] = branch.tasks[index];
    const selected = s.outcome === key;
    const done = selected && Boolean(s.tasks[taskId]);
    const reached = selected && branch.tasks.slice(0, index).every(([previous]) => s.tasks[previous]);
    const state = done ? 'done' : reached ? s.stop || (s.late ? 'late' : 'current') : 'pending';
    const name = sentence(branch.title);
    const actions = s.stop ? stoppedActions(item, s) : selected
        ? `<button class="${done ? 'node-secondary' : 'primary'}" type="button" onclick="toggleNodeTask(${item.id}, '${key}', '${taskId}', ${!done})">${done ? 'Marcar como pendiente' : 'Marcar como completada'}</button>`
        : `${nodeHint(`Esta rama se activa al registrar el resultado «${name}».`)}${s.canSelect ? `<button class="node-secondary" type="button" onclick="chooseOutcome(${item.id}, '${key}')">Elegir «${name}»</button>` : ''}`;
    return nodeSheet({
        icon: STEP_ICON[taskId], title, state, context: item.title, actions,
        eyebrow: `Rama ${name} · ${taskId}`,
        facts: [['Resultado', `${name} · ${branch.description}`], ['Detalle', subtitle]]
    });
}

function finSheet(item, s, key) {
    const name = sentence(RESULT_BRANCHES[key].title);
    const finished = s.outcome === key && s.branchDone;
    return nodeSheet({
        icon: 'flag', title: 'Fin del workflow', state: finished ? 'done' : 'pending', context: item.title,
        eyebrow: `Rama ${name}`,
        actions: finished ? nodeHint('✓ Workflow completado', true) : nodeHint(`Se alcanza al completar todas las tareas de la rama «${name}».`)
    });
}

function exceptionSheet(item, s, index) {
    const x = FLOW_EXCEPTIONS[index];
    if (x.key) return legalStopSheet(item, s, x);
    return nodeSheet({
        icon: x.icon, title: x.title, state: 'pending', label: 'Informativo', context: item.title, desc: x.text,
        eyebrow: 'Estado excepcional',
        actions: nodeHint('Estado informativo: todavía no tiene una rama implementada en la maqueta.')
    });
}

// Confirmación de suspender o cancelar; también muestra el estado cuando ya se aplicó.
function legalStopSheet(item, s, x) {
    const current = currentNode(s);
    const suspend = x.key === 'SUSPENDIDO';
    const applied = item.status === x.key;
    const where = `Paso ${current.n}. ${current.title}`;
    const base = { icon: x.icon, context: item.title, eyebrow: 'Revisión legal · estado excepcional' };
    if (applied) return nodeSheet({
        ...base, title: x.active, state: s.stop,
        desc: suspend ? 'El equipo legal suspendió este remate. El workflow queda detenido hasta reanudarlo.' : 'El equipo legal canceló este remate. El workflow está cerrado.',
        facts: [['Detenido en', where], ['Responsable', 'Equipo legal']],
        actions: suspend
            ? `<button class="primary" type="button" onclick="closeNode();resumeWorkflow(${item.id})">Reanudar remate</button><button class="node-secondary danger" type="button" onclick="openNode(${item.id}, 'x:1')">Cancelar remate</button>`
            : nodeHint('Un remate cancelado no se puede reanudar.')
    });
    const blocked = s.finished ? 'El workflow ya terminó.' : s.stop === 'cancelled' ? 'El remate ya fue cancelado por legal.' : '';
    return nodeSheet({
        ...base, title: x.title, state: 'pending', label: 'Disponible en cualquier paso',
        desc: suspend
            ? 'El equipo legal puede suspender el remate en cualquier paso. El workflow queda detenido hasta reanudarlo.'
            : 'El equipo legal puede cancelar el remate en cualquier paso. Cierra el workflow y no se puede reanudar.',
        facts: [['Se detiene en', blocked ? '' : where], ['Responsable', 'Equipo legal']],
        actions: blocked ? nodeHint(blocked)
            : `<button class="${suspend ? 'primary violet' : 'primary danger'}" type="button" onclick="closeNode();stopWorkflow(${item.id}, '${x.key}')">${x.title}</button>`
    });
}

function openNode(id, key) {
    const item = data.find(x => x.id === Number(id));
    if (!item) return;
    const s = flowState(item);
    const [kind, a, b] = key.split(':');
    nodeContent.innerHTML = kind === 'b' ? branchStepSheet(item, s, a, b)
        : kind === 'fin' ? finSheet(item, s, a)
        : kind === 'x' ? exceptionSheet(item, s, Number(a))
        : mainNodeSheet(item, s, Number(key.slice(1)));
    nodeModal.classList.add('open');
    nodeModal.setAttribute('aria-hidden', 'false');
    nodeClose.focus();
}

function closeNode() {
    nodeModal.classList.remove('open');
    nodeModal.setAttribute('aria-hidden', 'true');
}

function completeNode(id, n) {
    justDone = `n${n}`;
    closeNode();
    completeStage(id);
}

// Registrar el resultado equivale a completar la tarea 15 y abrir su rama.
function chooseOutcome(id, key) {
    const item = data.find(x => x.id === Number(id));
    if (!item) return;
    closeNode();
    if (getFlowStage(item) === 15) completeStage(id);
    selectWorkflowOutcome(id, key);
}

function toggleNodeTask(id, key, taskId, checked) {
    if (checked) justDone = `b:${taskId}`;
    closeNode();
    toggleResultTask(id, key, taskId, checked);
}

nodeClose.onclick = closeNode;
nodeModal.onclick = event => { if (event.target === nodeModal) closeNode(); };
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nodeModal.classList.contains('open')) {
        event.stopPropagation();
        closeNode();
    }
}, true);
