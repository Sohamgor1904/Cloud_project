/**
 * frontend/js/dashboard.js
 * Dashboard controller — orchestrates all modules.
 * Depends on: auth.js, map.js, charts.js, route.js (all loaded before this)
 */

const API_BASE = 'http://localhost:3000/api';
let currentBins = [];
let simCount    = 0;

document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth guard ────────────────────────────────────────────────────────
  const session = requireAuth(); // from auth.js — redirects if no session
  if (!session) return;

  // Populate user info in nav
  _setUserInfo(session);

  // ── Init modules ──────────────────────────────────────────────────────
  initMap();      // from map.js
  initCharts();   // from charts.js

  // ── Tab navigation ────────────────────────────────────────────────────
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── Clock ─────────────────────────────────────────────────────────────
  _startClock();

  // ── Map controls ──────────────────────────────────────────────────────
  document.getElementById('btn-fit-all')?.addEventListener('click', () => fitAllBins(currentBins));
  document.getElementById('btn-fit-route')?.addEventListener('click', () => {
    const route = currentBins.filter(b => b.rank);
    if (route.length) fitRoute(route);
  });

  // ── Simulate button ───────────────────────────────────────────────────
  document.getElementById('simulate-btn')?.addEventListener('click', runSimulation);

  // ── Zone filter (All Bins tab) ────────────────────────────────────────
  document.querySelectorAll('.zone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBinsTable(currentBins, btn.dataset.zone);
    });
  });

  // ── User dropdown ─────────────────────────────────────────────────────
  const pill = document.getElementById('user-pill');
  const dd   = document.getElementById('user-dropdown');
  pill?.addEventListener('click', () => dd?.classList.toggle('hidden'));
  document.addEventListener('click', e => {
    if (!pill?.contains(e.target) && !dd?.contains(e.target)) dd?.classList.add('hidden');
  });
  document.getElementById('logout-btn')?.addEventListener('click', logout); // from auth.js

  // ── Initial data load ─────────────────────────────────────────────────
  showLoading(true);
  try {
    await loadBins();
  } catch (err) {
    showError('Could not load bin data. Make sure the backend is running: npm run dev');
  } finally {
    showLoading(false);
  }
});

// ── TAB SWITCHING ──────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
  if (tab === 'dashboard') setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
}

// ── DATA LOADING ───────────────────────────────────────────────────────────
async function loadBins() {
  const res  = await fetch(`${API_BASE}/bins`);
  if (!res.ok) throw new Error(await res.text());
  const bins = await res.json();
  currentBins = bins;
  _applyUpdate(bins, []);
}

