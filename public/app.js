'use strict';
/**
 * SmartWaste — GIFT City
 * Full website app.js — covers all 4 member roles
 *
 * HOW TO SWITCH FROM STUB → REAL API (Day 2):
 *   Change USE_STUB = false  and  API_BASE = 'http://localhost:3000'
 */

// ═══════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════
const USE_STUB = true;
const API_BASE = ''; // '' = same origin | 'http://localhost:3000' for separate port

// ── ROUTE ALGORITHM WEIGHTS ──────────────────────────────────────────────
// Tune to shift the trade-off: 1.0/0.0 = pure fill-first, 0.0/1.0 = pure nearest-first
const FILL_WEIGHT = 0.60;  // 60% weight — waste urgency (fill level)
const DIST_WEIGHT = 0.40;  // 40% weight — proximity to current truck position

// Truck depot / starting point — GIFT City main gate (centre of all 4 zones)
const DEPOT = { lat: 23.1648, lng: 72.6800 };

// ═══════════════════════════════════════════════════════════════════════
// BIN DATA — 22 bins with GIFT City coordinates + zone
// Matches DB schema: { id, location, fill_pct, priority }
// Extra fields (zone, lat, lng) are frontend-only for map display
// ═══════════════════════════════════════════════════════════════════════
const STUB_BINS = [
  // ─── Zone A — Financial District (NE quadrant) ───────────────────
  { id:1,  zone:'A', location:'Zone A – GIFT Tower Plaza',        lat:23.1685, lng:72.6835, fill_pct:91.2, priority:11.12 },
  { id:2,  zone:'A', location:'Zone A – Financial Hub Entrance',  lat:23.1680, lng:72.6843, fill_pct:78.5, priority:9.85  },
  { id:3,  zone:'A', location:'Zone A – Riverside Walk',          lat:23.1673, lng:72.6850, fill_pct:45.3, priority:6.53  },
  { id:4,  zone:'A', location:'Zone A – Central Park East',       lat:23.1668, lng:72.6828, fill_pct:18.7, priority:1.87  },
  { id:5,  zone:'A', location:'Zone A – Corporate Block 5',       lat:23.1678, lng:72.6820, fill_pct:62.1, priority:8.21  },
  { id:6,  zone:'A', location:'Zone A – Heritage Walk',           lat:23.1663, lng:72.6832, fill_pct:25.9, priority:3.59  },
  // ─── Zone B — Residential (SE quadrant) ──────────────────────────
  { id:7,  zone:'B', location:'Zone B – Sector 7 Residency',      lat:23.1645, lng:72.6840, fill_pct:83.4, priority:10.34 },
  { id:8,  zone:'B', location:'Zone B – Garden Apartments',       lat:23.1638, lng:72.6833, fill_pct:55.6, priority:7.56  },
  { id:9,  zone:'B', location:'Zone B – Metro Station North',     lat:23.1632, lng:72.6845, fill_pct:29.8, priority:3.98  },
  { id:10, zone:'B', location:'Zone B – Community Hall',          lat:23.1648, lng:72.6855, fill_pct:72.3, priority:9.23  },
  { id:11, zone:'B', location:'Zone B – School Road Junction',    lat:23.1625, lng:72.6852, fill_pct:38.1, priority:5.81  },
  { id:12, zone:'B', location:'Zone B – Hospital Gate',           lat:23.1640, lng:72.6862, fill_pct:93.5, priority:11.35 },
  // ─── Zone C — Commercial (NW quadrant) ───────────────────────────
  { id:13, zone:'C', location:'Zone C – Market Square',           lat:23.1685, lng:72.6768, fill_pct:96.7, priority:11.67 },
  { id:14, zone:'C', location:'Zone C – Food Court Area',         lat:23.1678, lng:72.6778, fill_pct:88.2, priority:10.82 },
  { id:15, zone:'C', location:'Zone C – Shopping Arcade',         lat:23.1672, lng:72.6788, fill_pct:67.4, priority:8.74  },
  { id:16, zone:'C', location:'Zone C – Civic Centre',            lat:23.1665, lng:72.6762, fill_pct:41.5, priority:6.15  },
  { id:17, zone:'C', location:'Zone C – Weekend Bazaar',          lat:23.1682, lng:72.6755, fill_pct:77.9, priority:9.79  },
  // ─── Zone D — Industrial (SW quadrant) ───────────────────────────
  { id:18, zone:'D', location:'Zone D – Industrial Gate 1',       lat:23.1638, lng:72.6775, fill_pct:33.2, priority:4.32  },
  { id:19, zone:'D', location:'Zone D – Logistics Hub',           lat:23.1628, lng:72.6762, fill_pct:59.8, priority:7.98  },
  { id:20, zone:'D', location:'Zone D – Warehouse District',      lat:23.1618, lng:72.6770, fill_pct:11.4, priority:1.14  },
  { id:21, zone:'D', location:'Zone D – Factory Row',             lat:23.1632, lng:72.6750, fill_pct:80.6, priority:10.06 },
  { id:22, zone:'D', location:'Zone D – Export Terminal',         lat:23.1642, lng:72.6782, fill_pct:47.2, priority:6.72  },
];

