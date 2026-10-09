(function () {
  const USER_STORAGE_KEY = 'inmoremates-demo-users';
  const TASK_STORAGE_KEY = 'inmoremates-demo-tasks';
  const DEFAULT_USERS = [
    { id: 'u1', name: 'María González', email: 'maria.gonzalez@inmoremates.cl', role: 'Administrador', team: 'Dirección', active: true, avatar: 'https://i.pravatar.cc/80?img=47' },
    { id: 'u2', name: 'Juan Pérez', email: 'juan.perez@inmoremates.cl', role: 'Gestor de remates', team: 'Gestión', active: true, avatar: 'https://i.pravatar.cc/80?img=12' },
    { id: 'u3', name: 'Carla Rojas', email: 'carla.rojas@inmoremates.cl', role: 'Responsable de documentación', team: 'Documentación', active: true, avatar: 'https://i.pravatar.cc/80?img=32' },
    { id: 'u4', name: 'Diego Torres', email: 'diego.torres@inmoremates.cl', role: 'Responsable de participación', team: 'Participación', active: true, avatar: 'https://i.pravatar.cc/80?img=11' },
    { id: 'u5', name: 'Paula Díaz', email: 'paula.diaz@inmoremates.cl', role: 'Responsable de revisión legal', team: 'Legal', active: false, avatar: 'https://i.pravatar.cc/80?img=44' }
  ];

  const state = {
    users: getStoredUsers(),
    search: '',
    roleFilter: 'all',
    statusFilter: 'all'
  };

  const els = {
    tableWrap: document.getElementById('usersTableWrap'),
    userSearch: document.getElementById('userSearch'),
    userRoleFilter: document.getElementById('userRoleFilter'),
    userStatusFilter: document.getElementById('userStatusFilter'),
    newUserButton: document.getElementById('newUserButton'),
    userModal: document.getElementById('userModal'),
    userModalContent: document.getElementById('userModalContent'),
    usersToast: document.getElementById('usersToast')
  };

  function getStoredUsers() {
    const saved = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
    return DEFAULT_USERS;
  }

  function persistUsers() {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.users));
  }

  function getStoredTasks() {
    return JSON.parse(localStorage.getItem(TASK_STORAGE_KEY) || '[]');
  }

  function notify(message, type = 'success') {
    els.usersToast.textContent = message;
    els.usersToast.classList.remove('show');
    void els.usersToast.offsetWidth;
    els.usersToast.classList.add('show');
    els.usersToast.style.background = type === 'error' ? '#ef1d2d' : '#0b1f44';
    setTimeout(() => els.usersToast.classList.remove('show'), 2200);
  }

  function getRoleOptions() {
    return Array.from(new Set(state.users.map(user => user.role))).sort();
  }

  function getTaskSummary(userId) {
    const tasks = getStoredTasks();
    return tasks.reduce((summary, task) => {
      if (task.assignedUserId !== userId) return summary;
      summary.total += 1;
      if (task.status === 'completed') summary.completed += 1;
      if (task.status === 'late' || task.status === 'blocked') summary.pending += 1;
      if (task.status === 'late') summary.late += 1;
      return summary;
    }, { total: 0, pending: 0, completed: 0, late: 0 });
  }

  function renderFilters() {
    els.userRoleFilter.innerHTML = '<option value="all">Rol: todos</option>' + getRoleOptions().map(role => `<option value="${role}">${role}</option>`).join('');
    els.userRoleFilter.value = state.roleFilter;
    els.userStatusFilter.value = state.statusFilter;
  }

  function visibleUsers() {
    const query = state.search.trim().toLowerCase();
    return state.users.filter(user => {
      const haystack = [user.name, user.email, user.role, user.team].join(' ').toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesRole = state.roleFilter === 'all' || user.role === state.roleFilter;
      const matchesStatus = state.statusFilter === 'all' || (state.statusFilter === 'active' ? user.active : !user.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  function renderTable() {
    const users = visibleUsers();
    if (!users.length) {
      els.tableWrap.innerHTML = '<div class="empty-users-state">No hay usuarios con esos filtros.</div>';
      return;
    }

    els.tableWrap.innerHTML = `
      <table class="users-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Equipo</th>
            <th>Estado</th>
            <th>Tareas</th>
            <th>Pendientes / atrasadas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => {
            const summary = getTaskSummary(user.id);
            return `
              <tr>
                <td>
                  <div class="user-name">
                    <img class="user-avatar" src="${user.avatar || 'https://i.pravatar.cc/80?img=47'}" alt="${user.name}">
                    <div>
                      ${user.name}
                    </div>
                  </div>
                </td>
                <td>
                  <span class="user-email">${user.email}</span>
                </td>
                <td><span class="user-role-badge">${user.role}</span></td>
                <td>${user.team}</td>
                <td><span class="user-status-badge ${user.active ? 'active' : 'inactive'}">${user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td><span class="user-kpi">${summary.total}<small>total</small></span></td>
                <td><span class="user-kpi">${summary.pending}<small>pendientes</small></span></td>
                <td>
                  <div class="user-actions">
                    <button type="button" class="user-action-btn primary" data-user-view="${user.id}">Detalle</button>
                    <button type="button" class="user-action-btn" data-user-edit="${user.id}">Editar</button>
                    <button type="button" class="user-action-btn ${user.active ? 'warn' : ''}" data-user-toggle="${user.id}">${user.active ? 'Desactivar' : 'Activar'}</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    document.querySelectorAll('[data-user-view]').forEach(button => button.addEventListener('click', () => openUserView(button.dataset.userView)));
    document.querySelectorAll('[data-user-edit]').forEach(button => button.addEventListener('click', () => openUserEditor(button.dataset.userEdit)));
    document.querySelectorAll('[data-user-toggle]').forEach(button => button.addEventListener('click', () => toggleUser(button.dataset.userToggle)));
  }

  function openUserModal() {
    els.userModal.classList.remove('hidden');
    els.userModal.setAttribute('aria-hidden', 'false');
  }

  function closeUserModal() {
    els.userModal.classList.add('hidden');
    els.userModal.setAttribute('aria-hidden', 'true');
  }

  function openUserEditor(userId) {
    const user = state.users.find(item => item.id === userId) || null;
    if (!user) return;
    els.userModalContent.innerHTML = `
      <div class="user-modal-content">
        <h2>Editar usuario</h2>
        <form class="user-form" id="userEditorForm">
          <div class="user-form-grid">
            <label>
              Nombre completo
              <input name="name" value="${user.name}" required>
            </label>
            <label>
              Correo electrónico
              <input name="email" type="email" value="${user.email}" required>
            </label>
            <label>
              Rol
              <select name="role">
                ${['Administrador','Gestor de remates','Responsable de documentación','Responsable de participación','Responsable de revisión legal'].map(role => `<option value="${role}" ${role === user.role ? 'selected' : ''}>${role}</option>`).join('')}
              </select>
            </label>
            <label>
              Equipo o área
              <input name="team" value="${user.team}" required>
            </label>
          </div>
          <div class="user-form-actions">
            <button type="button" class="secondary" data-close-user-modal="true">Cancelar</button>
            <button type="submit" class="primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    `;
    const form = document.getElementById('userEditorForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const role = String(data.get('role') || '').trim();
      const team = String(data.get('team') || '').trim();
      if (!name || !email || !team) {
        notify('Completa los campos obligatorios.', 'error');
        return;
      }
      const duplicate = state.users.some(item => item.email.toLowerCase() === email.toLowerCase() && item.id !== userId);
      if (duplicate) {
        notify('El correo ya está asignado a otro usuario.', 'error');
        return;
      }
      user.name = name;
      user.email = email;
      user.role = role;
      user.team = team;
      persistUsers();
      notify('Usuario actualizado correctamente');
      closeUserModal();
      render();
    });
    openUserModal();
    document.querySelectorAll('[data-close-user-modal]').forEach(el => el.addEventListener('click', closeUserModal));
  }

  function openUserView(userId) {
    const user = state.users.find(item => item.id === userId);
    if (!user) return;
    const tasks = getStoredTasks().filter(task => task.assignedUserId === userId);
    const detail = tasks.length ? tasks.map(task => `
      <li style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
        <div>
          <strong>${task.title}</strong><br>
          <span>${task.type} · ${task.status}</span>
        </div>
        <label style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;color:var(--users-muted);">Reasignar</span>
          <select data-reassign-task="${task.id}">
            ${state.users.filter(u => u.active).map(u => `<option value="${u.id}" ${u.id === user.id ? 'selected' : ''}>${u.name}</option>`).join('')}
          </select>
        </label>
      </li>
    `).join('') : '<li>No tiene tareas asignadas.</li>';
    els.userModalContent.innerHTML = `
      <div class="user-modal-content">
        <h2>Detalle del usuario</h2>
        <div class="user-form">
          <div class="user-form-grid">
            <label>Nombre<input value="${user.name}" readonly></label>
            <label>Correo<input value="${user.email}" readonly></label>
            <label>Rol<input value="${user.role}" readonly></label>
            <label>Equipo<input value="${user.team}" readonly></label>
          </div>
          <div>
            <h3 style="margin:0 0 10px;color:var(--users-navy);">Tareas asignadas</h3>
            <ul style="margin:0;padding-left:18px;color:var(--users-navy);display:grid;gap:12px;">${detail}</ul>
          </div>
          <div class="user-form-actions">
            <button type="button" class="secondary" data-close-user-modal="true">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    document.querySelectorAll('[data-reassign-task]').forEach(select => {
      select.addEventListener('change', e => {
        const task = getStoredTasks().find(item => item.id === e.target.dataset.reassignTask);
        if (!task) return;
        task.assignedUserId = e.target.value;
        localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(getStoredTasks()));
        notify('Tarea reasignada correctamente');
        render();
        closeUserModal();
      });
    });
    openUserModal();
    document.querySelectorAll('[data-close-user-modal]').forEach(el => el.addEventListener('click', closeUserModal));
  }

  function toggleUser(userId) {
    const user = state.users.find(item => item.id === userId);
    if (!user) return;
    if (user.active) {
      if (!window.confirm('¿Desactivar este usuario? Se conservarán sus tareas existentes.')) return;
      user.active = false;
      notify('Usuario desactivado');
    } else {
      user.active = true;
      notify('Usuario activado');
    }
    persistUsers();
    render();
  }

  function addNewUser() {
    els.userModalContent.innerHTML = `
      <div class="user-modal-content">
        <h2>Nuevo usuario</h2>
        <form class="user-form" id="newUserForm">
          <div class="user-form-grid">
            <label>
              Nombre completo
              <input name="name" required>
            </label>
            <label>
              Correo electrónico
              <input name="email" type="email" required>
            </label>
            <label>
              Rol
              <select name="role">
                ${['Administrador','Gestor de remates','Responsable de documentación','Responsable de participación','Responsable de revisión legal'].map(role => `<option value="${role}">${role}</option>`).join('')}
              </select>
            </label>
            <label>
              Equipo o área
              <input name="team" required>
            </label>
          </div>
          <div class="user-form-actions">
            <button type="button" class="secondary" data-close-user-modal="true">Cancelar</button>
            <button type="submit" class="primary">Crear usuario</button>
          </div>
        </form>
      </div>
    `;
    const form = document.getElementById('newUserForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const role = String(data.get('role') || '').trim();
      const team = String(data.get('team') || '').trim();
      if (!name || !email || !team) {
        notify('Completa los campos obligatorios.', 'error');
        return;
      }
      const duplicate = state.users.some(user => user.email.toLowerCase() === email.toLowerCase());
      if (duplicate) {
        notify('El correo ya existe en el gestor.', 'error');
        return;
      }
      const nextUser = {
        id: `u${Date.now()}`,
        name,
        email,
        role,
        team,
        active: true,
        avatar: `https://i.pravatar.cc/80?img=${Math.floor(Math.random() * 70) + 1}`
      };
      state.users.push(nextUser);
      persistUsers();
      closeUserModal();
      notify('Usuario creado con éxito');
      render();
    });
    openUserModal();
    document.querySelectorAll('[data-close-user-modal]').forEach(el => el.addEventListener('click', closeUserModal));
  }

  function render() {
    renderFilters();
    renderTable();
    els.userSearch.value = state.search;
  }

  els.userSearch.addEventListener('input', e => {
    state.search = e.target.value;
    render();
  });

  els.userRoleFilter.addEventListener('change', e => {
    state.roleFilter = e.target.value;
    render();
  });

  els.userStatusFilter.addEventListener('change', e => {
    state.statusFilter = e.target.value;
    render();
  });

  els.newUserButton.addEventListener('click', addNewUser);
  els.userModal.addEventListener('click', e => {
    if (e.target.dataset.closeUserModal === 'true') closeUserModal();
  });

  render();
})();
