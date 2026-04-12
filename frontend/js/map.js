/**
 * frontend/js/map.js
 * Leaflet city map — init, markers, route polyline, 3 map views.
 * Map view switcher: Dark / Light / Satellite
 * Depends on: Leaflet.js CDN, route.js (for DEPOT)
 */

let _map          = null;
let _markerLayer  = null;
let _routeLayer   = null;
let _zoneLayer    = null;
let _layerControl = null;

// ── Tile layer definitions ─────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    label: '🌙 Dark',
    url:   'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr:  '© CartoDB',
    opts:  { maxZoom: 19 },
  },
  light: {
    label: '☀️ Light',
    url:   'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr:  '© CartoDB',
    opts:  { maxZoom: 19 },
  },
  satellite: {
    label: '🛰 Satellite',
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr:  '© Esri, DigitalGlobe, GeoEye',
    opts:  { maxZoom: 19 },
  },
};

/** Initialise the Leaflet map centred on GIFT City */
function initMap() {
  if (_map) return;

  // Build all three tile layer objects
  const darkLayer      = L.tileLayer(TILE_LAYERS.dark.url,      { ...TILE_LAYERS.dark.opts,      attribution: TILE_LAYERS.dark.attr });
  const lightLayer     = L.tileLayer(TILE_LAYERS.light.url,     { ...TILE_LAYERS.light.opts,     attribution: TILE_LAYERS.light.attr });
  const satelliteLayer = L.tileLayer(TILE_LAYERS.satellite.url, { ...TILE_LAYERS.satellite.opts, attribution: TILE_LAYERS.satellite.attr });

  _map = L.map('city-map', {
    zoomControl:        true,
    attributionControl: true,
    layers:             [darkLayer],   // default = dark
  }).setView([23.1655, 72.6805], 14);  // zoom 14 to show all 4 zones

  // ── Layer control (top-right) — Dark / Light / Satellite ────────────────
  const baseMaps = {
    [TILE_LAYERS.dark.label]:      darkLayer,
    [TILE_LAYERS.light.label]:     lightLayer,
    [TILE_LAYERS.satellite.label]: satelliteLayer,
  };

  _layerControl = L.control.layers(baseMaps, {}, {
    position:    'topright',
    collapsed:   false,
  }).addTo(_map);

  // Style the Leaflet layer control for our dark theme
  _map.on('baselayerchange', e => {
    const isSat   = e.name.includes('Satellite');
    const isLight = e.name.includes('Light');
    // Adjust zone boundary opacity based on tile darkness
    if (_zoneLayer) {
      _zoneLayer.getLayers().forEach(l => {
        if (l.setStyle) l.setStyle({ fillOpacity: isSat ? 0.12 : isLight ? 0.08 : 0.05 });
      });
    }
  });

  // ── Zone boundary rectangles (all 4 zones, dashed outline) ──────────────
  _zoneLayer = L.layerGroup().addTo(_map);
  const zones = [
    { bounds: [[23.1657,72.6812],[23.1698,72.6872]], color:'#10b981', name:'Zone A — Financial' },
    { bounds: [[23.1612,72.6822],[23.1657,72.6878]], color:'#06b6d4', name:'Zone B — Residential' },
    { bounds: [[23.1657,72.6742],[23.1698,72.6812]], color:'#f59e0b', name:'Zone C — Commercial' },
    { bounds: [[23.1602,72.6737],[23.1655,72.6802]], color:'#8b5cf6', name:'Zone D — Industrial' },
  ];
  zones.forEach(z => {
    L.rectangle(z.bounds, {
      color:       z.color, weight: 1.5, dashArray: '6,4', opacity: 0.6,
      fillColor:   z.color, fillOpacity: 0.05,
      interactive: true,
    }).addTo(_zoneLayer)
      .bindTooltip(`<b style="color:${z.color}">${z.name}</b>`, {
        permanent: false, direction: 'center', className: 'zone-tooltip',
      });
  });

  // ── Depot marker ──────────────────────────────────────────────────────────
  const depotIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;border-radius:3px;
      background:#10b981;border:2px solid white;
      box-shadow:0 0 10px #10b981;transform:rotate(45deg);
    "></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });
  L.marker([DEPOT.lat, DEPOT.lng], { icon: depotIcon })
    .addTo(_map)
    .bindPopup('<b>🏪 Depot</b><br/>GIFT City Collection Center<br/>Route starts and ends here.');

  _markerLayer = L.layerGroup().addTo(_map);
  _routeLayer  = L.layerGroup().addTo(_map);
}

/** Get colours based on fill_pct level */
function fillColors(fill_pct) {
  if (fill_pct >= 75) return { bg: '#ef4444', glow: 'rgba(239,68,68,.6)', label: 'CRITICAL' };
  if (fill_pct >= 55) return { bg: '#f59e0b', glow: 'rgba(245,158,11,.5)', label: 'WARNING' };
  if (fill_pct >= 40) return { bg: '#eab308', glow: 'rgba(234,179,8,.4)',  label: 'ELEVATED' };
  return                      { bg: '#10b981', glow: 'rgba(16,185,129,.4)', label: 'NORMAL' };
}