async function runSimulation() {
  const btn = document.getElementById('simulate-btn');
  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span> Simulating…';

  try {
    const res  = await fetch(`${API_BASE}/bins/simulate`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();         // { message, bins, alerts }
    currentBins = data.bins;

    // Route: critical-only (fill ≥ 75%), nearest-neighbor across ALL zones
    const { route, stats } = buildRoute(data.bins);  // from route.js

    // Merge rank into currentBins for table display
    const rankMap = Object.fromEntries(route.map(r => [r.id, r.rank]));
    currentBins = currentBins.map(b => ({ ...b, rank: rankMap[b.id] || null }));

    _applyUpdate(currentBins, route, data.alerts || [], stats);
    simCount++;
    const sv = document.getElementById('sv-sims');
    if (sv) sv.textContent = simCount;
    const st = document.getElementById('sv-time');
    if (st) st.textContent = new Date().toLocaleTimeString();
  } catch (err) {
    showError('Simulation failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-ico">⚡</span><span class="btn-txt">Run Simulation</span>';
  }
}

// ── APPLY ALL DATA TO UI ───────────────────────────────────────────────────
function _applyUpdate(bins, route, alerts = [], stats = null) {
  // Stats
  document.getElementById('sv-total').textContent    = bins.length;
  document.getElementById('sv-critical').textContent = bins.filter(b => b.fill_pct >= 75).length;
  document.getElementById('sv-route').textContent    = route.length;

  // Map
  const routeIds = new Set(route.map(r => r.id));
  updateMarkers(bins, routeIds);     // from map.js
  drawRoute(route);                  // from map.js
  if (bins.length) fitAllBins(bins);

  // Route sidebar
  renderRouteSidebar(route, stats);

  // All Bins table
  renderBinsTable(bins, 'all');

  // Charts
  updateCharts(bins);                // from charts.js

  // Alerts
  renderAlerts(alerts);
  renderAnalyticsAlerts(alerts, bins);
}

// ── ROUTE SIDEBAR ──────────────────────────────────────────────────────────
function renderRouteSidebar(route, stats = null) {
  const list  = document.getElementById('route-list');
  const empty = document.getElementById('route-empty');
  const badge = document.getElementById('route-badge');
  const statsEl = document.getElementById('route-stats');
  if (!list) return;

  if (!route.length) {
    list.innerHTML = '';
    empty?.classList.add('show');
    if (badge) badge.textContent = '0';
    if (statsEl) statsEl.innerHTML = stats
      ? `<span style="color:#f87171">0 critical bins to collect today ✓</span>`
      : '';
    return;
  }
  empty?.classList.remove('show');
  if (badge) badge.textContent = route.length;
  // Route stats strip
  if (statsEl && stats) {
    statsEl.innerHTML = `
      <span>🔴 ${stats.critical_count} critical</span>
      <span style="color:#888">·</span>
      <span>📍 Zones: ${stats.zones_covered || '—'}</span>
      <span style="color:#888">·</span>
      <span>🛣 ~${stats.total_distance} km total</span>
    `;
  }

  list.innerHTML = route.map(b => {
    const isCrit  = b.fill_pct >= 75;
    const color   = isCrit ? '#f87171' : '#fcd34d';
    const distTxt = b.distance_from_prev_km != null
      ? `${b.distance_from_prev_km} km from prev`
      : `Zone ${b.zone}`;
    return `
      <div class="route-item" onclick="panToBin(${b.lat},${b.lng})" role="listitem">
        <div class="ri-rank" style="background:${isCrit ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#d97706,#f59e0b)'}">${b.rank}</div>
        <div class="ri-body">
          <div class="ri-loc" title="${b.location}">${b.location}</div>
          <div class="ri-meta">Zone ${b.zone} · ${distTxt}</div>
        </div>
        <span class="ri-fill" style="color:${color}">${b.fill_pct.toFixed(1)}%</span>
      </div>`;
  }).join('');
}

// ── BINS TABLE ─────────────────────────────────────────────────────────────
function renderBinsTable(bins, zone = 'all') {
  const tbody = document.getElementById('bins-tbody');
  if (!tbody) return;
  const filtered = zone === 'all' ? bins : bins.filter(b => b.zone === zone);
  if (!filtered.length) { tbody.innerHTML = `<tr><td class="empty-row" colspan="7">No bins in this zone.</td></tr>`; return; }

  tbody.innerHTML = filtered.map(b => {
    const cls   = b.fill_pct >= 75 ? 'high' : b.fill_pct >= 40 ? 'mid' : 'low';
    const badge = b.fill_pct >= 75 ? 'badge-high' : b.fill_pct >= 40 ? 'badge-mid' : 'badge-low';
    const label = b.fill_pct >= 75 ? 'Critical' : b.fill_pct >= 40 ? 'Warning' : 'Normal';
    const inRoute = b.rank != null;
    return `<tr>
      <td>#${b.id}</td>
      <td><span class="badge zone-${b.zone}" style="background:rgba(var(--z${b.zone}),0.15);border:none">${b.zone}</span></td>
      <td>${esc(b.location)}</td>
      <td>
        <span style="font-weight:700">${(b.fill_pct||0).toFixed(1)}%</span>
        <div class="fill-bar"><div class="fill-fill ${cls}" style="width:${b.fill_pct||0}%"></div></div>
      </td>
      <td>${(b.priority||0).toFixed(2)}</td>
      <td><span class="badge ${badge}">${label}</span></td>
      <td><span class="badge ${inRoute ? 'badge-yes' : 'badge-no'}">${inRoute ? `#${b.rank}` : '—'}</span></td>
    </tr>`;
  }).join('');
}

// ── ALERT BANNER ───────────────────────────────────────────────────────────
function renderAlerts(alerts) {
  const bar = document.getElementById('alert-bar');
  if (!bar) return;
  if (!alerts.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = alerts.slice(0, 5).map(a => `
    <span class="alert-chip ${a.alert === 'OVERFLOW_RISK' ? 'overflow' : 'warning'}">
      ${a.alert === 'OVERFLOW_RISK' ? '🚨' : '⚠️'} Bin #${a.bin_id} (${a.fill_pct.toFixed(1)}%)
    </span>`).join('');
}

// ── ANALYTICS ALERTS ───────────────────────────────────────────────────────
function renderAnalyticsAlerts(alerts, bins) {
  const wrap = document.getElementById('analytics-alerts');
  if (!wrap) return;

  // Combine passed-in alerts with any WARNING bins not in alerts array
  const allAlerts = alerts.length ? alerts : bins
    .filter(b => b.fill_pct >= 75)
    .map(b => ({ bin_id: b.id, location: b.location, zone: b.zone, fill_pct: b.fill_pct, alert: b.fill_pct >= 90 ? 'OVERFLOW_RISK' : 'WARNING' }));

  if (!allAlerts.length) {
    wrap.innerHTML = `<div class="no-alerts">✅ No overflow risk detected. All bins are below 75% fill.</div>`;
    return;
  }
  wrap.innerHTML = `<div class="alerts-wrap">` + allAlerts.map(a => `
    <div class="alert-row ${a.alert === 'OVERFLOW_RISK' ? 'overflow-risk' : 'warning'}">
      <div class="ar-zone" style="background:rgba(${a.alert === 'OVERFLOW_RISK' ? '239,68,68' : '245,158,11'},.2);color:${a.alert === 'OVERFLOW_RISK' ? '#f87171' : '#fcd34d'}">${a.zone}</div>
      <span class="ar-loc">#${a.bin_id} ${esc(a.location)}</span>
      <span class="ar-fill" style="color:${a.alert === 'OVERFLOW_RISK' ? '#f87171' : '#fcd34d'}">${a.fill_pct.toFixed(1)}%</span>
      <span class="ar-tag ${a.alert === 'OVERFLOW_RISK' ? 'overflow-risk' : 'warning'}">${a.alert === 'OVERFLOW_RISK' ? 'OVERFLOW RISK' : 'WARNING'}</span>
    </div>`).join('') + `</div>`;
}

// ── UTILS ──────────────────────────────────────────────────────────────────
function showLoading(show) {
  document.getElementById('loading-overlay')?.classList.toggle('hide', !show);
}
function showError(msg) {
  const el = document.getElementById('err-banner');
  if (!el) return;
  el.textContent = '⚠ ' + msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 7000);
}
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function _setUserInfo(session) {
  const initials = session.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const av = document.getElementById('user-avatar');
  const un = document.getElementById('user-name-display');
  const dn = document.getElementById('ud-name-full');
  const dr = document.getElementById('user-role-display');
  if (av) av.textContent = initials;
  if (un) un.textContent = session.name.split(' ')[0];
  if (dn) dn.textContent = session.name;
  if (dr) dr.textContent = session.role;
}
function _startClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const tick = () => { el.textContent = new Date().toLocaleTimeString(); };
  tick(); setInterval(tick, 1000);
}
