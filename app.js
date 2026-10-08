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
let active = 0, week = 0, activeFlowView = 'list';
const sc = s => s === 'ATRASADO' ? 'late' : s === 'ALERTA' ? 'alert' : 'good';
const getFlowStage = item => Math.min(TASKS.length + 1, Math.max(1, Number(item.flowStage) || 1));
const completedCount = item => getFlowStage(item) - 1;
const updateMetrics = () => {
    document.querySelector('#metricTotal').textContent = data.length;
    document.querySelector('#metricAlert').textContent = data.filter(x => x.status === 'ALERTA').length;
    document.querySelector('#metricLate').textContent = data.filter(x => x.status === 'ATRASADO').length;
    document.querySelector('#metricGood').textContent = data.filter(x => x.status === 'BIEN').length;
};
function render(q = '') {
    q = q.toLowerCase();
    const items = data.filter(x => Object.values(x).join(' ').toLowerCase().includes(q));
    list.innerHTML = items.length
        ? items.map(x => `<div class="row ${x.id === active ? 'selected' : ''}" data-id="${x.id}"><div class="property"><img src="${x.img}"><div class="property-info" data-meta="${x.place} · ${x.date} · ${x.time}">${x.title}<div class="mobile-extra"><small>${x.stage}<br>${x.person}</small><small class="due">${x.due}</small></div></div></div><div>${x.place}</div><div>${x.date}<br>${x.time}</div><div>${x.stage}</div><div class="person"><img class="mini" src="${x.avatar}">${x.person}</div><div><span class="status ${sc(x.status)}">${x.status}</span></div><div class="chev">›</div></div>`).join('')
        : `<div class="empty">No encontramos remates para “${q}”.</div>`;
    document.querySelectorAll('.row').forEach(e => e.onclick = () => select(+e.dataset.id));
    attention.innerHTML = data.slice(0, 2).map(x => `<div class="attention"><div class="property"><img src="${x.img}"><div>${x.title}<small>${x.place}</small></div></div><span class="status ${sc(x.status)}">${x.status}</span><div class="deadline"><svg class="icon"><use href="#calendar"/></svg><div><strong>${x.due}</strong><span>${x.stage}</span></div></div><b>›</b></div>`).join('');
    updateMetrics();
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
        const label = state === 'done' ? 'Completada' : state === 'current' ? 'En proceso' : 'Pendiente';
        return `<li class="flow-task ${state}"><span class="flow-marker">${icon}</span><span class="flow-task-name">${task}</span><span class="flow-task-state">${label}</span></li>`;
    }).join('');
}

