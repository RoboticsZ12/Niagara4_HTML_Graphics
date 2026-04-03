
function toggleUnitDataPanel() {
    const panel = document.getElementById('unit-data-panel');
    if (panel) panel.classList.toggle('open');
}
function toggleUnitDataPanelDropdown(e) {
    e.stopPropagation();
    const dd  = document.getElementById('unitdata-topbar-dropdown');
    const btn = document.getElementById('unitDataButton-top');
    if (!dd || !btn) return;
    const isOpen = dd.classList.contains('open');
    if (isOpen) { dd.classList.remove('open'); btn.classList.remove('active'); return; }
    // Sync table content from the existing tbody
    const srcTbody  = document.getElementById('unit-data-tbody');
    const destTbody = document.getElementById('unit-data-tbody-top');
    if (srcTbody && destTbody) destTbody.innerHTML = srcTbody.innerHTML;
    const rect = btn.getBoundingClientRect();
    dd.style.top  = (rect.bottom + 6) + 'px';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
    dd.style.left = 'auto';
    dd.classList.add('open');
    btn.classList.add('active');
}
function closeUnitDataDropdown() {
    const dd  = document.getElementById('unitdata-topbar-dropdown');
    const btn = document.getElementById('unitDataButton-top');
    if (dd) dd.classList.remove('open');
    if (btn) btn.classList.remove('active');
}
document.addEventListener('click', function(e) {
    const dd  = document.getElementById('unitdata-topbar-dropdown');
    const btn = document.getElementById('unitDataButton-top');
    if (dd && !dd.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
        dd.classList.remove('open');
        if (btn) btn.classList.remove('active');
    }
});
function toggleTopbarOverrides(e) {
    e.stopPropagation();
    const dd  = document.getElementById('topbar-or-dropdown');
    const btn = document.getElementById('topbar-or-btn');
    if (!dd || !btn) return;
    const isOpen = dd.classList.contains('open');
    if (isOpen) { dd.classList.remove('open'); return; }
    const rect = btn.getBoundingClientRect();
    dd.style.top  = (rect.bottom + 6) + 'px';
    dd.style.left = rect.left + 'px';
    dd.classList.add('open');
}
document.addEventListener('click', function(e) {
    const dd = document.getElementById('topbar-or-dropdown');
    if (dd && !dd.contains(e.target) && e.target.id !== 'topbar-or-btn') dd.classList.remove('open');
});

(function() {
    const TIMEOUT_MS = 2000;

    // Values that mean "no real data" — hide the element
    function isEmptyValue(text) {
        if (!text) return true;
        const t = text.trim();
        return t === '' || t === '—' || t === '-' || t === 'null' || t === 'Loading...' || t === 'N/A' || t === 'undefined';
    }

    function startLoadingTimers() {
        // ── Static table rows ──
        document.querySelectorAll('.point-row[data-spanid]').forEach(row => {
            const span = document.getElementById(row.getAttribute('data-spanid'));
            if (!span) { setTimeout(() => collapseRow(row), TIMEOUT_MS); return; }
            watchSpan(span, () => collapseRow(row), row);
        });

        // ── Graphic pill-wraps (DA-T, DPR-Pos, Reheat1, etc.)
        //    that are NOT inside a .point-row (those are handled above) ──
        document.querySelectorAll('.pill-wrap[data-spanid]').forEach(wrap => {
            if (wrap.closest('.point-row')) return;
            const span = document.getElementById(wrap.getAttribute('data-spanid'));
            if (!span) { setTimeout(() => collapsePillWrap(wrap), TIMEOUT_MS); return; }
            watchSpan(span, () => collapsePillWrap(wrap), wrap);
        });
    }

    function watchSpan(span, collapseFn, container) {
        let resolved = false;
        const interval = setInterval(() => {
            const text = (span.textContent || '').trim();
            if (!isEmptyValue(text)) {
                resolved = true;
                clearInterval(interval);
                expandContainer(container);
            }
        }, 200);
        setTimeout(() => {
            clearInterval(interval);
            if (!resolved) {
                const text = (span.textContent || '').trim();
                if (isEmptyValue(text)) collapseFn();
            }
        }, TIMEOUT_MS);
    }

    // ── Collapse helpers ──────────────────────────────────────────────
    function collapseRow(row) {
        row.classList.add('hidden-row');
    }
    function collapsePillWrap(wrap) {
        wrap.style.display = 'none';
        wrap.dataset.autoHidden = 'true';
    }

    // ── Expand helpers ────────────────────────────────────────────────
    function expandContainer(container) {
        if (!container) return;
        if (container.classList.contains('point-row')) {
            container.classList.remove('hidden-row');
        } else if (container.classList.contains('pill-wrap')) {
            if (container.dataset.autoHidden === 'true') {
                container.style.display = '';
                delete container.dataset.autoHidden;
            }
        }
    }

    // ── Public API used by the monitoring script ──────────────────────
    window.expandPointRow = function(spanId) {
        // Static table rows
        const row = document.querySelector(`.point-row[data-spanid="${spanId}"]`);
        if (row) row.classList.remove('hidden-row');
        // Graphic pill-wraps
        const wrap = document.querySelector(`.pill-wrap[data-spanid="${spanId}"]`);
        if (wrap && !wrap.closest('.point-row')) {
            wrap.style.display = '';
            delete wrap.dataset.autoHidden;
        }
    };

    window.collapsePointRow = function(spanId) {
        const row = document.querySelector(`.point-row[data-spanid="${spanId}"]`);
        if (row) collapseRow(row);
        const wrap = document.querySelector(`.pill-wrap[data-spanid="${spanId}"]`);
        if (wrap && !wrap.closest('.point-row')) collapsePillWrap(wrap);
    };

    // ── Continuous watcher every 3s: catches late-arriving nulls ─────
    function startContinuousWatcher() {
        setInterval(() => {
            // Graphic pill-wraps
            document.querySelectorAll('.pill-wrap[data-spanid]').forEach(wrap => {
                if (wrap.closest('.point-row')) return;
                const span = document.getElementById(wrap.getAttribute('data-spanid'));
                if (!span) return;
                const text = (span.textContent || '').trim();
                if (isEmptyValue(text)) {
                    if (wrap.style.display !== 'none') collapsePillWrap(wrap);
                } else {
                    if (wrap.dataset.autoHidden === 'true') {
                        wrap.style.display = '';
                        delete wrap.dataset.autoHidden;
                    }
                }
            });
            // Static table rows
            document.querySelectorAll('.point-row[data-spanid]').forEach(row => {
                const span = document.getElementById(row.getAttribute('data-spanid'));
                if (!span) return;
                const text = (span.textContent || '').trim();
                if (isEmptyValue(text)) {
                    if (!row.classList.contains('hidden-row')) collapseRow(row);
                } else {
                    if (row.classList.contains('hidden-row')) row.classList.remove('hidden-row');
                }
            });
        }, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { startLoadingTimers(); startContinuousWatcher(); });
    } else {
        startLoadingTimers();
        startContinuousWatcher();
    }
})();




(async function loadEquipmentSummaryBtn() {
    try {
        const response = await fetch('../../Global.json');
        const data = await response.json();
        const vars = data.globalVariables || {};
        const keys = Object.keys(vars);
        const hasRTU = keys.some(k => k.toLowerCase().includes('rtu'));
        const hasAHU = keys.some(k => k.toLowerCase().includes('ahu'));
        const container = document.getElementById('equipment-summary-btn');
        if (!container) return;
        if (hasRTU) {
            container.innerHTML = `<a href="../../Summary/rtuSummarysheet.html" class="nav-image-btn"><div class="nav-btn-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><line x1="13" y1="9" x2="19" y2="9" stroke="var(--accent)" stroke-width="1.5"/><line x1="13" y1="12" x2="19" y2="12" stroke="var(--accent)" stroke-width="1.5"/><line x1="13" y1="15" x2="17" y2="15" stroke="var(--accent)" stroke-width="1.5"/></svg></div><div class="nav-btn-text"><span class="nav-btn-label">RTU Summary</span><span class="nav-btn-sublabel">All RTU units</span></div></a>`;
        } else if (hasAHU) {
            container.innerHTML = `<a href="../../Summary/ahuSummarysheet.html" class="nav-image-btn"><div class="nav-btn-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 12 Q9 8 12 12 Q15 16 18 12"/><line x1="2" y1="9" x2="22" y2="9" stroke="var(--accent)" stroke-width="1" stroke-dasharray="2,2"/></svg></div><div class="nav-btn-text"><span class="nav-btn-label">AHU Summary</span><span class="nav-btn-sublabel">All AHU units</span></div></a>`;
        }
    } catch(e) { console.warn('Could not load equipment summary button:', e); }
})();

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("fade-in");
    document.body.addEventListener("click", function(e) {
        const link = e.target.closest("a");
        if (!link) return;
        if (link.hostname !== location.hostname) return;
        e.preventDefault();
        document.body.classList.remove("fade-in");
        document.body.classList.add("fade-out");
        const loader = document.getElementById("page-loader");
        if (loader) loader.classList.remove("hidden");
        setTimeout(() => { window.location.href = link.href; }, 0);
    });
});


require(['baja!', 'baja!control:StringOverride'], function(baja) {
    'use strict';
    const resolvedNotes = {};
    const htmlFilename = window.location.pathname.split('/').pop().split('.').shift();
    fetch('../../Global.json').then(res => res.json()).then(config => {
        if (!config.globalVariables || !config.globalVariables[htmlFilename]) return;
        const deviceConfig = config.globalVariables[htmlFilename];
        if (!deviceConfig.points) return;
        deviceConfig.points.forEach(p => {
            if (p.name === 'Note1' || p.name === 'Note2' || p.name === 'Note3') {
                baja.Ord.make(p.fullPath).get().then(point => {
                    resolvedNotes[p.name] = point;
                    updateNoteDisplay(p.name);
                });
            }
        });
        startAutoUpdate();
    });
    window.saveNote = function(noteName) {
        const point = resolvedNotes[noteName];
        const input = document.getElementById(noteName);
        if (!point || !input) return;
        const overrideParam = baja.$('control:StringOverride');
        overrideParam.setValue(input.value);
        point.invoke({ slot: 'override', value: overrideParam }).then(() => updateNoteDisplay(noteName));
    };
    function updateNoteDisplay(noteName) {
        const point = resolvedNotes[noteName];
        const input = document.getElementById(noteName);
        if (!point || !input) return;
        const outValue = point.getOut().getValueDisplay();
        if (document.activeElement !== input) input.value = outValue || '';
    }
    function startAutoUpdate() { setInterval(function() { updateNoteDisplay('Note1'); updateNoteDisplay('Note2'); updateNoteDisplay('Note3'); }, 1000); }
    const modal    = document.getElementById('notesModal');
    const closeBtn = document.querySelector('.notes-close');
    if (closeBtn) closeBtn.onclick = function() { modal.style.display = 'none'; };
    window.onclick = function(event) { if (event.target === modal) modal.style.display = 'none'; };
});

