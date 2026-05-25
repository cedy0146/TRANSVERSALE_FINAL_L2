%>
<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">🔋 Gestion des Batteries</h1>
        <p class="page-subtitle">Surveillance et maintenance des stockages d'énergie</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="loadBatteries()">↻ Actualiser</button>
        <button class="btn btn-primary" onclick="Modal.open('modal-add-batterie')">+ Nouvelle Batterie</button>
      </div>
    </div>

    <!-- Vue globale batteries -->
    <div id="batteries-overview" class="grid-auto" style="margin-bottom:24px;"></div>

    <!-- Tableau détaillé -->
    <div class="card" style="padding:0;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--c-border);display:flex;justify-content:space-between;align-items:center;">
        <span class="card-title">Détail des Batteries</span>
        <span id="bat-count" class="chip"></span>
      </div>
      <div class="table-wrapper" style="border:none;border-radius:0 0 var(--radius) var(--radius);">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Niveau actuel</th>
              <th>Capacité Totale</th>
              <th>Seuil Critique</th>
              <th>Historique</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="batteries-tbody">
            <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--c-text-3);">
              <span class="spin">⟳</span> Chargement...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

</div>
<div id="toast-container"></div>

<!-- MODAL Ajouter -->
<div class="modal-overlay hidden" id="modal-add-batterie">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">🔋 Nouvelle Batterie</h3>
      <span class="modal-close" onclick="Modal.close('modal-add-batterie')">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Capacité totale (Wh) *</label>
          <input type="number" class="form-control" id="add-cap-total" placeholder="Ex: 10000" min="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Capacité actuelle (Wh) *</label>
          <input type="number" class="form-control" id="add-cap-actuelle" placeholder="Ex: 7500" min="0" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Seuil critique (Wh) *</label>
        <input type="number" class="form-control" id="add-seuil" placeholder="Ex: 1000" min="0" required>
        <small style="color:var(--c-text-3);font-size:.72rem;margin-top:4px;display:block;">
          En dessous de ce seuil, une alerte sera déclenchée
        </small>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-add-batterie')">Annuler</button>
      <button class="btn btn-primary" id="btn-add-bat" onclick="handleAddBatterie()">Créer</button>
    </div>
  </div>
</div>

<!-- MODAL Modifier -->
<div class="modal-overlay hidden" id="modal-edit-batterie">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">✏️ Modifier la Batterie</h3>
      <span class="modal-close" onclick="Modal.close('modal-edit-batterie')">✕</span>
    </div>
    <div class="modal-body">
      <input type="hidden" id="edit-bat-id">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Capacité totale (Wh) *</label>
          <input type="number" class="form-control" id="edit-cap-total" min="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Capacité actuelle (Wh) *</label>
          <input type="number" class="form-control" id="edit-cap-actuelle" min="0" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Seuil critique (Wh)</label>
        <input type="number" class="form-control" id="edit-seuil" min="0">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-edit-batterie')">Annuler</button>
      <button class="btn btn-primary" id="btn-update-bat" onclick="handleEditBatterie()">Enregistrer</button>
    </div>
  </div>
</div>

<script src="js/app.js"></script>
<script>
Auth.guard();

async function loadBatteries() {
  try {
    const batteries = await API.batteries.getAll();
    renderOverview(batteries);
    renderTable(batteries);
    document.getElementById('bat-count').textContent = batteries.length + ' batterie(s)';
  } catch (err) {
    Toast.error('Erreur: ' + err.message);
  }
}

