/**
 * frontend/js/map.js
 * Leaflet city map — initialization, markers, route polyline.
 * Depends on: Leaflet.js CDN loaded in dashboard.html
 * Called by dashboard.js
 */

let _map = null;
let _markerLayer  = null;
let _routeLayer   = null;

/** Initialise the Leaflet map centred on GIFT City */
function initMap() {
  if (_map) return;
  _map = L.map('city-map', { zoomControl: true, attributionControl: false })
    .setView([23.1655, 72.6810], 15);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(_map);

  // Zone boundary rectangles
  const zones = [
    { bounds: [[23.1660,72.6815],[23.1695,72.6870]], color:'#10b981', name:'Zone A' },
    { bounds: [[23.1615,72.6825],[23.1655,72.6875]], color:'#06b6d4', name:'Zone B' },
    { bounds: [[23.1660,72.6745],[23.1695,72.6810]], color:'#f59e0b', name:'Zone C' },
    { bounds: [[23.1605,72.6740],[23.1650,72.6800]], color:'#8b5cf6', name:'Zone D' },
  ];
  zones.forEach(z => {
    L.rectangle(z.bounds, {
      color: z.color, weight: 1.5, dashArray: '5,5',
      fillColor: z.color, fillOpacity: 0.04,
    }).addTo(_map).bindPopup(`<strong>${z.name}</strong>`);
  });

  _markerLayer = L.layerGroup().addTo(_map);
  _routeLayer  = L.layerGroup().addTo(_map);
}

/** Get marker colour based on fill_pct */
function markerColor(fill_pct) {
  if (fill_pct >= 75) return '#ef4444';
  if (fill_pct >= 40) return '#f59e0b';
  return '#10b981';
}

/** Update all bin markers on the map */
function updateMarkers(bins, routeIds = new Set()) {
  _markerLayer.clearLayers();
  bins.forEach(bin => {
    const color = markerColor(bin.fill_pct);
    const inRoute = routeIds.has(bin.id);
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:${inRoute ? 18 : 13}px;height:${inRoute ? 18 : 13}px;
        background:${color};border-radius:50%;
        border:${inRoute ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,.4)'};
        box-shadow:0 0 ${inRoute ? 10 : 5}px ${color};
      "></div>`,
      iconSize: inRoute ? [18, 18] : [13, 13],
      iconAnchor: inRoute ? [9, 9] : [6, 6],
      popupAnchor: [0, -10],
    });
    const marker = L.marker([bin.lat, bin.lng], { icon })
      .bindPopup(`
        <div style="min-width:170px;font-family:Inter,sans-serif">
          <b>Bin #${bin.id}</b> — ${bin.location}<br/>
          <span style="font-size:.8rem;color:#94a3b8">Zone ${bin.zone}</span><br/>
          <div style="margin:.5rem 0">
            <span style="color:${color};font-weight:800;font-size:1rem">${bin.fill_pct?.toFixed(1) ?? 0}%</span>
            <span style="color:#94a3b8;font-size:.78rem"> fill</span>
          </div>
          <span style="font-size:.78rem;color:#94a3b8">Priority: ${bin.priority?.toFixed(2) ?? '—'}</span>
        </div>
      `);
    _markerLayer.addLayer(marker);
  });
}

/** Draw the optimised route polyline */
function drawRoute(route) {
  _routeLayer.clearLayers();
  if (!route.length) return;
  const coords = route.map(b => [b.lat, b.lng]);
  L.polyline([[DEPOT.lat, DEPOT.lng], ...coords], {
    color: '#10b981', weight: 2.5, dashArray: '8,5', opacity: 0.85,
  }).addTo(_routeLayer);

  // Add numbered route stop markers
  route.forEach(b => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:22px;height:22px;border-radius:50%;
        background:linear-gradient(135deg,#059669,#10b981);
        border:2px solid white;color:white;font-size:10px;font-weight:900;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 12px rgba(16,185,129,.6);
      ">${b.rank}</div>`,
      iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12],
    });
    L.marker([b.lat, b.lng], { icon })
      .bindPopup(`<b>Stop #${b.rank}: ${b.location}</b><br/>Fill: ${b.fill_pct.toFixed(1)}% | Priority: ${b.priority.toFixed(2)}`)
      .addTo(_routeLayer);
  });
}

/** Pan/zoom map to fit all bins */
function fitAllBins(bins) {
  if (!bins.length) return;
  _map.fitBounds(L.latLngBounds(bins.map(b => [b.lat, b.lng])).pad(0.15));
}

/** Pan/zoom map to fit route only */
function fitRoute(route) {
  if (!route.length) return;
  _map.fitBounds(L.latLngBounds(route.map(b => [b.lat, b.lng])).pad(0.2));
}

/** Pan to specific bin */
function panToBin(lat, lng) {
  _map.setView([lat, lng], 17, { animate: true });
}
