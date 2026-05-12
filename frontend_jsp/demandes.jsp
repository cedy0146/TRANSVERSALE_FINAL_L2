<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>
<jsp:param name="pageTitle" value="Demandes d'Énergie"/>
<jsp:param name="activePage" value="demandes"/>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">⚡ Demandes d'Énergie</h1>
        <p class="page-subtitle">Gestion des demandes de consommation des foyers</p>
      </div>
      <div class="page-actions">
        <select class="form-control btn-sm" id="filter-criticite" onchange="applyFilters()" style="width:150px;">
          <option value="">Toutes criticités</option>
          <option value="CRITIQUE">🔴 Critique</option>
          <option value="HAUTE">🟡 Haute</option>
          <option value="NORMALE">🔵 Normale</option>
          <option value="FAIBLE">🟢 Faible</option>
        </select>
        <select class="form-control btn-sm" id="filter-statut" onchange="applyFilters()" style="width:150px;">
          <option value="">Tous statuts</option>
          <option value="0">⏳ En attente</option>
          <option value="1">✅ Acceptées</option>
        </select>
        <button class="btn btn-primary" onclick="Modal.open('modal-add-demande')">+ Nouvelle Demande</button>
      </div>
    </div>

    <!-- Résumé rapide -->
    <div class="stats-grid" id="demandes-stats" style="margin-bottom:20px;"></div>

    <!-- Tableau -->
    <div class="card" style="padding:0;">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Foyer</th>
              <th>Quantité (kWh)</th>
              <th>Heure souhaitée</th>
              <th>Criticité</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="demandes-tbody">
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div id="demandes-count" style="text-align:right;margin-top:8px;font-size:0.8rem;color:var(--text-muted);"></div>
  </main>

</div>
<div id="toast-container"></div>

<!-- MODAL Nouvelle Demande -->
<div class="modal-overlay hidden" id="modal-add-demande">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">⚡ Nouvelle Demande d'Énergie</h3>
      <span class="modal-close" onclick="Modal.close('modal-add-demande')">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Foyer demandeur *</label>
        <select class="form-control" id="add-foyer-id" required>
          <option value="">— Sélectionner un foyer —</option>
        </select>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Quantité (kWh) *</label>
          <input type="number" class="form-control" id="add-quantite" placeholder="Ex: 5.5" step="0.1" min="0.1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Criticité</label>
          <select class="form-control" id="add-criticite">
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="CRITIQUE">Critique</option>
            <option value="FAIBLE">Faible</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Heure souhaitée *</label>
        <input type="datetime-local" class="form-control" id="add-heure" required>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-add-demande')">Annuler</button>
      <button class="btn btn-primary" id="btn-add-demande" onclick="handleAddDemande()">Soumettre la Demande</button>
    </div>
  </div>
</div>

<!-- MODAL Modifier Demande -->
<div class="modal-overlay hidden" id="modal-edit-demande">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">✏️ Modifier la Demande</h3>
      <span class="modal-close" onclick="Modal.close('modal-edit-demande')">✕</span>
    </div>
    <div class="modal-body">
      <input type="hidden" id="edit-demande-id">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Quantité (kWh)</label>
          <input type="number" class="form-control" id="edit-quantite" step="0.1" min="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Criticité</label>
          <select class="form-control" id="edit-criticite">
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="CRITIQUE">Critique</option>
            <option value="FAIBLE">Faible</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Heure souhaitée</label>
        <input type="datetime-local" class="form-control" id="edit-heure">
      </div>
      <div class="form-group">
        <label class="form-label">Statut</label>
        <select class="form-control" id="edit-acceptee">
          <option value="0">⏳ En attente</option>
          <option value="1">✅ Acceptée</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-edit-demande')">Annuler</button>
      <button class="btn btn-primary" id="btn-update-demande" onclick="handleEditDemande()">Enregistrer</button>
    </div>
  </div>
</div>

<script src="js/app.js"></script>
<script>
Auth.guard();

let allDemandes = [];

const critColors = { CRITIQUE: 'red', HAUTE: 'yellow', NORMALE: 'blue', FAIBLE: 'green' };

async function loadDemandes() {
  try {
    allDemandes = await API.demandes.getAll();
    renderStats(allDemandes);
    applyFilters();
    // Charge les foyers pour le formulaire
    const foyers = await API.foyers.getAll();
    const sel = document.getElementById('add-foyer-id');
    sel.innerHTML = '<option value="">— Sélectionner un foyer —</option>' +
      foyers.map(f => `<option value="${f.id}">${escHtml(f.nom)} (${f.type_priorite})</option>`).join('');
  } catch (err) {
    Toast.error('Erreur: ' + err.message);
  }
}

function renderStats(demandes) {
  const en_attente = demandes.filter(d => !d.est_acceptee).length;
  const acceptees  = demandes.filter(d => d.est_acceptee).length;
  const critiques  = demandes.filter(d => d.niveau_criticite === 'CRITIQUE').length;
  const totalKwh   = demandes.reduce((s, d) => s + (d.quantite_kwh || 0), 0);

  document.getElementById('demandes-stats').innerHTML = `
    <div class="stat-card yellow fade-in">
      <div class="stat-icon yellow">⏳</div>
      <div class="stat-value">${en_attente}</div>
      <div class="stat-label">En attente</div>
    </div>
    <div class="stat-card green fade-in">
      <div class="stat-icon green">✅</div>
      <div class="stat-value">${acceptees}</div>
      <div class="stat-label">Acceptées</div>
    </div>
    <div class="stat-card red fade-in">
      <div class="stat-icon red">🔴</div>
      <div class="stat-value">${critiques}</div>
      <div class="stat-label">Critiques</div>
    </div>
    <div class="stat-card blue fade-in">
      <div class="stat-icon blue">⚡</div>
      <div class="stat-value">${fmt.kWh(totalKwh)}</div>
      <div class="stat-label">Total demandé</div>
    </div>
  `;
}

