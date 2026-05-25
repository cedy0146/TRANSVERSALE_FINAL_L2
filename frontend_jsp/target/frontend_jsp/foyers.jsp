%>
<%@ page isELIgnored="true" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">🏠 Gestion des Foyers</h1>
        <p class="page-subtitle">Enregistrement et suivi des foyers du village</p>
      </div>
      <div class="page-actions">
        <input type="text" class="form-control btn-sm" id="search-foyer"
               placeholder="🔍 Rechercher..." style="width:200px;"
               oninput="filterFoyers(this.value)">
        <button class="btn btn-primary" onclick="Modal.open('modal-add-foyer')">
          + Nouveau Foyer
        </button>
      </div>
    </div>

    <!-- Filtres priorité -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <span style="font-size:0.8rem;color:var(--c-text-2);align-self:center;">Filtrer:</span>
      <button class="btn btn-outline btn-sm filter-btn active" onclick="filterByPriority('ALL', this)">Tous</button>
      <button class="btn btn-outline btn-sm filter-btn" onclick="filterByPriority('URGENTE', this)">🔴 Urgente</button>
      <button class="btn btn-outline btn-sm filter-btn" onclick="filterByPriority('HAUTE', this)">🟡 Haute</button>
      <button class="btn btn-outline btn-sm filter-btn" onclick="filterByPriority('NORMALE', this)">🔵 Normale</button>
    </div>

    <!-- Tableau -->
    <div class="card" style="padding:0;">
      <div class="table-wrapper">
        <table id="foyers-table">
          <thead>
            <tr>
              <th>Nom du Foyer</th>
              <th>Priorité</th>
              <th>J. sans Électricité</th>
              <th>Historique Conso.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="foyers-tbody">
            <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--c-text-3);">
              <span class="spin" style="display:inline-block;margin-right:8px;">⟳</span>Chargement...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div id="foyers-count" style="text-align:right;margin-top:8px;font-size:0.8rem;color:var(--c-text-3);"></div>

  </main>

</div>
<div id="toast-container"></div>

<!-- MODAL : Ajouter Foyer -->
<div class="modal-overlay hidden" id="modal-add-foyer">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">🏠 Nouveau Foyer</h3>
      <span class="modal-close" onclick="Modal.close('modal-add-foyer')">✕</span>
    </div>
    <div class="modal-body">
      <form id="form-add-foyer" onsubmit="handleAddFoyer(event)">
        <div class="form-group">
          <label class="form-label">Nom du foyer *</label>
          <input type="text" class="form-control" id="add-nom" placeholder="Ex: Famille Rakoto" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Type de priorité</label>
            <select class="form-control" id="add-priorite">
              <option value="NORMALE">Normale</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Jours sans électricité</label>
            <input type="number" class="form-control" id="add-jours" value="0" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Historique consommation (kWh, séparés par virgule)</label>
          <input type="text" class="form-control" id="add-historique"
                 placeholder="Ex: 5.2, 4.8, 6.1, 5.5">
          <small style="color:var(--c-text-3);font-size:0.75rem;margin-top:4px;display:block;">
            Valeurs en kWh pour les derniers jours
          </small>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-add-foyer')">Annuler</button>
      <button class="btn btn-primary" id="btn-submit-foyer" onclick="handleAddFoyer(event)">
        Créer le Foyer
      </button>
    </div>
  </div>
</div>

<!-- MODAL : Modifier Foyer -->
<div class="modal-overlay hidden" id="modal-edit-foyer">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">✏️ Modifier le Foyer</h3>
      <span class="modal-close" onclick="Modal.close('modal-edit-foyer')">✕</span>
    </div>
    <div class="modal-body">
      <input type="hidden" id="edit-id">
      <form id="form-edit-foyer" onsubmit="handleEditFoyer(event)">
        <div class="form-group">
          <label class="form-label">Nom du foyer *</label>
          <input type="text" class="form-control" id="edit-nom" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Type de priorité</label>
            <select class="form-control" id="edit-priorite">
              <option value="NORMALE">Normale</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Jours sans électricité</label>
            <input type="number" class="form-control" id="edit-jours" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Historique consommation (kWh)</label>
          <input type="text" class="form-control" id="edit-historique">
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-edit-foyer')">Annuler</button>
      <button class="btn btn-primary" id="btn-update-foyer" onclick="handleEditFoyer(event)">
        Enregistrer
      </button>
    </div>
  </div>
</div>

<script src="js/app.js"></script>
<script>
Auth.guard();
let allFoyers = [];
let currentFilter = 'ALL';

const priorityBadge = {
  URGENTE: '<span class="badge badge-red">🔴 Urgente</span>',
  HAUTE:   '<span class="badge badge-yellow">🟡 Haute</span>',
  NORMALE: '<span class="badge badge-blue">🔵 Normale</span>',
};

async function loadFoyers() {
  try {
    allFoyers = await API.foyers.getAll();
    renderTable(allFoyers);
  } catch (err) {
    Toast.error('Erreur chargement foyers: ' + err.message);
  }
}