/** Update all bin markers on the map */
function updateMarkers(bins, routeIds = new Set()) {
  _markerLayer.clearLayers();
  bins.forEach(bin => {
    const { bg, glow } = fillColors(bin.fill_pct);
    const inRoute = routeIds.has(bin.id);
    const size    = inRoute ? 20 : (bin.fill_pct >= 75 ? 14 : 11);

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px; height:${size}px; border-radius:50%;
        background:${bg}; opacity:${bin.fill_pct < 20 ? 0.6 : 1};
        border:${inRoute ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,.35)'};
        box-shadow:0 0 ${inRoute ? 14 : 5}px ${glow};
        transition:all .2s;
      "></div>`,
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor:[0, -(size / 2) - 4],
    });

    L.marker([bin.lat, bin.lng], { icon, zIndexOffset: inRoute ? 100 : 0 })
      .bindPopup(`
        <div style="min-width:190px; font-family:Inter,sans-serif; font-size:.82rem">
          <b style="font-size:.95rem">Bin #${bin.id}</b> &nbsp;
          <span style="background:rgba(255,255,255,.1);padding:.1rem .4rem;border-radius:99px;font-size:.7rem">${bin.zone}</span><br/>
          <span style="color:#94a3b8">${bin.location}</span>
          <hr style="border-color:rgba(255,255,255,.1);margin:.5rem 0"/>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="color:${bg};font-weight:900;font-size:1.2rem">${(bin.fill_pct ?? 0).toFixed(1)}%</span>
              <span style="color:#94a3b8;font-size:.75rem"> fill</span>
            </div>
            <span style="color:${bg};font-size:.72rem;font-weight:700;background:rgba(255,255,255,.08);padding:.15rem .5rem;border-radius:99px">
              ${fillColors(bin.fill_pct).label}
            </span>
          </div>
          <div style="margin-top:.4rem;color:#94a3b8;font-size:.72rem">
            Priority: <b style="color:#f0fdf4">${(bin.priority ?? 0).toFixed(2)}</b>
            ${inRoute ? ` &nbsp;·&nbsp; <b style="color:#10b981">IN ROUTE ✓</b>` : ''}
          </div>
        </div>
      `)
      .addTo(_markerLayer);
  });
}

/** Draw the nearest-neighbor route polyline across the entire city */
function drawRoute(route) {
  _routeLayer.clearLayers();
  if (!route.length) return;

  // ── Animated route line: depot → stops in order ──────────────────────────
  const coords = [[DEPOT.lat, DEPOT.lng], ...route.map(b => [b.lat, b.lng])];

  // Main route line
  L.polyline(coords, {
    color:     '#10b981',
    weight:    3,
    dashArray: '10, 6',
    opacity:   0.9,
    lineJoin:  'round',
  }).addTo(_routeLayer);

  // Glowing halo under the route line
  L.polyline(coords, {
    color:   '#10b981',
    weight:  8,
    opacity: 0.12,
  }).addTo(_routeLayer);

  // Return-to-depot dashed line from last stop back
  L.polyline([[route[route.length-1].lat, route[route.length-1].lng], [DEPOT.lat, DEPOT.lng]], {
    color:     '#94a3b8',
    weight:    1.5,
    dashArray: '4, 8',
    opacity:   0.45,
  }).addTo(_routeLayer);

  // ── Numbered stop markers ─────────────────────────────────────────────────
  route.forEach(b => {
    const isCritical = b.fill_pct >= 75;
    const bg = isCritical ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#d97706,#f59e0b)';

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:24px; height:24px; border-radius:50%;
        background:${bg};
        border:2.5px solid white; color:white; font-size:10px; font-weight:900;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 0 14px ${isCritical ? 'rgba(239,68,68,.7)' : 'rgba(245,158,11,.6)'};
      ">${b.rank}</div>`,
      iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -14],
    });

    L.marker([b.lat, b.lng], { icon, zIndexOffset: 500 })
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:.82rem;min-width:200px">
          <b>🚛 Stop #${b.rank}</b><br/>
          <span style="font-weight:700">${b.location}</span><br/>
          <span style="color:#94a3b8">Zone ${b.zone}</span>
          <hr style="border-color:rgba(255,255,255,.1);margin:.4rem 0"/>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#ef4444;font-weight:800">${b.fill_pct.toFixed(1)}% full</span>
            <span style="color:#94a3b8">${b.distance_from_prev_km ?? '—'} km from prev</span>
          </div>
          <div style="color:#94a3b8;margin-top:.3rem">
            Cumulative: <b style="color:#f0fdf4">${b.cumulative_km ?? '—'} km</b>
          </div>
        </div>
      `)
      .addTo(_routeLayer);
  });

  // ── Direction arrows on line ──────────────────────────────────────────────
  if (typeof L.polylineDecorator === 'undefined') return; // skip if plugin not loaded
  L.polylineDecorator(coords, {
    patterns: [{
      offset: '10%', repeat: '20%',
      symbol: L.Symbol.arrowHead({ pixelSize: 10, polygon: false, pathOptions: { color: '#10b981', weight: 2 } }),
    }],
  }).addTo(_routeLayer);
}

/** Fit map to all bins (entire city view) */
function fitAllBins(bins) {
  if (!bins.length) return;
  _map.fitBounds(L.latLngBounds(bins.map(b => [b.lat, b.lng])).pad(0.18));
}

/** Fit map to route stops only */
function fitRoute(route) {
  if (!route.length) return;
  const allCoords = [[DEPOT.lat, DEPOT.lng], ...route.map(b => [b.lat, b.lng])];
  _map.fitBounds(L.latLngBounds(allCoords).pad(0.22));
}

/** Pan to a specific bin */
function panToBin(lat, lng) {
  _map.setView([lat, lng], 17, { animate: true });
}
