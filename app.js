const TASKS = [
    'Crear workflow',
    'Asignar gestor y postor',
    'Generar carta Vale Vista',
    'Enviar carta al GG',
    'Enviar carta al banco',
    'Generar formulario',
    'Revisión legal pre-entrega',
    'Retirar Vale Vista',
    'Entregar Vale Vista + formulario',
    'Registrar evidencia',
    'Revisión legal final',
    'Preparar participación',
    'Ingresar a sala virtual',
    'Participar en remate',
    'Registrar resultado'
];
const RESULT_BRANCHES = {
    ADJUDICADO: {
        title: 'ADJUDICADO',
        description: 'Ganamos el remate',
        tasks: [
            ['17A', 'Gestionar pago', 'Mecanismo por definir'],
            ['18A', 'Marcar adjudicada', 'Usuario autorizado'],
            ['19A', 'Crear proyecto', 'Sistema o usuario']
        ]
    },
    NO_ADJUDICADO: {
        title: 'NO ADJUDICADO',
        description: 'Participamos, no ganamos',
        tasks: [
            ['17B', 'Recuperar garantía', 'Gestor, por confirmar'],
            ['18B', 'Registrar garantía', 'Monto, banco, N° VV']
        ]
    },
    REPROGRAMADO: {
        title: 'REPROGRAMADO',
        description: 'Nueva fecha de remate',
        tasks: [
            ['17C', 'Actualizar fecha', 'Queda en historial'],
            ['17D', 'Recalcular plazos', 'Vencimientos y alertas'],
            ['17E', 'Continuar workflow', 'Vuelve a la etapa vigente']
        ]
    }
};
const data = window.RematesData.items.map(x => ({ ...x, avatar: x.avatarUrl }));
let active = 0, week = window.RematesData.getWeek(), statusFilter = '', activeFlowView = 'list';
const STATUS_CLASS = { ATRASADO: 'late', ALERTA: 'alert', SUSPENDIDO: 'paused', CANCELADO: 'cancelled' };
const sc = s => STATUS_CLASS[s] || 'good';
const isStopped = item => item.status === 'SUSPENDIDO' || item.status === 'CANCELADO';
const isFinished = item => {
    const branch = RESULT_BRANCHES[item.resultOutcome];
    return Boolean(branch) && branch.tasks.every(([key]) => (item.resultTasks || {})[key]);
};
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const getFlowStage = item => Math.min(TASKS.length + 1, Math.max(1, Number(item.flowStage) || 1));
const completedCount = item => getFlowStage(item) - 1;
// Filtros del tablero: semana visible, tarjeta de estado activa y texto buscado; se combinan entre sí.
const STATUS_FILTERS = {
    ALERTA: x => x.status === 'ALERTA',
    ATRASADO: x => x.status === 'ATRASADO',
    BIEN: x => x.status === 'BIEN',
    DETENIDO: isStopped
};
const weekRange = window.RematesData.weekRange;
const updateMetrics = items => {
    document.querySelector('#metricTotal').textContent = items.length;
    document.querySelector('#metricAlert').textContent = items.filter(STATUS_FILTERS.ALERTA).length;
    document.querySelector('#metricLate').textContent = items.filter(STATUS_FILTERS.ATRASADO).length;
    document.querySelector('#metricGood').textContent = items.filter(STATUS_FILTERS.BIEN).length;
    document.querySelector('#metricStopped').textContent = items.filter(STATUS_FILTERS.DETENIDO).length;
    document.querySelector('.metrics').classList.toggle('filtered', Boolean(statusFilter));
    document.querySelectorAll('[data-filter]').forEach(b => {
        const on = Boolean(statusFilter) && b.dataset.filter === statusFilter;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on);
    });
};
function emptyList(q, weekTotal) {
    const text = q ? `No encontramos remates para “${esc(q)}”${statusFilter ? ' con ese estado' : ''} en esta semana.`
        : weekTotal ? 'No hay remates con ese estado en esta semana.'
        : 'No hay remates programados para esta semana.';
    return `<div class="empty">${text}${q || statusFilter ? '<br><button class="week-pick" type="button" onclick="clearFilters()">Quitar filtros</button>' : ''}</div>`;
}
function clearFilters() {
    statusFilter = '';
    search.value = '';
    render();
}
function render(q = '') {
    q = q.trim().toLowerCase();
    const range = weekRange(week);
    const weekItems = data.filter(x => x.iso >= range.from && x.iso <= range.to);
    const items = weekItems.filter(STATUS_FILTERS[statusFilter] || (() => true)).filter(x => [x.title, x.place, x.date, x.time, x.stage, x.person, x.status].join(' ').toLowerCase().includes(q));
    const urgent = weekItems.filter(x => x.status === 'ATRASADO' || x.status === 'ALERTA').sort((a, b) => (a.status === 'ATRASADO' ? 0 : 1) - (b.status === 'ATRASADO' ? 0 : 1));
    list.innerHTML = items.length
        ? items.map(x => `<div class="row ${x.id === active ? 'selected' : ''}" data-id="${x.id}"><div class="property"><img src="${x.img}"><div class="property-info" data-meta="${x.place} · ${x.date} · ${x.time}"><div class="property-head"><span>${x.title}</span><span class="status ${sc(x.status)}">${x.status}</span></div><div class="mobile-extra"><small>${x.stage}<br>${x.person}</small><small class="due">${x.due}</small></div></div></div><div>${x.place}</div><div>${x.date}<br>${x.time}</div><div>${x.stage}</div><div class="person"><img class="mini" src="${x.avatar}">${x.person}</div><div><span class="status ${sc(x.status)}">${x.status}</span></div><div class="chev">›</div></div>`).join('')
        : emptyList(q, weekItems.length);
    document.querySelectorAll('.row').forEach(e => e.onclick = () => select(+e.dataset.id));
    attention.innerHTML = urgent.map(x => `<div class="attention" data-id="${x.id}"><div class="property"><img src="${x.img}"><div>${x.title}<small>${x.place}</small></div></div><span class="status ${sc(x.status)}">${x.status}</span><div class="deadline"><svg class="icon"><use href="#calendar"/></svg><div><strong>${x.due}</strong><span>${x.stage}</span></div></div><b>›</b></div>`).join('') || '<div class="empty">Ningún remate requiere atención.</div>';
    attention.querySelectorAll('[data-id]').forEach(e => e.onclick = () => select(+e.dataset.id));
    weekLabel.textContent = range.label;
    showAll.querySelector('span').textContent = range.label;
    listCount.textContent = items.length === weekItems.length ? items.length : `${items.length} de ${weekItems.length}`;
    updateMetrics(weekItems);
}
function renderTaskList(item, compact = false) {
    const stage = getFlowStage(item);
    const completed = stage - 1;
    const start = compact
        ? stage === TASKS.length + 1 ? Math.max(0, TASKS.length - 3) : Math.max(0, stage - 3)
        : 0;
    const end = compact ? Math.min(TASKS.length, stage === TASKS.length + 1 ? stage - 1 : stage + 2) : TASKS.length;
    return TASKS.slice(start, end).map((task, offset) => {
        const number = start + offset + 1;
        const state = number <= completed ? 'done' : number === stage ? 'current' : 'pending';
        const icon = state === 'done' ? '✓' : state === 'current' ? '!' : number;
        const label = state === 'done' ? 'Completada' : state !== 'current' ? 'Pendiente' : item.status === 'SUSPENDIDO' ? 'Suspendida' : item.status === 'CANCELADO' ? 'Cancelada' : 'En proceso';
        return `<li class="flow-task ${state}"><span class="flow-marker">${icon}</span><span class="flow-task-name">${task}</span><span class="flow-task-state">${label}</span></li>`;
    }).join('');
}