// Zone metadata for display
const ZONE_META = {
  A: { label:'Financial District', color:'#10b981' },
  B: { label:'Residential',        color:'#06b6d4' },
  C: { label:'Commercial',         color:'#f59e0b' },
  D: { label:'Industrial',         color:'#8b5cf6' },
};

// ═══════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════
let currentBins  = [];
let currentRoute = [];
let simulationCount = 0;
let lastSimTime     = null;
let fillRates       = {}; // bin_id → fill rate %/hr for predictions

// Map
let map              = null;
let markersLayer     = null;
let routeNumberLayer = null;
let routePolyline    = null;

// Charts
let fillChart     = null;
let priorityChart = null;
let zoneChart     = null;
let chartsReady   = false;

// ═══════════════════════════════════════════════════════════════════════
// ROUTE OPTIMIZATION — Greedy Nearest-Neighbor + Fill Weighting
// ═══════════════════════════════════════════════════════════════════════

/**
 * Haversine great-circle distance between two lat/lng points, in kilometres.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R   = 6371;
  const toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Orders candidate bins using a greedy algorithm combining:
 *   – Fill urgency  (FILL_WEIGHT 60%): prefer higher fill_pct
 *   – Proximity     (DIST_WEIGHT 40%): prefer bins closer to truck
 *
 * At every step the truck picks the unvisited bin with the highest:
 *   score = FILL_WEIGHT * normFill  −  DIST_WEIGHT * normDist
 *
 * This avoids the "pure fill-first" problem of zigzagging across the city
 * while still getting to critical bins quickly.
 *
 * @param  {Array} candidates  bins already filtered by priority threshold
 * @returns {Array} route ordered by visit sequence, with .rank set
 */
function greedyOptimizeRoute(candidates) {
  if (!candidates.length) return [];

  let curLat = DEPOT.lat, curLng = DEPOT.lng;
  const unvisited = [...candidates];
  const ordered   = [];

  while (unvisited.length > 0) {
    const dists   = unvisited.map(b => haversineKm(curLat, curLng, b.lat, b.lng));
    const maxDist = Math.max(...dists) || 1;
    const maxFill = Math.max(...unvisited.map(b => b.fill_pct));
    const minFill = Math.min(...unvisited.map(b => b.fill_pct));
    const span    = (maxFill - minFill) || 1;

    let bestScore = -Infinity, bestIdx = 0;
    unvisited.forEach((bin, i) => {
      const normFill = (bin.fill_pct - minFill) / span;  // 0-1, higher = more urgent
      const normDist = dists[i] / maxDist;               // 0-1, higher = farther
      const score    = FILL_WEIGHT * normFill - DIST_WEIGHT * normDist;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });

    const chosen = unvisited.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    curLat = chosen.lat; // truck advances to the chosen bin
    curLng = chosen.lng;
  }

  return ordered.map((b, i) => ({ ...b, rank: i + 1 }));
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════

function getFillInfo(fill_pct) {
  if (fill_pct < 40)  return { label:'Low',      cls:'badge-green', barCls:'bar-green', color:'#10b981', icon:'🟢' };
  if (fill_pct <= 75) return { label:'Moderate',  cls:'badge-amber', barCls:'bar-amber', color:'#f59e0b', icon:'🟡' };
  return                     { label:'Critical',  cls:'badge-red',   barCls:'bar-red',   color:'#ef4444', icon:'🔴' };
}

const fmt = (n, d = 1) => parseFloat(n).toFixed(d);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const esc = s => { const d = document.createElement('div'); d.appendChild(document.createTextNode(String(s))); return d.innerHTML; };
const fmtTime = d => d ? d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true }) : '—';

// ═══════════════════════════════════════════════════════════════════════
// LOADING / ERROR STATES
// ═══════════════════════════════════════════════════════════════════════