function renderTable(data) {
  const tbody = document.getElementById('foyers-tbody');
  document.getElementById('foyers-count').textContent = `${data.length} foyer(s) affiché(s)`;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state"><div class="empty-icon">🏠</div>
      <div class="empty-title">Aucun foyer trouvé</div>
      <div class="empty-message">Créez le premier foyer en cliquant sur "Nouveau Foyer"</div>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(f => {
    const histo = Array.isArray(f.consommation_historique) ? f.consommation_historique : [];
    const histoStr = histo.length ? histo.map(v => v.toFixed(1)).join(', ') + ' kWh' : '<em style="color:var(--c-text-3);">Aucun</em>';
    return `
      <tr class="fade-in">
        <td>
          <div style="font-weight:600;">${escHtml(f.nom)}</div>
          <div style="font-size:0.75rem;color:var(--c-text-3);font-family:var(--mono);">${f.id?.substring(0, 16) || '—'}...</div>
        </td>
        <td>${priorityBadge[f.type_priorite] || priorityBadge.NORMALE}</td>
        <td>
          <span style="font-family:var(--mono);font-weight:600;color:${f.jours_sans_electricite > 7 ? 'var(--c-danger)' : 'var(--c-text)'}">
            ${f.jours_sans_electricite || 0}
          </span>
          <span style="color:var(--c-text-3);font-size:0.8rem;"> jours</span>
        </td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;">${histoStr}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="openEdit('${f.id}')">✏️ Modifier</button>
            <button class="btn btn-danger btn-sm" onclick="deleteFoyer('${f.id}', '${escHtml(f.nom)}')">🗑</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterFoyers(search) {
  const s = search.toLowerCase();
  const filtered = allFoyers.filter(f =>
    (currentFilter === 'ALL' || f.type_priorite === currentFilter) &&
    (f.nom?.toLowerCase().includes(s) || f.id?.toLowerCase().includes(s))
  );
  renderTable(filtered);
}

function filterByPriority(priority, btn) {
  currentFilter = priority;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.style.borderColor = '';
    b.style.color = '';
    b.classList.remove('btn-primary');
    b.classList.add('btn-outline');
  });
  btn.classList.add('btn-primary');
  btn.classList.remove('btn-outline');
  filterFoyers(document.getElementById('search-foyer').value);
}

async function handleAddFoyer(e) {
  e.preventDefault();
  const nom      = document.getElementById('add-nom').value.trim();
  const priorite = document.getElementById('add-priorite').value;
  const jours    = parseInt(document.getElementById('add-jours').value) || 0;
  const histoRaw = document.getElementById('add-historique').value;
  const histo    = histoRaw ? histoRaw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)) : [];

  if (!nom) { Toast.warning('Le nom du foyer est obligatoire.'); return; }

  setLoading('btn-submit-foyer', true);
  try {
    await API.foyers.create({ nom, type_priorite: priorite, jours_sans_electricite: jours, consommation_historique: histo });
    Toast.success('Foyer créé avec succès !');
    Modal.close('modal-add-foyer');
    document.getElementById('form-add-foyer').reset();
    await loadFoyers();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading('btn-submit-foyer', false);
  }
}

async function openEdit(id) {
  try {
    const f = await API.foyers.getById(id);
    document.getElementById('edit-id').value = f.id;
    document.getElementById('edit-nom').value = f.nom;
    document.getElementById('edit-priorite').value = f.type_priorite || 'NORMALE';
    document.getElementById('edit-jours').value = f.jours_sans_electricite || 0;
    document.getElementById('edit-historique').value =
      (f.consommation_historique || []).join(', ');
    Modal.open('modal-edit-foyer');
  } catch (err) {
    Toast.error('Erreur chargement foyer: ' + err.message);
  }
}

async function handleEditFoyer(e) {
  e.preventDefault();
  const id       = document.getElementById('edit-id').value;
  const nom      = document.getElementById('edit-nom').value.trim();
  const priorite = document.getElementById('edit-priorite').value;
  const jours    = parseInt(document.getElementById('edit-jours').value) || 0;
  const histoRaw = document.getElementById('edit-historique').value;
  const histo    = histoRaw ? histoRaw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)) : [];

  if (!nom) { Toast.warning('Le nom est obligatoire.'); return; }

  setLoading('btn-update-foyer', true);
  try {
    await API.foyers.update(id, { nom, type_priorite: priorite, jours_sans_electricite: jours, consommation_historique: histo });
    Toast.success('Foyer mis à jour !');
    Modal.close('modal-edit-foyer');
    await loadFoyers();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading('btn-update-foyer', false);
  }
}

function deleteFoyer(id, nom) {
  confirmDelete(`Supprimer le foyer "${nom}" ?`, async () => {
    try {
      await API.foyers.remove(id);
      Toast.success('Foyer supprimé.');
      await loadFoyers();
    } catch (err) {
      Toast.error(err.message);
    }
  });
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadFoyers();
</script>
</body>
</html>
