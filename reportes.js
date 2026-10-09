// Reportes: panel de gerencia. Usa R, week, weekBar, bindWeek, toast y statusClass de pages.js.
// Las claves de tareas por resultado son las mismas de RESULT_BRANCHES en app.js.
const BRANCH_TASKS = { ADJUDICADO: ['17A', '18A', '19A'], NO_ADJUDICADO: ['17B', '18B'], REPROGRAMADO: ['17C', '17D', '17E'] };
const OUTCOME_LABEL = { ADJUDICADO: 'Adjudicado', NO_ADJUDICADO: 'No adjudicado', REPROGRAMADO: 'Reprogramado' };
const STATUS_INFO = [
    ['ATRASADO', 'Atrasado', '#ef1d2d'],
    ['ALERTA', 'En alerta', '#f0a000'],
    ['BIEN', 'Bien', '#16a559'],
    ['SUSPENDIDO', 'Suspendido', '#6a4be0'],
    ['CANCELADO', 'Cancelado', '#5d6f89']
];
const PHASES = [['Asignación', 1, 2], ['Vale Vista y formulario', 3, 6], ['Entrega en juzgado', 7, 10], ['Preparación del remate', 11, 13], ['Remate y resultado', 14, 16]];
const WEEK_OFFSETS = [-1, 0, 1, 2];
let scope = 'week';

