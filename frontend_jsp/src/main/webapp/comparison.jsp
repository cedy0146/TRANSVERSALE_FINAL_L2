%>
<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">⚖️ Comparaison des Algorithmes</h1>
        <p class="page-subtitle">Knapsack DP optimisé vs FIFO naïf — Métriques en temps réel depuis la DB</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadComparison()">🔄 Actualiser</button>
        <button class="btn btn-primary" id="btn-run" onclick="runLiveComparison()">▶ Lancer la comparaison live</button>
      </div>
    </div>

    <!-- Explication -->
    <div class="alert alert-info" style="margin-bottom:20px;">
      <span class="alert-icon">ℹ️</span>
      <div class="alert-body">
        <div class="alert-title">FC6 — Validation algorithmique intégrée</div>
        <div class="alert-message">
          Compare en direct les deux méthodes d'allocation sur les <strong>demandes réelles en attente</strong> dans la DB.
          <strong>FIFO naïf</strong> sert dans l'ordre d'arrivée. <strong>Knapsack DP</strong> maximise l'utilité sociale
          en respectant les contraintes de capacité batterie. Aucune donnée n'est codée en dur.
        </div>
      </div>
    </div>

    <!-- Tableau de comparaison statique (données /api/demo/comparison) -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <span class="card-title">📊 Comparatif des Méthodes</span>
        <span class="badge badge-blue">Source : DB + calcul temps réel</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Algorithme</th>
              <th>Complexité</th>
              <th>Satisfaction</th>
              <th>Temps d'exec.</th>
              <th>Coupures évitées</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody id="comparison-tbody">
            <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--c-text-3);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement depuis la base de données...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Comparaison live sur données réelles DB -->
    <div id="live-section" style="display:none;">

      <!-- KPIs comparaison -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;" id="live-kpis"></div>

      <!-- Graphiques côte à côte -->
      <div class="grid-2" style="margin-bottom:20px;">
        <div class="card">
          <div class="card-header">
            <span class="card-title">🎒 Knapsack DP (Optimisé)</span>
            <span class="badge badge-green">Recommandé</span>
          </div>
          <canvas id="chart-knapsack" style="max-height:220px;"></canvas>
          <div id="knapsack-stats" style="margin-top:12px;"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 FIFO Naïf (Baseline)</span>
            <span class="badge badge-gray">Baseline</span>
          </div>
          <canvas id="chart-fifo" style="max-height:220px;"></canvas>
          <div id="fifo-stats" style="margin-top:12px;"></div>
        </div>
      </div>

      <!-- Gain -->
      <div class="card" style="margin-bottom:20px;" id="gain-card">
        <div class="card-header">
          <span class="card-title">📈 Gain Algorithmique</span>
        </div>
        <div id="gain-content"></div>
      </div>

      <!-- Détail demandes acceptées / rejetées -->
      <div class="grid-2">
        <div class="card" style="padding:0;">
          <div class="card-header" style="padding:14px 20px;">
            <span class="card-title">✅ Acceptées — Knapsack</span>
            <span class="badge badge-green" id="badge-knapsack-acc">0</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>ID Foyer</th><th>Quantité</th><th>Criticité</th><th>Utilité</th></tr></thead>
              <tbody id="tbody-knapsack-acc"></tbody>
            </table>
          </div>
        </div>
        <div class="card" style="padding:0;">
          <div class="card-header" style="padding:14px 20px;">
            <span class="card-title">✅ Acceptées — FIFO</span>
            <span class="badge badge-gray" id="badge-fifo-acc">0</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>ID Foyer</th><th>Quantité</th><th>Criticité</th><th>Utilité</th></tr></thead>
              <tbody id="tbody-fifo-acc"></tbody>
            </table>
          </div>
        </div>
      </div>

    </div><!-- /live-section -->

  </main>

</div>
<div id="toast-container"></div>

<script src="js/app.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
Auth.guard();

let chartKnapsack = null;
let chartFifo     = null;