function applyFilters() {
  const criticite = document.getElementById('filter-criticite').value;
  const statut    = document.getElementById('filter-statut').value;

  let filtered = allDemandes;
  if (criticite) filtered = filtered.filter(d => d.niveau_criticite === criticite);
  if (statut !== '') filtered = filtered.filter(d => String(d.est_acceptee ? '1' : '0') === statut);

  renderTable(filtered);
  document.getElementById('demandes-count').textContent = filtered.length + ' demande(s)';
  document.getElementById('badge-demandes').textContent = allDemandes.filter(d => !d.est_acceptee).length;
}

function renderTable(demandes) {
  const tbody = document.getElementById('demandes-tbody');
  if (!demandes.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-title">Aucune demande</div>
      <div class="empty-message">Aucune demande ne correspond aux filtres</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = demandes.map(d => `
    <tr class="fade-in">
      <td>
        <span style="font-family:var(--font-mono);font-size:0.8rem;">${d.foyer_id?.substring(0, 12) || '—'}...</span>
      </td>
      <td>
        <span style="font-family:var(--font-mono);font-weight:600;font-size:1rem;">${fmt.kWh(d.quantite_kwh)}</span>
      </td>
      <td style="font-size:0.8rem;">${fmt.datetime(d.heure_souhaitee)}</td>
      <td>
        <span class="badge badge-${critColors[d.niveau_criticite] || 'gray'}">${d.niveau_criticite || '—'}</span>
      </td>
      <td>
        ${d.est_acceptee
          ? '<span class="badge badge-green">✅ Acceptée</span>'
          : '<span class="badge badge-yellow">⏳ En attente</span>'}
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="openEdit('${d.id}')">✏️</button>
          ${!d.est_acceptee ? `<button class="btn btn-success btn-sm" onclick="acceptDemande('${d.id}')">✅</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteDemande('${d.id}')">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

async function handleAddDemande() {
  const foyerId   = document.getElementById('add-foyer-id').value;
  const quantite  = parseFloat(document.getElementById('add-quantite').value);
  const heure     = document.getElementById('add-heure').value;
  const criticite = document.getElementById('add-criticite').value;

  if (!foyerId || !quantite || !heure) {
    Toast.warning('Foyer, quantité et heure sont obligatoires.');
    return;
  }

  setLoading('btn-add-demande', true);
  try {
    await API.demandes.create({
      foyer_id: foyerId,
      quantite_kwh: quantite,
      heure_souhaitee: heure,
      niveau_criticite: criticite,
      est_acceptee: false
    });
    Toast.success('Demande soumise avec succès !');
    Modal.close('modal-add-demande');
    await loadDemandes();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading('btn-add-demande', false);
  }
}

async function openEdit(id) {
  try {
    const d = allDemandes.find(x => x.id === id);
    if (!d) return;
    document.getElementById('edit-demande-id').value = d.id;
    document.getElementById('edit-quantite').value   = d.quantite_kwh;
    document.getElementById('edit-criticite').value  = d.niveau_criticite || 'NORMALE';
    document.getElementById('edit-heure').value      = d.heure_souhaitee?.substring(0, 16) || '';
    document.getElementById('edit-acceptee').value   = d.est_acceptee ? '1' : '0';
    Modal.open('modal-edit-demande');
  } catch (err) {
    Toast.error(err.message);
  }
}

async function handleEditDemande() {
  const id       = document.getElementById('edit-demande-id').value;
  const quantite = parseFloat(document.getElementById('edit-quantite').value);
  const heure    = document.getElementById('edit-heure').value;
  const criticite= document.getElementById('edit-criticite').value;
  const acceptee = document.getElementById('edit-acceptee').value === '1';

  setLoading('btn-update-demande', true);
  try {
    await API.demandes.update(id, {
      quantite_kwh: quantite,
      heure_souhaitee: heure,
      niveau_criticite: criticite,
      est_acceptee: acceptee
    });
    Toast.success('Demande mise à jour !');
    Modal.close('modal-edit-demande');
    await loadDemandes();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading('btn-update-demande', false);
  }
}

async function acceptDemande(id) {
  try {
    await API.demandes.update(id, { est_acceptee: true });
    Toast.success('Demande acceptée !');
    await loadDemandes();
  } catch (err) {
    Toast.error(err.message);
  }
}

function deleteDemande(id) {
  confirmDelete('Supprimer cette demande ?', async () => {
    try {
      await API.demandes.remove(id);
      Toast.success('Demande supprimée.');
      await loadDemandes();
    } catch (err) {
      Toast.error(err.message);
    }
  });
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Pré-remplir heure courante
document.getElementById('add-heure').value = new Date().toISOString().substring(0, 16);

loadDemandes();
</script>
</body>
</html>