const stageOf = x => Math.min(16, Math.max(1, Number(x.flowStage) || 1));
const isClosed = x => Boolean(BRANCH_TASKS[x.resultOutcome]) && BRANCH_TASKS[x.resultOutcome].every(key => (x.resultTasks || {})[key]);
const isCancelled = x => x.status === 'CANCELADO';
const isOpen = x => !isClosed(x) && !isCancelled(x);
// La garantía (Vale Vista) es el 10 % del mínimo; los montos están en millones de pesos.
const guarantee = x => Math.round(x.minimum) / 10;
const guaranteePending = x => x.resultOutcome === 'NO_ADJUDICADO' && !(x.resultTasks || {})['17B'];
const money = n => `MM$ ${n.toLocaleString('es-CL', { maximumFractionDigits: 1 })}`;
const sum = (list, value) => list.reduce((total, x) => total + value(x), 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const shortWeek = offset => R.weekRange(offset).label.replace('Semana del ', '').replace(/ \d{4}$/, '');

function reportData() {
    const items = scope === 'all' ? R.items : R.weekItems(week);
    const late = items.filter(x => x.status === 'ATRASADO'), alert = items.filter(x => x.status === 'ALERTA');
    const suspended = items.filter(x => x.status === 'SUSPENDIDO'), cancelled = items.filter(isCancelled);
    const closed = items.filter(isClosed), open = items.filter(isOpen);
    const won = items.filter(x => x.resultOutcome === 'ADJUDICADO'), lost = items.filter(x => x.resultOutcome === 'NO_ADJUDICADO');
    return {
        items, late, alert, suspended, cancelled, closed, open, won, lost,
        rescheduled: items.filter(x => x.resultOutcome === 'REPROGRAMADO'),
        noResult: items.filter(x => !x.resultOutcome && !isCancelled(x)),
        // Garantías en juego: remates abiertos cuyo Vale Vista ya se retiró del banco (paso 8 completado).
        atStake: sum(open.filter(x => stageOf(x) >= 9 && x.resultOutcome !== 'ADJUDICADO'), guarantee),
        toRecover: sum(items.filter(guaranteePending), guarantee),
        awarded: sum(won, x => x.awarded || 0),
        progress: items.length ? Math.round(sum(items, x => x.progress) / items.length) : 0,
        period: scope === 'all' ? `Todas las semanas (${shortWeek(WEEK_OFFSETS[0])} – ${shortWeek(WEEK_OFFSETS.at(-1))} 2025)` : R.weekRange(week).label
    };
}

function kpiRow(d) {
    const decided = d.won.length + d.lost.length;
    const risk = d.late.length + d.alert.length;
    const tile = (title, value, note, extra = '') => `<article class="kpi"><h3>${title}</h3><div class="kpi-value">${value}</div><small>${note}</small>${extra}</article>`;
    return `<section class="kpi-row">
        ${tile('REMATES', d.items.length, `${d.open.length} en curso · ${plural(d.closed.length, 'cerrado', 'cerrados')} · ${plural(d.suspended.length + d.cancelled.length, 'detenido', 'detenidos')}`)}
        ${tile('EN RIESGO', risk, risk ? `<i class="dot" style="background:#ef1d2d"></i>${plural(d.late.length, 'atrasado', 'atrasados')} · ${d.alert.length} en alerta` : 'Nada atrasado ni en alerta')}
        ${tile('TASA DE ADJUDICACIÓN', decided ? `${Math.round(d.won.length / decided * 100)}%` : '—', decided ? `${d.won.length} de ${plural(decided, 'remate con resultado', 'remates con resultado')}` : 'Sin resultados en el período')}
        ${tile('GARANTÍAS EN JUEGO', money(d.atStake), d.toRecover ? `<i class="dot" style="background:#f0a000"></i>${money(d.toRecover)} por recuperar` : 'Nada por recuperar')}
        ${tile('AVANCE PROMEDIO', `${d.progress}%`, 'Tareas completadas del workflow', `<div class="meter"><i style="width:${d.progress}%"></i></div>`)}
    </section>`;
}

function attentionCard(d) {
    const issues = [
        ...d.late.map(x => [x, x.due]),
        ...d.suspended.map(x => [x, `Detenido en «${x.stage}»`]),
        ...d.alert.map(x => [x, guaranteePending(x) ? `Garantía por recuperar: ${money(guarantee(x))}` : x.due])
    ];
    const rows = issues.slice(0, 6).map(([x, issue]) => `<a class="issue" href="hello.html?id=${x.id}">
        <span class="status ${statusClass(x.status)}">${x.status}</span>
        <span><b>${x.title}</b><small>${x.place} · ${x.date}</small></span>
        <span><b>${issue}</b><small>${x.stage}</small></span>
        <span>${x.person}</span>
    </a>`).join('');
    return `<article class="report-card wide">
        <h3>REQUIERE TU ATENCIÓN</h3>
        <p class="card-sub">${issues.length ? `${plural(issues.length, 'remate necesita', 'remates necesitan')} seguimiento. Toca uno para abrirlo.` : 'Ningún remate atrasado, en alerta o suspendido.'}</p>
        ${rows}${issues.length > 6 ? `<p class="card-note">Y ${issues.length - 6} más en el detalle de abajo.</p>` : ''}
    </article>`;
}

function statusCard(d) {
    const counts = STATUS_INFO.map(([key, label, color]) => ({ label, color, n: d.items.filter(x => x.status === key).length }));
    return `<article class="report-card">
        <h3>ESTADO DE LA CARTERA</h3>
        <p class="card-sub">Cómo se reparten los ${d.items.length} remates del período.</p>
        <div class="stack">${counts.filter(c => c.n).map(c => `<i style="flex:${c.n};background:${c.color}" data-tip="${c.label}: ${c.n}"></i>`).join('')}</div>
        ${counts.map(c => `<div class="legend-row"><i style="background:${c.color}"></i>${c.label}<b>${c.n}</b></div>`).join('')}
    </article>`;
}

function bars(rows) {
    const max = Math.max(1, ...rows.map(([, n]) => n));
    return rows.map(([label, n, tip]) => `<div class="hbar" data-tip="${tip || `${label}: ${n}`}"><span>${label}</span><div class="hbar-track">${n ? `<i style="width:${n / max * 100}%"></i>` : ''}</div><b>${n}</b></div>`).join('');
}

function phaseCard(d) {
    const rows = PHASES.map(([label, from, to]) => {
        const n = d.open.filter(x => stageOf(x) >= from && stageOf(x) <= to).length;
        return [label, n, `${label} (pasos ${from} a ${Math.min(to, 15)}): ${n}`];
    });
    return `<article class="report-card">
        <h3>EN QUÉ FASE ESTÁN</h3>
        <p class="card-sub">Remates abiertos según el paso del workflow. No incluye cancelados.</p>
        ${bars([...rows, ['Cerrados', d.closed.length, `Workflow completado: ${d.closed.length}`]])}
    </article>`;
}

function resultCard(d) {
    return `<article class="report-card">
        <h3>RESULTADOS</h3>
        <p class="card-sub">Remates con resultado registrado en el período.</p>
        ${bars([['Adjudicado', d.won.length], ['No adjudicado', d.lost.length], ['Reprogramado', d.rescheduled.length]])}
        <div class="legend-row">Monto adjudicado<b>${money(d.awarded)}</b></div>
        <div class="legend-row">Aún sin resultado<b>${d.noResult.length}</b></div>
    </article>`;
}

// Siempre muestra todas las semanas, con la visible destacada; tocar una columna cambia de semana.
function weekCard() {
    const counts = WEEK_OFFSETS.map(offset => R.weekItems(offset).length);
    const max = Math.max(1, ...counts);
    return `<article class="report-card">
        <h3>REMATES POR SEMANA</h3>
        <p class="card-sub">Carga de cada semana${scope === 'week' ? '; la visible va destacada' : ''}. Toca una para verla.</p>
        <div class="cols">${WEEK_OFFSETS.map((offset, index) => `<button class="col ${scope === 'all' || offset === week ? 'current' : ''}" type="button" data-go-week="${offset}" data-tip="${R.weekRange(offset).label}: ${plural(counts[index], 'remate', 'remates')}">
            <b>${counts[index]}</b><i style="height:${counts[index] / max * 96}px"></i><span>${shortWeek(offset)}</span>
        </button>`).join('')}</div>
    </article>`;
}

const DETAIL_COLUMNS = [
    ['Remate', x => x.title], ['Comuna', x => x.place], ['Fecha', x => `${x.date} · ${x.time}`],
    ['Paso actual', x => `${Math.min(stageOf(x), 15)}/15 · ${x.stage}`], ['Responsable', x => x.person], ['Estado', x => x.status],
    ['Resultado', x => OUTCOME_LABEL[x.resultOutcome] || ''], ['Plazo', x => x.due],
    ['Mínimo (MM$)', x => x.minimum], ['Garantía (MM$)', guarantee], ['Adjudicado (MM$)', x => x.awarded || '']
];

function detailCard(d) {
    const cell = (x, [name, value], index) => {
        const text = value(x);
        if (name === 'Estado') return `<td><span class="status ${statusClass(x.status)}">${text}</span></td>`;
        if (index >= 8) return `<td class="num">${text === '' ? '—' : Number(text).toLocaleString('es-CL', { maximumFractionDigits: 1 })}</td>`;
        return `<td>${index ? text || '—' : `<b>${text}</b>`}</td>`;
    };
    return `<article class="report-card report-detail">
        <h3>DETALLE DE REMATES</h3>
        <p class="card-sub">Es lo que se descarga con «Exportar CSV». Toca una fila para abrir el remate.</p>
        <div class="rp-table-wrap"><table class="rp-table">
            <thead><tr>${DETAIL_COLUMNS.map(([name], index) => `<th class="${index >= 8 ? 'num' : ''}">${name}</th>`).join('')}</tr></thead>
            <tbody>${d.items.map(x => `<tr data-id="${x.id}">${DETAIL_COLUMNS.map((column, index) => cell(x, column, index)).join('')}</tr>`).join('')}</tbody>
        </table></div>
    </article>`;
}

function downloadCsv(d) {
    const quote = value => `"${String(value).replace(/"/g, '""')}"`;
    const number = value => typeof value === 'number' ? String(value).replace('.', ',') : value;
    const lines = [DETAIL_COLUMNS.map(([name]) => quote(name)), ...d.items.map(x => DETAIL_COLUMNS.map(([, value]) => quote(number(value(x)))))];
    // BOM y punto y coma para que Excel en español lo abra con tildes y columnas correctas.
    const blob = new Blob(['﻿' + lines.map(line => line.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `reporte-remates-${scope === 'all' ? 'todas-las-semanas' : R.weekRange(week).from}.csv` });
    link.click();
    URL.revokeObjectURL(link.href);
    toast(`CSV descargado: ${plural(d.items.length, 'remate', 'remates')}`);
}

function renderReports() {
    const d = reportData();
    const toolbar = `<div class="rp-filters">
        <div class="filters">
            <button class="filter ${scope === 'week' ? 'active' : ''}" type="button" data-scope="week">Por semana</button>
            <button class="filter ${scope === 'all' ? 'active' : ''}" type="button" data-scope="all">Todas las semanas</button>
        </div>
        ${scope === 'week' ? weekBar() : ''}
        <div class="rp-actions">
            <button class="action-btn" type="button" id="exportCsv">Exportar CSV</button>
            <button class="action-btn" type="button" id="exportPdf">Imprimir / PDF</button>
        </div>
    </div>
    <p class="rp-period">Informe de gerencia · ${d.period}</p>`;
    pageContent.innerHTML = d.items.length
        ? `${toolbar}${kpiRow(d)}<div class="report-grid">${attentionCard(d)}${statusCard(d)}${phaseCard(d)}${resultCard(d)}${weekCard()}${detailCard(d)}</div>`
        : `${toolbar}<div class="empty-state">No hay remates programados para esta semana.</div><div class="report-grid">${weekCard()}</div>`;
    bindWeek(renderReports);
    document.querySelectorAll('[data-scope]').forEach(b => { b.onclick = () => { scope = b.dataset.scope; renderReports(); }; });
    document.querySelectorAll('[data-go-week]').forEach(b => { b.onclick = () => { scope = 'week'; week = R.setWeek(Number(b.dataset.goWeek)); renderReports(); }; });
    document.querySelectorAll('.rp-table tbody tr').forEach(row => { row.onclick = () => { location.href = `hello.html?id=${row.dataset.id}`; }; });
    document.querySelector('#exportCsv').onclick = () => downloadCsv(d);
    document.querySelector('#exportPdf').onclick = () => window.print();
}

// Tooltip compartido por las marcas de los gráficos (data-tip).
const vizTip = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'viz-tip' }));
document.addEventListener('pointermove', event => {
    const mark = event.target.closest?.('[data-tip]');
    vizTip.classList.toggle('show', Boolean(mark));
    if (!mark) return;
    vizTip.textContent = mark.dataset.tip;
    vizTip.style.left = `${Math.min(innerWidth - 12, Math.max(12, event.clientX))}px`;
    vizTip.style.top = `${event.clientY}px`;
});
document.addEventListener('pointerleave', () => vizTip.classList.remove('show'));

renderReports();