function show(x) {
    const stage = getFlowStage(x);
    const completed = stage - 1;
    const currentTask = TASKS[stage - 1];
    const dateYear = x.iso.slice(0, 4);
    const isFlowComplete = completed === TASKS.length && x.status === 'BIEN';
    const urgentTitle = isFlowComplete ? 'Remate completado' : isStopped(x) ? `Remate ${x.status.toLowerCase()}` : x.stage;
    const urgentText = isFlowComplete ? 'Proceso completado' : x.due;

    detail.innerHTML = `
        <div class="hero">
            <img src="${x.img}" alt="${x.title}">
            <span class="status ${sc(x.status)}">${x.status}</span>
        </div>
        <div class="detail-body">
            <h1>${x.title}</h1>
            <p class="location">${x.place}</p>
            <div class="date-line">
                <span>▣ ${x.date} ${dateYear}</span>
                <span>◷ ${x.time} <small>(virtual)</small></span>
            </div>
            <section class="process-summary" aria-label="Progreso del proceso">
                <div class="process-summary-head">
                    <h2>Progreso del proceso</h2>
                    <strong>${completed} / ${TASKS.length} tareas</strong>
                </div>
                <ol class="process-preview">${renderTaskList(x, true)}</ol>
                <label class="stage-check">
                    <input type="checkbox" ${stage > TASKS.length ? 'checked disabled' : isStopped(x) ? 'disabled' : ''} onchange="completeStage(${x.id})">
                    <span>${currentTask ? `Marcar <strong>${currentTask}</strong> como completada` : 'Proceso completado'}</span>
                </label>
                <div class="flow-open-actions">
                    <button class="flow-open-button" type="button" onclick="openFlow(${x.id}, 'diagram')">Ver flujo completo →</button>
                    <button class="flow-diagram-button" type="button" aria-label="Ver lista de tareas" title="Ver lista de tareas" onclick="openFlow(${x.id})">↗</button>
                </div>
            </section>
            <div class="urgent ${sc(x.status)}">
                <svg class="icon"><use href="${isFlowComplete ? '#check' : '#alert'}"/></svg>
                <div><b>${urgentTitle}</b><small>${urgentText}</small></div>
                <b style="margin-left:auto">›</b>
            </div>
            <div class="info-list">
                <div class="info">
                    <svg class="icon"><use href="#users"/></svg>
                    <div><small>Responsable actual</small><b>${x.person}</b></div>
                    <button class="circle">☎</button>
                </div>
                <div class="info">
                    <svg class="icon"><use href="#file"/></svg>
                    <div><small>Próxima acción</small><b>${x.stage}</b></div>
                </div>
                <div class="info">
                    <svg class="icon"><use href="#calendar"/></svg>
                    <div><small>Fecha límite</small><b style="color:var(--red)">${x.due}</b></div>
                </div>
                <div class="info">
                    <svg class="icon"><use href="#clock"/></svg>
                    <b>Ver historial</b><span>›</span>
                </div>
            </div>
        </div>
    `;
    if (flowModal.classList.contains('open') && Number(flowModal.dataset.itemId) === x.id) renderFlow(x);
}

