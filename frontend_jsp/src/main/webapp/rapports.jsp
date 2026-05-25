%>
<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">📋 Rapports</h1>
        <p class="page-subtitle">Historique des allocations et consommations</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadRapports()">🔄 Actualiser</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" id="rapports-stats" style="margin-bottom:20px;"></div>

    <!-- Tableau -->
    <div class="card" style="padding:0;">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID Rapport</th>
              <th>Consommation Totale</th>
              <th>Batterie Début</th>
              <th>Batterie Fin</th>
              <th>Variation</th>
              <th>Alertes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="rapports-tbody">
            <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--c-text-3);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div id="rapport-count" style="text-align:right;margin-top:8px;font-size:0.8rem;color:var(--c-text-3);"></div>
  </main>

<!-- MODAL Détail Rapport -->
<div class="modal-overlay hidden" id="modal-detail-rapport">
  <div class="modal" style="max-width:640px;">
    <div class="modal-header">
      <h3 class="modal-title">📋 Détail du Rapport</h3>
      <span class="modal-close" onclick="Modal.close('modal-detail-rapport')">✕</span>
    </div>
    <div class="modal-body" id="rapport-detail-body">Chargement...</div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-detail-rapport')">Fermer</button>
    </div>
  </div>
</div>

</div>
<div id="toast-container"></div>
<script src="js/app.js"></script>
<script>
Auth.guard();

async function loadRapports() {
  try {
    const rapports = await API.rapports.getAll();
    renderStats(rapports);
    renderTable(rapports);
    document.getElementById('rapport-count').textContent = rapports.length + ' rapport(s)';
  } catch (err) {
    Toast.error('Erreur: ' + err.message);
  }
}

function renderStats(rapports) {
  const totalConso = rapports.reduce((s, r) => s + (r.consommation_totale || 0), 0);
  const avgConso   = rapports.length ? totalConso / rapports.length : 0;
  const totalAlertes = rapports.reduce((s, r) => {
    const a = r.alertes;
    return s + (Array.isArray(a) ? a.length : (typeof a === 'string' ? JSON.parse(a||'[]').length : 0));
  }, 0);

  document.getElementById('rapports-stats').innerHTML = `
    <div class="stat-card blue fade-in">
      <div class="stat-icon blue">📋</div>
      <div class="stat-value">${rapports.length}</div>
      <div class="stat-label">Total Rapports</div>
    </div>
    <div class="stat-card green fade-in">
      <div class="stat-icon green">⚡</div>
      <div class="stat-value">${fmt.kWh(totalConso)}</div>
      <div class="stat-label">Consommation cumulée</div>
    </div>
    <div class="stat-card yellow fade-in">
      <div class="stat-icon yellow">📊</div>
      <div class="stat-value">${fmt.kWh(avgConso)}</div>
      <div class="stat-label">Consommation moyenne</div>
    </div>
    <div class="stat-card red fade-in">
      <div class="stat-icon red">⚠️</div>
      <div class="stat-value">${totalAlertes}</div>
      <div class="stat-label">Alertes enregistrées</div>
    </div>`;
}

function renderTable(rapports) {
  const tbody = document.getElementById('rapports-tbody');
  if (!rapports.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">Aucun rapport</div>
      <div class="empty-message">Les rapports sont générés automatiquement lors des allocations.</div>
    </div></td></tr>`;
    return;
  }
  tbody.innerHTML = rapports.map(r => {
    const alertes = Array.isArray(r.alertes) ? r.alertes : (typeof r.alertes === 'string' ? JSON.parse(r.alertes || '[]') : []);
    const variation = r.batterie_fin - r.batterie_debut;
    return `
      <tr class="fade-in">
        <td><span style="font-family:var(--mono);font-size:0.8rem;">${r.id?.substring(0, 14) || '—'}...</span></td>
        <td><span style="font-family:var(--mono);font-weight:600;">${fmt.kWh(r.consommation_totale)}</span></td>
        <td><span style="font-family:var(--mono);">${fmt.wh(r.batterie_debut)}</span></td>
        <td><span style="font-family:var(--mono);">${fmt.wh(r.batterie_fin)}</span></td>
        <td>
          <span class="badge ${variation >= 0 ? 'badge-green' : 'badge-red'}">
            ${variation >= 0 ? '+' : ''}${fmt.wh(variation)}
          </span>
        </td>
        <td>
          ${alertes.length
            ? `<span class="badge badge-yellow">⚠️ ${alertes.length} alerte(s)</span>`
            : '<span class="badge badge-green">✅ Aucune</span>'}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="voirDetail('${r.id}')">👁 Voir</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRapport('${r.id}')">🗑</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function voirDetail(id) {
  try {
    const r = await API.rapports.getById(id);
    const alertes = Array.isArray(r.alertes) ? r.alertes : (typeof r.alertes === 'string' ? JSON.parse(r.alertes || '[]') : []);
    document.getElementById('rapport-detail-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div style="background:var(--c-surface-2);padding:14px;border-radius:var(--radius-sm);">
          <div style="font-size:0.75rem;color:var(--c-text-3);">Consommation totale</div>
          <div style="font-size:1.4rem;font-weight:700;font-family:var(--mono);">${fmt.kWh(r.consommation_totale)}</div>
        </div>
        <div style="background:var(--c-surface-2);padding:14px;border-radius:var(--radius-sm);">
          <div style="font-size:0.75rem;color:var(--c-text-3);">Batterie début → fin</div>
          <div style="font-size:1rem;font-weight:700;font-family:var(--mono);">${fmt.wh(r.batterie_debut)} → ${fmt.wh(r.batterie_fin)}</div>
        </div>
      </div>
      <div>
        <div style="font-size:0.8rem;font-weight:600;color:var(--c-text-2);margin-bottom:8px;">ALERTES (${alertes.length})</div>
        ${alertes.length
          ? alertes.map(a => `<div class="alert alert-warning" style="margin-bottom:8px;"><span class="alert-icon">⚠️</span><div class="alert-body"><div class="alert-message">${typeof a === 'object' ? JSON.stringify(a) : a}</div></div></div>`).join('')
          : '<div class="badge badge-green">Aucune alerte</div>'}
      </div>
      <div style="margin-top:16px;">
        <div style="font-size:0.8rem;font-weight:600;color:var(--c-text-2);margin-bottom:6px;">ID RAPPORT</div>
        <code style="font-family:var(--mono);font-size:0.8rem;background:var(--c-surface-2);padding:8px;border-radius:var(--radius-sm);display:block;">${r.id}</code>
      </div>`;
    Modal.open('modal-detail-rapport');
  } catch (err) {
    Toast.error(err.message);
  }
}

function deleteRapport(id) {
  confirmDelete('Supprimer ce rapport définitivement ?', async () => {
    try {
      await API.rapports.remove(id);
      Toast.success('Rapport supprimé.');
      await loadRapports();
    } catch (err) {
      Toast.error(err.message);
    }
  });
}

loadRapports();
</script>
</body>
</html>
