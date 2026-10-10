(function () {
  const T = window.TareasData;

  const state = {
    users: T.loadUsers(),
    tasks: T.tasks(),
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

  function persistUsers() {
    T.saveUsers(state.users);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function notify(message, type = 'success') {
    els.usersToast.textContent = message;
    els.usersToast.classList.remove('show');
    void els.usersToast.offsetWidth;
    els.usersToast.classList.add('show');
    els.usersToast.style.background = type === 'error' ? '#ef1d2d' : '#181817';
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => els.usersToast.classList.remove('show'), 2200);
  }

  function getRoleOptions() {
    return Array.from(new Set(state.users.map(user => user.role))).sort();
  }

  // Usa el mismo criterio de estado que Mis tareas (T.taskState), para que los números coincidan.
  function getTaskSummary(userId) {
    return state.tasks.reduce((summary, task) => {
      if (!T.isAssignedTo(task, userId)) return summary;
      const status = T.taskState(task);
      summary.total += 1;
      if (status !== 'completed') summary.open += 1;
      if (status === 'late') summary.late += 1;
      return summary;
    }, { total: 0, open: 0, late: 0 });
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
                    <img class="user-avatar" src="${escapeHtml(user.avatar || 'https://i.pravatar.cc/80?img=47')}" alt="">
                    <div>
                      ${escapeHtml(user.name)}
                    </div>
                  </div>
                </td>
                <td>
                  <span class="user-email">${escapeHtml(user.email)}</span>
                </td>
                <td><span class="user-role-badge">${escapeHtml(user.role)}</span></td>
                <td>${escapeHtml(user.team)}</td>
                <td><span class="user-status-badge ${user.active ? 'active' : 'inactive'}">${user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td><span class="user-kpi">${summary.total}<small>total</small></span></td>
                <td><span class="user-kpi">${summary.open}<small>${summary.late ? `pendientes · ${summary.late} ${summary.late === 1 ? 'atrasada' : 'atrasadas'}` : 'pendientes'}</small></span></td>
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
              <input name="name" value="${escapeHtml(user.name)}" required>
            </label>
            <label>
              Correo electrónico
              <input name="email" type="email" value="${escapeHtml(user.email)}" required>
            </label>
            <label>
              Rol
              <select name="role">
                ${T.ROLES.map(role => `<option value="${role}" ${role === user.role ? 'selected' : ''}>${role}</option>`).join('')}
              </select>
            </label>
            <label>
              Equipo o área
              <input name="team" value="${escapeHtml(user.team)}" required>
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

  // Las tareas salen del workflow de los remates; reasignar una cambia también el responsable que muestra el tablero.
  function openUserView(userId) {
    const user = state.users.find(item => item.id === userId);
    if (!user) return;
    const tasks = state.tasks.filter(task => T.isAssignedTo(task, userId));
    const roleIn = task => task.assignedUserId === userId ? 'responsible' : 'substitute';
    // El usuario actual siempre aparece en la lista, aunque esté inactivo, para que el selector muestre el valor real.
    const assignable = state.users.filter(u => u.active || u.id === user.id);
    const detail = tasks.length ? tasks.map(task => `
      <li style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
        <div>
          <strong>${escapeHtml(task.title)}</strong><br>
          <span>${escapeHtml(task.propertyTitle)} · ${T.STATUS_LABEL[task.status]} · ${roleIn(task) === 'substitute' ? 'Suplente' : 'Responsable'}</span>
        </div>
        ${task.status === 'completed' ? '' : `<label style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;color:var(--users-muted);">Reasignar</span>
          <select data-reassign-task="${escapeHtml(task.id)}" data-assignee-role="${roleIn(task)}">
            ${assignable.map(u => `<option value="${escapeHtml(u.id)}" ${u.id === user.id ? 'selected' : ''}>${escapeHtml(u.name)}</option>`).join('')}
          </select>
        </label>`}
      </li>
    `).join('') : '<li>No tiene tareas asignadas.</li>';
    els.userModalContent.innerHTML = `
      <div class="user-modal-content">
        <h2>Detalle del usuario</h2>
        <div class="user-form">
          <div class="user-form-grid">
            <label>Nombre<input value="${escapeHtml(user.name)}" readonly></label>
            <label>Correo<input value="${escapeHtml(user.email)}" readonly></label>
            <label>Rol<input value="${escapeHtml(user.role)}" readonly></label>
            <label>Equipo<input value="${escapeHtml(user.team)}" readonly></label>
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
        const task = state.tasks.find(item => item.id === e.target.dataset.reassignTask);
        if (!task) return;
        T.saveNote(task, e.target.dataset.assigneeRole === 'substitute' ? { substituteUserId: e.target.value } : { assignedUserId: e.target.value });
        notify('Tarea reasignada correctamente');
        render();
        closeUserModal();
      });
    });
    openUserModal();
  }

  function toggleUser(userId) {
    const user = state.users.find(item => item.id === userId);
    if (!user) return;
    if (!user.active) {
      user.active = true;
      persistUsers();
      notify('Usuario activado');
      render();
      return;
    }
    // Confirmación propia, igual que el resto de los modales de la maqueta.
    const open = getTaskSummary(user.id).open;
    els.userModalContent.innerHTML = `
      <div class="user-modal-content">
        <h2>Desactivar usuario</h2>
        <p class="user-confirm-text">¿Desactivar a <strong>${escapeHtml(user.name)}</strong>? ${open ? `Tiene ${open} ${open === 1 ? 'tarea abierta' : 'tareas abiertas'}: las de los remates donde es gestor o postor quedan a su nombre hasta reasignarlas; las demás pasan a otro usuario activo de su rol.` : 'No tiene tareas abiertas.'}</p>
        <div class="user-form-actions">
          <button type="button" class="secondary" data-close-user-modal="true">Cancelar</button>
          <button type="button" class="primary danger" id="confirmDeactivate">Desactivar</button>
        </div>
      </div>
    `;
    document.getElementById('confirmDeactivate').addEventListener('click', () => {
      user.active = false;
      persistUsers();
      closeUserModal();
      notify('Usuario desactivado');
      render();
    });
    openUserModal();
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
                ${T.ROLES.map(role => `<option value="${role}">${role}</option>`).join('')}
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
    state.tasks = T.tasks();
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