function show(x) {
    const stage = getFlowStage(x);
    const completed = stage - 1;
    const currentTask = TASKS[stage - 1];
    const dateYear = x.iso.slice(0, 4);
    const isFlowComplete = completed === TASKS.length && x.status === 'BIEN';
    const urgentTitle = isFlowComplete ? 'Remate completado' : x.stage;
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
                    <input type="checkbox" ${stage > TASKS.length ? 'checked disabled' : ''} onchange="completeStage(${x.id})">
                    <span>${currentTask ? `Marcar <strong>${currentTask}</strong> como completada` : 'Proceso completado'}</span>
                </label>
                <div class="flow-open-actions">
                    <button class="flow-open-button" type="button" onclick="openFlow(${x.id})">Ver flujo completo →</button>
                    <button class="flow-diagram-button" type="button" aria-label="Ver diagrama del proceso" title="Ver diagrama del proceso" onclick="openFlow(${x.id}, 'diagram')">↗</button>
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
        flowContent.innerHTML = renderFlowDiagram(item);
        return;
    }
    const completed = completedCount(item);
    const percentage = Math.round(completed / TASKS.length * 100);
    const stage = getFlowStage(item);
    const stateLabel = item.status === 'ATRASADO' ? 'ATRASADO' : item.status === 'BIEN' ? 'BIEN' : 'ALERTA';
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
        ${stage <= TASKS.length ? `<label class="flow-check"><input type="checkbox" onchange="completeStage(${item.id})"><span>Marcar <strong>${TASKS[stage - 1]}</strong> como completada</span></label>` : '<p class="flow-complete">✓ Las 15 tareas están completadas.</p>'}
    `;
}

function renderFlowDiagram(item) {
    const completed = completedCount(item);
    const currentStage = getFlowStage(item);
    const selectedOutcome = item.resultOutcome || '';
    const outcomeTasks = item.resultTasks || {};
    const activeBranch = RESULT_BRANCHES[selectedOutcome];
    const completedBranchTasks = activeBranch
        ? activeBranch.tasks.filter(([key]) => outcomeTasks[key]).length
        : 0;
    const branchComplete = Boolean(activeBranch) && completedBranchTasks === activeBranch.tasks.length;
    const diagramTasks = [
        ['Propiedad aceptada', 'Sistema, crea workflow', 'system', 1],
        ['Asignar gestor y postor', 'Asignador por definir', 'person', 2],
        ['Generar carta vale vista', 'Asignador o sistema', 'person', 3],
        ['Enviar carta al GG', 'Sistema, email con adjunto', 'system', 4],
        ['GG envía carta al banco', 'Gerente general, su buzón', 'person', 5],
        ['Generar formulario', 'Gestor', 'person', 6],
        ['Legal pre-entrega', 'Hasta 1 h antes del paso 9', 'person', 7],
        ['Retirar vale vista', 'Gestor, en el banco', 'person', 8],
        ['Entregar VV y formulario', 'Gestor, en el juzgado', 'person', 9],
        ['Registrar evidencia', 'Gestor, fotos timbradas', 'person', 10],
        ['Legal final', 'Hasta 1 h antes del remate', 'person', 11],
        ['Preparar participación', 'Postor, link y monto', 'person', 12],
        ['Alertas pre-remate', 'Sistema, de 24 h a 15 min', 'system', null],
        ['Ingresar a sala virtual', 'Postor, máx. 15 min antes', 'person', 13],
        ['Participar en remate', 'Postor', 'person', 14],
        ['Registrar resultado', 'Postor o usuario autorizado', 'person', 15]
    ];
    const node = (number, title, subtitle, type, checkNumber = number) => {
        const isAutomatic = checkNumber === null;
        const isResultTask = number === 16;
        const done = isResultTask
            ? branchComplete
            : isAutomatic ? completed >= 12 : completed >= checkNumber;
        const isCurrent = isResultTask
            ? currentStage >= 15 && !branchComplete
            : !isAutomatic && currentStage === checkNumber;
        const isLate = isCurrent && item.status === 'ATRASADO';
        const stateClass = done ? 'is-done' : isLate ? 'is-late' : isCurrent ? 'is-current' : 'is-pending';
        const marker = done ? '✓' : isCurrent ? '!' : number;
        const stateText = done ? isResultTask ? 'Workflow completado' : 'Completada' : isLate ? 'Atrasada' : isCurrent ? 'En proceso' : isAutomatic ? 'Automática' : 'Pendiente';
        return `<article class="workflow-node ${type} ${stateClass}">
            <span class="workflow-node-marker">${marker}</span>
            <span class="workflow-node-content"><strong><span class="workflow-node-number">${number}.</span> ${title}</strong><small>${subtitle}</small></span>
            <span class="workflow-node-state">${stateText}</span>
        </article>`;
    };
    const downArrow = '<div class="workflow-down-arrow" aria-hidden="true"><span></span></div>';
    const rightArrow = '<span class="workflow-right-arrow" aria-hidden="true">→</span>';
    const regularNode = number => {
        const [title, subtitle, type, checkNumber] = diagramTasks[number - 1];
        const resultSubtitle = number === 16 && selectedOutcome
            ? `Resultado: ${activeBranch.title}`
            : subtitle;
        return node(number, title, resultSubtitle, type, checkNumber);
    };
    const resultBranch = (key, branch) => {
        const isSelected = selectedOutcome === key;
        const canSelect = currentStage >= 15;
        const tasks = isSelected
            ? `<div class="workflow-result-tasks">${branch.tasks.map(([taskId, title, subtitle], index) => {
                const isDone = Boolean(outcomeTasks[taskId]);
                const isCurrent = !isDone && branch.tasks.slice(0, index).every(([previousId]) => outcomeTasks[previousId]);
                const marker = isDone ? '✓' : isCurrent ? '!' : '○';
                const taskState = isDone ? 'done' : isCurrent ? item.status === 'ATRASADO' ? 'late' : 'current' : 'pending';
                return `<label class="workflow-result-task ${taskState}">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleResultTask(${item.id}, '${key}', '${taskId}', this.checked)">
                    <span class="workflow-result-task-marker">${marker}</span>
                    <span class="workflow-result-task-copy"><strong>${taskId}. ${title}</strong><small>${subtitle}</small></span>
                </label>${index < branch.tasks.length - 1 ? rightArrow : ''}`;
            }).join('')}${branchComplete ? '<p class="workflow-branch-finished">✓ Fin del workflow</p>' : ''}</div>`
            : '';
        return `<section class="workflow-branch ${isSelected ? 'selected' : ''} ${canSelect ? '' : 'locked'}">
            <button class="workflow-branch-select" type="button" aria-pressed="${isSelected}" ${canSelect ? '' : 'disabled'} onclick="selectWorkflowOutcome(${item.id}, '${key}')">
                <strong>${branch.title}</strong><span>${branch.description}</span>
            </button>
            ${tasks}
        </section>`;
    };
    return `
        <header class="diagram-heading">
            <h2 id="flowTitle">Diagrama del proceso</h2>
            <p class="diagram-subtitle">Flujo completo desde la aceptación de la propiedad hasta el resultado del remate.</p>
        </header>
        <div class="diagram-scroll">
            <div class="workflow-map">
                <div class="workflow-flow-row workflow-row-one">
                    ${[1, 2, 3, 4, 5, 6].map((number, index) => `${regularNode(number)}${index < 5 ? rightArrow : ''}`).join('')}
                    ${rightArrow}
                    <div class="workflow-parallel-mini">
                        <span>Revisión legal en paralelo</span>
                        ${regularNode(7)}
                    </div>
                </div>
                ${downArrow}
                <div class="workflow-flow-row workflow-row-two">
                    ${[8, 9, 10].map(number => `${regularNode(number)}${rightArrow}`).join('')}
                    <div class="workflow-parallel-mini">
                        <span>Revisión legal en paralelo</span>
                        <div>${regularNode(11)}${rightArrow}${regularNode(12)}</div>
                    </div>
                    ${rightArrow}
                    ${[13, 14, 15].map((number, index) => `${regularNode(number)}${index < 2 ? rightArrow : ''}`).join('')}
                </div>
                ${downArrow}
                <div class="workflow-flow-row workflow-row-three">${regularNode(16)}</div>
                ${downArrow}
                <section class="workflow-results">
                    ${Object.entries(RESULT_BRANCHES).map(([key, branch]) => resultBranch(key, branch)).join('')}
                </section>
                <section class="workflow-exceptions">
                    <h3>Estados excepcionales</h3>
                    <div class="workflow-exception-list">
                        <article><strong>CANCELADO</strong><span>Por legal, cierra el workflow.</span></article>
                        <article><strong>SUSPENDIDO, DESIERTO U OTRO</strong><span>Rama por definir.</span></article>
                    </div>
                </section>
                <footer class="workflow-legend" aria-label="Leyenda">
                    <span class="system"><i></i>Sistema</span>
                    <span class="person"><i></i>Persona</span>
                    <span class="result"><i></i>Resultado o decisión</span>
                    <span class="parallel"><i></i>Paralelo, no bloquea</span>
                </footer>
            </div>
        </div>
    `;
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
function openDetail(id) { active = id; render(search.value); show(data[id - 1]); detailPanel.classList.add('open'); detailBackdrop.classList.add('open'); detailPanel.setAttribute('aria-hidden', 'false'); document.body.classList.add('detail-open') }
function completeStage(id) {
    const item = data.find(x => x.id === Number(id));
    if (!item) return;

    const current = getFlowStage(item);
    if (current > TASKS.length) return;

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

function selectWorkflowOutcome(id, outcome) {
    const item = data.find(x => x.id === Number(id));
    if (!item || !RESULT_BRANCHES[outcome] || getFlowStage(item) < 15) return;
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
    if (!item || !branch || item.resultOutcome !== outcome || getFlowStage(item) < 15) return;
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
function select(id) { if (innerWidth < 761) { location.href = 'detalle.html?id=' + id; return } openDetail(id) } function note(s) { toast.textContent = s; toast.classList.add('show'); clearTimeout(window.t); window.t = setTimeout(() => toast.classList.remove('show'), 2200) } search.oninput = e => render(e.target.value); document.querySelectorAll('[data-week]').forEach(b => b.onclick = () => { week += +b.dataset.week; weekLabel.textContent = week < 0 ? 'Semana del 6 al 10 oct 2025' : week > 0 ? 'Semana del 20 al 24 oct 2025' : 'Semana del 13 al 17 oct 2025'; note('Semana actualizada') }); document.querySelectorAll('.nav button').forEach(b => b.onclick = () => { document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active')); b.classList.add('active'); note(b.textContent.trim() + ' · sección de maqueta') }); showAll.onclick = () => note('Mostrando los 7 remates');
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
const destinations = { 'Calendario': 'semana.html', 'Documentos': 'documentos.html', 'Reportes': 'reportes.html' };
document.querySelectorAll('.nav button').forEach(b => {
    const target = destinations[b.textContent.trim()];
    if (target) b.onclick = () => location.href = target;
});
const mobileButtons = document.querySelectorAll('.mobile-nav button');
if (mobileButtons[1]) mobileButtons[1].onclick = () => location.href = 'semana.html';
render();
