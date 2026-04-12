/**
 * frontend/js/charts.js
 * Chart.js analytics charts — fill distribution, top priorities, zone averages.
 * Depends on: Chart.js CDN loaded in dashboard.html
 * Called by dashboard.js
 */

let _fillChart     = null;
let _priorityChart = null;
let _zoneChart     = null;

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

/** Initialise all three charts (call once on page load) */
function initCharts() {
  const fillCtx     = document.getElementById('chart-fill')?.getContext('2d');
  const priorityCtx = document.getElementById('chart-priority')?.getContext('2d');
  const zoneCtx     = document.getElementById('chart-zones')?.getContext('2d');
  if (!fillCtx) return;

  // Doughnut — fill distribution
  _fillChart = new Chart(fillCtx, {
    type: 'doughnut',
    data: {
      labels: ['Low (<40%)', 'Medium (40–75%)', 'Critical (>75%)'],
      datasets: [{ data: [0, 0, 0], backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 0, hoverOffset: 8 }],
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '65%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 16 } },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} bins (${Math.round(ctx.raw / (ctx.dataset.data.reduce((a,b)=>a+b,0)||1)*100)}%)` }
        }
      }
    },
  });

  // Horizontal bar — top 10 priority bins
  _priorityChart = new Chart(priorityCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{ data: [], backgroundColor: '#10b981', borderRadius: 4 }] },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#94a3b8', font: { size: 10 } }, min: 0, max: 12 },
        y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      },
    },
  });

  // Bar — zone averages
  _zoneChart = new Chart(zoneCtx, {
    type: 'bar',
    data: {
      labels: ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
      datasets: [{ data: [0,0,0,0], backgroundColor: ['#10b981','#06b6d4','#f59e0b','#8b5cf6'], borderRadius: 6 }],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#94a3b8', font: { size: 10 } }, min: 0, max: 100 },
      },
    },
  });
}

/** Update all charts with fresh bin data */
function updateCharts(bins) {
  if (!_fillChart) return;

  const low  = bins.filter(b => b.fill_pct < 40).length;
  const mid  = bins.filter(b => b.fill_pct >= 40 && b.fill_pct < 75).length;
  const high = bins.filter(b => b.fill_pct >= 75).length;
  _fillChart.data.datasets[0].data = [low, mid, high];
  _fillChart.update();

  const top10 = [...bins].sort((a, b) => b.priority - a.priority).slice(0, 10);
  _priorityChart.data.labels   = top10.map(b => `#${b.id} ${b.location.split('–')[1]?.trim() || b.location}`.slice(0, 22));
  _priorityChart.data.datasets[0].data = top10.map(b => b.priority);
  _priorityChart.data.datasets[0].backgroundColor = top10.map(b =>
    b.priority >= 9 ? '#ef4444' : b.priority >= 7 ? '#f59e0b' : '#10b981'
  );
  _priorityChart.update();

  const avg = zone => {
    const z = bins.filter(b => b.zone === zone);
    return z.length ? parseFloat((z.reduce((s, b) => s + b.fill_pct, 0) / z.length).toFixed(1)) : 0;
  };
  _zoneChart.data.datasets[0].data = ['A','B','C','D'].map(avg);
  _zoneChart.update();
}
