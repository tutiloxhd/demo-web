// Navegación e íconos compartidos por todas las pantallas.
// Cada página marca dónde van con [data-side] y [data-mobile-nav]; la sección activa sale de <body data-page>.
(function () {
    const SPRITE = `<svg width="0" height="0" style="position:absolute"><defs><symbol id="home" viewBox="0 0 24 24"><path d="M3 11 12 3l9 8v9H15v-7H9v7H3z" /></symbol><symbol id="calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></symbol><symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></symbol><symbol id="bell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></symbol><symbol id="alert" viewBox="0 0 24 24"><path d="M12 3 2 21h20zM12 9v5M12 18h.01" /></symbol><symbol id="clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></symbol><symbol id="check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></symbol><symbol id="file" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" /></symbol><symbol id="users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" /></symbol><symbol id="settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19 13v-3l2-1-2-4-2 1-3-2-1-2H9L8 4 6 6 4 5 2 9l2 1v3l-2 2 2 4 2-1 2 2 1 2h4l1-2 3-2 2 1 2-4z" /></symbol><symbol id="hammer" viewBox="0 0 24 24"><path d="m14 5 5 5M12 7l5 5M3 21l9-9M5 7l4-4 8 8-4 4z" /></symbol><symbol id="chart" viewBox="0 0 24 24"><path d="M4 20V10M9 20V5M14 20v-8M19 20V3M2 20h20" /></symbol><symbol id="more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></symbol><symbol id="pause" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" /></symbol><symbol id="flame" viewBox="0 0 24 24"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" /></symbol><symbol id="tick" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></symbol><symbol id="send" viewBox="0 0 24 24"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></symbol><symbol id="bank" viewBox="0 0 24 24"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></symbol><symbol id="shield" viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /></symbol><symbol id="card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></symbol><symbol id="image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m5 18 5-5 4 4 2-2 3 3M9 9h.01" /></symbol><symbol id="icon-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></symbol><symbol id="monitor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></symbol><symbol id="folder" viewBox="0 0 24 24"><path d="M3 6h6l2 2h10v11H3z" /></symbol><symbol id="refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" /></symbol><symbol id="flag" viewBox="0 0 24 24"><path d="M5 21V4M5 4h12l-2 4 2 4H5" /></symbol><symbol id="xcircle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></symbol><symbol id="ban" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></symbol></defs></svg>`;
    const NAV = [
        { page: 'inicio', href: 'index.html', icon: 'home', label: 'Inicio' },
        { page: 'mis-tareas', href: 'mis-tareas.html', icon: 'flag', label: 'Mis tareas' },
        { page: 'semana', href: 'semana.html', icon: 'calendar', label: 'Calendario' },
        { page: 'documentos', href: 'documentos.html', icon: 'file', label: 'Documentos' },
        { page: 'reportes', href: 'reportes.html', icon: 'chart', label: 'Reportes' },
        { page: 'usuarios', href: 'gestor-usuarios.html', icon: 'users', label: 'Usuarios' }
    ];
    // Las entradas sin href son secciones que la maqueta todavía no tiene.
    const SIDE = [NAV[0], { page: 'remates', icon: 'hammer', label: 'Remates' }, NAV[1], NAV[2], NAV[3], NAV[4], null, { page: 'equipos', icon: 'users', label: 'Equipos' }, { page: 'configuracion', icon: 'settings', label: 'Configuración' }, NAV[5]];
    const icon = name => `<svg class="icon"><use href="#${name}"/></svg>`;
    const button = (item, active) => `<button type="button" class="${item.page === active ? 'active' : ''}" ${item.href ? `data-go="${item.href}"` : 'disabled'}>${icon(item.icon)}${item.label}</button>`;
    const sidebar = active => `<aside class="side"><div class="brand"><img class="brand-logo" src="logohouse.png" alt="GrupoHouse"></div><nav class="nav">${SIDE.map(item => item ? button(item, active) : '<div class="rule"></div>').join('')}</nav><div class="version">Maqueta navegable · v1.0</div></aside>`;
    const mobileNav = active => `<nav class="mobile-nav" aria-label="Secciones">${NAV.map(item => button(item, active)).join('')}</nav>`;

    function mount(root = document) {
        const active = document.body.dataset.page;
        root.querySelectorAll('[data-side]').forEach(x => { x.outerHTML = sidebar(active); });
        root.querySelectorAll('[data-mobile-nav]').forEach(x => { x.outerHTML = mobileNav(active); });
        root.querySelectorAll('[data-go]').forEach(x => { x.onclick = () => { location.href = x.dataset.go; }; });
    }

    document.body.insertAdjacentHTML('beforeend', SPRITE);
    mount();
    window.Shell = { icon, mount };
})();