// ── Tableau comparatif depuis /api/demo/comparison ──────────────────────────
async function loadComparison() {
  const tbody = document.getElementById('comparison-tbody');
  try {
    const data = await fetch(API_BASE + '/demo/comparison').then(r => r.json());
    if (!data.success) throw new Error(data.message);

    tbody.innerHTML = data.results.map(r => `
      <tr style="${r.best ? 'background:var(--glow-green);' : ''}">
        <td>
          <div style="font-weight:600;">${r.name}</div>
          ${r.best ? '<span class="badge badge-green" style="margin-top:2px;">⭐ Optimal</span>' : ''}
        </td>
        <td><span class="badge badge-purple" style="font-family:var(--mono);">${r.complexity}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:var(--c-surface-2);border-radius:3px;overflow:hidden;min-width:60px;">
              <div style="height:100%;width:${r.satisfaction};background:${r.best ? '#10b981' : 'var(--c-accent)'};border-radius:3px;"></div>
            </div>
            <span style="font-family:var(--mono);font-size:0.875rem;font-weight:600;">${r.satisfaction}</span>
          </div>
        </td>
        <td><span style="font-family:var(--mono);">${r.time}</span></td>
        <td>
          <span style="font-family:var(--mono);color:${r.cuts <= 2 ? '#10b981' : r.cuts <= 8 ? '#f59e0b' : 'var(--c-danger)'};">
            ${r.cuts}
          </span>
        </td>
        <td>${r.best
          ? '<span class="badge badge-green">✅ Recommandé</span>'
          : '<span class="badge badge-gray">Baseline</span>'}</td>
      </tr>`).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--c-danger);">
      Erreur : ${err.message}</td></tr>`;
    Toast.error('Erreur chargement comparaison : ' + err.message);
  }
}

// ── Comparaison LIVE sur données réelles DB (allocation/comparer) ────────────
async function runLiveComparison() {
  setLoading('btn-run', true);
  const liveSection = document.getElementById('live-section');
  liveSection.style.display = 'none';

  try {
    const data = await API.alloc.comparer();
    liveSection.style.display = 'block';

    const opt  = data.optimise || {};
    const naif = data.naif     || {};
    const amelioration = data.amelioration_utilite_pct ?? 0;
    const gainCrit     = data.gain_critiques ?? 0;

    // KPIs
    document.getElementById('live-kpis').innerHTML = `
      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:4px;">Utilité Knapsack</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:#10b981;">${opt.utilite_totale ?? '—'}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:4px;">Utilité FIFO</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--c-text-2);">${naif.utilite_totale ?? '—'}</div>
      </div>
      <div style="background:var(--glow-green);padding:16px;border-radius:var(--radius-sm);border:1px solid rgba(34,211,160,0.2);text-align:center;">
        <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:4px;">Amélioration</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:#10b981;">+${amelioration}%</div>
      </div>
      <div style="background:${gainCrit > 0 ? 'var(--glow-green)' : 'var(--c-surface-2)'};padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:4px;">Critiques sauvés en +</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:${gainCrit > 0 ? '#10b981' : 'var(--c-text-2)'};">+${gainCrit}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:4px;">Temps Knapsack</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--c-accent);">${opt.temps_ms ?? '—'} ms</div>
      </div>
      <div style="background:var(--c-surface-2);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--c-border);text-align:center;">
        <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;margin-bottom:4px;">Temps FIFO</div>
        <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--c-text-2);">${naif.temps_ms ?? '—'} ms</div>
      </div>`;

    // Graphiques doughnut
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    renderDoughnut('chart-knapsack', chartKnapsack,
      (opt.acceptees || []).length, (opt.rejetees || []).length,
      '#10b981', isDark,
      v => { chartKnapsack = v; });

    renderDoughnut('chart-fifo', chartFifo,
      (naif.acceptees || []).length, (naif.rejetees || []).length,
      'var(--c-accent)', isDark,
      v => { chartFifo = v; });

    // Stats sous graphiques
    renderAlgoStats('knapsack-stats', opt);
    renderAlgoStats('fifo-stats', naif);

    // Gain narrative
    document.getElementById('gain-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <div style="font-size:0.875rem;color:var(--c-text-2);margin-bottom:8px;">
            Le Knapsack produit <strong style="color:#10b981;">${amelioration}% de gain d'utilité</strong>
            et sauvegarde <strong style="color:#10b981;">${data.critiques_sauves_optimise ?? 0} demandes critiques</strong>
            contre <strong>${data.critiques_sauves_naif ?? 0}</strong> pour le FIFO.
          </div>
          <div style="font-size:0.8rem;color:var(--c-text-3);">
            Énergie utilisée — Knapsack : <strong style="font-family:var(--mono);">${fmt.kWh(opt.energie_utilisee_kwh ?? 0)}</strong>
            · FIFO : <strong style="font-family:var(--mono);">${fmt.kWh(naif.energie_utilisee_kwh ?? 0)}</strong>
          </div>
        </div>
        <div style="background:var(--glow-green);border:1px solid rgba(34,211,160,0.3);padding:16px 24px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:0.7rem;color:var(--c-text-3);text-transform:uppercase;">Score algorithme recommandé</div>
          <div style="font-size:2rem;font-weight:800;color:#10b981;font-family:var(--mono);">Knapsack DP</div>
          <div style="font-size:0.75rem;color:var(--c-text-3);">O(n·W) — Programmation dynamique</div>
        </div>
      </div>`;

    // Tableaux détaillés
    renderDemandesTable('tbody-knapsack-acc', 'badge-knapsack-acc', opt.acceptees || []);
    renderDemandesTable('tbody-fifo-acc',     'badge-fifo-acc',     naif.acceptees || []);

    Toast.success('Comparaison live terminée !');

  } catch (err) {
    Toast.error('Erreur comparaison live : ' + err.message);
  } finally {
    setLoading('btn-run', false);
  }
}