function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
  const btn = document.getElementById('simulate-btn');
  btn.disabled = true;
  btn.querySelector('.btn-txt').textContent = 'Simulating…';
  btn.querySelector('.btn-ico').classList.add('spin-anim');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
  const btn = document.getElementById('simulate-btn');
  btn.disabled = false;
  btn.querySelector('.btn-txt').textContent = 'Run Simulation';
  btn.querySelector('.btn-ico').classList.remove('spin-anim');
}

let errTimer = null;
function showError(msg) {
  const el = document.getElementById('error-banner');
  el.textContent = '⚠ ' + msg;
  el.classList.remove('hidden');
  clearTimeout(errTimer);
  errTimer = setTimeout(() => el.classList.add('hidden'), 6000);
}

// ═══════════════════════════════════════════════════════════════════════
// MAP INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

function initMap() {
  map = L.map('city-map', {
    center: [23.1655, 72.6805],
    zoom: 15,
    minZoom: 13,
    maxZoom: 19,
    zoomControl: true,
  });

  // Dark CartoDB tiles — perfectly matches our dark theme
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);

  // Layer groups
  markersLayer     = L.layerGroup().addTo(map);
  routeNumberLayer = L.layerGroup().addTo(map);

  // Zone boundary rectangles
  drawZoneBoundaries();

  // Map legend (bottom-right)
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-legend-box');
    div.innerHTML = `
      <div class="mlb-title">Bin Status</div>
      <div class="mlb-row"><span class="mlb-dot" style="background:#10b981"></span>Low &lt;40%</div>
      <div class="mlb-row"><span class="mlb-dot" style="background:#f59e0b"></span>Moderate 40–75%</div>
      <div class="mlb-row"><span class="mlb-dot" style="background:#ef4444"></span>Critical &gt;75%</div>
      <div class="mlb-sep"></div>
      <div class="mlb-row"><span class="mlb-line"></span>Route</div>
    `;
    return div;
  };
  legend.addTo(map);

  // Zone legend (top-right)
  const zoneLegend = L.control({ position: 'topright' });
  zoneLegend.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-legend-box');
    div.innerHTML = `
      <div class="mlb-title">Zones</div>
      ${Object.entries(ZONE_META).map(([z, m]) =>
        `<div class="mlb-row"><span class="mlb-sqr" style="background:${m.color}20;border:1px solid ${m.color}"></span>Zone ${z} — ${m.label}</div>`
      ).join('')}
    `;
    return div;
  };
  zoneLegend.addTo(map);

  // Map control buttons
  document.getElementById('btn-fit-all').addEventListener('click', () => {
    if (currentBins.length > 0) {
      map.fitBounds(L.latLngBounds(currentBins.map(b => [b.lat, b.lng])), { padding: [30, 30] });
    }
  });
  document.getElementById('btn-fit-route').addEventListener('click', () => {
    if (currentRoute.length > 0) {
      const coords = currentRoute.map(r => { const b = currentBins.find(x => x.id === r.id); return [b.lat, b.lng]; });
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    }
  });
}

