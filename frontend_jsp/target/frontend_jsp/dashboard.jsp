<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="true" %>
<%@ include file="WEB-INF/header.jspf" %>

  <!-- MAIN CONTENT -->
  <main class="main-content">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Tableau de bord</h1>
        <p class="page-subtitle" id="last-refresh">Chargement des données...</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadDashboard()">↻ Actualiser</button>
        <% if ("RESPONSABLE".equals(session.getAttribute("userRole")) || "ADMIN".equals(session.getAttribute("userRole"))) { %>
          <button class="btn btn-primary btn-sm" onclick="window.location.href='allocation.jsp'">⚡ Lancer Allocation</button>
        <% } %>
      </div>
    </div>

    <!-- KPI Stats -->
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card blue skeleton" style="height:130px;"></div>
      <div class="stat-card green skeleton" style="height:130px;"></div>
      <div class="stat-card yellow skeleton" style="height:130px;"></div>
      <div class="stat-card red skeleton" style="height:130px;"></div>
    </div>

    <!-- Ligne principale -->
    <div class="grid-2" style="margin-bottom:16px;">

      <!-- Batteries -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔋 État des Batteries</span>
          <a href="batteries.jsp" class="btn btn-ghost btn-sm">Voir tout →</a>
        </div>
        <div id="batteries-list">
          <div class="skeleton" style="height:72px;margin-bottom:10px;"></div>
          <div class="skeleton" style="height:72px;margin-bottom:10px;"></div>
        </div>
      </div>

      <!-- Demandes en attente -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚡ Demandes en Attente</span>
          <a href="demandes.jsp" class="btn btn-ghost btn-sm">Voir tout →</a>
        </div>
        <div id="demandes-list">
          <div class="skeleton" style="height:52px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:52px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:52px;margin-bottom:8px;"></div>
        </div>
      </div>
    </div>

    <!-- Foyers + Rapports -->
    <div class="grid-2">

      <div class="card">
        <div class="card-header">
          <span class="card-title">🏠 Foyers par Priorité</span>
          <a href="foyers.jsp" class="btn btn-ghost btn-sm">Gérer →</a>
        </div>
        <canvas id="chart-foyers" style="max-height:220px;"></canvas>
        <div id="foyers-summary" style="margin-top:14px;"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Derniers Rapports</span>
          <a href="rapports.jsp" class="btn btn-ghost btn-sm">Voir tout →</a>
        </div>
        <div id="rapports-list">
          <div class="skeleton" style="height:52px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:52px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:52px;margin-bottom:8px;"></div>
        </div>
      </div>
    </div>

  </main>

</div>
<div id="toast-container"></div>

