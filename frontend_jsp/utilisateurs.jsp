<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/header.jspf" %>
<jsp:param name="pageTitle" value="Utilisateurs"/>
<jsp:param name="activePage" value="utilisateurs"/>

  <main class="main-content">

    <div class="page-header">
      <div>
        <h1 class="page-title">👥 Gestion des Utilisateurs</h1>
        <p class="page-subtitle">Comptes et rôles du système EclectriDB</p>
      </div>
      <div class="page-actions">
        <input type="text" class="form-control btn-sm" id="search-user"
               placeholder="🔍 Rechercher..." style="width:200px;"
               oninput="filterUsers(this.value)">
        <button class="btn btn-primary" onclick="Modal.open('modal-add-user')">+ Nouvel Utilisateur</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" id="users-stats" style="margin-bottom:20px;"></div>

    <!-- Tableau -->
    <div class="card" style="padding:0;">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Foyer associé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-tbody">
            <tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">
              <span class="spin" style="display:inline-block">⟳</span> Chargement...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div id="users-count" style="text-align:right;margin-top:8px;font-size:0.8rem;color:var(--text-muted);"></div>
  </main>

</div>
<div id="toast-container"></div>

<!-- MODAL Ajouter Utilisateur -->
<div class="modal-overlay hidden" id="modal-add-user">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">👤 Nouvel Utilisateur</h3>
      <span class="modal-close" onclick="Modal.close('modal-add-user')">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nom d'utilisateur *</label>
        <input type="text" class="form-control" id="add-user-username" placeholder="Identifiant unique" required>
      </div>
      <div class="form-group">
        <label class="form-label">Mot de passe *</label>
        <input type="password" class="form-control" id="add-user-password" placeholder="Minimum 8 caractères" required>
        <small style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;display:block;">
          Doit contenir : majuscule, minuscule, chiffre et caractère spécial (!@#$%...)
        </small>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Rôle</label>
          <select class="form-control" id="add-user-role">
            <option value="VILLAGEOIS">Villageois</option>
            <option value="RESPONSABLE">Responsable</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Foyer associé (optionnel)</label>
          <select class="form-control" id="add-user-foyer">
            <option value="">— Aucun —</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close('modal-add-user')">Annuler</button>
      <button class="btn btn-primary" id="btn-add-user" onclick="handleAddUser()">Créer</button>
    </div>
  </div>
</div>

<script src="js/app.js"></script>
<script>
Auth.guard();
let allUsers = [];

async function loadUsers() {
  try {
    const [users, foyers] = await Promise.all([
      API.users.getAll(),
      API.foyers.getAll()
    ]);
    allUsers = users;

    // Charger foyers dans le select
    const sel = document.getElementById('add-user-foyer');
    sel.innerHTML = '<option value="">— Aucun —</option>' +
      foyers.map(f => `<option value="${f.id}">${escHtml(f.nom)}</option>`).join('');

    renderStats(users);
    renderTable(users);
    document.getElementById('users-count').textContent = users.length + ' utilisateur(s)';
  } catch (err) {
    Toast.error('Erreur: ' + err.message);
  }
}

function renderStats(users) {
  const responsables = users.filter(u => u.role === 'RESPONSABLE').length;
  const villageois   = users.filter(u => u.role === 'VILLAGEOIS').length;
  const avecFoyer    = users.filter(u => u.foyer_id).length;

  document.getElementById('users-stats').innerHTML = `
    <div class="stat-card blue fade-in">
      <div class="stat-icon blue">👥</div>
      <div class="stat-value">${users.length}</div>
      <div class="stat-label">Total utilisateurs</div>
    </div>
    <div class="stat-card red fade-in">
      <div class="stat-icon red">🔑</div>
      <div class="stat-value">${responsables}</div>
      <div class="stat-label">Responsables</div>
    </div>
    <div class="stat-card green fade-in">
      <div class="stat-icon green">🏠</div>
      <div class="stat-value">${villageois}</div>
      <div class="stat-label">Villageois</div>
    </div>
    <div class="stat-card yellow fade-in">
      <div class="stat-icon yellow">🔗</div>
      <div class="stat-value">${avecFoyer}</div>
      <div class="stat-label">Liés à un foyer</div>
    </div>`;
}

function renderTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">
      <div class="empty-icon">👥</div>
      <div class="empty-title">Aucun utilisateur</div>
      <div class="empty-message">Créez le premier compte utilisateur.</div>
    </div></td></tr>`;
    return;
  }

  const currentUser = Auth.getUser();

  tbody.innerHTML = users.map(u => {
    const isMe = currentUser && currentUser.id === u.id;
    return `
      <tr class="fade-in">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent-blue),var(--accent-purple));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">
              ${(u.username || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style="font-weight:600;">${escHtml(u.username)}
                ${isMe ? '<span class="badge badge-blue" style="margin-left:6px;">Vous</span>' : ''}
              </div>
              <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">${u.id?.substring(0, 16) || '—'}...</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${u.role === 'RESPONSABLE' ? 'badge-red' : 'badge-green'}">
            ${u.role === 'RESPONSABLE' ? '🔑 Responsable' : '🏠 Villageois'}
          </span>
        </td>
        <td>
          ${u.foyer_id
            ? `<span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--accent-blue);">${u.foyer_id.substring(0, 16)}...</span>`
            : '<span style="color:var(--text-muted);font-size:0.8rem;">—</span>'}
        </td>
        <td>
          ${!isMe
            ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}', '${escHtml(u.username)}')">🗑 Supprimer</button>`
            : '<span style="color:var(--text-muted);font-size:0.8rem;">Action non disponible</span>'}
        </td>
      </tr>`;
  }).join('');
}

function filterUsers(search) {
  const s = search.toLowerCase();
  renderTable(allUsers.filter(u =>
    u.username?.toLowerCase().includes(s) ||
    u.role?.toLowerCase().includes(s) ||
    u.id?.toLowerCase().includes(s)
  ));
}

async function handleAddUser() {
  const username = document.getElementById('add-user-username').value.trim();
  const password = document.getElementById('add-user-password').value;
  const role     = document.getElementById('add-user-role').value;
  const foyerId  = document.getElementById('add-user-foyer').value || null;

  if (!username || !password) {
    Toast.warning('Nom d\'utilisateur et mot de passe obligatoires.');
    return;
  }

  setLoading('btn-add-user', true);
  try {
    await API.auth.register({ username, password, role, foyer_id: foyerId });
    Toast.success('Utilisateur créé avec succès !');
    Modal.close('modal-add-user');
    document.getElementById('add-user-username').value = '';
    document.getElementById('add-user-password').value = '';
    await loadUsers();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading('btn-add-user', false);
  }
}

function deleteUser(id, username) {
  const currentUser = Auth.getUser();
  if (currentUser && currentUser.id === id) {
    Toast.warning('Vous ne pouvez pas supprimer votre propre compte.');
    return;
  }
  confirmDelete(`Supprimer l'utilisateur "${username}" ?`, async () => {
    try {
      await API.users.remove(id);
      Toast.success('Utilisateur supprimé.');
      await loadUsers();
    } catch (err) {
      Toast.error(err.message);
    }
  });
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadUsers();
</script>
</body>
</html>
