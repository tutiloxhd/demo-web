// Calendario semanal: dibuja los remates de la semana elegida a partir de data.js.
(function () {
    const R = window.RematesData;
    const STATUS_CLASS = { ATRASADO: 'atrasado', ALERTA: 'alerta', BIEN: 'bien', SUSPENDIDO: 'suspendido', CANCELADO: 'cancelado' };
    const title = document.querySelector('#weekTitle');
    const calendar = document.querySelector('#weekEvents');
    let week = R.getWeek();

    function eventCard(x) {
        const state = STATUS_CLASS[x.status] || 'bien';
        return `<a href="index.html?id=${x.id}" class="event-card ${state}">
            <div class="event-time">${x.time}</div>
            <div class="event-info"><strong>${x.title}</strong><span>${x.place}</span></div>
            <span class="status ${state}">${x.status}</span>
            <span class="event-arrow">›</span>
        </a>`;
    }

    function render() {
        const range = R.weekRange(week);
        const items = R.weekItems(week);
        title.textContent = range.label;
        calendar.innerHTML = range.days.map(day => {
            const events = items.filter(x => x.iso === day.iso).sort((a, b) => a.time.localeCompare(b.time));
            return `<div class="day-group">
                <div class="day-column"><span>${day.name}</span><strong>${day.num}</strong></div>
                <div class="events">${events.map(eventCard).join('') || '<div class="event-card vacio">Sin remates</div>'}</div>
            </div>`;
        }).join('');
    }

    document.querySelectorAll('[data-week]').forEach(b => {
        b.onclick = () => { week = R.setWeek(week + Number(b.dataset.week)); render(); };
    });
    render();
})();