<script src="js/app.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  Auth.guard();
  let chartFoyers = null;

  async function loadDashboard() {
    try {
      const [foyers, batteries, demandes, rapports] = await Promise.all([
        API.foyers.getAll(),
        API.batteries.getAll(),
        API.demandes.getAll(),
        API.rapports.getAll(),
      ]);

      renderStats(foyers, batteries, demandes, rapports);
      renderBatteries(batteries);
      renderDemandes(demandes.filter(d => !d.est_acceptee).slice(0, 5));
      renderFoyersChart(foyers);
      renderRapports(rapports.slice(0, 4));

      document.getElementById('last-refresh').textContent =
        'Mis à jour le ' + new Date().toLocaleTimeString('fr-FR');

      const badgeEl = document.getElementById('badge-demandes');
      if (badgeEl) {
        const pending = demandes.filter(d => !d.est_acceptee).length;
        badgeEl.textContent = pending;
        badgeEl.style.display = pending > 0 ? 'flex' : 'none';
      }
    } catch (err) {
      Toast.error('Erreur de chargement : ' + err.message);
    }
  }

  window.loadDashboard = loadDashboard;

  function renderStats(foyers, batteries, demandes, rapports) {
    const totalBatCap = batteries.reduce((s, b) => s + (b.capacite_totale || 0), 0);
    const totalBatAct = batteries.reduce((s, b) => s + (b.capacite_actuelle || 0), 0);
    const batPct = fmt.pct(totalBatAct, totalBatCap);
    const demandesEnCours = demandes.filter(d => !d.est_acceptee).length;
    const totalConsomm = rapports.reduce((s, r) => s + (r.consommation_totale || 0), 0);

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card blue fade-in">
        <div class="stat-icon blue">🔋</div>
        <div class="stat-value">${fmt.wh(totalBatAct)}</div>
        <div class="stat-label">Énergie stockée · ${batPct}% de ${fmt.wh(totalBatCap)}</div>
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
        <div class="stat-label">Rapports · ${fmt.kWh(totalConsomm)} total</div>
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
      const pct = fmt.pct(b.capacite_actuelle, b.capacite_totale);
      const cls = pct >= 60 ? 'high' : pct >= 30 ? 'medium' : pct >= 15 ? 'low' : 'critical';
      const criticalFlag = b.capacite_actuelle <= b.seuil_critique;
      return `
        <div style="margin-bottom:16px;">
          <div class="battery-label">
            <span style="font-weight:600;font-size:.84rem;">
              Batterie #${b.id}
              ${criticalFlag ? '<span class="badge badge-red" style="margin-left:6px;font-size:.65rem;">⚠ Critique</span>' : ''}
            </span>
            <span style="font-family:var(--mono);font-size:.8rem;font-weight:500;">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--c-text-3);margin-top:3px;">
            <span>Actuelle : ${fmt.wh(b.capacite_actuelle)}</span>
            <span>Seuil : ${fmt.wh(b.seuil_critique)}</span>
            <span>Max : ${fmt.wh(b.capacite_totale)}</span>
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
    const critMap = { CRITIQUE: 'badge-red', HAUTE: 'badge-yellow', NORMALE: 'badge-blue', FAIBLE: 'badge-green' };
    el.innerHTML = demandes.map(d => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--c-border);margin-bottom:6px;background:var(--c-surface-2);transition:background .15s;" onmouseover="this.style.background='var(--blue-50)'" onmouseout="this.style.background='var(--c-surface-2)'">
        <span class="badge ${critMap[d.niveau_criticite] || 'badge-gray'}">${d.niveau_criticite || '—'}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            Foyer : ${d.foyer_id?.substring(0, 8) || '—'}...
          </div>
          <div style="font-size:.72rem;color:var(--c-text-3);">${fmt.kWh(d.quantite_kwh)} · ${fmt.datetime(d.heure_souhaitee)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderFoyersChart(foyers) {
    const counts = { URGENTE: 0, HAUTE: 0, NORMALE: 0 };
    foyers.forEach(f => {
      if (counts[f.type_priorite] !== undefined) counts[f.type_priorite]++;
      else counts['NORMALE']++;
    });

    const ctx = document.getElementById('chart-foyers').getContext('2d');
    if (chartFoyers) chartFoyers.destroy();

    chartFoyers = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Urgente', 'Haute', 'Normale'],
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: '#334155',
              padding: 16,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }
            }
          },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.label} : ${ctx.parsed} foyer(s)` },
            backgroundColor: '#ffffff',
            titleColor: '#0f172a',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 10
          }
        },
        cutout: '70%'
      }
    });

    document.getElementById('foyers-summary').innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        ${Object.entries(counts).map(([k, v]) => `
          <div style="text-align:center;padding:8px 14px;background:var(--c-surface-2);border-radius:var(--radius-sm);border:1px solid var(--c-border);">
            <div style="font-weight:800;font-size:1.1rem;font-family:var(--mono);">${v}</div>
            <div style="font-size:.68rem;color:var(--c-text-3);font-weight:600;letter-spacing:.5px;text-transform:uppercase;">${k}</div>
          </div>`).join('')}
        <div style="text-align:center;padding:8px 14px;background:var(--blue-50);border-radius:var(--radius-sm);border:1px solid var(--blue-200);">
          <div style="font-weight:800;font-size:1.1rem;font-family:var(--mono);color:var(--blue-700);">${foyers.length}</div>
          <div style="font-size:.68rem;color:var(--blue-500);font-weight:600;letter-spacing:.5px;text-transform:uppercase;">TOTAL</div>
        </div>
      </div>`;
  }

  function renderRapports(rapports) {
    const el = document.getElementById('rapports-list');
    if (!rapports.length) {
      el.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="empty-icon">📋</div><div class="empty-title">Aucun rapport</div></div>';
      return;
    }
    el.innerHTML = rapports.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--c-border);border-radius:var(--radius-sm);margin-bottom:6px;background:var(--c-surface-2);transition:background .15s;" onmouseover="this.style.background='var(--blue-50)'" onmouseout="this.style.background='var(--c-surface-2)'">
        <div>
          <div style="font-size:.8rem;font-weight:600;">${r.id?.substring(0, 12) || '—'}...</div>
          <div style="font-size:.72rem;color:var(--c-text-3);">Conso : ${fmt.kWh(r.consommation_totale)}</div>
        </div>
        <span class="badge badge-blue">${fmt.wh(Math.abs((r.batterie_fin || 0) - (r.batterie_debut || 0)))}</span>
      </div>`).join('');
  }

  loadDashboard();
  setInterval(loadDashboard, 30000);
});
</script>
</body>
</html>
