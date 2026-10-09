// Tareas de Mis tareas y del Gestor de usuarios.
// No hay una lista propia: cada tarea se arma desde el workflow del remate (window.RematesData),
// así que completarla aquí avanza el remate y avanzar el remate en el tablero cambia las tareas.
(function () {
  const R = window.RematesData;
  // «Hoy» de la maqueta. Está fijo porque todos los datos son de octubre de 2025.
  const NOW = new Date('2025-10-16T18:00:00');
  const TODAY = '2025-10-16';
  const week = R.weekRange(0);
  const inThisWeek = task => task.dueDate >= week.from && task.dueDate <= week.to;

  // base es la tarea del workflow (R.currentTask o R.lastDoneTask); note son los ajustes guardados para esa tarea.
  function buildTask(item, base, completed) {
    const note = (item.taskNotes || {})[base.key] || {};
    // Suplente: el elegido a mano para la tarea o, si no, el suplente del gestor o postor del remate.
    const backupId = note.substituteUserId ?? (base.role === 'gestor' ? item.gestorBackupId : base.role === 'postor' ? item.postorBackupId : '');
    const substitute = R.users().find(user => user.id === backupId);
    const status = completed ? 'completed'
      : item.status === 'SUSPENDIDO' || note.status === 'blocked' ? 'blocked'
      : item.status === 'ATRASADO' ? 'late'
      : note.status === 'in_progress' ? 'in_progress' : 'pending';
    const priority = completed ? 'normal'
      : item.status === 'ATRASADO' ? 'critical'
      : item.status === 'ALERTA' ? 'urgent'
      : item.iso >= week.from && item.iso <= week.to ? 'upcoming' : 'normal';
    return {
      id: `${item.id}:${base.key}`,
      key: base.key,
      step: base.step || null,
      needsBoard: Boolean(base.needsBoard),
      propertyId: item.id,
      propertyTitle: item.title,
      propertyPlace: item.place,
      title: base.title,
      description: note.description || base.desc,
      type: base.type,
      assignedUserId: R.taskUser(item, base).id,
      substituteUserId: substitute ? substitute.id : '',
      // El plazo sale de dueAt del remate (fecha y hora de la tarea actual); sin él, de la fecha del remate.
      dueAt: completed ? null : item.dueAt || null,
      dueDate: !completed && item.dueAt ? item.dueAt.slice(0, 10) : item.iso,
      dueTime: !completed && item.dueAt ? item.dueAt.slice(11, 16) : item.time,
      dueText: completed ? 'Completada' : item.due,
      priority,
      status,
      notes: note
    };
  }

  // Por cada remate: su tarea actual (si sigue abierto) y la última que se completó.
  function tasks() {
    return R.items.flatMap(item => {
      const current = R.currentTask(item);
      const done = R.lastDoneTask(item);
      return [current && buildTask(item, current, false), done && buildTask(item, done, true)].filter(Boolean);
    });
  }

  // Completa la tarea solo si sigue siendo la actual del remate. Devuelve el remate actualizado o null.
  function complete(task) {
    const item = R.items.find(x => x.id === task.propertyId);
    const current = item && R.currentTask(item);
    if (!current || current.key !== task.key) return null;
    return R.completeCurrent(item.id);
  }

  // Guarda ajustes de una tarea (estado en curso o bloqueada, responsable, descripción, carta Vale Vista) en su remate.
  function saveNote(task, note) {
    const item = R.items.find(x => x.id === task.propertyId);
    if (!item) return null;
    const notes = item.taskNotes || {};
    return R.update(item.id, { taskNotes: { ...notes, [task.key]: { ...(notes[task.key] || {}), ...note } } });
  }

  window.TareasData = {
    NOW,
    TODAY,
    STATUS_LABEL: { pending: 'Pendiente', in_progress: 'En curso', completed: 'Completada', late: 'Atrasada', blocked: 'Bloqueada' },
    ROLES: Object.keys(R.userRoles),
    loadUsers: R.users,
    saveUsers: R.saveUsers,
    tasks,
    complete,
    saveNote,
    taskState: task => task.status,
    // Una tarea es de un usuario si es su responsable o su suplente.
    isAssignedTo: (task, userId) => task.assignedUserId === userId || task.substituteUserId === userId,
    inThisWeek
  };
})();