function renderFlow(item) {
    flowDialog.classList.toggle('diagram-mode', activeFlowView === 'diagram');
    if (activeFlowView === 'diagram') {
        mountFlowDiagram(item);
        return;
    }
    const completed = completedCount(item);
    const percentage = Math.round(completed / TASKS.length * 100);
    const stage = getFlowStage(item);
    const stateLabel = item.status;
    flowContent.innerHTML = `
        <header class="flow-heading">
            <p class="flow-eyebrow">FLUJO DEL REMATE</p>
            <h2 id="flowTitle">${item.title}</h2>
            <p class="flow-location">${item.place} <span>·</span> ${item.date} ${item.iso.slice(0, 4)} <span>·</span> ${item.time}</p>
            <div class="flow-state-line"><span class="status ${sc(item.status)}">${stateLabel}</span><span>${completed} de ${TASKS.length} tareas completadas</span></div>
            <div class="flow-progress" role="progressbar" aria-label="Progreso del flujo" aria-valuemin="0" aria-valuemax="${TASKS.length}" aria-valuenow="${completed}">
                <span style="width:${percentage}%"></span>
            </div>
        </header>
        <ol class="flow-list">${renderTaskList(item)}</ol>
        ${flowStopNotice(item)}${isStopped(item) ? '' : stage <= TASKS.length ? `<label class="flow-check"><input type="checkbox" onchange="completeStage(${item.id})"><span>Marcar <strong>${TASKS[stage - 1]}</strong> como completada</span></label>` : '<p class="flow-complete">✓ Las 15 tareas están completadas.</p>'}
        ${flowLegalActions(item)}
    `;
}

function flowStopNotice(item) {
    if (!isStopped(item)) return '';
    const task = TASKS[getFlowStage(item) - 1] || 'Registrar resultado';
    const text = item.status === 'SUSPENDIDO'
        ? `Remate suspendido por legal en «${task}». Reanúdalo para continuar.`
        : `Remate cancelado por legal en «${task}». El workflow está cerrado.`;
    return `<p class="flow-stopped ${sc(item.status)}">${text}</p>`;
}