function drawZoneBoundaries() {
  const zones = [
    { zone:'A', bounds: [[23.1658, 72.6812], [23.1692, 72.6860]] },
    { zone:'B', bounds: [[23.1618, 72.6825], [23.1655, 72.6872]] },
    { zone:'C', bounds: [[23.1658, 72.6745], [23.1692, 72.6800]] },
    { zone:'D', bounds: [[23.1610, 72.6742], [23.1648, 72.6792]] },
  ];

  zones.forEach(({ zone, bounds }) => {
    const { color, label } = ZONE_META[zone];

    L.rectangle(bounds, {
      color, weight: 1.5, opacity: 0.55,
      fillColor: color, fillOpacity: 0.07,
      dashArray: '5,5',
    }).bindTooltip(`Zone ${zone} — ${label}`, { sticky: true }).addTo(map);

    // Zone label
    const center = L.latLngBounds(bounds).getCenter();
    L.marker(center, {
      icon: L.divIcon({
        className: '',
        html: `<div class="zone-lbl" style="color:${color}">Zone ${zone}</div>`,
        iconSize: [60, 20], iconAnchor: [30, 10],
      }),
      interactive: false, zIndexOffset: -200,
    }).addTo(map);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MAP RENDERING (bins + route)
// ═══════════════════════════════════════════════════════════════════════

function renderMapBins(bins, route) {
  markersLayer.clearLayers();
  routeNumberLayer.clearLayers();
  if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }

  const routeMap = new Map(route.map(r => [r.id, r]));

  bins.forEach(bin => {
    const info      = getFillInfo(bin.fill_pct);
    const routeItem = routeMap.get(bin.id);
    const inRoute   = !!routeItem;

    // Circle marker
    const marker = L.circleMarker([bin.lat, bin.lng], {
      radius:      inRoute ? 12 : 7,
      fillColor:   info.color,
      color:       inRoute ? '#ffffff' : 'rgba(255,255,255,0.3)',
      weight:      inRoute ? 2.5 : 1.2,
      opacity:     1,
      fillOpacity: inRoute ? 0.95 : 0.72,
    });

    // Custom dark-themed popup
    marker.bindPopup(`
      <div class="lf-pop">
        <div class="lf-pop-hdr">
          <strong>Bin #${esc(bin.id)}</strong>
          ${inRoute ? `<span class="lf-rank" style="background:${info.color}">Route #${routeItem.rank}</span>` : ''}
        </div>
        <div class="lf-pop-loc">${esc(bin.location)}</div>
        <div class="lf-pop-zone" style="color:${ZONE_META[bin.zone].color}">
          Zone ${bin.zone} — ${ZONE_META[bin.zone].label}
        </div>
        <div class="lf-pop-stats">
          <div class="lf-stat"><span>Fill Level</span><strong style="color:${info.color}">${fmt(bin.fill_pct)}%</strong></div>
          <div class="lf-stat"><span>Priority</span><strong>${fmt(bin.priority, 2)}</strong></div>
          <div class="lf-stat"><span>Status</span><strong style="color:${info.color}">${info.label}</strong></div>
        </div>
        ${bin.fill_pct > 90 ? '<div class="lf-overflow">⚠ OVERFLOW RISK — Immediate collection needed</div>' : ''}
      </div>`, { maxWidth: 240, className: 'lf-popup-custom' }
    );

    marker.on('mouseover', function () { this.openPopup(); });
    markersLayer.addLayer(marker);

    // Numbered rank bubble for route bins
    if (inRoute) {
      routeNumberLayer.addLayer(
        L.marker([bin.lat, bin.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div class="rank-bubble" style="background:${info.color}">${routeItem.rank}</div>`,
            iconSize: [22, 22], iconAnchor: [11, 11],
          }),
          zIndexOffset: 500,
          interactive: false,
        })
      );
    }
  });

  // Route polyline — dashed emerald line connecting stops in rank order
  if (route.length > 1) {
    const coords = [...route]
      .sort((a, b) => a.rank - b.rank)
      .map(r => { const b = bins.find(x => x.id === r.id); return [b.lat, b.lng]; });

    routePolyline = L.polyline(coords, {
      color: '#10b981', weight: 2.8,
      opacity: 0.88, dashArray: '10, 8',
      lineJoin: 'round',
    }).addTo(map);
  }
}

// Allow route card click to pan map
function highlightOnMap(binId) {
  const bin = currentBins.find(b => b.id === binId);
  if (bin && map) {
    map.setView([bin.lat, bin.lng], 17, { animate: true, duration: 0.6 });
  }
}
window.highlightOnMap = highlightOnMap;

// ═══════════════════════════════════════════════════════════════════════
// CHART.JS — ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════════════

