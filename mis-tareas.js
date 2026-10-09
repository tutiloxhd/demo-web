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
  const taskDefaults = [
    { id: 'task-101', title: 'Validar documentación', description: 'Revisar el conjunto de documentos del remate y confirmar que estén vigentes y completos antes del envío.', propertyTitle: 'Casa Los Alerces 1450', propertyPlace: 'Las Condes', propertyId: 1, assignedUserId: 'u1', dueDate: '2025-10-13', dueTime: '14:00', priority: 'critical', status: 'late', type: 'Documentación', workflowStage: 9, createdAt: '2025-10-10T09:15:00', completedAt: null, completed: false },
    { id: 'task-102', title: 'Enviar carta al banco', description: 'Solicitar información al banco para confirmar la disponibilidad y los requisitos del préstamo.', propertyTitle: 'Depto. San Martín 588', propertyPlace: 'Santiago Centro', propertyId: 2, assignedUserId: 'u2', dueDate: '2025-10-14', dueTime: '15:30', priority: 'urgent', status: 'pending', type: 'Financiamiento', workflowStage: 5, createdAt: '2025-10-09T10:00:00', completedAt: null, completed: false },
    { id: 'task-103', title: 'Preparar sala virtual', description: 'Conectar la sala virtual y validar que el equipo de participación esté listo.', propertyTitle: 'Casa El Roble 972', propertyPlace: 'Ñuñoa', propertyId: 3, assignedUserId: 'u3', dueDate: '2025-10-15', dueTime: '11:30', priority: 'urgent', status: 'in_progress', type: 'Participación', workflowStage: 13, createdAt: '2025-10-09T08:40:00', completedAt: null, completed: false },
    { id: 'task-104', title: 'Revisar formulario de postulación', description: 'Confirmar que los datos del formulario coinciden con la documentación adjunta y con la oferta.', propertyTitle: 'Casa Valle Alegre 321', propertyPlace: 'La Florida', propertyId: 4, assignedUserId: 'u4', dueDate: '2025-10-15', dueTime: '16:00', priority: 'upcoming', status: 'pending', type: 'Participación', workflowStage: 6, createdAt: '2025-10-08T12:00:00', completedAt: null, completed: false },
    { id: 'task-105', title: 'Actualizar cartera de garantías', description: 'Registrar los montos vigentes de la garantía y su estado financiero.', propertyTitle: 'Depto. Parque 1234', propertyPlace: 'Providencia', propertyId: 5, assignedUserId: 'u2', dueDate: '2025-10-17', dueTime: '10:00', priority: 'normal', status: 'completed', type: 'Garantías', workflowStage: 12, createdAt: '2025-10-07T09:45:00', completedAt: '2025-10-16T12:00:00', completed: true },
    { id: 'task-106', title: 'Revisión legal final', description: 'Cargar el informe final de legal y confirmar que no quedan observaciones pendientes.', propertyTitle: 'Casa Mirador 777', propertyPlace: 'Peñalolén', propertyId: 6, assignedUserId: 'u5', dueDate: '2025-10-16', dueTime: '14:30', priority: 'urgent', status: 'blocked', type: 'Legal', workflowStage: 11, createdAt: '2025-10-06T11:00:00', completedAt: null, completed: false },
    { id: 'task-107', title: 'Verificar disponibilidad de título', description: 'Solicitar y validar la documentación de dominio antes del remate.', propertyTitle: 'Terreno El Arrayán', propertyPlace: 'Lo Barnechea', propertyId: 7, assignedUserId: 'u1', dueDate: '2025-10-17', dueTime: '12:00', priority: 'upcoming', status: 'pending', type: 'Legal', workflowStage: 12, createdAt: '2025-10-07T15:30:00', completedAt: null, completed: false },
    { id: 'task-108', title: 'Revisión de antecedentes', description: 'Revisar y confirmar antecedentes del vehículo y del propietario para la operación.', propertyTitle: 'Casa Los Hualtatas 5210', propertyPlace: 'Vitacura', propertyId: 8, assignedUserId: 'u3', dueDate: '2025-10-14', dueTime: '11:00', priority: 'normal', status: 'blocked', type: 'Legal', workflowStage: 7, createdAt: '2025-10-05T08:10:00', completedAt: null, completed: false },
    { id: 'task-109', title: 'Actualizar entrada de evento', description: 'Confirmar la participación con la sala y documentar el acceso del equipo.', propertyTitle: 'Depto. Los Leones 890', propertyPlace: 'Providencia', propertyId: 9, assignedUserId: 'u4', dueDate: '2025-10-17', dueTime: '09:30', priority: 'normal', status: 'pending', type: 'Participación', workflowStage: 11, createdAt: '2025-10-08T11:00:00', completedAt: null, completed: false },
    { id: 'task-110', title: 'Solicitar Vale Vista', description: 'Actualizar la solicitud de Vale Vista para la venta pública del inmueble.', propertyTitle: 'Casa Los Trapenses 2140', propertyPlace: 'Lo Barnechea', propertyId: 10, assignedUserId: 'u2', dueDate: '2025-10-20', dueTime: '10:30', priority: 'upcoming', status: 'pending', type: 'Documentación', workflowStage: 3, createdAt: '2025-10-08T16:00:00', completedAt: null, completed: false },
    { id: 'task-111', title: 'Revisar carta al banco', description: 'Confirmar la recepción de la carta y su contenido para la próxima semana.', propertyTitle: 'Depto. Irarrázaval 3050', propertyPlace: 'Ñuñoa', propertyId: 11, assignedUserId: 'u1', dueDate: '2025-10-21', dueTime: '12:00', priority: 'urgent', status: 'pending', type: 'Financiamiento', workflowStage: 5, createdAt: '2025-10-10T07:30:00', completedAt: null, completed: false },
    { id: 'task-112', title: 'Preparar asignación de gestor', description: 'Validar la asignación del gestor y del postor para la próxima subasta.', propertyTitle: 'Casa Camino El Alba 9120', propertyPlace: 'Las Condes', propertyId: 12, assignedUserId: 'u2', dueDate: '2025-10-22', dueTime: '09:00', priority: 'critical', status: 'late', type: 'Gestión', workflowStage: 2, createdAt: '2025-10-09T10:55:00', completedAt: null, completed: false },
    { id: 'task-113', title: 'Confirmar requerimientos de formulario', description: 'Verificar que la información del formulario sea consistente con la documentación entregada.', propertyTitle: 'Parcela Chicureo 18', propertyPlace: 'Colina', propertyId: 13, assignedUserId: 'u3', dueDate: '2025-10-22', dueTime: '15:00', priority: 'upcoming', status: 'pending', type: 'Participación', workflowStage: 6, createdAt: '2025-10-08T09:15:00', completedAt: null, completed: false },
    { id: 'task-114', title: 'Coordinar revisión legal', description: 'Revisar la revisión legal y dar continuidad a la próxima etapa.', propertyTitle: 'Depto. Av. Matta 455', propertyPlace: 'Santiago Centro', propertyId: 14, assignedUserId: 'u5', dueDate: '2025-10-23', dueTime: '11:00', priority: 'normal', status: 'completed', type: 'Legal', workflowStage: 4, createdAt: '2025-10-03T15:00:00', completedAt: '2025-10-21T11:00:00', completed: true },
    { id: 'task-115', title: 'Validar entrega del expediente', description: 'Verificar que todas las piezas del expediente estén disponibles para la revisión.', propertyTitle: 'Casa Los Dominicos 730', propertyPlace: 'Las Condes', propertyId: 15, assignedUserId: 'u4', dueDate: '2025-10-24', dueTime: '16:30', priority: 'urgent', status: 'pending', type: 'Documentación', workflowStage: 7, createdAt: '2025-10-11T12:00:00', completedAt: null, completed: false },
    { id: 'task-116', title: 'Seguimiento de adjudicación', description: 'Revisar el cierre del proceso y responder las solicitudes pendientes del cliente.', propertyTitle: 'Casa Pedro de Valdivia 2480', propertyPlace: 'Providencia', propertyId: 16, assignedUserId: 'u1', dueDate: '2025-10-06', dueTime: '10:00', priority: 'normal', status: 'completed', type: 'Cierre', workflowStage: 16, createdAt: '2025-10-05T09:00:00', completedAt: '2025-10-06T12:00:00', completed: true }
  ];

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

  function getStoredUsers() {
    const saved = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_USERS;
  }

  function getStoredTasks() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
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
    const formatter = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = timeString ? new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '';
    return `${formatter.format(date)}${time ? ' · ' + time : ''}`;
  }

  function getUserById(userId) {
    return state.users.find(user => user.id === userId) || { name: 'Sin asignación', email: '', role: 'Sin rol', team: 'Sin área', active: true };
  }

  function getTaskState(task) {
    const taskDate = new Date(`${task.dueDate}T${task.dueTime || '00:00'}:00`);
    const now = new Date('2025-10-16T18:00:00');
    const isLate = task.status !== 'completed' && task.status !== 'blocked' && taskDate.getTime() < now.getTime();
    if (task.status === 'completed') return 'completed';
    if (task.status === 'blocked') return 'blocked';
    if (isLate) return 'late';
    if (task.status === 'in_progress') return 'in_progress';
    return 'pending';
  }

  function normalizeTask(task) {
    const status = getTaskState(task);
    return { ...task, status };
  }

  function activeUserTasks() {
    return state.tasks
      .map(normalizeTask)
      .filter(task => task.assignedUserId === state.activeUserId && task.status !== 'completed' ? true : task.assignedUserId === state.activeUserId);
  }

  function filterTasks(tasks) {
    const search = state.search.trim().toLowerCase();
    return tasks.filter(task => {
      const user = getUserById(task.assignedUserId);
      const haystack = [task.title, task.propertyTitle, task.propertyPlace, user.name, task.type, task.status].join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesQuick = state.quickFilter === 'all' || filterByQuick(task, state.quickFilter);
      const matchesStatus = state.statusFilter === 'all' || task.status === state.statusFilter;
      const matchesType = state.typeFilter === 'all' || task.type === state.typeFilter;
      return matchesSearch && matchesQuick && matchesStatus && matchesType;
    });
  }

  function filterByQuick(task, key) {
    const now = new Date('2025-10-16T18:00:00');
    const due = new Date(`${task.dueDate}T${task.dueTime || '00:00'}:00`);
    switch (key) {
      case 'today':
        return task.dueDate === '2025-10-16';
      case 'late':
        return task.status === 'late';
      case 'week':
        return due.getTime() <= new Date('2025-10-22T23:59:59').getTime() && due.getTime() >= new Date('2025-10-13T00:00:00').getTime();
      case 'completed':
        return task.status === 'completed';
      default:
        return true;
    }
  }

  function updateMetrics(tasks) {
    const active = tasks.filter(task => task.assignedUserId === state.activeUserId);
    const metrics = [
      { key: 'all', label: 'Tareas activas', icon: 'flag', className: 'blue', value: active.filter(t => t.status !== 'completed').length },
      { key: 'late', label: 'Tareas atrasadas', icon: 'clock', className: 'red', value: active.filter(t => t.status === 'late').length },
      { key: 'today', label: 'Vencen hoy', icon: 'alert', className: 'amber', value: active.filter(t => t.dueDate === '2025-10-16').length },
      { key: 'week', label: 'Vencen esta semana', icon: 'calendar', className: 'green', value: active.filter(t => {
        const due = new Date(`${t.dueDate}T${t.dueTime || '00:00'}:00`);
        return due >= new Date('2025-10-13T00:00:00') && due <= new Date('2025-10-22T23:59:59');
      }).length }
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
      { key: 'late', title: 'Tareas atrasadas', predicate: task => task.status === 'late' },
      { key: 'critical', title: 'Tareas críticas', predicate: task => task.priority === 'critical' && task.status !== 'completed' },
      { key: 'today', title: 'Tareas próximas / hoy', predicate: task => task.dueDate === '2025-10-16' && task.status !== 'completed' },
      { key: 'week', title: 'Tareas de esta semana', predicate: task => {
        const due = new Date(`${task.dueDate}T${task.dueTime || '00:00'}:00`);
        return task.status !== 'completed' && due >= new Date('2025-10-13T00:00:00') && due <= new Date('2025-10-22T23:59:59');
      } },
      { key: 'completed', title: 'Tareas completadas', predicate: task => task.status === 'completed' }
    ];

    const html = groups.map(group => {
      const items = tasks.filter(group.predicate);
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
    const user = getUserById(task.assignedUserId);
    return `
      <div class="task-item">
        <input class="task-checkbox" type="checkbox" data-task-check="${task.id}" ${task.status === 'completed' ? 'checked' : ''}>
        <div class="task-main">
          <span class="task-title">${task.title}</span>
          <span class="task-property">${task.propertyTitle} · ${task.propertyPlace}</span>
        </div>
        <div class="task-meta">
          <strong>Ubicación</strong>
          ${task.propertyPlace}
        </div>
        <div class="task-meta">
          <strong>Vencimiento</strong>
          ${formatDate(task.dueDate, task.dueTime)}
        </div>
        <div class="task-meta">
          <strong>Responsable</strong>
          ${user.name}
        </div>
        <div class="task-type">${task.type}</div>
        <div class="task-status ${statusMeta[task.status]?.label ? task.status : 'pending'}">${statusMeta[task.status]?.label || 'Pendiente'}</div>
        <div class="task-priority ${priorityMeta[task.priority]?.className || 'normal'}">${priorityMeta[task.priority]?.label || 'Normal'}</div>
        <div class="task-actions">
          <button type="button" class="task-open-btn" data-open-task="${task.id}">Abrir tarea</button>
          <button type="button" class="task-action-menu" data-open-task="${task.id}" aria-label="Más acciones">⋯</button>
        </div>
      </div>
    `;
  }

  function renderUpcoming() {
    const items = state.tasks
      .map(normalizeTask)
      .filter(task => task.assignedUserId === state.activeUserId && task.status !== 'completed')
      .sort((a, b) => new Date(`${a.dueDate}T${a.dueTime || '00:00'}:00`) - new Date(`${b.dueDate}T${b.dueTime || '00:00'}:00`))
      .slice(0, 4);

    if (!items.length) {
      els.upcomingList.innerHTML = '<div class="empty-state-box">Sin vencimientos próximos.</div>';
      return;
    }

    els.upcomingList.innerHTML = items.map(task => `
      <div class="task-mini-item" data-open-task="${task.id}">
        <span class="icon-wrap"><svg class="icon"><use href="#clock" /></svg></span>
        <div>
          <strong>${task.title}</strong>
          <small>${task.propertyTitle}</small>
          <small>${task.dueTime} · ${task.priority}</small>
        </div>
        <span class="task-priority ${priorityMeta[task.priority]?.className || 'normal'} priority-pill">${priorityMeta[task.priority]?.label || 'Normal'}</span>
      </div>
    `).join('');
  }

  function renderWorkload() {
    const tasks = state.tasks.filter(task => task.assignedUserId === state.activeUserId);
    const totals = {
      pending: tasks.filter(task => task.status === 'pending').length,
      in_progress: tasks.filter(task => task.status === 'in_progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      late: tasks.filter(task => task.status === 'late').length,
      blocked: tasks.filter(task => task.status === 'blocked').length
    };
    const total = tasks.length || 1;
    const rows = [
      { label: 'Pendientes', value: totals.pending, color: '#1268f3' },
      { label: 'En curso', value: totals.in_progress, color: '#6b43d6' },
      { label: 'Completadas', value: totals.completed, color: '#078b43' },
      { label: 'Atrasadas', value: totals.late, color: '#ef1d2d' },
      { label: 'Bloqueadas', value: totals.blocked, color: '#57657d' }
    ];

    const typeCounts = Object.entries(
      tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {})
    );

    const typeHtml = typeCounts.length ? typeCounts.map(([label, count]) => `
      <div class="workload-row">
        <span>${label}</span>
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
          ${rows.map(row => `
            <div class="workload-row">
              <span>${row.label}</span>
              <div class="bar-track"><span class="bar-fill" style="width:${(row.value / total) * 100}%;background:${row.color};"></span></div>
              <strong>${row.value}</strong>
            </div>
          `).join('')}
        </div>
        <div>
          <h4 style="margin:0 0 10px;color:var(--task-navy);">Distribución por tipo</h4>
          ${typeHtml}
        </div>
      </div>
    `;
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
    `).join('') + '<button type="button" class="task-quick-filter clear" data-quick="all">Restablecer</button>';

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

  function renderUserSelect() {
    const activeUsers = state.users.filter(user => user.active);
    const fallbackUserId = activeUsers[0]?.id || state.users[0]?.id;
    if (!activeUsers.some(user => user.id === state.activeUserId) && fallbackUserId) {
      state.activeUserId = fallbackUserId;
    }
    els.activeUserSelect.innerHTML = activeUsers.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
    els.activeUserSelect.value = state.activeUserId;
    els.activeUserSelect.onchange = e => {
      state.activeUserId = e.target.value;
      sessionStorage.setItem('inmoremates-active-user', state.activeUserId);
      render();
    };
  }

  function render() {
    const normalizedTasks = state.tasks.map(normalizeTask);
    const userTasks = normalizedTasks.filter(task => task.assignedUserId === state.activeUserId);
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

    document.querySelectorAll('[data-open-task]').forEach(button => {
      button.addEventListener('click', () => openTaskModal(button.dataset.openTask));
    });

    document.querySelectorAll('[data-task-check]').forEach(checkbox => {
      checkbox.addEventListener('change', e => {
        const task = state.tasks.find(item => item.id === checkbox.dataset.taskCheck);
        if (!task) return;
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
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) return;
    if (task.workflowStage === 3 || /carta vale vista/i.test(task.title)) {
      openValeVistaModal(task);
      return;
    }
    if (task.workflowStage === 2 || /asignar gestor y postor/i.test(task.title)) {
      openAssignmentModal(task);
      return;
    }

    els.taskModal.querySelector('.task-modal-dialog').className = 'task-modal-dialog';
    const user = getUserById(task.assignedUserId);
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
                ${state.users.filter(user => user.active).map(user => `<option value="${user.id}" ${user.id === task.assignedUserId ? 'selected' : ''}>${user.name}</option>`).join('')}
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
        type: formData.get('type'),
        dueDate: formData.get('dueDate'),
        dueTime: formData.get('dueTime'),
        description: formData.get('description')
      };

      if (!updates.dueDate || !updates.description.trim()) {
        notify('Completa la fecha y la descripción antes de guardar.', 'error');
        return;
      }

      Object.assign(task, updates);
      if (updates.status === 'completed') {
        task.completedAt = new Date().toISOString();
        task.completed = true;
      } else {
        task.completed = false;
        task.completedAt = null;
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