// Legal puede suspender o cancelar en cualquier paso; los botones abren la confirmación de workflow.js.
function flowLegalActions(item) {
    if (isFinished(item) || item.status === 'CANCELADO') return '';
    const suspended = item.status === 'SUSPENDIDO';
    return `<div class="flow-legal"><span>Revisión legal</span><button type="button" onclick="openNode(${item.id}, 'x:0')">${suspended ? 'Reanudar remate' : 'Suspender remate'}</button><button class="danger" type="button" onclick="openNode(${item.id}, 'x:1')">Cancelar remate</button></div>`;
}

function openFlow(id, view = 'list') {
    const item = data.find(x => x.id === id);
    if (!item) return;
    activeFlowView = view;
    flowModal.dataset.itemId = String(id);
    flowViewToggle.textContent = activeFlowView === 'list' ? '↗' : '←';
    flowViewToggle.setAttribute('aria-label', activeFlowView === 'list' ? 'Ver diagrama del proceso' : 'Volver a la lista de tareas');
    flowViewToggle.title = activeFlowView === 'list' ? 'Ver diagrama del proceso' : 'Volver a la lista de tareas';
    renderFlow(item);
    flowModal.classList.add('open');
    flowModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('flow-open');
    flowClose.focus();
}

function closeFlow() {
    flowModal.classList.remove('open');
    flowModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('flow-open');
}
function openDetail(id) { const item = data.find(x => x.id === id); if (!item) return; active = id; render(search.value); show(item); detailPanel.classList.add('open'); detailBackdrop.classList.add('open'); detailPanel.setAttribute('aria-hidden', 'false'); document.body.classList.add('detail-open') }
function completeStage(id) {
    const item = data.find(x => x.id === Number(id));
    if (!item) return;

    const current = getFlowStage(item);
    if (current > TASKS.length || isStopped(item)) return;

    const next = current + 1;
    const completed = next - 1;
    const reachedResult = next > TASKS.length;
    const status = item.status === 'ATRASADO' ? 'ATRASADO' : 'ALERTA';
    const changed = window.RematesData.update(id, {
        flowStage: next,
        status,
        stage: reachedResult ? 'Registrar resultado' : TASKS[next - 1],
        due: reachedResult ? 'Pendiente de completar resultado' : item.due,
        progress: reachedResult ? 94 : Math.round(completed / TASKS.length * 100)
    });

    Object.assign(item, changed, { avatar: changed.avatarUrl });
    render(search.value);
    show(item);
    note(reachedResult ? 'Selecciona un resultado y completa su rama' : `Tarea "${TASKS[current - 1]}" completada`);
}

function updateWorkflowItem(item, changes, message) {
    const changed = window.RematesData.update(item.id, changes);
    if (!changed) return;
    Object.assign(item, changed, { avatar: changed.avatarUrl });
    render(search.value);
    show(item);
    if (message) note(message);
}

// Suspender se puede revertir con resumeWorkflow; cancelar cierra el workflow.
function stopWorkflow(id, kind) {
    const item = data.find(x => x.id === Number(id));
    if (!item || item.status === 'CANCELADO' || item.status === kind || isFinished(item)) return;
    const suspended = kind === 'SUSPENDIDO';
    updateWorkflowItem(item, {
        status: kind,
        stopPrior: item.stopPrior || { status: item.status, due: item.due },
        due: suspended ? 'Suspendido por revisión legal' : 'Cancelado por revisión legal'
    }, suspended ? 'Remate suspendido por legal' : 'Remate cancelado por legal');
}

function resumeWorkflow(id) {
    const item = data.find(x => x.id === Number(id));
    if (!item || item.status !== 'SUSPENDIDO') return;
    const prior = item.stopPrior || { status: 'ALERTA', due: 'Plazo por recalcular' };
    updateWorkflowItem(item, { ...prior, stopPrior: null }, 'Remate reanudado');
}

function selectWorkflowOutcome(id, outcome) {
    const item = data.find(x => x.id === Number(id));
    if (!item || !RESULT_BRANCHES[outcome] || getFlowStage(item) < 15 || isStopped(item)) return;
    if (item.resultOutcome === outcome) return;

    const priorStatus = item.resultPriorStatus || (item.status === 'ATRASADO' ? 'ATRASADO' : 'ALERTA');
    const branch = RESULT_BRANCHES[outcome];
    const resultTasks = item.resultTasks || {};
    const completed = branch.tasks.filter(([taskId]) => resultTasks[taskId]).length;
    const branchComplete = completed === branch.tasks.length;
    updateWorkflowItem(item, {
        resultOutcome: outcome,
        resultPriorStatus: priorStatus,
        status: branchComplete ? 'BIEN' : priorStatus,
        stage: branchComplete ? 'Workflow completado' : 'Registrar resultado',
        due: branchComplete ? 'Workflow completado' : 'Pendiente de completar resultado',
        progress: branchComplete ? 100 : 94 + Math.floor(completed / branch.tasks.length * 5)
    }, `Resultado seleccionado: ${RESULT_BRANCHES[outcome].title}`);
}