require(['baja!', 'baja!control:StringOverride'], function(baja) {
    'use strict';
    let resolvedStringPoint = null;
    const htmlFilename = window.location.pathname.split('/').pop().split('.').shift();
    fetch('../../Global.json').then(res => res.json()).then(config => {
        if (!config.globalVariables || !config.globalVariables[htmlFilename]) return;
        const deviceConfig = config.globalVariables[htmlFilename];
        const point = deviceConfig.points.find(p => p.name === 'StringWritable');
        if (!point) return;
        baja.Ord.make(point.fullPath).get().then(p => {
            resolvedStringPoint = p;
            attachRightClickHandler();
            updateDisplay();
            startAutoUpdate();
        });
    });
    function overrideString(value) {
        if (!resolvedStringPoint) return;
        const overrideParam = baja.$('control:StringOverride');
        overrideParam.setValue(value);
        resolvedStringPoint.invoke({ slot: 'override', value: overrideParam }).then(() => updateDisplay());
    }
    function updateDisplay() {
        if (!resolvedStringPoint) return;
        const outValue = resolvedStringPoint.getOut().getValueDisplay();
        const displayEl = document.getElementById('string-display');
        if (displayEl) displayEl.textContent = outValue || '';
    }
    function attachRightClickHandler() {
        const container = document.getElementById('string-container');
        if (!container) return;
        container.oncontextmenu = function(e) {
            e.preventDefault();
            const currentValue = resolvedStringPoint?.getOut().getValueDisplay() || '';
            const newValue = prompt('Enter new Room Name:', currentValue);
            if (newValue !== null) overrideString(newValue);
        };
    }
    function startAutoUpdate() { setInterval(updateDisplay, 1000); }
});

require(['baja!'], function(baja) {
    const elementIds = ['DA-T','DPR-Pos','Reheat1','Air-Flow','Occupancy','Mode','HVACModeStatus','Space-Temp','Fan-Stat'];

    async function updateAllAlarmText() {
        try {
            if (!graphPopupConfig) await loadGraphPopupConfig();
            for (const elementId of elementIds) {
                const pointInfo = findPointPath(elementId);
                if (!pointInfo) continue;
                const span = document.getElementById(elementId);
                if (!span) continue;
                const point       = await baja.Ord.make(pointInfo.path).get();
                const out         = point.getOut();
                const outStatus   = out.getStatus().toString();
                const displayValue = out.getValueDisplay();
                span.style.color = '';
                span.className   = span.className.replace(/\b(status-on|status-off|status-fault|override-active)\b/g,'').trim();
                if (outStatus.includes('alarm')) {
                    span.textContent = `${displayValue} ⚠`;
                    span.classList.add('status-fault');
                } else {
                    span.textContent = displayValue;
                    span.classList.add('status-on');
                }
                if (displayValue && displayValue.trim() !== '' && displayValue.trim() !== 'Loading...' && displayValue.trim() !== '—') {
                    if (window.expandPointRow) window.expandPointRow(elementId);
                }
            }
        } catch(err) { console.error('Alarm status read failed:', err); }
    }
    updateAllAlarmText();
    setInterval(updateAllAlarmText, 10000);
});

let graphPopupConfig = null;

async function loadGraphPopupConfig() {
    if (graphPopupConfig) return graphPopupConfig;
    try {
        const fullFilename = window.location.pathname.split('/').pop();
        const headerName   = fullFilename.replace('.html', '');
        const response     = await fetch('../../Global.json');
        const jsonData     = await response.json();
        const ahuConfig    = jsonData.globalVariables[headerName];
        if (!ahuConfig) throw new Error(`Configuration not found for ${headerName}`);
        graphPopupConfig = { headerName, ahuConfig };
        return graphPopupConfig;
    } catch(error) { console.error('Failed to load graph configuration:', error); throw error; }
}

