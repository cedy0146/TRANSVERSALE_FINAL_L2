<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>


  <!-- MAIN CONTENT -->
  <main class="main-content">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">📊 Tableau de bord</h1>
        <p class="page-subtitle" id="last-refresh">Chargement des données...</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadDashboard()">🔄 Actualiser</button>
        <button class="btn btn-primary btn-sm" onclick="window.location.href='allocation.jsp'">⚡ Lancer Allocation</button>
      </div>
    </div>

    <!-- KPI Stats -->
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card blue skeleton" style="height:120px;"></div>
      <div class="stat-card green skeleton" style="height:120px;"></div>
      <div class="stat-card yellow skeleton" style="height:120px;"></div>
      <div class="stat-card red skeleton" style="height:120px;"></div>
    </div>

    <!-- Ligne principale : Batteries + Demandes récentes -->
    <div class="grid-2" style="margin-bottom:16px;">

      <!-- Batteries -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔋 État des Batteries</span>
          <a href="batteries.jsp" class="btn btn-ghost btn-sm">Voir tout →</a>
        </div>
        <div id="batteries-list">
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
        </div>
      </div>

      <!-- Demandes en attente -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚡ Demandes en Attente</span>
          <a href="demandes.jsp" class="btn btn-ghost btn-sm">Voir tout →</a>
        </div>
        <div id="demandes-list">
          <div class="skeleton" style="height:50px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:50px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:50px;margin-bottom:8px;"></div>
        </div>
      </div>
    </div>

    <!-- Analyses Algorithmiques (Segment Tree & Heap) -->
    <div class="grid-2" style="margin-bottom:16px;">
      <!-- Card Segment Tree -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📉 Analyse Temporelle (Segment Tree)</span>
          <span class="badge badge-blue">O(log n)</span>
        </div>
        <div id="segment-tree-result">
          <div class="stat-value" id="st-sum">0 kWh</div>
          <p class="stat-label">Consommation cumulée (Dernières 24h)</p>
        </div>
      </div>

      <!-- Card Min-Heap -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔝 File d'Attente Prioritaire (Heap)</span>
          <span class="badge badge-purple">Min-Heap</span>
        </div>
        <div id="heap-result">
          <div id="heap-top-priority">Chargement...</div>
        </div>
      </div>
    </div>

    <!-- Foyers + Rapports récents -->
    <div class="grid-2">

      <!-- Foyers par priorité -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🏠 Foyers par Priorité</span>
          <a href="foyers.jsp" class="btn btn-ghost btn-sm">Gérer →</a>
        </div>
        <canvas id="chart-foyers" style="max-height:220px;"></canvas>
        <div id="foyers-summary" style="margin-top:12px;"></div>
      </div>

      <!-- Derniers rapports -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Derniers Rapports</span>
          <a href="rapports.jsp" class="btn btn-ghost btn-sm">Voir tout →</a>
        </div>
        <div id="rapports-list">
          <div class="skeleton" style="height:50px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:50px;margin-bottom:8px;"></div>
        </div>
      </div>
    </div>

  </main>

</div><!-- /app-layout -->
<div id="toast-container"></div>