function toggleResultTask(id, outcome, taskId, checked) {
    const item = data.find(x => x.id === Number(id));
    const branch = RESULT_BRANCHES[outcome];
    if (!item || !branch || item.resultOutcome !== outcome || getFlowStage(item) < 15 || isStopped(item)) return;
    if (!branch.tasks.some(([id]) => id === taskId)) return;

    const resultTasks = { ...(item.resultTasks || {}), [taskId]: Boolean(checked) };
    const completed = branch.tasks.filter(([id]) => resultTasks[id]).length;
    const branchComplete = completed === branch.tasks.length;
    const progress = branchComplete ? 100 : 94 + Math.floor(completed / branch.tasks.length * 5);
    const status = branchComplete
        ? 'BIEN'
        : item.status === 'ATRASADO' || item.resultPriorStatus === 'ATRASADO' ? 'ATRASADO' : 'ALERTA';

    updateWorkflowItem(item, {
        resultTasks,
        status,
        stage: branchComplete ? 'Workflow completado' : 'Registrar resultado',
        due: branchComplete ? 'Workflow completado' : 'Pendiente de completar resultado',
        progress
    }, branchComplete ? 'Workflow completado' : '');
}

function closeDetail() { detailPanel.classList.remove('open'); detailBackdrop.classList.remove('open'); detailPanel.setAttribute('aria-hidden', 'true'); document.body.classList.remove('detail-open') }
function select(id) { openDetail(id) } function note(s) { toast.textContent = s; toast.classList.add('show'); clearTimeout(window.t); window.t = setTimeout(() => toast.classList.remove('show'), 2200) } search.oninput = e => render(e.target.value); 
document.querySelectorAll('[data-week]').forEach(b => b.onclick = () => { week = window.RematesData.setWeek(week + +b.dataset.week); render(search.value); });
document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { statusFilter = statusFilter === b.dataset.filter ? '' : b.dataset.filter; render(search.value); });
showAll.onclick = () => { clearFilters(); note('Mostrando todos los remates de la semana'); };
const detailPanel = document.querySelector('.detail');
const flowModal = document.querySelector('#flowModal');
const flowDialog = document.querySelector('.flow-dialog');
const flowContent = document.querySelector('#flowContent');
const flowClose = document.querySelector('#flowClose');
const flowViewToggle = document.querySelector('#flowViewToggle');
detailPanel.id = 'detailPanel';
detailPanel.setAttribute('aria-hidden', 'true');
detailPanel.insertAdjacentHTML('afterbegin', '<button class="detail-close" aria-label="Cerrar detalle">×</button>');
const detailBackdrop = document.createElement('div');
detailBackdrop.id = 'detailBackdrop';
detailBackdrop.className = 'detail-backdrop';
document.body.appendChild(detailBackdrop);
detailPanel.querySelector('.detail-close').onclick = closeDetail;
detailBackdrop.onclick = closeDetail;
flowClose.onclick = closeFlow;
flowViewToggle.onclick = () => {
    const item = data.find(x => x.id === Number(flowModal.dataset.itemId));
    if (!item) return;
    activeFlowView = activeFlowView === 'list' ? 'diagram' : 'list';
    flowViewToggle.textContent = activeFlowView === 'list' ? '↗' : '←';
    flowViewToggle.setAttribute('aria-label', activeFlowView === 'list' ? 'Ver diagrama del proceso' : 'Volver a la lista de tareas');
    flowViewToggle.title = activeFlowView === 'list' ? 'Ver diagrama del proceso' : 'Volver a la lista de tareas';
    renderFlow(item);
};
flowModal.onclick = event => { if (event.target === flowModal) closeFlow(); };
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        if (flowModal.classList.contains('open')) closeFlow();
        else closeDetail();
    }
});
render();
// Permite enlazar directo al detalle de un remate: hello.html?id=3
const linkedId = Number(new URLSearchParams(location.search).get('id'));
if (linkedId) openDetail(linkedId);
