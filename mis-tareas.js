(function () {
  const T = window.TareasData;
  const demoUsers = T.loadUsers();

  const state = {
    users: demoUsers,
    tasks: T.tasks(),
    activeUserId: getInitialUserId(demoUsers),
    search: '',
    statusFilter: 'all',
    typeFilter: 'all',
    quickFilter: 'all',
    selectedTaskId: null,
    collapsed: new Set(['completed']),
    workloadPeriod: 'all'
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
    taskTypes: document.getElementById('taskTypes'),
    upcomingAll: document.getElementById('upcomingAll'),
    tasksToast: document.getElementById('tasksToast'),
    taskModal: document.getElementById('taskModal'),
    taskModalContent: document.getElementById('taskModalContent')
  };

  const statusMeta = Object.fromEntries(Object.entries(T.STATUS_LABEL).map(([key, label]) => [key, { label }]));

  const priorityMeta = {
    critical: { label: 'Crítica', className: 'critical' },
    urgent: { label: 'Urgente', className: 'urgent' },
    upcoming: { label: 'Próxima', className: 'upcoming' },
    normal: { label: 'Normal', className: 'normal' }
  };

  function persistUsers() {
    T.saveUsers(state.users);
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
    els.tasksToast.style.background = type === 'error' ? '#ef1d2d' : '#181817';
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => els.tasksToast.classList.remove('show'), 2200);
  }

  function formatDate(dateString, timeString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(`${dateString}T${timeString || '00:00'}:00`);
    const formatter = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = timeString ? new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '';
    return `${formatter.format(date)}${time ? ' · ' + time : ''}`;
  }

  function getUserById(userId) {
    return state.users.find(user => user.id === userId) || { name: 'Sin asignación', email: '', role: 'Sin rol', team: 'Sin área', active: true };
  }

  // Las tareas vienen armadas desde el workflow (TareasData.tasks), ya con su estado y su remate.
  function getTaskState(task) {
    return task.status;
  }

  function normalizeTask(task) {
    return task;
  }

  function filterTasks(tasks) {
    const search = state.search.trim().toLowerCase();
    return tasks.filter(task => {
      const property = getRelatedProperty(task);
      const user = getUserById(task.assignedUserId);
      const substitute = task.substituteUserId ? getUserById(task.substituteUserId) : { name: '' };
      const haystack = [
        task.title, task.propertyTitle, task.propertyPlace, property?.stage, user.name, substitute.name,
        task.type, statusMeta[task.status]?.label, priorityMeta[task.priority]?.label
      ].join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesQuick = state.quickFilter === 'all' || filterByQuick(task, state.quickFilter);
      const matchesStatus = state.statusFilter === 'all' || task.status === state.statusFilter;
      const matchesType = state.typeFilter === 'all' || task.type === state.typeFilter;
      return matchesSearch && matchesQuick && matchesStatus && matchesType;
    });
  }

  // Una tarea atrasada ya venció: no cuenta como «vence hoy» aunque su plazo fuera hoy.
  const dueToday = task => task.status !== 'completed' && task.status !== 'late' && task.dueDate === T.TODAY;
  const dueThisWeek = task => task.status !== 'completed' && T.inThisWeek(task);

  function filterByQuick(task, key) {
    switch (key) {
      case 'today':
        return dueToday(task);
      case 'late':
        return task.status === 'late';
      case 'week':
        return dueThisWeek(task);
      case 'completed':
        return task.status === 'completed';
      default:
        return true;
    }
  }

  function updateMetrics(tasks) {
    const metrics = [
      { key: 'all', label: 'tareas activas', icon: 'flag', className: 'blue', value: tasks.filter(t => t.status !== 'completed').length },
      { key: 'late', label: 'atrasadas', icon: 'alert', className: 'red', value: tasks.filter(t => t.status === 'late').length },
      { key: 'today', label: 'vencen hoy', icon: 'clock', className: 'amber', value: tasks.filter(dueToday).length },
      { key: 'week', label: 'esta semana', icon: 'calendar', className: 'green', value: tasks.filter(dueThisWeek).length }
    ];

    els.metrics.innerHTML = metrics.map(metric => `
      <button type="button" class="task-metric metric-${metric.className} ${state.quickFilter === metric.key ? 'active' : ''}" data-metric="${metric.key}">
        <span class="metric-icon">${svgIcon(metric.icon)}</span>
        <div>
          <span class="value">${metric.value}</span>
          <span class="label">${metric.label}</span>
        </div>
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

  // Cada tarea aparece una sola vez, en el primer grupo que le corresponde.
  function buildGroups(tasks) {
    const groups = [
      { key: 'late', icon: 'alert', title: 'Tareas atrasadas', predicate: task => task.status === 'late' },
      { key: 'critical', icon: 'flame', title: 'Tareas críticas', predicate: task => task.priority === 'critical' && task.status !== 'completed' },
      { key: 'today', icon: 'clock', title: 'Tareas próximas / Hoy', predicate: dueToday },
      { key: 'week', icon: 'calendar', title: 'Tareas de esta semana', predicate: dueThisWeek },
      { key: 'later', icon: 'flag', title: 'Tareas posteriores', predicate: task => task.status !== 'completed' && Boolean(task.dueAt) },
      { key: 'unscheduled', icon: 'pause', title: 'Tareas sin vencimiento', predicate: task => task.status !== 'completed' },
      { key: 'completed', icon: 'check', title: 'Tareas completadas', predicate: task => task.status === 'completed' }
    ];
    const placed = new Set();

    const html = groups.map(group => {
      const items = tasks
        .filter(task => !placed.has(task.id) && group.predicate(task))
        .sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'));
      if (!items.length) return '';
      items.forEach(task => placed.add(task.id));
      const collapsed = state.collapsed.has(group.key);
      return `
        <section class="task-group tone-${group.key} ${collapsed ? 'collapsed' : ''}">
          <button type="button" class="task-group-header" data-group-toggle="${group.key}" aria-expanded="${!collapsed}">
            ${svgIcon(group.icon)}
            <span class="task-group-title">${group.title} (${items.length})</span>
            <span class="task-group-chevron" aria-hidden="true"></span>
          </button>
          <div class="tasks-list">
            ${items.map(task => renderTaskItem(task)).join('')}
          </div>
        </section>
      `;
    }).join('');

    return html || '<div class="empty-state-box">No hay tareas para los filtros actuales.</div>';
  }

  const svgIcon = name => `<svg class="icon"><use href="#${name}"></use></svg>`;
  const TYPE_ICON = { 'Gestión': 'users', 'Vale Vista': 'card', 'Documentación': 'file', 'Legal': 'shield', 'Participación': 'monitor', 'Cierre': 'chart' };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Una sola etiqueta por tarea: el estado cuando dice algo (atrasada, bloqueada, en curso, completada); si no, la prioridad.
  function taskPill(task) {
    if (['late', 'blocked', 'in_progress', 'completed'].includes(task.status)) {
      return { label: statusMeta[task.status].label, className: `task-status ${task.status}`, tone: task.status === 'late' ? 'red' : task.status === 'in_progress' ? 'blue' : 'gray' };
    }
    const priority = priorityMeta[task.priority] || priorityMeta.normal;
    return { label: priority.label, className: `task-priority ${priority.className}`, tone: { critical: 'red', urgent: 'amber', upcoming: 'blue' }[task.priority] || 'gray' };
  }

  // Tiempo que falta o que pasó desde el plazo, respecto del «hoy» de la maqueta: «Hace 2 días», «En 45 min».
  function relativeDue(task) {
    if (!task.dueAt) return '';
    const minutes = Math.round((new Date(task.dueAt) - T.NOW) / 60000);
    const abs = Math.abs(minutes);
    const amount = abs < 60 ? `${abs} min` : abs < 1440 ? plural(Math.round(abs / 60), 'hora', 'horas') : plural(Math.round(abs / 1440), 'día', 'días');
    return minutes < 0 ? `Hace ${amount}` : `En ${amount}`;
  }

  function dueUrgency(task) {
    if (!task.dueAt) return '';
    const hours = (new Date(task.dueAt) - T.NOW) / 3600000;
    return hours < 0 ? 'is-late' : hours <= 24 ? 'is-soon' : '';
  }

  function renderTaskItem(task) {
    const user = getUserById(task.assignedUserId);
    const pill = taskPill(task);
    const relative = relativeDue(task);
    const substitute = task.substituteUserId ? getUserById(task.substituteUserId) : null;
    return `
      <div class="task-item">
        <input class="task-checkbox" type="checkbox" data-task-check="${task.id}" ${task.status === 'completed' ? 'checked disabled' : ''}>
        <div class="task-main">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="task-property"><a class="task-property-link" href="hello.html?id=${task.propertyId}">${escapeHtml(task.propertyTitle)}</a> · ${escapeHtml(task.propertyPlace)}</span>
        </div>
        <div class="task-due ${dueUrgency(task)}">
          <span class="task-due-date">${svgIcon('calendar')}${task.dueAt ? formatDate(task.dueDate, task.dueTime) : escapeHtml(task.dueText)}</span>
          ${relative ? `<small>${relative}</small>` : ''}
        </div>
        <div class="task-who">
          ${svgIcon('users')}
          <span><b>${escapeHtml(user.name)}</b><small>${substitute ? `Suplente: ${escapeHtml(substitute.name)}` : 'Responsable'}</small></span>
        </div>
        <div class="task-type">${svgIcon(TYPE_ICON[task.type] || 'file')}${escapeHtml(task.type)}</div>
        <div class="${pill.className} task-pill">${pill.label}</div>
        <div class="task-actions">
          <button type="button" class="task-open-btn" data-open-task="${task.id}">Abrir tarea</button>
          <button type="button" class="task-action-menu" data-task-menu="${task.id}" aria-label="Más acciones" aria-haspopup="menu">⋯</button>
        </div>
      </div>
    `;
  }

  function upcomingWhen(task) {
    if (!task.dueAt) return escapeHtml(task.dueText);
    const tomorrow = new Date(new Date(`${T.TODAY}T12:00:00`).getTime() + 86400000).toISOString().slice(0, 10);
    const day = task.dueDate === T.TODAY ? 'Hoy' : task.dueDate === tomorrow ? 'Mañana'
      : new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(new Date(`${task.dueDate}T12:00:00`));
    return `${day}, ${task.dueTime}`;
  }

  // Línea de tiempo con las tareas abiertas del usuario que todavía no vencen, de la más próxima a la más lejana.
  function renderUpcoming() {
    const items = state.tasks
      .filter(task => T.isAssignedTo(task, state.activeUserId) && task.status !== 'completed' && task.dueAt && new Date(task.dueAt) >= T.NOW)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .slice(0, 5);

    if (!items.length) {
      els.upcomingList.innerHTML = '<div class="empty-state-box">Sin vencimientos próximos.</div>';
      return;
    }

    els.upcomingList.innerHTML = `<div class="timeline">${items.map(task => {
      const pill = taskPill(task);
      return `
        <div class="timeline-item tl-${pill.tone}" data-open-task="${task.id}">
          <div>
            <span class="timeline-when">${upcomingWhen(task)}</span>
            <strong>${escapeHtml(task.title)}</strong>
            <small>${escapeHtml(task.propertyTitle)}</small>
          </div>
          <span class="${pill.className} priority-pill">${pill.label}</span>
        </div>
      `;
    }).join('')}</div>`;
  }

  // Dona con la carga del usuario por urgencia; cada tarea cae en una sola categoría.
  function renderWorkload() {
    const mine = state.tasks.filter(task => T.isAssignedTo(task, state.activeUserId));
    const tasks = state.workloadPeriod === 'week' ? mine.filter(T.inThisWeek) : mine;
    const open = task => task.status !== 'completed';
    const buckets = [
      { label: 'Atrasadas', color: '#ef1d2d', test: task => task.status === 'late' },
      { label: 'Vencen hoy', color: '#f0a000', test: dueToday },
      { label: 'Resto de la semana', color: '#1c1c1a', test: task => open(task) && T.inThisWeek(task) },
      { label: 'Próximas', color: '#c9c9c8', test: open },
      { label: 'Completadas', color: '#16a559', test: () => true }
    ].map(bucket => ({ ...bucket, count: 0 }));
    tasks.forEach(task => { buckets.find(bucket => bucket.test(task)).count += 1; });

    const total = tasks.length;
    const circumference = 2 * Math.PI * 48;
    let offset = 0;
    const segments = buckets.filter(bucket => bucket.count).map(bucket => {
      const length = bucket.count / total * circumference;
      const segment = `<circle cx="60" cy="60" r="48" stroke="${bucket.color}" stroke-dasharray="${Math.max(0, length - 3)} ${circumference}" stroke-dashoffset="${-offset}"><title>${bucket.label}: ${bucket.count}</title></circle>`;
      offset += length;
      return segment;
    }).join('');

    els.workloadSummary.innerHTML = `
      <select class="workload-period" id="workloadPeriod" aria-label="Período">
        <option value="all" ${state.workloadPeriod === 'all' ? 'selected' : ''}>Todas</option>
        <option value="week" ${state.workloadPeriod === 'week' ? 'selected' : ''}>Esta semana</option>
      </select>
      <div class="donut-wrap">
        <div class="donut">
          <svg viewBox="0 0 120 120" role="img" aria-label="Carga de trabajo: ${plural(total, 'tarea', 'tareas')}">
            <circle cx="60" cy="60" r="48" stroke="#f3f3f2"></circle>
            ${segments}
          </svg>
          <div class="donut-center"><strong>${total}</strong><span>${total === 1 ? 'tarea' : 'tareas'}</span></div>
        </div>
        <div class="donut-legend">
          ${buckets.map(bucket => `<div><i style="background:${bucket.color}"></i><b>${bucket.count}</b>${bucket.label}</div>`).join('')}
        </div>
      </div>
    `;
    const statusRows = [
      { label: 'Pendientes', key: 'pending', color: '#1c1c1a' },
      { label: 'En curso', key: 'in_progress', color: '#6b43d6' },
      { label: 'Atrasadas', key: 'late', color: '#ef1d2d' },
      { label: 'Bloqueadas', key: 'blocked', color: '#5f5f5e' },
      { label: 'Completadas', key: 'completed', color: '#16a559' }
    ].map(row => ({ ...row, value: tasks.filter(task => task.status === row.key).length }));
    els.workloadSummary.insertAdjacentHTML('beforeend', `
      <div class="workload-bars">
        <h4 class="workload-subheading">Por estado</h4>
        ${statusRows.map(row => `
          <div class="workload-row">
            <span>${row.label}</span>
            <div class="bar-track"><span class="bar-fill" style="width:${row.value / (total || 1) * 100}%;background:${row.color};"></span></div>
            <strong>${row.value}</strong>
          </div>
        `).join('')}
      </div>
    `);
    document.getElementById('workloadPeriod').onchange = e => {
      state.workloadPeriod = e.target.value;
      renderWorkload();
    };

    const types = Object.entries(tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...types.map(([, count]) => count));
    els.taskTypes.innerHTML = types.length ? types.map(([label, count]) => `
      <div class="type-row">
        ${svgIcon(TYPE_ICON[label] || 'file')}
        <span>${escapeHtml(label)}</span>
        <div class="type-track"><i style="width:${count / max * 100}%"></i></div>
        <b>${count}</b>
      </div>
    `).join('') : '<div class="empty-state-box">Sin tareas asignadas.</div>';
  }

  // Lo que se vuelve a enlazar en cada render: contraer grupos y «Ver todas».
  function bindListActions() {
    document.querySelectorAll('[data-group-toggle]').forEach(button => {
      button.onclick = () => {
        const key = button.dataset.groupToggle;
        if (state.collapsed.has(key)) state.collapsed.delete(key); else state.collapsed.add(key);
        render();
      };
    });
    els.upcomingAll.onclick = () => {
      Object.assign(state, { search: '', statusFilter: 'all', typeFilter: 'all', quickFilter: 'all' });
      render();
      els.taskGroups.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  // Menú «⋯»: acciones rápidas sobre la tarea sin abrir su modal.
  function openTaskMenu(button) {
    const wasOpenFor = document.getElementById('taskMenu')?.dataset.task;
    closeTaskMenu();
    const task = state.tasks.find(item => item.id === button.dataset.taskMenu);
    if (!task || wasOpenFor === task.id) return;
    const isOpen = task.status !== 'completed';
    // Si el bloqueo viene del remate suspendido, se resuelve reanudando el remate, no desde la tarea.
    const editable = isOpen && getRelatedProperty(task)?.status !== 'SUSPENDIDO';
    const mark = task.notes.status;
    const actions = [
      isOpen && ['reassign', 'Reasignar'],
      editable && mark !== 'blocked' && (mark === 'in_progress' ? ['pending', 'Marcar pendiente'] : ['in_progress', 'Marcar en curso']),
      editable && (mark === 'blocked' ? ['pending', 'Desbloquear'] : ['blocked', 'Bloquear'])
    ].filter(Boolean);

    const menu = document.createElement('div');
    menu.id = 'taskMenu';
    menu.className = 'task-menu';
    menu.dataset.task = task.id;
    menu.setAttribute('role', 'menu');
    menu.innerHTML = actions.map(([action, label]) => `<button type="button" role="menuitem" data-menu-action="${action}">${label}</button>`).join('')
      + `<a role="menuitem" href="hello.html?id=${task.propertyId}">Ver remate</a>`;
    document.body.append(menu);
    const rect = button.getBoundingClientRect();
    menu.style.top = `${Math.max(8, Math.min(innerHeight - menu.offsetHeight - 8, rect.bottom + 6))}px`;
    menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;

    menu.addEventListener('click', e => {
      const action = e.target.dataset.menuAction;
      if (!action) return;
      closeTaskMenu();
      if (action === 'reassign') {
        openReassignModal(task);
        return;
      }
      T.saveNote(task, { status: action === 'pending' ? null : action });
      notify({ in_progress: 'Tarea marcada en curso', blocked: 'Tarea bloqueada', pending: 'Tarea marcada como pendiente' }[action]);
      render();
    });
  }

  function closeTaskMenu() {
    document.getElementById('taskMenu')?.remove();
  }

  function openReassignModal(task) {
    els.taskModalContent.innerHTML = `
      <div class="task-modal-body">
        <div class="task-modal-header">
          <div><h3>Reasignar tarea</h3></div>
        </div>
        ${renderPropertySummary(task)}
        <form class="task-form" id="reassignForm">
          <label>
            Nuevo responsable de «${escapeHtml(task.title)}»
            <select name="assignedUserId">
              ${state.users.filter(item => item.active || item.id === task.assignedUserId).map(item => `<option value="${escapeHtml(item.id)}" ${item.id === task.assignedUserId ? 'selected' : ''}>${escapeHtml(item.name)} · ${escapeHtml(item.role)}</option>`).join('')}
            </select>
          </label>
          <div class="task-modal-actions">
            <button type="submit" class="primary-action">Reasignar</button>
            <button type="button" class="secondary-action" data-close-task-modal="true">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    const form = document.getElementById('reassignForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const userId = new FormData(form).get('assignedUserId');
      T.saveNote(task, { assignedUserId: userId });
      notify(`Tarea reasignada a ${getUserById(userId).name}`);
      closeTaskModal();
      render();
    });
    showTaskModal();
  }

  function renderFilters() {
    const statusOptions = Object.entries(statusMeta).map(([value, meta]) => `<option value="${value}">${meta.label}</option>`).join('');
    const typeOptions = Array.from(new Set(state.tasks.map(task => task.type))).map(type => `<option value="${type}">${type}</option>`).join('');
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

    els.quickFilters.querySelector('[data-reset-filters]').addEventListener('click', () => {
      Object.assign(state, { quickFilter: 'all', statusFilter: 'all', typeFilter: 'all', search: '' });
      render();
    });

    els.quickFilters.querySelectorAll('[data-quick]').forEach(button => {
      button.addEventListener('click', () => {
        state.quickFilter = button.dataset.quick || 'all';
        render();
      });
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

  // Incluye a los usuarios inactivos que todavía tienen tareas abiertas, para que no queden inaccesibles.
  function renderUserSelect() {
    const hasOpenTasks = user => state.tasks.some(task => T.isAssignedTo(task, user.id) && task.status !== 'completed');
    const selectable = state.users.filter(user => user.active || hasOpenTasks(user));
    if (!selectable.some(user => user.id === state.activeUserId) && selectable[0]) {
      state.activeUserId = selectable[0].id;
    }
    els.activeUserSelect.innerHTML = selectable.map(user => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}${user.active ? '' : ' (inactivo)'}</option>`).join('');
    els.activeUserSelect.value = state.activeUserId;
    els.activeUserSelect.onchange = e => {
      state.activeUserId = e.target.value;
      sessionStorage.setItem('inmoremates-active-user', state.activeUserId);
      render();
    };
  }

  function render() {
    state.tasks = T.tasks();
    const normalizedTasks = state.tasks;
    const userTasks = normalizedTasks.filter(task => T.isAssignedTo(task, state.activeUserId));
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
      checkbox.addEventListener('change', () => {
        const task = state.tasks.find(item => item.id === checkbox.dataset.taskCheck);
        if (!task || !completeTask(task)) {
          checkbox.checked = task?.status === 'completed';
          return;
        }
        render();
      });
    });
    bindListActions();
  }

  // Completar una tarea avanza el workflow de su remate; la siguiente tarea le aparece a quien corresponda.
  function completeTask(task) {
    if (task.needsBoard) {
      notify('El resultado se elige en el flujo del remate. Usa «Ver remate».', 'error');
      return false;
    }
    if (task.status === 'blocked') {
      notify('Debe resolver el bloqueo antes de completar esta tarea.', 'error');
      return false;
    }
    const remate = T.complete(task);
    if (!remate) {
      notify('La tarea ya no es la actual de su remate.', 'error');
      return false;
    }
    notify(`Tarea completada. El remate pasa a «${remate.stage}».`);
    return true;
  }

  function openTaskModal(taskId) {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) return;
    if (task.needsBoard) {
      openWorkflowTaskNotice(task);
      return;
    }
    if (task.step === 3) {
      openValeVistaModal(task);
      return;
    }
    if (task.step === 2 && task.status !== 'completed') {
      openAssignmentModal(task);
      return;
    }

    els.taskModal.querySelector('.task-modal-dialog').className = 'task-modal-dialog';
    const user = getUserById(task.assignedUserId);
    const shownStatus = getTaskState(task);
    const status = statusMeta[shownStatus]?.label || 'Pendiente';
    const property = taskPropertySummary(task);
    const priority = priorityMeta[task.priority]?.label || 'Normal';
    const locked = task.status === 'completed' ? 'disabled' : '';
    els.taskModalContent.innerHTML = `
      <div class="task-modal-body">
        <div class="task-modal-header">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <div class="meta-row">
              <span class="task-type">${escapeHtml(task.type)}</span>
              <span class="task-priority ${priorityMeta[task.priority]?.className || 'normal'}">${priority}</span>
              <span class="task-status ${shownStatus}">${status}</span>
            </div>
          </div>
        </div>

        <div class="task-modal-summary">
          <div class="task-summary-card">
            <strong>Remate</strong>
            <span>${escapeHtml(property.title)}</span>
          </div>
          <div class="task-summary-card">
            <strong>Responsable</strong>
            <span>${escapeHtml(user.name)}</span>
          </div>
          <div class="task-summary-card">
            <strong>Vencimiento</strong>
            <span>${escapeHtml(task.dueText)}</span>
          </div>
          <div class="task-summary-card">
            <strong>Ubicación</strong>
            <span>${escapeHtml(property.place)}</span>
          </div>
        </div>

        <div class="task-modal-description">
          ${escapeHtml(task.description || 'No hay descripción disponible para esta tarea.')}
        </div>

        <form class="task-form" id="taskForm">
          <div class="task-form-row">
            <label>
              Estado
              <select name="status" ${locked}>
                <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>En curso</option>
                <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Bloqueada</option>
                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completada</option>
              </select>
            </label>
            <label>
              Responsable
              <select name="assignedUserId" ${locked}>
                ${state.users.filter(item => item.active || item.id === task.assignedUserId).map(item => `<option value="${escapeHtml(item.id)}" ${item.id === task.assignedUserId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
              </select>
            </label>
          </div>

          <label>
            Suplente (opcional)
            <select name="substituteUserId" ${locked}>
              <option value="">Sin suplente</option>
              ${state.users.filter(item => item.active || item.id === task.substituteUserId).map(item => `<option value="${escapeHtml(item.id)}" ${item.id === task.substituteUserId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
            </select>
          </label>

          <label>
            Descripción
            <textarea name="description" ${locked}>${escapeHtml(task.description)}</textarea>
          </label>

          <div class="task-modal-actions">
            ${locked ? '' : '<button type="submit" class="primary-action">Guardar cambios</button>'}
            <a class="secondary-action" href="hello.html?id=${task.propertyId}">Ver remate</a>
            <button type="button" class="secondary-action" data-close-task-modal="true">Cerrar</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('taskForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const status = formData.get('status');
      const description = String(formData.get('description') || '').trim();
      if (!description) {
        notify('Completa la descripción antes de guardar.', 'error');
        return;
      }
      // Tipo, prioridad y plazo no se editan: salen del remate. Aquí solo se guarda lo propio de la tarea.
      T.saveNote(task, {
        status: status === 'in_progress' || status === 'blocked' ? status : null,
        assignedUserId: formData.get('assignedUserId'),
        substituteUserId: formData.get('substituteUserId') || '',
        description
      });
      if (status === 'completed') {
        if (!completeTask(task)) return;
      } else {
        notify('Tarea guardada con éxito');
      }
      closeTaskModal();
      render();
    });

    showTaskModal();
  }

  // Tareas que no se resuelven aquí (elegir el resultado del remate): se explica y se enlaza al flujo.
  function openWorkflowTaskNotice(task) {
    els.taskModalContent.innerHTML = `
      <div class="task-modal-body">
        <header class="task-modal-header">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <span class="task-type">${escapeHtml(task.type)}</span>
          </div>
        </header>
        ${renderPropertySummary(task)}
        <div class="workflow-task-notice" role="status">
          El resultado del remate se registra desde su flujo, donde se elige la rama y se ven sus dependencias. No se modifica desde Mis tareas.
        </div>
        <div class="task-modal-actions">
          <a class="workflow-task-link" href="hello.html?id=${task.propertyId}">Abrir remate en Workflow</a>
          <button type="button" class="secondary-action" data-close-task-modal="true">Cerrar</button>
        </div>
      </div>
    `;
    showTaskModal();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function getRelatedProperty(task) {
    return window.RematesData?.items.find(item => item.id === Number(task.propertyId)) || null;
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

  function showTaskModal(modalClass = '') {
    const dialog = els.taskModal.querySelector('.task-modal-dialog');
    dialog.className = `task-modal-dialog${modalClass ? ` ${modalClass}` : ''}`;
    els.taskModal.classList.remove('hidden');
    els.taskModal.setAttribute('aria-hidden', 'false');
    els.taskModal.querySelectorAll('[data-close-task-modal]').forEach(button => {
      button.onclick = closeTaskModal;
    });
  }

  // Con role, ofrece solo a los usuarios activos de ese rol (si hay alguno).
  function getActiveUserOptions(selectedId = '', role = '') {
    const active = state.users.filter(user => user.active);
    const ofRole = active.filter(user => !role || window.RematesData.userRoles[user.role] === role);
    return `<option value="">Selecciona una persona</option>${(ofRole.length ? ofRole : active).map(user =>
      `<option value="${escapeHtml(user.id)}" ${user.id === selectedId ? 'selected' : ''}>${escapeHtml(user.name)} · ${escapeHtml(user.role)}</option>`
    ).join('')}`;
  }

  function openValeVistaModal(task) {
    const property = taskPropertySummary(task);
    const previous = task.notes.valeVistaRequest || {};
    const remate = getRelatedProperty(task);
    const defaultDateTime = `${property.iso}T${property.time || '10:00'}`;
    const guaranteeAmount = previous.amount ?? (remate ? Math.round(remate.minimum) / 10 : '');
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
              <label>Monto garantía (MM$)
                <input name="amount" type="number" min="1" step="any" value="${escapeHtml(guaranteeAmount)}" placeholder="Monto en MM$" required>
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
              <span>Propiedad: ${escapeHtml(property.title)} · Garantía: MM$ ${escapeHtml(guaranteeAmount === '' ? '—' : guaranteeAmount)}</span>
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
      T.saveNote(task, { valeVistaRequest: { ...request, generatedAt: new Date().toISOString() } });
      notify('Carta generada en modo demostración; no se creó un PDF real.');
      closeTaskModal();
    });

    document.querySelector('[data-send-letter]').addEventListener('click', () => {
      const request = readRequest(true);
      if (!request) return;
      T.saveNote(task, { valeVistaRequest: { ...request, generatedAt: new Date().toISOString(), sentAt: new Date().toISOString() } });
      notify('Envío simulado: no se envió ningún correo real.');
      closeTaskModal();
    });

    showTaskModal('is-letter-modal');
  }

  const DEMO_ASSIGNMENT_CONFLICTS = [
    { propertyId: 9001, title: 'Casa Parque Norte 340', place: 'Ñuñoa', iso: '2025-10-22', time: '09:00', bidderId: 'u4' }
  ];

  // Un postor no puede tener dos remates a la misma hora: se compara contra los demás remates abiertos.
  function findBidderConflict(task, bidderId) {
    const remate = getRelatedProperty(task);
    if (!remate || !bidderId) return null;
    const sameSlot = other => other.iso === remate.iso && other.time === remate.time;
    return DEMO_ASSIGNMENT_CONFLICTS.find(other => other.bidderId === bidderId && sameSlot(other))
      || window.RematesData.items.find(other => other.id !== remate.id && other.postorId === bidderId && sameSlot(other) && window.RematesData.currentTask(other))
      || null;
  }

  // El gestor y el postor se guardan en el remate: desde ahí se reparten sus tareas.
  function openAssignmentModal(task) {
    const property = taskPropertySummary(task);
    const remate = getRelatedProperty(task) || {};
    const assignment = { managerId: remate.gestorId, managerBackupId: remate.gestorBackupId, bidderId: remate.postorId, bidderBackupId: remate.postorBackupId };

    els.taskModalContent.innerHTML = `
      <div class="task-modal-body action-modal-body assignment-modal-body">
        <header class="action-modal-header">
          <h2>Asignar gestor y postor</h2>
        </header>
        ${renderPropertySummary(task)}

        <form class="action-modal-form" id="assignmentForm" novalidate>
          <section class="action-modal-section assignment-fields">
            <label>Gestor
              <select name="managerId" required>${getActiveUserOptions(assignment.managerId, 'gestor')}</select>
            </label>
            <label>Suplente Gestor
              <select name="managerBackupId" required>${getActiveUserOptions(assignment.managerBackupId, 'gestor')}</select>
            </label>
            <label>Postor
              <select name="bidderId" id="assignmentBidder" required>${getActiveUserOptions(assignment.bidderId, 'postor')}</select>
            </label>
            <div id="bidderConflict" class="assignment-conflict" role="status" aria-live="polite" hidden></div>
            <label>Suplente Postor
              <select name="bidderBackupId" required>${getActiveUserOptions(assignment.bidderBackupId, 'postor')}</select>
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
      window.RematesData.update(task.propertyId, {
        gestorId: values.managerId,
        gestorBackupId: values.managerBackupId,
        postorId: values.bidderId,
        postorBackupId: values.bidderBackupId
      });
      notify('Gestor y postor asignados al remate.');
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
    const menuButton = e.target.closest('[data-task-menu]');
    if (menuButton) {
      openTaskMenu(menuButton);
      return;
    }
    if (!e.target.closest('#taskMenu')) closeTaskMenu();
    const trigger = e.target.closest('[data-open-task]');
    if (trigger && !e.target.closest('input')) {
      openTaskModal(trigger.dataset.openTask);
    }
  });

  window.addEventListener('scroll', closeTaskMenu, true);
  window.addEventListener('resize', closeTaskMenu);

  els.taskModal.addEventListener('click', e => {
    if (e.target.dataset.closeTaskModal === 'true') closeTaskModal();
  });

  if (!state.users.some(user => user.active)) {
    state.users[0].active = true;
    persistUsers();
  }

  render();
})();
