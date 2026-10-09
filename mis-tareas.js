(function () {
  const STORAGE_KEY = 'inmoremates-demo-tasks';
  const USER_STORAGE_KEY = 'inmoremates-demo-users';
  const DEFAULT_USERS = [
    { id: 'u1', name: 'María González', email: 'maria.gonzalez@inmoremates.cl', role: 'Administrador', team: 'Dirección', active: true },
    { id: 'u2', name: 'Juan Pérez', email: 'juan.perez@inmoremates.cl', role: 'Gestor de remates', team: 'Gestión', active: true },
    { id: 'u3', name: 'Carla Rojas', email: 'carla.rojas@inmoremates.cl', role: 'Responsable de documentación', team: 'Documentación', active: true },
    { id: 'u4', name: 'Diego Torres', email: 'diego.torres@inmoremates.cl', role: 'Responsable de participación', team: 'Participación', active: true },
    { id: 'u5', name: 'Paula Díaz', email: 'paula.diaz@inmoremates.cl', role: 'Responsable de revisión legal', team: 'Legal', active: false }
  ];

  const demoUsers = getStoredUsers();
  const taskDefaults = window.InmoRematesTaskDefaults;
  if (!Array.isArray(taskDefaults)) throw new Error('No se cargaron los datos compartidos de tareas.');

  const state = {
    users: demoUsers,
    tasks: getStoredTasks(),
    activeUserId: getInitialUserId(demoUsers),
    search: '',
    statusFilter: 'all',
    typeFilter: 'all',
    quickFilter: 'all',
    selectedTaskId: null
  };

  const els = {
    metrics: document.getElementById('tasksMetrics'),
    quickFilters: document.getElementById('quickFilters'),
    taskGroups: document.getElementById('taskGroups'),
    taskSearch: document.getElementById('taskSearch'),
    activeUserSelect: document.getElementById('activeUserSelect'),
    taskStatusFilter: document.getElementById('taskStatusFilter'),
    taskTypeFilter: document.getElementById('taskTypeFilter'),
    upcomingList: document.getElementById('upcomingList'),
    workloadSummary: document.getElementById('workloadSummary'),
    tasksToast: document.getElementById('tasksToast'),
    taskModal: document.getElementById('taskModal'),
    taskModalContent: document.getElementById('taskModalContent')
  };

  const statusMeta = {
    pending: { label: 'Pendiente' },
    in_progress: { label: 'En curso' },
    completed: { label: 'Completada' },
    late: { label: 'Atrasada' },
    blocked: { label: 'Bloqueada' }
  };

  const priorityMeta = {
    critical: { label: 'Crítica', className: 'critical' },
    urgent: { label: 'Urgente', className: 'urgent' },
    upcoming: { label: 'Próxima', className: 'upcoming' },
    normal: { label: 'Normal', className: 'normal' }
  };
  const DEMO_NOW = new Date('2025-10-16T18:00:00');
  const DEMO_TODAY = '2025-10-16';
  const DEMO_WEEK = window.RematesData?.weekRange(0) || { from: '2025-10-13', to: '2025-10-19' };
  const WORKFLOW_TASK_CODES = new Set([
    'CREAR_WORKFLOW', 'ASIGNAR_RESPONSABLES', 'GENERAR_CARTA', 'ENVIAR_CARTA_GG',
    'ENVIAR_CARTA_BANCO', 'GENERAR_FORMULARIO', 'LEGAL_PRE_ENTREGA', 'RETIRAR_VV',
    'ENTREGAR_JUZGADO', 'REGISTRAR_EVIDENCIA', 'LEGAL_FINAL', 'PREPARAR_PARTICIPACION',
    'INGRESAR_SALA', 'PARTICIPAR', 'REGISTRAR_RESULTADO', 'GESTIONAR_PAGO',
    'MARCAR_ADJUDICADA', 'RECUPERAR_GARANTIA', 'REGISTRAR_GARANTIA', 'ACTUALIZAR_FECHA'
  ]);

  function getStoredUsers() {
    const saved = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_USERS;
  }

  function getStoredTasks() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskDefaults));
    return taskDefaults;
  }

  function persistUsers() {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.users));
  }

  function persistTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }

  function getInitialUserId(users) {
    const saved = sessionStorage.getItem('inmoremates-active-user');
    if (saved && users.some(user => user.id === saved)) return saved;
    return users.find(user => user.active)?.id || users[0]?.id || 'u1';
  }

  function notify(message, type = 'success') {
    els.tasksToast.textContent = message;
    els.tasksToast.classList.remove('show');
    void els.tasksToast.offsetWidth;
    els.tasksToast.classList.add('show');
    els.tasksToast.style.background = type === 'error' ? '#ef1d2d' : '#0b1f44';
    setTimeout(() => els.tasksToast.classList.remove('show'), 2200);
  }

  function formatDate(dateString, timeString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(`${dateString}T${timeString || '00:00'}:00`);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    const formatter = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = timeString ? new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '';
    return `${formatter.format(date)}${time ? ' · ' + time : ''}`;
  }

  function formatDueRelative(due) {
    const minutes = Math.ceil(Math.abs(due.getTime() - DEMO_NOW.getTime()) / 60000);
    const amount = minutes < 60
      ? `${minutes} min`
      : minutes < 1440
        ? `${Math.ceil(minutes / 60)} h`
        : `${Math.ceil(minutes / 1440)} d`;
    return due < DEMO_NOW ? `Venció hace ${amount}` : `Vence en ${amount}`;
  }

  function formatUpcomingDate(task) {
    if (task.dueDate === DEMO_TODAY) return `Hoy · ${task.dueTime || 'hora pendiente'}`;
    const tomorrow = new Date(`${DEMO_TODAY}T00:00:00`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    if (task.dueDate === tomorrowDate) return `Mañana · ${task.dueTime || 'hora pendiente'}`;
    return formatDate(task.dueDate, task.dueTime);
  }

  function getUserById(userId) {
    return state.users.find(user => user.id === userId) || { name: 'Sin asignación', email: '', role: 'Sin rol', team: 'Sin área', active: true };
  }

  function getTaskDue(task) {
    if (!task.dueDate) return null;
    const due = new Date(`${task.dueDate}T${task.dueTime || '00:00'}:00`);
    return Number.isNaN(due.getTime()) ? null : due;
  }

  function getResponsibleUserId(task) {
    return task.assignedUserId || task.responsibleUserId || '';
  }

  function getSubstituteUserId(task) {
    return task.substituteUserId || task.backupUserId || '';
  }

  function getWorkflowTaskCode(task) {
    const code = task.workflowTaskCode || task.taskCode || task.code;
    return WORKFLOW_TASK_CODES.has(code) ? code : '';
  }

  function isTaskAssignedTo(task, userId) {
    return getResponsibleUserId(task) === userId || getSubstituteUserId(task) === userId;
  }

  function getRelatedProperty(task) {
    return window.RematesData?.items.find(item => item.id === Number(task.propertyId)) || null;
  }

  function getTaskState(task) {
    if (task.status === 'completed') return 'completed';
    if (task.status === 'blocked') return 'blocked';
    const due = getTaskDue(task);
    if (due && due < DEMO_NOW) return 'late';
    if (task.status === 'in_progress') return 'in_progress';
    return 'pending';
  }

  function isTaskOverdue(task) {
    const due = getTaskDue(task);
    return task.status !== 'completed' && Boolean(due && due < DEMO_NOW);
  }

  function getTaskCategory(task) {
    if (task.status === 'completed') return 'completed';
    if (isTaskOverdue(task)) return 'late';
    if (task.priority === 'critical') return 'critical';
    if (task.dueDate === DEMO_TODAY) return 'today';
    const due = getTaskDue(task);
    if (due && due >= new Date(`${DEMO_WEEK.from}T00:00:00`) && due <= new Date(`${DEMO_WEEK.to}T23:59:59`)) return 'week';
    if (due) return due > DEMO_NOW ? 'later' : 'unscheduled';
    return 'unscheduled';
  }

  function normalizeTask(task) {
    const property = getRelatedProperty(task);
    return {
      ...task,
      status: getTaskState(task),
      propertyTitle: property?.title || task.propertyTitle,
      propertyPlace: property?.place || task.propertyPlace
    };
  }

  function activeUserTasks() {
    return state.tasks
      .map(normalizeTask)
      .filter(task => isTaskAssignedTo(task, state.activeUserId));
  }

  function filterTasks(tasks) {
    const search = state.search.trim().toLowerCase();
    return tasks.filter(task => {
      const property = getRelatedProperty(task);
      const user = getUserById(getResponsibleUserId(task));
      const substitute = getUserById(getSubstituteUserId(task));
      const haystack = [
        task.title, task.propertyTitle, task.propertyPlace, property?.stage,
        property?.person, user.name, substitute.name, task.type, task.status, task.priority
      ].join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesQuick = state.quickFilter === 'all'
        ? task.status !== 'completed' || state.statusFilter === 'completed'
        : filterByQuick(task, state.quickFilter);
      const matchesStatus = state.statusFilter === 'all' || task.status === state.statusFilter;
      const matchesType = state.typeFilter === 'all' || task.type === state.typeFilter;
      return matchesSearch && matchesQuick && matchesStatus && matchesType;
    });
  }

  function filterByQuick(task, key) {
    const category = getTaskCategory(task);
    switch (key) {
      case 'today':
        return task.status !== 'completed' && task.dueDate === DEMO_TODAY && !isTaskOverdue(task);
      case 'late':
        return category === 'late';
      case 'week':
        return category === 'week';
      case 'completed':
        return category === 'completed';
      default:
        return task.status !== 'completed';
    }
  }

  function updateMetrics(tasks) {
    const active = tasks.filter(task => task.status !== 'completed');
    const metrics = [
      { key: 'all', label: 'Tareas activas', icon: 'flag', className: 'blue', value: active.length },
      { key: 'late', label: 'Tareas atrasadas', icon: 'clock', className: 'red', value: active.filter(t => getTaskCategory(t) === 'late').length },
      { key: 'today', label: 'Vencen hoy', icon: 'alert', className: 'amber', value: active.filter(t => t.dueDate === DEMO_TODAY && !isTaskOverdue(t)).length },
      { key: 'week', label: 'Esta semana', icon: 'calendar', className: 'green', value: active.filter(t => getTaskCategory(t) === 'week').length }
    ];

    els.metrics.innerHTML = metrics.map(metric => `
      <button type="button" class="task-metric metric-${metric.className} ${state.quickFilter === metric.key ? 'active' : ''}" data-metric="${metric.key}">
        <div>
          <span class="value">${metric.value}</span>
          <span class="label">${metric.label}</span>
        </div>
        <span class="metric-icon"><svg class="icon"><use href="#${metric.icon}" /></svg></span>
      </button>
    `).join('');

    els.metrics.querySelectorAll('[data-metric]').forEach(button => {
      button.addEventListener('click', () => {
        const next = button.dataset.metric;
        state.quickFilter = state.quickFilter === next ? 'all' : next;
        render();
      });
    });
  }

  function buildGroups(tasks) {
    const groups = [
      { key: 'late', title: 'Tareas atrasadas' },
      { key: 'critical', title: 'Tareas críticas' },
      { key: 'today', title: 'Tareas próximas / Hoy' },
      { key: 'week', title: 'Tareas de esta semana' },
      { key: 'later', title: 'Tareas posteriores' },
      { key: 'unscheduled', title: 'Tareas sin vencimiento' },
      { key: 'completed', title: 'Tareas completadas' }
    ];

    const html = groups.map(group => {
      const items = tasks
        .filter(task => getTaskCategory(task) === group.key)
        .sort((a, b) => (getTaskDue(a)?.getTime() ?? Infinity) - (getTaskDue(b)?.getTime() ?? Infinity));
      if (!items.length) return '';
      return `
        <section class="task-group">
          <div class="task-group-header">
            <div class="task-group-title">${group.title}</div>
            <span class="task-group-counter">${items.length}</span>
          </div>
          <div class="tasks-list">
            ${items.map(task => renderTaskItem(task)).join('')}
          </div>
        </section>
      `;
    }).join('');

    return html || '<div class="empty-state-box">No hay tareas para los filtros actuales.</div>';
  }

  function renderTaskItem(task) {
    const responsible = getUserById(getResponsibleUserId(task));
    const substituteId = getSubstituteUserId(task);
    const substitute = substituteId ? getUserById(substituteId) : null;
    const due = getTaskDue(task);
    const isLate = isTaskOverdue(task);
    const workflowLinked = Boolean(getWorkflowTaskCode(task));
    const propertyLink = task.propertyId
      ? `<a class="task-property-link" href="hello.html?id=${encodeURIComponent(task.propertyId)}">${escapeHtml(task.propertyTitle || 'Remate')}</a>`
      : escapeHtml(task.propertyTitle || 'Remate sin vincular');
    return `
      <div class="task-item">
        <input class="task-checkbox" type="checkbox" data-task-check="${escapeHtml(task.id)}" ${task.status === 'completed' ? 'checked' : ''} ${workflowLinked ? 'disabled title="Gestiona esta etapa desde Workflow"' : ''}>
        <div class="task-main">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="task-property">${propertyLink} · ${escapeHtml(task.propertyPlace || 'Ubicación no disponible')}</span>
        </div>
        <div class="task-meta">
          <strong>Vencimiento</strong>
          ${formatDate(task.dueDate, task.dueTime)}
          <small class="task-due-relative ${isLate ? 'is-late' : ''}">${due ? formatDueRelative(due) : 'Sin vencimiento'}</small>
        </div>
        <div class="task-meta">
          <strong>Responsable</strong>
          ${escapeHtml(responsible.name)}
          ${substitute ? `<small class="task-substitute">Suplente: ${escapeHtml(substitute.name)}</small>` : ''}
        </div>
        <div class="task-type">${escapeHtml(task.type || 'Sin tipo')}</div>
        <div class="task-status ${statusMeta[task.status]?.label ? task.status : 'pending'}">${escapeHtml(statusMeta[task.status]?.label || 'Pendiente')}</div>
        <div class="task-priority ${priorityMeta[task.priority]?.className || 'normal'}">${escapeHtml(priorityMeta[task.priority]?.label || 'Normal')}</div>
        <div class="task-actions">
          <button type="button" class="task-open-btn" data-open-task="${task.id}">Abrir tarea</button>
          <button type="button" class="task-action-menu" data-open-task="${task.id}" aria-label="Más acciones">⋯</button>
        </div>
      </div>
    `;
  }

  function renderUpcoming() {
    const items = activeUserTasks()
      .map(normalizeTask)
      .filter(task => task.status !== 'completed' && getTaskDue(task) >= DEMO_NOW)
      .sort((a, b) => getTaskDue(a) - getTaskDue(b))
      .slice(0, 4);

    if (!items.length) {
      els.upcomingList.innerHTML = '<div class="empty-state-box">Sin vencimientos próximos.</div>';
      return;
    }

    els.upcomingList.innerHTML = items.map(task => `
      <button type="button" class="task-mini-item" data-open-task="${escapeHtml(task.id)}">
        <span class="icon-wrap"><svg class="icon"><use href="#clock" /></svg></span>
        <div>
          <strong>${escapeHtml(formatUpcomingDate(task))}</strong>
          <span>${escapeHtml(task.title)}</span>
          <small>${escapeHtml(task.propertyTitle || 'Remate no disponible')}</small>
        </div>
        <span class="task-priority ${priorityMeta[task.priority]?.className || 'normal'} priority-pill">${escapeHtml(priorityMeta[task.priority]?.label || 'Normal')}</span>
      </button>
    `).join('');
  }

  function renderWorkload() {
    const tasks = activeUserTasks();
    const openTasks = tasks.filter(task => task.status !== 'completed');
    const totals = {
      pending: tasks.filter(task => task.status === 'pending').length,
      in_progress: tasks.filter(task => task.status === 'in_progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      blocked: tasks.filter(task => task.status === 'blocked').length
    };
    const total = tasks.length || 1;
    const statusRows = [
      { label: 'Pendientes', value: totals.pending, color: '#1268f3' },
      { label: 'En curso', value: totals.in_progress, color: '#6b43d6' },
      { label: 'Atrasadas', value: tasks.filter(task => task.status === 'late').length, color: '#ef1d2d' },
      { label: 'Completadas', value: totals.completed, color: '#078b43' },
      { label: 'Bloqueadas', value: totals.blocked, color: '#57657d' }
    ];
    const dueRows = [
      { label: 'Atrasadas', value: openTasks.filter(task => getTaskCategory(task) === 'late').length, color: '#ef1d2d' },
      { label: 'Vencen hoy', value: openTasks.filter(task => task.dueDate === DEMO_TODAY && !isTaskOverdue(task)).length, color: '#f0a900' },
      { label: 'Esta semana', value: openTasks.filter(task => getTaskCategory(task) === 'week').length, color: '#1268f3' }
    ];

    const typeCounts = Object.entries(
      tasks.reduce((acc, task) => {
        const type = task.type || 'Sin tipo';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    ).sort(([a], [b]) => a.localeCompare(b, 'es'));

    const renderRows = rows => rows.map(row => `
      <div class="workload-row">
        <span>${escapeHtml(row.label)}</span>
        <div class="bar-track"><span class="bar-fill" style="width:${(row.value / total) * 100}%;background:${row.color};"></span></div>
        <strong>${row.value}</strong>
      </div>
    `).join('');

    const typeHtml = typeCounts.length ? typeCounts.map(([label, count]) => `
      <div class="workload-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar-track"><span class="bar-fill" style="width:${(count / total) * 100}%;"></span></div>
        <strong>${count}</strong>
      </div>
    `).join('') : '<div class="empty-state-box">Sin tareas asignadas.</div>';

    els.workloadSummary.innerHTML = `
      <div class="workload-summary">
        <div class="workload-total">
          <span>Total</span>
          <strong>${tasks.length}</strong>
        </div>
        <div class="workload-bars">
          <h4>Por estado</h4>
          ${renderRows(statusRows)}
          <h4>Por vencimiento</h4>
          ${renderRows(dueRows)}
        </div>
        <div>
          <h4 class="workload-subheading">Tipos de tareas</h4>
          ${typeHtml}
        </div>
      </div>
    `;
  }

  function renderFilters() {
    const statusOptions = Object.entries(statusMeta).map(([value, meta]) => `<option value="${value}">${meta.label}</option>`).join('');
    const typeOptions = Array.from(new Set(state.tasks.map(task => task.type).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
    els.taskStatusFilter.innerHTML = `<option value="all">Estado: todos</option>${statusOptions}`;
    els.taskTypeFilter.innerHTML = `<option value="all">Tipo: todos</option>${typeOptions}`;
    els.taskStatusFilter.value = state.statusFilter;
    els.taskTypeFilter.value = state.typeFilter;

    const quick = [
      { key: 'all', label: 'Todas' },
      { key: 'today', label: 'Hoy' },
      { key: 'late', label: 'Atrasadas' },
      { key: 'week', label: 'Esta semana' },
      { key: 'completed', label: 'Completadas' }
    ];
    els.quickFilters.innerHTML = quick.map(filter => `
      <button type="button" class="task-quick-filter ${state.quickFilter === filter.key ? 'active' : ''}" data-quick="${filter.key}">${filter.label}</button>
    `).join('') + '<button type="button" class="task-quick-filter clear" data-reset-filters="true">Restablecer</button>';

    els.quickFilters.querySelectorAll('[data-quick]').forEach(button => {
      button.addEventListener('click', () => {
        state.quickFilter = button.dataset.quick || 'all';
        render();
      });
    });
    els.quickFilters.querySelector('[data-reset-filters]').addEventListener('click', () => {
      state.quickFilter = 'all';
      state.statusFilter = 'all';
      state.typeFilter = 'all';
      state.search = '';
      render();
    });
    els.taskStatusFilter.onchange = e => {
      state.statusFilter = e.target.value;
      render();
    };
    els.taskTypeFilter.onchange = e => {
      state.typeFilter = e.target.value;
      render();
    };
  }

  function renderUserSelect() {
    const activeUsers = state.users.filter(user => user.active);
    const fallbackUserId = activeUsers[0]?.id || state.users[0]?.id;
    if (!activeUsers.some(user => user.id === state.activeUserId) && fallbackUserId) {
      state.activeUserId = fallbackUserId;
    }
    els.activeUserSelect.innerHTML = activeUsers.map(user => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`).join('');
    els.activeUserSelect.value = state.activeUserId;
    els.activeUserSelect.onchange = e => {
      state.activeUserId = e.target.value;
      sessionStorage.setItem('inmoremates-active-user', state.activeUserId);
      render();
    };
  }

  function render() {
    const userTasks = activeUserTasks();
    const filtered = filterTasks(userTasks);
    renderUserSelect();
    renderFilters();
    updateMetrics(userTasks);
    els.taskGroups.innerHTML = buildGroups(filtered);
    renderUpcoming();
    renderWorkload();

    els.taskSearch.value = state.search;
    els.taskSearch.oninput = e => {
      state.search = e.target.value;
      render();
    };

    document.querySelectorAll('[data-task-check]').forEach(checkbox => {
      checkbox.addEventListener('change', e => {
        const task = state.tasks.find(item => item.id === checkbox.dataset.taskCheck);
        if (!task) return;
        if (getWorkflowTaskCode(task)) {
          notify('Completa esta etapa desde Workflow para respetar sus dependencias.', 'error');
          checkbox.checked = task.status === 'completed';
          return;
        }
        if (task.status === 'blocked') {
          notify('Debe resolver el bloqueo antes de completar esta tarea.', 'error');
          checkbox.checked = false;
          return;
        }
        const nextStatus = e.target.checked ? 'completed' : 'pending';
        task.status = nextStatus;
        task.completed = nextStatus === 'completed';
        if (nextStatus === 'completed') task.completedAt = new Date().toISOString();
        persistTasks();
        notify('Tarea actualizada correctamente');
        render();
      });
    });
  }

  function openTaskModal(taskId) {
    const taskRecord = state.tasks.find(item => item.id === taskId);
    if (!taskRecord) return;
    const workflowCode = getWorkflowTaskCode(taskRecord);
    if (workflowCode === 'GENERAR_CARTA') {
      openValeVistaModal(taskRecord);
      return;
    }
    if (workflowCode === 'ASIGNAR_RESPONSABLES') {
      openAssignmentModal(taskRecord);
      return;
    }
    if (workflowCode) {
      openWorkflowTaskNotice(taskRecord, workflowCode);
      return;
    }

    const task = normalizeTask(taskRecord);
    els.taskModal.querySelector('.task-modal-dialog').className = 'task-modal-dialog';
    const user = getUserById(getResponsibleUserId(task));
    const status = statusMeta[task.status]?.label || 'Pendiente';
    const priority = priorityMeta[task.priority]?.label || 'Normal';
    els.taskModalContent.innerHTML = `
      <div class="task-modal-body">
        <div class="task-modal-header">
          <div>
            <h3>${task.title}</h3>
            <div class="meta-row">
              <span class="task-type">${task.type}</span>
              <span class="task-priority ${priorityMeta[task.priority]?.className || 'normal'}">${priority}</span>
              <span class="task-status ${task.status}">${status}</span>
            </div>
          </div>
        </div>

        <div class="task-modal-summary">
          <div class="task-summary-card">
            <strong>Remate</strong>
            <span>${task.propertyTitle}</span>
          </div>
          <div class="task-summary-card">
            <strong>Responsable</strong>
            <span>${user.name}</span>
          </div>
          <div class="task-summary-card">
            <strong>Vencimiento</strong>
            <span>${formatDate(task.dueDate, task.dueTime)}</span>
          </div>
          <div class="task-summary-card">
            <strong>Ubicación</strong>
            <span>${task.propertyPlace}</span>
          </div>
        </div>

        <div class="task-modal-description">
          ${task.description || 'No hay descripción disponible para esta tarea.'}
        </div>

        <form class="task-form" id="taskForm">
          <div class="task-form-row">
            <label>
              Estado
              <select name="status">
                <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>En curso</option>
                <option value="late" ${task.status === 'late' ? 'selected' : ''}>Atrasada</option>
                <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Bloqueada</option>
                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completada</option>
              </select>
            </label>
            <label>
              Prioridad
              <select name="priority">
                <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Crítica</option>
                <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgente</option>
                <option value="upcoming" ${task.priority === 'upcoming' ? 'selected' : ''}>Próxima</option>
                <option value="normal" ${task.priority === 'normal' ? 'selected' : ''}>Normal</option>
              </select>
            </label>
          </div>

          <div class="task-form-row">
            <label>
              Responsable
              <select name="assignedUserId">
                ${state.users.filter(user => user.active).map(user => `<option value="${escapeHtml(user.id)}" ${user.id === getResponsibleUserId(task) ? 'selected' : ''}>${escapeHtml(user.name)}</option>`).join('')}
              </select>
            </label>
            <label>
              Suplente (opcional)
              <select name="substituteUserId">
                <option value="">Sin suplente</option>
                ${state.users.filter(user => user.active).map(user => `<option value="${escapeHtml(user.id)}" ${user.id === getSubstituteUserId(task) ? 'selected' : ''}>${escapeHtml(user.name)}</option>`).join('')}
              </select>
            </label>
            <label>
              Tipo de tarea
              <select name="type">
                ${Array.from(new Set(state.tasks.map(item => item.type))).map(type => `<option value="${type}" ${type === task.type ? 'selected' : ''}>${type}</option>`).join('')}
              </select>
            </label>
          </div>

          <div class="task-form-row">
            <label>
              Fecha de vencimiento
              <input type="date" name="dueDate" value="${task.dueDate}">
            </label>
            <label>
              Hora
              <input type="time" name="dueTime" value="${task.dueTime}">
            </label>
          </div>

          <label>
            Descripción
            <textarea name="description">${task.description}</textarea>
          </label>

          <div class="task-modal-actions">
            <button type="submit" class="primary-action">Guardar cambios</button>
            <button type="button" class="secondary-action" data-close-task-modal="true">Cerrar</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('taskForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const updates = {
        status: formData.get('status'),
        priority: formData.get('priority'),
        assignedUserId: formData.get('assignedUserId'),
        substituteUserId: formData.get('substituteUserId') || '',
        type: formData.get('type'),
        dueDate: formData.get('dueDate'),
        dueTime: formData.get('dueTime'),
        description: formData.get('description')
      };

      if (!updates.dueDate || !updates.description.trim()) {
        notify('Completa la fecha y la descripción antes de guardar.', 'error');
        return;
      }

      Object.assign(taskRecord, updates);
      if (updates.status === 'completed') {
        taskRecord.completedAt = new Date().toISOString();
        taskRecord.completed = true;
      } else {
        taskRecord.completed = false;
        taskRecord.completedAt = null;
      }
      persistTasks();
      notify('Tarea guardada con éxito');
      closeTaskModal();
      render();
    });

    showTaskModal();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function taskPropertySummary(task) {
    const property = getRelatedProperty(task);
    return {
      title: property?.title || task.propertyTitle,
      place: property?.place || task.propertyPlace,
      date: property?.date || formatDate(task.dueDate),
      time: property?.time || task.dueTime || '',
      iso: property?.iso || task.dueDate,
      due: property?.due || formatDate(task.dueDate, task.dueTime),
      late: task.status === 'late' || property?.status === 'ATRASADO'
    };
  }

  function renderPropertySummary(task) {
    const property = taskPropertySummary(task);
    return `
      <div class="action-property-summary">
        <span class="action-property-icon"><svg class="icon"><use href="#home"></use></svg></span>
        <div class="action-property-main">
          <strong>${escapeHtml(property.title)}</strong>
          <span>${escapeHtml(property.place)}</span>
        </div>
        <div class="action-property-date">
          <strong>Fecha y hora del remate</strong>
          <span>${escapeHtml(property.date)} · ${escapeHtml(property.time)}</span>
        </div>
        <div class="action-property-due ${property.late ? 'is-late' : ''}">
          <svg class="icon"><use href="#clock"></use></svg>
          <span>${escapeHtml(property.due)}</span>
        </div>
      </div>
    `;
  }

  function openWorkflowTaskNotice(task, workflowCode) {
    const remateLink = task.propertyId
      ? `<a class="workflow-task-link" href="hello.html?id=${encodeURIComponent(task.propertyId)}">Abrir remate en Workflow</a>`
      : '<span>Remate asociado no disponible.</span>';
    els.taskModalContent.innerHTML = `
      <div class="task-modal-body">
        <header class="task-modal-header">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <span class="task-type">${escapeHtml(workflowCode)}</span>
          </div>
        </header>
        ${renderPropertySummary(task)}
        <div class="workflow-task-notice" role="status">
          El estado y las dependencias de esta tarea se gestionan desde Workflow. No se modificarán desde Mis tareas.
        </div>
        <div class="task-modal-actions">
          ${remateLink}
          <button type="button" class="secondary-action" data-close-task-modal="true">Cerrar</button>
        </div>
      </div>
    `;
    showTaskModal();
  }

  function showTaskModal(modalClass = '') {
    const dialog = els.taskModal.querySelector('.task-modal-dialog');
    dialog.className = `task-modal-dialog${modalClass ? ` ${modalClass}` : ''}`;
    els.taskModal.classList.remove('hidden');
    els.taskModal.setAttribute('aria-hidden', 'false');
    els.taskModal.querySelectorAll('[data-close-task-modal]').forEach(button => {
      button.onclick = closeTaskModal;
    });
  }

  function getActiveUserOptions(selectedId = '') {
    return `<option value="">Selecciona una persona</option>${state.users.filter(user => user.active).map(user =>
      `<option value="${escapeHtml(user.id)}" ${user.id === selectedId ? 'selected' : ''}>${escapeHtml(user.name)} · ${escapeHtml(user.role)}</option>`
    ).join('')}`;
  }

  function openValeVistaModal(task) {
    const property = taskPropertySummary(task);
    const previous = task.valeVistaRequest || {};
    const remate = getRelatedProperty(task);
    const defaultDateTime = `${property.iso}T${property.time || '10:00'}`;
    const generationDate = previous.generatedAt
      ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(previous.generatedAt))
      : 'Aún no generado';
    const documentStatus = previous.generatedAt
      ? 'Vista generada en modo demostración · sin archivo PDF real'
      : 'Documento de demostración · PDF no generado';

    els.taskModalContent.innerHTML = `
      <div class="task-modal-body action-modal-body">
        <header class="action-modal-header">
          <h2>Generar y enviar carta Vale Vista</h2>
        </header>
        ${renderPropertySummary(task)}

        <form class="action-modal-form" id="valeVistaForm">
          <section class="action-modal-section">
            <h3>Datos de la solicitud</h3>
            <div class="action-fields-grid">
              <label>Banco
                <select name="bank" required>
                  <option value="">Seleccionar banco</option>
                  ${['Banco de Chile', 'BancoEstado', 'Banco BCI', 'Banco Santander', 'Scotiabank'].map(bank => `<option ${previous.bank === bank ? 'selected' : ''}>${bank}</option>`).join('')}
                </select>
              </label>
              <label>Ejecutivo bancario
                <input name="executive" value="${escapeHtml(previous.executive || '')}" placeholder="Nombre del ejecutivo" required>
              </label>
              <label>Monto garantía
                <input name="amount" type="number" min="1" step="any" value="${escapeHtml(previous.amount ?? remate?.minimum ?? '')}" placeholder="Monto en UF" required>
              </label>
              <label>Tribunal
                <input name="court" value="${escapeHtml(previous.court || '')}" placeholder="Tribunal civil" required>
              </label>
              <label>Rol / causa
                <input name="caseNumber" value="${escapeHtml(previous.caseNumber || '')}" placeholder="Ej. C-1234-2025" required>
              </label>
              <label>Fecha remate
                <input name="auctionDate" type="datetime-local" value="${escapeHtml(previous.auctionDate || defaultDateTime)}" required>
              </label>
            </div>
          </section>

          <section class="action-modal-section">
            <div class="action-section-heading">
              <h3>Destinatario del correo</h3>
            </div>
            <div class="recipient-layout">
              <label>Enviar a
                <select name="recipientId">
                  ${getActiveUserOptions(previous.recipientId || task.assignedUserId)}
                </select>
              </label>
              <div class="action-info-note">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 11v5M12 8h.01"></path>
                </svg>
                <span>También puedes seleccionar un destinatario alternativo en caso de reemplazo</span>
              </div>
            </div>
          </section>

          <section class="action-modal-section">
            <h3>Documento</h3>
            <div class="action-document-card">
              <span class="action-pdf-icon">PDF</span>
              <div class="action-document-details">
                <strong>Carta solicitud Vale Vista · ${escapeHtml(property.title)}</strong>
                <span>${documentStatus}</span>
              </div>
              <div class="action-document-meta">
                <span>Tamaño: ${previous.generatedAt ? 'vista simulada' : 'no generado'}</span>
                <span>Generación: ${generationDate}</span>
              </div>
              <button type="button" class="action-secondary-button" id="valeVistaPreview">Vista previa</button>
            </div>
            <div id="valeVistaPreviewContent" class="action-document-preview" hidden>
              <strong>Vista previa de demostración</strong>
              <span>Este contenido es ilustrativo. No existe un archivo PDF generado ni se ha enviado un correo.</span>
              <span>Propiedad: ${escapeHtml(property.title)} · Garantía: ${escapeHtml(previous.amount ?? remate?.minimum ?? '—')} UF</span>
            </div>
          </section>

          <footer class="action-modal-actions">
            <button type="button" class="action-secondary-button" data-close-task-modal="true">Cancelar</button>
            <button type="button" class="action-secondary-button" data-generate-letter="true">Solo generar</button>
            <button type="button" class="action-primary-button" data-send-letter="true">Enviar</button>
          </footer>
        </form>
      </div>
    `;

    const form = document.getElementById('valeVistaForm');
    const previewButton = document.getElementById('valeVistaPreview');
    const previewContent = document.getElementById('valeVistaPreviewContent');
    previewButton.addEventListener('click', () => {
      previewContent.hidden = !previewContent.hidden;
      previewButton.textContent = previewContent.hidden ? 'Vista previa' : 'Cerrar vista previa';
    });

    const readRequest = requireRecipient => {
      if (!form.reportValidity()) return null;
      const values = Object.fromEntries(new FormData(form).entries());
      if (requireRecipient && !values.recipientId) {
        notify('Selecciona un destinatario antes de enviar.', 'error');
        return null;
      }
      return {
        bank: values.bank,
        executive: values.executive.trim(),
        amount: values.amount,
        court: values.court.trim(),
        caseNumber: values.caseNumber.trim(),
        auctionDate: values.auctionDate,
        recipientId: values.recipientId
      };
    };

    document.querySelector('[data-generate-letter]').addEventListener('click', () => {
      const request = readRequest(false);
      if (!request) return;
      task.valeVistaRequest = { ...request, generatedAt: new Date().toISOString() };
      persistTasks();
      notify('Carta generada en modo demostración; no se creó un PDF real.');
      closeTaskModal();
    });

    document.querySelector('[data-send-letter]').addEventListener('click', () => {
      const request = readRequest(true);
      if (!request) return;
      task.valeVistaRequest = { ...request, generatedAt: new Date().toISOString(), sentAt: new Date().toISOString() };
      persistTasks();
      notify('Envío simulado: no se envió ningún correo real.');
      closeTaskModal();
    });

    showTaskModal('is-letter-modal');
  }

  const DEMO_ASSIGNMENT_CONFLICTS = [
    { propertyId: 9001, title: 'Casa Parque Norte 340', place: 'Ñuñoa', iso: '2025-10-22', time: '09:00', bidderId: 'u2' }
  ];

  function getAuctionSlot(propertyId, task) {
    const property = window.RematesData?.items.find(item => item.id === Number(propertyId));
    return property ? { iso: property.iso, time: property.time, title: property.title } : {
      iso: task.dueDate, time: task.dueTime, title: task.propertyTitle
    };
  }

  function findBidderConflict(task, bidderId) {
    const slot = getAuctionSlot(task.propertyId, task);
    const scheduledTasks = state.tasks.filter(other => {
      if (other.id === task.id || other.assignment?.bidderId !== bidderId) return false;
      const otherSlot = getAuctionSlot(other.propertyId, other);
      return otherSlot.iso === slot.iso && otherSlot.time === slot.time;
    });
    const demoConflict = DEMO_ASSIGNMENT_CONFLICTS.find(other =>
      other.bidderId === bidderId && other.iso === slot.iso && other.time === slot.time
    );
    if (demoConflict) return demoConflict;
    if (!scheduledTasks.length) return null;
    const otherTask = scheduledTasks[0];
    const otherSlot = getAuctionSlot(otherTask.propertyId, otherTask);
    return { title: otherSlot.title, place: getRelatedProperty(otherTask)?.place || otherTask.propertyPlace };
  }

  function openAssignmentModal(task) {
    const property = taskPropertySummary(task);
    const assignment = task.assignment || {};
    const currentUserId = state.users.some(user => user.active && user.id === task.assignedUserId)
      ? task.assignedUserId
      : '';

    els.taskModalContent.innerHTML = `
      <div class="task-modal-body action-modal-body assignment-modal-body">
        <header class="action-modal-header">
          <h2>Asignar gestor y postor</h2>
        </header>
        ${renderPropertySummary(task)}

        <form class="action-modal-form" id="assignmentForm" novalidate>
          <section class="action-modal-section assignment-fields">
            <label>Gestor
              <select name="managerId" required>${getActiveUserOptions(assignment.managerId || currentUserId)}</select>
            </label>
            <label>Suplente Gestor
              <select name="managerBackupId" required>${getActiveUserOptions(assignment.managerBackupId || '')}</select>
            </label>
            <label>Postor
              <select name="bidderId" id="assignmentBidder" required>${getActiveUserOptions(assignment.bidderId || '')}</select>
            </label>
            <div id="bidderConflict" class="assignment-conflict" role="status" aria-live="polite" hidden></div>
            <label>Suplente Postor
              <select name="bidderBackupId" required>${getActiveUserOptions(assignment.bidderBackupId || '')}</select>
            </label>
          </section>
          <footer class="action-modal-actions">
            <button type="button" class="action-secondary-button" data-close-task-modal="true">Cancelar</button>
            <button type="submit" class="action-primary-button">Guardar y cerrar</button>
          </footer>
        </form>
      </div>
    `;

    const form = document.getElementById('assignmentForm');
    const bidderSelect = document.getElementById('assignmentBidder');
    const conflictNotice = document.getElementById('bidderConflict');
    const updateConflictNotice = () => {
      const conflict = findBidderConflict(task, bidderSelect.value);
      if (!conflict) {
        conflictNotice.hidden = true;
        conflictNotice.innerHTML = '';
        return;
      }
      const bidder = getUserById(bidderSelect.value);
      conflictNotice.innerHTML = `<svg class="icon"><use href="#alert"></use></svg><span>${escapeHtml(bidder.name)} ya tiene otro remate a la misma hora (${escapeHtml(conflict.title)} · ${escapeHtml(conflict.place)}).</span>`;
      conflictNotice.hidden = false;
    };
    bidderSelect.addEventListener('change', updateConflictNotice);
    updateConflictNotice();

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) {
        notify('Selecciona gestor, suplente, postor y suplente postor.', 'error');
        return;
      }
      const values = Object.fromEntries(new FormData(form).entries());
      task.assignment = {
        managerId: values.managerId,
        managerBackupId: values.managerBackupId,
        bidderId: values.bidderId,
        bidderBackupId: values.bidderBackupId,
        savedAt: new Date().toISOString()
      };
      task.assignedUserId = values.managerId;
      persistTasks();
      notify('Asignación guardada en la maqueta.');
      closeTaskModal();
      render();
    });

    showTaskModal('is-assignment-modal');
  }

  function closeTaskModal() {
    els.taskModal.classList.add('hidden');
    els.taskModal.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-open-task]');
    if (trigger && !e.target.closest('input')) {
      openTaskModal(trigger.dataset.openTask);
    }
  });

  els.taskModal.addEventListener('click', e => {
    if (e.target.dataset.closeTaskModal === 'true') closeTaskModal();
  });

  if (!state.users.some(user => user.active)) {
    state.users[0].active = true;
    persistUsers();
  }

  render();
})();