function findPointPath(spanId) {
    if (!graphPopupConfig) { console.error('Config not loaded'); return null; }
    const points = graphPopupConfig.ahuConfig.points;
    let found = points.find(p => p.id === spanId);
    if (found) return { path: found.fullPath, name: found.name, id: found.id };
    const spanName = spanId.replace(/-/g, '_');
    found = points.find(p => p.name === spanName) || points.find(p => p.name === spanId);
    if (found) return { path: found.fullPath, name: found.name, id: found.id };
    found = points.find(p =>
        (p.id && p.id.toLowerCase().includes(spanId.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(spanId.toLowerCase())) ||
        spanId.toLowerCase().includes(p.name.toLowerCase())
    );
    return found ? { path: found.fullPath, name: found.name, id: found.id } : null;
}

function createGraphPopup() {
    let popup = document.getElementById('graph-popup-overlay');
    if (!popup) {
        popup = document.createElement('div');
        popup.id        = 'graph-popup-overlay';
        popup.className = 'graph-popup-overlay';
        popup.innerHTML = `
            <div class="graph-popup-container">
                <div class="graph-popup-header">
                    <h2 class="graph-popup-title" id="graph-popup-title">24-Hour History</h2>
                    <button class="graph-popup-close" onclick="closeGraphPopup()">×</button>
                </div>
                <div class="graph-popup-body">
                    <div class="graph-loading" id="graph-loading">Loading historical data...</div>
                    <div id="graph-canvas-container" style="display:none;flex:1;min-height:0;flex-direction:column;">
                        <canvas id="history-graph-canvas" style="flex:1;min-height:0;display:block;width:100%;"></canvas>
                        <div class="graph-info" id="graph-info"></div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(popup);
        popup.addEventListener('click', e => { if (e.target === popup) closeGraphPopup(); });
    }
    return popup;
}

window.closeGraphPopup = function() {
    const popup = document.getElementById('graph-popup-overlay');
    if (popup) popup.style.display = 'none';
};

function drawHistoryGraph(canvas, data, pointLabel, unit) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const cssWidth = rect.width, cssHeight = rect.height - 60;
    canvas.width  = cssWidth  * dpr; canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth+'px'; canvas.style.height = cssHeight+'px';
    ctx.scale(dpr, dpr);
    const W = cssWidth, H = cssHeight;
    const pad = { top:40, right:40, bottom:60, left:80 };
    const gW = W-pad.left-pad.right, gH = H-pad.top-pad.bottom;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#161b27'; ctx.fillRect(pad.left,pad.top,gW,gH);
    if (!data.length) { ctx.fillStyle='#7a8499'; ctx.font='14px "Courier New"'; ctx.textAlign='center'; ctx.fillText('No data available',W/2,H/2); return; }
    const values = data.map(d => typeof d.value==='boolean'?(d.value?1:0):parseFloat(d.value)).filter(v=>!isNaN(v));
    const minV = Math.min(...values), maxV = Math.max(...values), rangeV = maxV-minV||1;
    const yScale = v => pad.top+gH-((v-minV)/rangeV)*gH;
    const xScale = i => pad.left+(i/(data.length-1))*gW;
    ctx.strokeStyle='rgba(0,200,255,0.15)'; ctx.lineWidth=1;
    for (let i=0;i<=5;i++) { const y=pad.top+(gH/5)*i; ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+gW,y); ctx.stroke(); ctx.fillStyle='#7a8499'; ctx.font='11px "Courier New"'; ctx.textAlign='right'; ctx.fillText((maxV-(rangeV/5)*i).toFixed(1)+(unit?' '+unit:''),pad.left-10,y+4); }
    ctx.fillStyle='#7a8499'; ctx.font='11px "Courier New"'; ctx.textAlign='center';
    for (let i=0;i<6;i++) { const di=Math.floor((i/5)*(data.length-1)); ctx.fillText(data[di].timestamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),xScale(di),H-pad.bottom+20); }
    ctx.strokeStyle='#00c8ff'; ctx.lineWidth=2; ctx.beginPath();
    data.forEach((pt,i) => { const v=typeof pt.value==='boolean'?(pt.value?1:0):parseFloat(pt.value); if(isNaN(v))return; i===0?ctx.moveTo(xScale(i),yScale(v)):ctx.lineTo(xScale(i),yScale(v)); }); ctx.stroke();
    ctx.fillStyle='#1e88e5'; data.forEach((pt,i) => { const v=typeof pt.value==='boolean'?(pt.value?1:0):parseFloat(pt.value); if(isNaN(v))return; ctx.beginPath(); ctx.arc(xScale(i),yScale(v),3,0,Math.PI*2); ctx.fill(); });
    ctx.strokeStyle='rgba(0,200,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(pad.left,pad.top); ctx.lineTo(pad.left,pad.top+gH); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pad.left,pad.top+gH); ctx.lineTo(pad.left+gW,pad.top+gH); ctx.stroke();
    ctx.fillStyle='#00c8ff'; ctx.font='bold 14px "Courier New"'; ctx.textAlign='center'; ctx.fillText(pointLabel+' — Last 24 Hours',W/2,26);
}

async function openGraphPopupBySpanId(spanId, customLabel=null) {
    try {
        if (!graphPopupConfig) await loadGraphPopupConfig();
        const pointInfo = findPointPath(spanId);
        if (!pointInfo) { alert(`Could not find configuration for point: ${spanId}`); return; }
        await openGraphPopup(pointInfo.path, customLabel || pointInfo.name.replace(/_/g,' '), '');
    } catch(error) { alert('Failed to open graph: ' + error.message); }
}

async function openGraphPopup(pointPath, pointLabel, unit) {
    const popup = createGraphPopup();
    popup.style.display = 'flex';
    document.getElementById('graph-popup-title').textContent = pointLabel + ' — 24 Hour History';
    const loadingEl  = document.getElementById('graph-loading');
    const canvasWrap = document.getElementById('graph-canvas-container');
    loadingEl.style.display = 'flex'; canvasWrap.style.display = 'none';
    try {
        const endTime = new Date(), startTime = new Date(endTime.getTime()-86400000);
        const historyData = await loadAHUHistoryData(pointPath, startTime, endTime, 2000);
        if (!historyData.length) { loadingEl.innerHTML = '<p style="color:var(--text-muted);font-family:var(--font-head);letter-spacing:2px;">No data for last 24 hours</p>'; return; }
        loadingEl.style.display = 'none'; canvasWrap.style.display = 'flex'; canvasWrap.style.flexDirection = 'column'; canvasWrap.style.flex = '1'; canvasWrap.style.minHeight = '0';
        await new Promise(r => setTimeout(r, 50));
        const canvas = document.getElementById('history-graph-canvas');
        drawHistoryGraph(canvas, historyData, pointLabel, unit);
        const vals = historyData.map(d=>typeof d.value==='boolean'?(d.value?1:0):parseFloat(d.value)).filter(v=>!isNaN(v));
        const stats = { min:Math.min(...vals), max:Math.max(...vals), avg:vals.reduce((a,b)=>a+b,0)/vals.length, count:historyData.length };
        const u = unit?' '+unit:'';
        document.getElementById('graph-info').innerHTML = `<strong>Statistics:</strong> Min: ${stats.min.toFixed(2)}${u} | Avg: ${stats.avg.toFixed(2)}${u} | Max: ${stats.max.toFixed(2)}${u} | Points: ${stats.count}<br><strong>Range:</strong> ${startTime.toLocaleString()} → ${endTime.toLocaleString()}`;
    } catch(error) { loadingEl.innerHTML = `<p style="color:var(--red);font-family:var(--font-head);">Error: ${error.message}</p>`; }
}

setTimeout(async () => { try { await loadGraphPopupConfig(); } catch(e) { console.warn('Pre-load config failed:', e.message); } }, 200);


require(['baja!', 'baja!control:Override', 'baja!control:NumericOverride', 'baja!control:EnumOverride'], function(baja) {
'use strict';

/* ── Auth ─────────────────────────────────────────────────────────── */
async function isAuthorizedUser() {
    const username = sessionStorage.getItem('username');
    if (!username) return false;
    try {
        const response = await fetch('../../HomeConfig.json');
        if (!response.ok) throw new Error('Config load failed');
        const config = await response.json();
        const user = config.Users.find(u => u.name.toLowerCase() === username.toLowerCase());
        return user && user.role.toLowerCase() === 'admin';
    } catch(err) { console.error('Auth error:', err); return false; }
}

(async () => {
    const authorized = await isAuthorizedUser();
    if (!authorized) {
        alert('🚫 You do not have Admin rights. User Overrides LOCKED!');
        document.getElementById("page-loader")?.classList.add("hidden");
        throw new Error('Unauthorized user');
    }

    function decodeNiagaraName(name) {
        if (!name) return name;
        return name.replace(/\$([0-9a-fA-F]{2})/g, (m,h) => String.fromCharCode(parseInt(h,16)));
    }

    const fullFilename = window.location.pathname.split('/').pop();
    const headerName   = fullFilename.replace('.html', '');
    const pathName     = headerName.replace(/-/g, '_');
    const ahuHeader    = document.getElementById('ahu-header');
    if (ahuHeader) ahuHeader.textContent = decodeNiagaraName(pathName);

    /* ══════════════════════════════════════════════════════════════
       resolveGraphicTarget(realId)
       ──────────────────────────────────────────────────────────────
       Maps a point's "realId" to the display span its OR button
       should attach to.  Returns the target span id string, or null
       to indicate that realId IS the target (use it directly).

       EXPLICIT PAIRINGS:
         DA-TSP        → DA-T
         OccupancyCMD  → Occupancy
         Reheat1SP     → Reheat1
         AirFlow-SP    → Air-Flow     (always-paired — also handled below)
         Damp-Pos-Cmd  → DPR-Pos      (always-paired — also handled below)
         Space-Setpoint→ Space-Temp   (always-paired — also handled below)
    ══════════════════════════════════════════════════════════════ */
    function resolveGraphicTarget(realId) {
        if (!realId) return null;
        const map = {
            'DA-TSP':        'DA-T',
            'OccupancyCMD':  'Occupancy',
            'Reheat1SP':     'Reheat1',
            'AirFlow-SP':    'Air-Flow',
            'Damp-Pos-Cmd':  'DPR-Pos',
            'DPR-Pos-Cmd':   'DPR-Pos',
            'Space-Setpoint':'Space-Temp',
        };
        return map[realId] !== undefined ? map[realId] : null;
    }

    let allOverridePointsMeta = [];
    let resolvedORById        = {};
    let orCurrentPointId      = null;
    let enumPointFacets       = {};

    /* ── Scan Global.json, classify all overridable points ─────── */
    async function loadPointsFromJSON() {
        try {
            const response  = await fetch('../../Global.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const jsonData  = await response.json();
            const ahuConfig = jsonData.globalVariables[headerName];
            if (!ahuConfig) { console.warn(`No config for "${headerName}"`); return; }

            ahuConfig.points.forEach(point => {
                const idVal  = (point.id  || '').trim();
                const id2Val = (point.id2 || '').trim();

                // Find which field carries the SP override tag
                const spTag = [idVal, id2Val].find(v =>
                    v === 'SP-Numeric' || v === 'SP-Boolean' || v === 'SP-Enum');

                // Also check: is the id itself an explicit-pairing key (DA-TSP, OccupancyCMD, Reheat1SP)?
                // These ARE the setpoint point — no SP tag needed, they still get an OR bubble.
                const isExplicitSPKey = !spTag && resolveGraphicTarget(idVal) !== null;

                if (!spTag && !isExplicitSPKey) return;

                let type, rawRealId;
                if (isExplicitSPKey) {
                    // The id itself is the SP controller; infer type from logNumeric/logBoolean
                    rawRealId = idVal;
                    type = (point.logBoolean === 'yes_Boolean') ? 'boolean'
                         : (point.logNumeric  === 'yes_Numeric') ? 'numeric'
                         : 'numeric'; // safe default
                } else {
                    type  = spTag === 'SP-Numeric' ? 'numeric'
                          : spTag === 'SP-Boolean' ? 'boolean'
                          : 'enum';
                    // realId = the non-SP field
                    rawRealId = (idVal === spTag ? id2Val : idVal).trim();
                }

                // Resolve the graphic target
                const explicitTarget  = resolveGraphicTarget(rawRealId);
                const graphicTargetId = explicitTarget !== null
                    ? (explicitTarget || null)
                    : (rawRealId && rawRealId !== 'N/A' ? rawRealId : null);

                allOverridePointsMeta.push({
                    pointId:         point.name,
                    pointName:       point.name,
                    fullPath:        point.fullPath,
                    type,
                    rawRealId,
                    graphicTargetId,
                });
            });

            console.log(`[OR] Loaded ${allOverridePointsMeta.length} override-eligible points`);
        } catch(err) { console.error('Error loading override points:', err); }
    }

    await loadPointsFromJSON();

    /* ── Modal element refs ─────────────────────────────────────── */
    const orModal           = document.getElementById('or-modal');
    const orModalCloseBtn   = document.getElementById('or-modal-close-btn');
    const orModalCancelBtn  = document.getElementById('or-modal-cancel-btn');
    const orModalTitle      = document.getElementById('or-modal-title');
    const orModalPointName  = document.getElementById('or-modal-point-name');
    const orModalPointValue = document.getElementById('or-modal-point-value');
    const orNumericControl  = document.getElementById('or-numeric-control');
    const orBooleanControl  = document.getElementById('or-boolean-control');
    const orEnumControl     = document.getElementById('or-enum-control');
    const orModalNumericIn  = document.getElementById('or-modal-numeric-input');
    const orModalCommandDr  = document.getElementById('or-modal-command-dropdown');
    const orModalEnumDr     = document.getElementById('or-modal-enum-dropdown');
    const orModalDurationDr = document.getElementById('or-modal-duration-dropdown');
    const orModalOverrideBtn= document.getElementById('or-modal-override-btn');
    const orModalReleaseBtn = document.getElementById('or-modal-release-btn');

    /* ── Status helper ─────────────────────────────────────────── */
    function checkIfOverridden(point) {
        try {
            const s = point.getOut().getStatus()?.toString().toLowerCase() || '';
            if (!s.trim()) return null;
            if (s.includes('overridden') || s.includes('manual')) return 'OVERRIDDEN';
            if (s.includes('fault') || s.includes('alarm') || s.includes('down')) return 'FAULT';
            return null;
        } catch(e) { return null; }
    }

    /* ── OR bubble state helper ─────────────────────────────────── */
    function setORBubbleState(btn, state) {
        if (!btn) return;
        btn.classList.remove('or-active', 'or-fault');
        if (state === 'OVERRIDDEN') btn.classList.add('or-active');
        else if (state === 'FAULT') btn.classList.add('or-fault');
    }

    /* ══════════════════════════════════════════════════════════════
       FACET PARSING — robust multi-method enum option discovery
       (identical to tower script)
    ══════════════════════════════════════════════════════════════ */
    function parseFacetsFromPoint(point, pointName) {
        const options = [];

        // Method 1: point.getFacets() range
        try {
            const facets = point.getFacets ? point.getFacets() : null;
            if (facets) {
                const range = facets.get ? facets.get('range') : null;
                if (range) {
                    if (typeof range.getSize === 'function') {
                        for (let i = 0; i < range.getSize(); i++) {
                            const entry = range.get(i);
                            options.push({ ordinal: entry.getOrdinal(), label: (entry.getDisplayName && entry.getDisplayName()) || (entry.getTag && entry.getTag()) || String(entry.getOrdinal()) });
                        }
                        if (options.length) return options;
                    }
                    const r1 = parseFacetString(range.toString(), pointName);
                    if (r1.length) return r1;
                }
            }
        } catch(e) { console.warn(`[${pointName}] Facet M1 error:`, e.message); }

        // Method 2: point.getOut() facets and value type facets
        try {
            const out = point.getOut ? point.getOut() : null;
            if (out) {
                const outFacets = out.getFacets ? out.getFacets() : null;
                if (outFacets) {
                    const range = outFacets.get ? outFacets.get('range') : null;
                    if (range) { const r2 = parseFacetString(range.toString(), pointName); if (r2.length) return r2; }
                }
                try {
                    const val = out.getValue ? out.getValue() : null;
                    if (val && val.getType) {
                        const valType = val.getType();
                        const typeFacets = valType.getFacets ? valType.getFacets() : null;
                        if (typeFacets) {
                            const range = typeFacets.get ? typeFacets.get('range') : null;
                            if (range) {
                                if (typeof range.getSize === 'function') {
                                    const opts = [];
                                    for (let i = 0; i < range.getSize(); i++) { const entry = range.get(i); opts.push({ ordinal: entry.getOrdinal(), label: (entry.getDisplayName && entry.getDisplayName()) || (entry.getTag && entry.getTag()) || String(entry.getOrdinal()) }); }
                                    if (opts.length) return opts;
                                }
                                const r3 = parseFacetString(range.toString(), pointName);
                                if (r3.length) return r3;
                            }
                        }
                    }
                } catch(e3) { console.warn(`[${pointName}] Facet M3 error:`, e3.message); }
            }
        } catch(e2) { console.warn(`[${pointName}] Facet M2 error:`, e2.message); }

        return options;
    }

    function parseFacetString(s, pointName) {
        const opts   = [];
        const pairs  = s.replace(/[{}]/g,'').match(/([^,=]+)=(\d+)/g);
        if (pairs) pairs.forEach(p => { const [l,o] = p.split('='); opts.push({ ordinal:parseInt(o,10), label:l.trim() }); });
        return opts;
    }

    /* ── Baja subscriber: live push updates for all OR points ────── */
    const orSubscriber = new baja.Subscriber();

    orSubscriber.attach('changed', function(prop) {
        if (prop.getName() !== 'out') return;
        const pointId = this._orPointId;
        if (!pointId) return;
        const info = resolvedORById[pointId];
        if (!info) return;

        const out        = this.getOut();
        const displayVal = out.getValueDisplay();
        const rawVal     = out.getValue();
        const isOvr      = this.getStatus().isOverridden();

        // Update OR bubble color
        if (info.orBtn) setORBubbleState(info.orBtn, isOvr ? 'OVERRIDDEN' : null);

        // Update linked display span
        if (info.graphicTargetId) {
            const spanEl = document.getElementById(info.graphicTargetId);
            if (spanEl) {
                spanEl.className = spanEl.className.replace(/\b(status-on|status-off|status-fault|override-active|pill-value|data-value)\b/g,'').trim();
                if (isOvr) {
                    spanEl.className   = 'pill-value override-active';
                    spanEl.textContent = `${displayVal} ◈`;
                } else {
                    const isOn = String(rawVal||'').toLowerCase().includes('on') || String(rawVal||'').toLowerCase() === 'true' || parseFloat(rawVal) > 0;
                    spanEl.className   = `pill-value ${isOn ? 'status-on' : 'status-off'}`;
                    spanEl.textContent = displayVal;
                }
            }
        }

        // Refresh modal if open for this point
        if (orModal?.classList.contains('active') && orCurrentPointId === pointId) {
            updateORModalDisplay(this, info.name, info.type, pointId);
        }
    });

    /* ── Resolve all points via Baja ─────────────────────────────── */
    async function resolveAllPoints() {
        await Promise.all(allOverridePointsMeta.map(async meta => {
            try {
                const point = await baja.Ord.make(meta.fullPath).get({ subscriber: orSubscriber });
                point._orPointId = meta.pointId;
                resolvedORById[meta.pointId] = {
                    point,
                    name:            meta.pointName,
                    type:            meta.type,
                    graphicTargetId: meta.graphicTargetId,
                    rawRealId:       meta.rawRealId,
                    isGraphic:       false,
                    orBtn:           null,
                };
                // Parse enum facets immediately (with retry)
                if (meta.type === 'enum') {
                    const facetOpts = parseFacetsFromPoint(point, meta.pointName);
                    enumPointFacets[meta.pointId] = facetOpts;
                    if (!facetOpts.length) {
                        setTimeout(() => {
                            const retried = parseFacetsFromPoint(point, meta.pointName);
                            if (retried.length) enumPointFacets[meta.pointId] = retried;
                        }, 2500);
                    }
                }
            } catch(err) { console.warn(`Failed to resolve "${meta.pointName}":`, err.message); }
        }));

        /* ── Wire graphic OR buttons ──────────────────────────────── */
        Object.entries(resolvedORById).forEach(([pointId, info]) => {
            if (!info.graphicTargetId) return; // no graphic target → topbar only

            // Search entire document for pill-wrap[data-spanid="<target>"]
            // This handles both graphically-placed pills and row-embedded ones.
            const container = document.querySelector(`.pill-wrap[data-spanid="${info.graphicTargetId}"]`);

            if (!container) {
                // No pill-wrap found — fall back to legacy static-data-table OR buttons
                // (for always-paired Air-Flow / Space-Temp which use #or-* IDs)
                const legacyBtn = document.getElementById(`or-${info.graphicTargetId}`);
                if (legacyBtn) {
                    legacyBtn.onclick = () => openORModal(pointId);
                    legacyBtn.title   = `Override: ${decodeNiagaraName(info.name)}`;
                    legacyBtn.classList.add('or-ready');
                    info.isGraphic = true;
                    info.orBtn     = legacyBtn;
                    console.log(`[OR] ✅ Legacy OR btn wired: "${info.name}" → #or-${info.graphicTargetId}`);
                    return;
                }
                console.warn(`[OR] pill-wrap[data-spanid="${info.graphicTargetId}"] not found for "${info.name}" → topbar`);
                return;
            }

            // Use existing .or-btn-inline, or inject one
            let orBtn = container.querySelector('.or-btn-inline');
            if (!orBtn) {
                orBtn = document.createElement('div');
                orBtn.className   = 'or-btn-inline';
                orBtn.textContent = 'OR';
                container.appendChild(orBtn);
            }

            orBtn.onclick = () => openORModal(pointId);
            orBtn.title   = `Override: ${decodeNiagaraName(info.name)}`;
            orBtn.classList.add('or-ready');
            info.isGraphic = true;
            info.orBtn     = orBtn;
            console.log(`[OR] ✅ Graphic OR btn wired: "${info.name}" → pill[data-spanid="${info.graphicTargetId}"]`);
        });

        buildTopbarOverrides();
        initORModalListeners();
        startORLiveUpdate();
        document.getElementById("page-loader")?.classList.add("hidden");
    }

    resolveAllPoints();

    /* ── Topbar chips for non-graphic points ─────────────────────── */
    function buildTopbarOverrides() {
        const topbarPoints = Object.entries(resolvedORById).filter(([, info]) => !info.isGraphic);
        const chips = document.getElementById('topbar-or-chips');
        const btn   = document.getElementById('topbar-or-btn');
        if (!chips) return;
        chips.innerHTML = '';
        topbarPoints.forEach(([pointId, info]) => {
            let currentVal = '—';
            try { currentVal = info.point?.getOut().getValueDisplay() || '—'; } catch(e) {}
            const isOvr = info.point ? checkIfOverridden(info.point) : null;
            const chip = document.createElement('div');
            chip.className = 'topbar-or-chip' + (isOvr ? ' overridden' : '');
            chip.dataset.pointId = pointId;
            chip.addEventListener('click', () => {
                openORModal(pointId);
                document.getElementById('topbar-or-dropdown')?.classList.remove('open');
            });
            chip.innerHTML = `<span class="topbar-or-chip-name">${decodeNiagaraName(info.name)}</span><span class="topbar-or-chip-value" id="topbar-or-val-${CSS.escape(pointId)}">${currentVal}</span>`;
            chips.appendChild(chip);
        });
        if (btn && topbarPoints.length > 0) {
            btn.removeAttribute('disabled');
            btn.title = `${topbarPoints.length} overridable point(s)`;
        }
    }

    /* ── Unified live update loop (2 s) ─────────────────────────── */
  function startORLiveUpdate() {
        setInterval(() => {
            Object.entries(resolvedORById).forEach(([pointId, info]) => {
                const isOvr = checkIfOverridden(info.point);

                // 1. Graphic OR bubble state
                if (info.orBtn) setORBubbleState(info.orBtn, isOvr);

                // 2. Topbar chip value + overridden class
                if (!info.isGraphic) {
                    const valEl = document.getElementById(`topbar-or-val-${CSS.escape(pointId)}`);
                    const chip  = document.querySelector(`.topbar-or-chip[data-point-id="${pointId}"]`);
                    if (valEl) {
                        try { valEl.textContent = info.point.getOut().getValueDisplay() || '—'; } catch(e) {}
                        if (chip) chip.classList.toggle('overridden', !!isOvr);
                    }
                }
            });

            // 3. Skip modal refresh while it's open — user may be typing
            // Manual refresh only (via Refresh button inside modal)
        }, 2000);
    }

    // ── Manual refresh function called by the Refresh button ──
    window.manualORModalRefresh = function() {
        if (!orCurrentPointId) return;
        const info = resolvedORById[orCurrentPointId];
        if (info) updateORModalDisplay(info.point, info.name, info.type, orCurrentPointId);
    };

    /* ── Open OR modal ──────────────────────────────────────────── */
  window.openORModal = function(pointId) {
        const info = resolvedORById[pointId];
        if (!info || !info.point) { alert('Override point not yet loaded. Please wait and try again.'); return; }
        orCurrentPointId = pointId;
        updateORModalDisplay(info.point, info.name, info.type, pointId);
        orModal.classList.add('active');
        document.getElementById('topbar-or-dropdown')?.classList.remove('open');
        // Restore countdown display if this point has an active timer
        if (window.restoreORCountdownDisplay) window.restoreORCountdownDisplay(pointId);
    };

    function updateORModalDisplay(point, pointName, pointType, pointId) {
        if (!point) return;
        const isOvr   = checkIfOverridden(point);
        const decoded = decodeNiagaraName(pointName);

        // Title & point name
        if (orModalTitle)     orModalTitle.textContent = `Override — ${decoded}`;
        if (orModalPointName) orModalPointName.textContent = decoded;

        // Status badge
        const badge = document.getElementById('or-modal-status-badge');
        if (badge) {
            if (isOvr === 'OVERRIDDEN') { badge.textContent = '◈ OVERRIDDEN'; badge.className = 'or-status-badge badge-overridden'; }
            else if (isOvr === 'FAULT') { badge.textContent = '⚠ FAULT / ALARM'; badge.className = 'or-status-badge badge-fault'; }
            else                        { badge.textContent = '⬤ AUTO'; badge.className = 'or-status-badge badge-auto'; }
        }

        // Modal border & header colour
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('is-overridden', 'is-fault');
            if (isOvr === 'OVERRIDDEN') modalContent.classList.add('is-overridden');
            else if (isOvr === 'FAULT') modalContent.classList.add('is-fault');
        }

        // Live out value
        if (orModalPointValue) {
            try {
                const val = point.getOut().getValueDisplay();
                orModalPointValue.textContent = val !== null && val !== undefined ? val : '—';
                orModalPointValue.className   = 'modal-point-value';
                if (isOvr === 'OVERRIDDEN')      orModalPointValue.classList.add('status-override');
                else if (isOvr === 'FAULT')       orModalPointValue.classList.add('status-fault');
                else {
                    const rawVal = String(point.getOut().getValue() ?? '').toLowerCase();
                    orModalPointValue.classList.add(rawVal.includes('on') || rawVal === 'true' || parseFloat(rawVal) > 0 ? 'status-on' : 'status-off');
                }
            } catch(e) { orModalPointValue.textContent = 'Error'; orModalPointValue.className = 'modal-point-value status-fault'; }
        }

        // Update matching OR bubble
        if (pointId) {
            const info = resolvedORById[pointId];
            if (info && info.orBtn) setORBubbleState(info.orBtn, isOvr);
        }

        // Control visibility
        if (orNumericControl) orNumericControl.style.display = 'none';
        if (orBooleanControl) orBooleanControl.style.display = 'none';
        if (orEnumControl)    orEnumControl.style.display    = 'none';

        if (pointType === 'numeric') {
            if (orNumericControl) orNumericControl.style.display = 'flex';
            if (orModalNumericIn) {
                try { const cur = point.getOut().getValueDisplay(); orModalNumericIn.placeholder = cur ? `Current: ${cur}` : 'Enter value'; } catch(e) { orModalNumericIn.placeholder = 'Enter value'; }
                orModalNumericIn.value = '';
            }
        } else if (pointType === 'boolean') {
            if (orBooleanControl) orBooleanControl.style.display = 'flex';
            if (orModalCommandDr) orModalCommandDr.value = 'on';
        } else if (pointType === 'enum') {
            if (orEnumControl) orEnumControl.style.display = 'flex';
            populateEnumDropdown(pointId || orCurrentPointId);
        }
    }

    /* ── Populate enum dropdown ──────────────────────────────────── */
    function populateEnumDropdown(pointId) {
        if (!orModalEnumDr) return;
        orModalEnumDr.innerHTML = '';
        let options = enumPointFacets[pointId] || [];
        if (!options.length) {
            const info = resolvedORById[pointId];
            if (info && info.point) {
                options = parseFacetsFromPoint(info.point, pointId);
                if (options.length) enumPointFacets[pointId] = options;
            }
        }
        if (!options.length) {
            const o = document.createElement('option');
            o.textContent = '⚠ No options found – check console';
            orModalEnumDr.appendChild(o);
            return;
        }
        [...options].sort((a, b) => a.ordinal - b.ordinal).forEach(({ ordinal, label }) => {
            const o = document.createElement('option');
            o.value = ordinal;
            o.textContent = label;
            orModalEnumDr.appendChild(o);
        });
    }

    /* ── Modal listeners ─────────────────────────────────────────── */
    function initORModalListeners() {
        if (orModalCloseBtn)  orModalCloseBtn.addEventListener('click',  () => orModal.classList.remove('active'));
        if (orModalCancelBtn) orModalCancelBtn.addEventListener('click', () => orModal.classList.remove('active'));
        if (orModal) orModal.addEventListener('click', e => { if (e.target === orModal) orModal.classList.remove('active'); });

        if (orModalOverrideBtn) {
            orModalOverrideBtn.addEventListener('click', () => {
                if (!orCurrentPointId) return;
                const info = resolvedORById[orCurrentPointId];
                if (!info || !info.point) return;

                const duration = orModalDurationDr.value;
                let durationSec = null;
                if (duration !== 'permanent') {
                    const map = { '1min':60,'5min':300,'30min':1800,'1hour':3600,'2hours':7200,'4hours':14400,'8hours':28800 };
                    durationSec = map[duration];
                }

              if (info.type === 'numeric') {
                    const v = parseFloat(orModalNumericIn.value);
                    if (isNaN(v)) { alert('Please enter a valid number.'); return; }
                    performNumericOverride(info.point, v, durationSec);
                } else if (info.type === 'boolean') {
                    const cmd = orModalCommandDr.value;
                    if (cmd === 'on') performActiveOverride(info.point, durationSec);
                    else if (cmd === 'off') performInactiveOverride(info.point, durationSec);
                    else { releaseToAuto(info.point); if (window.stopORCountdown) window.stopORCountdown(orCurrentPointId); }
                } else if (info.type === 'enum') {
                    const ord = parseInt(orModalEnumDr.value, 10);
                    if (isNaN(ord)) { alert('Please select a valid option.'); return; }
                    performEnumOverride(info.point, ord, durationSec);
                }

                // ── Start countdown for timed overrides ──
                if (durationSec && window.startORCountdown) {
                    window.startORCountdown(orCurrentPointId, durationSec, info.graphicTargetId);
                }

                setTimeout(() => {
                    const upd = resolvedORById[orCurrentPointId];
                    if (upd) updateORModalDisplay(upd.point, upd.name, upd.type, orCurrentPointId);
                }, 800);
            });
        }

        if (orModalReleaseBtn) {
            orModalReleaseBtn.addEventListener('click', () => {
                const info = resolvedORById[orCurrentPointId];
if (info && info.point) {
    releaseToAuto(info.point);
    if (window.stopORCountdown) window.stopORCountdown(orCurrentPointId);
    setTimeout(() => updateORModalDisplay(info.point, info.name, info.type, orCurrentPointId), 800);
}
            });
        }
    }

    /* ── Override actions ────────────────────────────────────────── */
    function performNumericOverride(point, value, durationSec=null) {
        const p = baja.$('control:NumericOverride');
        p.setValue(value);
        if (durationSec !== null) p.setDuration(baja.RelTime.make({ seconds: durationSec }));
        point.invoke({ slot:'override', value:p }).then(() => console.log('Numeric override OK:', value)).catch(e => console.warn('Numeric override failed:', e.message));
    }
    function performActiveOverride(point, durationSec=null) {
        const p = baja.$("control:Override");
        if (durationSec !== null) p.setDuration(baja.RelTime.make({ seconds: durationSec }));
        point.invoke({ slot:'active', value:p }).then(() => console.log('Active override OK')).catch(e => console.error(e));
    }
    function performInactiveOverride(point, durationSec=null) {
        const p = baja.$("control:Override");
        if (durationSec !== null) p.setDuration(baja.RelTime.make({ seconds: durationSec }));
        point.invoke({ slot:'inactive', value:p }).then(() => console.log('Inactive override OK')).catch(e => console.error(e));
    }
    function performEnumOverride(point, ordinal, durationSec=null) {
        function makeDynEnum(ord) {
            let d = null;
            if (baja.DynamicEnum && typeof baja.DynamicEnum.make === 'function') {
                try { d = baja.DynamicEnum.make(ord); } catch(e) {}
            }
            if (!d) {
                d = baja.$('baja:DynamicEnum');
                if (typeof d.setOrdinal === 'function') d.setOrdinal(ord);
            }
            return d;
        }
        const p = baja.$('control:EnumOverride');
        p.setValue(makeDynEnum(ordinal));
        if (durationSec !== null) p.setDuration(baja.RelTime.make({ seconds: durationSec }));
        point.invoke({ slot:'override', value:p }).then(() => console.log('Enum override OK:', ordinal)).catch(e => console.warn('Enum override failed:', e.message));
    }
    function releaseToAuto(point) {
        point.invoke({ slot:'auto' }).then(() => console.log('Released to AUTO')).catch(e => console.error(e));
    }

    window.addEventListener('beforeunload', () => { try { orSubscriber.unsubscribeAll(); } catch(e) {} });

})();
});