function initCharts() {
  if (chartsReady) return;
  chartsReady = true;

  Chart.defaults.color          = '#94a3b8';
  Chart.defaults.borderColor    = 'rgba(16,185,129,0.08)';
  Chart.defaults.font.family    = "'Inter', sans-serif";
  Chart.defaults.font.size      = 12;

  // 1. Fill Distribution — Doughnut
  fillChart = new Chart(document.getElementById('chart-fill'), {
    type: 'doughnut',
    data: {
      labels: ['Low (<40%)', 'Moderate (40–75%)', 'Critical (>75%)'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['rgba(16,185,129,0.75)', 'rgba(245,158,11,0.75)', 'rgba(239,68,68,0.75)'],
        borderColor:     ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2, hoverOffset: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} bins (${currentBins.length ? Math.round(ctx.raw / currentBins.length * 100) : 0}%)`
          }
        }
      }
    }
  });

  // 2. Priority Scores — Horizontal Bar (top 10)
  priorityChart = new Chart(document.getElementById('chart-priority'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Priority Score', data: [],
        backgroundColor: [], borderColor: [], borderWidth: 1, borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Priority: ${ctx.raw.toFixed(2)}` } } },
      scales: {
        x: { min: 0, max: 12, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
      }
    }
  });

  // 3. Zone Average Fill — Vertical Bar
  zoneChart = new Chart(document.getElementById('chart-zones'), {
    type: 'bar',
    data: {
      labels: ['Zone A\nFinancial', 'Zone B\nResidential', 'Zone C\nCommercial', 'Zone D\nIndustrial'],
      datasets: [{
        label: 'Avg Fill %', data: [0, 0, 0, 0], borderWidth: 2, borderRadius: 4,
        backgroundColor: ['rgba(16,185,129,0.65)', 'rgba(6,182,212,0.65)', 'rgba(245,158,11,0.65)', 'rgba(139,92,246,0.65)'],
        borderColor:     ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'],
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Avg fill: ${parseFloat(ctx.raw).toFixed(1)}%` } } },
      scales: {
        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function updateCharts(bins) {
  if (!fillChart) return;

  const low  = bins.filter(b => b.fill_pct <  40).length;
  const mod  = bins.filter(b => b.fill_pct >= 40 && b.fill_pct <= 75).length;
  const crit = bins.filter(b => b.fill_pct >  75).length;

  fillChart.data.datasets[0].data = [low, mod, crit];
  fillChart.update('none');

  // Custom legend
  const leg = document.getElementById('fill-legend');
  if (leg) leg.innerHTML = `
    <div class="fl-item"><span class="fl-dot" style="background:#10b981"></span><span>${low} Low</span></div>
    <div class="fl-item"><span class="fl-dot" style="background:#f59e0b"></span><span>${mod} Moderate</span></div>
    <div class="fl-item"><span class="fl-dot" style="background:#ef4444"></span><span>${crit} Critical</span></div>
  `;

  // Priority bar — top 10
  const top10 = [...bins].sort((a, b) => b.priority - a.priority).slice(0, 10);
  priorityChart.data.labels = top10.map(b => {
    const name = b.location.includes('–') ? b.location.split('–')[1].trim() : b.location;
    return `#${b.id} ${name.length > 18 ? name.slice(0, 18) + '…' : name}`;
  });
  priorityChart.data.datasets[0].data  = top10.map(b => b.priority);
  priorityChart.data.datasets[0].backgroundColor = top10.map(b =>
    b.fill_pct > 75 ? 'rgba(239,68,68,0.7)' : b.fill_pct > 40 ? 'rgba(245,158,11,0.7)' : 'rgba(16,185,129,0.7)'
  );
  priorityChart.data.datasets[0].borderColor = top10.map(b =>
    b.fill_pct > 75 ? '#ef4444' : b.fill_pct > 40 ? '#f59e0b' : '#10b981'
  );
  priorityChart.update('none');

  // Zone chart
  const zoneAvg = ['A','B','C','D'].map(z => {
    const zb = bins.filter(b => b.zone === z);
    return zb.length ? parseFloat((zb.reduce((s, b) => s + b.fill_pct, 0) / zb.length).toFixed(1)) : 0;
  });
  zoneChart.data.datasets[0].data = zoneAvg;
  zoneChart.update('none');
}

// ═══════════════════════════════════════════════════════════════════════
// PREDICTIONS — Member 4 Logic (fill rate model)
// ═══════════════════════════════════════════════════════════════════════

function assignFillRates(bins) {
  bins.forEach(b => {
    if (!fillRates[b.id]) {
      // Higher-fill bins tend to fill faster (urgency factor)
      const base = 0.5 + Math.random() * 2.5;
      fillRates[b.id] = parseFloat(base.toFixed(2));
    }
  });
}

function renderPredictions(bins) {
  assignFillRates(bins);
  const tbody = document.getElementById('predictions-tbody');
  const sorted = [...bins].sort((a, b) => b.fill_pct - a.fill_pct);

  tbody.innerHTML = sorted.map(bin => {
    const rate       = fillRates[bin.id] || 1;
    const hoursLeft  = (100 - bin.fill_pct) / rate;
    const in2h       = Math.min(bin.fill_pct + rate * 2, 100);
    const in4h       = Math.min(bin.fill_pct + rate * 4, 100);
    const alertCls   = hoursLeft < 2 ? 'badge-red' : hoursLeft < 6 ? 'badge-amber' : 'badge-green';
    const alertLabel = hoursLeft < 2 ? '⚠ Critical' : hoursLeft < 6 ? '⚡ Warning' : '✓ Normal';
    const info       = getFillInfo(bin.fill_pct);

    return `
      <tr data-zone="${bin.zone}">
        <td><span class="bin-id-badge">#${bin.id}</span></td>
        <td class="loc-cell">${esc(bin.location)}</td>
        <td><span class="status-badge ${info.cls}">${fmt(bin.fill_pct)}%</span></td>
        <td class="mono">${fmt(rate, 2)}%/hr</td>
        <td><span class="status-badge ${getFillInfo(in2h).cls}">${fmt(in2h)}%</span></td>
        <td><span class="status-badge ${getFillInfo(in4h).cls}">${fmt(in4h)}%</span></td>
        <td class="mono"><strong>${hoursLeft > 99 ? '>99' : fmt(hoursLeft)} hrs</strong></td>
        <td><span class="status-badge ${alertCls}">${alertLabel}</span></td>
      </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS ALERT CARDS — Member 4 Alert Engine
// ═══════════════════════════════════════════════════════════════════════

function renderAnalyticsAlerts(bins) {
  const container = document.getElementById('analytics-alerts');
  const danger = bins.filter(b => b.fill_pct > 75).sort((a, b) => b.fill_pct - a.fill_pct);

  if (!danger.length) {
    container.innerHTML = '<p class="no-alerts">✅ No active alerts — all bins below warning threshold (75%)</p>';
    return;
  }

  container.innerHTML = '<div class="alert-cards-grid">' + danger.map(bin => {
    const isOverflow = bin.fill_pct > 90;
    const info = getFillInfo(bin.fill_pct);
    const zone = ZONE_META[bin.zone];
    return `
      <div class="alert-card ${isOverflow ? 'ac-overflow' : 'ac-warning'}">
        <div class="ac-ico">${isOverflow ? '⚠️' : '⚡'}</div>
        <div class="ac-body">
          <div class="ac-type" style="color:${info.color}">${isOverflow ? 'OVERFLOW RISK' : 'HIGH FILL LEVEL'}</div>
          <div class="ac-loc">${esc(bin.location)}</div>
          <div class="ac-meta">
            Bin #${bin.id} · 
            <span style="color:${zone.color}">Zone ${bin.zone} — ${zone.label}</span> · 
            <span style="color:${info.color}"><strong>${fmt(bin.fill_pct)}% full</strong></span> · 
            Priority: ${fmt(bin.priority, 2)}
          </div>
        </div>
        <div class="ac-pct" style="color:${info.color}">${fmt(bin.fill_pct)}%</div>
      </div>`;
  }).join('') + '</div>';
}

// ═══════════════════════════════════════════════════════════════════════
// OVERFLOW BANNER ALERTS (Page-level floating banners)
// ═══════════════════════════════════════════════════════════════════════

function renderAlertBanners(bins) {
  const container = document.getElementById('alert-container');
  const overflow  = bins.filter(b => b.fill_pct > 90);
  if (!overflow.length) { container.innerHTML = ''; return; }

  container.innerHTML = overflow.map(b => `
    <div class="alert-banner" role="alert">
      <span aria-hidden="true">⚠️</span>
      <div class="ab-text">
        <strong>OVERFLOW RISK</strong> — ${esc(b.location)}
        <span class="ab-fill">&nbsp;(${fmt(b.fill_pct)}% · Bin #${b.id})</span>
      </div>
      <button class="ab-close" onclick="this.parentElement.remove()" aria-label="Dismiss alert" type="button">×</button>
    </div>`
  ).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER: ROUTE LIST (Dashboard sidebar)
// ═══════════════════════════════════════════════════════════════════════

function renderRouteList(route, bins) {
  const list  = document.getElementById('route-list');
  const empty = document.getElementById('route-empty');
  const badge = document.getElementById('route-badge');

  if (badge) badge.textContent = `${route.length} stop${route.length !== 1 ? 's' : ''}`;

  if (!route || !route.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = route.map(r => {
    const bin  = bins.find(b => b.id === r.id) || r;
    const info = getFillInfo(bin.fill_pct);
    return `
      <div class="route-card ${bin.fill_pct > 90 ? 'rc-overflow' : ''}"
           role="listitem" data-id="${bin.id}"
           onclick="highlightOnMap(${bin.id})"
           title="Click to pan map to this bin">
        <div class="rc-rank" style="background:${info.color}">${r.rank}</div>
        <div class="rc-info">
          <div class="rc-loc">${esc(bin.location)}</div>
          <div class="rc-meta">
            <span class="status-badge ${info.cls}">${fmt(bin.fill_pct)}%</span>
            <span class="rc-pri">P: ${fmt(bin.priority, 2)}</span>
            ${bin.fill_pct > 90 ? '<span class="status-badge badge-red">⚠ Overflow</span>' : ''}
          </div>
        </div>
        <span class="rc-arrow" aria-hidden="true">→</span>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER: BINS FULL TABLE (All Bins Tab)
// ═══════════════════════════════════════════════════════════════════════

function renderBinsTableFull(bins) {
  const tbody = document.getElementById('bins-tbody-full');

  tbody.innerHTML = bins.map(bin => {
    const info      = getFillInfo(bin.fill_pct);
    const routeItem = currentRoute.find(r => r.id === bin.id);
    const inRoute   = !!routeItem;
    const fillW     = clamp(bin.fill_pct, 0, 100).toFixed(1);
    const priW      = clamp((bin.priority / 12) * 100, 0, 100).toFixed(1);
    const zone      = ZONE_META[bin.zone] || { color: '#94a3b8', label: '' };

    return `
      <tr data-zone="${bin.zone}" class="${bin.fill_pct > 75 ? 'row-crit' : ''}">
        <td><span class="bin-id-badge">#${bin.id}</span></td>
        <td><span class="zone-badge" style="color:${zone.color};border-color:${zone.color}40">Zone ${bin.zone}</span></td>
        <td class="loc-cell">${esc(bin.location)}</td>
        <td>
          <div class="fill-cell">
            <div class="fill-track" role="progressbar" aria-valuenow="${fmt(bin.fill_pct)}" aria-valuemin="0" aria-valuemax="100">
              <div class="fill-fill ${info.barCls}" style="width:${fillW}%"></div>
            </div>
            <span class="fill-pct-txt">${fmt(bin.fill_pct)}%</span>
          </div>
        </td>
        <td>
          <span class="pri-val">${fmt(bin.priority, 2)}</span>
          <div class="pri-track"><div class="pri-fill" style="width:${priW}%"></div></div>
        </td>
        <td><span class="status-badge ${info.cls}">${info.icon} ${info.label}</span></td>
        <td>
          ${inRoute
            ? `<span class="in-route-tag">✓ Stop #${routeItem.rank}</span>`
            : '<span class="not-in-route">—</span>'}
        </td>
      </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// STATS BAR UPDATE
// ═══════════════════════════════════════════════════════════════════════

function updateStats(bins, route) {
  document.getElementById('sv-total').textContent    = bins.length;
  document.getElementById('sv-critical').textContent = bins.filter(b => b.fill_pct > 75).length;
  document.getElementById('sv-route').textContent    = route.length;
  document.getElementById('sv-sims').textContent     = simulationCount;
  document.getElementById('sv-time').textContent     = fmtTime(lastSimTime);

  // Pop animation
  ['sv-total', 'sv-critical', 'sv-route', 'sv-sims'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  });
}

// ═══════════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════════════

function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    const active = t.dataset.tab === tabId;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('hidden', p.id !== `panel-${tabId}`);
  });

  // Leaflet needs resizing after being in a hidden panel
  if (tabId === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 60);

  // Init charts lazily on first analytics visit
  if (tabId === 'analytics') {
    setTimeout(() => {
      initCharts();
      if (currentBins.length) {
        updateCharts(currentBins);
        renderPredictions(currentBins);
        renderAnalyticsAlerts(currentBins);
      }
    }, 80);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ZONE FILTER — All Bins Tab
// ═══════════════════════════════════════════════════════════════════════

function initZoneFilters() {
  document.querySelectorAll('.zone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const zone = btn.dataset.zone;
      document.querySelectorAll('#bins-tbody-full tr[data-zone]').forEach(row => {
        row.style.display = (zone === 'all' || row.dataset.zone === zone) ? '' : 'none';
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// STUB API FUNCTIONS  (Day 1 — no backend needed)
// ═══════════════════════════════════════════════════════════════════════

async function stubSimulate() {
  await new Promise(r => setTimeout(r, 750));
  return STUB_BINS.map(b => ({ ...b, fill_pct: parseFloat((Math.random() * 100).toFixed(2)) }));
}

async function stubGetBins(bins) {
  await new Promise(r => setTimeout(r, 320));
  return bins.map(b => ({
    ...b,
    // priority = (fill_pct × 0.1) + urgency(0–2)   [PROJECT_CONTEXT.md §5]
    priority: parseFloat(((b.fill_pct * 0.1) + (Math.random() * 2)).toFixed(2)),
  }));
}

async function stubGetRoute(bins) {
  await new Promise(r => setTimeout(r, 250));

  // STEP 1 — Filter + rank candidates by priority
  // fill_pct × 0.1 + urgency(0-2) must be ≥ 7.0  [PROJECT_CONTEXT.md §5]
  // Take top-10 by priority score as our route candidate pool
  const candidates = [...bins]
    .filter(b => b.priority >= 7.0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);

  // STEP 2 — Optimise VISIT ORDER via greedy nearest-neighbour + fill weight
  // Uses real Haversine distances between GIFT City lat/lng coordinates
  // (60% fill urgency, 40% travel proximity — configurable via FILL_WEIGHT/DIST_WEIGHT)
  return greedyOptimizeRoute(candidates);
}

// ═══════════════════════════════════════════════════════════════════════
// REAL API FUNCTIONS  (Day 2 — set USE_STUB = false)
// ═══════════════════════════════════════════════════════════════════════

async function apiSimulate() {
  const res = await fetch(`${API_BASE}/api/bins/simulate`, { method: 'POST' });
  if (!res.ok) throw new Error(`POST /api/bins/simulate → HTTP ${res.status}`);
  return res.json();
}

async function apiGetBins() {
  const res = await fetch(`${API_BASE}/api/bins`);
  if (!res.ok) throw new Error(`GET /api/bins → HTTP ${res.status}`);
  return res.json();
}

async function apiGetRoute() {
  const res = await fetch(`${API_BASE}/api/route/today`);
  if (!res.ok) throw new Error(`GET /api/route/today → HTTP ${res.status}`);
  return res.json();
}

// Merge zone/lat/lng from STUB_BINS into real API response (frontend-only data)
function mergeFrontendFields(apiBins) {
  return apiBins.map(apiB => {
    const stub = STUB_BINS.find(s => s.id === apiB.id) || {};
    return { ...stub, ...apiB }; // API data wins for fill_pct, priority
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SIMULATE HANDLER
// ═══════════════════════════════════════════════════════════════════════

async function runSimulation() {
  showLoading();
  try {
    let bins, route;

    if (USE_STUB) {
      const fresh = await stubSimulate();
      STUB_BINS.forEach((b, i) => { b.fill_pct = fresh[i].fill_pct; });
      bins  = await stubGetBins(STUB_BINS);
      route = await stubGetRoute(bins);
    } else {
      await apiSimulate();
      const rawBins = await apiGetBins();
      const rawRoute = await apiGetRoute();
      bins  = mergeFrontendFields(rawBins);
      route = rawRoute;
    }

    currentBins  = bins;
    currentRoute = route;
    simulationCount++;
    lastSimTime = new Date();

    // Update everything
    renderMapBins(bins, route);
    renderRouteList(route, bins);
    renderBinsTableFull(bins);
    updateStats(bins, route);
    renderAlertBanners(bins);

    // Update analytics if visible
    const analyticsPanel = document.getElementById('panel-analytics');
    if (!analyticsPanel.classList.contains('hidden') && chartsReady) {
      updateCharts(bins);
      renderPredictions(bins);
      renderAnalyticsAlerts(bins);
    }

    // Success flash on button
    const btn = document.getElementById('simulate-btn');
    btn.classList.add('btn-flash');
    setTimeout(() => btn.classList.remove('btn-flash'), 900);

  } catch (err) {
    console.error('[SmartWaste] Simulate error:', err);
    showError(`Simulation failed — ${err.message}`);
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// INITIAL PAGE LOAD
// ═══════════════════════════════════════════════════════════════════════

async function initialLoad() {
  showLoading();
  try {
    let bins, route;

    if (USE_STUB) {
      bins  = await stubGetBins([...STUB_BINS]);
      route = await stubGetRoute(bins);
    } else {
      try {
        const rawBins  = await apiGetBins();
        const rawRoute = await apiGetRoute();
        bins  = mergeFrontendFields(rawBins);
        route = rawRoute;
      } catch {
        bins  = await stubGetBins([...STUB_BINS]);
        route = await stubGetRoute(bins);
        showError('Cannot reach backend — showing stub data. Start Express server or set USE_STUB = true.');
      }
    }

    currentBins  = bins;
    currentRoute = route;

    renderMapBins(bins, route);
    renderRouteList(route, bins);
    renderBinsTableFull(bins);
    updateStats(bins, route);
    renderAlertBanners(bins);
    assignFillRates(bins);

    // Hide stub badge if using real API
    const stubPill = document.getElementById('stub-pill');
    if (stubPill) stubPill.style.display = USE_STUB ? '' : 'none';

  } catch (err) {
    console.error('[SmartWaste] Initial load error:', err);
    showError('Failed to load dashboard. Please refresh the page.');
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LIVE CLOCK
// ═══════════════════════════════════════════════════════════════════════

function updateClock() {
  const el = document.getElementById('live-clock');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    el.dateTime = now.toISOString();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Zone filters (Bins tab)
  initZoneFilters();

  // Simulate button
  document.getElementById('simulate-btn').addEventListener('click', runSimulation);

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Initialize Leaflet map
  initMap();

  // Load initial data
  initialLoad();
});