function renderDoughnut(canvasId, existingChart, accepted, rejected, color, isDark, setChart) {
  if (existingChart) existingChart.destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Acceptées', 'Rejetées'],
      datasets: [{ data: [accepted, rejected], backgroundColor: [color, '#2a3550'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { labels: { color: isDark ? '#e8ecf5' : '#1a2035', font: { family: 'Space Grotesk', size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label} : ${ctx.parsed}` } }
      }
    }
  });
  setChart(chart);
}

function renderAlgoStats(id, algo) {
  const critColors = { CRITIQUE: 'red', HAUTE: 'yellow', NORMALE: 'blue', FAIBLE: 'green' };
  const critiques  = (algo.acceptees || []).filter(d => d.niveau_criticite === 'CRITIQUE').length;
  document.getElementById(id).innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
      <div style="background:var(--c-surface-2);padding:10px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:0.65rem;color:var(--c-text-3);text-transform:uppercase;">Acceptées</div>
        <div style="font-family:var(--mono);font-weight:700;font-size:1.1rem;color:#10b981;">${(algo.acceptees||[]).length}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:10px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:0.65rem;color:var(--c-text-3);text-transform:uppercase;">Critiques</div>
        <div style="font-family:var(--mono);font-weight:700;font-size:1.1rem;color:var(--c-danger);">${critiques}</div>
      </div>
      <div style="background:var(--c-surface-2);padding:10px;border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:0.65rem;color:var(--c-text-3);text-transform:uppercase;">Énergie</div>
        <div style="font-family:var(--mono);font-weight:700;font-size:0.85rem;color:var(--c-accent);">${fmt.kWh(algo.energie_utilisee_kwh||0)}</div>
      </div>
    </div>`;
}

function renderDemandesTable(tbodyId, badgeId, demandes) {
  const critColors = { CRITIQUE: 'red', HAUTE: 'yellow', NORMALE: 'blue', FAIBLE: 'green' };
  document.getElementById(badgeId).textContent = demandes.length;
  const tbody = document.getElementById(tbodyId);
  if (!demandes.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--c-text-3);">Aucune</td></tr>';
    return;
  }
  tbody.innerHTML = demandes.map(d => `
    <tr>
      <td style="font-family:var(--mono);font-size:0.75rem;">${(d.foyer_id || d.id || '').substring(0,10)}…</td>
      <td style="font-family:var(--mono);">${fmt.kWh(d.quantite_kwh || 0)}</td>
      <td><span class="badge badge-${critColors[d.niveau_criticite] || 'gray'}">${d.niveau_criticite || '—'}</span></td>
      <td style="font-family:var(--mono);color:#10b981;">${d.utilite ?? '—'}</td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  const user = Auth.getUser();
  if (user) {
    const el   = document.getElementById('current-username');
    const role = document.getElementById('current-role');
    if (el)   el.textContent   = user.nom || user.username || user.email || 'Utilisateur';
    if (role) role.textContent = user.role || 'MEMBRE';
  }
  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
  loadComparison();
});
</script>
</body>
</html>