require(['baja!'], function(baja) {
'use strict';

function decodeNiagaraName(name) {
    if (!name) return name;
    return name.replace(/\$([0-9a-fA-F]{2})/g, (m,h) => String.fromCharCode(parseInt(h,16)));
}

const fullFilename = window.location.pathname.split('/').pop();
const headerName   = fullFilename.replace('.html', '');
const pathName     = headerName.replace(/-/g, '_');
const headerElement = document.getElementById('ahu-header');
if (headerElement) headerElement.textContent = decodeNiagaraName(pathName);

const IMG_BASE    = '../VAV_IMAGES/';
const VAVGeneric  = IMG_BASE + 'VAV-Temp.png';
const VAVCoils    = IMG_BASE + 'VAV-EH-Temp.png';
const VAVCoilsWATER  = IMG_BASE + 'VAV-HW-Temp.png';
const VAVFanCoils = IMG_BASE + 'VAV-Series-EH-Temp.png';
const VAVFan      = IMG_BASE + 'VAV-Series-Temp.png';

const Damp0  = '';
const Damp1  = IMG_BASE + 'Damper10.png';
const Damp4  = IMG_BASE + 'Damper06.png';
const Damp5  = IMG_BASE + 'Damper03.png';

const CoilsONheat      = IMG_BASE + 'EH10.png';
const CoilsOFF         = '';

let currentReheatValue = 0;
let currentDeviceType  = 'N/A';
let currentDamperValue = 0;
let idMapping          = {};
let dataPoints         = {};
let elements           = {};
let globalConfigData   = null;

const subscriber = new baja.Subscriber();

function updateHeatingGraphic(pointValue, typeValue) {
    let elementId;
    if (typeValue === 'FANR')       elementId = 'FANRimg';
    else if (typeValue === 'HEAT')  elementId = 'Heating-Coils-FAN';
    else if (typeValue === 'HEATW') elementId = 'HeatWater';
    else                            elementId = 'Heating-Coils-NONE';

    const HeatingImg = document.getElementById(elementId);
    if (!HeatingImg) return;
    HeatingImg.style.position = "absolute";

    if (typeValue === 'FANR')       { HeatingImg.style.left = "52%"; HeatingImg.style.top = "58%"; HeatingImg.style.width = "9%"; }
    else if (typeValue === 'HEAT')  { HeatingImg.style.left = "77.5%"; HeatingImg.style.top = "44%"; HeatingImg.style.width = "6.0%"; }
    else if (typeValue === 'HEATW') { HeatingImg.style.left = "50%"; HeatingImg.style.top = "63%"; HeatingImg.style.width = "8%"; }
    else                            { HeatingImg.style.left = "50%"; HeatingImg.style.top = "60%"; HeatingImg.style.width = "8%"; }

    pointValue = parseFloat(pointValue);
    let imageSrc;
    if (pointValue >= 1) {
        if (typeValue === 'HEAT' || typeValue === 'FANR') imageSrc = CoilsONheat;
        // else if (typeValue === 'HEATW') imageSrc = CoilsONheat; // CoilsONheatWATER if you add that image
    } else { imageSrc = CoilsOFF; }
    HeatingImg.src = imageSrc;
    console.log("Heating Call:", pointValue, typeValue);
}

function updateDamperGraphic(pointValue, typeValue) {
    let elementId;
    if (typeValue === 'FANR')       elementId = 'img-Damper-OA-FANREHEAT';
    else if (typeValue === 'HEAT')  elementId = 'img-Damper-OA-HEATONLY';
    else if (typeValue === 'FAN')   elementId = 'img-Damper-OA-FANONLY';
    else if (typeValue === 'HEATW') elementId = 'Damper-HEATWATER';
    else                            elementId = 'img-Damper-OA-NONE';
    const damperImgOA = document.getElementById(elementId);
    if (!damperImgOA) return;
    const val = parseFloat(pointValue);
    if (isNaN(val)) return;
    let imageSrc;
    if      (val > 83.3) imageSrc = Damp0;
    else if (val > 66.6) imageSrc = Damp5;
    else if (val > 16.6) imageSrc = Damp4;
    else                 imageSrc = Damp1;
    damperImgOA.src = imageSrc;
}

function updateVAVGraphic(typeValue) {
    const VAVImg       = document.getElementById('VAVType');
    const fanStat      = document.getElementById('FANSTAT');
    const reheatWrap   = document.querySelector('.pill-wrap[data-spanid="Reheat1"]');
    if (!VAVImg) return;
    if (fanStat) fanStat.style.display = (typeValue === 'FAN' || typeValue === 'FANR') ? '' : 'none';
    if (reheatWrap) {
        if (typeValue === 'FAN' || typeValue === 'N/A') reheatWrap.classList.add('hidden-row');
        else reheatWrap.classList.remove('hidden-row');
    }
    let imageSrc, FAN = null, FANR = null;
    if      (typeValue === 'HEAT')  { imageSrc = VAVCoils; }
    else if (typeValue === 'FAN')   { imageSrc = VAVFan; FAN = ''; }
    else if (typeValue === 'FANR')  { imageSrc = VAVFanCoils; FANR = ''; }
    else if (typeValue === 'HEATW') { imageSrc = VAVCoilsWATER; }
    else                            { imageSrc = VAVGeneric; }
    VAVImg.src = imageSrc;
    const secondImg  = document.getElementById('FANONLY');
    if (FAN && typeValue === 'FAN') { if (secondImg) { secondImg.src = FAN; secondImg.style.cssText = 'display:inline-block;position:absolute;left:52.5%;top:46%;width:6.5%;height:auto;z-index:10;'; } }
    else { if (secondImg) secondImg.style.display = 'none'; }
    const secondImgR = document.getElementById('FANimg');
    if (FANR && typeValue === 'FANR') { if (secondImgR) { secondImgR.src = FANR; secondImgR.style.cssText = 'display:inline-block;position:absolute;left:49.25%;top:47.7%;width:7%;height:auto;z-index:10;'; } }
    else { if (secondImgR) secondImgR.style.display = 'none'; }
}

function handleDeviceType(globalConfig, deviceName) {
    const deviceConfig = globalConfig?.globalVariables?.[deviceName];
    if (deviceConfig && deviceConfig.Type) {
        currentDeviceType = deviceConfig.Type;
    } else {
        currentDeviceType = 'N/A';
    }
    updateVAVGraphic(currentDeviceType);
    updateHeatingGraphic(currentReheatValue, currentDeviceType);
    updateDamperGraphic(currentDamperValue, currentDeviceType);
}

/* ── SP functionality ─────────────────────────────────────────────── */
const SP_ID_MAPPING = { "Eff":"Space-Setpoint", "Flow":"AirFlow-SP", "Damp_Pos":"Damp-Pos-Cmd" };
let spPointValues = {}, spPointDetails = {};

function decodePointName(encodedName) {
    if (!encodedName) return encodedName;
    return encodedName.replace(/\$([0-9A-Fa-f]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function getActualValue(divId) {
    const spanIdMap = { "DA":"DA-T","Damp_Pos":"DPR-Pos","Reheat":"Reheat1","Flow":"Air-Flow","OC":"Occupancy","Mode":"Mode","ModeStatus":"HVACModeStatus","Eff":"Space-Temp","FS":"Fan-Stat" };
    const spanId = spanIdMap[divId];
    if (!spanId) return null;
    const spanElement = document.getElementById(spanId);
    if (spanElement) {
        const m = (spanElement.textContent||spanElement.innerText).match(/[-+]?\d*\.?\d+/);
        if (m) return parseFloat(m[0]);
    }
    return null;
}

function createComparisonBar(actualValue, spValue) {
    const actual = parseFloat(actualValue), sp = parseFloat(spValue);
    if (isNaN(actual)||isNaN(sp)) return '<p style="color:var(--text-muted);">Non-numeric values</p>';
    const difference = Math.abs(actual-sp);
    const maxVal = Math.max(actual,sp), minVal = Math.min(actual,sp), range = maxVal-minVal;
    let statusColor = 'var(--green)', statusText = 'On Target';
    if (difference > sp*0.1) { statusColor = 'var(--red)'; statusText = 'Needs Attention'; }
    else if (difference > sp*0.05) { statusColor = 'var(--amber)'; statusText = 'Slight Deviation'; }
    const spPosition = sp===actual?50:((sp-minVal)/(range||1))*100;
    const actualPosition = sp===actual?50:((actual-minVal)/(range||1))*100;
    return `<div style="margin:20px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="text-align:center;flex:1;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-head);">Setpoint</div><div style="font-size:24px;font-weight:bold;color:var(--accent);font-family:var(--font-head);">${sp}</div></div>
            <div style="text-align:center;flex:1;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-head);">Actual</div><div style="font-size:24px;font-weight:bold;color:${statusColor};font-family:var(--font-head);">${actual}</div></div>
            <div style="text-align:center;flex:1;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-head);">Difference</div><div style="font-size:24px;font-weight:bold;color:var(--text-muted);font-family:var(--font-head);">${difference.toFixed(2)}</div></div>
        </div>
        <div style="position:relative;height:36px;background:var(--bg-panel);border-radius:18px;overflow:hidden;border:1px solid var(--border);">
            <div style="position:absolute;left:${spPosition}%;top:0;bottom:0;width:2px;background:var(--accent);z-index:2;"></div>
            <div style="position:absolute;left:${actualPosition}%;top:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:${statusColor};border:2px solid var(--bg-deep);border-radius:50%;z-index:3;box-shadow:0 0 8px ${statusColor};"></div>
        </div>
        <div style="text-align:center;margin-top:24px;padding:10px;background:rgba(0,0,0,0.2);border-radius:6px;border-left:3px solid ${statusColor};font-family:var(--font-head);font-size:12px;letter-spacing:1px;color:${statusColor};">Status: ${statusText}</div>
    </div>`;
}

window.showSPData = function(divId) {
    const spPointId = SP_ID_MAPPING[divId];
    if (!spPointId) { alert(`No setpoint mapping for: ${divId}`); return; }
    const spValue  = spPointValues[spPointId];
    const spDetails = spPointDetails[spPointId];
    if (spValue !== undefined && spDetails) {
        const actualValue = getActualValue(divId);
        const decodedName = decodePointName(spDetails.name);
        const existingPopup = document.getElementById('sp-popup');
        if (existingPopup) existingPopup.remove();
        const popup = document.createElement('div');
        popup.id = 'sp-popup';
        popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-panel);border:1px solid var(--border);border-radius:14px;padding:28px;z-index:10000;min-width:440px;max-width:580px;box-shadow:0 24px 80px rgba(0,0,0,0.6);backdrop-filter:blur(12px);';
        popup.innerHTML = `
            <h3 style="margin-top:0;color:var(--accent);font-family:var(--font-head);font-size:13px;letter-spacing:3px;text-transform:uppercase;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:16px;">${divId} Setpoint Details</h3>
            <div style="margin:14px 0;font-family:var(--font-head);font-size:12px;">
                <p style="margin:6px 0;color:var(--text-muted);">Point ID: <span style="color:var(--text-primary);">${spPointId}</span></p>
                <p style="margin:6px 0;color:var(--text-muted);">Name: <span style="color:var(--text-primary);">${decodedName}</span></p>
                <p style="margin:6px 0;color:var(--text-muted);word-break:break-all;font-size:10px;">${spDetails.fullPath}</p>
            </div>
            <div style="margin:16px 0;padding:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
                <h4 style="margin:0 0 12px 0;color:var(--text-muted);font-family:var(--font-head);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Comparison</h4>
                ${actualValue !== null ? createComparisonBar(actualValue, spValue) : '<p style="color:var(--text-muted);font-family:var(--font-head);font-size:12px;">Actual value unavailable</p>'}
            </div>
            <button onclick="document.getElementById('sp-popup').remove()" style="width:100%;padding:10px;background:rgba(0,200,255,0.1);color:var(--accent);border:1px solid rgba(0,200,255,0.3);border-radius:6px;cursor:pointer;font-family:var(--font-head);font-size:12px;letter-spacing:2px;text-transform:uppercase;">Close</button>`;
        document.body.appendChild(popup);
    } else { alert(`No value for setpoint ID: ${spPointId}`); }
};

function findPointByID(pointId) {
    if (!globalConfigData?.globalVariables?.[headerName]) return null;
    const points = globalConfigData.globalVariables[headerName].points;
    let found = points.find(p => p.id === pointId);
    if (found) return found;
    const pointName = pointId.replace(/-/g, '_');
    found = points.find(p => p.name === pointName) || points.find(p => p.name === pointId);
    if (found) return found;
    return points.find(p =>
        (p.id && p.id.toLowerCase().includes(pointId.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(pointId.toLowerCase())) ||
        pointId.toLowerCase().includes(p.name.toLowerCase())
    ) || null;
}

function subscribeToSPPointByID(pointId) {
    const point = findPointByID(pointId);
    if (!point) return;
    spPointDetails[pointId] = { name: point.name, fullPath: point.fullPath };
    baja.Ord.make(point.fullPath).get({ subscriber })
        .then(bajaPoint => {
            bajaPoint.userData = { pointId, isSP: true };
            const val = bajaPoint.getOut().getValueDisplay();
            spPointValues[pointId] = val;
            Object.entries(SP_ID_MAPPING).forEach(([divId, mappedId]) => {
                if (mappedId === pointId) {
                    const btn = document.getElementById(`sp-${divId}`);
                    if (btn && val !== null && val !== undefined && String(val).trim() !== '') btn.classList.add('sp-ready');
                }
            });
        })
        .catch(e => console.error(`SP subscribe failed ${pointId}:`, e));
}

function subscribeToAllSPPoints() { [...new Set(Object.values(SP_ID_MAPPING))].forEach(id => subscribeToSPPointByID(id)); }

function applyValueToSpan(element, displayValue, value, isOverridden) {
    if (!element || element.tagName === 'IMG') return;
    element.style.color = '';
    element.className = element.className.replace(/\b(status-on|status-off|status-fault|override-on|override-active|data-value|pill-value)\b/g,'').trim();
    const baseClass = element.closest('.point-display-inner') ? 'pill-value' : (element.classList.contains('pill-value') ? 'pill-value' : 'data-value');
    if (isOverridden) {
        element.className = `${baseClass} override-active`;
        element.textContent = `${displayValue} ◈`;
    } else {
        const valStr = String(value ?? '').toLowerCase();
        const isOn = valStr.includes('on') || valStr.includes('true') || parseFloat(value) > 0;
        element.className = `${baseClass} ${isOn ? 'status-on' : 'status-off'}`;
        element.textContent = displayValue;
    }
}

subscriber.attach('changed', function(prop) {
    if (prop.getName() !== 'out') return;
    const pointInfo = this.userData;
    if (pointInfo && pointInfo.isSP) {
        const val = this.getOut().getValueDisplay();
        spPointValues[pointInfo.pointId] = val;
        Object.entries(SP_ID_MAPPING).forEach(([divId, mappedId]) => {
            if (mappedId === pointInfo.pointId) {
                const btn = document.getElementById(`sp-${divId}`);
                if (btn && val !== null && val !== undefined && String(val).trim() !== '') btn.classList.add('sp-ready');
            }
        });
        return;
    }
    if (pointInfo && elements[pointInfo.elementId]) {
        const out = this.getOut();
        const displayValue = out.getValueDisplay();
        const value        = out.getValue();
        const isOverridden = this.getStatus().isOverridden();
        if (idMapping['DPR-Pos'] === pointInfo.elementId) { currentDamperValue = value; updateDamperGraphic(currentDamperValue, currentDeviceType); }
        if (idMapping['Reheat1'] === pointInfo.elementId) { currentReheatValue = value; updateHeatingGraphic(currentReheatValue, currentDeviceType); }
        const element = elements[pointInfo.elementId];
        console.log("Point Update:", pointInfo.elementId, value);
        applyValueToSpan(element, displayValue, value, isOverridden);
        if (displayValue && displayValue.trim() !== '' && displayValue.trim() !== '—') {
            if (window.expandPointRow) window.expandPointRow(pointInfo.spanId || '');
        }
    }
});

function subscribeToPoint(pointOrd, elementId, spanId) {
    baja.Ord.make(pointOrd).get({ subscriber })
        .then(point => {
            point.userData = { elementId, spanId };
            const out          = point.getOut();
            const displayValue = out.getValueDisplay();
            const value        = out.getValue();
            const isOverridden = point.getStatus().isOverridden();
            if (idMapping['DPR-Pos'] === elementId) { currentDamperValue = value; updateDamperGraphic(currentDamperValue, currentDeviceType); }
            if (idMapping['Reheat1'] === elementId)  { currentReheatValue = value; updateHeatingGraphic(currentReheatValue, currentDeviceType); }
            const element = elements[elementId];
            applyValueToSpan(element, displayValue, value, isOverridden);
            if (displayValue && displayValue.trim() !== '' && displayValue.trim() !== '—') {
                if (window.expandPointRow) window.expandPointRow(spanId || elementId);
            }
        })
        .catch(error => {
            console.error(`Failed to connect to ${elementId}:`, error);
            const element = elements[elementId];
            if (element && element.tagName !== 'IMG') { element.textContent = 'Err'; element.classList.add('status-fault'); }
        });
}

async function loadGlobalConfiguration() {
    try {
        const response = await fetch('../../Global.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch(error) { console.error('Failed to load Global.json:', error); return null; }
}

function extractDevicePoints(globalConfig, deviceName) {
    if (!globalConfig?.globalVariables) return [];
    const keys = Object.keys(globalConfig.globalVariables);
    let match = globalConfig.globalVariables[deviceName];
    if (!match) match = globalConfig.globalVariables[keys.find(k => k.toLowerCase() === deviceName.toLowerCase())];
    return (match?.points) || [];
}

const POINT_ID_TO_SPAN_ID = {
    'DA-T':'DA-T','DPR-Pos':'DPR-Pos','Reheat1':'Reheat1',
    'Air-Flow':'Air-Flow','Occupancy':'Occupancy','Mode':'Mode',
    'HVACModeStatus':'HVACModeStatus','Space-Temp':'Space-Temp','Fan-Stat':'Fan-Stat',
};

function buildDataPointsFromGlobal(devicePoints, basePath) {
    const localDataPoints = {}, localElements = {}, localIdMapping = {};
    const excludedPoints  = ['Note1','Note2','Note3','StringWritable'];
    const excludedTags    = new Set(['SP-Numeric','SP-Boolean','SP-Enum']); // skip SP command points from display
    const naTableBody     = document.getElementById('unit-data-tbody');

    devicePoints.forEach(point => {
        // Skip SP-tag points — they are override command points, not display values
        // if (excludedTags.has(point.id) || excludedTags.has(point.id2)) return;
        if (excludedTags.has(point.id)) return;

        const pointPath = point.fullPath || basePath.replace('{pointName}', point.name);
        localDataPoints[point.name] = pointPath;
        if (point.id && point.id !== 'N/A') localIdMapping[point.id] = point.name;

        if (!point.id || point.id === 'N/A') {
            if (excludedPoints.includes(point.name)) return;
            if (!naTableBody) return;
            const row = document.createElement('tr');
            const nameCell = document.createElement('td'); nameCell.textContent = decodeNiagaraName(point.name);
            const valueCell = document.createElement('td'); valueCell.id = `na-${point.name}`; valueCell.textContent = '—';
            row.appendChild(nameCell); row.appendChild(valueCell);
            naTableBody.appendChild(row);
            localElements[point.name] = valueCell;
        } else {
            const element = document.getElementById(point.id);
            if (element) localElements[point.name] = element;
        }
    });
    return { dataPoints: localDataPoints, elements: localElements, idMapping: localIdMapping };
}

async function initializeMonitoring() {
    const globalConfig = await loadGlobalConfiguration();
    globalConfigData = globalConfig;
    if (!globalConfig) { showErrorMessage('Failed to load Global.json'); return; }
    const devicePoints = extractDevicePoints(globalConfig, headerName);
    if (devicePoints.length === 0) { showErrorMessage(`No config for "${headerName}"`); return; }
    const basePath = globalConfig.globalVariables[headerName]?.basePath ||
                     `station:|slot:/Drivers/BcpBacnetNetwork/${headerName}/points/{pointName}`;
    const result = buildDataPointsFromGlobal(devicePoints, basePath);
    dataPoints = result.dataPoints;
    elements   = result.elements;
    idMapping  = result.idMapping;
    handleDeviceType(globalConfig, headerName);
    setTimeout(() => {
        let count = 0;
        for (const [pointName, pointPath] of Object.entries(dataPoints)) {
            const matchingId = Object.keys(idMapping).find(k => idMapping[k] === pointName);
            const spanId = matchingId ? POINT_ID_TO_SPAN_ID[matchingId] || matchingId : pointName;
            subscribeToPoint(pointPath, pointName, spanId);
            count++;
        }
        subscribeToAllSPPoints();
        showSuccessMessage(`Monitoring ${count} points for ${decodeNiagaraName(headerName)}`);
        // setTimeout(() => cleanupLoadingElementsAndSetDefaults(), 500);
    }, 500);
}

// function cleanupLoadingElementsAndSetDefaults() {
//     for (const [elementId, element] of Object.entries(elements)) {
//         if (element && element.tagName !== 'IMG') {
//             const text = (element.textContent||element.innerText).trim();
//             if (text === 'Loading...') { element.style.display = 'none'; if (element.parentElement) element.parentElement.style.display = 'none'; }
//         }
//     }
//     const hvacModeElement = document.getElementById('HVACModeStatus');
//     if (hvacModeElement) {
//         if (currentDeviceType === 'N/A') { hvacModeElement.textContent = 'Cool'; hvacModeElement.className = 'data-value status-on'; }
//         else if ((hvacModeElement.textContent||hvacModeElement.innerText).trim() === 'Loading...') { hvacModeElement.style.display = 'none'; if (hvacModeElement.parentElement) hvacModeElement.parentElement.style.display = 'none'; }
//     }
// }

function showErrorMessage(message) {
    console.error(message);
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--bg-card);border:1px solid var(--red);border-radius:10px;padding:16px 24px;z-index:9999;font-family:var(--font-head);font-size:13px;color:var(--red);text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);letter-spacing:1px;max-width:480px;';
    div.textContent = message; document.body.appendChild(div);
    setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 15000);
}

function showSuccessMessage(message) {
    console.log(message);
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:80px;right:20px;background:var(--bg-card);border:1px solid rgba(0,230,118,0.4);border-radius:8px;padding:10px 18px;z-index:9999;font-family:var(--font-head);font-size:12px;color:var(--green);letter-spacing:1px;box-shadow:0 4px 16px rgba(0,0,0,0.4);';
    div.textContent = message; document.body.appendChild(div);
    setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 5000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMonitoring);
else setTimeout(initializeMonitoring, 100);

window.addEventListener('beforeunload', () => { if (subscriber) subscriber.unsubscribeAll(); });

});

let ahuExportHistoryCache = new Map();

function decodeASCIIName(name) {
    if (!name) return name;
    return name.replace(/\$([0-9a-fA-F]{2})/g, (m,h) => String.fromCharCode(parseInt(h,16)));
}

async function discoverAHUHistoryOrd(pointOrd) {
    return new Promise((resolve, reject) => {
        try {
            require(['baja!'], function(baja) {
                baja.Ord.make(pointOrd).get().then(entity => entity.tags()).then(tagMap => {
                    const historyTag = tagMap.get('n:history');
                    if (historyTag && historyTag.toString().trim() !== '') {
                        let historyPath = historyTag.toString();
                        if (!historyPath.startsWith('history:')) historyPath = 'history:' + historyPath;
                        resolve(historyPath);
                    } else { reject(new Error('No n:history tag on: ' + pointOrd)); }
                }).catch(err => reject(new Error('Failed tags: ' + err.message)));
            });
        } catch(e) { reject(e); }
    });
}

async function loadAHUHistoryData(pointPath, startTime, endTime, maxPoints = 2000) {
    return new Promise(async (resolve, reject) => {
        try {
            const cacheKey = pointPath;
            let historyOrd = ahuExportHistoryCache.get(cacheKey);
            if (!historyOrd) {
                try { historyOrd = await discoverAHUHistoryOrd(pointPath); ahuExportHistoryCache.set(cacheKey, historyOrd); }
                catch(e) { console.warn(`No history for ${pointPath}:`, e.message); resolve([]); return; }
            }
            require(['baja!'], function(baja) {
                const timeCondition = `timestamp >= '${startTime.toISOString()}' and timestamp <= '${endTime.toISOString()}'`;
                const bqlQuery = historyOrd + '|bql:select timestamp, value where ' + timeCondition + ' order by timestamp';
                const dataPoints = [];
                baja.Ord.make(bqlQuery).get({ cursor: { limit: maxPoints, each: function() { const row=this.get(); const date=new Date(row.get("timestamp").getMillis()); dataPoints.push({ timestamp:date, timestampString:date.toLocaleString(), value:row.get("value") }); } } })
                    .then(() => resolve(dataPoints)).catch(err => reject(new Error('BQL failed: ' + err.message)));
            });
        } catch(e) { reject(e); }
    });
}

function getReportStartDate() {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
}

async function generateAHUWeeklyPDFReport(jsonConfigData) {
    const container = document.getElementById('pdf-button-container');
    const originalContent = container.innerHTML;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--accent);font-family:var(--font-head);font-size:12px;letter-spacing:2px;">Loading weekly data...</div>';
    try {
const startDate = getReportStartDate(), endDate = new Date();
const ahuGroups = {};
        Object.keys(jsonConfigData).forEach(ahuName => {
            const ahuData = jsonConfigData[ahuName];
            if (ahuData.points && Array.isArray(ahuData.points)) {
                ahuGroups[ahuName] = ahuData.points.map(point => ({ id:point.id||'Unknown', label:decodeASCIIName(point.label||point.name||point.id||'Unknown'), unit:point.unit||'', path:point.path||point.fullPath||'' })).filter(p => p.path);
            }
        });
        if (!Object.keys(ahuGroups).length) { container.innerHTML = originalContent; alert('No AHU data found'); return; }
        const allPointsForHistory = [];
        Object.keys(ahuGroups).forEach(ahuName => { ahuGroups[ahuName].forEach(point => allPointsForHistory.push({ ahuName, pointId:point.id, label:point.label, unit:point.unit, path:point.path })); });
        const allHistoryData = await Promise.all(allPointsForHistory.map(point =>
            loadAHUHistoryData(point.path, startDate, endDate, 2000)
                .then(data => ({ ahuName:point.ahuName, pointId:point.pointId, label:point.label, unit:point.unit, data }))
                .catch(() => ({ ahuName:point.ahuName, pointId:point.pointId, label:point.label, unit:point.unit, data:[] }))
        ));
        const pointStats = allHistoryData.map(pointHistory => {
            const values = pointHistory.data.map(d => typeof d.value==='boolean'?(d.value?1:0):parseFloat(d.value)).filter(v=>!isNaN(v));
            const stats  = values.length > 0 ? { count:values.length, min:Math.min(...values), max:Math.max(...values), avg:values.reduce((a,b)=>a+b,0)/values.length } : { count:pointHistory.data.length, hasData:false };
            return { ahuName:pointHistory.ahuName, pointId:pointHistory.pointId, label:pointHistory.label, unit:pointHistory.unit, stats, latestValue:pointHistory.data.length>0?pointHistory.data[pointHistory.data.length-1].value:null };
        });
        const reportDate = new Date().toLocaleString();
        const sortedAHUNames = Object.keys(ahuGroups).sort();
        let summaryHTML = '<div><h2>VAV Summary Statistics</h2>';
        sortedAHUNames.forEach(ahuName => {
            const ahuPoints = pointStats.filter(p => p.ahuName === ahuName);
            summaryHTML += `<h3>${decodeASCIIName(ahuName).replace(/_/g,' ')}</h3><table><thead><tr><th>Point</th><th>Latest</th><th>Min</th><th>Avg</th><th>Max</th><th>Count</th></tr></thead><tbody>`;
            ahuPoints.forEach((point, index) => {
                const bg = index%2===0?'#f5f5f5':'#ffffff';
                if (point.stats.hasData===false) { summaryHTML += `<tr style="background:${bg};"><td>${point.label}</td><td colspan="5" style="text-align:center;color:#999;">No Numeric Data</td></tr>`; }
                else {
                    let latestDisplay = 'N/A';
                    if (point.latestValue !== null) {
                        if (typeof point.latestValue==='boolean') latestDisplay = point.latestValue?'ON':'OFF';
                        else if (typeof point.latestValue==='number') latestDisplay = point.latestValue.toFixed(2)+(point.unit?' '+point.unit:'');
                        else latestDisplay = String(point.latestValue);
                    }
                    const u = point.unit?' '+point.unit:'';
                    summaryHTML += `<tr style="background:${bg};"><td>${point.label}</td><td><strong>${latestDisplay}</strong></td><td>${point.stats.min.toFixed(2)}${u}</td><td>${point.stats.avg.toFixed(2)}${u}</td><td>${point.stats.max.toFixed(2)}${u}</td><td>${point.stats.count}</td></tr>`;
                }
            });
            summaryHTML += '</tbody></table>';
        });
        summaryHTML += '</div>';
const pdfHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Weekly Report</title><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;padding:15mm;font-size:10pt;color:#000;}
.header{text-align:center;margin-bottom:25px;border-bottom:3px solid #00c8ff;padding-bottom:15px;}
.header h1{color:#0d1117;font-size:24pt;margin-bottom:8px;}
.header p{color:#546e7a;font-size:10pt;}
.info-section{background:#f5f5f5;padding:15px;margin-bottom:20px;border-radius:5px;border:1px solid #ddd;}
.section-title{color:#0d1117;font-size:16pt;margin:28px 0 10px;border-bottom:2px solid #00c8ff;padding-bottom:6px;}
.unit-title{color:#37474f;font-size:13pt;margin:20px 0 8px;font-weight:bold;}
.point-title{color:#546e7a;font-size:11pt;margin:14px 0 5px;font-style:italic;}
table{width:100%;border-collapse:collapse;margin-bottom:12px;}
thead{background:#0d1117;color:white;}
th,td{padding:6px 10px;border:1px solid #ddd;font-size:8.5pt;text-align:left;}
tr:nth-child(even){background:#f9f9f9;}
.stat-table thead{background:#1a5276;}
.trend-table thead{background:#1e3a5f;}
.no-data{color:#999;font-style:italic;padding:8px;font-size:9pt;}
.no-print{position:fixed;top:10px;right:10px;background:white;padding:10px;border:2px solid #ddd;border-radius:5px;display:flex;gap:8px;}
@media print{.no-print{display:none;}}
</style></head><body>

<div class="header">
    <h1>Weekly Performance Report</h1>
    <p>7-Day Data: ${startDate.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} → ${endDate.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
</div>

<div class="info-section">
    <p><strong>Generated:</strong> ${reportDate}</p>
    <p><strong>Date Range:</strong> ${startDate.toLocaleString()} → ${endDate.toLocaleString()}</p>
    <p><strong>Units:</strong> ${sortedAHUNames.length} | <strong>Total Points:</strong> ${allPointsForHistory.length}</p>
</div>

<div class="section-title">Summary Statistics</div>
${sortedAHUNames.map(ahuName => {
    const ahuPoints = pointStats.filter(p => p.ahuName === ahuName);
    return `<div class="unit-title">${decodeASCIIName(ahuName).replace(/_/g,' ')}</div>
    <table class="stat-table">
        <thead><tr><th>Point</th><th>Latest Value</th><th>Min</th><th>Average</th><th>Max</th><th>Samples</th></tr></thead>
        <tbody>${ahuPoints.map((point, index) => {
            const bg = index % 2 === 0 ? '#f5f5f5' : '#ffffff';
            if (point.stats.hasData === false) {
                return `<tr style="background:${bg};"><td>${point.label}</td><td colspan="5" class="no-data">No numeric data available</td></tr>`;
            }
            let latestDisplay = 'N/A';
            if (point.latestValue !== null) {
                if (typeof point.latestValue === 'boolean') latestDisplay = point.latestValue ? 'ON' : 'OFF';
                else if (typeof point.latestValue === 'number') latestDisplay = point.latestValue.toFixed(2) + (point.unit ? ' ' + point.unit : '');
                else latestDisplay = String(point.latestValue);
            }
            const u = point.unit ? ' ' + point.unit : '';
            return `<tr style="background:${bg};"><td><strong>${point.label}</strong></td><td>${latestDisplay}</td><td>${point.stats.min.toFixed(2)}${u}</td><td>${point.stats.avg.toFixed(2)}${u}</td><td>${point.stats.max.toFixed(2)}${u}</td><td>${point.stats.count}</td></tr>`;
        }).join('')}</tbody>
    </table>`;
}).join('')}

<div class="section-title">Trend Data (All Readings)</div>
${sortedAHUNames.map(ahuName => {
    const unitPoints = allHistoryData.filter(p => p.ahuName === ahuName);
    return `<div class="unit-title">${decodeASCIIName(ahuName).replace(/_/g,' ')}</div>
    ${unitPoints.map(pointHistory => {
        if (!pointHistory.data || pointHistory.data.length === 0) {
            return `<div class="point-title">${pointHistory.label}</div><p class="no-data">No data recorded in this period.</p>`;
        }
        const u = pointHistory.unit ? ' ' + pointHistory.unit : '';
        return `<div class="point-title">${pointHistory.label} — ${pointHistory.data.length} readings</div>
        <table class="trend-table">
            <thead><tr><th>Timestamp</th><th>Value</th></tr></thead>
            <tbody>${pointHistory.data.map((d, i) => {
                const bg = i % 2 === 0 ? '#f5f5f5' : '#ffffff';
                let displayVal;
                if (typeof d.value === 'boolean') displayVal = d.value ? 'ON' : 'OFF';
                else if (typeof d.value === 'number') displayVal = d.value.toFixed(2) + u;
                else displayVal = String(d.value ?? '—');
                return `<tr style="background:${bg};"><td>${d.timestamp.toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})}</td><td>${displayVal}</td></tr>`;
            }).join('')}</tbody>
        </table>`;
    }).join('')}`;
}).join('')}

<div class="no-print">
    <button onclick="window.print()" style="padding:10px 20px;background:#0d1117;color:white;border:none;border-radius:5px;cursor:pointer;">🖨️ Save PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#546e7a;color:white;border:none;border-radius:5px;cursor:pointer;">Close</button>
</div>
</body></html>`;
container.innerHTML = originalContent;
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) { pdfWindow.document.write(pdfHTML); pdfWindow.document.close(); }
        else alert('Pop-up blocked. Please allow pop-ups.');
    } catch(error) { console.error('PDF error:', error); container.innerHTML = originalContent; alert('Failed to generate report: ' + error.message); }
}

function createAHUWeeklyPDFButton(jsonConfigData) {
    const container = document.getElementById('pdf-button-container');
    if (!container) return;
    container.innerHTML = '';
    const pdfBtn = document.createElement('button');
    pdfBtn.textContent = '📄 Weekly VAV PDF Report';
    pdfBtn.style.cssText = 'padding:8px 18px;background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:6px;color:var(--accent);cursor:pointer;font-family:var(--font-head);font-size:clamp(9px,0.7vw,12px);letter-spacing:1px;text-transform:uppercase;transition:all 0.2s;';
    pdfBtn.onclick = () => generateAHUWeeklyPDFReport(jsonConfigData);
    pdfBtn.onmouseover = () => { pdfBtn.style.background='rgba(0,200,255,0.2)'; pdfBtn.style.borderColor='var(--accent)'; };
    pdfBtn.onmouseout  = () => { pdfBtn.style.background='rgba(0,200,255,0.1)'; pdfBtn.style.borderColor='rgba(0,200,255,0.3)'; };
    container.appendChild(pdfBtn);
}

setTimeout(async () => {
    try {
        const fullFilename = window.location.pathname.split('/').pop();
        const headerName   = fullFilename.replace('.html', '');
        const response     = await fetch('../../Global.json');
        const jsonData     = await response.json();
        const ahuConfig    = jsonData.globalVariables[headerName];
        if (ahuConfig) { const pdfConfig = {}; pdfConfig[headerName] = { points: ahuConfig.points }; createAHUWeeklyPDFButton(pdfConfig); }
    } catch(e) { console.error('PDF button init failed:', e); }
}, 150);

(function() {
    const activeTimers = {};

    window.startORCountdown = function(pointId, durationSec, graphicTargetId) {
        if (!durationSec) return;
        stopORCountdown(pointId);

        const endTime = Date.now() + durationSec * 1000;
        activeTimers[pointId] = { endTime, intervalId: null, domBadges: [] };

        // ── 1. Modal countdown row — always visible when override applied ──
        const modalRow     = document.getElementById('or-modal-countdown-row');
        const modalDisplay = document.getElementById('or-modal-countdown-display');
        if (modalRow && modalDisplay) {
            modalRow.style.display = 'flex';
            modalDisplay.textContent = formatTime(durationSec);
            modalDisplay.classList.remove('expiring');
        }

        // ── 2. Graphic pill-wrap badge ──
        const domBadges = [];
        if (graphicTargetId) {
            [
                document.querySelector(`.pill-wrap[data-spanid="${graphicTargetId}"]`),
                document.querySelector(`.point-row[data-spanid="${graphicTargetId}"]`),
            ].forEach(container => {
                if (!container) return;
                container.querySelectorAll('.or-countdown').forEach(b => b.remove());
                const b = makeBadge(formatTime(durationSec));
                container.appendChild(b);
                domBadges.push(b);
            });

            // Legacy #or-* parent
            const leg = document.getElementById(`or-${graphicTargetId}`);
            if (leg && leg.parentElement) {
                leg.parentElement.querySelectorAll('.or-countdown').forEach(b => b.remove());
                const b = makeBadge(formatTime(durationSec));
                leg.parentElement.appendChild(b);
                domBadges.push(b);
            }
        }

        // ── 3. Topbar chip ──
        // Try both dataset attribute forms
        const chip = document.querySelector(`.topbar-or-chip[data-point-id="${pointId}"]`)
                  || document.querySelector(`.topbar-or-chip[data-pointid="${pointId}"]`);
        if (chip) {
            chip.querySelectorAll('.or-countdown').forEach(b => b.remove());
            const b = makeBadge(formatTime(durationSec));
            chip.appendChild(b);
            domBadges.push(b);
        }

        activeTimers[pointId].domBadges = domBadges;

        // ── Tick every second ──
        const intervalId = setInterval(() => {
            const t = activeTimers[pointId];
            if (!t) { clearInterval(intervalId); return; }
            const remaining = Math.max(0, Math.round((t.endTime - Date.now()) / 1000));
            const timeStr = formatTime(remaining);

            // Update modal
            if (modalDisplay && modalRow) {
                if (modalRow.style.display !== 'none') {
                    modalDisplay.textContent = timeStr;
                    if (remaining <= 30) modalDisplay.classList.add('expiring');
                    else modalDisplay.classList.remove('expiring');
                }
            }

            // Update DOM badges
            t.domBadges.forEach(b => {
                try {
                    b.textContent = timeStr;
                    if (remaining <= 30) b.classList.add('expiring');
                    else b.classList.remove('expiring');
                } catch(e) {}
            });

            if (remaining <= 0) stopORCountdown(pointId);
        }, 1000);

        activeTimers[pointId].intervalId = intervalId;
    };

    window.stopORCountdown = function(pointId) {
        const t = activeTimers[pointId];
        if (!t) return;
        clearInterval(t.intervalId);
        t.domBadges.forEach(b => { try { b.remove(); } catch(e) {} });
        // Hide modal row
        const modalRow = document.getElementById('or-modal-countdown-row');
        if (modalRow) modalRow.style.display = 'none';
        delete activeTimers[pointId];
    };

    // When modal opens for a point that already has an active timer, restore display
    window.restoreORCountdownDisplay = function(pointId) {
        const t = activeTimers[pointId];
        const modalRow     = document.getElementById('or-modal-countdown-row');
        const modalDisplay = document.getElementById('or-modal-countdown-display');
        if (!modalRow || !modalDisplay) return;
        if (t) {
            const remaining = Math.max(0, Math.round((t.endTime - Date.now()) / 1000));
            modalRow.style.display = 'flex';
            modalDisplay.textContent = formatTime(remaining);
            if (remaining <= 30) modalDisplay.classList.add('expiring');
            else modalDisplay.classList.remove('expiring');
        } else {
            modalRow.style.display = 'none';
        }
    };

    function makeBadge(text) {
        const b = document.createElement('span');
        b.className = 'or-countdown';
        b.textContent = text;
        return b;
    }

    function formatTime(sec) {
        if (sec >= 3600) {
            const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
            return `⏱ ${h}h ${m}m`;
        } else if (sec >= 60) {
            const m = Math.floor(sec / 60), s = sec % 60;
            return `⏱ ${m}:${String(s).padStart(2,'0')}`;
        }
        return `⏱ ${sec}s`;
    }
})();