function renderOverview(batteries) {
  const el = document.getElementById('batteries-overview');
  if (!batteries.length) { el.innerHTML = ''; return; }

  el.innerHTML = batteries.map(b => {
    const pct = Math.round((b.capacite_actuelle / b.capacite_totale) * 100);
    const cls = pct >= 60 ? 'high' : pct >= 30 ? 'medium' : pct >= 15 ? 'low' : 'critical';
    const isCritical = b.capacite_actuelle <= b.seuil_critique;
    const accent = cls === 'high' ? '#10b981' : cls === 'medium' ? '#3b82f6' : cls === 'low' ? '#f59e0b' : '#ef4444';
    return `
      <div class="card" style="position:relative;overflow:hidden;">
        ${isCritical ? '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:#ef4444;"></div>' : ''}
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
          <div>
            <div style="font-weight:700;font-size:.95rem;margin-bottom:4px;">Batterie #${b.id}</div>
            ${isCritical
              ? '<span class="badge badge-red">⚠ Critique</span>'
              : `<span class="badge ${cls === 'high' ? 'badge-green' : cls === 'medium' ? 'badge-amber' : 'badge-yellow'}">Niveau ${pct}%</span>`
            }
          </div>
          <div style="font-family:var(--mono);font-size:1.8rem;font-weight:800;color:${accent};line-height:1;">
            ${pct}<span style="font-size:.9rem;">%</span>
          </div>
        </div>
        <div class="progress-bar" style="height:8px;margin-bottom:12px;">
          <div class="progress-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;">
          <div style="background:var(--c-surface-2);padding:6px;border-radius:var(--radius-xs);border:1px solid var(--c-border);">
            <div style="font-size:.65rem;color:var(--c-text-3);font-weight:700;letter-spacing:.5px;text-transform:uppercase;">Actuelle</div>
            <div style="font-size:.78rem;font-weight:600;font-family:var(--mono);margin-top:2px;">${fmt.wh(b.capacite_actuelle)}</div>
          </div>
          <div style="background:var(--c-surface-2);padding:6px;border-radius:var(--radius-xs);border:1px solid var(--c-border);">
            <div style="font-size:.65rem;color:var(--c-text-3);font-weight:700;letter-spacing:.5px;text-transform:uppercase;">Totale</div>
            <div style="font-size:.78rem;font-weight:600;font-family:var(--mono);margin-top:2px;">${fmt.wh(b.capacite_totale)}</div>
          </div>
          <div style="background:var(--c-surface-2);padding:6px;border-radius:var(--radius-xs);border:1px solid var(--c-border);">
            <div style="font-size:.65rem;color:var(--c-text-3);font-weight:700;letter-spacing:.5px;text-transform:uppercase;">Seuil</div>
            <div style="font-size:.78rem;font-weight:600;font-family:var(--mono);margin-top:2px;">${fmt.wh(b.seuil_critique)}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderTable(batteries) {
  const tbody = document.getElementById('batteries-tbody');
  if (!batteries.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
      <div class="empty-icon">🔋</div>
      <div class="empty-title">Aucune batterie enregistrée</div>
      <div class="empty-message">Ajoutez une batterie pour commencer</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = batteries.map(b => {
    const pct = Math.round((b.capacite_actuelle / b.capacite_totale) * 100);
    const cls = pct >= 60 ? 'high' : pct >= 30 ? 'medium' : pct >= 15 ? 'low' : 'critical';
    const isCrit = b.capacite_actuelle <= b.seuil_critique;
    const histo = (b.historique || []).slice(-3).map(h => typeof h === 'object' ? JSON.stringify(h) : h).join(', ') || '—';
    return `
      <tr>
        <td><span style="font-family:var(--mono);font-size:.8rem;font-weight:600;">#${b.id}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;min-width:160px;">
            <div class="progress-bar" style="flex:1;margin:0;">
              <div class="progress-fill ${cls}" style="width:${pct}%"></div>
            </div>
            <span style="font-family:var(--mono);font-size:.78rem;min-width:36px;font-weight:600;">${pct}%</span>
          </div>
          <div style="font-size:.72rem;color:var(--c-text-3);margin-top:2px;">${fmt.wh(b.capacite_actuelle)}</div>
        </td>
        <td style="font-family:var(--mono);font-size:.82rem;">${fmt.wh(b.capacite_totale)}</td>
        <td style="font-family:var(--mono);font-size:.82rem;">${fmt.wh(b.seuil_critique)}</td>
        <td style="font-size:.72rem;color:var(--c-text-3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${histo}</td>
        <td>${isCrit
          ? '<span class="badge badge-red">⚠ Critique</span>'
          : cls === 'high'
            ? '<span class="badge badge-green">✓ Normal</span>'
            : '<span class="badge badge-yellow">⚡ Faible</span>'
        }</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="openEditBat(${b.id})">✏</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBat(${b.id})">🗑</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function handleAddBatterie() {
  const capTotal    = parseFloat(document.getElementById('add-cap-total').value);
  const capActuelle = parseFloat(document.getElementById('add-cap-actuelle').value);
  const seuil       = parseFloat(document.getElementById('add-seuil').value);
  if (isNaN(capTotal) || isNaN(capActuelle) || isNaN(seuil)) { Toast.warning('Veuillez remplir tous les champs.'); return; }
  if (capActuelle > capTotal) { Toast.warning('La capacité actuelle ne peut pas dépasser la totale.'); return; }
  setLoading('btn-add-bat', true);
  try {
    await API.batteries.create({ capacite_totale: capTotal, capacite_actuelle: capActuelle, seuil_critique: seuil });
    Toast.success('Batterie créée !');
    Modal.close('modal-add-batterie');
    ['add-cap-total','add-cap-actuelle','add-seuil'].forEach(id => document.getElementById(id).value = '');
    await loadBatteries();
  } catch (err) { Toast.error(err.message); }
  finally { setLoading('btn-add-bat', false); }
}

async function openEditBat(id) {
  try {
    const b = await API.batteries.getById(id);
    document.getElementById('edit-bat-id').value      = b.id;
    document.getElementById('edit-cap-total').value   = b.capacite_totale;
    document.getElementById('edit-cap-actuelle').value = b.capacite_actuelle;
    document.getElementById('edit-seuil').value       = b.seuil_critique;
    Modal.open('modal-edit-batterie');
  } catch (err) { Toast.error(err.message); }
}

async function handleEditBatterie() {
  const id          = document.getElementById('edit-bat-id').value;
  const capTotal    = parseFloat(document.getElementById('edit-cap-total').value);
  const capActuelle = parseFloat(document.getElementById('edit-cap-actuelle').value);
  const seuil       = parseFloat(document.getElementById('edit-seuil').value);
  if (capActuelle > capTotal) { Toast.warning('La capacité actuelle ne peut pas dépasser la totale.'); return; }
  setLoading('btn-update-bat', true);
  try {
    await API.batteries.update(id, { capacite_totale: capTotal, capacite_actuelle: capActuelle, seuil_critique: seuil });
    Toast.success('Batterie mise à jour !');
    Modal.close('modal-edit-batterie');
    await loadBatteries();
  } catch (err) { Toast.error(err.message); }
  finally { setLoading('btn-update-bat', false); }
}

function deleteBat(id) {
  confirmDelete('Supprimer la batterie #' + id + ' ?', async () => {
    try {
      await API.batteries.remove(id);
      Toast.success('Batterie supprimée.');
      await loadBatteries();
    } catch (err) { Toast.error(err.message); }
  });
}

loadBatteries();
setInterval(loadBatteries, 15000);
</script>
</body>
</html>