<script src="js/app.js"></script>
<script>
// ── GARDE AUTH ──────────────────────────────────────────────────────────────
// Exécuté après le chargement du DOM pour éviter les erreurs sur les éléments
// de la sidebar (badge-demandes, etc.) qui ne seraient pas encore disponibles.
document.addEventListener('DOMContentLoaded', function() {

  // 1. Vérifier l'authentification
  Auth.guard();

  let chartFoyers = null;

  // 2. Charger le dashboard
  async function loadDashboard() {
    try {
      let [foyers, batteries, demandes, rapports] = await Promise.all([
        API.foyers.getAll(),
        API.batteries.getAll(),
        API.demandes.getAll(),
        API.rapports.getAll(),
      ]);
      
      loadAlgoAnalysis();

      renderStats(foyers, batteries, demandes, rapports);
      renderBatteries(batteries);
      renderDemandes(demandes.filter(d => !d.est_acceptee).slice(0, 5));
      renderFoyersChart(foyers);
      renderRapports(rapports.slice(0, 4));

      document.getElementById('last-refresh').textContent =
        'Mis à jour le ' + new Date().toLocaleTimeString('fr-FR');

      // Badge sidebar — sécurisé avec null-check
      let badgeEl = document.getElementById('badge-demandes');
      if (badgeEl) {
        let pending = demandes.filter(d => !d.est_acceptee).length;
        badgeEl.textContent = pending;
      }

    } catch (err) {
      Toast.error('Erreur de chargement : ' + err.message);
    }
  }

  // Exposer loadDashboard globalement pour le bouton "Actualiser"
  window.loadDashboard = loadDashboard;

  async function loadAlgoAnalysis() {
    try {
      // Récupération Segment Tree (Consommation réelle DB)
      let stData = await fetch(API_BASE + '/demo/segment-tree').then(r => r.json());
      if(stData.success) {
        document.getElementById('st-sum').textContent = fmt.kWh(stData.intervalSum);
      }

      // Récupération Heap (Priorités DB)
      let heapData = await fetch(API_BASE + '/demo/heap').then(r => r.json());
      if(heapData.success && heapData.priorities.length > 0) {
        let top = heapData.priorities[0];
        document.getElementById('heap-top-priority').innerHTML = `
          <div class="alert alert-warning" style="margin:0;">
            <div class="alert-icon">🚨</div>
            <div class="alert-body">
              <div class="alert-title">Haute Priorité : ${top.element}</div>
              <div class="alert-message">Niveau de priorité : ${top.priority}</div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error("Erreur algo dashboard:", err);
    }
  }

  function renderStats(foyers, batteries, demandes, rapports) {
    let totalBatCap = batteries.reduce((s, b) => s + (b.capacite_totale || 0), 0);
    let totalBatAct = batteries.reduce((s, b) => s + (b.capacite_actuelle || 0), 0);
    let batPct = fmt.pct(totalBatAct, totalBatCap);
    let demandesEnCours = demandes.filter(d => !d.est_acceptee).length;
    let totalConsomm = rapports.reduce((s, r) => s + (r.consommation_totale || 0), 0);

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card blue fade-in">
        <div style="position:absolute;top:8px;right:12px;font-size:0.7rem;color:var(--accent-blue);font-family:var(--font-mono);">${batPct}%</div>
        <div class="stat-icon blue">🔋</div>
        <div class="stat-value">${fmt.wh(totalBatAct)}</div>
        <div class="stat-label">Énergie stockée (/${fmt.wh(totalBatCap)})</div>
      </div>
      <div class="stat-card green fade-in">
        <div class="stat-icon green">🏠</div>
        <div class="stat-value">${foyers.length}</div>
        <div class="stat-label">Foyers enregistrés</div>
      </div>
      <div class="stat-card yellow fade-in">
        <div class="stat-icon yellow">⚡</div>
        <div class="stat-value">${demandesEnCours}</div>
        <div class="stat-label">Demandes en attente</div>
      </div>
      <div class="stat-card red fade-in">
        <div class="stat-icon red">📋</div>
        <div class="stat-value">${rapports.length}</div>
        <div class="stat-label">Rapports générés (${fmt.kWh(totalConsomm)} total)</div>
      </div>
    `;
  }

  function renderBatteries(batteries) {
    const el = document.getElementById('batteries-list');
    if (!batteries.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔋</div><div class="empty-title">Aucune batterie</div></div>';
      return;
    }
    el.innerHTML = batteries.map(b => {
      let pct = fmt.pct(b.capacite_actuelle, b.capacite_totale);
      let cls = getBatteryClass(pct);
      let criticalFlag = b.capacite_actuelle <= b.seuil_critique;
      return `
        <div style="margin-bottom:14px;">
          <div class="battery-label">
            <span style="font-weight:600;font-size:0.875rem;">Batterie #${b.id}
              ${criticalFlag ? '<span class="badge badge-red" style="margin-left:6px;">⚠ Critique</span>' : ''}
            </span>
            <span style="font-family:var(--font-mono);font-size:0.875rem;">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
            <span>Actuelle: ${fmt.wh(b.capacite_actuelle)}</span>
            <span>Seuil: ${fmt.wh(b.seuil_critique)}</span>
            <span>Max: ${fmt.wh(b.capacite_totale)}</span>
          </div>
        </div>`;
    }).join('');
  }

  function renderDemandes(demandes) {
    const el = document.getElementById('demandes-list');
    if (!demandes.length) {
      el.innerHTML = `<div class="empty-state" style="padding:24px;">
        <div class="empty-icon">✅</div>
        <div class="empty-title">Aucune demande en attente</div>
      </div>`;
      return;
    }
    let critColors = { CRITIQUE: 'red', HAUTE: 'yellow', NORMALE: 'blue', FAIBLE: 'green' };
    el.innerHTML = demandes.map(d => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:6px;background:var(--bg-secondary);">
        <span class="badge badge-${critColors[d.niveau_criticite] || 'gray'}">${d.niveau_criticite || '—'}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            Foyer: ${d.foyer_id?.substring(0, 8) || '—'}...
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${fmt.kWh(d.quantite_kwh)} · ${fmt.datetime(d.heure_souhaitee)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderFoyersChart(foyers) {
    let counts = { URGENTE: 0, HAUTE: 0, NORMALE: 0 };
    foyers.forEach(f => { if (counts[f.type_priorite] !== undefined) counts[f.type_priorite]++; else counts['NORMALE']++; });

    let ctx = document.getElementById('chart-foyers').getContext('2d');
    if (chartFoyers) chartFoyers.destroy();

    let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    chartFoyers = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Urgente', 'Haute', 'Normale'],
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#ff5656', '#f5b820', '#4a9eff'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: isDark ? '#e8ecf5' : '#1a2035', padding: 16, font: { family: 'Space Grotesk', size: 12 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} foyer(s)` } }
        },
        cutout: '68%'
      }
    });

    document.getElementById('foyers-summary').innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        ${Object.entries(counts).map(([k, v]) => `
          <div style="text-align:center;padding:8px 12px;background:var(--bg-secondary);border-radius:var(--radius-sm);">
            <div style="font-weight:700;font-size:1.1rem;font-family:var(--font-mono);">${v}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${k}</div>
          </div>`).join('')}
        <div style="text-align:center;padding:8px 12px;background:var(--bg-secondary);border-radius:var(--radius-sm);">
          <div style="font-weight:700;font-size:1.1rem;font-family:var(--font-mono);">${foyers.length}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">TOTAL</div>
        </div>
      </div>`;
  }

  function renderRapports(rapports) {
    let el = document.getElementById('rapports-list');
    if (!rapports.length) {
      el.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="empty-icon">📋</div><div class="empty-title">Aucun rapport</div></div>';
      return;
    }
    el.innerHTML = rapports.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;background:var(--bg-secondary);">
        <div>
          <div style="font-size:0.8rem;font-weight:600;">${r.id?.substring(0, 12) || '—'}...</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Conso: ${fmt.kWh(r.consommation_totale)}</div>
        </div>
        <span class="badge badge-blue">${fmt.wh(r.batterie_fin - r.batterie_debut >= 0 ? r.batterie_fin - r.batterie_debut : r.batterie_fin)}</span>
      </div>`).join('');
  }

  // Lancement initial
  loadDashboard();
  setInterval(loadDashboard, 30000); // auto-refresh 30s

}); // fin DOMContentLoaded
</script>
</body>
</html>
